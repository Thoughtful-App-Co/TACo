/**
 * O*NET Web Services API Proxy
 * Cloudflare Pages Function for /api/onet/*
 *
 * Proxies requests to the O*NET Web Services API, keeping the API key
 * server-side for security.
 *
 * Features:
 * - Comprehensive endpoint coverage (career search, details, interest profiler, etc.)
 * - Rate limiting (10 requests/minute per IP)
 * - Request validation
 * - CORS support
 * - Error handling with user-friendly messages
 * - Proper logging for debugging
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { onetLog } from '../lib/logger';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

// Cloudflare KV type declaration
declare const KVNamespace: {
  prototype: KVNamespace;
  new (): KVNamespace;
};

interface KVNamespace {
  get(key: string, options?: { type: 'text' }): Promise<string | null>;
  get(key: string, options: { type: 'json' }): Promise<unknown | null>;
  get(key: string, options: { type: 'arrayBuffer' }): Promise<ArrayBuffer | null>;
  get(key: string, options: { type: 'stream' }): Promise<ReadableStream | null>;
  put(
    key: string,
    value: string | ArrayBuffer | ReadableStream,
    options?: { expirationTtl?: number }
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
}

interface Env {
  ONET_API_KEY: string;
  RATE_LIMIT: KVNamespace;
}

interface RateLimitState {
  count: number;
  resetAt: number;
}

interface OnetErrorResponse {
  success: false;
  error: string;
  statusCode?: number;
}

interface OnetSuccessResponse<T = unknown> {
  success: true;
  data: T;
  rateLimit: {
    remaining: number;
    resetAt: string;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ONET_BASE_URL = 'https://services.onetcenter.org';
const RATE_LIMIT_WINDOW = 60; // 1 minute in seconds
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP

// =============================================================================
// CORS HEADERS
// =============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Checks and updates rate limit for an IP address
 * Uses Cloudflare KV for distributed rate limiting across edge locations
 */
async function checkRateLimit(
  ip: string,
  kv: KVNamespace
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const key = `ratelimit:onet:${ip}`;

  // Try to get existing rate limit state
  const stateJson = await kv.get(key);
  let state: RateLimitState | null = null;

  if (stateJson) {
    try {
      state = JSON.parse(stateJson);
    } catch {
      // Invalid JSON, treat as no state
      state = null;
    }
  }

  // Calculate reset time (start of next minute)
  const resetAt = Math.ceil(now / (RATE_LIMIT_WINDOW * 1000)) * (RATE_LIMIT_WINDOW * 1000);

  // Reset if we're past the reset time or no state exists
  if (!state || now >= state.resetAt) {
    state = { count: 0, resetAt };
  }

  const remaining = RATE_LIMIT_MAX - state.count;

  if (remaining <= 0) {
    return { allowed: false, remaining: 0, resetAt: state.resetAt };
  }

  // Increment count
  state.count++;
  const ttl = Math.ceil((state.resetAt - now) / 1000);
  await kv.put(key, JSON.stringify(state), { expirationTtl: ttl });

  return { allowed: true, remaining: remaining - 1, resetAt: state.resetAt };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Gets the client IP address from the request
 */
function getClientIp(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
    'unknown'
  );
}

/**
 * Creates a standardized error response
 */
function errorResponse(
  error: string,
  statusCode: number = 500,
  rateLimit?: { remaining: number; resetAt: number }
): Response {
  const body: OnetErrorResponse = {
    success: false,
    error,
    statusCode,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...corsHeaders,
  };

  if (rateLimit) {
    headers['X-RateLimit-Limit'] = RATE_LIMIT_MAX.toString();
    headers['X-RateLimit-Remaining'] = rateLimit.remaining.toString();
    headers['X-RateLimit-Reset'] = new Date(rateLimit.resetAt).toISOString();
  }

  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers,
  });
}

/**
 * Creates a standardized success response
 */
