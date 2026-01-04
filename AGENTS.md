# AI Agent Instructions for TACo

This document provides essential context for AI agents (Claude, GPT, Copilot, Cursor, etc.) working on the TACo codebase.

## Project Overview

TACo (Thoughtful App Co) is a monorepo containing multiple SolidJS applications:

- **Tenure**: Job search tracking and career management
- **Tempo**: Brain dump and focus/productivity sessions
- **PaperTrail**: News aggregation and tracking
- **Nurture**: Relationship management (planned)

**Tech Stack:**

- Frontend: SolidJS + TypeScript + Vite
- Backend: Cloudflare Pages Functions (Workers)
- Database: Cloudflare D1 (SQLite)
- Styling: Tailwind CSS + custom themes

---

## Critical Conventions

### 1. Logging - USE THE LOGGER, NOT console.\*

**ESLint enforces `no-console: error`** - Direct `console.*` calls will fail linting.

#### Frontend (src/)

```typescript
import { logger } from '@/lib/logger';

// Use pre-defined namespaced loggers
logger.auth.info('User logged in', { email });
logger.auth.error('Login failed', error);

logger.onet.debug('API response', data);
logger.resume.warn('Parse issue', { field });
logger.laborMarket.info('Data fetched');
logger.billing.error('Payment failed', error);

// Or create custom namespace
const log = logger.create('MyFeature');
log.debug('Processing...');
log.info('Complete');
log.error('Failed', error);
```

**Available namespaces:** `auth`, `onet`, `resume`, `laborMarket`, `push`, `pwa`, `billing`, `backup`, `tasks`, `news`, `features`, `storage`, `api`

#### Backend (functions/)

```typescript
import { authLog, onetLog, resumeLog, billingLog, tasksLog, createLogger } from '../lib/logger';

// Use pre-configured loggers
authLog.info('Token validated');
onetLog.error('API failed', error);
billingLog.warn('Subscription expiring');

// Or create custom logger
const log = createLogger('MyEndpoint');
log.info('Request received');
log.error('Processing failed', error);
```

#### Log Levels

| Level   | Use Case                     | Production Visibility      |
| ------- | ---------------------------- | -------------------------- |
| `trace` | Ultra-verbose debugging      | Hidden                     |
| `debug` | Development debugging        | Hidden (unless debug mode) |
| `info`  | Success messages, milestones | Hidden                     |
| `warn`  | Recoverable issues           | **Visible**                |
| `error` | Failures, exceptions         | **Visible**                |

#### Debug Mode (Production)

Users/developers can enable debug logging in production:

```javascript
// In browser console
localStorage.setItem('debug', 'true');
location.reload();

// Or via URL param (temporary)
// https://app.com?debug=true
```

#### Production Build Behavior

Vite automatically strips `console.log/debug/trace/info` calls from production builds via a custom plugin in `vite.config.ts`. Only `console.warn` and `console.error` remain (but you should still use the logger).

---

### 2. File Organization

```
src/
  components/
    tenure/          # Job search app components
    tempo/           # Brain dump app components
    papertrail/      # News aggregator components
    nurture/         # Relationship manager components
    common/          # Shared components
    pricing/         # Pricing/billing components
  lib/
    logger.ts        # Frontend logging utility
    auth.ts          # Auth utilities
    auth-context.tsx # Auth React context
  services/          # API clients (BLS, O*NET, etc.)
  schemas/           # Zod validation schemas
  theme/             # Theme configurations

functions/
  api/               # Cloudflare Pages Functions
    auth/            # Authentication endpoints
    billing/         # Stripe billing endpoints
    resume/          # Resume parsing/mutation
    tasks/           # Task processing
  lib/
    logger.ts        # Backend logging utility
    auth-middleware.ts
```

---

### 3. Code Style

- **TypeScript**: Strict mode, explicit types for public APIs
- **Components**: Functional components with SolidJS primitives
- **State**: SolidJS signals and stores (NOT React hooks)
- **Styling**: Tailwind utility classes, theme tokens
- **Formatting**: Prettier (auto-formatted on commit)

---

### 4. Common Patterns

#### SolidJS Reactivity (NOT React)

```typescript
// CORRECT - SolidJS
import { createSignal, createEffect } from 'solid-js';

const [count, setCount] = createSignal(0);
createEffect(() => console.log(count())); // Note: count() not count

// WRONG - React patterns
const [count, setCount] = useState(0); // NO useState
useEffect(() => {}, []); // NO useEffect
```

#### API Calls with Auth

```typescript
import { authFetch } from '@/lib/auth';

const response = await authFetch('/api/resume/parse', {
  method: 'POST',
  body: JSON.stringify(data),
});
```

#### Error Handling

```typescript
import { logger } from '@/lib/logger';

try {
  const result = await riskyOperation();
  logger.myFeature.info('Success', { result });
} catch (error) {
  logger.myFeature.error('Operation failed', error);
  // Handle gracefully - show user feedback
}
```

---

### 5. Testing Changes

Before committing:

```bash
# Run all quality checks
pnpm run validate

# Or individually:
pnpm run type-check  # TypeScript
pnpm run lint        # ESLint
pnpm run format:check # Prettier
pnpm run build       # Production build
```

---

### 6. Environment Variables

- **Local dev**: `.dev.vars` file (not committed)
- **Production**: Cloudflare Pages secrets
- **Pattern**: TEST/LIVE suffix for env-specific secrets

```typescript
// Code selects correct secret based on TACO_ENV
const secret = env.TACO_ENV === 'production' ? env.JWT_SECRET_PROD : env.JWT_SECRET_TEST;
```

---

### 7. Database

- **D1 bindings**: `AUTH_DB`, `BILLING_DB`
- **Local dev**: SQLite via `--local` flag
- **Migrations**: `migrations/*.sql` (applied manually)

---

## Quick Reference

| Task             | Command/Location           |
| ---------------- | -------------------------- |
| Start dev server | `pnpm run dev`             |
| Run linting      | `pnpm run lint`            |
| Format code      | `pnpm run format`          |
| Type check       | `pnpm run type-check`      |
| Full validation  | `pnpm run validate`        |
| Frontend logger  | `src/lib/logger.ts`        |
| Backend logger   | `functions/lib/logger.ts`  |
| Auth context     | `src/lib/auth-context.tsx` |
| API endpoints    | `functions/api/`           |
| Component themes | `src/theme/`               |

---

## Do NOT

1. Use `console.log/warn/error` directly - use the logger
2. Use React hooks (`useState`, `useEffect`) - use SolidJS primitives
3. Destructure props in SolidJS components - breaks reactivity
4. Commit `.dev.vars` or secrets
5. Skip `pnpm run validate` before PRs

---

## Questions?

- Architecture: `docs/context_engineering/development/ARCHITECTURE.md`
- Setup: `DEVELOPER_SETUP.md`
- Contributing: `CONTRIBUTING.md`
- Database: `docs/DATABASE_SETUP.md`
