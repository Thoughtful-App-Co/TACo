# Stripe Billing Integration

**Payment Processor:** Stripe  
**Products:** Sync, Tempo Extras, Tenure Extras, Loco TACo Club  
**Status:** Architecture Design

---

## Products & Pricing

### Stripe Product Structure

| Product ID                | Name                    | Price                | Billing           | Notes            |
| ------------------------- | ----------------------- | -------------------- | ----------------- | ---------------- |
| `prod_sync_all`           | All Apps Sync & Backup  | $3.50/mo or $35/year | Recurring         | Best value       |
| `prod_sync_tempo`         | Tempo Sync              | $2/mo or $20/year    | Recurring         | Per-app          |
| `prod_sync_tenure`        | Tenure Sync             | $2/mo or $20/year    | Recurring         | Per-app          |
| `prod_sync_nurture`       | Nurture Sync            | $2/mo or $20/year    | Recurring         | Per-app          |
| `prod_tempo_extras`       | Tempo Extras            | $12/mo or $120/year  | Recurring         | AI features      |
| `prod_tenure_extras`      | Tenure Extras           | $1/mo base           | Recurring + Usage | Mutations        |
| `prod_taco_club_monthly`  | Loco TACo Club          | $25/mo               | Recurring         | 24 months        |
| `prod_taco_club_lifetime` | Loco TACo Club Lifetime | $500                 | One-time          | Instant lifetime |

### Tenure Extras Pricing (Hybrid Model)

**Base subscription:** $5/month (or $30/year)

- Includes: 20 AI credits/month (10 operations at 2 credits each)
- Includes: Resume parsing, job/role-based mutations, cover letters
- Includes: Trends Dashboard, Analytics, Notifications

**Token Cost per Operation:**

- Resume mutation (job-based): 2 credits
- Resume mutation (role-based): 2 credits
- Cover letter generation: 2 credits

Note: The hybrid metered billing model has been simplified to a fixed monthly allocation with predictable limits.

---

## Stripe Setup

### 1. Create Products

```bash
# All Apps Sync
stripe products create \
  --name="All Apps Sync & Backup" \
  --description="Cloud backup and sync for all current and future apps"

# Create prices (monthly and annual)
stripe prices create \
  --product=prod_sync_all \
  --unit-amount=350 \
  --currency=usd \
  --recurring[interval]=month

stripe prices create \
  --product=prod_sync_all \
  --unit-amount=3500 \
  --currency=usd \
  --recurring[interval]=year

# Tenure Extras (metered billing)
stripe products create \
  --name="Tenure Extras" \
  --description="AI resume mutations and advanced analytics"

# Base price
stripe prices create \
  --product=prod_tenure_extras \
  --unit-amount=100 \
  --currency=usd \
  --recurring[interval]=month

# Metered price for mutations
stripe prices create \
  --product=prod_tenure_extras \
  --currency=usd \
  --billing_scheme=tiered \
  --recurring[interval]=month \
  --recurring[usage_type]=metered \
  --tiers[0][unit_amount]=33 \
  --tiers[0][up_to]=inf
```

### 2. Webhook Configuration

```bash
stripe listen --forward-to localhost:8787/api/stripe/webhook

# Production webhook endpoint
https://thoughtfulappco.com/api/stripe/webhook

# Events to subscribe to:
# - customer.subscription.created
# - customer.subscription.updated
# - customer.subscription.deleted
# - invoice.payment_succeeded
# - invoice.payment_failed
# - checkout.session.completed
```

---

## Implementation

### Checkout Flow

