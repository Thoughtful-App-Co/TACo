/**
 * Centralized Stripe Configuration
 *
 * Single source of truth for Stripe client initialization, price IDs,
 * and environment-based secret selection.
 *
 * Usage:
 *   import { getStripeClient, getWebhookSecret, getStripePrices } from '../lib/stripe';
 *   const stripe = getStripeClient(env);
 *   const prices = getStripePrices(env);
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import Stripe from 'stripe';
import { billingLog } from './logger';

// ============================================================================
// TYPES
// ============================================================================

export interface StripeEnv {
  TACO_ENV?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_SECRET_KEY_TEST?: string;
  STRIPE_SECRET_KEY_LIVE?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_WEBHOOK_SECRET_TEST?: string;
  STRIPE_WEBHOOK_SECRET_LIVE?: string;
}

export interface StripePrices {
  TACO_CLUB_MONTHLY: string;
  TACO_CLUB_LIFETIME: string;
  SYNC_ALL_MONTHLY: string;
  SYNC_ALL_YEARLY: string;
  SYNC_APP_MONTHLY: string;
  SYNC_APP_YEARLY: string;
  TEMPO_EXTRAS_MONTHLY: string;
  TEMPO_EXTRAS_YEARLY: string;
  TENURE_EXTRAS_MONTHLY: string;
  TENURE_EXTRAS_YEARLY: string;
  ECHOPRAX_EXTRAS_MONTHLY: string;
  ECHOPRAX_EXTRAS_YEARLY: string;
}

// ============================================================================
// PRICE ID CONFIGURATIONS
// ============================================================================

/**
 * TEST MODE Price IDs
 * These are your actual Stripe test mode price IDs
 *
 * IMPORTANT: Keep in sync with src/lib/stripe-prices.ts
 */
export const STRIPE_PRICES_TEST: StripePrices = {
  TACO_CLUB_MONTHLY: 'price_1Sm564CPMZ8sEjvKCGmRtoZb',
  TACO_CLUB_LIFETIME: 'price_1Sm564CPMZ8sEjvKRuiDExbY',
  SYNC_ALL_MONTHLY: 'price_1Sm4s7CPMZ8sEjvK94OxRR1O',
  SYNC_ALL_YEARLY: 'price_1Sm4sTCPMZ8sEjvKAWdgAz3V',
  SYNC_APP_MONTHLY: 'price_1Sm5JsCPMZ8sEjvK66l5S7yG',
  SYNC_APP_YEARLY: 'price_1Sm5JYCPMZ8sEjvKoGh2rbWj',
  TEMPO_EXTRAS_MONTHLY: 'price_1Sm4nYCPMZ8sEjvKbUqYoog4',
  TEMPO_EXTRAS_YEARLY: 'price_1Sm4oRCPMZ8sEjvK35pjZ6v5',
  TENURE_EXTRAS_MONTHLY: 'price_1Sm4nCCPMZ8sEjvKm7zIFJ3K',
  TENURE_EXTRAS_YEARLY: 'price_1Sm4nCCPMZ8sEjvKYLvfcZmb',
  // TODO: Create Echoprax product in Stripe test mode with $8/mo and $80/year pricing
  ECHOPRAX_EXTRAS_MONTHLY: 'PLACEHOLDER_ECHOPRAX_MONTHLY_TEST',
  ECHOPRAX_EXTRAS_YEARLY: 'PLACEHOLDER_ECHOPRAX_YEARLY_TEST',
} as const;

/**
 * LIVE MODE Price IDs
 * TODO: Replace these with actual live mode price IDs after creating products in Stripe
 * See docs/STRIPE_LIVE_SETUP.md for instructions
 *
 * IMPORTANT: Keep in sync with src/lib/stripe-prices.ts
 */
export const STRIPE_PRICES_LIVE: StripePrices = {
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
// ENVIRONMENT HELPERS
// ============================================================================

/**
 * Check if we're in production environment
 */
export function isProduction(env: StripeEnv): boolean {
  return env.TACO_ENV === 'production';
}

/**
 * Get the appropriate Stripe secret key based on environment
 */
export function getStripeSecretKey(env: StripeEnv): string {
  if (isProduction(env)) {
    const key = env.STRIPE_SECRET_KEY_LIVE || env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('Missing STRIPE_SECRET_KEY_LIVE for production environment');
    }
    return key;
  }

  // Test/staging/preview/local
  const key = env.STRIPE_SECRET_KEY_TEST || env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY_TEST for non-production environment');
  }
  return key;
}

/**
 * Get the appropriate webhook secret based on environment
 */
export function getWebhookSecret(env: StripeEnv): string {
  if (isProduction(env)) {
    const secret = env.STRIPE_WEBHOOK_SECRET_LIVE || env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET_LIVE for production environment');
    }
    return secret;
  }

  // Test/staging/preview/local
  const secret = env.STRIPE_WEBHOOK_SECRET_TEST || env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET_TEST for non-production environment');
  }
  return secret;
}

