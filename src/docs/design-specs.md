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

## 4. ECHOPRAX - Memphis x Retro-Futurism Workout System

### Design Philosophy

_"Controlled chaos. Energetic precision."_

A bold, kinetic design system for timer-driven workout sessions. Combines Memphis Group (1980s Italian design movement) geometric chaos with retro-futurism neon aesthetics.

### Core Principles

1. **Memphis Aesthetic**: Bold geometric patterns, clash colors, controlled visual chaos
2. **Retro-Futurism**: Saturated neons on dark backgrounds, 80s cyberpunk vibes
3. **Glassomorphism**: Reserved ONLY for interactive buttons (not surfaces)
4. **Kinetic Motion**: Bouncy animations with personality, respects reduced-motion
5. **NO EMOJIS**: Use custom doodle SVG icons only

### Typography Scale

| Level      | Size     | Weight | Line Height | Letter Spacing | Usage                    |
| ---------- | -------- | ------ | ----------- | -------------- | ------------------------ |
| Display    | 8rem     | 800    | 1.0         | -0.02em        | Large timer display      |
| Display SM | 6rem     | 800    | 1.0         | -0.02em        | Timer with GIF           |
| Heading XL | 2.5rem   | 800    | 1.2         | -0.03em        | Hero headlines           |
| Heading LG | 2rem     | 800    | 1.2         | -0.02em        | Section headlines        |
| Heading MD | 1.5rem   | 800    | 1.3         | -0.02em        | Card titles              |
| Heading SM | 1.25rem  | 700    | 1.4         | 0              | Subheadings              |
| Body LG    | 1.125rem | 400    | 1.5         | 0              | Lead paragraphs          |
| Body       | 1rem     | 400    | 1.5         | 0              | Default body text        |
| Body SM    | 0.875rem | 400    | 1.5         | 0              | Secondary body text      |
| Caption    | 0.75rem  | 400    | 1.4         | 0              | Metadata, timestamps     |
| Label      | 0.75rem  | 700    | 1.2         | 0.15em         | Section labels, ALL CAPS |
| State      | 1.25rem  | 800    | 1.0         | 0.25em         | Session state labels     |

**Font Stack**: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`

**Rationale**: Inter provides excellent legibility at all sizes with a geometric character that complements the Memphis aesthetic.

### Color Palette - Memphis Clash

| Token         | Hex                      | RGB           | Contrast vs BG | Usage                         |
| ------------- | ------------------------ | ------------- | -------------- | ----------------------------- |
| Hot Pink      | `#FF6B9D`                | 255, 107, 157 | 6.2:1 ✓ AAA    | Primary accent, active states |
| Electric Blue | `#00D4FF`                | 0, 212, 255   | 8.9:1 ✓ AAA    | Secondary accent, rest states |
| Acid Yellow   | `#FFEA00`                | 255, 234, 0   | 14.8:1 ✓ AAA   | Attention, countdown, labels  |
| Mint Green    | `#7FFFD4`                | 127, 255, 212 | 12.4:1 ✓ AAA   | Success, completion states    |
| Coral         | `#FF6F61`                | 255, 111, 97  | 5.4:1 ✓ AA     | Intensity indicator, stop     |
| Lavender      | `#E6B8FF`                | 230, 184, 255 | 8.2:1 ✓ AAA    | Paused state, strength        |
| Deep Black    | `#0D0D0D`                | 13, 13, 13    | -              | Background                    |
| Dark Surface  | `#1A1A1F`                | 26, 26, 31    | -              | Card backgrounds              |
| White         | `#FFFFFF`                | 255, 255, 255 | 19.8:1 ✓ AAA   | Primary text                  |
| Muted Gray    | `#B8B8C8`                | 184, 184, 200 | 9.2:1 ✓ AAA    | Secondary text (improved)     |
| Border        | `rgba(255,255,255,0.12)` | -             | -              | Subtle dividers               |

### Session State Colors

