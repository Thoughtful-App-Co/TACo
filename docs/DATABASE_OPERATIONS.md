# Database Operations - Best Practices

This document outlines best practices for direct database access and operations in the TACo project.

## ⚠️ Critical Safety Rules

### 1. **NEVER** Run Write Operations in Production Without:

- [ ] Testing the exact query in local/staging first
- [ ] Having a backup plan or rollback strategy
- [ ] Understanding the full impact (number of rows affected)
- [ ] Documenting the operation in this file or a migration
- [ ] Using transactions when modifying multiple rows

### 2. **ALWAYS** Use Read-Only Queries First

Before any write operation, run a `SELECT` to verify:

- The query targets the correct rows
- The number of affected rows is expected
- The data looks correct

### 3. **NEVER** Run Queries With Destructive Potential Without Review

- `DELETE` statements
- `UPDATE` without `WHERE` clause
- `DROP` statements
- `TRUNCATE` statements

### 4. **ALWAYS** Document Manual Database Operations

Any direct database operation should be logged in the **Database Operation Log** section below.

---

## Safe Database Access Patterns

### Read-Only Queries (SAFE)

These are safe to run in any environment:

```bash
# Check LocoTaco member count
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT COUNT(*) as count FROM subscriptions WHERE product = 'taco_club' AND status IN ('active', 'trialing')"

# View recent subscriptions (limit results!)
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT id, user_id, product, status, created_at FROM subscriptions ORDER BY created_at DESC LIMIT 10"

# Get subscription breakdown
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT product, status, COUNT(*) as count FROM subscriptions GROUP BY product, status"
```

### Write Operations (DANGEROUS - Use With Caution)

Always test in local/staging first:

```bash
# ❌ WRONG - Direct production update without testing
npx wrangler d1 execute taco-billing --env production --command \
  "UPDATE subscriptions SET status = 'cancelled' WHERE id = '...'"

# ✅ CORRECT - Test locally first
# 1. Test in local
npx wrangler d1 execute taco-billing --local --command \
  "SELECT * FROM subscriptions WHERE id = 'test-id-123'"

# 2. Verify the SELECT returns expected data
npx wrangler d1 execute taco-billing --local --command \
  "UPDATE subscriptions SET status = 'cancelled' WHERE id = 'test-id-123'"

# 3. Verify the update worked
npx wrangler d1 execute taco-billing --local --command \
  "SELECT * FROM subscriptions WHERE id = 'test-id-123'"

# 4. ONLY THEN run in production (and document it below)
npx wrangler d1 execute taco-billing --env production --command \
  "UPDATE subscriptions SET status = 'cancelled' WHERE id = 'prod-id-456'"
```

---

## Recommended Workflow for Database Changes

### For Schema Changes (Tables, Columns, Indexes)

**✅ ALWAYS use migrations, NEVER direct DDL**

```bash
# 1. Create a migration file
touch migrations/0005_my_change.sql

# 2. Write SQL in migration file
# 3. Test locally
npx wrangler d1 execute taco-billing --local --file=migrations/0005_my_change.sql

# 4. Apply to staging
npx wrangler d1 execute taco-billing --file=migrations/0005_my_change.sql

# 5. Test staging thoroughly
# 6. Apply to production
npx wrangler d1 execute taco-billing --env production --file=migrations/0005_my_change.sql

# 7. Commit migration to git
git add migrations/0005_my_change.sql
git commit -m "Migration: Add X to Y table"
```

### For Data Fixes (Updates, Deletes)

**Document in Database Operation Log below**

```bash
# 1. Identify the issue and required fix
# 2. Write SELECT query to verify affected rows
# 3. Test in local/staging
# 4. Document the operation below BEFORE running in prod
# 5. Run in production
# 6. Verify the fix worked
# 7. Update documentation with outcome
```

### For Analytics/Reporting (Reads)

**Safe to run anytime, but consider performance**

```bash
# Use LIMIT for large tables
# Avoid complex JOINs during peak hours
# Consider creating a view for common queries
```

---

## Common Safe Queries

### Billing & Subscriptions

```bash
# Get total active subscriptions by product
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT product, COUNT(*) as active_count
   FROM subscriptions
   WHERE status IN ('active', 'trialing')
   GROUP BY product"

# Check specific user's subscriptions
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT * FROM subscriptions WHERE user_id = 'USER_ID_HERE'"

# Find subscriptions nearing payment limit (TACo Club)
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT id, user_id, total_payments, max_payments, created_at
   FROM subscriptions
   WHERE product = 'taco_club'
   AND total_payments >= 22
   AND max_payments = 24"

# Revenue report (total paid per product)
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT product,
          SUM(total_paid_cents) / 100.0 as total_revenue,
          COUNT(*) as total_subscriptions
   FROM subscriptions
   WHERE status IN ('active', 'cancelled', 'trialing')
   GROUP BY product"
```

### User & Authentication

