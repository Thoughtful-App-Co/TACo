# Contributing to TACo

Welcome! We're excited to have you contribute to the Thoughtful App Co (TACo) project. This guide will help you get started with contributing to our codebase.

## Quick Start

For new developers, here's the fastest path to getting started:

1. **Prerequisites**: Ensure you have Node 20+, pnpm 9+, and a Cloudflare account
2. **Setup**: Follow the [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) guide
3. **Explore**: Review the [docs/](./docs/) folder for architecture and development documentation
4. **Code**: Create a feature branch and start coding
5. **Submit**: Open a pull request following our conventions

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20 or higher
- **pnpm**: Version 9 or higher
- **Cloudflare Account**: Required for deployment (free tier works for development)
- **Git**: For version control

Optional but recommended:

- **Stripe CLI**: For local webhook testing (`stripe listen`)
- **Wrangler**: Installed via pnpm (included in devDependencies)

## Development Setup

For detailed setup instructions, see [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md).

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/TACo.git
cd TACo

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your API keys

# 4. Create local D1 databases (recommended)
wrangler d1 create taco-auth-dev-yourname
wrangler d1 create taco-billing-dev-yourname

# 5. Apply database schemas
wrangler d1 execute AUTH_DB --local --file=migrations/0001_auth_schema.sql
wrangler d1 execute BILLING_DB --local --file=migrations/0002_billing_schema.sql
wrangler d1 execute BILLING_DB --local --file=migrations/0003_credits_schema.sql

# 6. Start the development server
pnpm run dev
```

The dev server runs two processes:

- **Vite** (port 5173): Hot-reloading frontend development
- **Wrangler** (port 8787): Cloudflare Pages Functions (API endpoints)

## Git Workflow

We follow a feature branch workflow with conventional commits.

### Branch Naming

Create descriptive feature branches:

```bash
git checkout -b feature/add-job-search
git checkout -b fix/auth-redirect-loop
git checkout -b refactor/cleanup-theme-styles
```

### Commit Message Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear, semantic commit messages.

#### Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

#### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes only
- **refactor**: Code changes that neither fix bugs nor add features
- **test**: Adding or updating tests
- **chore**: Changes to build process, tooling, or dependencies
- **perf**: Performance improvements
- **style**: Code style changes (formatting, missing semicolons, etc.)

#### Scopes

Use these scopes to indicate which part of the codebase is affected:

- **tenure**: Job search tracking app
- **tempo**: Brain dump/focus app
- **papertrail**: News aggregator app
- **nurture**: Relationship management app
- **auth**: Authentication system
- **billing**: Stripe billing/subscriptions
- **ci**: CI/CD pipeline changes
- **docs**: Documentation

#### Examples

```bash
# Feature addition
git commit -m "feat(tenure): add labor market insights panel"

# Bug fix
git commit -m "fix(auth): resolve magic link expiration issue"

# Documentation
git commit -m "docs: add database migration guide"

# Refactoring
git commit -m "refactor(tempo): simplify brain dump storage logic"

# Multiple scopes
git commit -m "feat(auth,billing): integrate Stripe customer sync"

# With body
git commit -m "fix(tenure): prevent duplicate job applications

Previously, users could accidentally submit the same application
multiple times. This adds a unique constraint and UI validation."
```

### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** with conventional commits
3. **Run quality checks** before pushing:
   ```bash
   pnpm run validate
   ```
4. **Push your branch** and open a pull request
5. **Fill out the PR template** with:
   - Clear description of changes
   - Link to related issues
   - Screenshots/demos if UI changes
6. **Wait for review** - at least one approval required
7. **Address feedback** if requested
8. **Merge** once approved (squash and merge preferred)

## Code Quality

### Logging - Use the Logger

**ESLint enforces `no-console: error`** - Direct `console.*` calls will fail linting.

```typescript
// Frontend (src/)
import { logger } from '@/lib/logger';
logger.auth.info('User logged in', { email });
logger.resume.error('Parse failed', error);

// Backend (functions/)
import { authLog, resumeLog } from '../lib/logger';
authLog.info('Token validated');
resumeLog.error('Parse failed', error);
```

See `AGENTS.md` for full logging documentation.

### Pre-commit Hooks

We use Husky and lint-staged to automatically check code quality before commits:

- **ESLint**: Code linting (includes `no-console` enforcement)
- **Prettier**: Code formatting
- **TypeScript**: Type checking

If pre-commit hooks fail, fix the issues before committing.

### Manual Quality Checks

Run these commands to check your code:

```bash
# Lint TypeScript/JavaScript files
pnpm run lint

