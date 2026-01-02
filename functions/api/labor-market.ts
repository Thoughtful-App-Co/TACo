/**
 * Labor Market API - BLS Data Proxy
 * Cloudflare Pages Function for /api/labor-market
 *
 * Proxies requests to the Bureau of Labor Statistics (BLS) API v2,
 * keeping the API key server-side for security.
 *
 * Features:
 * - Request validation with Zod
 * - Rate limiting (450 requests/day with 50 buffer from BLS 500 limit)
 * - Response caching (24 hours via Cache API)
 * - Error handling with user-friendly messages
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { z } from 'zod';

// Cloudflare Workers Cache API type declaration
declare const caches: {
  default: Cache;
};

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface Env {
  BLS_API_KEY: string;
}

interface RateLimitState {
  count: number;
  resetAt: number;
}

// In-memory rate limit store (resets on worker restart, but good enough for daily limits)
// For production with multiple workers, use KV or Durable Objects
const rateLimitStore: Map<string, RateLimitState> = new Map();

// =============================================================================
// CORS HEADERS
// =============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// =============================================================================
// REQUEST VALIDATION SCHEMA
// =============================================================================

const BlsRequestSchema = z.object({
  seriesid: z
    .array(z.string().min(1, 'Series ID cannot be empty'))
    .min(1, 'At least one series ID is required')
    .max(50, 'Maximum 50 series IDs allowed per request'),
  startyear: z
    .string()
    .regex(/^\d{4}$/, 'Start year must be a 4-digit year')
    .refine((year) => {
      const y = parseInt(year, 10);
      return y >= 1900 && y <= new Date().getFullYear() + 1;
    }, 'Start year must be between 1900 and next year'),
  endyear: z
    .string()
    .regex(/^\d{4}$/, 'End year must be a 4-digit year')
    .refine((year) => {
      const y = parseInt(year, 10);
      return y >= 1900 && y <= new Date().getFullYear() + 1;
    }, 'End year must be between 1900 and next year'),
  catalog: z.boolean().optional(),
  calculations: z.boolean().optional(),
  annualaverage: z.boolean().optional(),
});

type BlsRequest = z.infer<typeof BlsRequestSchema>;

// =============================================================================
// BLS ERROR MESSAGE MAPPING
// =============================================================================

const BLS_ERROR_MESSAGES: Record<string, string> = {
  REQUEST_FAILED_INVALID_SERIES_ID: 'One or more series IDs are invalid.',
  REQUEST_FAILED_INVALID_YEAR: 'The year range is invalid for the requested series.',
  REQUEST_FAILED_TOO_MANY_SERIES: 'Too many series requested. Maximum is 50 series per request.',
  REQUEST_FAILED_TOO_MANY_YEARS: 'The year range exceeds the maximum allowed (20 years).',
  REQUEST_FAILED_REGISTRATION_KEY_INVALID: 'API authentication failed. Please try again later.',
  REQUEST_FAILED_DAILY_THRESHOLD_EXCEEDED:
    'Daily request limit reached. Please try again tomorrow.',
  REQUEST_NOT_PROCESSED: 'The BLS API could not process this request. Please try again.',
};

/**
 * Maps BLS API error messages to user-friendly responses
 */
function mapBlsError(blsMessage: string): string {
  for (const [key, friendlyMessage] of Object.entries(BLS_ERROR_MESSAGES)) {
    if (blsMessage.includes(key)) {
      return friendlyMessage;
    }
  }
  return blsMessage || 'An unexpected error occurred while fetching labor market data.';
}

// =============================================================================
// RATE LIMITING
// =============================================================================

const DAILY_LIMIT = 450; // Leave 50 buffer from BLS 500 limit
const RATE_LIMIT_KEY = 'bls-api-daily';

/**
 * Checks if the daily rate limit has been exceeded
 * Returns remaining requests if allowed, or -1 if exceeded
 */
function checkRateLimit(): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const todayMidnight = new Date();
  todayMidnight.setUTCHours(0, 0, 0, 0);
  const resetAt = todayMidnight.getTime() + 24 * 60 * 60 * 1000; // Next midnight UTC

  let state = rateLimitStore.get(RATE_LIMIT_KEY);

  // Reset if we're past the reset time
  if (!state || now >= state.resetAt) {
    state = { count: 0, resetAt };
    rateLimitStore.set(RATE_LIMIT_KEY, state);
  }

  const remaining = DAILY_LIMIT - state.count;

  if (remaining <= 0) {
    return { allowed: false, remaining: 0, resetAt: state.resetAt };
  }

  return { allowed: true, remaining, resetAt: state.resetAt };
}

/**
 * Increments the rate limit counter
 */
function incrementRateLimit(): void {
  const state = rateLimitStore.get(RATE_LIMIT_KEY);
  if (state) {
    state.count++;
    rateLimitStore.set(RATE_LIMIT_KEY, state);
  }
}

// =============================================================================
// CACHING
// =============================================================================

const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

/**
 * Generates a deterministic cache key from request parameters
 */
function generateCacheKey(request: BlsRequest, baseUrl: string): string {
  // Sort series IDs for consistent cache keys
  const sortedSeriesIds = [...request.seriesid].sort().join(',');
  const params = new URLSearchParams({
    series: sortedSeriesIds,
    start: request.startyear,
    end: request.endyear,
    catalog: String(request.catalog ?? false),
    calculations: String(request.calculations ?? false),
    annualaverage: String(request.annualaverage ?? false),
  });

  return `${baseUrl}/cache/bls?${params.toString()}`;
}

/**
 * Attempts to get a cached response
 */
