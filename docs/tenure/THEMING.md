# Tenure Theming System

**Last Updated:** December 28, 2025  
**Version:** 2.0 (Dynamic RIASEC + Semantic Colors)

---

## Overview

The Tenure app uses a **dual theming system** that combines:

1. **Dynamic primary/secondary colors** from user's RIASEC profile (Discover assessment)
2. **Fixed semantic colors** (success, warning, error) for consistency and accessibility

This approach ensures personalization while maintaining semantic meaning across the UI.

---

## Architecture

### File Structure

```
src/
├── theme/
│   ├── semantic-colors.ts          # Fixed semantic colors (success, warning, error, etc.)
│   ├── liquid.ts                   # Base liquid design tokens
│   └── maximalist.ts               # Maximalist theme with RIASEC colors
├── components/tenure/
│   ├── TenureThemeProvider.tsx     # Context provider with useTenureTheme() hook
│   └── pipeline/
│       ├── theme/
│       │   ├── liquid-tenure.ts     # Merged liquid + maximalist theme
│       │   └── riasec-colors.ts     # Dynamic color derivation from RIASEC
│       └── trends/
│           └── components/          # All components use useTenureTheme()
```

---

## Core Concepts

### 1. Semantic Colors (Always Fixed)

**File:** `src/theme/semantic-colors.ts`

These colors maintain consistent meaning and **NEVER change** based on user preferences:

| Semantic Color | Hex Value               | Usage                                                   |
| -------------- | ----------------------- | ------------------------------------------------------- |
| `success.base` | `#10B981` (Emerald 500) | Optimal performance, completed tasks, positive outcomes |
| `warning.base` | `#F59E0B` (Amber 500)   | Caution, moderate performance, attention needed         |
| `error.base`   | `#EF4444` (Red 500)     | Critical issues, poor performance, failures             |
| `info.base`    | `#3B82F6` (Blue 500)    | Informational states, neutral highlights                |
| `optimal.base` | `#06B6D4` (Cyan 500)    | Ideal/excellent states, good matches                    |
| `neutral.base` | `#6B7280` (Gray 500)    | Inactive, disabled, neutral states                      |

**Why Fixed?**  
Semantic colors must remain consistent for:

- **Accessibility**: Users rely on color meaning (red = danger)
- **Usability**: Consistent patterns reduce cognitive load
- **Universal understanding**: Cultural conventions (green = go, red = stop)

### 2. Dynamic Colors (RIASEC-Based)

**File:** `src/components/tenure/pipeline/theme/riasec-colors.ts`

These colors derive from the user's RIASEC profile:

| RIASEC Type   | Color              | Temperature |
| ------------- | ------------------ | ----------- |
| Realistic     | `#F97316` (Orange) | Hot         |
| Investigative | `#8B5CF6` (Purple) | Cool        |
| Artistic      | `#EC4899` (Pink)   | Hot         |
| Social        | `#10B981` (Green)  | Cool        |
| Enterprising  | `#EAB308` (Yellow) | Hot         |
| Conventional  | `#06B6D4` (Cyan)   | Cool        |

**Color Selection Logic:**

1. User completes Discover assessment → RIASEC scores stored in `localStorage` (`augment_answers`)
2. `getCurrentDuotone()` reads scores and selects:
   - **Primary color**: Top RIASEC type
   - **Secondary color**: Second-highest RIASEC type
3. If no profile exists → defaults to `investigative` (purple) + `artistic` (pink)

**Usage:**

```typescript
import { getCurrentDuotone } from './pipeline/theme/riasec-colors';

const duotone = getCurrentDuotone();
// { primary: '#8B5CF6', secondary: '#EC4899', primaryOpacity: 1, secondaryOpacity: 0.4 }
```

---

## Usage Guide

### For Components

**Old Pattern (Deprecated):**

```typescript
// ❌ Don't do this anymore
interface MyComponentProps {
  theme?: () => typeof liquidTenure;
}

const MyComponent: Component<MyComponentProps> = (props) => {
  const theme = () => props.theme?.() || liquidTenure;
  return <div style={{ color: theme().colors.primary }}>...</div>;
};
```

**New Pattern (✅ Recommended):**

