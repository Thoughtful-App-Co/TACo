# Production Cutover Plan - TACo v0.1.0-alpha

**Release Version:** 0.1.0-alpha  
**Target Date:** TBD  
**Environment:** Staging → Production  
**Domain:** thoughtfulapp.co

---

## Executive Summary

This document outlines the complete production cutover checklist for deploying TACo from staging to production. The cutover includes database initialization, Stripe live mode configuration, secret management, DNS configuration, and comprehensive validation testing.

**Estimated Cutover Time:** 2-4 hours  
**Rollback Time:** 15 minutes (revert DNS, use staging)

---

## Pre-Cutover Requirements

### Business Readiness

- [ ] **Legal documents finalized**
  - [ ] Terms of Service published
  - [ ] Privacy Policy published
  - [ ] Refund policy documented
  - [ ] GDPR compliance reviewed

- [ ] **Stripe account verified**
  - [ ] Live mode enabled
  - [ ] Bank account connected for payouts
  - [ ] Tax information submitted
  - [ ] Business verification complete

- [ ] **Customer support ready**
  - [ ] Support email configured (support@thoughtfulapp.co)
  - [ ] Incident response plan documented
  - [ ] On-call schedule established

- [ ] **Marketing/Communications**
  - [ ] Launch announcement drafted
  - [ ] Social media posts prepared
  - [ ] Email templates ready

### Technical Readiness

- [ ] **Staging environment fully tested**
  - [ ] All auth flows working (magic link, session validation)
  - [ ] Checkout flows tested end-to-end
  - [ ] Webhook events processing correctly
  - [ ] Database queries performing well
  - [ ] No critical bugs in issue tracker

- [ ] **Production infrastructure provisioned**
  - [ ] Cloudflare Pages project configured
  - [ ] D1 production databases created
  - [ ] R2 backup bucket created
  - [ ] KV namespace created
  - [ ] Custom domain ready (thoughtfulapp.co)

- [ ] **Monitoring/Observability**
  - [ ] Cloudflare Analytics enabled
  - [ ] Stripe Dashboard alerts configured
  - [ ] Error tracking configured (Sentry/similar)
  - [ ] Uptime monitoring configured

---

## Phase 1: Infrastructure Setup

### 1.1 Cloudflare D1 Production Databases

**Status:** [ ] Complete

```bash
# Verify databases exist
wrangler d1 list
```

Expected output:

- `taco-auth` (483da8b0-94c7-4f9e-ab1a-68df41e5664d)
- `taco-billing` (b8f3b52c-3061-4402-a8b3-794b45dbb2cb)

**If databases don't exist:**

```bash
wrangler d1 create taco-auth
wrangler d1 create taco-billing
# Update wrangler.toml with new database IDs
```

### 1.2 Apply Production Database Migrations

**Status:** [ ] Complete

```bash
# Auth database
wrangler d1 execute taco-auth --remote \
  --file=migrations/0001_auth_schema.sql

# Billing database
wrangler d1 execute taco-billing --remote \
  --file=migrations/0002_billing_schema.sql

wrangler d1 execute taco-billing --remote \
  --file=migrations/0003_credits_schema.sql

wrangler d1 execute taco-billing --remote \
  --file=migrations/0004_add_taco_club_columns.sql
```

**Verify tables created:**

```bash
# Auth tables
wrangler d1 execute taco-auth --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table';"
# Expected: users

# Billing tables
wrangler d1 execute taco-billing --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table';"
# Expected: subscriptions, usage, credits, credit_transactions

# Verify TACo Club columns exist
wrangler d1 execute taco-billing --remote \
  --command="PRAGMA table_info(subscriptions);"
# Expected: lifetime_access, total_payments, max_payments, total_paid_cents
```

### 1.3 R2 and KV Namespaces

**Status:** [ ] Complete

**Verify R2 bucket:**

```bash
wrangler r2 bucket list
# Expected: taco-backups
```

**Verify KV namespace:**

```bash
wrangler kv:namespace list
# Expected: RATE_LIMIT (d25c638778c14c13b5ce39bf80308b53)
```

---

