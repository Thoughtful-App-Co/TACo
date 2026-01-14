# Staging Environment Setup Guide

This guide covers setting up the TACo staging environment to mirror production while using Stripe test mode for billing.

## Environment Overview

| Aspect             | Local Dev           | Staging                | Production                   |
| ------------------ | ------------------- | ---------------------- | ---------------------------- |
| **URL**            | localhost:3000      | staging.taco.pages.dev | thoughtfulappco.com          |
| **TACO_ENV**       | `development`       | `staging` / `preview`  | `production`                 |
| **Databases**      | Local SQLite        | taco-\*-staging (D1)   | taco-auth, taco-billing (D1) |
| **Stripe Mode**    | Test                | Test                   | Live                         |
| **Stripe Keys**    | sk*test*\*          | sk*test*\*             | sk*live*\*                   |
| **Webhook URL**    | localhost (via CLI) | staging.taco.pages.dev | thoughtfulappco.com          |
| **Deploy Trigger** | Manual              | PR / non-main push     | Push to main                 |

## Architecture: How Environment Switching Works

TACo uses `TACO_ENV` to select the correct secrets at runtime:

```typescript
// In backend code (functions/)
const stripeKey =
  env.TACO_ENV === 'production'
    ? env.STRIPE_SECRET_KEY_LIVE // sk_live_xxx
    : env.STRIPE_SECRET_KEY_TEST; // sk_test_xxx

const webhookSecret =
  env.TACO_ENV === 'production' ? env.STRIPE_WEBHOOK_SECRET_LIVE : env.STRIPE_WEBHOOK_SECRET_TEST;
```

**Why this pattern?** Cloudflare Pages secrets are shared between all deployments (staging and production). We store BOTH test and live secrets, then select the right one based on `TACO_ENV`.

## Step 1: Cloudflare Pages Project Setup

### 1.1 Verify Project Settings

Go to: https://dash.cloudflare.com → Workers & Pages → taco

**Build Configuration:**

- Build command: `pnpm run build`
- Build output directory: `dist`
- Root directory: `/`

**Branch Deployments:**

- Production branch: `main`
- Preview branches: All other branches

### 1.2 Environment Variables (Non-Secret)

In Cloudflare Dashboard → Settings → Environment Variables:

| Variable       | Production Value              | Preview Value                    |
| -------------- | ----------------------------- | -------------------------------- |
| `TACO_ENV`     | `production`                  | `staging`                        |
| `FRONTEND_URL` | `https://thoughtfulappco.com` | `https://staging.taco.pages.dev` |

## Step 2: Database Setup (D1)

### 2.1 Verify Databases Exist

```bash
# List all D1 databases
wrangler d1 list
```

You should see:

- `taco-auth-staging` (staging)
- `taco-billing-staging` (staging)
- `taco-auth` (production)
- `taco-billing` (production)

### 2.2 Apply Migrations to Staging

```bash
# Auth schema
wrangler d1 execute taco-auth-staging --remote --file=migrations/0001_auth_schema.sql

# Billing schema
wrangler d1 execute taco-billing-staging --remote --file=migrations/0002_billing_schema.sql
wrangler d1 execute taco-billing-staging --remote --file=migrations/0003_credits_schema.sql
```

### 2.3 Verify Tables Exist

```bash
# Check auth tables
wrangler d1 execute taco-auth-staging --remote --command="SELECT name FROM sqlite_master WHERE type='table';"

# Check billing tables
wrangler d1 execute taco-billing-staging --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

Expected output:

- Auth: `users`
- Billing: `subscriptions`, `usage`, `credits`, `credit_transactions`

## Step 3: Secrets Setup

### 3.1 Required Secrets Checklist

| Secret                       | Purpose                  | Format            | Required For     |
| ---------------------------- | ------------------------ | ----------------- | ---------------- |
| `JWT_SECRET_TEST`            | Sign tokens (staging)    | 32+ random chars  | All environments |
| `JWT_SECRET_PROD`            | Sign tokens (production) | 32+ random chars  | Production       |
| `STRIPE_SECRET_KEY_TEST`     | Stripe API (test mode)   | `sk_test_xxx`     | Staging          |
| `STRIPE_SECRET_KEY_LIVE`     | Stripe API (live mode)   | `sk_live_xxx`     | Production       |
| `STRIPE_WEBHOOK_SECRET_TEST` | Verify webhooks (test)   | `whsec_xxx`       | Staging          |
| `STRIPE_WEBHOOK_SECRET_LIVE` | Verify webhooks (live)   | `whsec_xxx`       | Production       |
| `RESEND_API_KEY`             | Email delivery           | `re_xxx`          | All              |
| `RESEND_FROM_EMAIL`          | Sender address           | `auth@domain.com` | All              |
| `ANTHROPIC_API_KEY`          | AI features              | `sk-ant-xxx`      | All (optional)   |

### 3.2 Set All Secrets

```bash
# Generate JWT secrets (run twice for test and prod)
openssl rand -base64 32

# Set environment-specific secrets
wrangler secret put JWT_SECRET_TEST
wrangler secret put JWT_SECRET_PROD
wrangler secret put STRIPE_SECRET_KEY_TEST
wrangler secret put STRIPE_SECRET_KEY_LIVE
wrangler secret put STRIPE_WEBHOOK_SECRET_TEST
wrangler secret put STRIPE_WEBHOOK_SECRET_LIVE

