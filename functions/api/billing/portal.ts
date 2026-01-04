/**
 * Customer Portal API
 *
 * Creates a Stripe customer portal session for subscription management.
 * Requires authentication.
 *
 * POST /api/billing/portal
 * Body: { returnUrl?: string }
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import Stripe from 'stripe';
import { jwtVerify } from 'jose';

interface Env {
  AUTH_DB: D1Database;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_SECRET_KEY_TEST?: string;
  STRIPE_SECRET_KEY_LIVE?: string;
  TACO_ENV?: string;
  FRONTEND_URL?: string;
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

      if (payload.type !== 'session') {
        throw new Error('Invalid token type');
      }

      userId = payload.userId as string;
      email = payload.email as string;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid session', code: 'INVALID_SESSION' }), {
        status: 401,
        headers,
      });
    }

    // Get user's Stripe customer ID
    const user = await env.AUTH_DB.prepare('SELECT stripe_customer_id FROM users WHERE id = ?')
      .bind(userId)
      .first();

    const customerId = user?.stripe_customer_id as string | null;

    if (!customerId) {
      return new Response(
        JSON.stringify({
          error: 'No billing account found. Make a purchase to set up billing.',
          code: 'NO_CUSTOMER',
        }),
        { status: 404, headers }
      );
    }

    // Parse request body
    const body = (await request.json().catch(() => ({}))) as { returnUrl?: string };

    // Build return URL
    const url = new URL(request.url);
    const baseUrl = env.FRONTEND_URL || `${url.protocol}//${url.host}`;
    const returnUrl = body.returnUrl || `${baseUrl}/`;

    // Select correct Stripe key (support both old and new env var names)
    const stripeKey =
      env.TACO_ENV === 'production'
        ? env.STRIPE_SECRET_KEY_LIVE || env.STRIPE_SECRET_KEY
        : env.STRIPE_SECRET_KEY_TEST || env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      console.error('Missing Stripe key for environment:', env.TACO_ENV);
      return new Response(
        JSON.stringify({ error: 'Billing configuration error', code: 'CONFIG_ERROR' }),
        { status: 500, headers }
      );
    }

    // Initialize Stripe and create portal session
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    console.log(`Billing portal created for user ${email} (${customerId})`);

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers });
  } catch (error) {
    console.error('Portal error:', error);

    let errorMessage = 'Failed to create portal session';
    let errorCode = 'PORTAL_ERROR';

    if (error instanceof Error) {
      if (error.message.includes('No such customer')) {
        errorMessage = 'Customer not found in Stripe';
        errorCode = 'STRIPE_CUSTOMER_NOT_FOUND';
      }
    }

    return new Response(JSON.stringify({ error: errorMessage, code: errorCode }), {
      status: 500,
      headers,
    });
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