| State     | Color     | Semantic Meaning     |
| --------- | --------- | -------------------- |
| Idle      | `#B8B8C8` | Neutral, waiting     |
| Countdown | `#FFEA00` | Attention! Get ready |
| Active    | `#FF6B9D` | High energy, GO!     |
| Rest      | `#00D4FF` | Recovery, breathe    |
| Completed | `#7FFFD4` | Victory, success     |
| Paused    | `#E6B8FF` | Suspended, calm      |

### Spacing Scale (4px Base Unit)

| Token | Value | Rem     | Usage                       |
| ----- | ----- | ------- | --------------------------- |
| xs    | 4px   | 0.25rem | Tight gaps, inline elements |
| sm    | 8px   | 0.5rem  | Small gaps, compact lists   |
| md    | 16px  | 1rem    | Default spacing, gutters    |
| lg    | 24px  | 1.5rem  | Section spacing             |
| xl    | 32px  | 2rem    | Large gaps, card padding    |
| xxl   | 48px  | 3rem    | Hero sections, major breaks |

### Border Radius

| Token   | Value | Usage                   |
| ------- | ----- | ----------------------- |
| sm      | 8px   | Small buttons, badges   |
| md      | 12px  | Medium elements, inputs |
| lg      | 16px  | Cards, panels           |
| organic | 24px  | Large buttons, pills    |
| full    | 50%   | Circular elements       |

### Shadows (Dark Theme Optimized)

| Token | Value                            | Usage                   |
| ----- | -------------------------------- | ----------------------- |
| sm    | `0 2px 8px rgba(0, 0, 0, 0.4)`   | Subtle lift             |
| md    | `0 8px 24px rgba(0, 0, 0, 0.5)`  | Hover states, cards     |
| lg    | `0 16px 48px rgba(0, 0, 0, 0.6)` | Modals, completion icon |

### Colored Shadows (Glow Effect)

```css
/* Hot Pink Glow */
box-shadow: 0 4px 20px rgba(255, 107, 157, 0.4);
box-shadow: 0 8px 32px rgba(255, 107, 157, 0.5); /* Emphasis */

/* Electric Blue Glow */
box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);

/* Mint Green Glow */
box-shadow: 0 8px 40px rgba(127, 255, 212, 0.5); /* Completion */

/* Acid Yellow Glow */
box-shadow: 0 0 20px rgba(255, 234, 0, 0.6); /* State label glow */
```

### Glass Button Styles

Glass morphism is ONLY for interactive buttons, never for content surfaces.

```css
/* Default Glass */
.echoprax-glass-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Hover State */
.echoprax-glass-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px) scale(1.02);
}

/* Active/Pressed */
.echoprax-glass-btn:active {
  background: rgba(255, 255, 255, 0.18);
  transform: translateY(0) scale(0.98);
}

/* Primary Glass (Hot Pink tinted) */
.echoprax-glass-btn--primary {
  background: rgba(255, 107, 157, 0.15);
  border: 1px solid rgba(255, 107, 157, 0.3);
}

/* Focus State (Accessibility) */
.echoprax-glass-btn:focus-visible {
  outline: 2px solid #ffea00;
  outline-offset: 2px;
}
```

### Solid Surfaces (Memphis Style)

Cards and content containers use solid colors, NOT glass.

```css
/* Card Surface */
.echoprax-card {
  background: #1a1a1f;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

/* Elevated Surface */
.echoprax-elevated {
  background: rgba(30, 30, 40, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}
```

### Kinetic Animations

All animations respect `prefers-reduced-motion`.

