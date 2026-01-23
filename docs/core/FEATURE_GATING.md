# Feature Gating & Premium Features - Best Practices

**Status:** ✅ Production Standard  
**Created:** 2025-01-07  
**Last Updated:** 2025-01-07

---

## Overview

This document defines the **single source of truth** for implementing premium features and subscription gates across all TACo apps (Tenure, Tempo, Echoprax, Nurture).

**Core Principle:** One centralized system for checking subscriptions and showing upgrade prompts.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENT LAYER                          │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│  │ Tenure   │   │  Tempo   │   │ Echoprax │               │
│  │ Features │   │ Features │   │ Features │               │
│  └──────────┘   └──────────┘   └──────────┘               │
│       │              │               │                      │
│       └──────────────┴───────────────┘                      │
│                      │                                      │
│                      ▼                                      │
│       ┌──────────────────────────────┐                     │
│       │   src/lib/feature-gates.ts   │  ◄── Single Source  │
│       │  • canUseMutation()          │      of Truth       │
│       │  • canUseTempoAI()           │                     │
│       │  • canUseEchopraxAI()        │                     │
│       └──────────────────────────────┘                     │
│                      │                                      │
│                      ▼                                      │
│       ┌──────────────────────────────┐                     │
│       │ src/components/common/       │                     │
│       │        Paywall.tsx           │  ◄── Single UI      │
│       │  • Handles upgrade flow      │      Component      │
│       │  • Stripe checkout           │                     │
│       │  • Login modal               │                     │
│       └──────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (Cloudflare Workers)                │
│                                                             │
│  /api/auth/validate  →  Returns subscription list          │
│  /api/billing/*      →  Stripe integration                 │
└─────────────────────────────────────────────────────────────┘
```

---

## The Rules

### ✅ DO

1. **Always use `feature-gates.ts`** for subscription checks
2. **Always use `Paywall` component** for upgrade prompts
3. **Add new features to `FEATURE_CONFIGS`** in Paywall
4. **Cache subscription data** (already handled by feature-gates)
5. **Check both `.allowed` and `.reason`** from feature gate results

### ❌ DON'T

1. **Don't check subscriptions directly** in components
2. **Don't create custom paywall modals** per feature
3. **Don't duplicate Stripe checkout logic**
4. **Don't bypass the auth context**
5. **Don't hardcode pricing** outside of Paywall configs

---

## Implementation Patterns

### Pattern 1: Basic Feature Gate

**Use case:** Premium feature with no trial period

```typescript
// Component: src/components/tenure/prepare/components/MutationPanel.tsx

import { Component, createSignal, Show } from 'solid-js';
import { canUseMutation } from '../../../../lib/feature-gates';
import { Paywall } from '../../../common/Paywall';

export const MutationPanel: Component = () => {
  const [showPaywall, setShowPaywall] = createSignal(false);

  const handleMutate = () => {
    // 1. Check access via feature-gates.ts
    const access = canUseMutation();

    if (!access.allowed) {
      // 2. Show standard paywall
      setShowPaywall(true);
      return;
    }

    // 3. Proceed with feature
    performMutation();
  };

  return (
    <>
      <button onClick={handleMutate}>Mutate Resume</button>

      {/* 4. Use common Paywall component */}
      <Paywall
        isOpen={showPaywall()}
        onClose={() => setShowPaywall(false)}
        feature="tenure_extras"
      />
    </>
  );
};
```

---

### Pattern 2: Trial System (Free Generations)

**Use case:** Feature with X free uses before paywall

```typescript
// 1. Create trial tracking service
// File: src/components/echoprax/lib/ai-usage.service.ts

const STORAGE_KEY = 'echoprax_ai_usage';
const FREE_TRIAL_LIMIT = 3;

export class AIUsageService {
  static getUsageSummary() {
    const used = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
    return {
      used,
      limit: FREE_TRIAL_LIMIT,
      remaining: Math.max(0, FREE_TRIAL_LIMIT - used),
    };
  }

