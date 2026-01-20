/**
 * Feature Gates - Premium Feature Access Control
 *
 * Provides real subscription-based access control.
 * Integrates with auth context for subscription status.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import {
  getUserLocation,
  hasLaborMarketData,
  getRegionCapabilities,
} from '../services/geolocation';
import type { RegionCapabilities } from '../services/geolocation';
import { getStoredToken } from './auth';
import { logger } from './logger';

// ============================================================================
// TYPES
// ============================================================================

export interface FeatureGateResult {
  allowed: boolean;
  reason?: string;
  upgradeUrl?: string;
  requiresAuth?: boolean;
  requiresSubscription?: string;
}

export type FeatureName =
  | 'mutation'
  | 'variant_export'
  | 'ai_optimization'
  | 'backup'
  | 'sync'
  | 'tempo_ai'
  | 'cover_letter'
  | 'echoprax_ai';

export type SubscriptionTier =
  | 'free'
  | 'tenure_extras'
  | 'tempo_extras'
  | 'echoprax_extras'
  | 'sync'
  | 'taco_club';

/**
 * Labor market data feature availability
 * Varies by user's geographic region
 */
export interface LaborMarketFeatures {
  available: boolean;
  capabilities: RegionCapabilities;
  countryCode: string;
  unavailableMessage?: string;
}

// ============================================================================
// AUTH STATE CACHE
// ============================================================================

// Cache for subscription status to avoid repeated API calls
let cachedSubscriptions: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

// localStorage keys for offline persistence
const SUBSCRIPTIONS_STORAGE_KEY = 'taco_subscriptions';
const SUBSCRIPTIONS_TIMESTAMP_KEY = 'taco_subscriptions_timestamp';

/**
 * Persist subscriptions to localStorage for offline access
 */
function persistSubscriptionsToStorage(subs: string[]): void {
  try {
    localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(subs));
    localStorage.setItem(SUBSCRIPTIONS_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    logger.features.warn('Failed to persist subscriptions to localStorage:', error);
  }
}

/**
 * Get persisted subscriptions from localStorage
 * Returns null if not found or invalid
 */
function getPersistedSubscriptions(): { subscriptions: string[]; timestamp: number } | null {
  try {
    const subs = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
    const timestamp = localStorage.getItem(SUBSCRIPTIONS_TIMESTAMP_KEY);

    if (!subs || !timestamp) {
      return null;
    }

    const parsed = JSON.parse(subs);
    if (!Array.isArray(parsed)) {
      return null;
    }

    return {
      subscriptions: parsed,
      timestamp: parseInt(timestamp, 10),
    };
  } catch {
    return null;
  }
}

/**
 * Clear persisted subscriptions from localStorage
 */
function clearPersistedSubscriptions(): void {
  try {
    localStorage.removeItem(SUBSCRIPTIONS_STORAGE_KEY);
    localStorage.removeItem(SUBSCRIPTIONS_TIMESTAMP_KEY);
  } catch (error) {
    logger.features.warn('Failed to clear persisted subscriptions:', error);
  }
}

/**
 * Get the timestamp of when subscriptions were last synced
 * Returns null if no cached data exists
 */
export function getSubscriptionsSyncTimestamp(): number | null {
  // First check in-memory cache
  if (cacheTimestamp > 0) {
    return cacheTimestamp;
  }

  // Fall back to localStorage timestamp
  const persisted = getPersistedSubscriptions();
  return persisted?.timestamp || null;
}

/**
 * Check if we're currently using offline/cached subscription data
 */
export function isUsingCachedSubscriptions(): boolean {
  const syncTimestamp = getSubscriptionsSyncTimestamp();
  if (!syncTimestamp) return false;

  // If last sync was more than cache TTL ago, we're using stale/offline data
  return Date.now() - syncTimestamp > CACHE_TTL;
}

/**
 * Get cached subscriptions or fetch fresh
 */
export async function getSubscriptions(): Promise<string[]> {
  const token = getStoredToken();

  if (!token) {
    cachedSubscriptions = null;
    clearPersistedSubscriptions();
    return [];
  }

  // Return cached if fresh
  if (cachedSubscriptions && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedSubscriptions;
  }

  try {
    const response = await fetch('/api/auth/validate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      cachedSubscriptions = null;
      // Don't clear localStorage here - keep offline fallback available
      return getOfflineFallbackSubscriptions();
    }

    const data = await response.json();
    const subs: string[] = data.subscriptions || [];
    cachedSubscriptions = subs;
    cacheTimestamp = Date.now();

    // Persist to localStorage for offline access
    persistSubscriptionsToStorage(subs);

    return subs;
  } catch {
    // Network error - try offline fallback
    return getOfflineFallbackSubscriptions();
  }
}