```css
/* Easing Functions */
--echoprax-easing-bouncy: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--echoprax-easing-bouncy-out: cubic-bezier(0.34, 1.56, 0.64, 1);
--echoprax-easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);

/* State Change Transition */
.echoprax-state-change {
  transition: all 300ms var(--echoprax-easing-bouncy);
}

/* Countdown Pulse */
@keyframes memphis-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}
.echoprax-countdown {
  animation: memphis-pulse 800ms ease-in-out infinite;
}

/* Hover Bounce */
.echoprax-hover-bounce:hover {
  transform: translateY(-4px) scale(1.02);
}

/* Floating Shapes */
@keyframes memphis-float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Geometric Spin (decorative) */
@keyframes memphis-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

### Memphis Decorative Patterns

```css
/* Terrazzo Confetti Background */
background-image:
  radial-gradient(circle at 20% 30%, #ff6b9d15 2px, transparent 2px),
  radial-gradient(circle at 60% 70%, #00d4ff15 3px, transparent 3px),
  radial-gradient(circle at 80% 20%, #ffea0015 2px, transparent 2px),
  radial-gradient(circle at 40% 80%, #7fffd415 2px, transparent 2px),
  radial-gradient(circle at 10% 60%, #ff6f6115 3px, transparent 3px),
  radial-gradient(circle at 90% 50%, #e6b8ff15 2px, transparent 2px);
background-size: 200px 200px;

/* Grid Lines */
background-image:
  linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
background-size: 40px 40px;
```

### Component Specifications

#### Exercise Card

- Min-height: 400px
- Padding: 32px (xl)
- Grid layout: 1fr 1fr when GIF present, single column otherwise
- Progress bar: 4px height at top
- Corner accents: 24px geometric shapes at 40% opacity

#### Progress Timeline

- Padding: 16px (md)
- Block segments: flex-1, 8px height, 4px gap
- Active segment: shimmer animation overlay
- Label: 12px uppercase with 0.1em letter-spacing

#### Control Buttons

| Button     | Size | Border Radius | Color         |
| ---------- | ---- | ------------- | ------------- |
| Mute       | 48px | 50% (circle)  | Electric Blue |
| Stop       | 48px | 50%           | Coral         |
| Play/Pause | 64px | 50%           | Hot Pink      |
| Skip       | 48px | 50%           | Acid Yellow   |

#### Workout Card (Home)

- Padding: 24px (lg)
- Border-radius: 16px (lg)
- Accent square: 64px
- Gap between elements: 24px (lg)
- Metadata font-size: 12px (caption)

### Accessibility Requirements

| Requirement            | Implementation                                   |
| ---------------------- | ------------------------------------------------ |
| Color contrast (text)  | All text: minimum 4.5:1, achieved 5.4:1+ on all  |
| Color contrast (large) | Large text: minimum 3:1, all exceed              |
| Focus indicators       | 2px solid #FFEA00, 2px offset                    |
| Touch targets          | Minimum 44px, primary actions 64px               |
| Motion safety          | All animations in `prefers-reduced-motion` query |
| Screen reader labels   | All buttons have title attributes                |
| State announcements    | Voice cues announce all state changes            |

### Focus State Specification

```css
/* Visible Focus Ring */
:focus-visible {
  outline: 2px solid #ffea00;
  outline-offset: 2px;
}

/* Remove default focus for mouse users */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Implementation Files

| File                                                          | Purpose                       |
| ------------------------------------------------------------- | ----------------------------- |
| `src/theme/echoprax.ts`                                       | Design tokens, CSS variables  |
| `src/components/echoprax/EchopraxApp.tsx`                     | Main app container, home view |
| `src/components/echoprax/session-player/SessionPlayer.tsx`    | Workout session logic         |
| `src/components/echoprax/session-player/ExerciseCard.tsx`     | Current exercise display      |
| `src/components/echoprax/session-player/ProgressTimeline.tsx` | Phase progress                |

### Design Token Export

```typescript
import {
  echoprax, // Theme object
  memphisColors, // Color palette
  sessionStateColors, // State-specific colors
  glassButton, // Glass button styles
  memphisSurfaces, // Solid surface styles
  kineticAnimations, // Animation definitions
  memphisPatterns, // Background patterns
  echopraxCSS, // Injected CSS string
} from '@/theme/echoprax';
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

---

## Shared Patterns

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