## Phase 2: Secrets Configuration

### 2.1 Generate Production Secrets

**Status:** [ ] Complete

```bash
# Generate production JWT secret (different from test!)
openssl rand -base64 32
# Save this securely - needed for JWT_SECRET_PROD
```

### 2.2 Set Production Secrets

**Status:** [ ] Complete

**CRITICAL: Double-check TACO_ENV selects correct secret!**

```bash
# Production-specific secrets
wrangler secret put JWT_SECRET_PROD
# Paste the JWT secret generated above

wrangler secret put STRIPE_SECRET_KEY_LIVE
# Get from: https://dashboard.stripe.com/apikeys (LIVE mode)
# Should start with: sk_live_

wrangler secret put STRIPE_WEBHOOK_SECRET_LIVE
# Get from: https://dashboard.stripe.com/webhooks (LIVE mode, after Step 3.2)
# Should start with: whsec_
```

**Shared secrets (verify already set):**

```bash
wrangler secret list

# Should see:
# - JWT_SECRET_TEST
# - JWT_SECRET_PROD ← NEW
# - STRIPE_SECRET_KEY_TEST
# - STRIPE_SECRET_KEY_LIVE ← NEW
# - STRIPE_WEBHOOK_SECRET_TEST
# - STRIPE_WEBHOOK_SECRET_LIVE ← NEW (set after webhook created)
# - RESEND_API_KEY
# - RESEND_FROM_EMAIL
# - ANTHROPIC_API_KEY (optional)
# - ONET_API_KEY (optional)
```

### 2.3 Verify Secret Selection Logic

**Status:** [ ] Complete

**Review code in:**

- `functions/lib/auth-config.ts` - JWT secret selection
- `functions/lib/stripe.ts` - Stripe key/webhook secret selection

**Verify logic:**

```typescript
// Should be:
const key = env.TACO_ENV === 'production' ? env.STRIPE_SECRET_KEY_LIVE : env.STRIPE_SECRET_KEY_TEST;
```

---

## Phase 3: Stripe Live Mode Configuration

### 3.1 Create Live Mode Products

**Status:** [ ] Complete

**In Stripe Dashboard (LIVE mode):** https://dashboard.stripe.com/products

Create the following products (refer to `docs/STRIPE_LIVE_SETUP.md`):

1. **Loco TACo Club**
   - [ ] Monthly: $25/month → Copy price ID: `_________________`
   - [ ] Lifetime: $500 one-time → Copy price ID: `_________________`

2. **All Apps Sync & Backup**
   - [ ] Monthly: $3.50/month → Copy price ID: `_________________`
   - [ ] Yearly: $35/year → Copy price ID: `_________________`

3. **Single App Sync**
   - [ ] Monthly: $2/month → Copy price ID: `_________________`
   - [ ] Yearly: $20/year → Copy price ID: `_________________`

4. **Tempo Extras**
   - [ ] Monthly: $12/month → Copy price ID: `_________________`
   - [ ] Yearly: $120/year → Copy price ID: `_________________`

5. **Tenure Extras**
   - [ ] Monthly: $5/month → Copy price ID: `_________________`
   - [ ] Yearly: $30/year → Copy price ID: `_________________`

6. **Echoprax Extras** (future)
   - [ ] Monthly: $8/month → Copy price ID: `_________________`
   - [ ] Yearly: $80/year → Copy price ID: `_________________`

### 3.2 Configure Live Webhook

**Status:** [ ] Complete

**In Stripe Dashboard (LIVE mode):** https://dashboard.stripe.com/webhooks

1. Click "Add endpoint"
2. **Endpoint URL:** `https://thoughtfulapp.co/api/stripe/webhook`
3. **Description:** TACo Production Webhook
4. **Select events:**
   - [ ] `checkout.session.completed`
   - [ ] `customer.subscription.created`
   - [ ] `customer.subscription.updated`
   - [ ] `customer.subscription.deleted`
   - [ ] `invoice.payment_succeeded`
   - [ ] `invoice.payment_failed`
