/**
 * Create Checkout Session API
 *
 * Creates a Stripe checkout session for subscription purchases.
 * Requires authentication. Supports multi-item carts.
 *
 * POST /api/billing/create-checkout
 * Body: { items: Array<{ priceId: string, quantity: number }>, successUrl?: string, cancelUrl?: string }
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import Stripe from 'stripe';
import { jwtVerify } from 'jose';
import { billingLog } from '../../lib/logger';
import {
  getStripeClient,
  isTacoClubMonthly,
  isTacoClubLifetime,
  type StripeEnv,
} from '../../lib/stripe';
import { getJwtSecretEncoded, type AuthEnv } from '../../lib/auth-config';

interface Env extends StripeEnv, AuthEnv {
  AUTH_DB: D1Database;
  BILLING_DB: D1Database;
}

interface CartItem {
  priceId: string;
  quantity: number;
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
    const secret = getJwtSecretEncoded(env);

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
      items?: CartItem[];
      successUrl?: string;
      cancelUrl?: string;
    };

    const { items, successUrl, cancelUrl } = body;

    // Validate items array
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items provided', code: 'MISSING_ITEMS' }), {
        status: 400,
        headers,
      });
    }

    if (items.some((item) => !item.priceId || item.quantity < 1)) {
      return new Response(JSON.stringify({ error: 'Invalid cart items', code: 'INVALID_ITEMS' }), {
        status: 400,
        headers,
      });
    }

    billingLog.info(`Checkout with ${items.length} items for user ${userId}`);

    // Soft limit check for LocoTaco founding memberships
    const hasTacoClubItem = items.some(
      (item) => isTacoClubMonthly(item.priceId) || isTacoClubLifetime(item.priceId)
    );

    if (hasTacoClubItem) {
      const countQuery = await env.BILLING_DB.prepare(
        `SELECT COUNT(*) as count 
         FROM subscriptions 
         WHERE product = 'taco_club' 
         AND status IN ('active', 'trialing')
         AND (lifetime_access = 1 OR stripe_subscription_id IS NOT NULL)`
      ).first();

      const currentCount = (countQuery?.count as number) || 0;
      const FOUNDING_MEMBER_LIMIT = 10000;

      if (currentCount >= FOUNDING_MEMBER_LIMIT) {
        billingLog.warn(
          `LocoTaco founding limit reached (${currentCount}/${FOUNDING_MEMBER_LIMIT}). User ${userId} attempting purchase.`
        );
      } else if (currentCount >= 9900) {
        billingLog.info(
          `LocoTaco nearing limit (${currentCount}/${FOUNDING_MEMBER_LIMIT}). User ${userId} purchasing.`
        );
      }
    }

    // Initialize Stripe
    const stripe = getStripeClient(env);

    // Fetch price details from Stripe to determine payment mode
    const pricePromises = items.map((item) => stripe.prices.retrieve(item.priceId));
    let prices: Stripe.Price[];

    try {
      prices = await Promise.all(pricePromises);
    } catch (priceError) {
      billingLog.error('Failed to retrieve price info from Stripe', priceError);
      return new Response(
        JSON.stringify({ error: 'Invalid price ID(s)', code: 'INVALID_PRICE_ID' }),
        { status: 400, headers }
      );
    }

    // Check for mixed payment modes (Stripe doesn't allow mixing in one session)
    const hasRecurring = prices.some((p) => p.type === 'recurring');
    const hasOneTime = prices.some((p) => p.type === 'one_time');

    if (hasRecurring && hasOneTime) {
      billingLog.warn('User attempted mixed payment modes', {
        userId,
        items: items.map((item) => item.priceId),
      });
      return new Response(
        JSON.stringify({
          error:
            'Cannot mix one-time and subscription items in a single checkout. ' +
            'Please purchase them separately.',
          code: 'MIXED_PAYMENT_MODES',
        }),
        { status: 400, headers }
      );
    }

    const mode: 'subscription' | 'payment' = hasRecurring ? 'subscription' : 'payment';

    // Get or create Stripe customer
    const user = await env.AUTH_DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    let customerId = user?.stripe_customer_id as string | null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
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
    const defaultSuccessUrl = `${baseUrl}/pricing?success=true`;
    const defaultCancelUrl = `${baseUrl}/pricing?canceled=true`;

    // Build line_items array
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
      price: item.priceId,
      quantity: item.quantity,
    }));

    billingLog.info('Creating checkout session', { mode, itemCount: line_items.length, userId });

    // Create checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode,
      payment_method_types: ['card'],
      line_items,
      success_url: successUrl || defaultSuccessUrl,
      cancel_url: cancelUrl || defaultCancelUrl,
      metadata: {
        userId,
        itemCount: String(items.length),
      },
      allow_promotion_codes: true,
    };

    if (mode === 'subscription') {
      sessionConfig.subscription_data = {
        metadata: { userId },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    if (items.some((item) => isTacoClubMonthly(item.priceId)) && session.subscription) {
      billingLog.info(`TACo Club monthly checkout created. Schedule will be set up after payment.`);
    }

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
