# Pricing Page Implementation & Design

**Last Updated:** January 16, 2026  
**Status:** Production

---

## Overview

TACo's pricing page implements transparent, user-friendly pricing with modular components and A24-inspired design aesthetics. This document consolidates all pricing implementation details.

---

## Current Pricing Structure

### Products & Tiers

| Product             | Monthly  | Annual        | Details                               |
| ------------------- | -------- | ------------- | ------------------------------------- |
| **Sync (per app)**  | $2/mo    | $20/year      | Cloud backup + sync for one app       |
| **Sync (all apps)** | $3.50/mo | $35/year      | Best value - all current/future apps  |
| **Tempo Extras**    | $12/mo   | $120/year     | Unlimited AI task processing          |
| **Tenure Extras**   | $5/mo    | $30/year      | 10 AI resume mutations/mo + analytics |
| **Echoprax Extras** | $8/mo    | $80/year      | Unlimited AI workout generation       |
| **Loco TACo Club**  | $25/mo   | $500 lifetime | Early adopter program (24 months)     |

### Pricing Philosophy

- **Local-first core** - Always free, always works offline
- **Transparent pricing** - No hidden costs, clear value props
- **User-supported** - Not ad-funded, not data-mining
- **Export anytime** - No data lock-in

---

## Technical Implementation

### Component Architecture

```
src/components/pricing/
├── index.ts              # Barrel export
├── types.ts              # TypeScript interfaces
├── tokens.ts             # Design system tokens
├── data.ts               # Static data (apps, tooltips, FAQ)
├── Tooltip.tsx           # A24-inspired tooltip component
├── HeroSection.tsx       # Hero header with gradient text
├── ExtrasSection.tsx     # App extras with tooltips
└── WhyCard.tsx           # Transparency explanation cards
```

### Key Features

1. **Modular Components** - Each section is self-contained (~150 lines)
2. **A24-Inspired Tooltips** - Film grain texture, gradient accents, accessibility
3. **Gradient Text** - Cross-browser compatible hero titles
4. **Transparency Cards** - "Why" explanations for each pricing tier
5. **App-Specific Content** - Individual tooltips for Tempo, Tenure, Echoprax

---

## Design Details

### 1. Hero Section with Gradient Text

**Challenge:** Gradient text rendering inconsistently across browsers.

**Solution:**

```tsx
<span
  style={{
    background: gradient,
    '-webkit-background-clip': 'text',
    '-webkit-text-fill-color': 'transparent',
    'background-clip': 'text',
    '-moz-background-clip': 'text',
    '-moz-text-fill-color': 'transparent',
  }}
>
  Build your perfect plan
</span>
```

**Key Points:**

- Mozilla prefixes added for Firefox compatibility
- Removed conflicting `color` fallback
- Gradient only visible through text

### 2. A24-Inspired Tooltips

**Design Grading:**

- **Color Palette: A** - High contrast, brand-aligned gradients
- **Typography: A** - Clear hierarchy, excellent readability
- **Spacing: A** - Consistent 8px grid system
- **Layout: A** - Structured with accent bars

**Features:**

- Film grain texture overlay
- Gradient accent bar at top
- Subtle corner gradient
- Drop shadow with blur
- Inner glow for depth
- Divider between sections
- Keyboard navigation (Enter/Space)
- ARIA labels for accessibility

**Location:** `src/components/pricing/Tooltip.tsx`

### 3. Transparency System

**Purpose:** Help users understand pricing rationale.

**WhyCard Component:**

```tsx
<WhyCard
  text="Running servers costs us real money—storage, bandwidth, 
  maintenance. We pass those costs directly to you at near-cost pricing. 
  No markup, no games."
/>
```

**Visual Design:**

- Coral left border for emphasis
- Subtle gradient background (coral → yellow)
- Small "WHY?" label in uppercase
- Clear, conversational explanation

**Used for:**

- Sync & Backup explanation
- App Extras (AI costs)
- Tempo/Tenure/Echoprax-specific costs
- Loco TACo Club rationale

---

## Transparency Messaging

### Core Principles

1. **Non-Technical Language** - "Running servers costs real money" vs "Infrastructure overhead"
2. **Trust Building** - "No markup, no games"
3. **Educational** - Explains BYOK option, shows value
4. **Honest** - Shows actual cost breakdown where appropriate

### Messaging by Tier

**Sync & Backup:**

> "Running servers costs us real money—storage, bandwidth, maintenance. We pass those infrastructure costs directly to you with no markup."

**App Extras (General):**

