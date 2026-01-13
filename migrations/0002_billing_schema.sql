-- TACo Billing Database Schema  
-- Run with: wrangler d1 execute taco-billing --file=migrations/0002_billing_schema.sql
--
-- TACo Club Logic:
-- - Monthly subscribers pay $25/month for 24 months = $600 total
-- - One-time purchase is $500 for immediate lifetime access
-- - After 24 payments, subscription auto-cancels and lifetime_access = 1
-- - lifetime_access = 1 means user keeps access forever (no more billing)
--

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product TEXT NOT NULL,
  status TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  current_period_start INTEGER,
  current_period_end INTEGER,
  cancel_at_period_end INTEGER DEFAULT 0,
  -- TACo Club payment tracking
  total_payments INTEGER DEFAULT 0,
  max_payments INTEGER,
  lifetime_access INTEGER DEFAULT 0,
  total_paid_cents INTEGER DEFAULT 0,
  -- Timestamps
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  cancelled_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Usage tracking table (for metered billing)
CREATE TABLE IF NOT EXISTS usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  cost_cents INTEGER,
  month TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_usage_user_month ON usage(user_id, month);
CREATE INDEX IF NOT EXISTS idx_usage_resource ON usage(resource);
