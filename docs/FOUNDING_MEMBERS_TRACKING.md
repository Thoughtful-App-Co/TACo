# LocoTaco Founding Members Tracking

This document explains the dynamic founding member tracking system and deployment requirements across environments.

## Overview

The system tracks LocoTaco Club memberships in real-time and displays availability on the pricing page with a soft limit at 10,000 founding members.

## Components

### 1. API Endpoint: `/api/billing/founding-stats`

**File:** `functions/api/billing/founding-stats.ts`

**Purpose:** Public endpoint that returns aggregate statistics about LocoTaco memberships

**Response:**

```json
{
  "total": 1753,
  "remaining": 8247,
  "limit": 10000,
  "percentFilled": 17.53,
  "breakdown": {
    "monthly": 1200,
    "lifetime": 553
  },
  "nearLimit": false,
  "atLimit": false,
  "showWarning": false,
  "lastUpdated": "2025-01-13T..."
}
```

**Caching:** 5 minute browser cache (`Cache-Control: public, max-age=300`)

### 2. Pricing Page Counter

**File:** `src/components/PricingPage.tsx`

**Features:**

- Fetches stats on page load using SolidJS `createResource`
- Dynamic progress bar based on actual membership count
- Scarcity messaging:
  - Normal: "X of 10,000 founding spots left"
  - Low inventory (<500 remaining): "X of 10,000 founding spots left - Hurry!"
  - Sold out: "Founding member spots are full"
- Graceful fallback if API unavailable

### 3. Soft Limit in Checkout

**File:** `functions/api/billing/create-checkout.ts`

**Behavior:**

- Checks current count before creating checkout session
- At 9,900+: Logs info message
- At 10,000+: Logs warning but allows purchase (manual review)
- Future: Can be converted to hard block by returning error

## Environment Requirements

### Local Development

**Database:** SQLite via `--local` flag
**Requirements:**

- `.dev.vars` file with test environment secrets
- Local D1 databases: `AUTH_DB`, `BILLING_DB`

**Setup:**

```bash
# Start dev server with local databases
pnpm run dev
```

**Testing:**

1. Visit `http://localhost:5173/pricing`
2. Select "Loco TACo Club" tier (monthly or lifetime)
3. Verify counter appears below cart
4. Check browser network tab for `/api/billing/founding-stats` call

**Local database queries:**

```bash
# Check current LocoTaco member count (local)
npx wrangler d1 execute taco-billing --local --command \
  "SELECT COUNT(*) as count FROM subscriptions WHERE product = 'taco_club' AND status IN ('active', 'trialing')"

# View all LocoTaco members (local)
npx wrangler d1 execute taco-billing --local --command \
  "SELECT id, user_id, lifetime_access, total_payments, created_at FROM subscriptions WHERE product = 'taco_club' ORDER BY created_at DESC"
```

### Staging Environment

**Database:** Remote D1 (staging)
**Requirements:**

- Cloudflare Pages deployment (staging branch)
- `BILLING_DB` binding configured in Cloudflare dashboard
- Stripe Test Mode API keys in Cloudflare secrets

**Deployment:**

```bash
# Deploy to staging (automatic on push to staging branch)
git push origin staging

# Or manual deploy
npx wrangler pages deploy dist --project-name=taco-staging
```

**Verification:**

1. Visit staging URL: `https://staging.thoughtfulapp.co/pricing`
2. Open browser DevTools → Network tab
3. Select LocoTaco tier and verify API call to `/api/billing/founding-stats`
4. Check response data matches Stripe test subscriptions

**Staging database queries:**

```bash
# Check staging count
npx wrangler d1 execute taco-billing --command \
  "SELECT COUNT(*) as count FROM subscriptions WHERE product = 'taco_club' AND status IN ('active', 'trialing')"

# View staging members
npx wrangler d1 execute taco-billing --command \
  "SELECT id, user_id, lifetime_access, total_payments, created_at FROM subscriptions WHERE product = 'taco_club' ORDER BY created_at DESC LIMIT 20"
```

### Production Environment

**Database:** Remote D1 (production)
**Requirements:**

- Cloudflare Pages deployment (main branch)
- `BILLING_DB` binding configured in Cloudflare dashboard
- Stripe Live Mode API keys in Cloudflare secrets
- `TACO_ENV=production` environment variable

**Deployment:**

```bash
# Deploy to production (automatic on push to main)
git push origin main

# Or manual deploy
npx wrangler pages deploy dist --project-name=taco-production
```

**Verification:**

1. Visit production URL: `https://thoughtfulapp.co/pricing`
2. Verify counter shows real membership data
3. Check Stripe Dashboard → Customers to cross-reference count

**Production database queries:**

```bash
# Check production count (CRITICAL - BE CAREFUL)
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT COUNT(*) as count FROM subscriptions WHERE product = 'taco_club' AND status IN ('active', 'trialing')"

# View production stats (read-only)
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT
    COUNT(*) as total,
    SUM(CASE WHEN lifetime_access = 1 THEN 1 ELSE 0 END) as lifetime,
    SUM(CASE WHEN lifetime_access = 0 THEN 1 ELSE 0 END) as monthly
  FROM subscriptions
  WHERE product = 'taco_club' AND status IN ('active', 'trialing')"
```

## Environment Variables

No new environment variables required! The system uses existing bindings:

- `BILLING_DB` - D1 database binding (already configured)
- `AUTH_DB` - D1 database binding (already configured)
- `STRIPE_SECRET_KEY` - Already configured per environment

