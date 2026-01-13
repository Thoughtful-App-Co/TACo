# Database Setup and Management

This guide covers database setup, schema management, and operations for TACo's Cloudflare D1 databases.

## Overview

TACo uses **Cloudflare D1**, a serverless SQLite database service, for data persistence. We currently manage schemas using raw SQL files in the `migrations/` directory.

### Current Approach

- **Schema files**: Raw `.sql` files in `migrations/`
- **Execution**: Manual via `wrangler d1 execute` commands
- **Version tracking**: Manual (no automated history)

**Important:** We plan to migrate to Wrangler's built-in migration system for better version tracking and rollback capabilities. See the [Future Improvements](#future-improvements) section.

## Database Environments

TACo uses three database environments to protect production data:

| Environment    | Auth Database                                                  | Billing Database                                                  | Use Case                              |
| -------------- | -------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------- |
| **Local**      | `.wrangler/state/v3/d1/`                                       | `.wrangler/state/v3/d1/`                                          | Local development with `--local` flag |
| **Staging**    | `taco-auth-staging`<br/>`ba7fe27f-e3f3-4329-a884-d9ce0586c507` | `taco-billing-staging`<br/>`82db418e-8563-4086-86c3-22398526a63a` | PR previews and staging               |
| **Production** | `taco-auth`<br/>`483da8b0-94c7-4f9e-ab1a-68df41e5664d`         | `taco-billing`<br/>`b8f3b52c-3061-4402-a8b3-794b45dbb2cb`         | Live production app                   |

### Database Bindings

In code, databases are accessed via bindings defined in `wrangler.toml`:

```typescript
// Cloudflare Pages Function
export async function onRequest({ env }) {
  const { AUTH_DB, BILLING_DB } = env;

  // Query users
  const result = await AUTH_DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
}
```

## Schema Files

All schema files are located in the `migrations/` directory:

### 1. Auth Schema (`0001_auth_schema.sql`)

**Database:** `AUTH_DB`

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER,
  timezone TEXT,
  is_deleted INTEGER DEFAULT 0,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_customer_id);
```

**Purpose:**

- User authentication and profile data
- Stripe customer linking
- Soft delete support

### 2. Billing Schema (`0002_billing_schema.sql`)

**Database:** `BILLING_DB`

```sql
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
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  cancelled_at INTEGER
);

-- Usage tracking table
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
```

**Purpose:**

- Stripe subscription management
- Metered billing and usage tracking

### 3. Credits Schema (`0003_credits_schema.sql`)

**Database:** `BILLING_DB`

```sql
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

-- Credit transactions log
CREATE TABLE IF NOT EXISTS credit_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'purchase' | 'use' | 'refund' | 'bonus'
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  stripe_payment_id TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL
);
```

**Purpose:**

- Credit-based billing system
- Transaction history and auditing

## Applying Schemas

### Local Development

Use the `--local` flag to work with local SQLite databases:

```bash
# Auth database (users)
wrangler d1 execute AUTH_DB --local --file=migrations/0001_auth_schema.sql

# Billing database (subscriptions, usage)
wrangler d1 execute BILLING_DB --local --file=migrations/0002_billing_schema.sql

# Credits database (credits, transactions)
wrangler d1 execute BILLING_DB --local --file=migrations/0003_credits_schema.sql
```

**Note:** Local databases are stored in `.wrangler/state/v3/d1/` and automatically created when you run migrations.

### Staging Environment

Apply schemas to staging databases (used by PR preview deployments):

```bash
# Auth database
wrangler d1 execute AUTH_DB --remote --file=migrations/0001_auth_schema.sql

# Billing database
wrangler d1 execute BILLING_DB --remote --file=migrations/0002_billing_schema.sql

# Credits
wrangler d1 execute BILLING_DB --remote --file=migrations/0003_credits_schema.sql
```

**Note:** Default bindings in `wrangler.toml` point to staging databases.

### Production Environment

**⚠️ Caution:** Always test in staging first. Only apply to production with team approval.

```bash
# Auth database
wrangler d1 execute AUTH_DB --env production --remote --file=migrations/0001_auth_schema.sql

# Billing database
wrangler d1 execute BILLING_DB --env production --remote --file=migrations/0002_billing_schema.sql