5. Click "Add endpoint"
6. **Copy signing secret:** `whsec_________________`
7. **Set secret:**
   ```bash
   wrangler secret put STRIPE_WEBHOOK_SECRET_LIVE
   # Paste the signing secret
   ```

### 3.3 Update Code with Live Price IDs

**Status:** [ ] Complete

**File 1: `functions/lib/stripe.ts`**

Replace `STRIPE_PRICES_LIVE` (lines 80-93) with live price IDs:

```typescript
export const STRIPE_PRICES_LIVE: StripePrices = {
  TACO_CLUB_MONTHLY: 'price_________________', // From 3.1.1
  TACO_CLUB_LIFETIME: 'price_________________', // From 3.1.1
  SYNC_ALL_MONTHLY: 'price_________________', // From 3.1.2
  SYNC_ALL_YEARLY: 'price_________________', // From 3.1.2
  SYNC_APP_MONTHLY: 'price_________________', // From 3.1.3
  SYNC_APP_YEARLY: 'price_________________', // From 3.1.3
  TEMPO_EXTRAS_MONTHLY: 'price_________________', // From 3.1.4
  TEMPO_EXTRAS_YEARLY: 'price_________________', // From 3.1.4
  TENURE_EXTRAS_MONTHLY: 'price_________________', // From 3.1.5
  TENURE_EXTRAS_YEARLY: 'price_________________', // From 3.1.5
  ECHOPRAX_EXTRAS_MONTHLY: 'price_________________', // From 3.1.6
  ECHOPRAX_EXTRAS_YEARLY: 'price_________________', // From 3.1.6
} as const;
```

**File 2: `src/lib/stripe-prices.ts`**

Update `STRIPE_PRICES_LIVE` (lines 50-63) with **same** price IDs.

**Commit changes:**

```bash
git add functions/lib/stripe.ts src/lib/stripe-prices.ts
git commit -m "feat: add Stripe LIVE mode price IDs for production"
```

---

## Phase 4: DNS and Domain Configuration

### 4.1 Configure Custom Domain

**Status:** [ ] Complete

**In Cloudflare Pages Dashboard:**

1. Go to: Workers & Pages → taco → Custom domains
2. Click "Set up a custom domain"
3. Enter: `thoughtfulapp.co`
4. Cloudflare will provide DNS records to add

### 4.2 Update DNS Records

**Status:** [ ] Complete

**In Cloudflare DNS Dashboard:**

Add the following records (values provided by Pages):

```
Type: CNAME
Name: thoughtfulapp.co
Target: taco.pages.dev
Proxy: Yes (orange cloud)
```

```
Type: CNAME
Name: www
Target: thoughtfulapp.co
Proxy: Yes (orange cloud)
```

**Wait for propagation:** ~2-15 minutes

**Verify DNS:**

```bash
dig thoughtfulapp.co
# Should resolve to Cloudflare IPs
```

### 4.3 SSL Certificate

**Status:** [ ] Complete

- [ ] Cloudflare automatically provisions SSL certificate
- [ ] Verify HTTPS works: `https://thoughtfulapp.co`
- [ ] Check certificate details in browser (should be valid)

---

## Phase 5: Deployment

### 5.1 Final Code Review

**Status:** [ ] Complete

- [ ] All live price IDs added to code
- [ ] `PRODUCTION_DOMAINS` in `src/lib/stripe-prices.ts` includes `thoughtfulapp.co`
- [ ] No test/debug code in production
- [ ] No hardcoded credentials
- [ ] All TODOs addressed or documented
- [ ] Changelog updated

### 5.2 Create Release Tag

**Status:** [ ] Complete

```bash
git checkout main
git pull origin main

# Tag the release
git tag -a v0.1.0-alpha -m "Release v0.1.0-alpha: Production launch"
git push origin v0.1.0-alpha
```

### 5.3 Deploy to Production

**Status:** [ ] Complete

```bash
# Merge to main (triggers production deployment)
git checkout main
git merge augment-mvp-1 --no-ff -m "Release v0.1.0-alpha"
git push origin main
```

**Monitor deployment:**

1. Go to: Cloudflare Dashboard → Workers & Pages → taco → Deployments
2. Wait for "Success" status on main branch deployment
3. Deployment typically takes 2-5 minutes

