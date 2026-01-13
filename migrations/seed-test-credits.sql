-- TACo Test Credits Seed Data
-- Run with: pnpm run db:seed (or manually with wrangler d1 execute)
--
-- Gives test users credits for AI features

-- ============================================================================
-- CREDITS FOR TEST USERS (BILLING_DB)
-- ============================================================================

-- Premium user gets 100 credits
INSERT OR REPLACE INTO credits (
  id, user_id, balance, lifetime_purchased, lifetime_used, created_at, updated_at
) VALUES (
  'credits-test-premium',
  'test-user-premium',
  100,
  100,
  0,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- Sync user gets 10 credits (for testing limits)
INSERT OR REPLACE INTO credits (
  id, user_id, balance, lifetime_purchased, lifetime_used, created_at, updated_at
) VALUES (
  'credits-test-sync',
  'test-user-sync',
  10,
  10,
  0,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- Free user gets 0 credits
INSERT OR REPLACE INTO credits (
  id, user_id, balance, lifetime_purchased, lifetime_used, created_at, updated_at
) VALUES (
  'credits-test-free',
  'test-user-free',
  0,
  0,
  0,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);