/**
 * Get configured Stripe client for the current environment
 */
export function getStripeClient(env: StripeEnv): Stripe {
  const secretKey = getStripeSecretKey(env);
  const isProd = isProduction(env);

  billingLog.debug(`Initializing Stripe client for ${isProd ? 'PRODUCTION' : 'TEST'} mode`);

  return new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
  });
}

/**
 * Get price IDs for the current environment
 */
export function getStripePrices(env: StripeEnv): StripePrices {
  return isProduction(env) ? STRIPE_PRICES_LIVE : STRIPE_PRICES_TEST;
}

// ============================================================================
// PRICE TO PRODUCT MAPPING
// ============================================================================

/**
 * Map a Stripe price ID to a product name
 * Works for both test and live mode price IDs
 */
export function mapPriceToProduct(priceId: string | undefined): string | null {
  if (!priceId) return null;

  // Test mode mappings
  const testPriceMap: Record<string, string> = {
    [STRIPE_PRICES_TEST.TACO_CLUB_MONTHLY]: 'taco_club',
    [STRIPE_PRICES_TEST.TACO_CLUB_LIFETIME]: 'taco_club',
    [STRIPE_PRICES_TEST.SYNC_ALL_MONTHLY]: 'sync_all',
    [STRIPE_PRICES_TEST.SYNC_ALL_YEARLY]: 'sync_all',
    [STRIPE_PRICES_TEST.SYNC_APP_MONTHLY]: 'sync_app',
    [STRIPE_PRICES_TEST.SYNC_APP_YEARLY]: 'sync_app',
    [STRIPE_PRICES_TEST.TEMPO_EXTRAS_MONTHLY]: 'tempo_extras',
    [STRIPE_PRICES_TEST.TEMPO_EXTRAS_YEARLY]: 'tempo_extras',
    [STRIPE_PRICES_TEST.TENURE_EXTRAS_MONTHLY]: 'tenure_extras',
    [STRIPE_PRICES_TEST.TENURE_EXTRAS_YEARLY]: 'tenure_extras',
    [STRIPE_PRICES_TEST.ECHOPRAX_EXTRAS_MONTHLY]: 'echoprax_extras',
    [STRIPE_PRICES_TEST.ECHOPRAX_EXTRAS_YEARLY]: 'echoprax_extras',
  };

  // Live mode mappings
  const livePriceMap: Record<string, string> = {
    [STRIPE_PRICES_LIVE.TACO_CLUB_MONTHLY]: 'taco_club',
    [STRIPE_PRICES_LIVE.TACO_CLUB_LIFETIME]: 'taco_club',
    [STRIPE_PRICES_LIVE.SYNC_ALL_MONTHLY]: 'sync_all',
    [STRIPE_PRICES_LIVE.SYNC_ALL_YEARLY]: 'sync_all',
    [STRIPE_PRICES_LIVE.SYNC_APP_MONTHLY]: 'sync_app',
    [STRIPE_PRICES_LIVE.SYNC_APP_YEARLY]: 'sync_app',
    [STRIPE_PRICES_LIVE.TEMPO_EXTRAS_MONTHLY]: 'tempo_extras',
    [STRIPE_PRICES_LIVE.TEMPO_EXTRAS_YEARLY]: 'tempo_extras',
    [STRIPE_PRICES_LIVE.TENURE_EXTRAS_MONTHLY]: 'tenure_extras',
    [STRIPE_PRICES_LIVE.TENURE_EXTRAS_YEARLY]: 'tenure_extras',
    [STRIPE_PRICES_LIVE.ECHOPRAX_EXTRAS_MONTHLY]: 'echoprax_extras',
    [STRIPE_PRICES_LIVE.ECHOPRAX_EXTRAS_YEARLY]: 'echoprax_extras',
  };

  return testPriceMap[priceId] || livePriceMap[priceId] || null;
}

/**
 * Check if a price ID is for TACo Club lifetime
 */
export function isTacoClubLifetime(priceId: string | undefined): boolean {
  if (!priceId) return false;
  return (
    priceId === STRIPE_PRICES_TEST.TACO_CLUB_LIFETIME ||
    priceId === STRIPE_PRICES_LIVE.TACO_CLUB_LIFETIME
  );
}

/**
 * Check if a price ID is for TACo Club monthly
 */
export function isTacoClubMonthly(priceId: string | undefined): boolean {
  if (!priceId) return false;
  return (
    priceId === STRIPE_PRICES_TEST.TACO_CLUB_MONTHLY ||
    priceId === STRIPE_PRICES_LIVE.TACO_CLUB_MONTHLY
  );
}
