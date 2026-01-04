/**
 * Create Checkout Session API
 *
 * Creates a Stripe checkout session for subscription purchases.
 * Requires authentication.
 *
 * POST /api/billing/create-checkout
 * Body: { priceId: string, successUrl?: string, cancelUrl?: string }
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import Stripe from 'stripe';
import { jwtVerify } from 'jose';
import { billingLog } from '../../lib/logger';

interface Env {
  AUTH_DB: D1Database;
  BILLING_DB: D1Database;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required', code: 'UNAUTHORIZED' }),
        { status: 401, headers }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = new TextEncoder().encode(env.JWT_SECRET);

    let userId: string;
    let email: string;

    try {
      const { payload } = await jwtVerify(token, secret);
      userId = payload.userId as string;
      email = payload.email as string;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid session', code: 'INVALID_SESSION' }), {
        status: 401,
        headers,
      });
    }

    // Parse request body
    const body = (await request.json().catch(() => ({}))) as {
      priceId?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    const { priceId, successUrl, cancelUrl } = body;

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Price ID required', code: 'MISSING_PRICE_ID' }),
        { status: 400, headers }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });

    // Get or create Stripe customer
    const user = await env.AUTH_DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

    let customerId = user?.stripe_customer_id as string | null;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to user record
      await env.AUTH_DB.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?')
        .bind(customerId, userId)
        .run();
    }

    // Build URLs
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const defaultSuccessUrl = `${baseUrl}/pricing?success=true`;
    const defaultCancelUrl = `${baseUrl}/pricing?canceled=true`;

    // Determine if this is a one-time payment or subscription
    const price = await stripe.prices.retrieve(priceId);
    const mode = price.type === 'recurring' ? 'subscription' : 'payment';

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || defaultSuccessUrl,
      cancel_url: cancelUrl || defaultCancelUrl,
      metadata: {
        userId,
      },
      subscription_data:
        mode === 'subscription'
          ? {
              metadata: {
                userId,
              },
            }
          : undefined,
      allow_promotion_codes: true,
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    billingLog.error('Checkout error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create checkout session',
        code: 'CHECKOUT_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
