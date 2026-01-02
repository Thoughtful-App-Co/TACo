/**
 * Usage Tracker - Local Quota Tracking
 *
 * Tracks feature usage locally using localStorage.
 * Will be replaced with server-side tracking when auth is implemented.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface UsageData {
  mutations: {
    count: number;
    month: string; // YYYY-MM format
    history: {
      timestamp: Date;
      targetRole?: string;
    }[];
  };
  exports: {
    count: number;
    month: string;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'augment_usage_tracker';
const FREE_TIER_MUTATION_LIMIT = 0;
const PAID_TIER_MUTATION_LIMIT: number = 10; // Can be -1 for unlimited

// ============================================================================
// USAGE TRACKING
// ============================================================================

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Load usage data from localStorage
 */
function loadUsageData(): UsageData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Revive dates
      if (data.mutations?.history) {
        data.mutations.history = data.mutations.history.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp),
        }));
      }
      return data;
    }
  } catch (error) {
    console.error('Failed to load usage data:', error);
  }

  // Return default empty data
  return {
    mutations: {
      count: 0,
      month: getCurrentMonth(),
      history: [],
    },
    exports: {
      count: 0,
      month: getCurrentMonth(),
    },
  };
}

/**
 * Save usage data to localStorage
 */
function saveUsageData(data: UsageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save usage data:', error);
  }
}

/**
 * Reset usage data for a new month
 */
function resetIfNewMonth(data: UsageData): UsageData {
  const currentMonth = getCurrentMonth();

  if (data.mutations.month !== currentMonth) {
    data.mutations = {
      count: 0,
      month: currentMonth,
      history: [],
    };
  }

  if (data.exports.month !== currentMonth) {
    data.exports = {
      count: 0,
      month: currentMonth,
    };
  }

  return data;
}

/**
 * Get number of mutations used this month
 */
export function getMutationsUsedThisMonth(): number {
  const data = loadUsageData();
  const updated = resetIfNewMonth(data);
  saveUsageData(updated);
  return updated.mutations.count;
}

/**
 * Get number of mutations remaining this month
 *
 * TODO: Check actual subscription tier when auth is implemented
 */
export function getMutationsRemaining(): number {
  const used = getMutationsUsedThisMonth();
  const limit = PAID_TIER_MUTATION_LIMIT; // TODO: Get from subscription tier

  if (limit === -1) return -1; // Unlimited
  return Math.max(0, limit - used);
}

/**
 * Record a mutation usage
 */
export function recordMutationUsage(targetRole?: string): void {
  const data = loadUsageData();
  const updated = resetIfNewMonth(data);

  updated.mutations.count += 1;
  updated.mutations.history.push({
    timestamp: new Date(),
    targetRole,
  });

  saveUsageData(updated);
}

/**
 * Record an export usage
 */
export function recordExportUsage(): void {
  const data = loadUsageData();
  const updated = resetIfNewMonth(data);

  updated.exports.count += 1;

  saveUsageData(updated);
}

/**
 * Check if user can use mutation (has remaining quota)
 */
export function canUseMutation(): boolean {
  const remaining = getMutationsRemaining();
  return remaining === -1 || remaining > 0;
}

/**
 * Get usage summary for display
 */
export function getUsageSummary(): {
  mutations: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  exports: {
    used: number;
  };
} {
  const data = loadUsageData();
  const updated = resetIfNewMonth(data);
  const limit = PAID_TIER_MUTATION_LIMIT; // TODO: Get from subscription tier
  const used = updated.mutations.count;
  const remaining = limit === -1 ? -1 : Math.max(0, limit - used);
  const percentage = limit === -1 ? 0 : Math.round((used / limit) * 100);

  return {
    mutations: {
      used,
      limit,
      remaining,
      percentage,
    },
    exports: {
      used: updated.exports.count,
    },
  };
}

/**
 * Reset usage data (for testing)
 */
export function resetUsageData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get mutation history for current month
 */
export function getMutationHistory(): {
  timestamp: Date;
  targetRole?: string;
}[] {
  const data = loadUsageData();
  const updated = resetIfNewMonth(data);
  return updated.mutations.history;
}