```typescript
// functions/api/billing/create-checkout.ts

import Stripe from 'stripe';

interface Env {
  STRIPE_SECRET_KEY_TEST: string;
  STRIPE_SECRET_KEY_LIVE: string;
  TACO_ENV: string;
  DB: D1Database;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  // Select the correct Stripe key based on environment
  const stripeKey =
    context.env.TACO_ENV === 'production'
      ? context.env.STRIPE_SECRET_KEY_LIVE
      : context.env.STRIPE_SECRET_KEY_TEST;

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
  });

  // Get authenticated user
  const userId = await getUserFromToken(context.request, context.env);
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get user's email
  const user = await context.env.DB.prepare('SELECT email FROM users WHERE id = ?')
    .bind(userId)
    .first();

  // Parse request
  const { priceId, successUrl, cancelUrl } = await context.request.json();

  // Create or get Stripe customer
  let customer = await getStripeCustomer(userId, context.env);
  if (!customer) {
    customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId },
    });

    // Save customer ID
    await context.env.DB.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?')
      .bind(customer.id, userId)
      .run();
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
  });

  return new Response(JSON.stringify({ sessionId: session.id }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### Webhook Handler

```typescript
// functions/api/stripe/webhook.ts

export async function onRequestPost(context: { request: Request; env: Env }) {
  // Select the correct Stripe key based on environment
  const stripeKey =
    context.env.TACO_ENV === 'production'
      ? context.env.STRIPE_SECRET_KEY_LIVE
      : context.env.STRIPE_SECRET_KEY_TEST;

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
  });

  // Verify webhook signature - also environment-specific
  const webhookSecret =
    context.env.TACO_ENV === 'production'
      ? context.env.STRIPE_WEBHOOK_SECRET_LIVE
      : context.env.STRIPE_WEBHOOK_SECRET_TEST;

  const sig = context.request.headers.get('stripe-signature')!;
  const body = await context.request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, context.env);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, context.env);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, context.env);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice, context.env);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice, context.env);
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription, env: Env) {
  const userId = subscription.metadata.userId;
  const product = extractProductFromSubscription(subscription);

  // Upsert subscription in database
  await env.DB.prepare(
    `
      INSERT INTO subscriptions (
        id, user_id, product, status,
        stripe_customer_id, stripe_subscription_id,
        current_period_start, current_period_end,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(stripe_subscription_id) DO UPDATE SET
        status = excluded.status,
        current_period_start = excluded.current_period_start,
        current_period_end = excluded.current_period_end,
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
      subscription.current_period_start * 1000,
      subscription.current_period_end * 1000,
      Date.now(),
      Date.now()
    )
    .run();
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, env: Env) {
  const userId = subscription.metadata.userId;

  // Mark subscription as cancelled
  await env.DB.prepare(
    `
      UPDATE subscriptions
      SET status = 'cancelled', cancelled_at = ?, updated_at = ?
      WHERE stripe_subscription_id = ?
    `
  )
    .bind(Date.now(), Date.now(), subscription.id)
    .run();

  // Trigger backup email
  await triggerCancellationBackup(userId, env);
}
```

---

## Tenure Extras: Metered Billing

### Track Mutation Usage

```typescript
// When user creates a mutation

export async function recordMutationUsage(userId: string, costCents: number, env: Env) {
  // 1. Record in local database for quota tracking
  const month = new Date().toISOString().slice(0, 7); // "2025-01"

  await env.DB.prepare(
    `
      INSERT INTO usage (id, user_id, resource, count, cost_cents, month, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
  )
    .bind(crypto.randomUUID(), userId, 'tenure_mutation', 1, costCents, month, Date.now())
    .run();

  // 2. Report to Stripe for metered billing
  const subscription = await getActiveSubscription(userId, 'tenure_extras', env);

  if (!subscription) return;

  // Select the correct Stripe key based on environment
  const stripeKey =
    env.TACO_ENV === 'production' ? env.STRIPE_SECRET_KEY_LIVE : env.STRIPE_SECRET_KEY_TEST;

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
  });

  // Find the metered price item
  const items = await stripe.subscriptionItems.list({
    subscription: subscription.stripe_subscription_id,
  });

  const meteredItem = items.data.find((item) => item.price.billing_scheme === 'tiered');

  if (meteredItem) {
    // Report usage
    await stripe.subscriptionItems.createUsageRecord(meteredItem.id, {
      quantity: 1, // 1 mutation
      timestamp: Math.floor(Date.now() / 1000),
      action: 'increment',
    });
  }
}
```

### Check Mutation Quota

```typescript
// Before allowing a mutation

