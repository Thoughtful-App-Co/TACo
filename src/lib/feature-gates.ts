/**
 * Feature Gates - Premium Feature Access Control
 *
 * Provides stubs for checking premium feature access.
 * Ready to integrate with authentication system when available.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import {
  getUserLocation,
  hasLaborMarketData,
  getRegionCapabilities,
} from '../services/geolocation';
import type { RegionCapabilities } from '../services/geolocation';

// ============================================================================
// TYPES
// ============================================================================

export interface FeatureGateResult {
  allowed: boolean;
  reason?: string;
  upgradeUrl?: string;
}

export type FeatureName =
  | 'mutation'
  | 'variant_export'
  | 'ai_optimization'
  | 'v2_market_comparison'
  | 'v2_bls_integration';

/**
 * Labor market data feature availability
 * Varies by user's geographic region
 */
export interface LaborMarketFeatures {
  /** Whether any labor market data is available */
  available: boolean;
  /** Specific capabilities for user's region */
  capabilities: RegionCapabilities;
  /** User's detected country code */
  countryCode: string;
  /** User-friendly message if unavailable */
  unavailableMessage?: string;
}

// ============================================================================
// V2 FEATURE FLAGS (DEFERRED TO MVP 2)
// ============================================================================

/**
 * Feature flags for v2 functionality
 * These features are implemented but not yet production-ready
 *
 * To enable a feature for testing, set the flag to true.
 * All flags default to false for the 0.1.0-beta release.
 */
export const V2_FLAGS = {
  /** BLS market comparison in Your Worth salary tracking (requires SOC code mapping) */
  MARKET_COMPARISON: false,
  /** Full BLS API integration for wage data, outlook, and labor market stats */
  BLS_INTEGRATION: false,
  /** SOC code auto-detection from job titles using O*NET crosswalk */
  SOC_CODE_MAPPING: false,
} as const;

/**
 * Check if a v2 feature is enabled
 * @param feature - The v2 feature to check
 * @returns Whether the feature is enabled
 */
export function isV2FeatureEnabled(feature: keyof typeof V2_FLAGS): boolean {
  return V2_FLAGS[feature];
}

// ============================================================================
// FEATURE GATES (AUTH STUBS)
// ============================================================================

/**
 * Check if user can use the resume mutation feature
 *
 * TODO: Replace with actual auth check when authentication is implemented
 */
export function canUseMutation(): FeatureGateResult {
  // STUB: Allow all users during development
  return {
    allowed: true,
  };
}

/**
 * Check if user is a premium subscriber
 */
export function isPremiumUser(): boolean {
  // STUB: Return true during development
  return true;
}

/**
 * Check if user can access a specific feature
 */
export function canAccessFeature(feature: FeatureName): FeatureGateResult {
  switch (feature) {
    case 'mutation':
      return canUseMutation();
    case 'variant_export':
      return { allowed: true };
    case 'ai_optimization':
      return canUseMutation();
    default:
      return { allowed: false, reason: 'Unknown feature' };
  }
}

/**
 * Get user's subscription tier
 */
export function getSubscriptionTier(): 'free' | 'tenure_extras' | 'enterprise' {
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
    case 'tenure_extras':
      return {
        mutationsPerMonth: 10,
        variantsPerResume: 20,
        aiOptimizationsPerMonth: 10,
      };
    case 'enterprise':
      return {
        mutationsPerMonth: -1,
        variantsPerResume: -1,
        aiOptimizationsPerMonth: -1,
      };
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

// ============================================================================
// LABOR MARKET FEATURES (GEOLOCATION-AWARE)
// ============================================================================

/**
 * Check if labor market features are available for user's location
 * @returns Labor market feature availability and capabilities
 */
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
    console.warn('Failed to check labor market features:', error);
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

/**
 * Check if a specific labor market capability is available
 * @param capability - The capability to check
 * @returns Whether the capability is available
 */
export async function hasLaborMarketCapability(
  capability: keyof RegionCapabilities
): Promise<boolean> {
  const features = await getLaborMarketFeatures();
  const value = features.capabilities[capability];
  // The 'provider' key returns a string, all others are boolean
  return typeof value === 'boolean' ? value : value !== 'none';
}

/**
 * Get cached labor market features (non-async, may be stale)
 * Useful for synchronous checks in components
 * @returns Cached features or null if not yet loaded
 */
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

/**
 * Cache labor market features for synchronous access
 * Should be called on app initialization
 */
export async function cacheLaborMarketFeatures(): Promise<void> {
  const features = await getLaborMarketFeatures();
  const cacheEntry = {
    data: features,
    cachedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  try {
    localStorage.setItem('taco_labor_market_features', JSON.stringify(cacheEntry));
  } catch (error) {
    console.warn('Failed to cache labor market features:', error);
  }
}