  static incrementUsage(): void {
    const current = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
    localStorage.setItem(STORAGE_KEY, (current + 1).toString());
  }

  static hasTrialRemaining(): boolean {
    return this.getUsageSummary().remaining > 0;
  }
}
```

```typescript
// 2. Component checks both subscription AND trial
// File: src/components/echoprax/WorkoutPromptGenerator.tsx

import { Component, createSignal, createMemo } from 'solid-js';
import { canUseEchopraxAI } from '../../lib/feature-gates';
import { AIUsageService } from './lib/ai-usage.service';
import { Paywall } from '../common/Paywall';

export const WorkoutPromptGenerator: Component = () => {
  const [showPaywall, setShowPaywall] = createSignal(false);

  // Check subscription
  const isPremium = createMemo(() => canUseEchopraxAI().allowed);

  // Check trial
  const trialRemaining = createMemo(() => AIUsageService.getUsageSummary().remaining);

  const handleGenerate = async () => {
    // Premium users: unlimited
    if (isPremium()) {
      await generateWorkout();
      return;
    }

    // Free users: check trial
    if (trialRemaining() > 0) {
      await generateWorkout();
      AIUsageService.incrementUsage();
      return;
    }

    // Trial exhausted: show paywall
    setShowPaywall(true);
  };

  return (
    <>
      <button onClick={handleGenerate}>
        Generate Workout
        {!isPremium() && ` (${trialRemaining()} free remaining)`}
      </button>

      {/* Standard paywall - handles both auth and upgrade */}
      <Paywall
        isOpen={showPaywall()}
        onClose={() => setShowPaywall(false)}
        feature="echoprax_extras"
      />
    </>
  );
};
```

---

### Pattern 3: Conditional UI (Show/Hide Premium Features)

**Use case:** Display premium features grayed out or hidden

```typescript
import { Component, Show, createMemo } from 'solid-js';
import { canUseTempoAI } from '../../../lib/feature-gates';

export const SettingsSidebar: Component = () => {
  const hasTempoExtras = createMemo(() => canUseTempoAI().allowed);

  return (
    <div>
      {/* Always visible */}
      <MenuItem>Basic Settings</MenuItem>

      {/* Conditionally visible */}
      <Show when={hasTempoExtras()}>
        <MenuItem>AI Settings</MenuItem>
        <MenuItem>Analytics</MenuItem>
      </Show>

      {/* Or show but disabled */}
      <MenuItem
        disabled={!hasTempoExtras()}
        onClick={() => !hasTempoExtras() && setShowPaywall(true)}
      >
        AI Settings {!hasTempoExtras() && '(Premium)'}
      </MenuItem>
    </div>
  );
};
```

---

### Pattern 4: Async Checks (Fresh Subscription Data)

**Use case:** After login or when cache may be stale

```typescript
import { canUseMutationAsync } from '../../../lib/feature-gates';

const handleActionAfterLogin = async () => {
  // Async version fetches fresh subscription data
  const access = await canUseMutationAsync();

  if (access.allowed) {
    // Proceed
  } else {
    setShowPaywall(true);
  }
};
```

---

## Adding a New Premium Feature

### Step 1: Add to `feature-gates.ts`

```typescript
// File: src/lib/feature-gates.ts

// 1. Add to FeatureName type
export type FeatureName = 'mutation' | 'tempo_ai' | 'echoprax_ai' | 'my_new_feature'; // ADD THIS

// 2. Add to SubscriptionTier type (if new tier)
export type SubscriptionTier =
  | 'free'
  | 'tenure_extras'
  | 'tempo_extras'
  | 'echoprax_extras'
  | 'my_new_tier'; // ADD THIS IF NEEDED

// 3. Create feature gate function
export function canUseMyNewFeature(): FeatureGateResult {
  if (!isAuthenticated()) {
    return {
      allowed: false,
      reason: 'Sign in required',
      requiresAuth: true,
      upgradeUrl: '/pricing',
    };
  }

  const subs = getCachedSubscriptions();

  if (subs.includes('my_new_tier') || subs.includes('taco_club')) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'My New Tier subscription required',
    requiresSubscription: 'my_new_tier',
    upgradeUrl: '/pricing#my-new-tier',
  };
}