export async function checkMutationQuota(
  userId: string,
  env: Env
): Promise<{
  allowed: boolean;
  remaining: number;
  overage: number;
}> {
  const month = new Date().toISOString().slice(0, 7);

  // Get usage this month
  const result = await env.DB.prepare(
    `
      SELECT COUNT(*) as count
      FROM usage
      WHERE user_id = ? AND resource = 'tenure_mutation' AND month = ?
    `
  )
    .bind(userId, month)
    .first();

  const usedThisMonth = result.count || 0;
  const included = 10; // Base subscription includes 10
  const remaining = Math.max(0, included - usedThisMonth);
  const overage = Math.max(0, usedThisMonth - included);

  return {
    allowed: true, // Always allowed (they pay for overage)
    remaining,
    overage,
  };
}
```

---

## Customer Portal

```typescript
// functions/api/billing/portal.ts

export async function onRequestPost(context: { request: Request; env: Env }) {
  // Select the correct Stripe key based on environment
  const stripeKey =
    context.env.TACO_ENV === 'production'
      ? context.env.STRIPE_SECRET_KEY_LIVE
      : context.env.STRIPE_SECRET_KEY_TEST;

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
  });

  const userId = await getUserFromToken(context.request, context.env);
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get Stripe customer
  const customer = await getStripeCustomer(userId, context.env);
  if (!customer) {
    return new Response('No customer found', { status: 404 });
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: 'https://thoughtfulappco.com/account',
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

## Client-Side Integration

### Checkout Button

```typescript
// src/components/billing/CheckoutButton.tsx

import { createSignal } from 'solid-js';
import { useAuth } from '../../lib/auth-context';

interface CheckoutButtonProps {
  priceId: string;
  productName: string;
}

export const CheckoutButton = (props: CheckoutButtonProps) => {
  const auth = useAuth();
  const [loading, setLoading] = createSignal(false);

  async function handleCheckout() {
    if (!auth.user()) {
      // Prompt login first
      await auth.login(prompt('Enter your email:'));
      return;
    }

    setLoading(true);

    try {
      // Create checkout session
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('taco_session_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: props.priceId,
          successUrl: `${window.location.origin}/success?product=${props.productName}`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleCheckout} disabled={loading()}>
      {loading() ? 'Loading...' : `Subscribe to ${props.productName}`}
    </button>
  );
};
```

### Customer Portal Link

```typescript
export const ManageSubscriptionButton = () => {
  const [loading, setLoading] = createSignal(false);

  async function openPortal() {
    setLoading(true);

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('taco_session_token')}`,
        },
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      alert('Failed to open portal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={openPortal} disabled={loading()}>
      Manage Subscription
    </button>
  );
};
```

---

## Cost Analysis

### Stripe Fees

| Transaction Type | Stripe Fee   | Our Cost (1000 users)      |
| ---------------- | ------------ | -------------------------- |
| Subscription     | 2.9% + $0.30 | ~$102/month @ $3.50/mo avg |
| Annual payment   | 2.9% + $0.30 | ~$10/year per user         |
| Metered billing  | 2.9% + $0.30 | Variable based on usage    |

**Revenue:** 1000 users × $3.50/mo = $3,500/month  
**Stripe fees:** ~$102/month  
**Net:** $3,398/month

---

## Testing

```typescript
// Use Stripe test mode

