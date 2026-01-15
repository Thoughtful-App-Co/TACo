/**
 * Stripe Price IDs for Frontend
 *
 * Maps feature names to actual Stripe price IDs.
 * Used by Paywall and PricingPage components.
 *
 * NOTE: Frontend always uses TEST prices during development.
 * Production builds should use LIVE prices (controlled by build-time env var).
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

// ============================================================================
// PRICE IDS
// ============================================================================

/**
 * Test mode price IDs (Stripe test mode)
 *
 * IMPORTANT: Keep in sync with functions/lib/stripe.ts
 */
export const STRIPE_PRICES_TEST = {
  // TACo Club
  TACO_CLUB_MONTHLY: 'price_1Sm564CPMZ8sEjvKCGmRtoZb',
  TACO_CLUB_LIFETIME: 'price_1Sm564CPMZ8sEjvKRuiDExbY',

  // Sync & Backup
  SYNC_ALL_MONTHLY: 'price_1Sm4s7CPMZ8sEjvK94OxRR1O',
  SYNC_ALL_YEARLY: 'price_1Sm4sTCPMZ8sEjvKAWdgAz3V',
  SYNC_APP_MONTHLY: 'price_1Sm5JsCPMZ8sEjvK66l5S7yG',
  SYNC_APP_YEARLY: 'price_1Sm5JYCPMZ8sEjvKoGh2rbWj',

  // App Extras
  TEMPO_EXTRAS_MONTHLY: 'price_1Sm4nYCPMZ8sEjvKbUqYoog4',
  TEMPO_EXTRAS_YEARLY: 'price_1Sm4oRCPMZ8sEjvK35pjZ6v5',
  TENURE_EXTRAS_MONTHLY: 'price_1Sm4nCCPMZ8sEjvKm7zIFJ3K',
  TENURE_EXTRAS_YEARLY: 'price_1Sm4nCCPMZ8sEjvKYLvfcZmb',
  // TODO: Create Echoprax product in Stripe test mode with $8/mo and $80/year pricing
  ECHOPRAX_EXTRAS_MONTHLY: 'PLACEHOLDER_ECHOPRAX_MONTHLY_TEST',
  ECHOPRAX_EXTRAS_YEARLY: 'PLACEHOLDER_ECHOPRAX_YEARLY_TEST',
} as const;

/**
 * Live mode price IDs (Stripe live mode)
 * TODO: Replace with actual live price IDs after creating products
 * See docs/STRIPE_LIVE_SETUP.md for instructions
 *
 * IMPORTANT: Keep in sync with functions/lib/stripe.ts
 */
export const STRIPE_PRICES_LIVE = {
  TACO_CLUB_MONTHLY: 'LIVE_PRICE_TACO_CLUB_MONTHLY',
  TACO_CLUB_LIFETIME: 'LIVE_PRICE_TACO_CLUB_LIFETIME',
  SYNC_ALL_MONTHLY: 'LIVE_PRICE_SYNC_ALL_MONTHLY',
  SYNC_ALL_YEARLY: 'LIVE_PRICE_SYNC_ALL_YEARLY',
  SYNC_APP_MONTHLY: 'LIVE_PRICE_SYNC_APP_MONTHLY',
  SYNC_APP_YEARLY: 'LIVE_PRICE_SYNC_APP_YEARLY',
  TEMPO_EXTRAS_MONTHLY: 'LIVE_PRICE_TEMPO_EXTRAS_MONTHLY',
  TEMPO_EXTRAS_YEARLY: 'LIVE_PRICE_TEMPO_EXTRAS_YEARLY',
  TENURE_EXTRAS_MONTHLY: 'LIVE_PRICE_TENURE_EXTRAS_MONTHLY',
  TENURE_EXTRAS_YEARLY: 'LIVE_PRICE_TENURE_EXTRAS_YEARLY',
  ECHOPRAX_EXTRAS_MONTHLY: 'LIVE_PRICE_ECHOPRAX_EXTRAS_MONTHLY',
  ECHOPRAX_EXTRAS_YEARLY: 'LIVE_PRICE_ECHOPRAX_EXTRAS_YEARLY',
} as const;

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Check if we're in production mode
 * Uses Vite's import.meta.env for build-time detection
 */
function isProduction(): boolean {
  // Check for production mode via Vite env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.PROD === true || import.meta.env.MODE === 'production';
  }
  return false;
}

/**
 * Get the appropriate price IDs for current environment
 */
export function getStripePrices() {
  return isProduction() ? STRIPE_PRICES_LIVE : STRIPE_PRICES_TEST;
}

// ============================================================================
// FEATURE TO PRICE MAPPING
// ============================================================================

export type PaywallFeature =
  | 'tenure_extras'
  | 'tempo_extras'
  | 'echoprax_extras'
  | 'sync'
  | 'backup';

/**
 * Get the Stripe price ID for a given feature
 */
export function getPriceIdForFeature(feature: PaywallFeature): string {
  const prices = getStripePrices();

  switch (feature) {
    case 'tenure_extras':
      return prices.TENURE_EXTRAS_MONTHLY;
    case 'tempo_extras':
      return prices.TEMPO_EXTRAS_MONTHLY;
    case 'echoprax_extras':
      return prices.ECHOPRAX_EXTRAS_MONTHLY;
    case 'sync':
    case 'backup':
      return prices.SYNC_ALL_MONTHLY;
    default:
      return prices.SYNC_ALL_MONTHLY;
  }
}