function successResponse<T>(data: T, rateLimit: { remaining: number; resetAt: number }): Response {
  const body: OnetSuccessResponse<T> = {
    success: true,
    data,
    rateLimit: {
      remaining: rateLimit.remaining,
      resetAt: new Date(rateLimit.resetAt).toISOString(),
    },
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
      ...corsHeaders,
    },
  });
}

/**
 * Makes a request to the O*NET API
 */
async function fetchFromOnet(
  endpoint: string,
  apiKey: string
): Promise<{ success: boolean; data?: unknown; error?: string; statusCode?: number }> {
  const url = `${ONET_BASE_URL}${endpoint}`;

  onetLog.info('Fetching:', url);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${btoa(`${apiKey}:`)}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      onetLog.error('API HTTP error:', response.status, response.statusText);

      // Handle specific error codes
      if (response.status === 401) {
        return {
          success: false,
          error: 'O*NET API authentication failed. Please contact support.',
          statusCode: 500, // Don't expose auth errors to client
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: 'Resource not found.',
          statusCode: 404,
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: 'O*NET API rate limit exceeded. Please try again later.',
          statusCode: 429,
        };
      }

      return {
        success: false,
        error: `O*NET API returned HTTP ${response.status}`,
        statusCode: response.status >= 500 ? 502 : response.status,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    onetLog.error('API fetch error:', error);
    return {
      success: false,
      error: 'Failed to connect to O*NET API. Please try again later.',
      statusCode: 502,
    };
  }
}

// =============================================================================
// ENDPOINT ROUTING
// =============================================================================

/**
 * Routes the request to the appropriate O*NET API endpoint
 */
function routeOnetRequest(pathname: string, searchParams: URLSearchParams): string | null {
  // Remove /api/onet prefix
  const path = pathname.replace(/^\/api\/onet/, '');

  // Career search: /api/onet/search?keyword=xxx
  if (path === '/search') {
    const keyword = searchParams.get('keyword');
    if (!keyword) return null;
    return `/ws/mnm/search?keyword=${encodeURIComponent(keyword)}`;
  }

  // Career details: /api/onet/careers/:code
  const careerMatch = path.match(/^\/careers\/([^/]+)$/);
  if (careerMatch) {
    return `/ws/mnm/careers/${careerMatch[1]}`;
  }

  // Career job outlook: /api/onet/careers/:code/job_outlook
  const outlookMatch = path.match(/^\/careers\/([^/]+)\/job_outlook$/);
  if (outlookMatch) {
    return `/ws/mnm/careers/${outlookMatch[1]}/job_outlook`;
  }

  // Career skills: /api/onet/careers/:code/skills
  const skillsMatch = path.match(/^\/careers\/([^/]+)\/skills$/);
  if (skillsMatch) {
    return `/ws/mnm/careers/${skillsMatch[1]}/skills`;
  }

  // Interest profiler questions: /api/onet/interestprofiler/questions?start=1&end=60
  if (path === '/interestprofiler/questions') {
    const start = searchParams.get('start') || '1';
    const end = searchParams.get('end') || '60';
    return `/ws/mnm/interestprofiler/questions?start=${start}&end=${end}`;
  }

  // Interest profiler results: /api/onet/interestprofiler/results?answers=xxx
  if (path === '/interestprofiler/results') {
    const answers = searchParams.get('answers');
    if (!answers) return null;
    return `/ws/mnm/interestprofiler/results?answers=${encodeURIComponent(answers)}`;
  }

  // Interest profiler careers: /api/onet/interestprofiler/careers?realistic=1&investigative=2...
  if (path === '/interestprofiler/careers') {
    const params = new URLSearchParams();
    ['realistic', 'investigative', 'artistic', 'social', 'enterprising', 'conventional'].forEach(
      (key) => {
        const value = searchParams.get(key);
        if (value) params.set(key, value);
      }
    );
    return `/ws/mnm/interestprofiler/careers?${params.toString()}`;
  }

  // Occupation skills: /api/onet/occupations/:code/summary/skills
  const occSkillsMatch = path.match(/^\/occupations\/([^/]+)\/summary\/skills$/);
  if (occSkillsMatch) {
    return `/ws/online/occupations/${occSkillsMatch[1]}/summary/skills`;
  }

  // Occupation knowledge: /api/onet/occupations/:code/summary/knowledge
  const occKnowledgeMatch = path.match(/^\/occupations\/([^/]+)\/summary\/knowledge$/);
  if (occKnowledgeMatch) {
    return `/ws/online/occupations/${occKnowledgeMatch[1]}/summary/knowledge`;
  }

  // Occupation abilities: /api/onet/occupations/:code/summary/abilities
  const occAbilitiesMatch = path.match(/^\/occupations\/([^/]+)\/summary\/abilities$/);
  if (occAbilitiesMatch) {
    return `/ws/online/occupations/${occAbilitiesMatch[1]}/summary/abilities`;
  }

  // Occupation technology skills: /api/onet/occupations/:code/summary/technology_skills
  const occTechMatch = path.match(/^\/occupations\/([^/]+)\/summary\/technology_skills$/);
  if (occTechMatch) {
    return `/ws/online/occupations/${occTechMatch[1]}/summary/technology_skills`;
  }

  // Occupation tasks: /api/onet/occupations/:code/summary/tasks
  const occTasksMatch = path.match(/^\/occupations\/([^/]+)\/summary\/tasks$/);
  if (occTasksMatch) {
    return `/ws/online/occupations/${occTasksMatch[1]}/summary/tasks`;
  }

  // Occupation search: /api/onet/occupation-search?keyword=xxx
  if (path === '/occupation-search') {
    const keyword = searchParams.get('keyword');
    if (!keyword) return null;
    return `/ws/online/search?keyword=${encodeURIComponent(keyword)}`;
  }

  // Unknown endpoint
  return null;
}