describe('Billing', () => {
  it('creates checkout session', async () => {
    const response = await fetch('/api/billing/create-checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({
        priceId: 'price_test_sync_monthly',
        successUrl: 'http://localhost/success',
        cancelUrl: 'http://localhost/cancel',
      }),
    });

    const { sessionId } = await response.json();
    expect(sessionId).toMatch(/^cs_test_/);
  });

  it('handles webhook events', async () => {
    const event = createTestWebhookEvent('customer.subscription.created');

    const response = await fetch('/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': generateTestSignature(event),
      },
      body: JSON.stringify(event),
    });

    expect(response.status).toBe(200);
  });
});
```

---

## Security Checklist

- [ ] Webhook signature verification (using correct LIVE/TEST secret)
- [ ] API keys stored in Cloudflare secrets (both TEST and LIVE)
- [ ] HTTPS only for all endpoints
- [ ] User authentication before checkout
- [ ] Validate subscription ownership before granting access
- [ ] Rate limit checkout endpoints
- [ ] Log all billing events
- [ ] Monitor for fraudulent activity
- [ ] Verify correct environment selection (TACO_ENV)
- [ ] Never mix test and live keys in the same environment

## Secret Management

### Stripe Secret Naming Pattern

**Why TEST/LIVE suffix?** Cloudflare Pages secrets are shared between preview and production deployments. We use environment-specific suffixes and select at runtime:

```typescript
// This pattern is used throughout all billing code
const stripeKey =
  context.env.TACO_ENV === 'production'
    ? context.env.STRIPE_SECRET_KEY_LIVE
    : context.env.STRIPE_SECRET_KEY_TEST;

const webhookSecret =
  context.env.TACO_ENV === 'production'
    ? context.env.STRIPE_WEBHOOK_SECRET_LIVE
    : context.env.STRIPE_WEBHOOK_SECRET_TEST;
```

### Required Secrets

**Environment-Specific Secrets (set ALL of these):**

- `STRIPE_SECRET_KEY_TEST` - Test mode secret key (sk_test_xxx)
- `STRIPE_SECRET_KEY_LIVE` - Live mode secret key (sk_live_xxx)
- `STRIPE_WEBHOOK_SECRET_TEST` - Test webhook signing secret (whsec_test_xxx)
- `STRIPE_WEBHOOK_SECRET_LIVE` - Live webhook signing secret (whsec_live_xxx)

**Client-Side Keys (set in environment variables):**

- `VITE_STRIPE_PUBLISHABLE_KEY` - For Stripe.js (pk_test_xxx or pk_live_xxx)

### Setting Secrets

```bash
# Cloudflare Dashboard or wrangler CLI
wrangler secret put STRIPE_SECRET_KEY_TEST
wrangler secret put STRIPE_SECRET_KEY_LIVE
wrangler secret put STRIPE_WEBHOOK_SECRET_TEST
wrangler secret put STRIPE_WEBHOOK_SECRET_LIVE

# Local development (.dev.vars)
STRIPE_SECRET_KEY_TEST=sk_test_xxx
STRIPE_SECRET_KEY_LIVE=sk_live_xxx
STRIPE_WEBHOOK_SECRET_TEST=whsec_test_xxx
STRIPE_WEBHOOK_SECRET_LIVE=whsec_live_xxx
```

### Webhook Endpoints

You need TWO separate webhook endpoints in Stripe:

**Test Mode Webhook:**

- URL: `https://thoughtfulappco.com/api/stripe/webhook`
- Secret: `whsec_test_xxx` → Store as `STRIPE_WEBHOOK_SECRET_TEST`
- Used for: Preview deployments (`TACO_ENV=preview` or `staging`)

**Live Mode Webhook:**

- URL: `https://thoughtfulappco.com/api/stripe/webhook` (same URL!)
- Secret: `whsec_live_xxx` → Store as `STRIPE_WEBHOOK_SECRET_LIVE`
- Used for: Production deployment (`TACO_ENV=production`)

The same endpoint handles both, but selects the correct secret based on `TACO_ENV`.

---

## Next Steps

1. [ ] Create Stripe account (use test mode first)
2. [ ] Set up products and prices
3. [ ] Configure webhook endpoint
4. [ ] Implement checkout flow
5. [ ] Build customer portal integration
6. [ ] Test with Stripe test cards
7. [ ] Set up metered billing for Tenure
8. [ ] Go live with production keys

---

## Related Docs

- [Unified Auth System](../auth/UNIFIED_AUTH.md)
- [Backup & Disaster Recovery](../infrastructure/BACKUP_RECOVERY.md)
- [Tempo Sync Integration](../tempo/SYNC_INTEGRATION.md)
- [Tenure Sync Integration](../tenure/SYNC_INTEGRATION.md)
- [Nurture Sync Integration](../nurture/SYNC_INTEGRATION.md)
