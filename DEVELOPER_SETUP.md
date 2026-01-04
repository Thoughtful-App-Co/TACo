# Developer Setup Guide

This guide provides detailed instructions for setting up the TACo development environment on your local machine.

## Prerequisites

Ensure you have the following software installed and meet the version requirements:

| Requirement            | Version | Check Command    | Install                                                    |
| ---------------------- | ------- | ---------------- | ---------------------------------------------------------- |
| **Node.js**            | 20.0.0+ | `node --version` | [nodejs.org](https://nodejs.org/)                          |
| **pnpm**               | 9.0.0+  | `pnpm --version` | `npm install -g pnpm`                                      |
| **Git**                | Latest  | `git --version`  | [git-scm.com](https://git-scm.com/)                        |
| **Cloudflare Account** | N/A     | N/A              | [dash.cloudflare.com](https://dash.cloudflare.com/sign-up) |

### Optional Tools

- **Stripe CLI**: For local webhook testing

  ```bash
  # macOS
  brew install stripe/stripe-cli/stripe

  # Other platforms: https://stripe.com/docs/stripe-cli
  ```

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/TACo.git
cd TACo
```

### 2. Install Dependencies

TACo uses pnpm for package management:

```bash
pnpm install
```

This installs all dependencies from `package.json`, including:

- SolidJS (frontend framework)
- Vite (build tool)
- Wrangler (Cloudflare CLI)
- And many more...

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your actual API keys. **Note:** TACo uses a TEST/LIVE suffix pattern for environment-specific secrets because Cloudflare Pages secrets are shared between preview and production deployments.

```bash
# =============================================================================
# ENVIRONMENT-SPECIFIC SECRETS (use TEST suffix for local development)
# =============================================================================

# JWT Secret for signing authentication tokens
# Generate with: openssl rand -base64 32
JWT_SECRET_TEST=your-strong-random-jwt-secret-at-least-32-chars
JWT_SECRET_PROD=different-production-secret-here

# Stripe API Keys (use TEST keys for local development)
STRIPE_SECRET_KEY_TEST=sk_test_your-stripe-secret-key
STRIPE_SECRET_KEY_LIVE=sk_live_your-production-key
STRIPE_WEBHOOK_SECRET_TEST=whsec_test_your-webhook-secret
STRIPE_WEBHOOK_SECRET_LIVE=whsec_live_your-production-webhook

# =============================================================================
# SHARED SECRETS (same for all environments)
# =============================================================================

# Required for magic link emails
RESEND_API_KEY=re_your-resend-api-key
RESEND_FROM_EMAIL=auth@thoughtfulappco.com

# Required for AI features (Tenure, Tempo)
# NOTE: With "Bring Your Own Key" feature, this is optional for local dev
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional: Bureau of Labor Statistics (for Tenure labor market data)
BLS_API_KEY=your-bls-registration-key-here

# Optional: News APIs (for Paper Trail)
GUARDIAN_API_KEY=your-guardian-api-key-here
GNEWS_API_KEY=your-gnews-api-key-here

# Optional: O*NET API (for Tenure career data)
ONET_API_KEY=your-onet-api-key-here
```

#### Why the TEST/LIVE Pattern?

**Problem:** Cloudflare Pages secrets are shared between preview and production deployments.

**Solution:** We use TEST/LIVE suffixes and select the correct secret at runtime based on the `TACO_ENV` variable:

```typescript
// Code automatically selects the right secret
const jwtSecret =
  context.env.TACO_ENV === 'production' ? context.env.JWT_SECRET_PROD : context.env.JWT_SECRET_TEST;
```

**Local Development:** Uses TEST secrets (from `.dev.vars`)  
**Cloudflare Pages:** Contains BOTH test and live secrets (set in dashboard)

#### How to Get API Keys

| Service          | Purpose                    | Free Tier            | Get Key                                                                        |
| ---------------- | -------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| **Anthropic**    | Claude AI for Tenure/Tempo | Yes (limited)        | [console.anthropic.com](https://console.anthropic.com/)                        |
| **Stripe**       | Billing/subscriptions      | Yes (test mode)      | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)           |
| **Resend**       | Email delivery             | Yes (100 emails/day) | [resend.com/api-keys](https://resend.com/api-keys)                             |
| **BLS**          | Labor market data          | Yes (500 req/day)    | [data.bls.gov/registrationEngine](https://data.bls.gov/registrationEngine/)    |
| **The Guardian** | News articles              | Yes (5,000 req/day)  | [open-platform.theguardian.com](https://open-platform.theguardian.com/access/) |
| **GNews**        | News aggregation           | Yes (100 req/day)    | [gnews.io](https://gnews.io/)                                                  |
| **O\*NET**       | Career data                | Yes (with limits)    | [services.onetcenter.org](https://services.onetcenter.org/reference/)          |

**Generate JWT Secrets (you need TWO - one for test, one for prod):**

```bash
# Generate TEST secret
openssl rand -base64 32

# Generate PROD secret (different from test!)
openssl rand -base64 32
```

**Get Stripe Webhook Secrets (you need TWO):**

```bash
# TEST webhook secret - Use Stripe CLI for local development
stripe listen --forward-to localhost:8787/api/stripe/webhook
# Copy the webhook secret starting with whsec_test_

# LIVE webhook secret - Create in Stripe Dashboard
# 1. Go to https://dashboard.stripe.com/webhooks
# 2. Create endpoint for your production URL
# 3. Copy the webhook secret starting with whsec_live_
```

**Important:** For production deployment, you must set BOTH test and live secrets in the Cloudflare Dashboard. See the "Cloudflare Pages Secrets" section below.

### 4. Create Personal D1 Databases (Recommended)

Each developer should create their own local D1 databases to avoid conflicts:

```bash
# Create auth database
wrangler d1 create taco-auth-dev-yourname

# Create billing database
wrangler d1 create taco-billing-dev-yourname
```

**Important:** Save the database IDs from the output. You'll need them to update `wrangler.toml` if you want to use remote databases (not required for `--local` development).

**Note:** For local development with the `--local` flag, you don't need to update `wrangler.toml`. The local SQLite databases are stored in `.wrangler/state/v3/d1/` and are automatically created when you run migrations.

### 5. Apply Database Schemas

Run these commands to set up your local database tables:

#### Local Development (Recommended)

**Quick Setup (NEW!):**

```bash
# Run all migrations at once
npm run db:setup
```

**Or manually:**

```bash
# Apply auth schema (users table)
npm run db:migrate:auth

# Apply billing schema (subscriptions, usage, credits tables)
npm run db:migrate:billing
```

**Reset databases (if needed):**

```bash
# Delete local databases and re-run migrations
npm run db:reset
```

The `--local` flag uses SQLite databases stored in `.wrangler/state/v3/d1/`.

#### Staging (Remote)

If you need to apply schemas to staging databases:

```bash
wrangler d1 execute AUTH_DB --remote --file=migrations/0001_auth_schema.sql
wrangler d1 execute BILLING_DB --remote --file=migrations/0002_billing_schema.sql
wrangler d1 execute BILLING_DB --remote --file=migrations/0003_credits_schema.sql
```

#### Production (Remote)

**⚠️ Caution:** Only apply to production when necessary and with team approval:

```bash
wrangler d1 execute AUTH_DB --env production --remote --file=migrations/0001_auth_schema.sql
wrangler d1 execute BILLING_DB --env production --remote --file=migrations/0002_billing_schema.sql
wrangler d1 execute BILLING_DB --env production --remote --file=migrations/0003_credits_schema.sql
```

### 6. Start the Development Server

```bash
pnpm run dev
```

This starts two concurrent processes:

1. **Vite Dev Server** (port 5173)
   - Hot module replacement (HMR)
   - Fast refresh for SolidJS components
   - Frontend development at `http://localhost:5173`

2. **Wrangler Pages Dev** (port 8787)
   - Cloudflare Pages Functions (API endpoints)
   - D1 database access
   - Backend development at `http://localhost:8787`

### Two-Server Development Setup

TACo uses a dual-server architecture for optimal development:

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Vite)                                    │
│  http://localhost:5173                              │
│  - SolidJS components                               │
│  - Hot module replacement                           │
│  - Fast refresh                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ API calls to http://localhost:8787/api/*
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  Backend (Wrangler)                                 │
│  http://localhost:8787                              │
│  - Cloudflare Pages Functions                       │
│  - D1 Database access                               │
│  - API endpoints in /functions/api/*                │
└─────────────────────────────────────────────────────┘
```

**Why two servers?**

- Vite provides fast HMR for frontend development
- Wrangler emulates Cloudflare's runtime for backend functions
- Separation allows independent frontend/backend development

**During development:**

- Build frontend: `http://localhost:5173`
- Test API endpoints: `http://localhost:8787/api/*`
- Frontend proxies API calls to Wrangler server

## Verifying Your Setup

After starting the dev server, verify everything works:

### 1. Check Frontend

Visit `http://localhost:5173` in your browser:

- You should see the TACo homepage
- No console errors (check DevTools)

### 2. Check Backend

Test an API endpoint:

```bash
# Test the health check endpoint (if available)
curl http://localhost:8787/api/health

# Or test any other API endpoint
curl http://localhost:8787/api/labor-market
```

### 3. Check Database

Query your local database:

```bash
# Check if users table exists
wrangler d1 execute AUTH_DB --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# Check if subscriptions table exists
wrangler d1 execute BILLING_DB --local --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## Cloudflare Pages Secrets (for Production Deployment)

When deploying to Cloudflare Pages, you need to set secrets in the dashboard because `.dev.vars` is only for local development.

### Setting Secrets in Cloudflare Dashboard

1. Go to **Workers & Pages** → **TACo**
2. Click **Settings** → **Environment Variables**
3. Add all required secrets for **BOTH** preview and production:

#### Required Secrets (Set All of These)

**Environment-Specific (you need BOTH test and live versions):**

```
JWT_SECRET_TEST=your-test-jwt-secret
JWT_SECRET_PROD=your-production-jwt-secret
STRIPE_SECRET_KEY_TEST=sk_test_xxx
STRIPE_SECRET_KEY_LIVE=sk_live_xxx
STRIPE_WEBHOOK_SECRET_TEST=whsec_test_xxx
STRIPE_WEBHOOK_SECRET_LIVE=whsec_live_xxx
```

**Shared Secrets (same value for all environments):**

```
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=auth@thoughtfulappco.com
ANTHROPIC_API_KEY=sk-ant-xxx
ONET_API_KEY=your-onet-key
BLS_API_KEY=your-bls-key
GUARDIAN_API_KEY=your-guardian-key
GNEWS_API_KEY=your-gnews-key
```

### Why Set Both Test and Live?

Cloudflare Pages **shares secrets** between preview and production deployments. Our code uses `TACO_ENV` to select the correct secret:

- **Preview deployments** (`TACO_ENV=preview` or `staging`): Uses TEST secrets
- **Production deployment** (`TACO_ENV=production`): Uses LIVE secrets

Example from code:

```typescript
const stripeKey =
  context.env.TACO_ENV === 'production'
    ? context.env.STRIPE_SECRET_KEY_LIVE
    : context.env.STRIPE_SECRET_KEY_TEST;
```

### Using Wrangler CLI to Set Secrets

Alternatively, use the `wrangler secret put` command:

```bash
# Set secrets for preview/staging environment
wrangler secret put JWT_SECRET_TEST
wrangler secret put JWT_SECRET_PROD
wrangler secret put STRIPE_SECRET_KEY_TEST
wrangler secret put STRIPE_SECRET_KEY_LIVE
wrangler secret put STRIPE_WEBHOOK_SECRET_TEST
wrangler secret put STRIPE_WEBHOOK_SECRET_LIVE
wrangler secret put RESEND_API_KEY
wrangler secret put ONET_API_KEY

# Secrets are automatically available to both preview and production
# The code selects the right one based on TACO_ENV
```

**Note:** Secrets set via CLI or dashboard are immediately available to all deployments.

## Troubleshooting

### Common Issues

#### Issue: `pnpm: command not found`

**Solution:** Install pnpm globally:

```bash
npm install -g pnpm
```

#### Issue: `wrangler: command not found`

**Solution:** pnpm install should have installed it locally. Try:

```bash
pnpm run dev
# or
pnpm exec wrangler --version
```

#### Issue: Port already in use (5173 or 8787)

**Solution:** Kill the process using the port:

```bash
# macOS/Linux
lsof -ti:5173 | xargs kill -9
lsof -ti:8787 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

#### Issue: Database migrations fail

**Solution:**

1. Check that the migration files exist in `migrations/`
2. Ensure you're using the correct binding name (`AUTH_DB`, `BILLING_DB`)
3. Try deleting `.wrangler/state/v3/d1/` and re-running migrations

#### Issue: API calls return 404

**Solution:**

- Ensure Wrangler server is running on port 8787
- Check that functions are in `functions/api/` directory
- Verify `pages_build_output_dir = "dist"` in `wrangler.toml`

#### Issue: TypeScript errors

**Solution:**

```bash
# Clear TypeScript cache and rebuild
rm -rf node_modules/.vite
pnpm run type-check
```

#### Issue: `.dev.vars` not being loaded

**Solution:**

- Ensure `.dev.vars` is in the project root
- Restart the Wrangler dev server
- Check that secrets aren't commented out

### Getting Help

If you encounter issues not covered here:

1. Check existing [GitHub Issues](https://github.com/your-org/TACo/issues)
2. Review [docs/](./docs/) for architecture documentation
3. Ask in team chat or create a new issue

## Database Migrations - Important Note

**⚠️ Current Limitation:** TACo currently uses raw SQL files for database schemas, which are manually applied using `wrangler d1 execute` commands. This approach works but has limitations:

- No automatic version tracking
- No rollback capabilities
- Manual execution required
- Difficult to track which migrations have been applied

**Future Improvement:** We plan to migrate to the proper Wrangler D1 migrations system:

```bash
# Future workflow (not yet implemented)
wrangler d1 migrations create AUTH_DB add_user_preferences
wrangler d1 migrations apply AUTH_DB --local
wrangler d1 migrations list AUTH_DB
```

**Benefits of proper migrations:**

- Automatic version tracking
- Migration history in the database
- Rollback support
- Better team collaboration
- Prevents duplicate migrations

For now, developers should:

1. Keep track of which migrations they've applied locally
2. Coordinate with the team before modifying schema files
3. Document any schema changes in pull requests

See [docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md) for more details on our database management strategy and future migration plans.

## Logging

TACo uses a centralized logging system. **Direct `console.*` calls are blocked by ESLint.**

### Frontend (src/)

```typescript
import { logger } from '@/lib/logger';

// Pre-defined namespaced loggers
logger.auth.info('User logged in', { email });
logger.resume.error('Parse failed', error);
logger.laborMarket.debug('API response', data);

// Or create custom namespace
const log = logger.create('MyFeature');
log.debug('Processing...');
```

### Backend (functions/)

```typescript
import { authLog, resumeLog, createLogger } from '../lib/logger';

authLog.info('Token validated');
resumeLog.error('Parse failed', error);

// Or create custom logger
const log = createLogger('MyEndpoint');
log.info('Request received');
```

### Debug Mode

Enable debug logs in production:

```javascript
localStorage.setItem('debug', 'true');
location.reload();
```

See `AGENTS.md` for complete logging documentation.

---

## Next Steps

Now that your environment is set up:

1. **Explore the codebase**: Start with `src/App.tsx` and `src/components/`
2. **Read the docs**: Check out `docs/ARCHITECTURE.md` and feature-specific docs
3. **Read AGENTS.md**: Essential conventions for logging, patterns, and code style
4. **Make a change**: Try modifying a component and see HMR in action
5. **Run quality checks**: `pnpm run validate` before committing
6. **Start contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md) for workflow

Happy coding! 🚀
