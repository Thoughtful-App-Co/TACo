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
import {
  getStripeClient,
  getWebhookSecret,
  getStripePrices,
  mapPriceToProduct,
  isTacoClubLifetime,
  isTacoClubMonthly,
  type StripeEnv,
} from '../../lib/stripe';

// Re-export for backwards compatibility
export { getStripePrices as STRIPE_PRICES } from '../../lib/stripe';

interface Env extends StripeEnv {
  AUTH_DB: any; // D1Database from Cloudflare runtime
  BILLING_DB: any; // D1Database from Cloudflare runtime
  JWT_SECRET: string;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  // Use centralized Stripe client with environment-aware key selection
  const stripe = getStripeClient(env);
  const webhookSecret = getWebhookSecret(env);

  // Get the signature from headers
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  // Get raw body for signature verification
  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
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

    // Map price ID to product (using centralized mapper)
    const product = mapPriceToProduct(priceId);

    // Check if this is TACo Club lifetime purchase
    const isLifetime = isTacoClubLifetime(priceId);

    if (product) {
      await env.BILLING_DB.prepare(
        `
        INSERT INTO subscriptions (
          id, user_id, product, status, 
          stripe_customer_id, stripe_subscription_id, stripe_price_id,
          current_period_start, current_period_end,
          lifetime_access, total_paid_cents,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          isLifetime ? 1 : 0, // lifetime_access
          isLifetime ? 50000 : 0, // $500 in cents
          Date.now(),
          Date.now()
        )
        .run();

      if (isLifetime) {
        billingLog.info(`TaCo Club lifetime access granted to user ${userId}`);
      }

      // Grant tokens for tenure_extras one-time purchases
      if (product === 'tenure_extras') {
        await grantTokens(
          userId,
          20,
          'Tenure Extras one-time purchase - 20 tokens granted',
          env,
          session.payment_intent as string
        );
        billingLog.info(`Granted 20 tokens to user ${userId} for tenure_extras one-time purchase`);
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

  // Process ALL items in the subscription (multi-product support)
  const items = subscription.items.data;
  if (!items || items.length === 0) {
    billingLog.error('No items in subscription');
    return;
  }

  billingLog.info(
    `Processing subscription ${subscription.id} with ${items.length} items for user ${userId}`
  );

  // Track which products we're processing for token grants
  const processedProducts: string[] = [];
  let hasTacoClubMonthly = false;
  let tacoClubPriceId: string | null = null;

  // Process each line item in the subscription
  for (const item of items) {
    const priceId = item.price?.id;
    const product = mapPriceToProduct(priceId);

    if (!product) {
      billingLog.warn(`Unknown price ID in subscription item: ${priceId}`);
      continue;
    }

    billingLog.info(`Processing item: ${product} (price: ${priceId})`);

    // Check if this specific product already exists for this subscription
    const existing = await env.BILLING_DB.prepare(
      'SELECT id FROM subscriptions WHERE stripe_subscription_id = ? AND product = ?'
    )
      .bind(subscription.id, product)
      .first();

    const isNewProduct = !existing;

    // Upsert subscription record for this product
    // Uses composite unique key: (stripe_subscription_id, product)
    await env.BILLING_DB.prepare(
      `
      INSERT INTO subscriptions (
        id, user_id, product, status,
        stripe_customer_id, stripe_subscription_id, stripe_price_id,
        current_period_start, current_period_end, cancel_at_period_end,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(stripe_subscription_id, product) DO UPDATE SET
        status = excluded.status,
        stripe_price_id = excluded.stripe_price_id,
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

    processedProducts.push(product);

    // Track TACo Club for schedule setup
    if (isTacoClubMonthly(priceId)) {
      hasTacoClubMonthly = true;
      tacoClubPriceId = priceId;
    }

    // Grant tokens for new tenure_extras
    if (product === 'tenure_extras' && subscription.status === 'active' && isNewProduct) {
      await grantTokens(
        userId,
        20,
        'Tenure Extras purchase - 20 tokens granted',
        env,
        subscription.id
      );
      billingLog.info(`Granted 20 tokens to user ${userId} for new tenure_extras`);
    }
  }

  billingLog.info(
    `Processed products for subscription ${subscription.id}: ${processedProducts.join(', ')}`
  );

  // Set up 24-month subscription schedule for TACo Club monthly
  // Only do this once per subscription, not per item
  if (hasTacoClubMonthly && tacoClubPriceId && subscription.status === 'active') {
    // Check if schedule already exists
    const existingSchedule = await env.BILLING_DB.prepare(
      'SELECT max_payments FROM subscriptions WHERE stripe_subscription_id = ? AND product = ? AND max_payments IS NOT NULL'
    )
      .bind(subscription.id, 'taco_club')
      .first();

    if (!existingSchedule) {
      try {
        const stripeForSchedule = getStripeClient(env);

        // Get the current subscription to migrate it to a schedule
        const schedule = await stripeForSchedule.subscriptionSchedules.create({
          from_subscription: subscription.id,
        });

        const startTime = (subscription as any).current_period_start as number;
        const endTime = startTime + 24 * 30 * 24 * 60 * 60; // 24 months in seconds

        await stripeForSchedule.subscriptionSchedules.update(schedule.id, {
          end_behavior: 'cancel',
          phases: [
            {
              items: items.map((item) => ({ price: item.price.id, quantity: item.quantity })),
              start_date: startTime,
              end_date: endTime,
              metadata: {
                userId,
                reason: 'TACo Club 24-month subscription',
              },
            },
          ],
        });

        // Update TACo Club record with schedule info
        await env.BILLING_DB.prepare(
          `UPDATE subscriptions SET 
            total_payments = 0,
            max_payments = 24,
            updated_at = ?
          WHERE stripe_subscription_id = ? AND product = 'taco_club'`
        )
          .bind(Date.now(), subscription.id)
          .run();

        billingLog.info(`Created 24-month subscription schedule for TACo Club user ${userId}`);
      } catch (scheduleError) {
        billingLog.error('Failed to create subscription schedule:', scheduleError);
        // Don't fail the whole webhook - subscriptions are still valid
      }
    }
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
  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId) return;

  // Get subscription from our database
  const subscription = await env.BILLING_DB.prepare(
    'SELECT user_id, product, total_payments, max_payments FROM subscriptions WHERE stripe_subscription_id = ?'
  )
    .bind(subscriptionId)
    .first();

  if (!subscription) return;

  const userId = subscription.user_id as string;
  const product = subscription.product as string;
  const totalPayments = (subscription.total_payments as number) || 0;
  const maxPayments = subscription.max_payments as number | null;

  // Increment payment count and update status
  const newPaymentCount = totalPayments + 1;
  const amountPaidCents = invoice.amount_paid || 0;

  await env.BILLING_DB.prepare(
    `UPDATE subscriptions 
     SET status = 'active', 
         total_payments = ?,
         total_paid_cents = total_paid_cents + ?,
         updated_at = ?
     WHERE stripe_subscription_id = ?`
  )
    .bind(newPaymentCount, amountPaidCents, Date.now(), subscriptionId)
    .run();

  billingLog.info(
    `Payment ${newPaymentCount}/${maxPayments || '∞'} succeeded for ${product} (user: ${userId})`
  );

  // Check if TaCo Club has reached 24 payments - grant lifetime access
  if (product === 'taco_club' && maxPayments && newPaymentCount >= maxPayments) {
    // Grant lifetime access - subscription will auto-cancel via schedule
    await env.BILLING_DB.prepare(
      `UPDATE subscriptions 
       SET lifetime_access = 1, updated_at = ?
       WHERE stripe_subscription_id = ?`
    )
      .bind(Date.now(), subscriptionId)
      .run();

    billingLog.info(
      `TaCo Club lifetime access earned! User ${userId} completed ${newPaymentCount} payments.`
    );

    // TODO: Send congratulations email
  }

  // Grant tokens for tenure_extras renewals
  if (product === 'tenure_extras') {
    await grantTokens(
      userId,
      20,
      'Tenure Extras renewal payment - 20 tokens granted',
      env,
      (invoice as any).payment_intent
    );
    billingLog.info(`Granted 20 tokens to user ${userId} for tenure_extras renewal payment`);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice, env: Env) {
  // Mark subscription as past_due
  // Handle both string ID and expanded Subscription object
  const rawSubscription = (invoice as any).subscription;
  const subscriptionId =
    typeof rawSubscription === 'string' ? rawSubscription : (rawSubscription?.id ?? null);

  if (subscriptionId) {
    await env.BILLING_DB.prepare(
      `
      UPDATE subscriptions 
      SET status = 'past_due', updated_at = ?
      WHERE stripe_subscription_id = ?
    `
    )
      .bind(Date.now(), subscriptionId)
      .run();
  }

  // TODO: Send payment failed email to user
}

// ============================================================================
// HELPERS
// ============================================================================

// mapPriceToProduct is now imported from ../../lib/stripe
