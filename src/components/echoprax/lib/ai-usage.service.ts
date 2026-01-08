/**
 * AI Usage Service
 *
 * Tracks AI workout generation usage for free tier users.
 * Premium users have unlimited access (checked via auth).
 * Free users get a limited number of trial generations.
 *
 * Storage: localStorage (local-first, honor system for free tier)
 */

import { logger } from '../../../lib/logger';

const log = logger.create('AIUsageService');

const STORAGE_KEY = 'echoprax_ai_usage';
const FREE_TIER_LIMIT = 3; // Number of free generations allowed

interface AIUsageData {
  generationsUsed: number;
  firstUsedAt: string | null;
  lastUsedAt: string | null;
  history: Array<{
    timestamp: string;
    workoutName: string;
  }>;
}

const DEFAULT_USAGE: AIUsageData = {
  generationsUsed: 0,
  firstUsedAt: null,
  lastUsedAt: null,
  history: [],
};

export class AIUsageService {
  /**
   * Get current usage data
   */
  static getUsage(): AIUsageData {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (!json) return { ...DEFAULT_USAGE };
      return JSON.parse(json) as AIUsageData;
    } catch (error) {
      log.error('Failed to read AI usage data', error);
      return { ...DEFAULT_USAGE };
    }
  }

  /**
   * Get number of generations used
   */
  static getGenerationsUsed(): number {
    return this.getUsage().generationsUsed;
  }

  /**
   * Get number of free generations remaining
   */
  static getFreeGenerationsRemaining(): number {
    const used = this.getGenerationsUsed();
    return Math.max(0, FREE_TIER_LIMIT - used);
  }

  /**
   * Check if free tier has generations remaining
   */
  static hasTrialRemaining(): boolean {
    return this.getFreeGenerationsRemaining() > 0;
  }

  /**
   * Get the free tier limit
   */
  static getFreeTierLimit(): number {
    return FREE_TIER_LIMIT;
  }

  /**
   * Record a generation usage
   */
  static recordGeneration(workoutName: string): void {
    try {
      const usage = this.getUsage();
      const now = new Date().toISOString();

      usage.generationsUsed += 1;
      usage.lastUsedAt = now;
      if (!usage.firstUsedAt) {
        usage.firstUsedAt = now;
      }
      usage.history.push({
        timestamp: now,
        workoutName,
      });

      // Keep history limited to last 10
      if (usage.history.length > 10) {
        usage.history = usage.history.slice(-10);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
      log.debug('Recorded AI generation', {
        total: usage.generationsUsed,
        remaining: FREE_TIER_LIMIT - usage.generationsUsed,
      });
    } catch (error) {
      log.error('Failed to record AI generation', error);
    }
  }

  /**
   * Reset usage (for testing/admin purposes)
   */
  static resetUsage(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      log.info('AI usage reset');
    } catch (error) {
      log.error('Failed to reset AI usage', error);
    }
  }

  /**
   * Check if user can generate (either premium or has trial remaining)
   * This is a frontend-only check; backend also verifies.
   */
  static canGenerate(isPremium: boolean): {
    allowed: boolean;
    reason?: string;
    remaining?: number;
  } {
    if (isPremium) {
      return { allowed: true };
    }

    const remaining = this.getFreeGenerationsRemaining();

    if (remaining > 0) {
      return {
        allowed: true,
        remaining,
      };
    }

    return {
      allowed: false,
      reason: 'Free trial limit reached',
      remaining: 0,
    };
  }

  /**
   * Get usage summary for display
   */
  static getUsageSummary(): {
    used: number;
    limit: number;
    remaining: number;
    isTrialExhausted: boolean;
    firstUsedAt: Date | null;
    lastUsedAt: Date | null;
  } {
    const usage = this.getUsage();
    const remaining = this.getFreeGenerationsRemaining();

    return {
      used: usage.generationsUsed,
      limit: FREE_TIER_LIMIT,
      remaining,
      isTrialExhausted: remaining === 0,
      firstUsedAt: usage.firstUsedAt ? new Date(usage.firstUsedAt) : null,
      lastUsedAt: usage.lastUsedAt ? new Date(usage.lastUsedAt) : null,
    };
  }
}
