-- Multi-item subscription support
-- Allows a single Stripe subscription to have multiple products (e.g., TACo Club + Tempo sync)
--
-- The original schema had: stripe_subscription_id TEXT UNIQUE
-- This prevented storing multiple products from the same subscription.
--
-- SQLite doesn't support ALTER TABLE DROP CONSTRAINT, so we need to recreate the table.
-- Run with: wrangler d1 execute BILLING_DB --file=migrations/0003_multi_item_subscriptions.sql

-- Step 1: Create new table with correct constraints
CREATE TABLE IF NOT EXISTS subscriptions_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product TEXT NOT NULL,
  status TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
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
  cancelled_at INTEGER,
  -- Composite unique: one product per subscription
  UNIQUE(stripe_subscription_id, product)
);

-- Step 2: Copy existing data
INSERT OR IGNORE INTO subscriptions_new 
SELECT * FROM subscriptions;

-- Step 3: Drop old table
DROP TABLE IF EXISTS subscriptions;

-- Step 4: Rename new table
ALTER TABLE subscriptions_new RENAME TO subscriptions;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_product ON subscriptions(product);
