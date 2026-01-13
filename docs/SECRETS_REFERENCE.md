# TACo Secrets Reference

**Single-source-of-truth for all secrets and environment variables in the TACo project.**

This document provides a complete reference for managing secrets across local development, staging, and production environments. Bookmark this page for quick reference.

---

## Table of Contents

- [Overview: Why TEST/LIVE Pattern](#overview-why-testlive-pattern)
- [Complete Secrets List](#complete-secrets-list)
- [Setup Commands](#setup-commands)
- [Local Development (.dev.vars)](#local-development-devvars)
- [Code Usage: Selecting Secrets at Runtime](#code-usage-selecting-secrets-at-runtime)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview: Why TEST/LIVE Pattern

### The Problem

Cloudflare Pages **shares the same secrets between preview and production environments**. This creates a challenge:

- **Preview deployments** (from pull requests) need to use test API keys and test databases
- **Production deployments** (from main branch) need to use live API keys and production databases

If we use a single secret like `STRIPE_SECRET_KEY`, both environments would share the same value, which means preview deployments would either:

1. Use live Stripe keys and accidentally charge real customers, OR
2. Use test Stripe keys and production would use test keys (broken)

### The Solution: TEST/LIVE Suffix Pattern

We use **two versions of each environment-specific secret** with `_TEST` and `_LIVE` (or `_PROD`) suffixes:

```
JWT_SECRET_TEST=test-secret-here
JWT_SECRET_PROD=production-secret-here
```

At **runtime**, the code checks the `TACO_ENV` environment variable and selects the appropriate secret:

```typescript
const jwtSecret = env.TACO_ENV === 'production' ? env.JWT_SECRET_PROD : env.JWT_SECRET_TEST;
```

### How TACO_ENV Works

| Environment | Branch      | TACO_ENV Value | Secrets Used         |
| ----------- | ----------- | -------------- | -------------------- |
| Local Dev   | any         | `"staging"`    | `*_TEST`             |
| Preview     | PR branches | `"preview"`    | `*_TEST`             |
| Staging     | staging     | `"staging"`    | `*_TEST`             |
| Production  | main        | `"production"` | `*_PROD` or `*_LIVE` |

**Note:** For shared secrets (like `ONET_API_KEY`) that don't differ between environments, we use a single value without suffixes.

---

## Complete Secrets List

### Environment-Specific Secrets

These secrets have **TEST** and **LIVE/PROD** versions. You must set **BOTH** in Cloudflare Pages.

| Secret Name                  | Purpose                                  | Where to Get                                                         | Test vs Live     |
| ---------------------------- | ---------------------------------------- | -------------------------------------------------------------------- | ---------------- |
| `JWT_SECRET_TEST`            | JWT signing for auth tokens (test)       | Generate with `openssl rand -base64 32`                              | Different values |
| `JWT_SECRET_PROD`            | JWT signing for auth tokens (production) | Generate with `openssl rand -base64 32`                              | Different values |
| `STRIPE_SECRET_KEY_TEST`     | Stripe API key (test mode)               | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → Test mode | `sk_test_xxx`    |
| `STRIPE_SECRET_KEY_LIVE`     | Stripe API key (live mode)               | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → Live mode | `sk_live_xxx`    |
| `STRIPE_WEBHOOK_SECRET_TEST` | Stripe webhook verification (test)       | `stripe listen --forward-to localhost:8787/api/stripe/webhook`       | `whsec_test_xxx` |
| `STRIPE_WEBHOOK_SECRET_LIVE` | Stripe webhook verification (live)       | [Stripe Webhooks](https://dashboard.stripe.com/webhooks)             | `whsec_live_xxx` |

**Important:**

- JWT secrets should be **32+ characters** and **cryptographically random**
- Use **different** JWT secrets for test and production to prevent token reuse
- Stripe test keys start with `sk_test_`, live keys start with `sk_live_`

### Shared Secrets

These secrets use the **same value** across all environments. Set once in Cloudflare Pages.

| Secret Name         | Purpose                                      | Where to Get                                                      | Rate Limits / Notes                               |
| ------------------- | -------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------- |
| `RESEND_API_KEY`    | Email delivery for magic links               | [Resend API Keys](https://resend.com/api-keys)                    | Free: 100 emails/day, starts with `re_`           |
| `RESEND_FROM_EMAIL` | Verified sender email address                | [Resend Domains](https://resend.com/domains)                      | Must verify domain/email first                    |
| `ANTHROPIC_API_KEY` | Claude AI for resume/cover letter generation | [Anthropic Console](https://console.anthropic.com/)               | Optional with BYOK feature, starts with `sk-ant-` |
| `ONET_API_KEY`      | O\*NET career data and assessments           | [O\*NET Web Services](https://services.onetcenter.org/reference/) | 10 requests/min per IP                            |
| `BLS_API_KEY`       | Bureau of Labor Statistics data              | [BLS Registration](https://data.bls.gov/registrationEngine/)      | Free: 500 requests/day                            |
| `GUARDIAN_API_KEY`  | The Guardian news API (Paper Trail)          | [The Guardian API](https://open-platform.theguardian.com/access/) | Free: 5,000 requests/day                          |
| `GNEWS_API_KEY`     | GNews API (Paper Trail)                      | [GNews.io](https://gnews.io/)                                     | Free: 100 requests/day                            |

### Public Variables (Non-Secret)

These are **not secrets** and are set in `wrangler.toml` as `[vars]`:

| Variable Name            | Purpose                         | Values                                       |
| ------------------------ | ------------------------------- | -------------------------------------------- |
| `TACO_ENV`               | Determines which secrets to use | `"staging"`, `"preview"`, or `"production"`  |
| `STRIPE_PUBLISHABLE_KEY` | Stripe client-side key (public) | `pk_test_xxx` (test) or `pk_live_xxx` (live) |

**Note:** `STRIPE_PUBLISHABLE_KEY` should be set as a **public environment variable**, not a secret, since it's exposed to the client.

---

## Setup Commands

### For Local Development

**Step 1:** Copy the example file

```bash
cp .dev.vars.example .dev.vars
```

**Step 2:** Edit `.dev.vars` and add your values

```bash
# Use your favorite editor
nano .dev.vars
# OR
code .dev.vars
```

**Important:**

- `.dev.vars` is **gitignored** and never committed
- Only set `*_TEST` versions for local development
- Generate JWT secrets: `openssl rand -base64 32`

### For Cloudflare Pages (Staging + Production)

You have two options: Cloudflare Dashboard (recommended) or Wrangler CLI.

#### Option 1: Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)
2. Select your **taco** project
3. Go to **Settings** → **Environment Variables**
4. Add **both** TEST and LIVE versions of each secret:

**Environment-Specific Secrets (add all pairs):**

```
JWT_SECRET_TEST = your-test-jwt-secret-here
JWT_SECRET_PROD = your-production-jwt-secret-here
STRIPE_SECRET_KEY_TEST = sk_test_xxx
STRIPE_SECRET_KEY_LIVE = sk_live_xxx
STRIPE_WEBHOOK_SECRET_TEST = whsec_test_xxx
STRIPE_WEBHOOK_SECRET_LIVE = whsec_live_xxx
```

**Shared Secrets (add once):**

```
RESEND_API_KEY = re_xxx
RESEND_FROM_EMAIL = auth@thoughtfulappco.com
ANTHROPIC_API_KEY = sk-ant-xxx
ONET_API_KEY = your-onet-key
BLS_API_KEY = your-bls-key
GUARDIAN_API_KEY = your-guardian-key
GNEWS_API_KEY = your-gnews-key
```

#### Option 2: Wrangler CLI

**Note:** This method is not recommended for Cloudflare Pages. Use the dashboard instead. These commands are for reference only.

```bash
# Environment-specific secrets (set BOTH test and live)
wrangler secret put JWT_SECRET_TEST
wrangler secret put JWT_SECRET_PROD
wrangler secret put STRIPE_SECRET_KEY_TEST
wrangler secret put STRIPE_SECRET_KEY_LIVE
wrangler secret put STRIPE_WEBHOOK_SECRET_TEST
wrangler secret put STRIPE_WEBHOOK_SECRET_LIVE

# Shared secrets (set once)
wrangler secret put RESEND_API_KEY
wrangler secret put RESEND_FROM_EMAIL
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put ONET_API_KEY
wrangler secret put BLS_API_KEY
wrangler secret put GUARDIAN_API_KEY
wrangler secret put GNEWS_API_KEY
```

**Important:** After entering each command, Wrangler will prompt you to paste the secret value. The value will not be displayed on screen.

---

## Local Development (.dev.vars)

For local development with `pnpm run dev`, create a `.dev.vars` file in the project root:

### Minimal Setup (Required)

```bash
# JWT Secret (test only for local dev)
JWT_SECRET_TEST=your-local-jwt-secret-min-32-chars

# Stripe (test mode only)
STRIPE_SECRET_KEY_TEST=sk_test_your-test-key
STRIPE_WEBHOOK_SECRET_TEST=whsec_test_your-webhook-secret

# Email (required for magic links)
RESEND_API_KEY=re_your-resend-key
RESEND_FROM_EMAIL=auth@thoughtfulappco.com
```

### Full Setup (All Features)

```bash
# =============================================================================
# ENVIRONMENT-SPECIFIC SECRETS (use TEST suffix for local development)
# =============================================================================

# JWT Secrets - Generate with: openssl rand -base64 32
JWT_SECRET_TEST=your-test-jwt-secret-at-least-32-chars
JWT_SECRET_PROD=your-production-jwt-secret-different-from-test

# Stripe API Keys - Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY_TEST=sk_test_your-stripe-secret-key
STRIPE_SECRET_KEY_LIVE=sk_live_your-production-stripe-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# Stripe Webhook Secrets
# TEST: stripe listen --forward-to localhost:8787/api/stripe/webhook
# LIVE: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET_TEST=whsec_test_your-webhook-secret
STRIPE_WEBHOOK_SECRET_LIVE=whsec_live_your-production-webhook

# =============================================================================
# SHARED SECRETS (same for all environments)
# =============================================================================

# Resend - Get from: https://resend.com/api-keys
RESEND_API_KEY=re_your-resend-api-key
RESEND_FROM_EMAIL=auth@thoughtfulappco.com

# Anthropic Claude - Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-key-here

# O*NET - Register at: https://services.onetcenter.org/reference/
ONET_API_KEY=your-onet-api-key-here

# BLS - Register at: https://data.bls.gov/registrationEngine/
BLS_API_KEY=your-bls-registration-key-here

# The Guardian - Get from: https://open-platform.theguardian.com/access/
GUARDIAN_API_KEY=your-guardian-api-key-here

# GNews - Get from: https://gnews.io/
GNEWS_API_KEY=your-gnews-api-key-here
```

### Testing Stripe Webhooks Locally

To test Stripe webhooks in local development:

1. **Install Stripe CLI:**

   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Other platforms: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe:**

   ```bash
   stripe login
   ```

3. **Forward webhooks to local dev server:**

   ```bash
   stripe listen --forward-to localhost:8787/api/stripe/webhook
   ```

4. **Copy the webhook secret** (starts with `whsec_test_`) to your `.dev.vars`:

   ```bash
   STRIPE_WEBHOOK_SECRET_TEST=whsec_test_xxx_from_stripe_cli
   ```

5. **Trigger test events:**
   ```bash
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.updated
   ```

---

## Code Usage: Selecting Secrets at Runtime

### How to Access Environment-Specific Secrets

In your Cloudflare Pages Functions, check `env.TACO_ENV` to select the correct secret:

```typescript
interface Env {
  TACO_ENV: 'production' | 'staging' | 'preview';
  JWT_SECRET_TEST: string;
  JWT_SECRET_PROD: string;
  STRIPE_SECRET_KEY_TEST: string;
  STRIPE_SECRET_KEY_LIVE: string;
  STRIPE_WEBHOOK_SECRET_TEST: string;
  STRIPE_WEBHOOK_SECRET_LIVE: string;
}

export async function onRequest(context: { env: Env }) {
  const { env } = context;

  // Select JWT secret based on environment
  const jwtSecret = env.TACO_ENV === 'production' ? env.JWT_SECRET_PROD : env.JWT_SECRET_TEST;

  // Select Stripe keys based on environment
  const stripeSecretKey =
    env.TACO_ENV === 'production' ? env.STRIPE_SECRET_KEY_LIVE : env.STRIPE_SECRET_KEY_TEST;

  const stripeWebhookSecret =
    env.TACO_ENV === 'production' ? env.STRIPE_WEBHOOK_SECRET_LIVE : env.STRIPE_WEBHOOK_SECRET_TEST;

  // Use the selected secrets
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-12-18.acacia',
  });

  // ...
}
```

### Current Implementation

**Note:** The current codebase uses single secret names (`JWT_SECRET`, `STRIPE_SECRET_KEY`, etc.) without the TEST/LIVE pattern. You'll need to update the code to implement the pattern above.

**Files that need updating:**

- `functions/api/auth/request-magic-link.ts` - Uses `JWT_SECRET`
- `functions/api/auth/verify.ts` - Uses `JWT_SECRET`
- `functions/api/auth/validate.ts` - Uses `JWT_SECRET`
- `functions/api/billing/create-checkout.ts` - Uses `JWT_SECRET`, `STRIPE_SECRET_KEY`
- `functions/api/billing/portal.ts` - Uses `JWT_SECRET`, `STRIPE_SECRET_KEY`
- `functions/api/billing/credits.ts` - Uses `JWT_SECRET`
- `functions/api/stripe/webhook.ts` - Uses `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**Example migration:**

```typescript
// Before (current code)
interface Env {
  JWT_SECRET: string;
}

export async function onRequest({ env }: { env: Env }) {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
}

// After (with TEST/LIVE pattern)
interface Env {
  TACO_ENV: 'production' | 'staging' | 'preview';
  JWT_SECRET_TEST: string;
  JWT_SECRET_PROD: string;
}

export async function onRequest({ env }: { env: Env }) {
  const jwtSecret = env.TACO_ENV === 'production' ? env.JWT_SECRET_PROD : env.JWT_SECRET_TEST;
  const secret = new TextEncoder().encode(jwtSecret);
}
```

### Helper Function Pattern

To reduce repetition, create a helper function:

```typescript
// lib/secrets.ts
export function getSecret(
  env: Env,
  secretName: 'JWT_SECRET' | 'STRIPE_SECRET_KEY' | 'STRIPE_WEBHOOK_SECRET'
): string {
  const isProduction = env.TACO_ENV === 'production';

  switch (secretName) {
    case 'JWT_SECRET':
      return isProduction ? env.JWT_SECRET_PROD : env.JWT_SECRET_TEST;
    case 'STRIPE_SECRET_KEY':
      return isProduction ? env.STRIPE_SECRET_KEY_LIVE : env.STRIPE_SECRET_KEY_TEST;
    case 'STRIPE_WEBHOOK_SECRET':
      return isProduction ? env.STRIPE_WEBHOOK_SECRET_LIVE : env.STRIPE_WEBHOOK_SECRET_TEST;
  }
}

// Usage in functions
import { getSecret } from '../lib/secrets';

export async function onRequest({ env }: { env: Env }) {
  const jwtSecret = getSecret(env, 'JWT_SECRET');
  const stripeKey = getSecret(env, 'STRIPE_SECRET_KEY');
}
```

---

## Security Best Practices

### Never Commit Secrets

**Files that MUST be gitignored:**

- `.dev.vars` - Your local development secrets
- `.env` - Any environment files
- `*.key`, `*.pem` - Private keys
- `.wrangler/` - Contains local database files

**Already gitignored:** These files are already in `.gitignore`:

```gitignore
.dev.vars
.env
.env.*
.wrangler/
```

### Secret Generation

**JWT Secrets:**

```bash
# Generate a secure 32-byte random secret
openssl rand -base64 32

# Generate two different secrets (test and production)
echo "JWT_SECRET_TEST=$(openssl rand -base64 32)"
echo "JWT_SECRET_PROD=$(openssl rand -base64 32)"
```

**Requirements:**

- Minimum 32 characters
- Cryptographically random (use `openssl rand`, not keyboard mashing)
- Different values for test and production

### Rotate Secrets Regularly

**When to rotate:**

- Every 90 days (recommended)
- When a team member leaves
- If a secret is accidentally exposed
- After a security incident

**How to rotate JWT secrets:**

1. Generate new secrets:

   ```bash
   openssl rand -base64 32
   ```

2. Update Cloudflare Pages environment variables:
   - Set new `JWT_SECRET_TEST`
   - Set new `JWT_SECRET_PROD`

3. Redeploy the application

4. **Important:** All existing user sessions will be invalidated. Users will need to log in again.

**How to rotate Stripe secrets:**

1. Create new API keys in Stripe Dashboard
2. Update Cloudflare Pages environment variables
3. Redeploy
4. Revoke old keys in Stripe Dashboard

### Access Control

**Who should have access to secrets:**

- **Production secrets:** Only senior engineers and DevOps
- **Test secrets:** All developers
- **Cloudflare account:** Limited to authorized personnel

**Best practices:**

- Use Cloudflare Teams for access management
- Enable 2FA on all accounts (Cloudflare, Stripe, etc.)
- Audit secret access regularly
- Use different Stripe accounts for test vs. production if possible

### Monitoring

**Set up alerts for:**

- Failed authentication attempts (monitor CloudFlare logs)
- Unusual API usage patterns (Stripe dashboard)
- Webhook verification failures (check function logs)

**Cloudflare Logs:**

```bash
# View recent function logs
wrangler pages deployment tail
```

---

## Troubleshooting

### Issue: "Missing JWT_SECRET" or secret not found

**Error message:**

```
Cannot read property 'JWT_SECRET' of undefined
```

**Cause:** Secret not set in environment

**Solutions:**

1. **Local development:**
   - Verify `.dev.vars` exists in project root
   - Check that secret is spelled correctly (case-sensitive)
   - Restart `pnpm run dev` after editing `.dev.vars`

2. **Cloudflare Pages:**
   - Go to Cloudflare Dashboard → Pages → taco → Settings → Environment Variables
   - Verify secret is set for both **Production** and **Preview** environments
   - Redeploy after adding secrets

3. **Check current secrets:**
   ```bash
   # List secrets (won't show values)
   wrangler pages project list
   ```

### Issue: Stripe webhook verification fails

**Error message:**

```
Webhook signature verification failed
```

**Cause:** Wrong webhook secret or secret mismatch

**Solutions:**

1. **Local development:**

   ```bash
   # Start Stripe CLI listener
   stripe listen --forward-to localhost:8787/api/stripe/webhook

   # Copy the webhook secret (whsec_test_xxx) to .dev.vars
   STRIPE_WEBHOOK_SECRET_TEST=whsec_test_xxx

   # Restart dev server
   pnpm run dev
   ```

2. **Production:**
   - Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
   - Find your production webhook endpoint
   - Click "Reveal" to see the signing secret
   - Update `STRIPE_WEBHOOK_SECRET_LIVE` in Cloudflare
   - Redeploy

3. **Verify endpoint URL:**
   - Local: `http://localhost:8787/api/stripe/webhook`
   - Production: `https://yourdomain.com/api/stripe/webhook`

### Issue: Magic link emails not sending

**Error message:**

```
Failed to send login link
```

**Cause:** Resend API key invalid or from email not verified

**Solutions:**

1. **Check Resend API key:**
   - Go to [Resend API Keys](https://resend.com/api-keys)
   - Verify key is active and not expired
   - Generate new key if needed
   - Update `RESEND_API_KEY` in `.dev.vars` or Cloudflare

2. **Verify sender email:**
   - Go to [Resend Domains](https://resend.com/domains)
   - Add and verify your domain OR use a verified email
   - Update `RESEND_FROM_EMAIL` to match verified domain
   - Example: `auth@thoughtfulappco.com`

3. **Check rate limits:**
   - Free tier: 100 emails/day
   - Paid tier: Higher limits
   - Check Resend dashboard for usage

4. **Test in local development:**
   ```bash
   # Check function logs for error details
   pnpm run dev
   # Watch for errors when requesting magic link
   ```

### Issue: Environment variable undefined in code

**Error message:**

```
Cannot read properties of undefined (reading 'TACO_ENV')
```

**Cause:** `TACO_ENV` not set in `wrangler.toml`

**Solutions:**

1. **Verify `wrangler.toml` configuration:**

   ```toml
   [vars]
   TACO_ENV = "staging"

   [env.preview.vars]
   TACO_ENV = "preview"

   [env.production.vars]
   TACO_ENV = "production"
   ```

2. **For local development:**
   - Default `TACO_ENV` should be `"staging"`
   - Check `[vars]` section in `wrangler.toml`

3. **Restart dev server:**
   ```bash
   # Kill existing process
   # Restart
   pnpm run dev
   ```

### Issue: Using production secrets in preview/test

**Symptom:** Preview deployments charge real customers, send live emails, etc.

**Cause:** Not using TEST/LIVE pattern or `TACO_ENV` check missing

**Solutions:**

1. **Audit code for secret usage:**

   ```bash
   # Find all places using secrets
   rg "env\\.JWT_SECRET|env\\.STRIPE" functions/
   ```

2. **Update to use TEST/LIVE pattern:**

   ```typescript
   // Wrong - uses same secret everywhere
   const jwtSecret = env.JWT_SECRET;

   // Correct - selects based on environment
   const jwtSecret = env.TACO_ENV === 'production' ? env.JWT_SECRET_PROD : env.JWT_SECRET_TEST;
   ```

3. **Verify environment variables:**
   - Check Cloudflare Dashboard
   - Ensure both `JWT_SECRET_TEST` and `JWT_SECRET_PROD` exist
   - Ensure `TACO_ENV` is set correctly

4. **Test in preview:**
   - Create a PR
   - Check preview deployment logs
   - Verify using test Stripe keys (check Stripe dashboard for test vs live mode)

### Issue: Secret works locally but not in production

**Cause:** Different secret values or environment variable naming

**Solutions:**

1. **Check secret names match exactly:**
   - Local (`.dev.vars`): `JWT_SECRET_TEST`
   - Cloudflare: `JWT_SECRET_TEST` (same spelling, same case)

2. **Verify Cloudflare environment:**

   ```bash
   # Ensure you're checking the right environment
   # Preview vs Production have separate variables
   ```

3. **Check deployment logs:**
   - Go to Cloudflare Dashboard → Pages → taco → Deployments
   - Click on latest deployment → View details → Function logs
   - Look for error messages about missing secrets

4. **Redeploy after adding secrets:**
   - Cloudflare doesn't automatically redeploy when secrets change
   - Go to Deployments → Retry deployment
   - Or push a new commit to trigger rebuild

### Issue: How to check which environment I'm in?

**Solution:**

Add a debug endpoint (remove after testing):

```typescript
// functions/api/debug/env.ts
export async function onRequest({ env }) {
  return new Response(
    JSON.stringify({
      taco_env: env.TACO_ENV,
      has_jwt_test: !!env.JWT_SECRET_TEST,
      has_jwt_prod: !!env.JWT_SECRET_PROD,
      has_stripe_test: !!env.STRIPE_SECRET_KEY_TEST,
      has_stripe_live: !!env.STRIPE_SECRET_KEY_LIVE,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

Visit: `https://yourdomain.com/api/debug/env`

**⚠️ Remove this endpoint before going to production!** Never expose secret names or existence in public endpoints.

---

## Quick Reference Checklist

### Initial Setup

- [ ] Copy `.dev.vars.example` to `.dev.vars`
- [ ] Generate JWT secrets: `openssl rand -base64 32` (two different ones)
- [ ] Get Stripe test keys from [dashboard](https://dashboard.stripe.com/apikeys)
- [ ] Get Resend API key from [resend.com](https://resend.com/api-keys)
- [ ] Verify Resend sender email/domain
- [ ] Set up Stripe webhook locally: `stripe listen`
- [ ] Add all secrets to `.dev.vars`
- [ ] Test locally: `pnpm run dev`

### Cloudflare Pages Setup

- [ ] Set `JWT_SECRET_TEST` in Cloudflare
- [ ] Set `JWT_SECRET_PROD` in Cloudflare (different value!)
- [ ] Set `STRIPE_SECRET_KEY_TEST` in Cloudflare
- [ ] Set `STRIPE_SECRET_KEY_LIVE` in Cloudflare
- [ ] Set `STRIPE_WEBHOOK_SECRET_TEST` in Cloudflare
- [ ] Set `STRIPE_WEBHOOK_SECRET_LIVE` in Cloudflare
- [ ] Set `RESEND_API_KEY` in Cloudflare
- [ ] Set `RESEND_FROM_EMAIL` in Cloudflare
- [ ] Set optional API keys (Anthropic, O\*NET, BLS, etc.)
- [ ] Verify `TACO_ENV` is set in `wrangler.toml`
- [ ] Deploy and test preview environment
- [ ] Deploy and test production environment

### Before Going Live

- [ ] Rotate all JWT secrets (use production-grade random values)
- [ ] Switch to Stripe live mode keys
- [ ] Set up production Stripe webhook at [dashboard](https://dashboard.stripe.com/webhooks)
- [ ] Update `STRIPE_WEBHOOK_SECRET_LIVE` with production webhook secret
- [ ] Test magic link emails in production
- [ ] Test Stripe checkout flow in production (small test purchase)
- [ ] Verify webhooks work in production
- [ ] Set up monitoring and alerts
- [ ] Document who has access to production secrets
- [ ] Enable 2FA on all production accounts

---

## Additional Resources

- [Cloudflare Pages Environment Variables](https://developers.cloudflare.com/pages/platform/environment-variables/)
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Resend Documentation](https://resend.com/docs)
- [TACo Database Setup](./DATABASE_SETUP.md)
- [TACo Developer Setup](../DEVELOPER_SETUP.md)

---

**Questions or issues?** Create a GitHub issue or reach out to the team.
