-- TACo Credits Schema
-- Run with: wrangler d1 execute taco-billing --remote --file=migrations/0003_credits_schema.sql

-- Credits balance table
CREATE TABLE IF NOT EXISTS credits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_purchased INTEGER NOT NULL DEFAULT 0,
  lifetime_used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credits_user ON credits(user_id);

-- Credit transactions log
CREATE TABLE IF NOT EXISTS credit_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'purchase' | 'use' | 'refund' | 'bonus'
  amount INTEGER NOT NULL, -- positive for add, negative for deduct
  balance_after INTEGER NOT NULL,
  description TEXT,
  stripe_payment_id TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
