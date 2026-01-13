-- TACo Test Users Seed Data
-- Run with: pnpm run db:seed (or manually with wrangler d1 execute)
--
-- Creates three test users for local development:
-- 1. premium@test.local - Full premium (all extras + sync)
-- 2. sync@test.local - Sync subscription only
-- 3. free@test.local - Free user (no subscriptions)
--
-- These users are pre-seeded with subscriptions so you can test
-- premium features without needing real Stripe integration.

-- ============================================================================
-- TEST USERS (AUTH_DB)
-- ============================================================================

-- User 1: Full Premium User (all extras + sync)
INSERT OR REPLACE INTO users (id, email, stripe_customer_id, created_at, last_login_at)
VALUES (
  'test-user-premium',
  'premium@test.local',
  'cus_test_premium',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- User 2: Sync Only User
INSERT OR REPLACE INTO users (id, email, stripe_customer_id, created_at, last_login_at)
VALUES (
  'test-user-sync',
  'sync@test.local',
  'cus_test_sync',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- User 3: Free User (no subscriptions)
INSERT OR REPLACE INTO users (id, email, stripe_customer_id, created_at, last_login_at)
VALUES (
  'test-user-free',
  'free@test.local',
  NULL,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);