// 4. Add async version
export async function canUseMyNewFeatureAsync(): Promise<FeatureGateResult> {
  if (!isAuthenticated()) {
    return {
      allowed: false,
      reason: 'Sign in required',
      requiresAuth: true,
      upgradeUrl: '/pricing',
    };
  }

  const subs = await getSubscriptions(); // Fresh data

  if (subs.includes('my_new_tier') || subs.includes('taco_club')) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'My New Tier subscription required',
    requiresSubscription: 'my_new_tier',
    upgradeUrl: '/pricing#my-new-tier',
  };
}

// 5. Add to canAccessFeature() switch
export function canAccessFeature(feature: FeatureName): FeatureGateResult {
  switch (feature) {
    case 'my_new_feature':
      return canUseMyNewFeature();
    // ... existing cases
  }
}
```

---

### Step 2: Add to `Paywall` Component

```typescript
// File: src/components/common/Paywall.tsx

// 1. Add to PaywallProps feature union type
interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'tenure_extras' | 'tempo_extras' | 'sync' | 'backup' | 'my_new_tier'; // ADD
  featureName?: string;
}

// 2. Add to FEATURE_CONFIGS
const FEATURE_CONFIGS: Record<string, FeatureConfig> = {
  // ... existing configs
  my_new_tier: {
    title: 'My New Feature',
    description: 'Unlock advanced capabilities for X.',
    benefits: ['Benefit 1', 'Benefit 2', 'Benefit 3', 'Benefit 4', 'Benefit 5'],
    price: '$X/mo',
    priceAnnual: '$Y/year', // Optional
    priceId: 'price_my_new_tier_monthly', // Stripe price ID
    ctaText: 'Upgrade to My New Tier',
    icon: 'rocket', // or 'shield'
  },
};
```

---

### Step 3: Use in Components

```typescript
import { canUseMyNewFeature } from '@/lib/feature-gates';
import { Paywall } from '@/components/common/Paywall';

const [showPaywall, setShowPaywall] = createSignal(false);

const handleAction = () => {
  const access = canUseMyNewFeature();
  if (!access.allowed) {
    setShowPaywall(true);
    return;
  }
  // Proceed
};

<Paywall
  isOpen={showPaywall()}
  onClose={() => setShowPaywall(false)}
  feature="my_new_tier"
/>
```

---

## Special Cases

### Case 1: Trial + Paywall Combo

For features with free trials (like Echoprax AI), you need:

1. **Trial tracking service** (localStorage)
2. **Check subscription first**, trial second
3. **Standard `Paywall`** when trial exhausted

See Pattern 2 above for full example.

### Case 2: Usage Quotas (Metered Billing)

For features with monthly limits (like Tenure's 20 AI credits/month for 10 operations):

```typescript
import { canUseMutation } from '@/lib/feature-gates';
import { getMutationsRemaining } from '@/lib/usage-tracker';

const handleMutate = () => {
  // 1. Check subscription
  const access = canUseMutation();
  if (!access.allowed) {
    setShowPaywall(true);
    return;
  }

  // 2. Check quota
  if (getMutationsRemaining() <= 0) {
    setError('Monthly limit reached. Limit resets on the 1st.');
    return;
  }

  // 3. Proceed
  performMutation();
};
```

**Note:** Quota exhaustion shows an error, NOT the paywall (they already have subscription).

### Case 3: Geographic/Region-Based Features

For features that vary by location (like BLS labor market data):

```typescript
import { getLaborMarketFeatures } from '@/lib/feature-gates';

const checkFeatureAvailability = async () => {
  const laborFeatures = await getLaborMarketFeatures();

  if (!laborFeatures.available) {
    setError(laborFeatures.unavailableMessage);
    return;
  }

  // Proceed
};
```

**Note:** Geographic restrictions don't trigger paywall (it's a data availability issue, not subscription).

---

## Testing Premium Features

### Local Development

```typescript
// Force subscription status in dev
// In browser console:
localStorage.setItem('taco_session_token', 'dev_token');

