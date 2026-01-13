# Unified Auth System - Minimal Cost Strategy

**Goal:** One authentication system for all Thoughtful App Co products  
**Philosophy:** Obsidian-style privacy, minimal data collection, lowest possible cost  
**Status:** Architecture Design

---

## Core Principles

1. **Email-only auth** (no passwords = no password resets = less cost)
2. **Magic link** for login (stateless, no session storage needed)
3. **JWT tokens** (no database sessions)
4. **Cloudflare only** (no external auth provider fees)
5. **Pay-per-use** (only costs when users authenticate)

---

## Cost Breakdown

| Service                | Provider           | Cost              | Notes              |
| ---------------------- | ------------------ | ----------------- | ------------------ |
| **Auth Logic**         | Cloudflare Workers | Free (1M req/day) | JWT generation     |
| **Email Sending**      | Resend             | $0.001/email      | Magic links only   |
| **Token Storage**      | JWT (stateless)    | $0                | No database needed |
| **User Database**      | Cloudflare D1      | $0.001/1M reads   | SQLite, very cheap |
| **Session Management** | Client-side JWT    | $0                | LocalStorage       |

**Total monthly cost for 1000 users:**

- Auth requests: $0 (within free tier)
- Magic link emails: ~$3/month (1000 users × 3 logins/month × $0.001)
- Database queries: ~$0.01/month
- **TOTAL: ~$3-5/month** for 1000 users

**Compare to Auth0:** ~$228/month for 1000 users  
**Compare to Clerk:** ~$25/month for 1000 users  
**Our approach: ~$3/month** ✅

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│                                                              │
│  1. User enters email                                       │
│  2. Clicks "Send Magic Link"                                │
│  3. Receives email with link                                │
│  4. Clicks link → redirected with token                     │
│  5. Token stored in localStorage                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              CLOUDFLARE WORKER (/api/auth)                   │
│                                                              │
│  POST /api/auth/request-magic-link                          │
│    1. Validate email format                                 │
│    2. Check if user exists (D1 query)                       │
│    3. Generate magic link token (JWT, 15min expiry)         │
│    4. Send email via Resend                                 │
│    5. Return success                                        │
│                                                              │
│  GET /api/auth/verify?token=xxx                             │
│    1. Verify JWT signature                                  │
│    2. Check expiration                                      │
│    3. Generate session token (JWT, 30 day expiry)           │
│    4. Return session token + user data                      │
│                                                              │
│  POST /api/auth/validate                                    │
│    1. Verify session token                                  │
│    2. Return user ID + subscription status                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  CLOUDFLARE D1 (SQLite)                      │
│                                                              │
│  users table:                                               │
│    - id (uuid, primary key)                                 │
│    - email (unique)                                         │
│    - created_at                                             │
│    - last_login_at                                          │
│                                                              │
│  subscriptions table:                                       │
│    - id (uuid)                                              │
│    - user_id (fk)                                           │
│    - product (sync|tempo_extras|tenure_extras)              │
│    - status (active|cancelled|past_due)                     │
│    - stripe_subscription_id                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

```sql
-- Cloudflare D1 (SQLite)

CREATE TABLE users (
  id TEXT PRIMARY KEY, -- UUID
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER,
  timezone TEXT, -- Auto-detected, for notifications

  -- Optional fields
  phone TEXT, -- For SMS notifications (Extras feature)

  -- Metadata
  is_deleted INTEGER DEFAULT 0,
  deleted_at INTEGER
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY, -- UUID
  user_id TEXT NOT NULL REFERENCES users(id),

  -- Product
  product TEXT NOT NULL, -- 'sync' | 'tempo_extras' | 'tenure_extras' | 'taco_club'
  status TEXT NOT NULL, -- 'active' | 'cancelled' | 'past_due' | 'unpaid'

  -- Stripe
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  -- Billing period
  current_period_start INTEGER,
  current_period_end INTEGER,

  -- Timestamps
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  cancelled_at INTEGER
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

CREATE TABLE usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),

  -- Usage type
  resource TEXT NOT NULL, -- 'tempo_ai_call' | 'tenure_mutation'
  count INTEGER DEFAULT 1,

  -- Cost tracking
  cost_cents INTEGER,

  -- Time period
  month TEXT NOT NULL, -- '2025-01' format
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_usage_user_month ON usage(user_id, month);
```

---

## Implementation

### 1. Request Magic Link