/**
 * Get subscriptions from offline storage when API is unavailable
 */
function getOfflineFallbackSubscriptions(): string[] {
  // First try in-memory cache
  if (cachedSubscriptions) {
    return cachedSubscriptions;
  }

  // Fall back to localStorage
  const persisted = getPersistedSubscriptions();
  if (persisted) {
    logger.features.debug(
      'Using offline persisted subscriptions from',
      new Date(persisted.timestamp).toISOString()
    );
    // Update in-memory cache with persisted data
    cachedSubscriptions = persisted.subscriptions;
    cacheTimestamp = persisted.timestamp;
    return persisted.subscriptions;
  }

  return [];
}

/**
 * Synchronous check using cached data
 * Falls back to localStorage if in-memory cache is empty
 */
function getCachedSubscriptions(): string[] {
  if (cachedSubscriptions) {
    return cachedSubscriptions;
  }

  // Try localStorage fallback for offline support
  const persisted = getPersistedSubscriptions();
  if (persisted) {
    cachedSubscriptions = persisted.subscriptions;
    cacheTimestamp = persisted.timestamp;
    return persisted.subscriptions;
  }

  return [];
}

/**
 * Check if user is authenticated (has token)
 */
function isAuthenticated(): boolean {
  return !!getStoredToken();
}

/**
 * Clear subscription cache (call after login/logout)
 */
export function clearSubscriptionCache(): void {
  cachedSubscriptions = null;
  cacheTimestamp = 0;
  // Note: We don't clear localStorage here to maintain offline fallback
  // It will be updated on next successful API call
}

/**
 * Clear all subscription data including localStorage (call on logout)
 */
export function clearAllSubscriptionData(): void {
  cachedSubscriptions = null;
  cacheTimestamp = 0;
  clearPersistedSubscriptions();
}

/**
 * Initialize subscription cache - call this on app load
 * This pre-populates the cache so sync feature checks work immediately
 */
export async function initializeSubscriptionCache(): Promise<void> {
  await getSubscriptions();
}

// ============================================================================
// V2 FEATURE FLAGS (Legacy compatibility)
// ============================================================================

/**
 * V2 Feature flags for gradual rollout
 * These control access to newer features during development
 *
 * @deprecated Use subscription-based feature gates instead
 */
export type V2Feature = 'laborMarket' | 'salaryBenchmark' | 'matches' | 'seasonalInsights';

/**
 * Check if a V2 feature is enabled
 * Currently all V2 features are enabled by default
 *
 * @deprecated Use subscription-based feature gates instead
 */
export function isV2FeatureEnabled(feature: V2Feature): boolean {
  // Check for localStorage override (for testing)
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem(`v2_${feature}`);
    if (override === 'true') return true;
    if (override === 'false') return false;
  }

  switch (feature) {
    case 'laborMarket':
    case 'salaryBenchmark':
    case 'matches':
      return true;
    case 'seasonalInsights':
      // Disabled until v2 launch - set localStorage.setItem('v2_seasonalInsights', 'true') to test
      return false;
    default:
      return false;
  }
}

/**
 * Check if Seasonal Insights v2 features are enabled
 * Includes: improved layout, industry-specific patterns, geographic adjustments
 */
export function isSeasonalInsightsEnabled(): boolean {
  return isV2FeatureEnabled('seasonalInsights');
}

// ============================================================================
// FEATURE GATES
// ============================================================================

/**
 * Check if user can use the resume mutation feature
 */
export function canUseMutation(): FeatureGateResult {
  if (!isAuthenticated()) {
    return {
      allowed: false,
      reason: 'Sign in required',
      requiresAuth: true,
      upgradeUrl: '/pricing',
    };
  }

  const subs = getCachedSubscriptions();

  if (subs.includes('tenure_extras') || subs.includes('taco_club')) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Tenure Extras subscription required',
    requiresSubscription: 'tenure_extras',
    upgradeUrl: '/pricing#tenure-extras',
  };
}

/**
 * Check if user can use backup/sync features
 */
export function canUseBackup(): FeatureGateResult {
  if (!isAuthenticated()) {
    return {
      allowed: false,
      reason: 'Sign in required',
      requiresAuth: true,
      upgradeUrl: '/pricing',
    };
  }

  const subs = getCachedSubscriptions();

  const hasSyncSub = subs.some(
    (s) => s === 'sync_all' || s.startsWith('sync_') || s === 'taco_club'
  );

  if (hasSyncSub) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Sync & Backup subscription required',
    requiresSubscription: 'sync',
    upgradeUrl: '/pricing#sync',
  };
}

