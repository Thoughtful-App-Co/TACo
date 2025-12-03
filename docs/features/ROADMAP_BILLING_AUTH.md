# Billing Hub & User Authentication Roadmap

## Overview

This document outlines the roadmap for implementing a billing hub and user authentication system. The goal is to create a lightweight, privacy-respecting user management system that supports feature flags and optional paid features.

---

## Phase 1: User Key System (Local Storage)

### 1.1 Old-School User Keys

**Concept:** Generate unique user keys stored in localStorage for device identification.

**Implementation:**

- Generate a unique user key on first visit (UUID v4 or similar)
- Store in localStorage: `taco_user_key`
- Check for existing key on app load
- If no key detected, prompt for free account creation

**Key Structure:**

```
{
  userKey: "uk_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  createdAt: timestamp,
  deviceFingerprint: optional
}
```

### 1.2 Free Account Flow

**When no user key detected:**

1. Display login/signup modal
2. Collect minimal info:
   - Email (required - for backups & communication)
   - Phone (optional - for SMS notifications if app requires)
3. Generate user key
4. Send registration to server

**Privacy Notice (displayed to user):**

> "We store minimal data to:
>
> - Count active users (for funding purposes)
> - Send you text notifications (if enabled by app features)
> - Email you data backups (if enabled by app features)
> - Process payments for premium features
>
> We do not share your information with third parties."

---

## Phase 2: 6-Digit Passkey Authentication

### 2.1 Passkey Setup

**Initial Setup Flow:**

1. User creates account (Phase 1)
2. Prompt to set 6-digit PIN
3. Hash PIN with user key for storage
4. Store hashed passkey on server

**Storage:**

```
{
  userKey: "uk_xxx...",
  passKeyHash: "hashed_6_digit_pin",
  salt: "unique_salt",
  createdAt: timestamp,
  lastUsed: timestamp
}
```

### 2.2 Authentication Flow

**Accessing Premium/Protected Features:**

1. User attempts to access feature-flagged content
2. Prompt for 6-digit PIN entry
3. Combine with stored user key
4. Validate against server
5. Grant/deny access based on feature flags

**Security Considerations:**

- Rate limiting on PIN attempts (max 5 per 15 minutes)
- Lockout after 10 failed attempts (require email reset)
- Session tokens for authenticated state (expire after 24h or configurable)

---

## Phase 3: Billing Hub

### 3.1 Core Billing Features

**Payment Processing:**

- Integration with payment provider (Stripe recommended)
- Support for:
  - One-time purchases
  - Subscriptions (monthly/yearly)
  - Usage-based billing (if needed)

**Billing Dashboard:**

- Current plan display
- Payment history
- Update payment method
- Cancel/modify subscription
- Download invoices

### 3.2 Data Model

```
User:
  - userKey (primary identifier)
  - email
  - phone (optional)
  - passKeyHash
  - createdAt
  - lastActiveAt

Subscription:
  - userKey (FK)
  - planId
  - status (active, cancelled, past_due, trialing)
  - currentPeriodStart
  - currentPeriodEnd
  - stripeCustomerId
  - stripeSubscriptionId

Payment:
  - userKey (FK)
  - amount
  - currency
  - status
  - stripePaymentIntentId
  - createdAt
```

---

## Phase 4: Feature Flags System

### 4.1 Feature Flag Architecture

**Flag Types:**

- `boolean` - Simple on/off
- `percentage` - Rollout to X% of users
- `userList` - Specific user keys
- `subscription` - Based on plan level

**Flag Structure:**

```
{
  flagKey: "premium_brain_dump",
  type: "subscription",
  requiredPlans: ["pro", "enterprise"],
  fallback: false,
  description: "Access to premium brain dump features"
}
```

### 4.2 Client-Side Implementation

**Feature Flag Check Flow:**

1. App loads, fetches user's feature flags from server
2. Cache flags in localStorage with TTL
3. Expose `hasFeature(flagKey)` utility
4. Components check flags before rendering premium content

**Example Usage:**

```typescript
// Check feature access
if (hasFeature('premium_exports')) {
  showExportOptions();
} else {
  showUpgradePrompt();
}
```

### 4.3 Server-Side Flag Evaluation

**Evaluation Priority:**

1. User-specific overrides
2. Subscription-based access
3. Percentage rollout
4. Default fallback

---

## Implementation Timeline

| Phase | Description          | Priority | Complexity |
| ----- | -------------------- | -------- | ---------- |
| 1.1   | User Key Generation  | High     | Low        |
| 1.2   | Free Account Flow    | High     | Medium     |
| 2.1   | Passkey Setup        | High     | Medium     |
| 2.2   | Authentication Flow  | High     | Medium     |
| 3.1   | Payment Integration  | Medium   | High       |
| 3.2   | Billing Dashboard    | Medium   | Medium     |
| 4.1   | Feature Flag Backend | High     | Medium     |
| 4.2   | Client-Side Flags    | High     | Low        |
| 4.3   | Server Evaluation    | Medium   | Medium     |

---

## API Endpoints (Planned)

```
POST   /api/auth/register      - Create new user account
POST   /api/auth/verify-pin    - Verify 6-digit PIN
POST   /api/auth/reset-pin     - Request PIN reset via email

GET    /api/user/profile       - Get user profile
PATCH  /api/user/profile       - Update profile (email, phone)

GET    /api/billing/status     - Current subscription status
POST   /api/billing/checkout   - Create checkout session
POST   /api/billing/portal     - Create billing portal session
GET    /api/billing/invoices   - List payment history

GET    /api/features           - Get user's feature flags
GET    /api/features/:key      - Check specific feature access
```

---

## Privacy & Data Handling

### What We Store

- User key (device identifier)
- Email address
- Phone number (optional)
- Hashed passkey
- Payment/subscription data (via Stripe)
- Feature flag assignments

### What We Use Data For

- User counting for funding/metrics
- SMS notifications (app-specific features)
- Email backups (app-specific features)
- Payment processing

### What We Don't Do

- Sell or share user data with third parties
- Track browsing behavior outside the app
- Store unnecessary personal information

---

## Technical Notes

### LocalStorage Keys

```
taco_user_key        - Primary user identifier
taco_session_token   - Authenticated session
taco_feature_flags   - Cached feature flags
taco_flags_ttl       - Feature flag cache expiry
```

### Security Measures

- All API calls over HTTPS
- PIN hashed with bcrypt + unique salt
- Session tokens are JWT with short expiry
- Rate limiting on all auth endpoints
- CORS restricted to known origins

---

## Open Questions

1. **Session Duration:** How long should authenticated sessions last?
2. **Multi-Device:** Should users be able to sync across devices?
3. **Recovery:** What's the account recovery flow if user loses device?
4. **Pricing Tiers:** What plans/pricing structure?
5. **Free Tier Limits:** What features are free vs paid?

---

## Next Steps

1. [ ] Finalize authentication flow design
2. [ ] Set up Stripe account and test environment
3. [ ] Implement user key generation (Phase 1.1)
4. [ ] Build registration UI and API (Phase 1.2)
5. [ ] Design feature flag schema
6. [ ] Create database migrations for user/billing tables