```typescript
// functions/api/auth/request-magic-link.ts

import { Resend } from 'resend';
import { SignJWT } from 'jose';

interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  JWT_SECRET_TEST: string;
  JWT_SECRET_PROD: string;
  TACO_ENV: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { email } = await context.request.json();

  // 1. Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response('Invalid email', { status: 400 });
  }

  // 2. Find or create user
  let user = await context.env.DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first();

  if (!user) {
    // Create new user
    const userId = crypto.randomUUID();
    await context.env.DB.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)')
      .bind(userId, email, Date.now())
      .run();

    user = { id: userId, email };
  }

  // 3. Generate magic link token (15 minute expiry)
  // Select the correct JWT secret based on environment
  const jwtSecret =
    context.env.TACO_ENV === 'production'
      ? context.env.JWT_SECRET_PROD
      : context.env.JWT_SECRET_TEST;
  const secret = new TextEncoder().encode(jwtSecret);
  const token = await new SignJWT({ userId: user.id, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .setIssuedAt()
    .sign(secret);

  // 4. Send magic link email
  const resend = new Resend(context.env.RESEND_API_KEY);
  const magicLink = `https://thoughtfulappco.com/auth/verify?token=${token}`;

  await resend.emails.send({
    from: 'Thoughtful App Co <auth@thoughtfulappco.com>',
    to: email,
    subject: 'Your login link',
    html: `
      <p>Click the link below to sign in:</p>
      <p><a href="${magicLink}">Sign in to Thoughtful App Co</a></p>
      <p>This link expires in 15 minutes.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### 2. Verify Magic Link

```typescript
// functions/api/auth/verify.ts

import { jwtVerify, SignJWT } from 'jose';

export async function onRequestGet(context: { request: Request; env: Env }) {
  const url = new URL(context.request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  try {
    // 1. Verify magic link token
    // Select the correct JWT secret based on environment
    const jwtSecret =
      context.env.TACO_ENV === 'production'
        ? context.env.JWT_SECRET_PROD
        : context.env.JWT_SECRET_TEST;
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    const userId = payload.userId as string;
    const email = payload.email as string;

    // 2. Update last login
    await context.env.DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
      .bind(Date.now(), userId)
      .run();

    // 3. Get user's subscriptions
    const subscriptions = await context.env.DB.prepare(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = ?'
    )
      .bind(userId, 'active')
      .all();

    // 4. Generate long-lived session token (30 days)
    const sessionToken = await new SignJWT({
      userId,
      email,
      subscriptions: subscriptions.results.map((s) => s.product),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .setIssuedAt()
      .sign(secret);

    // 5. Redirect to app with token
    return Response.redirect(`https://thoughtfulappco.com/?auth_token=${sessionToken}`, 302);
  } catch (error) {
    return new Response('Invalid or expired token', { status: 401 });
  }
}
```

### 3. Validate Session Token

```typescript
// functions/api/auth/validate.ts

export async function onRequestPost(context: { request: Request; env: Env }) {
  const authHeader = context.request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Missing auth', { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Select the correct JWT secret based on environment
    const jwtSecret =
      context.env.TACO_ENV === 'production'
        ? context.env.JWT_SECRET_PROD
        : context.env.JWT_SECRET_TEST;
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    return new Response(
      JSON.stringify({
        userId: payload.userId,
        email: payload.email,
        subscriptions: payload.subscriptions || [],
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response('Invalid token', { status: 401 });
  }
}
```

---

## Client-Side Integration

### Login Flow

```typescript
// src/lib/auth.ts

export async function requestMagicLink(email: string) {
  const response = await fetch('/api/auth/request-magic-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error('Failed to send magic link');
  }

  return true;
}

export function handleAuthCallback() {
  // Called when user clicks magic link
  const params = new URLSearchParams(window.location.search);
  const token = params.get('auth_token');

  if (token) {
    // Store session token
    localStorage.setItem('taco_session_token', token);

    // Clear URL param
    window.history.replaceState({}, '', '/');

    return true;
  }

  return false;
}

export async function getSession() {
  const token = localStorage.getItem('taco_session_token');
  if (!token) return null;

  try {
    const response = await fetch('/api/auth/validate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Token expired or invalid
      localStorage.removeItem('taco_session_token');
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('taco_session_token');
  window.location.href = '/';
}
```

### Auth Context (Solid.js)

```typescript
// src/lib/auth-context.tsx

import { createContext, useContext, createSignal, createEffect, ParentComponent } from 'solid-js';

interface User {
  userId: string;
  email: string;
  subscriptions: string[];
}

interface AuthContextType {
  user: () => User | null;
  isLoading: () => boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  hasSubscription: (product: string) => boolean;
}

const AuthContext = createContext<AuthContextType>();

export const AuthProvider: ParentComponent = (props) => {
  const [user, setUser] = createSignal<User | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);

  // Check for auth callback on mount
  createEffect(() => {
    handleAuthCallback();
    loadSession();
  });

  async function loadSession() {
    const session = await getSession();
    setUser(session);
    setIsLoading(false);
  }

  async function login(email: string) {
    await requestMagicLink(email);
    // User will receive email, click link, come back
  }

  function hasSubscription(product: string) {
    return user()?.subscriptions.includes(product) || false;
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      hasSubscription,
    }}>
      {props.children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext)!;
```

### Usage in Components

```typescript
// Any component that needs auth

import { useAuth } from '../../lib/auth-context';

export const ProtectedFeature = () => {
  const auth = useAuth();

  if (!auth.user()) {
    return <LoginPrompt />;
  }

  if (!auth.hasSubscription('sync')) {
    return <UpgradePrompt />;
  }

  return <ActualFeature />;
};
```

---

## Integration with Sync Engines

Each sync engine needs the user ID from our auth:

### Zero (Tempo)

```typescript
import { getZeroClient } from './zero-client';
import { useAuth } from '../../lib/auth-context';

const auth = useAuth();
const userId = auth.user()?.userId;

if (userId && auth.hasSubscription('sync')) {
  const zero = getZeroClient(userId);
}
```

### Evolu (Tenure)

```typescript
import { evolu } from './evolu-client';
import { useAuth } from '../../lib/auth-context';

const auth = useAuth();

// Evolu uses mnemonic, but we link it to our user ID
evolu.owner?.metadata = {
  thoughtfulAppCoUserId: auth.user()?.userId,
};
```

### Jazz (Nurture)

```typescript
// Jazz account linked to our user
const ThoughtfulAppCoAuthProvider = {
  async getUser() {
    const session = await getSession();
    if (!session) return null;

    return {
      id: session.userId,
      email: session.email,
    };
  },
};
```

---

## Security Considerations

1. **JWT Secrets:** Use TWO strong random keys (TEST and PROD), store in Cloudflare secrets
   - Generate with: `openssl rand -base64 32`
   - **Never use the same secret for test and production!**
   - Set both `JWT_SECRET_TEST` and `JWT_SECRET_PROD` in Cloudflare dashboard
   - Code selects the correct secret based on `TACO_ENV` variable
2. **Email Validation:** Prevent spam by rate limiting (10 requests/hour per email)
3. **Token Expiry:** Magic links expire in 15 minutes, sessions in 30 days
4. **HTTPS Only:** All auth endpoints require HTTPS
5. **CORS:** Restrict to thoughtfulappco.com domain

### Secret Naming Pattern

**Why TEST/LIVE suffix?** Cloudflare Pages secrets are shared between preview and production deployments. We use environment-specific suffixes and select at runtime:

```typescript
// This pattern is used throughout the codebase
const jwtSecret =
  context.env.TACO_ENV === 'production' ? context.env.JWT_SECRET_PROD : context.env.JWT_SECRET_TEST;
```

**Environment-Specific Secrets:**

- `JWT_SECRET_TEST` - For local and preview environments
- `JWT_SECRET_PROD` - For production only

**Setting Secrets:**

```bash
# Set both secrets in Cloudflare dashboard
wrangler secret put JWT_SECRET_TEST
wrangler secret put JWT_SECRET_PROD

# Local development (.dev.vars)
JWT_SECRET_TEST=your-test-secret-here
JWT_SECRET_PROD=your-production-secret-here
```

---

## Testing

```typescript
// Test magic link flow
describe('Auth', () => {
  it('sends magic link', async () => {
    const response = await fetch('/api/auth/request-magic-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    expect(response.ok).toBe(true);
  });

  it('verifies token', async () => {
    const token = 'valid-test-token';
    const response = await fetch(`/api/auth/verify?token=${token}`);

    expect(response.status).toBe(302); // Redirect
  });
});
```

---

## Next Steps

1. [ ] Set up Cloudflare D1 database
2. [ ] Create auth API endpoints
3. [ ] Integrate Resend for emails
4. [ ] Build login UI component
5. [ ] Add auth context to app
6. [ ] Test magic link flow
7. [ ] Integrate with sync engines

---

## Related Docs

- [Tempo Sync Integration](../tempo/SYNC_INTEGRATION.md)
- [Tenure Sync Integration](../tenure/SYNC_INTEGRATION.md)
- [Nurture Sync Integration](../nurture/SYNC_INTEGRATION.md)
- [Billing Integration](../billing/STRIPE_INTEGRATION.md)