# Auto-fix linting issues
pnpm run lint:fix

# Check code formatting
pnpm run format:check

# Auto-format code
pnpm run format

# Type check without emitting files
pnpm run type-check

# Run all checks + build (recommended before PR)
pnpm run validate
```

## Environment Overview

TACo uses a three-tier environment setup:

| Environment         | Branch/Trigger              | Database                    | Stripe Keys   | API Endpoints       |
| ------------------- | --------------------------- | --------------------------- | ------------- | ------------------- |
| **Local**           | Any (dev machine)           | Local SQLite via `--local`  | `sk_test_xxx` | localhost:8787      |
| **Staging/Preview** | PR branches (auto-deploy)   | `taco-*-staging`            | `sk_test_xxx` | `*.pages.dev`       |
| **Production**      | `main` branch (auto-deploy) | `taco-auth`, `taco-billing` | `sk_live_xxx` | thoughtfulappco.com |

### Environment Variables & Secret Naming Pattern

**IMPORTANT: Cloudflare Pages secrets are shared** between preview and production deployments. To handle this, TACo uses a **TEST/LIVE suffix pattern** for environment-specific secrets.

#### Secret Naming Convention

**Environment-Specific Secrets** (selected via `TACO_ENV` variable):

- `JWT_SECRET_TEST` / `JWT_SECRET_PROD`
- `STRIPE_SECRET_KEY_TEST` / `STRIPE_SECRET_KEY_LIVE`
- `STRIPE_WEBHOOK_SECRET_TEST` / `STRIPE_WEBHOOK_SECRET_LIVE`

**Shared Secrets** (same for all environments):

- `ONET_API_KEY`
- `RESEND_API_KEY`
- `ANTHROPIC_API_KEY`
- `BLS_API_KEY`
- `GUARDIAN_API_KEY`
- `GNEWS_API_KEY`

#### How It Works

1. **Local Development**: `.dev.vars` file contains TEST secrets
2. **Cloudflare Pages**: Dashboard contains BOTH test and live secrets
3. **Runtime Selection**: Code checks `context.env.TACO_ENV` to select the correct secret

```typescript
// Example: Selecting the correct JWT secret
const jwtSecret =
  context.env.TACO_ENV === 'production' ? context.env.JWT_SECRET_PROD : context.env.JWT_SECRET_TEST;
```

See [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) for detailed setup instructions.

## Database Management

For detailed database information, see [docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md).

### Schema Files

- `migrations/0001_auth_schema.sql`: Users table
- `migrations/0002_billing_schema.sql`: Subscriptions and usage tracking
- `migrations/0003_credits_schema.sql`: Credit system

### Applying Schemas

```bash
# Local development
wrangler d1 execute AUTH_DB --local --file=migrations/0001_auth_schema.sql

# Staging
wrangler d1 execute AUTH_DB --remote --file=migrations/0001_auth_schema.sql

# Production
wrangler d1 execute AUTH_DB --env production --remote --file=migrations/0001_auth_schema.sql
```

## Project Structure

```
TACo/
├── src/                    # Frontend source code
│   ├── components/         # Solid.js components
│   │   ├── tenure/         # Job search app
│   │   ├── tempo/          # Brain dump app
│   │   ├── papertrail/     # News aggregator
│   │   └── nurture/        # Relationship manager
│   ├── lib/                # Utilities and shared logic
│   ├── schemas/            # Zod validation schemas
│   ├── services/           # API service clients
│   └── theme/              # Theme configurations
├── functions/              # Cloudflare Pages Functions (API)
│   └── api/                # API endpoint handlers
├── migrations/             # Database schema files
├── docs/                   # Project documentation
└── public/                 # Static assets
```

## Testing

Currently, we rely on:

- **TypeScript**: Compile-time type checking
- **ESLint**: Code quality rules
- **Manual testing**: Local development testing

Future improvements:

- Unit tests (Vitest)
- Integration tests
- E2E tests (Playwright)

## Documentation

When adding features, update relevant documentation:

- **Code comments**: For complex logic
- **README updates**: For new capabilities
- **Architecture docs**: In `docs/` folder for significant changes
- **API docs**: For new endpoints

## Getting Help

- **Architecture**: See `docs/ARCHITECTURE.md`
- **Development**: See `DEVELOPER_SETUP.md`
- **Database**: See `docs/DATABASE_SETUP.md`
- **Issues**: Check existing GitHub issues or create a new one
- **Questions**: Open a discussion in GitHub Discussions

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the project
- Assume good intentions

## License

By contributing to TACo, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to TACo! Your efforts help make this project better for everyone.