/**
 * Check if user can use Tenure sync
 */
export function canUseTenureSync(): FeatureGateResult {
  if (!isAuthenticated()) {
    return {
      allowed: false,
      reason: 'Sign in required',
      requiresAuth: true,
      upgradeUrl: '/pricing',
    };
  }

  const subs = getCachedSubscriptions();

  if (subs.includes('taco_club') || subs.includes('sync_all') || subs.includes('sync_tenure')) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Tenure Sync subscription required',
    requiresSubscription: 'sync_tenure',
    upgradeUrl: '/pricing#sync',
  };
}

/**
 * Check if user can use Tempo sync
 */
export function canUseTempoSync(): FeatureGateResult {
  if (!isAuthenticated()) {
    return {
      allowed: false,
      reason: 'Sign in required',
      requiresAuth: true,
      upgradeUrl: '/pricing',
    };
  }

  const subs = getCachedSubscriptions();

  if (subs.includes('taco_club') || subs.includes('sync_all') || subs.includes('sync_tempo')) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Tempo Sync subscription required',
    requiresSubscription: 'sync_tempo',
    upgradeUrl: '/pricing#sync',
  };
}

/**
 * Check if user can use Tempo AI features (brain dump processing, session creation)
 */
export function canUseTempoAI(): FeatureGateResult {
  if (!isAuthenticated()) {
    return {
      allowed: false,
      reason: 'Sign in required',
      requiresAuth: true,
      upgradeUrl: '/pricing',
    };
  }

  const subs = getCachedSubscriptions();

  if (subs.includes('tempo_extras') || subs.includes('taco_club')) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Tempo Extras subscription required',
    requiresSubscription: 'tempo_extras',
    upgradeUrl: '/pricing#tempo-extras',
  };
}

/**
 * Check if user can use Echoprax AI features
 */
export function canUseEchopraxAI(): FeatureGateResult {
  if (!isAuthenticated()) {
    return {
      allowed: false,
      reason: 'Sign in required',
      requiresAuth: true,
      upgradeUrl: '/pricing',
    };
  }

  const subs = getCachedSubscriptions();

  if (subs.includes('echoprax_extras') || subs.includes('taco_club')) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Echoprax Extras subscription required',
    requiresSubscription: 'echoprax_extras',
    upgradeUrl: '/pricing#echoprax-extras',
  };
}

/**
 * Check if user can use Cover Letter generation (part of Tenure Extras)
 */
export function canUseCoverLetter(): FeatureGateResult {
  // Cover letter uses the same gate as mutation (Tenure Extras)
  return canUseMutation();
}

/**
 * Check if user is a premium subscriber
 */
export function isPremiumUser(): boolean {
  const subs = getCachedSubscriptions();
  return subs.length > 0;
}

/**
 * Check if user can access a specific feature
 */
export function canAccessFeature(feature: FeatureName): FeatureGateResult {
  switch (feature) {
    case 'mutation':
    case 'ai_optimization':
    case 'cover_letter':
      return canUseMutation();
    case 'tempo_ai':
      return canUseTempoAI();
    case 'echoprax_ai':
      return canUseEchopraxAI();
    case 'backup':
    case 'sync':
      return canUseBackup();
    case 'variant_export':
      return { allowed: true }; // Free feature
    default:
      return { allowed: false, reason: 'Unknown feature' };
  }
}

/**
 * Get user's subscription tier
 */
export function getSubscriptionTier(): SubscriptionTier {
  const subs = getCachedSubscriptions();

  if (subs.includes('taco_club')) return 'taco_club';
  if (subs.includes('tenure_extras')) return 'tenure_extras';
  if (subs.includes('tempo_extras')) return 'tempo_extras';
  if (subs.includes('echoprax_extras')) return 'echoprax_extras';
  if (subs.some((s) => s.startsWith('sync_'))) return 'sync';

  return 'free';
}

/**
 * Get feature limits for current user
 */
export function getFeatureLimits(): {
  mutationsPerMonth: number;
  variantsPerResume: number;
  aiOptimizationsPerMonth: number;
} {
  const tier = getSubscriptionTier();

  switch (tier) {
    case 'taco_club':
      return {
        mutationsPerMonth: -1, // Unlimited
        variantsPerResume: -1,
        aiOptimizationsPerMonth: -1,
      };
    case 'tenure_extras':
      return {
        mutationsPerMonth: 10,
        variantsPerResume: 20,
        aiOptimizationsPerMonth: 10,
      };
    case 'tempo_extras':
      return {
        mutationsPerMonth: 0,
        variantsPerResume: 5,
        aiOptimizationsPerMonth: 50,
      };
    case 'sync':
    case 'free':
    default:
      return {
        mutationsPerMonth: 0,
        variantsPerResume: 5,
        aiOptimizationsPerMonth: 0,
      };
  }
}