## Database Schema

The system uses the existing `subscriptions` table from `migrations/0002_billing_schema.sql`:

```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product TEXT NOT NULL,           -- 'taco_club' for LocoTaco memberships
  status TEXT NOT NULL,             -- 'active', 'trialing', 'cancelled', 'past_due'
  stripe_subscription_id TEXT,
  lifetime_access INTEGER DEFAULT 0, -- 1 for lifetime members
  total_payments INTEGER DEFAULT 0,  -- Tracks monthly payment progress
  ...
);
```

**Relevant queries:**

- Total active members: `WHERE product = 'taco_club' AND status IN ('active', 'trialing')`
- Lifetime members: `WHERE product = 'taco_club' AND lifetime_access = 1`
- Monthly subscribers: `WHERE product = 'taco_club' AND lifetime_access = 0 AND stripe_subscription_id NOT LIKE 'one_time_%'`

## Monitoring & Admin

### Via Stripe Dashboard (Recommended)

1. Go to https://dashboard.stripe.com
2. Select correct mode (Test/Live)
3. Navigate to **Products** → **Loco TACo Club**
4. View active subscriptions

### Via Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your project
3. Go to **D1 Databases** → `taco-billing`
4. Run queries directly in console

### Via CLI (Quickest)

⚠️ **IMPORTANT:** Before running database queries, review `/docs/DATABASE_OPERATIONS.md` for best practices and safety guidelines.

```bash
# Quick count check (staging) - SAFE READ-ONLY
npx wrangler d1 execute taco-billing --command \
  "SELECT COUNT(*) as count FROM subscriptions WHERE product = 'taco_club' AND status IN ('active', 'trialing')"

# Quick count check (production) - SAFE READ-ONLY
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT COUNT(*) as count FROM subscriptions WHERE product = 'taco_club' AND status IN ('active', 'trialing')"
```

**Remember to document any database operations in `/docs/DATABASE_OPERATIONS.md` → Database Operation Log**

## Troubleshooting

### Counter shows "Loading availability..." forever

**Cause:** API endpoint not responding or network error

**Fix:**

1. Check `/api/billing/founding-stats` endpoint is deployed
2. Verify `BILLING_DB` binding exists in Cloudflare
3. Check browser console for error messages
4. Verify D1 database has `subscriptions` table

### Counter shows "0 of 10,000 spots left"

**Cause:** No LocoTaco subscriptions in database OR database query returning 0

**Fix:**

1. Check Stripe dashboard for active subscriptions
2. Verify webhook integration is working (subscriptions should auto-create in DB)
3. Run database query manually to verify data exists
4. Check that `product = 'taco_club'` matches exactly (case-sensitive)

### Count doesn't match Stripe Dashboard

**Cause:** Webhook delay or subscription status mismatch

**Fix:**

1. Check subscription `status` field - only `'active'` and `'trialing'` count
2. Verify webhooks are being received (check Cloudflare logs)
3. Allow 1-2 minutes for webhook processing after new purchase
4. Check for cancelled/past_due subscriptions

### Soft limit not triggering

**Cause:** Checkout endpoint not checking or logging disabled

**Fix:**

1. Verify `billingLog` statements in `create-checkout.ts`
2. Check Cloudflare logs for warning messages
3. Ensure count query in checkout matches stats endpoint query

## Updating the Limit

To change the 10,000 founding member limit:

**Files to update:**

1. `functions/api/billing/founding-stats.ts` - Change `FOUNDING_MEMBER_LIMIT`
2. `functions/api/billing/create-checkout.ts` - Change `FOUNDING_MEMBER_LIMIT`
3. `src/components/pricing/data.ts` - Update tooltip if referencing limit
4. `src/components/PricingPage.tsx` - Fallback data `limit` value

**Example:**

```typescript
// Change from 10,000 to 15,000
const FOUNDING_MEMBER_LIMIT = 15000;
```

## Testing Checklist

### Local Testing

- [ ] `/api/billing/founding-stats` returns valid JSON
- [ ] Pricing page displays counter when LocoTaco tier selected
- [ ] Counter updates if database count changes
- [ ] Fallback works if API fails (shows generic message)
- [ ] No console errors

### Staging Testing

- [ ] Deploy to staging successful
- [ ] API endpoint accessible at staging URL
- [ ] Counter shows staging database count
- [ ] Stripe test mode subscriptions reflected accurately
- [ ] Soft limit logging works (create test subscription near limit)

### Production Testing (Non-Destructive)

- [ ] Verify API endpoint returns production data
- [ ] Counter matches Stripe live dashboard
- [ ] Progress bar percentage accurate
- [ ] Scarcity messages display correctly
- [ ] No errors in Cloudflare logs

## Future Enhancements

1. **Hard Limit Enforcement**: Convert soft limit to hard block in checkout
2. **Admin Dashboard**: Create `/admin/stats` page with detailed analytics
3. **Real-time Updates**: WebSocket connection for live counter updates
4. **Notification System**: Email alerts when approaching limit
5. **Waiting List**: Allow signups after limit reached for future spots
6. **Analytics**: Track page views, conversion rates per remaining spots

## Support

**Questions about deployment:** Check Cloudflare Pages deployment logs  
**Questions about subscriptions:** Check Stripe Dashboard → Logs  
**Questions about database:** Use `wrangler d1` CLI commands above  
**Questions about feature logic:** See source files listed in Components section
