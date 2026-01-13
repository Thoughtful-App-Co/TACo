-- Migration: Add TACo Club columns to subscriptions table
-- Run with: npx wrangler d1 execute taco-billing-staging --remote --file=migrations/0004_add_taco_club_columns.sql
--
-- This migration adds columns that may be missing from older schema versions.
-- WARNING: NOT idempotent - SQLite ALTER TABLE ADD COLUMN will error if column already exists.

-- Add TACo Club payment tracking columns
-- Note: SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so we catch errors

-- total_payments: Track number of monthly payments made
ALTER TABLE subscriptions ADD COLUMN total_payments INTEGER DEFAULT 0;

-- max_payments: Maximum payments before lifetime access (e.g., 24 for TACo Club)
ALTER TABLE subscriptions ADD COLUMN max_payments INTEGER;

-- lifetime_access: 1 if user has permanent access (paid in full or completed payments)
ALTER TABLE subscriptions ADD COLUMN lifetime_access INTEGER DEFAULT 0;

-- total_paid_cents: Total amount paid in cents
ALTER TABLE subscriptions ADD COLUMN total_paid_cents INTEGER DEFAULT 0;