# Credits
wrangler d1 execute BILLING_DB --env production --remote --file=migrations/0003_credits_schema.sql
```

**Best practices:**

1. Test schema changes locally first
2. Apply to staging and verify
3. Coordinate with team before production deployment
4. Back up production data before schema changes (see [Backup section](#backup-and-restore))

## Querying Databases

Use `wrangler d1 execute` with the `--command` flag to run queries:

### Local Queries

```bash
# List all tables in AUTH_DB
wrangler d1 execute AUTH_DB --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# Count users
wrangler d1 execute AUTH_DB --local --command="SELECT COUNT(*) as user_count FROM users;"

# View recent users
wrangler d1 execute AUTH_DB --local --command="SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 10;"

# Check subscription status
wrangler d1 execute BILLING_DB --local --command="SELECT user_id, product, status FROM subscriptions;"

# View credit balances
wrangler d1 execute BILLING_DB --local --command="SELECT user_id, balance, lifetime_purchased FROM credits;"
```

### Staging Queries

```bash
# Same commands with --remote instead of --local
wrangler d1 execute AUTH_DB --remote --command="SELECT COUNT(*) FROM users;"
```

### Production Queries

```bash
# Use --env production for production database
wrangler d1 execute AUTH_DB --env production --remote --command="SELECT COUNT(*) FROM users;"
```

### Complex Queries

For complex queries, create a temporary `.sql` file:

```bash
# Create query file
cat > query.sql <<'EOF'
SELECT
  u.email,
  s.product,
  s.status,
  s.current_period_end
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE s.status = 'active'
ORDER BY s.current_period_end DESC;
EOF

# Execute query
wrangler d1 execute AUTH_DB --local --file=query.sql
```

## Backup and Restore

### Backup Strategies

#### Local Backups

Local SQLite databases can be backed up directly:

```bash
# Find your local databases
ls -la .wrangler/state/v3/d1/

# Copy database files
cp .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite backups/
```

#### Remote Backups

For staging and production, export data to SQL:

```bash
# Export users (example - D1 doesn't support direct dumps yet)
wrangler d1 execute AUTH_DB --remote --command="SELECT * FROM users;" > backups/users_$(date +%Y%m%d).json

# Or use custom backup functions
# See functions/api/backup/create.ts for automatic backups to R2
```

**TACo includes backup endpoints:**

- `POST /api/backup/create`: Create full database backup to R2
- `GET /api/backup/download`: Download backup file

### R2 Bucket Backups

TACo uses Cloudflare R2 for automated backups:

| Environment | R2 Bucket              |
| ----------- | ---------------------- |
| Staging     | `taco-backups-staging` |
| Production  | `taco-backups`         |

Backups are stored in R2 and can be restored manually if needed.

### Restore Procedures

1. **Local restore**: Copy `.sqlite` files back to `.wrangler/state/v3/d1/`
2. **Remote restore**: Re-apply schema and import data via SQL
3. **R2 restore**: Download backup from R2 and restore via SQL commands

**⚠️ Important:** There's no automated restore process yet. Manual SQL execution required.

## Database Maintenance

### Checking Database Size

```bash
# Local databases
du -sh .wrangler/state/v3/d1/

# Remote databases (via Cloudflare Dashboard)
# Visit: https://dash.cloudflare.com/[account]/d1
```

### Cleaning Up Test Data

```bash
# Delete test users (local only!)
wrangler d1 execute AUTH_DB --local --command="DELETE FROM users WHERE email LIKE '%test%';"

# Reset sequences (if needed)
wrangler d1 execute AUTH_DB --local --command="DELETE FROM sqlite_sequence;"
```

**⚠️ Never run cleanup commands on production without backups!**

### Optimizing Database

```sql
-- Vacuum database to reclaim space
VACUUM;

-- Analyze tables for query optimization
ANALYZE;
```

## Database Schema Changes

When you need to modify the database schema:

### 1. Create a New Migration File

```bash
# Create new migration
cat > migrations/0004_add_user_preferences.sql <<'EOF'
-- Add user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  theme TEXT DEFAULT 'daylight',
  notifications_enabled INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON user_preferences(user_id);
EOF
```

### 2. Test Locally

```bash
# Apply to local database
wrangler d1 execute AUTH_DB --local --file=migrations/0004_add_user_preferences.sql

# Verify table was created
wrangler d1 execute AUTH_DB --local --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### 3. Update Code