# Set shared secrets
wrangler secret put RESEND_API_KEY
wrangler secret put RESEND_FROM_EMAIL
wrangler secret put ANTHROPIC_API_KEY
```

### 3.3 Verify Secrets Are Set

```bash
wrangler secret list
```

## Step 4: Stripe Configuration

### 4.1 Test Mode Setup (for Staging)

**In Stripe Dashboard (Test Mode - toggle in top left):**

1. **Get API Keys:**
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy `Secret key` → This is your `STRIPE_SECRET_KEY_TEST`

2. **Create Webhook Endpoint:**
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - URL: `https://staging.taco.pages.dev/api/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click "Add endpoint"
   - Copy "Signing secret" → This is your `STRIPE_WEBHOOK_SECRET_TEST`

3. **Create Products & Prices:**
   - Products should already exist from development
   - Note: Test mode prices have different IDs than live mode

### 4.2 Live Mode Setup (for Production)

**In Stripe Dashboard (Live Mode):**

1. **Get API Keys:**
   - Go to: https://dashboard.stripe.com/apikeys (no /test/)
   - Copy `Secret key` → This is your `STRIPE_SECRET_KEY_LIVE`

2. **Create Webhook Endpoint:**
   - Go to: https://dashboard.stripe.com/webhooks
   - URL: `https://thoughtfulappco.com/api/stripe/webhook`
   - Same events as test mode
   - Copy "Signing secret" → This is your `STRIPE_WEBHOOK_SECRET_LIVE`

3. **Create Products & Prices:**
   - Must recreate all products in live mode
   - Update `STRIPE_PRICES_LIVE` in code with new price IDs
   - See: `docs/STRIPE_LIVE_SETUP.md`

## Step 5: Deploy to Staging

### 5.1 Push to Non-Main Branch

```bash
# Create staging branch if needed
git checkout -b staging

# Commit and push
git add -A
git commit -m "Deploy to staging"
git push origin staging
```

### 5.2 Or Use PR Preview

Any PR automatically gets a preview deployment at a unique URL.

### 5.3 Check Deployment

Go to: https://dash.cloudflare.com → Workers & Pages → taco → Deployments

Find your staging deployment URL (e.g., `abc123.taco.pages.dev` or `staging.taco.pages.dev`)

## Step 6: Verification Checklist

### 6.1 API Health Check

```bash
# Replace with your staging URL
curl https://staging.taco.pages.dev/api/billing/founding-stats
```

Should return JSON with founding member stats.

### 6.2 Auth Flow

1. Go to staging URL
2. Click "Sign In"
3. Enter email → Should receive magic link email
4. Click link → Should be logged in

### 6.3 Checkout Flow

1. Go to `/pricing`
2. Select TACo Club
3. Click "Continue to Checkout"
4. Use test card: `4242 4242 4242 4242`
5. Complete payment
6. Should redirect back with success modal

### 6.4 Webhook Verification

In Stripe Dashboard → Webhooks → Your staging endpoint:

- Check "Recent events" tab
- Should show `checkout.session.completed` with 200 response

### 6.5 Database Verification

```bash
# Check subscription was created
wrangler d1 execute taco-billing-staging --remote \
  --command="SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;"
```

## Troubleshooting

### Issue: "Not available in this environment" on dev-login

**Cause:** `TACO_ENV` is not set to `development` or `test`

**Solution:** Dev-login only works locally. On staging, use magic link auth.

### Issue: Webhook returns 400 error

**Cause:** Wrong webhook secret

**Solution:**

1. Check Stripe Dashboard for correct signing secret
2. Verify `STRIPE_WEBHOOK_SECRET_TEST` is set correctly
3. Redeploy after setting secret

### Issue: Checkout redirects but no subscription

**Cause:** Webhook not configured or failing

**Solution:**

1. Check Stripe Dashboard → Webhooks → Recent events
2. Look for failed deliveries
3. Check webhook URL is correct
4. Verify all required events are selected

### Issue: "Invalid API Key" errors

**Cause:** Wrong Stripe key for environment

**Solution:**

1. Staging must use `sk_test_xxx` (STRIPE_SECRET_KEY_TEST)
2. Production must use `sk_live_xxx` (STRIPE_SECRET_KEY_LIVE)
3. Verify `TACO_ENV` is correct for the deployment

### Issue: Database tables don't exist

**Cause:** Migrations not run on remote database

**Solution:**

```bash
wrangler d1 execute taco-auth-staging --remote --file=migrations/0001_auth_schema.sql
wrangler d1 execute taco-billing-staging --remote --file=migrations/0002_billing_schema.sql
wrangler d1 execute taco-billing-staging --remote --file=migrations/0003_credits_schema.sql
```

## Quick Reference

### Staging URLs

- App: `https://staging.taco.pages.dev`
- Webhook: `https://staging.taco.pages.dev/api/stripe/webhook`

### Production URLs

- App: `https://thoughtfulappco.com`
- Webhook: `https://thoughtfulappco.com/api/stripe/webhook`

### Wrangler Commands

```bash
# List secrets
wrangler secret list

# Set a secret
wrangler secret put SECRET_NAME

# Query staging database
wrangler d1 execute taco-billing-staging --remote --command="SELECT * FROM subscriptions;"

# Query production database
wrangler d1 execute taco-billing --remote --command="SELECT * FROM subscriptions;"

# View deployment logs
wrangler pages deployment tail
```

### Test Cards (Stripe Test Mode)

| Card Number           | Result             |
| --------------------- | ------------------ |
| `4242 4242 4242 4242` | Success            |
| `4000 0000 0000 0002` | Declined           |
| `4000 0000 0000 9995` | Insufficient funds |

Use any future expiry date and any 3-digit CVC.