// Or stub feature gates
export function canUseMutation(): FeatureGateResult {
  if (import.meta.env.DEV) {
    return { allowed: true }; // Always allowed in dev
  }
  // Production logic
}
```

### Stripe Test Mode

1. Use Stripe test keys in `.dev.vars`
2. Test checkout with card: `4242 4242 4242 4242`
3. Webhook testing: `stripe listen --forward-to localhost:8788/api/stripe/webhook`

---

## Migration Checklist

When refactoring existing premium features to this pattern:

- [ ] Move subscription checks to `feature-gates.ts`
- [ ] Replace custom paywall modals with `Paywall` component
- [ ] Add feature config to `FEATURE_CONFIGS`
- [ ] Remove duplicated Stripe checkout logic
- [ ] Test auth flow (login → upgrade → feature access)
- [ ] Test trial flow (if applicable)
- [ ] Update component imports to use feature-gates

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Direct Subscription Checks

```typescript
// BAD - Scattered logic
if (user?.subscriptions?.includes('tenure_extras')) {
  // allowed
}

// GOOD - Centralized
const access = canUseMutation();
if (access.allowed) {
  // allowed
}
```

### ❌ Anti-Pattern 2: Custom Paywall Per Feature

```typescript
// BAD - Duplicate modals
<TenurePremiumGate ... />
<TempoPremiumGate ... />
<EchopraxPremiumGate ... />

// GOOD - Single reusable component
<Paywall feature="tenure_extras" ... />
<Paywall feature="tempo_extras" ... />
<Paywall feature="echoprax_extras" ... />
```

### ❌ Anti-Pattern 3: Hardcoded Pricing

```typescript
// BAD - Magic strings
<p>Upgrade for $5/month</p>

// GOOD - Centralized config
<Paywall feature="tenure_extras" />  // Pricing in FEATURE_CONFIGS
```

### ❌ Anti-Pattern 4: Bypassing Auth Context

```typescript
// BAD - Direct localStorage access
const token = localStorage.getItem('taco_session_token');

// GOOD - Use auth context or feature gates
const auth = useAuth();
const access = canUseMutation();
```

---

## File Reference

| File                                | Purpose                          |
| ----------------------------------- | -------------------------------- |
| `src/lib/feature-gates.ts`          | **ALL subscription checks**      |
| `src/components/common/Paywall.tsx` | **Single upgrade UI**            |
| `src/lib/auth-context.tsx`          | Auth state management            |
| `src/lib/usage-tracker.ts`          | Quota tracking (local)           |
| `functions/api/auth/validate.ts`    | Subscription validation (server) |
| `functions/api/billing/*`           | Stripe integration (server)      |

---

## Examples in Codebase

### ✅ Good Examples

| Component       | Pattern Used         | Location                                                     |
| --------------- | -------------------- | ------------------------------------------------------------ |
| MutationPanel   | Basic gate + Paywall | `src/components/tenure/prepare/components/MutationPanel.tsx` |
| SettingsSidebar | Conditional UI       | `src/components/tempo/ui/settings-sidebar.tsx`               |
| Paywall         | Reusable modal       | `src/components/common/Paywall.tsx`                          |

### ⚠️ Needs Refactoring

| Component              | Issue                | Location                                  |
| ---------------------- | -------------------- | ----------------------------------------- |
| PremiumGate (Echoprax) | Duplicate of Paywall | `src/components/echoprax/PremiumGate.tsx` |

---

## Summary

**The Golden Rule:**

- **Check:** `feature-gates.ts`
- **Show:** `Paywall` component
- **Configure:** `FEATURE_CONFIGS` in Paywall

**One source of truth. No exceptions.**

---

**Questions?** Check `docs/core/billing/STRIPE_INTEGRATION.md` for backend details.