### 5.4 Verify Deployment

**Status:** [ ] Complete

```bash
# Check production is live
curl https://thoughtfulapp.co/

# Check API health
curl https://thoughtfulapp.co/api/billing/founding-stats
```

Expected: JSON response with founding member stats

---

## Phase 6: Validation Testing

### 6.1 Authentication Flow

**Status:** [ ] Complete

1. [ ] Open `https://thoughtfulapp.co`
2. [ ] Click "Sign In"
3. [ ] Enter email address
4. [ ] Receive magic link email (check spam)
5. [ ] Click magic link
6. [ ] Successfully logged in
7. [ ] Verify session persists after refresh

**Check logs:**

```bash
wrangler pages deployment tail --project-name=taco --environment=production
```

### 6.2 Checkout Flow (Test with Real Card)

**Status:** [ ] Complete

**WARNING: This will charge your card!**

Use a low-value subscription (e.g., Single App Sync $2/mo) for testing.

1. [ ] Navigate to `/pricing`
2. [ ] Select "Single App Sync" (Monthly - $2)
3. [ ] Click "Continue to Checkout"
4. [ ] Verify redirects to Stripe Checkout
5. [ ] Verify correct price displayed ($2.00)
6. [ ] Enter **real** credit card details
7. [ ] Complete payment
8. [ ] Verify redirect back to success page
9. [ ] Verify subscription appears in account

**Verify in Stripe Dashboard:**

- [ ] Payment shows in Payments (LIVE mode)
- [ ] Subscription created in Subscriptions
- [ ] Customer created in Customers

**Verify in database:**

```bash
wrangler d1 execute taco-billing --remote \
  --command="SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 1;"
```

Expected:

- `product`: `sync_app`
- `status`: `active`
- `stripe_subscription_id`: Populated
- `stripe_customer_id`: Populated

### 6.3 Webhook Processing

**Status:** [ ] Complete

**In Stripe Dashboard (LIVE):** https://dashboard.stripe.com/webhooks

1. [ ] Click on your production webhook endpoint
2. [ ] Go to "Recent events" tab
3. [ ] Verify `checkout.session.completed` shows 200 response
4. [ ] Verify `invoice.payment_succeeded` shows 200 response
5. [ ] Verify `customer.subscription.created` shows 200 response

**If any show errors:**

- Click event → View details
- Check request/response logs
- Review Cloudflare logs

### 6.4 Subscription Management

**Status:** [ ] Complete

1. [ ] Log into test account
2. [ ] Navigate to account/billing settings
3. [ ] Verify subscription displays correctly
4. [ ] Click "Manage Subscription" (Stripe Portal)
5. [ ] Verify portal opens
6. [ ] Test cancellation flow (do NOT cancel)
7. [ ] Test payment method update
8. [ ] Verify changes sync back to database

### 6.5 TACo Club Founding Member Limit

**Status:** [ ] Complete

```bash
# Check founding member count
wrangler d1 execute taco-billing --remote \
  --command="SELECT COUNT(*) as count FROM subscriptions WHERE product = 'taco_club' AND status IN ('active', 'trialing');"
```

Expected: Returns count (should be < 10,000)

**Verify soft limit logging works:**

- Review code in `functions/api/billing/create-checkout.ts` (lines 83-106)
- Confirms logging happens at 9,900 and 10,000 members

### 6.6 Cross-Environment Isolation

**Status:** [ ] Complete

**Verify staging still uses TEST mode:**

1. [ ] Open staging URL (e.g., `https://staging.taco.pages.dev` or latest preview)
2. [ ] Attempt checkout
3. [ ] Verify uses TEST price IDs
4. [ ] Verify test cards work (`4242 4242 4242 4242`)

**Verify production uses LIVE mode:**

1. [ ] Open `https://thoughtfulapp.co`
2. [ ] Attempt checkout
3. [ ] Verify uses LIVE price IDs
4. [ ] Verify test cards **do not** work

### 6.7 Error Handling

**Status:** [ ] Complete

**Test declined card:**