// =============================================================================
// REQUEST HANDLERS
// =============================================================================

/**
 * Handles OPTIONS preflight requests for CORS
 */
export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

/**
 * Handles GET requests to proxy O*NET API calls
 */
export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  onetLog.info('Request received');

  // 1. Validate API key is configured
  if (!env.ONET_API_KEY) {
    onetLog.error('ONET_API_KEY not configured');
    return errorResponse('O*NET API is not configured. Please contact support.', 500);
  }

  // 2. Check rate limit
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(clientIp, env.RATE_LIMIT);

  if (!rateLimit.allowed) {
    const resetDate = new Date(rateLimit.resetAt).toISOString();
    onetLog.info('Rate limit exceeded for IP:', clientIp, 'resets at:', resetDate);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: resetDate,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetDate,
          ...corsHeaders,
        },
      }
    );
  }

  // 3. Parse URL and route to O*NET endpoint
  const url = new URL(request.url);
  const onetEndpoint = routeOnetRequest(url.pathname, url.searchParams);

  if (!onetEndpoint) {
    onetLog.info('Unknown endpoint:', url.pathname);
    return errorResponse(
      `Unknown endpoint: ${url.pathname}. Please check the API documentation.`,
      404,
      rateLimit
    );
  }

  // 4. Fetch from O*NET API
  onetLog.info('Proxying to O*NET:', onetEndpoint);
  const onetResult = await fetchFromOnet(onetEndpoint, env.ONET_API_KEY);

  if (!onetResult.success) {
    onetLog.error('API error:', onetResult.error);
    return errorResponse(
      onetResult.error || 'Failed to fetch from O*NET API',
      onetResult.statusCode || 502,
      rateLimit
    );
  }

  // 5. Return successful response
  onetLog.info('Request completed successfully');
  return successResponse(onetResult.data, rateLimit);
}
