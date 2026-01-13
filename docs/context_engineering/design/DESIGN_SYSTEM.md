# Thoughtful App Co. - Design Specifications

## Overview

Two distinct design systems for two products under one brand umbrella.

---

## 1. NURTURE - Biophilic Design System

### Design Philosophy

_"Nature flows, technology grows"_

Mimics natural patterns to reduce stress and enhance user connection with relationship management.

### Typography

| Element    | Font    | Weight | Size |
| ---------- | ------- | ------ | ---- |
| Heading    | DM Sans | 600    | 36px |
| Subheading | DM Sans | 600    | 20px |
| Body       | DM Sans | 400    | 16px |
| Caption    | DM Sans | 400    | 13px |

**Rationale**: DM Sans offers subtle organic qualities with slightly rounded terminals that soften the digital feel.

### Color Palette

| Token      | Hex       | Usage                                  |
| ---------- | --------- | -------------------------------------- |
| Primary    | `#2D5A45` | Deep forest - primary actions, icons   |
| Secondary  | `#4A7C6F` | Moss - secondary elements              |
| Accent     | `#8FB8A8` | Sage mist - highlights, organic shapes |
| Background | `#F7FAF8` | Morning fog - page background          |
| Surface    | `#FFFFFF` | Card backgrounds                       |
| Text       | `#1A2F25` | Deep earth - primary text              |
| Text Muted | `#5A7268` | Weathered stone - secondary text       |
| Border     | `#D4E5DD` | Lichen - dividers, borders             |

### Spacing Scale

```
xs: 4px   | sm: 8px   | md: 16px
lg: 24px  | xl: 40px  | xxl: 64px
```

### Border Radius

| Token   | Value                               | Usage            |
| ------- | ----------------------------------- | ---------------- |
| sm      | 8px                                 | Small elements   |
| md      | 16px                                | Buttons, inputs  |
| lg      | 24px                                | Cards            |
| organic | `60% 40% 50% 50% / 40% 50% 50% 60%` | Decorative blobs |

### Shadows

- **sm**: `0 2px 8px rgba(45, 90, 69, 0.08)` - subtle lift
- **md**: `0 8px 24px rgba(45, 90, 69, 0.12)` - hover states
- **lg**: `0 16px 48px rgba(45, 90, 69, 0.16)` - FAB, modals

### Key Components

- **Contact Cards**: Organic blob backgrounds, growth stage icons (seedling → flourishing)
- **FAB**: 64px diameter, gradient fill, positioned for thumb reach
- **Stats Grid**: Gradient backgrounds derived from growth colors

### Accessibility Notes

- All text meets WCAG AA 4.5:1 contrast
- Organic animations respect `prefers-reduced-motion`
- Touch targets minimum 44px

---

## 2. JUSTINCASE - Daylight Reading System

### Design Philosophy

_"Natural reading, digital paper"_

Optimized for extended reading and case documentation review.

### Typography

| Element    | Font        | Weight | Size |
| ---------- | ----------- | ------ | ---- |
| Heading    | DM Sans     | 600    | 28px |
| Subheading | DM Sans     | 500    | 15px |
| Body       | Crimson Pro | 400    | 18px |
| Caption    | DM Sans     | 500    | 12px |

**Rationale**: Crimson Pro (serif) for optimal reading comfort; DM Sans for UI chrome to create clear hierarchy.

### Color Palette

| Token      | Hex       | Usage                       |
| ---------- | --------- | --------------------------- |
| Primary    | `#1C1C1C` | Ink black - primary actions |
| Secondary  | `#4A4A4A` | Soft charcoal - icons       |
| Accent     | `#D4A574` | Warm sepia - highlights     |
| Background | `#FAFAF7` | Natural paper - page bg     |
| Surface    | `#FFFFFF` | Bright paper - cards        |
| Text       | `#2C2C2C` | Reading ink - body text     |
| Text Muted | `#6B6B6B` | Faded text - captions       |
| Border     | `#E8E8E4` | Paper edge - dividers       |

### Watercolor Highlights

| Color  | Value                       | Usage                |
| ------ | --------------------------- | -------------------- |
| Yellow | `rgba(255, 235, 120, 0.4)`  | Key dates, important |
| Blue   | `rgba(150, 200, 240, 0.35)` | Names, entities      |
| Pink   | `rgba(255, 180, 180, 0.35)` | Warnings             |
| Green  | `rgba(180, 230, 180, 0.35)` | Positive outcomes    |