1. [ ] Start checkout with TACo Club Monthly
2. [ ] Use card: `4000 0000 0000 0002` (declined)
3. [ ] Verify graceful error message
4. [ ] Verify no orphan subscription created

**Test webhook failure simulation:**

1. [ ] In Stripe Dashboard, click webhook endpoint
2. [ ] Click "Send test webhook"
3. [ ] Send `checkout.session.completed` event
4. [ ] Verify receives 200 response

### 6.8 Performance and Monitoring

**Status:** [ ] Complete

- [ ] Check page load times (should be < 2s)
- [ ] Verify API response times (should be < 500ms)
- [ ] Check Cloudflare Analytics dashboard
- [ ] Verify no errors in Cloudflare logs
- [ ] Test from multiple geographic locations
- [ ] Mobile responsiveness check (iOS/Android)

---

## Phase 7: Post-Deployment

### 7.1 Monitoring Setup

**Status:** [ ] Complete

**Configure alerts:**

- [ ] Stripe webhook failures (Stripe Dashboard → Webhooks → Configure alerts)
- [ ] Cloudflare Pages uptime monitoring
- [ ] Error rate threshold alerts
- [ ] Payment failure notifications

**Daily monitoring checklist:**

- [ ] Review Stripe Dashboard for payment issues
- [ ] Check Cloudflare error logs
- [ ] Monitor founding member count
- [ ] Review customer support tickets

### 7.2 Documentation Updates

**Status:** [ ] Complete

- [ ] Update README with production URL
- [ ] Add production troubleshooting guide
- [ ] Document rollback procedure
- [ ] Update API documentation
- [ ] Create user onboarding guide

### 7.3 Team Communication

**Status:** [ ] Complete

- [ ] Notify team of production launch
- [ ] Share production URL and credentials
- [ ] Review on-call schedule
- [ ] Confirm support email monitoring
- [ ] Schedule post-launch retrospective

### 7.4 Marketing Launch

**Status:** [ ] Complete

- [ ] Send launch announcement email
- [ ] Post on social media
- [ ] Update website with "Live" badge
- [ ] Enable public signups (if applicable)
- [ ] Monitor initial user feedback

---

## Rollback Plan

### When to Rollback

Rollback if:

- Critical bug discovered in first 24 hours
- Payment processing failures > 10%
- Database corruption detected
- Security vulnerability identified
- Major feature broken for all users

### Rollback Procedure

**Estimated time:** 15 minutes

1. **Revert DNS (Immediate):**

   ```bash
   # Point thoughtfulapp.co back to staging
   # In Cloudflare DNS, update CNAME:
   # Target: staging.taco.pages.dev (instead of taco.pages.dev)
   ```

2. **Notify users:**
   - Post status on website
   - Send email to active users
   - Update social media

3. **Investigate issue:**
   - Review Cloudflare logs
   - Check Stripe webhook failures
   - Query database for anomalies

4. **Deploy fix:**
   - Create hotfix branch from production
   - Apply fix
   - Test in staging
   - Redeploy to production
   - Update DNS back to production

5. **Post-mortem:**
   - Document root cause
   - Update testing procedures
   - Add safeguards

---

## Known Issues / Limitations

### Alpha Release Limitations

- **Echoprax product:** Test mode price IDs are placeholders (not critical, app not launched)
- **Founding member limit:** Soft limit only (logs but allows purchases over 10,000)
- **Mobile apps:** Not yet released (web-only for alpha)
- **Social login:** Only magic link supported (no Google/Apple SSO yet)

### Expected Behaviors

- First-time users may experience slightly slower load (Cloudflare cold start)
- Webhook processing is eventual consistency (typically < 5 seconds)
- Stripe portal link expires after 1 hour

---

## Emergency Contacts

| Role                     | Name   | Contact       |
| ------------------------ | ------ | ------------- |
| Lead Developer           | [Name] | [Email/Phone] |
| DevOps                   | [Name] | [Email/Phone] |
| Stripe Account Owner     | [Name] | [Email]       |
| Cloudflare Account Owner | [Name] | [Email]       |
| On-Call Engineer         | [Name] | [Phone]       |

