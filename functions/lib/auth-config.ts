/**
 * Centralized Auth Configuration
 *
 * Single source of truth for JWT secret selection based on environment.
 * Uses TEST/PROD pattern to keep staging and production secrets separate.
 *
 * Usage:
 *   import { getJwtSecretEncoded } from '../../lib/auth-config';
 *   const secret = getJwtSecretEncoded(env);
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { authLog } from './logger';

// ============================================================================
// TYPES
// ============================================================================

export interface AuthEnv {
  TACO_ENV?: string;
  JWT_SECRET?: string;
  JWT_SECRET_TEST?: string;
  JWT_SECRET_PROD?: string;
}

// ============================================================================
// ENVIRONMENT HELPERS
// ============================================================================

/**
 * Check if we're in production environment
 */
export function isProduction(env: AuthEnv): boolean {
  return env.TACO_ENV === 'production';
}

/**
 * Get the appropriate JWT secret based on environment
 *
 * Priority:
 * 1. If production: JWT_SECRET_PROD
 * 2. If staging/preview: JWT_SECRET_TEST
 * 3. Fallback: JWT_SECRET (for backwards compatibility)
 */
export function getJwtSecret(env: AuthEnv): string {
  if (isProduction(env)) {
    const secret = env.JWT_SECRET_PROD || env.JWT_SECRET;
    if (!secret) {
      throw new Error('Missing JWT_SECRET_PROD for production environment');
    }
    authLog.debug('Using production JWT secret');
    return secret;
  }

  // Test/staging/preview/local
  const secret = env.JWT_SECRET_TEST || env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET_TEST for non-production environment');
  }
  authLog.debug('Using test JWT secret');
  return secret;
}

/**
 * Get JWT secret as encoded bytes (for jose library)
 */
export function getJwtSecretEncoded(env: AuthEnv): Uint8Array {
  return new TextEncoder().encode(getJwtSecret(env));
}