Update TypeScript code to use new schema:

```typescript
interface UserPreferences {
  id: string;
  user_id: string;
  theme: string;
  notifications_enabled: boolean;
  created_at: number;
  updated_at: number;
}
```

### 4. Deploy to Staging

```bash
# Apply to staging
wrangler d1 execute AUTH_DB --remote --file=migrations/0004_add_user_preferences.sql
```

### 5. Deploy to Production

After testing in staging:

```bash
# Apply to production (with team approval)
wrangler d1 execute AUTH_DB --env production --remote --file=migrations/0004_add_user_preferences.sql
```

## Future Improvements

### Migrating to Wrangler D1 Migrations

**Current Limitation:** Our raw SQL approach lacks:

- Automatic version tracking
- Migration history
- Rollback capabilities
- Protection against re-running migrations

**Recommended Migration Plan:**

#### 1. Enable Wrangler Migrations

Create `wrangler.toml` configuration:

```toml
[[d1_databases]]
binding = "AUTH_DB"
database_name = "taco-auth"
database_id = "483da8b0-94c7-4f9e-ab1a-68df41e5664d"
migrations_dir = "migrations/auth"

[[d1_databases]]
binding = "BILLING_DB"
database_name = "taco-billing"
database_id = "b8f3b52c-3061-4402-a8b3-794b45dbb2cb"
migrations_dir = "migrations/billing"
```

#### 2. Reorganize Migration Files

```bash
# Create migration directories
mkdir -p migrations/auth
mkdir -p migrations/billing

# Move existing migrations
mv migrations/0001_auth_schema.sql migrations/auth/0001_create_users.sql
mv migrations/0002_billing_schema.sql migrations/billing/0001_create_subscriptions.sql
mv migrations/0003_credits_schema.sql migrations/billing/0002_create_credits.sql
```

#### 3. Use Wrangler Migration Commands

```bash
# Create new migration
wrangler d1 migrations create AUTH_DB add_user_preferences

# List pending migrations
wrangler d1 migrations list AUTH_DB --local

# Apply migrations
wrangler d1 migrations apply AUTH_DB --local

# Apply to remote
wrangler d1 migrations apply AUTH_DB --remote
```

#### 4. Benefits

- **Version tracking**: Migration history stored in `d1_migrations` table
- **Idempotent**: Migrations only run once
- **Rollback support**: Automatic rollback on failure
- **Team collaboration**: Everyone sees which migrations have been applied
- **CI/CD integration**: Automated migration application

#### 5. Migration Timeline

- **Phase 1** (Current): Manual SQL execution
- **Phase 2** (Next): Reorganize to Wrangler migration structure
- **Phase 3** (Future): Automated migration CI/CD pipeline
- **Phase 4** (Future): Migration rollback procedures

### Additional Future Improvements

1. **Database seeding**: Automated test data generation
2. **Schema versioning**: Track schema versions in code
3. **Migration testing**: Automated tests for migrations
4. **Backup automation**: Scheduled R2 backups
5. **Monitoring**: Database performance metrics
6. **Read replicas**: If D1 supports in future

## Troubleshooting

### Issue: Migration already applied

**Error:** `UNIQUE constraint failed`

**Solution:** Schema files use `CREATE TABLE IF NOT EXISTS`, so re-running is safe. If you need to modify existing tables, create a new migration with `ALTER TABLE`.

### Issue: Database not found

**Error:** `No database with name 'AUTH_DB' found`

**Solution:**

1. Check binding name in `wrangler.toml`
2. Ensure database exists: `wrangler d1 list`
3. For local dev, ensure you're using `--local` flag

### Issue: Cannot connect to remote database

**Solution:**

1. Verify you're authenticated: `wrangler whoami`
2. Check database ID in `wrangler.toml` matches: `wrangler d1 list`
3. Ensure you have access to the Cloudflare account

### Issue: Schema changes not reflected

**Solution:**

1. Restart Wrangler dev server
2. Clear `.wrangler/state/` and re-run migrations
3. Check that you applied to correct environment (local vs remote)

## Additional Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [SQLite SQL Reference](https://www.sqlite.org/lang.html)
- [TACo Developer Setup](../DEVELOPER_SETUP.md)
- [TACo Contributing Guide](../CONTRIBUTING.md)

---

**Questions or issues?** Create a GitHub issue or ask in team discussions.