### External Support

- **Cloudflare Support:** https://dash.cloudflare.com/?to=/:account/support
- **Stripe Support:** https://support.stripe.com/
- **Resend Support:** support@resend.com

---

## Appendix A: Environment Variables

### Production Environment Variables (Cloudflare Pages)

**Set in Dashboard → Settings → Environment Variables:**

| Variable       | Value                      | Environment     |
| -------------- | -------------------------- | --------------- |
| `TACO_ENV`     | `production`               | Production only |
| `FRONTEND_URL` | `https://thoughtfulapp.co` | Production only |

### Production Secrets (Cloudflare)

**Set via `wrangler secret put`:**

| Secret                       | Format                  | Shared?              |
| ---------------------------- | ----------------------- | -------------------- |
| `JWT_SECRET_PROD`            | 32+ random chars        | No (production only) |
| `JWT_SECRET_TEST`            | 32+ random chars        | No (staging only)    |
| `STRIPE_SECRET_KEY_LIVE`     | `sk_live_...`           | No (production only) |
| `STRIPE_SECRET_KEY_TEST`     | `sk_test_...`           | No (staging only)    |
| `STRIPE_WEBHOOK_SECRET_LIVE` | `whsec_...`             | No (production only) |
| `STRIPE_WEBHOOK_SECRET_TEST` | `whsec_...`             | No (staging only)    |
| `RESEND_API_KEY`             | `re_...`                | Yes (all envs)       |
| `RESEND_FROM_EMAIL`          | `auth@thoughtfulapp.co` | Yes (all envs)       |
| `ANTHROPIC_API_KEY`          | `sk-ant-...`            | Yes (optional)       |
| `ONET_API_KEY`               | API key                 | Yes (optional)       |

---

## Appendix B: Database Schema Versions

| Migration                        | Description                  | Applied? |
| -------------------------------- | ---------------------------- | -------- |
| `0001_auth_schema.sql`           | Users table                  | [ ]      |
| `0002_billing_schema.sql`        | Subscriptions, usage tables  | [ ]      |
| `0003_credits_schema.sql`        | Credits, credit_transactions | [ ]      |
| `0004_add_taco_club_columns.sql` | TACo Club payment tracking   | [ ]      |

**To verify all migrations applied:**

```bash
wrangler d1 execute taco-billing --remote \
  --command="PRAGMA table_info(subscriptions);"

# Should show: lifetime_access, total_payments, max_payments, total_paid_cents
```

---

## Appendix C: Pricing Structure

| Product             | Monthly | Yearly | Lifetime |
| ------------------- | ------- | ------ | -------- |
| **Loco TACo Club**  | $25     | -      | $500     |
| **All Apps Sync**   | $3.50   | $35    | -        |
| **Single App Sync** | $2      | $20    | -        |
| **Tempo Extras**    | $12     | $120   | -        |
| **Tenure Extras**   | $5      | $30    | -        |
| **Echoprax Extras** | $8      | $80    | -        |

**TACo Club Benefits:**

- 75% off all app extras
- Free sync for all apps
- Lifetime access after 24 monthly payments ($600 total)

---

## Appendix D: Success Metrics

### Week 1 Targets

- [ ] 0 critical bugs reported
- [ ] 0 payment failures
- [ ] < 2s average page load time
- [ ] 100% webhook success rate
- [ ] 10+ founding members signed up

### Month 1 Targets

- [ ] 100+ active users
- [ ] 50+ founding members
- [ ] < 1% churn rate
- [ ] 99.9% uptime
- [ ] Positive user feedback

---

## Sign-Off

**Pre-Cutover Approval:**

| Role           | Name | Signature | Date |
| -------------- | ---- | --------- | ---- |
| Lead Developer |      |           |      |
| DevOps Lead    |      |           |      |
| Product Owner  |      |           |      |
| Business Owner |      |           |      |

**Post-Cutover Validation:**

| Role           | Name | Signature | Date |
| -------------- | ---- | --------- | ---- |
| Lead Developer |      |           |      |
| QA Lead        |      |           |      |

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-14  
**Next Review:** Post-production launch