```bash
# Find user by email
npx wrangler d1 execute auth-db --env production --command \
  "SELECT id, email, created_at, last_login FROM users WHERE email = 'user@example.com'"

# Count total users
npx wrangler d1 execute auth-db --env production --command \
  "SELECT COUNT(*) as total_users FROM users"

# Recent signups
npx wrangler d1 execute auth-db --env production --command \
  "SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 20"
```

### Credits/Tokens (Tenure Extras)

```bash
# Check user token balance
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT user_id,
          SUM(CASE WHEN type = 'grant' THEN amount ELSE 0 END) as granted,
          SUM(CASE WHEN type = 'use' THEN amount ELSE 0 END) as used
   FROM token_transactions
   WHERE user_id = 'USER_ID_HERE'
   GROUP BY user_id"

# Find users with low token balance
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT t.user_id,
          SUM(CASE WHEN t.type = 'grant' THEN t.amount
                   WHEN t.type = 'use' THEN -t.amount ELSE 0 END) as balance
   FROM token_transactions t
   GROUP BY t.user_id
   HAVING balance < 5
   ORDER BY balance ASC
   LIMIT 20"
```

---

## Database Operation Log

**Purpose:** Document all manual database operations for audit and troubleshooting

**Format:**

````
### [DATE] - [ENVIRONMENT] - [OPERATION TYPE]
**Performed by:** [Name/Email]
**Reason:** [Why this operation was needed]
**Query:**
```sql
[The exact query that was run]
````

**Affected rows:** [Number]
**Outcome:** [Success/Failure + any notes]
**Rollback plan:** [How to undo if needed]

````

---

### 2025-01-13 - Production - READ (Example)
**Performed by:** Erik Shupp
**Reason:** Verify LocoTaco founding member count for marketing materials
**Query:**
```sql
SELECT COUNT(*) as count
FROM subscriptions
WHERE product = 'taco_club'
AND status IN ('active', 'trialing')
````

**Affected rows:** 0 (read-only)
**Outcome:** Success - Found 0 members (new deployment)
**Rollback plan:** N/A (read-only operation)

---

### [Template for Future Operations]

**Performed by:**
**Reason:**
**Query:**

```sql

```

**Affected rows:**
**Outcome:**
**Rollback plan:**

---

## Emergency Rollback Procedures

### If You Accidentally Modify Data

1. **STOP** - Don't run any more queries
2. **Assess** - Check what was changed:
   ```bash
   # Check recent updates (if you have audit logging)
   npx wrangler d1 execute taco-billing --env production --command \
     "SELECT * FROM subscriptions WHERE updated_at > datetime('now', '-5 minutes')"
   ```
3. **Contact Team** - Notify other team members immediately
4. **Review Backups** - Check if Cloudflare has automatic backups
5. **Manual Restore** - Use backup data to restore affected rows

### If You Accidentally Drop/Delete

1. **STOP IMMEDIATELY** - Prevent further damage
2. **Check Cloudflare Dashboard** - Look for D1 automatic backups
3. **Use Point-in-Time Recovery** - If available in Cloudflare
4. **Restore from Stripe** - Subscriptions can be re-synced from Stripe webhook replay
5. **Document the incident** - Update this log with what happened and how it was fixed

---

## Best Practices Summary

### DO ✅

- Always test queries in local/staging first
- Use `SELECT` before `UPDATE`/`DELETE`
- Use `LIMIT` for exploratory queries
- Document manual operations in this file
- Use migrations for schema changes
- Use transactions for multi-step operations
- Keep read-only queries for regular monitoring

### DON'T ❌

- Run untested queries in production
- Use `UPDATE`/`DELETE` without `WHERE` clause
- Run DDL statements (`ALTER`, `DROP`) directly in production
- Skip documentation for manual operations
- Trust clipboard - always verify the query before pressing Enter
- Run queries during peak hours unless necessary

---

## Monitoring & Alerts

### Set Up Alerts For:

- Unusual spike in database queries (potential bug)
- Failed queries in production
- Large number of writes (potential runaway process)
- Database size approaching limits

### Regular Health Checks:

```bash
# Weekly: Check subscription health
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT product, status, COUNT(*) FROM subscriptions GROUP BY product, status"

# Monthly: Review database size
# (Use Cloudflare Dashboard → D1 → Storage metrics)

# As needed: Verify data integrity
npx wrangler d1 execute taco-billing --env production --command \
  "SELECT COUNT(*) FROM subscriptions WHERE user_id IS NULL OR product IS NULL"
```

---

## Additional Resources

- **Wrangler D1 Docs:** https://developers.cloudflare.com/d1/
- **SQL Best Practices:** https://www.sqlite.org/bestpractice.html
- **Cloudflare D1 Limits:** https://developers.cloudflare.com/d1/platform/limits/
- **TACo Migrations:** `/migrations/` directory in repo
- **TACo Billing Schema:** `migrations/0002_billing_schema.sql`

---

## Questions?

Before running a query you're unsure about:

1. Ask a team member to review
2. Test in local/staging environments
3. Document your plan in this file
4. Sleep on it if it's not urgent (fresh eyes help)

**Remember:** It's better to ask than to accidentally corrupt production data. 🛡️