> "Developer time to build and maintain features, plus inference costs for AI processing. You can BYOK (free) or pay us to manage it for you."

**Tempo Extras:**

> "Development time to build smart task features, plus inference costs for processing. We handle the complexity so you don't have to."

**Tenure Extras:**

> "Developer time building resume intelligence, plus inference costs for each AI-powered transformation and job matching analysis."

**Echoprax Extras:**

> "Development time for workout intelligence features, plus inference costs for AI-powered workout generation and analysis."

**Loco TACo Club:**

> "We want to reward our early adopters and believers. Your support now helps us build the foundation, and in return you get legacy benefits forever. You're not just a customer—you're part of creating this ecosystem."

---

## App-Specific Tooltips

### Tempo Extras

**Title:** Tempo Extras  
**Price:** $12/mo or $120/year  
**Description:** AI-powered task management and brain dump processing

**Features:**

- ✓ Managed AI for task refinement
- ✓ Brain dump processing
- ✓ Smart task difficulty estimation
- ✓ Auto-grouping by dependencies
- ✓ Usage analytics & insights
- ✓ Priority API access

### Tenure Extras

**Title:** Tenure Extras  
**Price:** $5/mo or $30/year  
**Description:** AI resume mutations and career intelligence

**Features:**

- ✓ 10 AI resume mutations/month
- ✓ Job-specific tailoring
- ✓ Role archetype transformations
- ✓ ATS optimization
- ✓ Career trends dashboard
- ✓ Pay-as-you-go for additional mutations

### Echoprax Extras

**Title:** Echoprax Extras  
**Price:** $8/mo or $80/year  
**Description:** Unlimited AI-powered workout generation

**Features:**

- ✓ Unlimited AI workout generation
- ✓ Advanced workout scheduling
- ✓ Workout history sync
- ✓ Custom exercise library
- ✓ Priority support

### Sync Tooltips (Per App)

**Tempo Sync:** Your tasks, sessions, and brain dumps backed up and synced  
**Tenure Sync:** Your resumes, applications, and job pipeline always safe  
**Echoprax Sync:** Your workouts and progress protected and available

---

## Changes History

### December 2025 - Initial Implementation

- Created modular component architecture
- Implemented A24-inspired tooltips
- Added gradient text to hero section
- Built app-specific tooltip content
- Reduced main file from 1,842 → ~800 lines

### Transparency Update

- Fixed gradient text rendering (cross-browser)
- Added "All Free w/ Options" messaging
- Created WhyCard component
- Added "why" section to tooltips

### Corrections Update

- Removed specific dollar cost mentions
- Reframed as "Developer time + inference costs"
- Updated TACo Club messaging (early adopters)
- Added individual sync app tooltips

---

## Files Reference

| File                                       | Purpose                     |
| ------------------------------------------ | --------------------------- |
| `src/components/PricingPage.tsx`           | Main pricing page component |
| `src/components/pricing/HeroSection.tsx`   | Hero header                 |
| `src/components/pricing/ExtrasSection.tsx` | App extras display          |
| `src/components/pricing/Tooltip.tsx`       | Tooltip system              |
| `src/components/pricing/WhyCard.tsx`       | Transparency cards          |
| `src/components/pricing/data.ts`           | All content and tooltips    |
| `src/components/pricing/types.ts`          | TypeScript definitions      |
| `src/components/pricing/tokens.ts`         | Design system tokens        |

---

## Best Practices

### Adding New Products

1. Add pricing to `data.ts` in `FEATURE_CONFIGS`
2. Add tooltip content if needed
3. Update this documentation
4. Create Stripe products in test/live modes
5. Update `stripe-prices.ts` with price IDs

### Updating Messaging

1. Update `WhyCard` text in components
2. Update tooltip `why` fields in `data.ts`
3. Test cross-browser rendering
4. Update this documentation

### Design Consistency

- Use tokens from `tokens.ts` for colors/spacing
- Follow A24 aesthetic for new components
- Maintain accessibility (ARIA labels, keyboard nav)
- Test with screen readers

---

## Testing Checklist

- [ ] Gradient text renders correctly (Chrome, Firefox, Safari)
- [ ] Tooltips appear on hover/focus
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] WhyCards display correctly
- [ ] App-specific content is accurate
- [ ] Mobile responsive layout
- [ ] Accessibility audit passes (WCAG AA)

---

**For Stripe integration details, see:** `docs/core/billing/STRIPE_INTEGRATION.md`  
**For pricing updates, see:** Git commit history (all changes tracked)
