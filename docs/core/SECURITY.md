# Security Documentation

This document outlines security measures, best practices, and known considerations for the TACo application.

## Table of Contents

- [Authentication & Authorization](#authentication--authorization)
- [Database Security](#database-security)
- [API Security](#api-security)
- [Environment Variables](#environment-variables)
- [Known Limitations](#known-limitations)

---

## Authentication & Authorization

### JWT Token Validation

All authenticated endpoints use JWT (JSON Web Tokens) for session management:

- **Location**: `functions/lib/auth-middleware.ts`
- **Algorithm**: RS256 (asymmetric encryption)
- **Expiration**: Configurable per token type
- **Validation**: Signature verification + expiration check + subscription verification

### Protected Endpoints

All premium and user-specific endpoints require authentication:

| Endpoint Pattern  | Auth Type | Subscription Required            |
| ----------------- | --------- | -------------------------------- |
| `/api/resume/*`   | JWT       | `tenure_extras` or `taco_club`   |
| `/api/echoprax/*` | JWT       | `echoprax_extras` or `taco_club` |
| `/api/sync/*`     | JWT       | `sync` or `taco_club`            |
| `/api/backup/*`   | JWT       | `sync` or `taco_club`            |
| `/api/billing/*`  | JWT       | No (user's own billing data)     |
| `/api/push/*`     | JWT       | No (prevents spam/abuse)         |

### Authorization Middleware

Use the centralized middleware functions:

```typescript
import {
  validateAuth,
  authorizeSubscriptionFeature,
  authorizeTokenFeature,
} from '../../lib/auth-middleware';

// Basic JWT validation only
const authResult = await validateAuth(request, env);
if (!authResult.success) return authResult.response;

// JWT + subscription check
const authResult = await authorizeSubscriptionFeature(request, env, {
  requiredProducts: ['echoprax_extras', 'taco_club'],
});
if (!authResult.success) return authResult.response;

// JWT + subscription + token deduction
const authResult = await authorizeTokenFeature(request, env, {
  requiredProducts: ['tenure_extras'],
  tokenCost: 1,
  resourceName: 'resume_parsing',
});
if (!authResult.success) return authResult.response;
```

**NEVER:**

- Implement custom JWT validation
- Trust client-side claims without server-side verification
- Skip authentication for endpoints that write data

---

## Database Security

### SQL Injection Prevention

**Status: ✅ PROTECTED**

All database queries use parameterized statements via D1's `.prepare().bind()` pattern:

```typescript
// SECURE - Parameterized query
const user = await env.AUTH_DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

// INSECURE - Never do this!
const user = await env.AUTH_DB.prepare(`SELECT * FROM users WHERE id = '${userId}'`).first();
```

### User Data Scoping

**Status: ✅ PROTECTED**

All queries filter by `user_id` to prevent cross-user data access:

```typescript
// Users can only access their own data
const subscriptions = await env.BILLING_DB.prepare('SELECT * FROM subscriptions WHERE user_id = ?')
  .bind(auth.userId)
  .all();
```

### Database Access Control

- **Local Development**: Local SQLite files in `.wrangler/state/`
- **Staging**: Separate D1 databases (`taco-auth-staging`, `taco-billing-staging`)
- **Production**: Separate D1 databases (`taco-auth`, `taco-billing`)

### Database ID Exposure

**Status: ⚠️ ACCEPTABLE RISK WITH MITIGATION**

Database IDs are visible in `wrangler.toml` for technical reasons:

**Why They're Exposed:**

- Wrangler (Cloudflare's CLI) requires database IDs in configuration files
- Wrangler 3.x does not support environment variable interpolation in `wrangler.toml`
- D1 bindings must be declared at build/deploy time, not runtime

**Why This Is Low Risk:**

- Database IDs alone cannot grant access (requires Cloudflare account authentication)
- D1 databases are scoped to Cloudflare accounts with IAM controls
- Even with the ID, attackers would need:
  1. Access to your Cloudflare account
  2. Valid API tokens with D1 permissions
  3. Bypass Cloudflare's IAM security

**Mitigations in Place:**

1. Documentation in `wrangler.toml` explaining the IDs are public
2. Separate databases for staging vs production
3. All database queries are user-scoped and parameterized
4. Authentication required for all data access
5. Cloudflare account protected with 2FA

**Future Improvement:**
When Wrangler adds support for env var interpolation, migrate to:

```toml
[[d1_databases]]
database_id = "${D1_AUTH_DB_PROD_ID}"
```

---

## API Security

### Error Handling

**Production Responses:**

- Generic error messages (no internal details)
- Appropriate HTTP status codes
- No stack traces or debug information

**Debug Information:**
Debug info is only exposed in non-production environments:

```typescript
const isProduction = env.TACO_ENV === 'production';

if (!isProduction) {
  errorResponse.debugInfo = {
    /* detailed debugging */
  };
}
```

### Rate Limiting

Rate limiting is implemented for public endpoints:

| Endpoint                       | Limit          | Enforcement             |
| ------------------------------ | -------------- | ----------------------- |
| `/api/auth/request-magic-link` | 10/hour per IP | KV-based                |
| `/api/onet/*`                  | 10/min per IP  | Upstream API + KV cache |
| `/api/labor-market`            | 500/day        | Upstream API + KV cache |

### CORS Configuration

CORS is configured per-endpoint with appropriate restrictions:

```typescript
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*', // Or specific domain
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
```

### Webhook Verification

Stripe webhooks are verified using signature validation:

```typescript
const signature = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
// ✅ Verified - safe to process
```

---

## Environment Variables

### Secret Management

**Pattern: TEST/LIVE Suffix**

Cloudflare Pages shares secrets across all environments, so we use suffixes:

```bash
# Set both in Cloudflare Pages dashboard
JWT_SECRET_TEST=test-secret-here
JWT_SECRET_PROD=prod-secret-here

# Runtime selection
const secret = env.TACO_ENV === 'production'
  ? env.JWT_SECRET_PROD
  : env.JWT_SECRET_TEST;
```

### Required Secrets

See `.dev.vars.example` for full list:

**Critical Secrets:**

- `JWT_SECRET_TEST` / `JWT_SECRET_PROD` - Session tokens
- `STRIPE_SECRET_KEY_TEST` / `STRIPE_SECRET_KEY_LIVE` - Payment processing
- `STRIPE_WEBHOOK_SECRET_TEST` / `STRIPE_WEBHOOK_SECRET_LIVE` - Webhook verification

**Shared Secrets:**

- `RESEND_API_KEY` - Magic link emails
- `ANTHROPIC_API_KEY` - AI features
- `ONET_API_KEY` - Career data

### Local Development

Secrets are stored in `.dev.vars` (gitignored):

```bash
# Copy template
cp .dev.vars.example .dev.vars

# Add your secrets
nano .dev.vars
```

**NEVER commit `.dev.vars` to git!**

---

## Known Limitations

### 1. Database IDs in Source Code

**Status**: Acceptable risk (see [Database ID Exposure](#database-id-exposure))

### 2. Shared Cloudflare Pages Secrets

**Issue**: Cloudflare Pages shares secrets across preview and production deployments.

**Mitigation**: TEST/LIVE suffix pattern with runtime selection.

### 3. Push Notifications Storage

**Current**: Push subscription endpoints are authenticated but only log subscriptions.

**Future**: When KV storage is added, ensure:

- User can only manage their own subscriptions
- Subscription keys include user ID: `push:${userId}:${endpoint}`

---

## Security Checklist for New Endpoints

Before deploying a new API endpoint, verify:

- [ ] Uses parameterized database queries (`.prepare().bind()`)
- [ ] Validates authentication if accessing user data
- [ ] Verifies subscription if premium feature
- [ ] Filters queries by `user_id` (user-scoping)
- [ ] Returns generic error messages in production
- [ ] Implements appropriate rate limiting
- [ ] Configures CORS correctly
- [ ] Logs security events (auth failures, rate limits)
- [ ] Uses centralized auth middleware (no custom JWT validation)

---

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Email security concerns to: security@thoughtfulapp.co
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if applicable)

We will acknowledge receipt within 48 hours and provide a fix timeline.

---

## References

- [Cloudflare D1 Security](https://developers.cloudflare.com/d1/platform/security/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Stripe Webhook Security](https://stripe.com/docs/webhooks/signatures)

---

**Last Updated**: January 19, 2026