### Border Radius

| Token | Value | Usage           |
| ----- | ----- | --------------- |
| sm    | 2px   | Subtle rounding |
| md    | 4px   | Buttons, badges |
| lg    | 8px   | Cards           |

### Shadows

Intentionally subtle to maintain paper-like flatness:

- **sm**: `0 1px 3px rgba(0, 0, 0, 0.04)`
- **md**: `0 4px 12px rgba(0, 0, 0, 0.06)`
- **lg**: `0 8px 24px rgba(0, 0, 0, 0.08)`

### Key Components

- **Case Card**: Paper-white surface, minimal shadow
- **Evidence List**: Clear iconography, highlighted items with watercolor bg
- **Navigation Tabs**: Underline style, large touch targets (48px height)

### Accessibility Notes

- Body text achieves 7:1 contrast ratio (WCAG AAA)
- Serif typeface at 18px for comfortable reading
- Paper texture at 1.5% opacity to avoid distraction

---

## Shared Patterns

### Tooltip Rendering (MANDATORY)

**ALL tooltips MUST use SolidJS Portal.** This is a project-wide requirement.

```typescript
import { Portal } from 'solid-js/web';

<Portal>
  <Show when={showTooltip()}>
    <div style={{ position: 'fixed', left: `${x}px`, top: `${y}px`, 'z-index': 10000 }}>
      {/* Tooltip content */}
    </div>
  </Show>
</Portal>
```

**Why:** Parent containers with `transform`, `filter`, or `overflow: hidden` break `position: fixed`. Portal renders at document root, escaping these issues.

**Full documentation:** See [TOOLTIP_POSITIONING.md](./TOOLTIP_POSITIONING.md)

### Fitt's Law Optimizations

1. **Touch targets**: Minimum 44px, primary actions 64px
2. **FAB positioning**: Bottom-right corner (thumb zone on mobile)
3. **Full-width buttons**: On mobile breakpoints
4. **Tab navigation**: Large hit areas with generous padding

### Responsive Breakpoints

```css
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
```

### Animation Timing

```css
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```

### Icon System

**Company-Level Icon Standard: Doodle Icons**

For **all Thoughtful App Co. company-level features** (admin, user management, billing, auth, marketing pages, investors page, footer, etc.), use the **Doodle Icons** system.

**Implementation:** `src/components/common/DoodleIcons.tsx`

**Design Philosophy:**

