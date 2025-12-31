# Premium Features Implementation Plan

**Status:** Planning Phase - HITL (Human-in-the-Loop) Review
**Last Updated:** 2025-12-26

---

## Overview

This document outlines the implementation plan for TACo's premium features system, including authentication, billing, feature gating, and the specific premium features for each app (Tempo, Tenure, Nurture).

---

## Business Model Summary

### Pricing Tiers (From Current Pricing Page)

| Tier                 | What It Is                       | Monthly Cost     |
| -------------------- | -------------------------------- | ---------------- |
| **Free**             | Local-first, BYOK for AI         | $0               |
| **Sync (per app)**   | Cloud backup + sync for one app  | $2/mo per app    |
| **Sync (all apps)**  | Cloud backup + sync for all apps | $5/mo            |
| **Extras (per app)** | Managed AI + premium features    | Variable per app |
| **Loco TACo Club**   | Early adopter program            | $10/mo for 24mo  |

### Key Principles

1. **Local-first core** - Always free, always works offline
2. **Transparent pricing** - No hidden costs, clear value props
3. **User-supported** - Not ad-funded, not data-mining
4. **Export anytime** - No data lock-in
5. **Trust through transparency** - Open source builds trust

---

## Question 1: Feature Gating Strategy

### Current Feature Categories

| Feature Type      | Examples                                       | Enforcement Point |
| ----------------- | ---------------------------------------------- | ----------------- |
| **Core (Free)**   | Pipeline tracking, basic task management       | No gating         |
| **Sync (Paid)**   | Cloud backup, cross-device sync                | Server-side       |
| **Extras (Paid)** | AI features, advanced analytics, notifications | Server-side       |

### Questions for You:

**Q1.1:** For Tenure Trends Dashboard (that we just spec'd), should it be:

- [ ] **Option A:** Free (local computation, no server needed)
- [ ] **Option B:** Paid Extra (requires subscription to see advanced metrics)
- [ ] **Option C:** Hybrid (basic trends free, advanced insights paid)

**Q1.2:** Email/SMS notifications - are these:

- [ ] **Option A:** Part of Sync subscription (comes with cloud features)
- [ ] **Option B:** Part of Extras subscription (premium engagement)
- [ ] **Option C:** Separate add-on ($X/mo extra)

**Q1.3:** AI features (resume parsing, task refinement) - pricing model:

- [ ] **Option A:** Flat fee per month (unlimited usage)
- [ ] **Option B:** Usage-based (pay per AI call)
- [ ] **Option C:** Hybrid (monthly fee + included credits, pay for overage)

---

## Question 2: Authentication Flow

### User Journey

```
First Visit
    ↓
Use app (local-only, anonymous)
    ↓
[User wants premium feature]
    ↓
Prompt to create account
    ↓
Collect: Email (required), Phone (optional)
    ↓
Generate user key, store in localStorage
    ↓
Set 6-digit PIN
    ↓
Premium features unlocked
```

### Questions for You:

**Q2.1:** Should users be REQUIRED to create an account to use the app at all?

- [ ] **Option A:** No - let them use free features anonymously, require login for premium
- [ ] **Option B:** Yes - everyone creates account (even free tier) for analytics/communication
- [ ] **Option C:** Soft prompt - encourage account creation but allow anonymous use

**Q2.2:** PIN-based auth vs. traditional password:

- [ ] **Option A:** 6-digit PIN only (simple, mobile-friendly)
- [ ] **Option B:** Traditional password (more secure, familiar)
- [ ] **Option C:** Passwordless (magic link via email)
- [ ] **Option D:** Hybrid (PIN for quick access, email for recovery)

**Q2.3:** Session duration:

- [ ] **Option A:** 24 hours (re-auth daily)
- [ ] **Option B:** 7 days (re-auth weekly)
- [ ] **Option C:** 30 days (re-auth monthly)
- [ ] **Option D:** Never expire (until logout)

---

## Question 3: Billing Integration

### Stripe Setup

**Q3.1:** Subscription model for Sync:

- [ ] **Option A:** Monthly only ($2 or $5/mo)
- [ ] **Option B:** Monthly + Annual (discount for annual, e.g., $20/year = 2 months free)
- [ ] **Option C:** Lifetime option (one-time $50 for lifetime sync?)

**Q3.2:** Loco TACo Club mechanics:

- Current plan: $10/mo for 24 months, then lifetime benefits
- Should we allow:
  - [ ] Early buyout (pay remaining balance upfront)
  - [ ] Pause/resume (life happens, let them pause membership)
  - [ ] Transferable (gift to a friend)

**Q3.3:** Extras pricing per app:
Based on your tooltips, Extras are variable. What's the pricing?

| App     | Extras Monthly Cost | What's Included                                    |
| ------- | ------------------- | -------------------------------------------------- |
| Tempo   | **$?/mo**           | Managed AI, analytics, insights                    |
| Tenure  | **$?/mo**           | 5 AI mutations/mo, job matching, notifications     |
| Nurture | **$?/mo**           | Contact insights, relationship tracking, reminders |

**Fill in the blanks:**

- Tempo Extras: $**\_\_**/mo
- Tenure Extras: $**\_\_**/mo
- Nurture Extras: $**\_\_**/mo

---

## Question 4: Telemetry & Privacy

### What We Track

**For Free Users (Anonymous):**

- [ ] Nothing (pure local-first, no telemetry at all)
- [ ] Minimal (app loads, feature usage counts - no content)
- [ ] Basic analytics (page views, session length)

**For Paid Users (Authenticated):**

- User key (UUID)
- Email/phone
- Last active timestamp
- Subscription status
- Feature usage counts (for quota limits)
- App-specific metrics (e.g., applications/week for Tenure quota)

### Questions for You:

**Q4.1:** Free tier telemetry:

- [ ] **Option A:** Zero telemetry (privacy-first, but we're blind to usage)
- [ ] **Option B:** Anonymous aggregates (can't tie to individuals, just counts)
- [ ] **Option C:** Opt-in telemetry (ask permission, explain benefits)

**Q4.2:** What user data do we need to deliver notifications?

- Email (for quota miss, inactivity check-ins) - **Required?** Yes / No
- Phone (for SMS urgency) - **Required?** Yes / No
- Timezone (for sending at appropriate local time) - **Required?** Yes / No

---

## Question 5: Premium Features Specifics

### Tenure Extras - Need Details

From your pricing tooltips:

- "5 AI resume mutations included"
- "Job-specific tailoring"
- "Role archetype transformations"

**Q5.1:** What counts as a "mutation"?

- [ ] Each job application tailoring = 1 mutation
- [ ] Each archetype transformation = 1 mutation
- [ ] Resume parsing counts toward mutation limit?
- [ ] What happens after 5 mutations used? (Buy more? Wait for next month?)

**Q5.2:** Notifications for Tenure (from our Trends Dashboard spec):

- Quota miss (didn't hit weekly application goal)
- Inactivity check-in (7+ days no activity)
- Are these included in:
  - [ ] Tenure Sync ($2/mo)
  - [ ] Tenure Extras ($?/mo)
  - [ ] Separate notification add-on

### Tempo Extras - Need Details

From tooltips:

- "Managed AI for task refinement"
- "Brain dump processing"
- "Usage analytics & insights"

**Q5.3:** AI quota for Tempo:

- [ ] Unlimited AI calls (flat monthly fee)
- [ ] X calls/month included (e.g., 100 brain dumps)
- [ ] Usage-based pricing ($0.10 per AI call)

### Nurture Extras - Future

Nurture isn't built yet, so we can defer. Just confirm:

- [ ] Skip Nurture planning for now
- [ ] Plan it alongside Tempo/Tenure

---

## Question 6: Implementation Priority

What order should we build these in?

### My Suggested Priority

| Phase       | Feature                                 | Why First                                     |
| ----------- | --------------------------------------- | --------------------------------------------- |
| **Phase 1** | Auth system (user keys, login)          | Foundation for everything                     |
| **Phase 2** | Stripe integration (Sync subscriptions) | Simplest paid feature, validates payment flow |
| **Phase 3** | Telemetry heartbeat                     | Needed for usage tracking, notifications      |
| **Phase 4** | Tenure Extras (AI mutations)            | Highest value, most complex                   |
| **Phase 5** | Notification system (email/SMS)         | Requires telemetry, adds retention value      |
| **Phase 6** | Tempo Extras (AI task features)         | Similar to Tenure, can reuse patterns         |
| **Phase 7** | Trends Dashboard premium features       | Polish, differentiation                       |

**Q6.1:** Does this order make sense, or would you prioritize differently?

---

## Question 7: Feature Flags & Rollout

### How Users Discover Premium

**Q7.1:** When a free user encounters a premium feature:

- [ ] **Option A:** Hard gate (can't see it, must upgrade to know it exists)
- [ ] **Option B:** Soft gate (can see UI, disabled with "Upgrade" button)
- [ ] **Option C:** Trial period (try premium free for 7 days, then paywall)

**Q7.2:** Loco TACo Club early access:

- Should club members get:
  - [ ] Beta access to new features first
  - [ ] Vote on feature priority
  - [ ] Exclusive features never released to others

---

## Next Steps

Once you answer these questions, I'll create:

1. **Technical architecture doc** - Schemas, API endpoints, auth flow
2. **Implementation roadmap** - Sprint-by-sprint breakdown
3. **Database schema** - User, subscription, usage tables
4. **API contract** - Exact endpoints for frontend/backend
5. **Feature flag system** - How to gate features in code

---

## Your Turn 🎯

Please answer the questions above (mark checkboxes or fill in blanks). I'll use your answers to generate the detailed implementation plan.

**Most Critical Questions:**

- Q1.1, Q1.2, Q1.3 (what's paid vs free)
- Q2.1 (auth required or optional)
- Q3.3 (Extras pricing)
- Q6.1 (implementation order)
