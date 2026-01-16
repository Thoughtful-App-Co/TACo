/**
 * Authentication Middleware for TACo API Endpoints
 *
 * Provides JWT validation, subscription checks, and token management
 * for securing premium API endpoints.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { jwtVerify } from 'jose';
import { authLog } from './logger';
import { getJwtSecretEncoded, type AuthEnv as JwtAuthEnv } from './auth-config';

// D1Database is provided by Cloudflare Workers runtime
// Extends JwtAuthEnv to include TACO_ENV, JWT_SECRET_TEST, JWT_SECRET_PROD
export interface AuthEnv extends JwtAuthEnv {
  AUTH_DB: any; // D1Database from Cloudflare runtime
  BILLING_DB: any; // D1Database from Cloudflare runtime
}

export interface AuthResult {
  userId: string;
  email: string;
  subscriptions: string[];
  tokenBalance?: number;
}

export interface TokenCost {
  resource: string;
  cost: number;
}

/**
 * Validates JWT token and extracts user info
 */
export async function validateAuth(
  request: Request,
  env: AuthEnv
): Promise<{ success: false; response: Response } | { success: true; auth: AuthResult }> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Authentication required',
          code: 'MISSING_AUTH',
          message: 'Please sign in to use this feature',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const secret = getJwtSecretEncoded(env);
    const { payload } = await jwtVerify(token, secret);

    if (payload.type !== 'session') {
      throw new Error('Invalid token type');
    }

    const userId = payload.userId as string;
    const email = payload.email as string;
    const subscriptions = (payload.subscriptions as string[]) || [];

    // Get fresh subscription data from database
    const activeSubscriptions = await env.BILLING_DB.prepare(
      `SELECT product FROM subscriptions 
       WHERE user_id = ? AND status IN ('active', 'trialing')`
    )
      .bind(userId)
      .all();

    const products = activeSubscriptions.results?.map((s: any) => s.product) || [];

    return {
      success: true,
      auth: {
        userId,
        email,
        subscriptions: products,
      },
    };
  } catch (error) {
    authLog.error('Auth validation error:', error);

    if (error instanceof Error && error.message.includes('exp')) {
      return {
        success: false,
        response: new Response(
          JSON.stringify({
            error: 'Session expired',
            code: 'SESSION_EXPIRED',
            message: 'Your session has expired. Please sign in again.',
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
      };
    }

    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Invalid session',
          code: 'INVALID_TOKEN',
          message: 'Your session is invalid. Please sign in again.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }
}

/**
 * Checks if user has required subscription
 */
export function hasSubscription(
  auth: AuthResult,
  requiredProducts: string[]
): { hasAccess: boolean; missingProduct?: string } {
  // TACo Club has access to everything
  if (auth.subscriptions.includes('taco_club')) {
    return { hasAccess: true };
  }

  // Check if user has any of the required products
  const hasRequired = requiredProducts.some((product) => auth.subscriptions.includes(product));

  if (!hasRequired) {
    return {
      hasAccess: false,
      missingProduct: requiredProducts[0], // Return first required product for error message
    };
  }

  return { hasAccess: true };
}

/**
 * Gets user's current token balance
 */
export async function getTokenBalance(userId: string, env: AuthEnv): Promise<number> {
  const result = await env.BILLING_DB.prepare('SELECT balance FROM credits WHERE user_id = ?')
    .bind(userId)
    .first();

  return (result?.balance as number) || 0;
}

/**
 * Checks if user has sufficient tokens and deducts them if successful
 * Returns updated balance on success
 */
export async function deductTokens(
  userId: string,
  cost: number,
  resource: string,
  env: AuthEnv
): Promise<{ success: false; response: Response } | { success: true; newBalance: number }> {
  // Get current balance
  const balance = await getTokenBalance(userId, env);

  if (balance < cost) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Insufficient tokens',
          code: 'INSUFFICIENT_TOKENS',
          message: `This action requires ${cost} token${cost > 1 ? 's' : ''}, but you only have ${balance}. Purchase more tokens to continue.`,
          balance,
          required: cost,
        }),
        {
          status: 402, // Payment Required
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }

  // Deduct tokens and log transaction
  const newBalance = balance - cost;
  const transactionId = crypto.randomUUID();
  const now = Date.now();

  try {
    // Update balance
    await env.BILLING_DB.prepare(
      `UPDATE credits 
       SET balance = ?, 
           lifetime_used = lifetime_used + ?, 
           updated_at = ?
       WHERE user_id = ?`
    )
      .bind(newBalance, cost, now, userId)
      .run();

    // Log transaction
    await env.BILLING_DB.prepare(
      `INSERT INTO credit_transactions 
       (id, user_id, type, amount, balance_after, description, created_at)
       VALUES (?, ?, 'use', ?, ?, ?, ?)`
    )
      .bind(
        transactionId,
        userId,
        -cost,
        newBalance,
        `Used ${cost} token${cost > 1 ? 's' : ''} for ${resource}`,
        now
      )
      .run();

    return {
      success: true,
      newBalance,
    };
  } catch (error) {
    authLog.error('Token deduction error:', error);
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Failed to process token transaction',
          code: 'TOKEN_TRANSACTION_ERROR',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }
}

/**
 * Grants tokens to a user (called from Stripe webhook)
 */
export async function grantTokens(
  userId: string,
  amount: number,
  reason: string,
  env: AuthEnv,
  stripePaymentId?: string
): Promise<void> {
  const now = Date.now();
  const transactionId = crypto.randomUUID();

  // Get current balance or create new record
  const existing = await env.BILLING_DB.prepare('SELECT * FROM credits WHERE user_id = ?')
    .bind(userId)
    .first();

  if (existing) {
    // Update existing record
    const newBalance = (existing.balance as number) + amount;
    await env.BILLING_DB.prepare(
      `UPDATE credits 
       SET balance = ?, 
           lifetime_purchased = lifetime_purchased + ?, 
           updated_at = ?
       WHERE user_id = ?`
    )
      .bind(newBalance, amount, now, userId)
      .run();

    // Log transaction
    await env.BILLING_DB.prepare(
      `INSERT INTO credit_transactions 
       (id, user_id, type, amount, balance_after, description, stripe_payment_id, created_at)
       VALUES (?, ?, 'purchase', ?, ?, ?, ?, ?)`
    )
      .bind(transactionId, userId, amount, newBalance, reason, stripePaymentId || null, now)
      .run();
  } else {
    // Create new record
    await env.BILLING_DB.prepare(
      `INSERT INTO credits 
       (id, user_id, balance, lifetime_purchased, lifetime_used, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`
    )
      .bind(crypto.randomUUID(), userId, amount, amount, now, now)
      .run();

    // Log transaction
    await env.BILLING_DB.prepare(
      `INSERT INTO credit_transactions 
       (id, user_id, type, amount, balance_after, description, stripe_payment_id, created_at)
       VALUES (?, ?, 'purchase', ?, ?, ?, ?, ?)`
    )
      .bind(transactionId, userId, amount, amount, reason, stripePaymentId || null, now)
      .run();
  }

  authLog.info(`Granted ${amount} tokens to user ${userId}: ${reason}`);
}

/**
 * Combined auth check for token-based features (Tenure)
 * Validates JWT, checks subscription, verifies token balance, and deducts tokens
 */
export async function authorizeTokenFeature(
  request: Request,
  env: AuthEnv,
  options: {
    requiredProducts: string[];
    tokenCost: number;
    resourceName: string;
  }
): Promise<
  | { success: false; response: Response }
  | { success: true; auth: AuthResult; newTokenBalance: number }
> {
  // Step 1: Validate authentication
  const authResult = await validateAuth(request, env);
  if (!authResult.success) {
    return authResult;
  }

  const { auth } = authResult;

  // Step 2: Check subscription (TACo Club bypasses token checks)
  if (auth.subscriptions.includes('taco_club')) {
    return {
      success: true,
      auth,
      newTokenBalance: -1, // Unlimited
    };
  }

  const subCheck = hasSubscription(auth, options.requiredProducts);
  if (!subCheck.hasAccess) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Subscription required',
          code: 'SUBSCRIPTION_REQUIRED',
          message: `This feature requires an active ${subCheck.missingProduct} subscription.`,
          requiredProduct: subCheck.missingProduct,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }

  // Step 3: Deduct tokens
  const deductResult = await deductTokens(
    auth.userId,
    options.tokenCost,
    options.resourceName,
    env
  );

  if (!deductResult.success) {
    return deductResult;
  }

  return {
    success: true,
    auth,
    newTokenBalance: deductResult.newBalance,
  };
}

/**
 * Combined auth check for subscription-only features (Tempo - unlimited usage)
 */
export async function authorizeSubscriptionFeature(
  request: Request,
  env: AuthEnv,
  options: {
    requiredProducts: string[];
  }
): Promise<{ success: false; response: Response } | { success: true; auth: AuthResult }> {
  // Step 1: Validate authentication
  const authResult = await validateAuth(request, env);
  if (!authResult.success) {
    return authResult;
  }

  const { auth } = authResult;

  // Step 2: Check subscription
  const subCheck = hasSubscription(auth, options.requiredProducts);
  if (!subCheck.hasAccess) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Subscription required',
          code: 'SUBSCRIPTION_REQUIRED',
          message: `This feature requires an active ${subCheck.missingProduct} subscription.`,
          requiredProduct: subCheck.missingProduct,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }

  return {
    success: true,
    auth,
  };
}