- Hand-drawn, sketchy aesthetic that reflects TACo's human-first, artistic approach
- Consistent stroke width (1.5px) with organic, imperfect lines
- Subtle accent strokes for authenticity
- Inspired by [Khushmeen's Doodle Icons](https://khushmeen.com/icons.html)

**Available Icons:**

| Icon              | Use Case                                  | Typical Color      |
| ----------------- | ----------------------------------------- | ------------------ |
| `DoodleHeart`     | Human Good, Community, Love               | `#FF6B6B` (Coral)  |
| `DoodleShield`    | Local-First, Privacy, Security            | `#4ECDC4` (Teal)   |
| `DoodleSparkle`   | Anti-Dark Patterns, Good Design, Magic    | `#FFE66D` (Yellow) |
| `DoodlePeople`    | Open Contribution, Community, Team        | `#9333EA` (Purple) |
| `DoodleLightbulb` | Ideas, Innovation, Learning               | `#4ECDC4` (Teal)   |
| `DoodleRocket`    | Launch, Progress, Growth                  | `#FFE66D` (Yellow) |
| `DoodlePhone`     | Phone as Server, Mobile-First             | `#4ECDC4` (Teal)   |
| `DoodlePalette`   | Design, Artistic, Creativity              | `#FF6B6B` (Coral)  |
| `DoodleCompass`   | Blue Ocean, Direction, Strategy           | `#4ECDC4` (Teal)   |
| `DoodleHandshake` | Partnership, Sponsors, Collaboration      | `#FF6B6B` (Coral)  |
| `DoodleCode`      | Open Source, Development                  | `#9333EA` (Purple) |
| `DoodleLeaf`      | Growth, Natural Lifecycle, Sustainability | `#10B981` (Green)  |

**Usage:**

```tsx
import { DoodleHeart, DoodleShield } from '@/components/common/DoodleIcons';

// Standard usage
<DoodleHeart size={24} color="#FF6B6B" />

// With custom props
<DoodleShield
  size={32}
  color="#4ECDC4"
  style={{ opacity: 0.8 }}
  class="custom-class"
/>
```

**Props Interface:**

- `size?: number` - Icon dimensions (default: 24)
- `color?: string` - Stroke color (default: currentColor)
- `style?: JSX.CSSProperties` - Custom inline styles
- `class?: string` - CSS class name

**Where to Use:**

- ✅ Homepage footer (Philosophy section)
- ✅ Investors page (Key Initiatives)
- ✅ Pricing page (company features)
- ✅ Auth flows (login, signup, verification)
  - `LoginModal`: DoodleShield for security, DoodleSparkle for "magic link" success
  - `Paywall`: DoodleRocket for upgrades, DoodleShield for backup/sync
- ✅ User account/billing pages
- ✅ Admin panels
- ✅ Marketing/landing pages
- ✅ Documentation headers

**Where NOT to Use:**

- ❌ Individual app interfaces (Tempo, Tenure, Nurture, etc. have their own icon systems)
- ❌ App-specific features (use app's design system icons)

**Color Palette:**

Match TACo brand colors:

- **Coral** `#FF6B6B` - Warm, human, community
- **Teal** `#4ECDC4` - Trust, security, technology
- **Yellow** `#FFE66D` - Innovation, energy, creativity
- **Purple** `#9333EA` - Premium, collaboration, open source
- **Green** `#10B981` - Growth, sustainability, success

**Accessibility:**

- Minimum size: 18px for UI elements, 24px for prominent features
- Always provide meaningful context (aria-label or visible text)
- Ensure sufficient color contrast (4.5:1 minimum)

---

## 3. TEMPO - Premium Dark Time-Management System

### Design Philosophy

_"Rhythm for work. Clarity through focus."_

A premium dark mode design system optimized for extended work sessions and task management. Combines modern glass-morphic aesthetics with high-contrast accessibility.

### Typography

| Element       | Font       | Weight | Size |
| ------------- | ---------- | ------ | ---- |
| Heading 2XL   | Geist      | 600    | 24px |
| Heading Large | Geist      | 500    | 16px |
| Body          | Geist      | 400    | 14px |
| Caption       | Geist      | 400    | 12px |
| Monospace     | Geist Mono | 400    | 14px |

**Rationale**: Geist (variable font) for modern, precise readability. Geist Mono for task input and code-like content.

### Color Palette

| Token            | Hex                       | Usage               | Contrast    |
| ---------------- | ------------------------- | ------------------- | ----------- |
| Background       | `#0A0A0F`                 | Page background     | -           |
| Foreground       | `#FAFAFA`                 | Primary text        | 20:1 ✓ AAA  |
| Card             | `#1A1A24`                 | Card backgrounds    | -           |
| Card Border      | `#2A2A3A`                 | Card dividers       | -           |
| Primary          | `#5E6AD2`                 | Actions, accents    | 4.5:1 ✓ AA  |
| Primary Hover    | `#4E5AC2`                 | Button hover state  | -           |
| Secondary        | `#2A2A3A`                 | Secondary actions   | -           |
| Secondary Hover  | `#3A3A4A`                 | Secondary hover     | -           |
| Muted Foreground | `#707080`                 | Secondary text      | 4.8:1 ✓ AA  |
| Destructive      | `#DC2626`                 | Errors, warnings    | 6:1 ✓ AAA   |
| Frog (Priority)  | `#10B981`                 | High-priority tasks | 6.5:1 ✓ AAA |
| Frog Background  | `rgba(16, 185, 129, 0.1)` | Frog badge bg       | -           |

### Spacing Scale

```
xs: 4px    | sm: 8px    | md: 12px
lg: 16px   | xl: 20px   | 2xl: 24px | 3xl: 32px
```

### Border Radius

| Token | Value  | Usage                   |
| ----- | ------ | ----------------------- |
| sm    | 6px    | Small elements, buttons |
| md    | 8px    | Input fields            |
| lg    | 12px   | Cards, panels           |
| full  | 9999px | Badges, pills           |

### Shadows

- **sm**: `0 1px 2px rgba(0, 0, 0, 0.2)` - subtle depth
- **md**: `0 4px 6px rgba(0, 0, 0, 0.3)` - hover lift
- **lg**: `0 10px 15px rgba(0, 0, 0, 0.4)` - modals, emphasis

### Transitions

- **fast**: `0.15s cubic-bezier(0.4, 0, 0.2, 1)` - quick interactions
- **normal**: `0.2s cubic-bezier(0.4, 0, 0.2, 1)` - standard movement
- **slow**: `0.3s cubic-bezier(0.4, 0, 0.2, 1)` - deliberate reveal

### Key Components

#### Buttons

Five semantic variants:

- **Default (Primary)**: Full-color action buttons with hover darkening
- **Secondary**: Muted background for secondary actions
- **Outline**: Bordered variant for tertiary actions
- **Ghost**: Text-only with transparent background
- **Icon**: Icon-only buttons for compact UI

Size variants: `default` (36px), `sm` (32px), `lg` (40px), `icon` (36px)

#### Cards

Glass-morphic containers with:

- Semi-transparent background (`#1A1A24`)
- Subtle 1px border in `#2A2A3A`
- Soft shadow for depth
- Padding: 24px (header/footer), responsive content

Subcomponents:

- `CardHeader`: Flex column with 6px gap
- `CardTitle`: 24px semibold with letter-spacing
- `CardDescription`: Muted, secondary text
- `CardContent`: Flush with header/footer
- `CardFooter`: Flex row with padding

#### Badges

Status indicators with 4 variants:

- **Default**: Primary color background
- **Secondary**: Muted background
- **Destructive**: Red background for errors
- **Outline**: Bordered variant

Responsive padding: 6px 12px with rounded pill shape.

#### Input/Textarea

- Inline style borders in secondary color
- Focus ring in primary color
- Monospace font for textarea (task input)
- Disabled state: reduced opacity with `pointer-events: none`

#### Progress Bars

Visual task completion indicator

- Full-width container with rounded track
- Foreground bar updates dynamically
- Color indicates status (primary/frog)

### Responsive Design

| Breakpoint | Width          | Behavior                                   |
| ---------- | -------------- | ------------------------------------------ |
| Desktop    | > 1024px       | 2-column grid (1.5fr content, 1fr sidebar) |
| Tablet     | 768px - 1024px | Single column, stack sidebar below         |
| Mobile     | < 768px        | Full-width, reduced padding                |
| Compact    | < 640px        | Minimal padding (12px), compact spacing    |

### Accessibility

- **WCAG AA Compliant**: All interactive elements meet 4.5:1 minimum contrast
- **WCAG AAA Compliant**: Primary destructive and frog colors achieve 6:1+
- **Motion Respect**: All animations respect `prefers-reduced-motion` media query
- **Keyboard Navigation**: Full keyboard support with visible focus states
- **Touch Targets**: Minimum 36px for buttons, 44px preferred

### Implementation Details

**Design System Location**: `src/components/tempo/theme/tempo-design.ts`

- Centralized token definitions (colors, typography, spacing, radius, shadows)
- Component preset styles (buttons, cards, badges, inputs)
- No external CSS framework—pure inline styles via Solid.js

**UI Components**: `src/components/tempo/ui/`

- Modular, reusable components with mergeProps/splitProps
- Full TypeScript support with JSX.ButtonHTMLAttributes extension
- Variant system for semantic meaning and visual feedback

**Global Styles**: `src/index.tsx`

- Font-face declarations for Geist and Geist Mono
- Global resets and normalization
- Animation definitions (@keyframes)
- Responsive media query handling

### Design Tokens Export

All tokens are exported via TypeScript for type-safe usage:

```typescript
import { tempoDesign, tempoComponents } from './theme/tempo-design'

// Access colors
const bgColor = tempoDesign.colors.background
const cardStyle = tempoComponents.card

// Apply in components
style={{ background: tempoDesign.colors.primary }}
```

---

## Theme TypeScript Interface

```typescript
interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
  };
  fonts: {
    body: string;
    heading: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
    organic: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}
```
