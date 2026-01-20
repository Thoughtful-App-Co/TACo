/**
 * Validate Session API
 *
 * Validates a session token and returns user info + subscription status.
 * Called by the client on app load to check if user is logged in.
 *
 * POST /api/auth/validate
 * Headers: Authorization: Bearer <token>
 *
 * Returns: {
 *   userId, email, subscriptions: string[],
 *   subscriptionDetails: Record<string, SubscriptionDetail>
 * }
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { jwtVerify } from 'jose';
import { authLog } from '../../lib/logger';
import { getJwtSecretEncoded, type AuthEnv } from '../../lib/auth-config';

interface Env extends AuthEnv {
  AUTH_DB: D1Database;
  BILLING_DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing authorization', code: 'UNAUTHORIZED' }), {
      status: 401,
      headers,
    });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify session token
    const secret = getJwtSecretEncoded(env);
    const { payload } = await jwtVerify(token, secret);

    // Validate token type
    if (payload.type !== 'session') {
      return new Response(JSON.stringify({ error: 'Invalid token type', code: 'INVALID_TOKEN' }), {
        status: 401,
        headers,
      });
    }

    const userId = payload.userId as string;
    const email = payload.email as string;

    // Get fresh subscription data from billing DB
    // Include both active subscriptions AND lifetime access (e.g., TACo Club after 24 payments)
    // Also fetch payment tracking fields for TACo Club progress display
    const subscriptions = await env.BILLING_DB.prepare(
      `
      SELECT 
        product, 
        status, 
        current_period_end, 
        cancel_at_period_end, 
        lifetime_access,
        total_payments,
        max_payments,
        total_paid_cents
      FROM subscriptions 
      WHERE user_id = ? 
        AND (status IN ('active', 'trialing') OR lifetime_access = 1)
    `
    )
      .bind(userId)
      .all();

    const activeProducts = subscriptions.results?.map((s: any) => s.product) || [];

    // Build detailed subscription info for frontend display
    // This allows the Settings page to show payment progress, etc.
    const subscriptionDetails: Record<
      string,
      {
        status: string;
        lifetimeAccess: boolean;
        totalPayments: number | null;
        maxPayments: number | null;
        totalPaidCents: number | null;
        currentPeriodEnd: number | null;
        cancelAtPeriodEnd: boolean;
      }
    > = {};

    for (const sub of subscriptions.results || []) {
      const s = sub as any;
      subscriptionDetails[s.product] = {
        status: s.status,
        lifetimeAccess: s.lifetime_access === 1,
        totalPayments: s.total_payments ?? null,
        maxPayments: s.max_payments ?? null,
        totalPaidCents: s.total_paid_cents ?? null,
        currentPeriodEnd: s.current_period_end ?? null,
        cancelAtPeriodEnd: s.cancel_at_period_end === 1,
      };
    }

    // Get user info from auth DB
    const user = await env.AUTH_DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

    if (!user || user.is_deleted) {
      return new Response(JSON.stringify({ error: 'User not found', code: 'USER_NOT_FOUND' }), {
        status: 401,
        headers,
      });
    }

    return new Response(
      JSON.stringify({
        userId,
        email,
        subscriptions: activeProducts,
        subscriptionDetails,
        stripeCustomerId: user.stripe_customer_id || null,
        createdAt: user.created_at,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    authLog.error('Token validation error:', error);

    // Check if it's an expiration error
    if (error instanceof Error && error.message.includes('exp')) {
      return new Response(JSON.stringify({ error: 'Session expired', code: 'SESSION_EXPIRED' }), {
        status: 401,
        headers,
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid session', code: 'INVALID_SESSION' }), {
      status: 401,
      headers,
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
