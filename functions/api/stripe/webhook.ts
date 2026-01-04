/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for subscription lifecycle.
 *
 * POST /api/stripe/webhook
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import Stripe from 'stripe';
import { grantTokens } from '../../lib/auth-middleware';
import { billingLog } from '../../lib/logger';

interface Env {
  AUTH_DB: any; // D1Database from Cloudflare runtime
  BILLING_DB: any; // D1Database from Cloudflare runtime
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
  });

  // Get the signature from headers
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  // Get raw body for signature verification
  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    billingLog.error('Webhook signature verification failed:', err);
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown'}`, {
      status: 400,
    });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, env, stripe);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, env);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, env);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, env);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, env);
        break;

      default:
        billingLog.info(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    billingLog.error('Webhook handler error:', error);
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, env: Env, stripe: Stripe) {
  const userId = session.metadata?.userId;
  if (!userId) {
    billingLog.error('No userId in checkout session metadata');
    return;
  }

  // For subscription checkouts, the subscription.created event handles the DB insert
  // For one-time payments (like TACo Club Lifetime), we handle it here
  if (session.mode === 'payment' && session.payment_status === 'paid') {
    // This is a one-time payment (e.g., TACo Club Lifetime)
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const priceId = lineItems.data[0]?.price?.id;

    // Map price ID to product (you'll need to configure this)
    const product = mapPriceToProduct(priceId);

    if (product) {
      await env.BILLING_DB.prepare(
        `
        INSERT INTO subscriptions (
          id, user_id, product, status, 
          stripe_customer_id, stripe_subscription_id, stripe_price_id,
          current_period_start, current_period_end,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          crypto.randomUUID(),
          userId,
          product,
          'active',
          session.customer as string,
          `one_time_${session.id}`, // Fake subscription ID for one-time purchases
          priceId,
          Date.now(),
          null, // Lifetime = no end date
          Date.now(),
          Date.now()
        )
        .run();

      // Grant tokens for tenure_extras one-time purchases
      if (product === 'tenure_extras') {
        await grantTokens(
          userId,
          10,
          'Tenure Extras one-time purchase - 10 tokens granted',
          env,
          session.payment_intent as string
        );
        billingLog.info(`Granted 10 tokens to user ${userId} for tenure_extras one-time purchase`);
      }
    }
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription, env: Env) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    billingLog.error('No userId in subscription metadata');
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const product = mapPriceToProduct(priceId);

  if (!product) {
    billingLog.error('Unknown price ID:', priceId);
    return;
  }

  // Check if this is a new subscription or renewal
  const existing = await env.BILLING_DB.prepare(
    'SELECT id FROM subscriptions WHERE stripe_subscription_id = ?'
  )
    .bind(subscription.id)
    .first();

  const isNewSubscription = !existing;

  // Upsert subscription
  await env.BILLING_DB.prepare(
    `
    INSERT INTO subscriptions (
      id, user_id, product, status,
      stripe_customer_id, stripe_subscription_id, stripe_price_id,
      current_period_start, current_period_end, cancel_at_period_end,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(stripe_subscription_id) DO UPDATE SET
      status = excluded.status,
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end,
      cancel_at_period_end = excluded.cancel_at_period_end,
      updated_at = excluded.updated_at
  `
  )
    .bind(
      crypto.randomUUID(),
      userId,
      product,
      subscription.status,
      subscription.customer as string,
      subscription.id,
      priceId,
      (subscription as any).current_period_start * 1000,
      (subscription as any).current_period_end * 1000,
      subscription.cancel_at_period_end ? 1 : 0,
      Date.now(),
      Date.now()
    )
    .run();

  // Grant 10 tokens for tenure_extras purchases/renewals
  if (product === 'tenure_extras' && subscription.status === 'active') {
    const reason = isNewSubscription
      ? 'Tenure Extras purchase - 10 tokens granted'
      : 'Tenure Extras renewal - 10 tokens granted';

    await grantTokens(userId, 10, reason, env, subscription.id);
    billingLog.info(
      `Granted 10 tokens to user ${userId} for tenure_extras (${isNewSubscription ? 'new' : 'renewal'})`
    );
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, env: Env) {
  // Mark subscription as cancelled
  await env.BILLING_DB.prepare(
    `
    UPDATE subscriptions 
    SET status = 'cancelled', cancelled_at = ?, updated_at = ?
    WHERE stripe_subscription_id = ?
  `
  )
    .bind(Date.now(), Date.now(), subscription.id)
    .run();

  // TODO: Trigger backup email to user
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, env: Env) {
  // Update subscription period if this is a renewal
  const subscriptionId = (invoice as any).subscription;
  if (subscriptionId) {
    await env.BILLING_DB.prepare(
      `
      UPDATE subscriptions 
      SET status = 'active', updated_at = ?
      WHERE stripe_subscription_id = ?
    `
    )
      .bind(Date.now(), subscriptionId)
      .run();

    // Check if this is a tenure_extras renewal and grant tokens
    const subscription = await env.BILLING_DB.prepare(
      'SELECT user_id, product FROM subscriptions WHERE stripe_subscription_id = ?'
    )
      .bind(subscriptionId)
      .first();

    if (subscription && subscription.product === 'tenure_extras') {
      const userId = subscription.user_id as string;
      await grantTokens(
        userId,
        10,
        'Tenure Extras renewal payment - 10 tokens granted',
        env,
        (invoice as any).payment_intent
      );
      billingLog.info(`Granted 10 tokens to user ${userId} for tenure_extras renewal payment`);
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice, env: Env) {
  // Mark subscription as past_due
  if (invoice.subscription) {
    await env.BILLING_DB.prepare(
      `
      UPDATE subscriptions 
      SET status = 'past_due', updated_at = ?
      WHERE stripe_subscription_id = ?
    `
    )
      .bind(Date.now(), invoice.subscription)
      .run();
  }

  // TODO: Send payment failed email to user
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Map Stripe price ID to product name
 * You'll need to update these with your actual Stripe price IDs
 */
function mapPriceToProduct(priceId: string | undefined): string | null {
  if (!priceId) return null;

  // TODO: Replace with your actual Stripe price IDs
  const priceMap: Record<string, string> = {
    // Sync products
    price_sync_all_monthly: 'sync_all',
    price_sync_all_yearly: 'sync_all',
    price_sync_tempo_monthly: 'sync_tempo',
    price_sync_tempo_yearly: 'sync_tempo',
    price_sync_tenure_monthly: 'sync_tenure',
    price_sync_tenure_yearly: 'sync_tenure',
    price_sync_nurture_monthly: 'sync_nurture',
    price_sync_nurture_yearly: 'sync_nurture',

    // Extras
    price_tempo_extras_monthly: 'tempo_extras',
    price_tempo_extras_yearly: 'tempo_extras',
    price_tenure_extras_monthly: 'tenure_extras',

    // TACo Club
    price_taco_club_monthly: 'taco_club',
    price_taco_club_lifetime: 'taco_club',
  };

  return priceMap[priceId] || null;
}
