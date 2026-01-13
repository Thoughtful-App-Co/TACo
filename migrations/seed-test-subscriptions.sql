-- TACo Test Subscriptions Seed Data
-- Run with: pnpm run db:seed (or manually with wrangler d1 execute)
--
-- Creates subscriptions for test users in BILLING_DB

-- ============================================================================
-- PREMIUM USER SUBSCRIPTIONS (all products)
-- ============================================================================

-- Tenure Extras for premium user
INSERT OR REPLACE INTO subscriptions (
  id, user_id, product, status, stripe_customer_id, stripe_subscription_id,
  stripe_price_id, current_period_start, current_period_end,
  cancel_at_period_end, lifetime_access, created_at, updated_at
) VALUES (
  'sub-test-premium-tenure',
  'test-user-premium',
  'tenure_extras',
  'active',
  'cus_test_premium',
  'sub_test_tenure_extras',
  'price_test_tenure',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now', '+1 year') * 1000,
  0,
  0,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- Tempo Extras for premium user
INSERT OR REPLACE INTO subscriptions (
  id, user_id, product, status, stripe_customer_id, stripe_subscription_id,
  stripe_price_id, current_period_start, current_period_end,
  cancel_at_period_end, lifetime_access, created_at, updated_at
) VALUES (
  'sub-test-premium-tempo',
  'test-user-premium',
  'tempo_extras',
  'active',
  'cus_test_premium',
  'sub_test_tempo_extras',
  'price_test_tempo',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now', '+1 year') * 1000,
  0,
  0,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- Echoprax Extras for premium user
INSERT OR REPLACE INTO subscriptions (
  id, user_id, product, status, stripe_customer_id, stripe_subscription_id,
  stripe_price_id, current_period_start, current_period_end,
  cancel_at_period_end, lifetime_access, created_at, updated_at
) VALUES (
  'sub-test-premium-echoprax',
  'test-user-premium',
  'echoprax_extras',
  'active',
  'cus_test_premium',
  'sub_test_echoprax_extras',
  'price_test_echoprax',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now', '+1 year') * 1000,
  0,
  0,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- Sync for premium user
INSERT OR REPLACE INTO subscriptions (
  id, user_id, product, status, stripe_customer_id, stripe_subscription_id,
  stripe_price_id, current_period_start, current_period_end,
  cancel_at_period_end, lifetime_access, created_at, updated_at
) VALUES (
  'sub-test-premium-sync',
  'test-user-premium',
  'sync_all',
  'active',
  'cus_test_premium',
  'sub_test_sync_all',
  'price_test_sync',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now', '+1 year') * 1000,
  0,
  0,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- ============================================================================
-- SYNC-ONLY USER SUBSCRIPTIONS
-- ============================================================================

-- Sync only subscription
INSERT OR REPLACE INTO subscriptions (
  id, user_id, product, status, stripe_customer_id, stripe_subscription_id,
  stripe_price_id, current_period_start, current_period_end,
  cancel_at_period_end, lifetime_access, created_at, updated_at
) VALUES (
  'sub-test-sync-only',
  'test-user-sync',
  'sync_all',
  'active',
  'cus_test_sync',
  'sub_test_sync_only',
  'price_test_sync',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now', '+1 year') * 1000,
  0,
  0,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- ============================================================================
-- FREE USER - No subscriptions needed (implicit)
-- ============================================================================
-- The free user (test-user-free) has no rows in subscriptions table
