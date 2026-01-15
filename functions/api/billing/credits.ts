/**
 * Credits API
 *
 * Manages user credit balance for Tenure mutations.
 * Credits are purchased in packs (3 credits = $1).
 *
 * GET /api/billing/credits - Get current balance
 * POST /api/billing/credits/purchase - Create checkout for credit purchase
 * POST /api/billing/credits/use - Deduct credits (internal use)
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { jwtVerify } from 'jose';
import { billingLog } from '../../lib/logger';
import { getStripeClient, type StripeEnv } from '../../lib/stripe';
import { getJwtSecretEncoded, type AuthEnv } from '../../lib/auth-config';

interface Env extends StripeEnv, AuthEnv {
  AUTH_DB: any; // D1Database from Cloudflare runtime
  BILLING_DB: any; // D1Database from Cloudflare runtime
}

const CREDITS_PER_DOLLAR = 3;

// ============================================================================
// GET - Get credit balance
// ============================================================================

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Authenticate
    const userId = await authenticateRequest(request, env);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required', code: 'UNAUTHORIZED' }),
        { status: 401, headers }
      );
    }

    // Get or create credit record
    let credits = await env.BILLING_DB.prepare('SELECT * FROM credits WHERE user_id = ?')
      .bind(userId)
      .first();

    if (!credits) {
      // Create initial record with 0 balance
      const id = crypto.randomUUID();
      await env.BILLING_DB.prepare(
        `
        INSERT INTO credits (id, user_id, balance, lifetime_purchased, lifetime_used, created_at, updated_at)
        VALUES (?, ?, 0, 0, 0, ?, ?)
      `
      )
        .bind(id, userId, Date.now(), Date.now())
        .run();

      credits = { balance: 0, lifetime_purchased: 0, lifetime_used: 0 };
    }

    return new Response(
      JSON.stringify({
        balance: credits.balance,
        lifetimePurchased: credits.lifetime_purchased,
        lifetimeUsed: credits.lifetime_used,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    billingLog.error('Credits error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get credits', code: 'INTERNAL_ERROR' }),
      { status: 500, headers }
    );
  }
}

// ============================================================================
// POST - Purchase credits or use credits
// ============================================================================

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Authenticate
    const userId = await authenticateRequest(request, env);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required', code: 'UNAUTHORIZED' }),
        { status: 401, headers }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: 'purchase' | 'use';
      amount?: number;
      description?: string;
    };

    const { action, amount } = body;

    if (action === 'purchase') {
      return handlePurchase(userId, amount || 3, env, request, headers);
    } else if (action === 'use') {
      return handleUse(userId, amount || 1, body.description || 'Mutation', env, headers);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action', code: 'INVALID_ACTION' }), {
        status: 400,
        headers,
      });
    }
  } catch (error) {
    billingLog.error('Credits error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process credits', code: 'INTERNAL_ERROR' }),
      { status: 500, headers }
    );
  }
}

// ============================================================================
// HANDLERS
// ============================================================================

async function handlePurchase(
  userId: string,
  credits: number,
  env: Env,
  request: Request,
  headers: Record<string, string>
): Promise<Response> {
  // Calculate price: 3 credits = $1
  const packs = Math.ceil(credits / CREDITS_PER_DOLLAR);
  const totalCredits = packs * CREDITS_PER_DOLLAR;
  const priceInCents = packs * 100; // $1 per pack

  // Use centralized Stripe client with environment-aware key selection
  const stripe = getStripeClient(env);

  // Get or create Stripe customer
  const user = await env.AUTH_DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

  let customerId = user?.stripe_customer_id as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email as string,
      metadata: { userId },
    });
    customerId = customer.id;

    await env.AUTH_DB.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?')
      .bind(customerId, userId)
      .run();
  }

  // Build URLs
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  // Create checkout session for one-time payment
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${totalCredits} Tenure Credits`,
            description: `${totalCredits} resume mutation credits`,
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/tenure?credits_purchased=${totalCredits}`,
    cancel_url: `${baseUrl}/tenure?credits_cancelled=true`,
    metadata: {
      userId,
      type: 'credit_purchase',
      credits: totalCredits.toString(),
    },
  });

  return new Response(
    JSON.stringify({
      sessionId: session.id,
      url: session.url,
      credits: totalCredits,
      price: packs,
    }),
    { status: 200, headers }
  );
}

async function handleUse(
  userId: string,
  amount: number,
  description: string,
  env: Env,
  headers: Record<string, string>
): Promise<Response> {
  // Get current balance
  const credits = await env.BILLING_DB.prepare('SELECT * FROM credits WHERE user_id = ?')
    .bind(userId)
    .first();

  const currentBalance = (credits?.balance as number) || 0;

  if (currentBalance < amount) {
    return new Response(
      JSON.stringify({
        error: 'Insufficient credits',
        code: 'INSUFFICIENT_CREDITS',
        balance: currentBalance,
        required: amount,
      }),
      { status: 402, headers }
    );
  }

  const newBalance = currentBalance - amount;
  const now = Date.now();

  // Update balance
  await env.BILLING_DB.prepare(
    `
    UPDATE credits 
    SET balance = ?, lifetime_used = lifetime_used + ?, updated_at = ?
    WHERE user_id = ?
  `
  )
    .bind(newBalance, amount, now, userId)
    .run();

  // Log transaction
  await env.BILLING_DB.prepare(
    `
    INSERT INTO credit_transactions (id, user_id, type, amount, balance_after, description, created_at)
    VALUES (?, ?, 'use', ?, ?, ?, ?)
  `
  )
    .bind(crypto.randomUUID(), userId, -amount, newBalance, description, now)
    .run();

  return new Response(
    JSON.stringify({
      success: true,
      balance: newBalance,
      used: amount,
    }),
    { status: 200, headers }
  );
}

// ============================================================================
// HELPERS
// ============================================================================

async function authenticateRequest(request: Request, env: Env): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const secret = getJwtSecretEncoded(env);

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as string;
  } catch {
    return null;
  }
}

// ============================================================================
// OPTIONS - CORS
// ============================================================================

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