```typescript
import { useTenureTheme } from '../TenureThemeProvider';

const MyComponent: Component = () => {
  const theme = useTenureTheme();

  return (
    <div
      style={{
        // Dynamic colors (change based on RIASEC)
        color: theme.colors.primary,         // User's top RIASEC color
        background: theme.colors.secondary,  // User's 2nd RIASEC color

        // Semantic colors (always fixed)
        'border-color': theme.semantic.success.base,  // Always green

        // Other theme tokens
        'font-family': theme.fonts.heading,
        padding: theme.spacing.md,
      }}
    >
      Content
    </div>
  );
};
```

### Accessing Theme Properties

```typescript
const theme = useTenureTheme();

// Base colors (dynamic from RIASEC)
theme.colors.primary; // Top RIASEC type color
theme.colors.secondary; // 2nd RIASEC type color
theme.colors.accent; // From maximalist theme
theme.colors.background; // '#121212' (dark)
theme.colors.text; // '#F3F4F6' (light gray)

// Semantic colors (always fixed)
theme.semantic.success.base; // '#10B981' (green)
theme.semantic.warning.base; // '#F59E0B' (amber)
theme.semantic.error.base; // '#EF4444' (red)
theme.semantic.info.base; // '#3B82F6' (blue)

// Utility color groups
theme.velocity.optimal; // { base, bg, border } for optimal velocity
theme.score.excellent; // { color, label } for 80-100% scores
theme.aging.warning; // { color, bg, border, pulse } for aging indicators
theme.trend.up; // { color, bg, border } for upward trends

// Typography
theme.fonts.heading; // 'Dosis', sans-serif
theme.fonts.body; // 'Gafata', Georgia, serif

// Spacing
theme.spacing.xs; // '4px'
theme.spacing.md; // '16px'
theme.spacing.xxl; // '64px'

// Animations
theme.animations.fast; // '150ms'
theme.animations.slow; // '600ms'
```

### Helper Hooks

```typescript
import {
  useTenureTheme,       // Full theme object
  useSemanticColors,    // Only semantic colors
  useDynamicColors,     // Only RIASEC dynamic colors
  useVelocityColors,    // Velocity status colors
  useScoreColors,       // Match score colors
} from '../TenureThemeProvider';

// Example: Get only semantic colors
const semantic = useSemanticColors();
<div style={{ color: semantic.success.base }}>Excellent!</div>

// Example: Get only dynamic RIASEC colors
const dynamic = useDynamicColors();
<div style={{ background: `linear-gradient(${dynamic.primary}, ${dynamic.secondary})` }}>
```

---

## Color Helper Functions

### hexToRgba()

Convert hex colors to rgba format:

```typescript
import { hexToRgba } from '../../theme/semantic-colors';

const theme = useTenureTheme();

<div
  style={{
    background: hexToRgba(theme.colors.primary, 0.15),  // Primary color at 15% opacity
    border: `1px solid ${hexToRgba(theme.semantic.success.base, 0.3)}`,  // Green border at 30%
  }}
/>
```

### getSeasonalScoreColor()

Get semantic color based on seasonal hiring score (1-10 scale):

```typescript
import { getSeasonalScoreColor } from '../../theme/semantic-colors';

const color = getSeasonalScoreColor(9); // Returns '#10B981' (success green)
const color = getSeasonalScoreColor(5); // Returns '#F59E0B' (warning amber)
```

---

## Migration Guide

### Migrating Existing Components

**Step 1: Remove theme prop**

```diff
interface MyComponentProps {
  data: SomeData;
-  theme?: () => typeof liquidTenure;
}
```

**Step 2: Replace theme function with hook**

```diff
+ import { useTenureTheme } from '../TenureThemeProvider';

export const MyComponent: Component<MyComponentProps> = (props) => {
-  const theme = () => props.theme?.() || liquidTenure;
+  const theme = useTenureTheme();
```

**Step 3: Replace theme() calls with theme**

```diff
- <div style={{ color: theme().colors.primary }}>
+ <div style={{ color: theme.colors.primary }}>
```

**Step 4: Replace hardcoded colors**

```diff
- <div style={{ color: '#10B981' }}>Success!</div>
+ <div style={{ color: theme.semantic.success.base }}>Success!</div>

- stroke={successRate > 0.7 ? '#10B981' : '#EF4444'}
+ stroke={successRate > 0.7 ? theme.semantic.success.base : theme.semantic.error.base}
```

**Step 5: Remove theme prop from child components**

```diff
- <ChildComponent data={data} theme={theme} />
+ <ChildComponent data={data} />
```

---

## Provider Setup

The `TenureThemeProvider` is already wrapped around the entire Tenure app in `TenureApp.tsx`:

```typescript
// src/components/tenure/TenureApp.tsx
import { TenureThemeProvider } from './TenureThemeProvider';

export const TenureApp: Component = () => {
  return (
    <TenureThemeProvider>
      <div>
        {/* All Tenure components have access to useTenureTheme() */}
      </div>
    </TenureThemeProvider>
  );
};
```

**No additional setup required!** Any component inside `TenureApp` can use `useTenureTheme()`.

---

## Best Practices

### ✅ DO:

- Use `theme.semantic.*` for success/warning/error states
- Use `theme.colors.primary/secondary` for branded UI elements
- Use helper hooks (`useSemanticColors()`, `useDynamicColors()`) for specific needs
- Use `hexToRgba()` for transparent variants of theme colors
- Document why you chose a semantic vs. dynamic color

### ❌ DON'T:

- Hardcode hex colors like `#10B981`, `#EF4444` (use semantic tokens instead)
- Change semantic color meanings (green must always mean success)
- Pass theme as a prop (use context via `useTenureTheme()`)
- Use RIASEC colors for semantic meanings (don't use user's primary color for "error")

---

## Color Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                     Need a color?                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
          Does it convey              Personal branding/
          semantic meaning?           decoration?
                 │                         │
                 ▼                         ▼
    ┌────────────────────────┐   ┌──────────────────────┐
    │ Use semantic colors    │   │ Use dynamic colors   │
    │                        │   │                      │
    │ success → Green        │   │ primary → RIASEC top │
    │ warning → Amber        │   │ secondary → RIASEC 2 │
    │ error → Red            │   │                      │
    │ info → Blue            │   │ gradients → duotone  │
    └────────────────────────┘   └──────────────────────┘
```

**Examples:**

- ✅ "Application accepted" → `theme.semantic.success.base` (green)
- ✅ "Needs attention" → `theme.semantic.warning.base` (amber)
- ✅ Card header gradient → `linear-gradient(theme.colors.primary, theme.colors.secondary)`
- ✅ Icon duotone → `primary={theme.dynamic.primary} secondary={theme.dynamic.secondary}`

---

## Troubleshooting

### Error: "useTenureTheme must be used within TenureThemeProvider"

**Cause:** Component is outside the provider tree.  
**Solution:** Ensure `TenureApp.tsx` wraps everything in `<TenureThemeProvider>`.

### Colors don't update when RIASEC profile changes

**Cause:** `getCurrentDuotone()` reads from `localStorage` which doesn't trigger reactivity.  
**Solution:** Force re-render by navigating away and back, or implement localStorage listener in provider.

### TypeScript error: "Property 'semantic' does not exist on type 'TenureTheme'"

**Cause:** Outdated import or type definition.  
**Solution:** Ensure you're importing from `TenureThemeProvider`, not `liquid-tenure.ts`.

---

## For AI Agents

When working on Tenure components:

1. **Always use `useTenureTheme()` hook** instead of prop drilling
2. **Semantic colors are sacred** - never use dynamic colors for success/warning/error
3. **Search and replace hardcoded colors**:
   - `#10B981` → `theme.semantic.success.base`
   - `#F59E0B` → `theme.semantic.warning.base`
   - `#EF4444` → `theme.semantic.error.base`
   - `#3B82F6` → `theme.semantic.info.base`
4. **Remove theme props** from component interfaces and child component calls
5. **Replace `theme().` with `theme.`** (theme is an object, not a function)
6. **Use `hexToRgba()` for opacity** instead of hardcoded `rgba()` strings

---

## Reference Links

- **Semantic Colors Definition:** `src/theme/semantic-colors.ts`
- **RIASEC Color Logic:** `src/components/tenure/pipeline/theme/riasec-colors.ts`
- **Theme Provider:** `src/components/tenure/TenureThemeProvider.tsx`
- **Liquid-Tenure Merged Theme:** `src/components/tenure/pipeline/theme/liquid-tenure.ts`

---

## Changelog

**v2.0 (2025-12-28)**

- Added `TenureThemeProvider` context system
- Introduced `semantic-colors.ts` for fixed color tokens
- Migrated all Trends components to context-based theming
- Removed theme prop drilling across Pipeline and Trends
- Added helper hooks and color utility functions

**v1.0 (2025-12-15)**

- Initial maximalist + liquid merged theme
- RIASEC-based duotone color system
- Prop-based theme distribution