/**
 * Check if user has reached their usage limit
 */
export function hasReachedLimit(feature: FeatureName, currentUsage: number): boolean {
  const limits = getFeatureLimits();

  switch (feature) {
    case 'mutation':
      return limits.mutationsPerMonth !== -1 && currentUsage >= limits.mutationsPerMonth;
    case 'ai_optimization':
      return (
        limits.aiOptimizationsPerMonth !== -1 && currentUsage >= limits.aiOptimizationsPerMonth
      );
    default:
      return false;
  }
}

/**
 * Async check with fresh subscription data
 */
export async function canUseMutationAsync(): Promise<FeatureGateResult> {
  if (!isAuthenticated()) {
    return {
      allowed: false,
      reason: 'Sign in required',
      requiresAuth: true,
      upgradeUrl: '/pricing',
    };
  }

  const subs = await getSubscriptions();

  if (subs.includes('tenure_extras') || subs.includes('taco_club')) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Tenure Extras subscription required',
    requiresSubscription: 'tenure_extras',
    upgradeUrl: '/pricing#tenure-extras',
  };
}

/**
 * Async check for Tempo AI with fresh subscription data
 */
export async function canUseTempoAIAsync(): Promise<FeatureGateResult> {
  if (!isAuthenticated()) {
    return {
      allowed: false,
      reason: 'Sign in required',
      requiresAuth: true,
      upgradeUrl: '/pricing',
    };
  }

  const subs = await getSubscriptions();

  if (subs.includes('tempo_extras') || subs.includes('taco_club')) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Tempo Extras subscription required',
    requiresSubscription: 'tempo_extras',
    upgradeUrl: '/pricing#tempo-extras',
  };
}

/**
 * Async check for Echoprax AI with fresh subscription data
 */
export async function canUseEchopraxAIAsync(): Promise<FeatureGateResult> {
  if (!isAuthenticated()) {
    return {
      allowed: false,
      reason: 'Sign in required',
      requiresAuth: true,
      upgradeUrl: '/pricing',
    };
  }

  const subs = await getSubscriptions();

  if (subs.includes('echoprax_extras') || subs.includes('taco_club')) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Echoprax Extras subscription required',
    requiresSubscription: 'echoprax_extras',
    upgradeUrl: '/pricing#echoprax-extras',
  };
}

// ============================================================================
// LABOR MARKET FEATURES (GEOLOCATION-AWARE)
// ============================================================================

export async function getLaborMarketFeatures(): Promise<LaborMarketFeatures> {
  try {
    const location = await getUserLocation();
    const available = await hasLaborMarketData();
    const capabilities = getRegionCapabilities(location.countryCode);

    return {
      available,
      capabilities,
      countryCode: location.countryCode,
      unavailableMessage: !available
        ? `Labor market data is not yet available for ${location.countryName}. We currently support US-based careers with Bureau of Labor Statistics data.`
        : undefined,
    };
  } catch (error) {
    logger.features.warn('Failed to check labor market features:', error);
    return {
      available: false,
      capabilities: {
        laborMarketData: false,
        provider: 'none',
        wageData: false,
        unemploymentData: false,
        jobOpeningsData: false,
        industryData: false,
      },
      countryCode: 'unknown',
      unavailableMessage:
        'Unable to determine your location. Labor market features may be unavailable.',
    };
  }
}

export async function hasLaborMarketCapability(
  capability: keyof RegionCapabilities
): Promise<boolean> {
  const features = await getLaborMarketFeatures();
  const value = features.capabilities[capability];
  return typeof value === 'boolean' ? value : value !== 'none';
}

export function getCachedLaborMarketFeatures(): LaborMarketFeatures | null {
  try {
    const cached = localStorage.getItem('taco_labor_market_features');
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    const expiresAt = new Date(parsed.expiresAt).getTime();

    if (Date.now() > expiresAt) {
      localStorage.removeItem('taco_labor_market_features');
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export async function cacheLaborMarketFeatures(): Promise<void> {
  const features = await getLaborMarketFeatures();
  const cacheEntry = {
    data: features,
    cachedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  try {
    localStorage.setItem('taco_labor_market_features', JSON.stringify(cacheEntry));
  } catch (error) {
    logger.features.warn('Failed to cache labor market features:', error);
  }
}
