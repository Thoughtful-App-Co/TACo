/**
 * Salary Benchmark Service
 *
 * Hybrid strategy for fetching market salary data:
 * 1. Client-side BLS calls (user's IP gets 25/day quota)
 * 2. Shared localStorage cache (benefits all users)
 * 3. Server fallback via labor-market API (500/day shared pool)
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import * as bls from '../../../../services/bls';
import { MarketBenchmark } from '../../../../schemas/tenure';
import { isV2FeatureEnabled } from '../../../../lib/feature-gates';
import { logger } from '../../../../lib/logger';

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

const CACHE_PREFIX = 'salary_benchmark_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_VERSION = 1;

interface CachedBenchmark {
  data: MarketBenchmark;
  cachedAt: string;
  expiresAt: string;
  version: number;
}

// =============================================================================
// RATE LIMIT TRACKING
// =============================================================================

interface RateLimitState {
  count: number;
  resetAt: string;
}

const RATE_LIMIT_KEY = 'salary_benchmark_rate_limit';
const CLIENT_DAILY_LIMIT = 25; // BLS unregistered limit per IP

function getRateLimitState(): RateLimitState {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (stored) {
      const state: RateLimitState = JSON.parse(stored);
      const resetAt = new Date(state.resetAt);
      const now = new Date();

      // Reset if past reset time
      if (now > resetAt) {
        return {
          count: 0,
          resetAt: getNextMidnightUTC().toISOString(),
        };
      }

      return state;
    }
  } catch (e) {
    logger.laborMarket.error('Failed to load rate limit state:', e);
  }

  return {
    count: 0,
    resetAt: getNextMidnightUTC().toISOString(),
  };
}

function incrementRateLimit(): void {
  const state = getRateLimitState();
  state.count += 1;
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
}

function getNextMidnightUTC(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow;
}

// =============================================================================
// CACHE FUNCTIONS
// =============================================================================

function buildCacheKey(socCode: string, areaCode?: string): string {
  return `${CACHE_PREFIX}${socCode}${areaCode ? `_${areaCode}` : ''}`;
}

function getCachedBenchmark(socCode: string, areaCode?: string): MarketBenchmark | null {
  try {
    const key = buildCacheKey(socCode, areaCode);
    const stored = localStorage.getItem(key);
    if (!stored) {
      return null;
    }

    const entry: CachedBenchmark = JSON.parse(stored);

    // Check version
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(key);
      return null;
    }

    // Check expiration
    const now = new Date().getTime();
    const expiresAt = new Date(entry.expiresAt).getTime();
    if (now > expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    // Revive dates
    entry.data.fetchedAt = new Date(entry.data.fetchedAt);
    return entry.data;
  } catch (e) {
    logger.laborMarket.error('Failed to read cached benchmark:', e);
    return null;
  }
}

function setCachedBenchmark(benchmark: MarketBenchmark, socCode: string, areaCode?: string): void {
  try {
    const key = buildCacheKey(socCode, areaCode);
    const now = new Date();
    const entry: CachedBenchmark = {
      data: benchmark,
      cachedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    logger.laborMarket.error('Failed to cache benchmark:', e);
  }
}

// =============================================================================
// BENCHMARK FETCHING
// =============================================================================

export interface BenchmarkResult {
  success: boolean;
  data?: MarketBenchmark;
  error?: string;
  source: 'cache' | 'client' | 'server';
  rateLimitHit?: boolean;
}

/**
 * Fetch salary benchmark data for an occupation
 *
 * Strategy:
 * 1. Check cache first (instant return if hit)
 * 2. If cache miss, attempt client-side BLS call (uses user's IP quota)
 * 3. If rate limited or fails, fallback to server API (shared quota)
 *
 * @param socCode - SOC occupation code (e.g., '15-1252')
 * @param areaCode - Optional BLS area code (e.g., 'S06' for California)
 * @returns BenchmarkResult with data or error
 */