async function getCachedResponse(cacheKey: string): Promise<Response | null> {
  try {
    const cache = caches.default;
    const cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      console.log('[Labor Market] Cache hit:', cacheKey);
      return cachedResponse;
    }
  } catch (error) {
    console.error('[Labor Market] Cache read error:', error);
  }

  return null;
}

/**
 * Caches a successful response
 */
async function cacheResponse(cacheKey: string, response: Response): Promise<void> {
  try {
    const cache = caches.default;

    // Clone the response and add cache headers
    const responseToCache = new Response(response.clone().body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'Cache-Control': `public, max-age=${CACHE_TTL}`,
      },
    });

    await cache.put(cacheKey, responseToCache);
    console.log('[Labor Market] Cached response:', cacheKey);
  } catch (error) {
    console.error('[Labor Market] Cache write error:', error);
  }
}

// =============================================================================
// BLS API INTERFACE
// =============================================================================

interface BlsApiResponse {
  status: string;
  responseTime: number;
  message: string[];
  Results?: {
    series: Array<{
      seriesID: string;
      data: Array<{
        year: string;
        period: string;
        periodName: string;
        value: string;
        footnotes: Array<{ code: string; text: string }>;
        latest?: string;
        calculations?: Record<string, unknown>;
      }>;
      catalog?: Record<string, unknown>;
    }>;
  };
}

/**
 * Makes a request to the BLS API v2
 */
async function fetchFromBls(
  request: BlsRequest,
  apiKey: string
): Promise<{ success: boolean; data?: BlsApiResponse; error?: string }> {
  const BLS_API_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

  try {
    const blsResponse = await fetch(BLS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...request,
        registrationkey: apiKey,
      }),
    });

    if (!blsResponse.ok) {
      console.error('[Labor Market] BLS API HTTP error:', blsResponse.status);
      return {
        success: false,
        error: `BLS API returned HTTP ${blsResponse.status}`,
      };
    }

    const data: BlsApiResponse = await blsResponse.json();

    // Check for BLS API-level errors
    if (data.status === 'REQUEST_FAILED' || data.status === 'REQUEST_NOT_PROCESSED') {
      const errorMessage = data.message?.join(' ') || 'Unknown BLS API error';
      console.error('[Labor Market] BLS API error:', errorMessage);
      return {
        success: false,
        error: mapBlsError(errorMessage),
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Labor Market] BLS API fetch error:', error);
    return {
      success: false,
      error: 'Failed to connect to BLS API. Please try again later.',
    };
  }
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
 * Handles POST requests to fetch BLS labor market data
 */
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  console.log('[Labor Market] Request received');

  // 1. Validate API key is configured
  if (!env.BLS_API_KEY) {
    console.error('[Labor Market] BLS_API_KEY not configured');
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Labor market API is not configured. Please contact support.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // 2. Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body.',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  const validationResult = BlsRequestSchema.safeParse(body);

  if (!validationResult.success) {
    const errors = validationResult.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ');

    console.log('[Labor Market] Validation failed:', errors);

    return new Response(
      JSON.stringify({
        success: false,
        error: `Validation failed: ${errors}`,
        validationErrors: validationResult.error.errors,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  const validatedRequest = validationResult.data;

  // Additional validation: endyear >= startyear
  if (parseInt(validatedRequest.endyear, 10) < parseInt(validatedRequest.startyear, 10)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'End year must be greater than or equal to start year.',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // 3. Check rate limit
  const rateLimit = checkRateLimit();

  if (!rateLimit.allowed) {
    const resetDate = new Date(rateLimit.resetAt).toISOString();
    console.log('[Labor Market] Rate limit exceeded, resets at:', resetDate);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Daily request limit reached. Please try again tomorrow.',
        retryAfter: resetDate,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': DAILY_LIMIT.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          ...corsHeaders,
        },
      }
    );
  }

  // 4. Check cache
  const baseUrl = new URL(request.url).origin;
  const cacheKey = generateCacheKey(validatedRequest, baseUrl);
  const cachedResponse = await getCachedResponse(cacheKey);

  if (cachedResponse) {
    // Return cached response with updated rate limit headers
    const responseBody = await cachedResponse.json();
    return new Response(
      JSON.stringify({
        ...responseBody,
        cached: true,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': DAILY_LIMIT.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-Cache': 'HIT',
          ...corsHeaders,
        },
      }
    );
  }

  // 5. Make BLS API request
  console.log('[Labor Market] Fetching from BLS API:', {
    seriesCount: validatedRequest.seriesid.length,
    yearRange: `${validatedRequest.startyear}-${validatedRequest.endyear}`,
  });

  const blsResult = await fetchFromBls(validatedRequest, env.BLS_API_KEY);

  if (!blsResult.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: blsResult.error,
      }),
      {
        status: 502, // Bad Gateway - upstream error
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // 6. Increment rate limit on successful request
  incrementRateLimit();

  // 7. Prepare successful response
  const responseData = {
    success: true,
    status: blsResult.data!.status,
    responseTime: blsResult.data!.responseTime,
    messages: blsResult.data!.message,
    results: blsResult.data!.Results,
    cached: false,
    rateLimit: {
      limit: DAILY_LIMIT,
      remaining: rateLimit.remaining - 1,
      resetAt: new Date(rateLimit.resetAt).toISOString(),
    },
  };

  const response = new Response(JSON.stringify(responseData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': DAILY_LIMIT.toString(),
      'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
      'X-RateLimit-Reset': rateLimit.resetAt.toString(),
      'X-Cache': 'MISS',
      ...corsHeaders,
    },
  });

  // 8. Cache successful response (async, don't wait)
  cacheResponse(cacheKey, response.clone());

  console.log('[Labor Market] Request completed successfully:', {
    seriesCount: blsResult.data!.Results?.series?.length || 0,
    rateLimitRemaining: rateLimit.remaining - 1,
  });

  return response;
}
