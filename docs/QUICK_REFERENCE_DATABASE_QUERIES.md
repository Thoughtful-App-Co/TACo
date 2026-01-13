# Quick Reference: Database Queries

**⚠️ CRITICAL: Read `/docs/DATABASE_OPERATIONS.md` before running ANY database queries**

This is a quick reference for common, SAFE, READ-ONLY queries. 

## Safety First

✅ **These queries are SAFE (read-only):**
- `SELECT` statements
- `COUNT(*)` aggregations
- `GROUP BY` reports

❌ **NEVER run these without review:**
- `UPDATE` statements
- `DELETE` statements
- `INSERT` statements
- `DROP` or `ALTER` statements

---

## LocoTaco Founding Members

```bash
# Current member count (production)
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT COUNT(*) as count FROM subscriptions WHERE product = 'taco_club' AND status IN ('active', 'trialing')"

# Detailed breakdown (production)
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN lifetime_access = 1 THEN 1 ELSE 0 END) as lifetime,
    SUM(CASE WHEN lifetime_access = 0 THEN 1 ELSE 0 END) as monthly,
    SUM(total_paid_cents) / 100.0 as total_revenue
   FROM subscriptions 
   WHERE product = 'taco_club' 
   AND status IN ('active', 'trialing')"

# Recent members (last 10)
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT id, user_id, lifetime_access, total_payments, created_at 
   FROM subscriptions 
   WHERE product = 'taco_club' 
   ORDER BY created_at DESC 
   LIMIT 10"
```

## All Subscriptions

```bash
# Summary by product and status
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT product, status, COUNT(*) as count 
   FROM subscriptions 
   GROUP BY product, status 
   ORDER BY product, status"

# Active subscriptions only
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT product, COUNT(*) as count 
   FROM subscriptions 
   WHERE status IN ('active', 'trialing') 
   GROUP BY product"
```

## User Lookups

```bash
# Find user's subscriptions
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT * FROM subscriptions WHERE user_id = 'USER_ID_HERE'"

# Find user by email
npx wrangler d1 execute auth-db --env production --command \
  "SELECT id, email, created_at FROM users WHERE email = 'user@example.com'"
```

## Environment Flags

- **Local:** `--local` (no `--env` flag)
- **Staging:** `--env staging` or no flag (default)
- **Production:** `--env production` ⚠️

---

**Remember:**
1. Always test in local/staging first
2. Document operations in `/docs/DATABASE_OPERATIONS.md`
3. Use Stripe Dashboard for detailed subscription management
4. When in doubt, ask for review

**Full guide:** `/docs/DATABASE_OPERATIONS.md`