export async function getSalaryBenchmark(
  socCode: string,
  areaCode?: string
): Promise<BenchmarkResult> {
  // Feature gate: Market comparison is deferred to v2
  if (!isV2FeatureEnabled('MARKET_COMPARISON')) {
    return {
      success: false,
      error: 'Market comparison feature is not yet available',
      source: 'cache',
    };
  }

  // Step 1: Check cache
  const cached = getCachedBenchmark(socCode, areaCode);
  if (cached) {
    return {
      success: true,
      data: { ...cached, source: 'cached' },
      source: 'cache',
    };
  }

  // Step 2: Check client-side rate limit
  const rateLimitState = getRateLimitState();
  const canUseClientAPI = rateLimitState.count < CLIENT_DAILY_LIMIT;

  if (canUseClientAPI) {
    try {
      const result = await bls.getOccupationWages(socCode, areaCode);

      if (result.success) {
        incrementRateLimit();

        // Extract year from period (e.g., "May 2023" -> 2023)
        const yearMatch = result.data.period.match(/\d{4}/);
        const dataYear = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

        const benchmark: MarketBenchmark = {
          socCode,
          occupationTitle: result.data.occupationTitle,
          areaCode: result.data.areaCode,
          areaName: result.data.areaName,
          percentile10: result.data.annual.percentile10 ?? 0,
          percentile25: result.data.annual.percentile25 ?? 0,
          median: result.data.annual.median ?? 0,
          percentile75: result.data.annual.percentile75 ?? 0,
          percentile90: result.data.annual.percentile90 ?? 0,
          totalEmployment: undefined, // Not directly in OesWageData
          employmentPerThousand: undefined, // Not directly in OesWageData
          dataYear,
          fetchedAt: new Date(),
          source: 'bls',
        };

        // Cache for future use
        setCachedBenchmark(benchmark, socCode, areaCode);

        return {
          success: true,
          data: benchmark,
          source: 'client',
        };
      }
    } catch (e) {
      logger.laborMarket.warn('Client-side BLS call failed, falling back to server:', e);
    }
  }

  // Step 3: Fallback to server API
  try {
    const response = await fetch('/api/labor-market', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'oes-wages',
        socCode,
        areaCode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Server returned ${response.status}`,
        source: 'server',
        rateLimitHit: response.status === 429,
      };
    }

    const serverData = await response.json();

    if (serverData.success && serverData.data) {
      // Extract year from period (e.g., "May 2023" -> 2023)
      const yearMatch = serverData.data.period?.match(/\d{4}/);
      const dataYear = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

      const benchmark: MarketBenchmark = {
        socCode,
        occupationTitle: serverData.data.occupationTitle,
        areaCode: serverData.data.areaCode,
        areaName: serverData.data.areaName,
        percentile10: serverData.data.annual.percentile10 ?? 0,
        percentile25: serverData.data.annual.percentile25 ?? 0,
        median: serverData.data.annual.median ?? 0,
        percentile75: serverData.data.annual.percentile75 ?? 0,
        percentile90: serverData.data.annual.percentile90 ?? 0,
        totalEmployment: undefined, // Not directly in OesWageData
        employmentPerThousand: undefined, // Not directly in OesWageData
        dataYear,
        fetchedAt: new Date(),
        source: 'bls',
      };

      // Cache for future use
      setCachedBenchmark(benchmark, socCode, areaCode);

      return {
        success: true,
        data: benchmark,
        source: 'server',
      };
    }

    return {
      success: false,
      error: serverData.error || 'Unknown server error',
      source: 'server',
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Network error',
      source: 'server',
    };
  }
}

/**
 * Get current rate limit status for client-side calls
 */
export function getRateLimitStatus(): {
  remaining: number;
  total: number;
  resetAt: Date;
} {
  const state = getRateLimitState();
  return {
    remaining: Math.max(0, CLIENT_DAILY_LIMIT - state.count),
    total: CLIENT_DAILY_LIMIT,
    resetAt: new Date(state.resetAt),
  };
}

/**
 * Clear all cached benchmarks
 */
export function clearBenchmarkCache(): number {
  let cleared = 0;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach((key) => {
      localStorage.removeItem(key);
      cleared++;
    });
  } catch (e) {
    logger.laborMarket.error('Failed to clear benchmark cache:', e);
  }
  return cleared;
}

/**
 * Prefetch benchmarks for common occupations
 * (Can be run on a timer to warm cache)
 */
export async function prefetchCommonBenchmarks(socCodes: string[]): Promise<void> {
  const rateLimitStatus = getRateLimitStatus();
  const budget = Math.min(socCodes.length, rateLimitStatus.remaining);

  for (let i = 0; i < budget; i++) {
    const socCode = socCodes[i];
    const cached = getCachedBenchmark(socCode);
    if (!cached) {
      await getSalaryBenchmark(socCode);
      // Small delay to avoid hammering the API
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
}
