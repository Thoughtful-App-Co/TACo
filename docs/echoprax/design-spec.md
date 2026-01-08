# Echoprax Design Specification

> **Theme Source:** `src/theme/echoprax.ts`

This document defines the complete visual design system for Echoprax, a workout timer application built with a Memphis x Retro-Futurism aesthetic.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Typography System](#typography-system)
3. [Color System](#color-system)
4. [Spacing System](#spacing-system)
5. [Border Radii](#border-radii)
6. [Touch Targets](#touch-targets)
7. [Shadows](#shadows)
8. [Glass Morphism](#glass-morphism)
9. [Animation & Motion](#animation--motion)
10. [Breakpoints](#breakpoints)
11. [Component Patterns](#component-patterns)
12. [Decorative Elements](#decorative-elements)
13. [Accessibility Requirements](#accessibility-requirements)

---

## Design Philosophy

Echoprax combines three distinct design movements into a cohesive mobile-first experience:

### Memphis Design (1980s Italian Postmodernism)

- **Bold geometric patterns** - circles, triangles, squiggles, arcs
- **Clash colors** - intentionally contrasting, high-saturation palette
- **Controlled chaos** - decorative elements that feel playful but purposeful
- **Solid surfaces** - cards and containers use opaque backgrounds, not transparency

### Retro-Futurism (80s Cyberpunk)

- **Saturated neons on dark** - bright accent colors against deep black
- **CRT vibes** - warm glow effects, subtle scan-line aesthetics
- **Tech-optimism** - clean, confident interface elements

### Native-Feel Mobile First

- **Touch-optimized** - generous tap targets, swipe-friendly layouts
- **Thumb-zone aware** - critical actions positioned for one-handed use
- **Performance-first** - minimal animations that don't block interaction
- **PWA-ready** - works offline, installable, feels like a native app

### Core Principles

1. **Clarity over decoration** - Memphis shapes enhance, never obstruct
2. **State is color** - workout phases are immediately identifiable by color
3. **Motion with purpose** - animations communicate state, not just delight
4. **Accessibility is non-negotiable** - all interactions work for all users

---

## Typography System

### Font Families

| Role              | Font                  | Usage                                        |
| ----------------- | --------------------- | -------------------------------------------- |
| **Display/Brand** | Montserrat Alternates | Timer displays, brand wordmark, state labels |
| **Headings**      | Meera Inimai          | Section titles, card headers, UI labels      |
| **Body**          | Didact Gothic         | Paragraphs, descriptions, form inputs        |

```css
/* Font imports (add to index.html or CSS) */
@import url('https://fonts.googleapis.com/css2?family=Montserrat+Alternates:wght@700&family=Didact+Gothic&display=swap');

/* Meera Inimai loaded separately - Tamil script font with geometric Latin */
```

### Type Scale

Based on 16px (1rem) base with 1.25 (Major Third) modular scale.

#### Display Sizes (Montserrat Alternates Bold)

| Token       | Size           | Weight | Line Height | Letter Spacing | Usage                     |
| ----------- | -------------- | ------ | ----------- | -------------- | ------------------------- |
| `display`   | 8rem (128px)   | 700    | 1           | -0.02em        | Main timer (full screen)  |
| `displaySm` | 6rem (96px)    | 700    | 1           | -0.02em        | Timer with GIF present    |
| `brand`     | 1.5rem (24px)  | 700    | 1.2         | -0.02em        | App name in header        |
| `state`     | 1.25rem (20px) | 700    | 1           | 0.25em         | State labels (WORK, REST) |

```typescript
// Responsive display sizing with clamp()
const responsiveTimer = {
  fontSize: 'clamp(4rem, 15vw, 8rem)',
  // Scales from 64px on small screens to 128px on large
};

const responsiveTimerWithGif = {
  fontSize: 'clamp(3rem, 12vw, 6rem)',
  // Scales from 48px to 96px when GIF is present
};
```

#### Heading Sizes (Meera Inimai)

| Token       | Size           | Weight | Line Height | Letter Spacing |
| ----------- | -------------- | ------ | ----------- | -------------- |
| `headingXl` | 2.5rem (40px)  | 400    | 1.2         | -0.03em        |
| `headingLg` | 2rem (32px)    | 400    | 1.2         | -0.02em        |
| `headingMd` | 1.5rem (24px)  | 400    | 1.3         | -0.02em        |
| `headingSm` | 1.25rem (20px) | 400    | 1.4         | 0              |

> **Note:** Meera Inimai is a single-weight font. Do not apply `font-weight: bold`.

#### Body Sizes (Didact Gothic)

| Token     | Size            | Weight | Line Height | Letter Spacing |
| --------- | --------------- | ------ | ----------- | -------------- |
| `bodyLg`  | 1.125rem (18px) | 400    | 1.5         | 0              |
| `body`    | 1rem (16px)     | 400    | 1.5         | 0              |
| `bodySm`  | 0.875rem (14px) | 400    | 1.5         | 0              |
| `caption` | 0.75rem (12px)  | 400    | 1.4         | 0              |

#### Label Style (Meera Inimai Uppercase)

```typescript
label: {
  fontFamily: "'Meera Inimai', sans-serif",
  fontSize: '0.75rem',
  fontWeight: '400',
  lineHeight: '1.2',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
}
```

---

## Color System

### Memphis Clash Palette

All colors tested for WCAG compliance against `#0D0D0D` background.

| Name              | Hex       | Contrast Ratio | Usage                             |
| ----------------- | --------- | -------------- | --------------------------------- |
| **Hot Pink**      | `#FF6B9D` | 6.2:1 (AA)     | Primary accent, active state      |
| **Electric Blue** | `#00D4FF` | 8.9:1 (AAA)    | Secondary accent, rest state      |
| **Acid Yellow**   | `#FFEA00` | 14.8:1 (AAA)   | Attention, countdown, focus rings |
| **Mint Green**    | `#7FFFD4` | 12.4:1 (AAA)   | Success, completion               |
| **Coral**         | `#FF6F61` | 5.4:1 (AA)     | Warning, cardio workouts          |
| **Lavender**      | `#E6B8FF` | 8.2:1 (AAA)    | Paused state, strength workouts   |

### Background & Surfaces

| Name                      | Value                    | Usage             |
| ------------------------- | ------------------------ | ----------------- |
| **Deep Black**            | `#0D0D0D`                | App background    |
| **Dark Surface**          | `#1A1A1F`                | Card backgrounds  |
| **Surface (translucent)** | `rgba(26, 26, 31, 0.95)` | Elevated surfaces |

### Text Colors

| Name             | Value     | Contrast     | Usage                           |
| ---------------- | --------- | ------------ | ------------------------------- |
| **Primary Text** | `#FFFFFF` | 19.8:1 (AAA) | Headings, primary content       |
| **Muted Text**   | `#B8B8C8` | 9.2:1 (AAA)  | Secondary content, descriptions |

### Borders

```typescript
border: 'rgba(255, 255, 255, 0.12)'; // Subtle dividers
borderHover: 'rgba(255, 255, 255, 0.2)'; // Interactive hover
borderActive: 'rgba(255, 255, 255, 0.25)'; // Active/pressed
```

### Session State Color Mapping

| State       | Color         | Hex       | Semantic Meaning     |
| ----------- | ------------- | --------- | -------------------- |
| `idle`      | Gray          | `#B8B8C8` | Waiting, not started |
| `countdown` | Acid Yellow   | `#FFEA00` | Get ready!           |
| `active`    | Hot Pink      | `#FF6B9D` | GO! Working out      |
| `rest`      | Electric Blue | `#00D4FF` | Recovery period      |
| `completed` | Mint Green    | `#7FFFD4` | Victory!             |
| `paused`    | Lavender      | `#E6B8FF` | Temporarily stopped  |

```typescript
// Usage example
const timerColor = sessionStateColors[currentState];
// currentState: 'idle' | 'countdown' | 'active' | 'rest' | 'completed' | 'paused'
```

### CSS Custom Properties

```css
:root {
  /* Core colors */
  --echoprax-primary: #ff6b9d;
  --echoprax-secondary: #00d4ff;
  --echoprax-accent: #ffea00;
  --echoprax-bg: #0d0d0d;
  --echoprax-surface: rgba(26, 26, 31, 0.95);
  --echoprax-text: #ffffff;
  --echoprax-text-muted: #b8b8c8;

  /* Memphis palette */
  --memphis-hot-pink: #ff6b9d;
  --memphis-electric-blue: #00d4ff;
  --memphis-acid-yellow: #ffea00;
  --memphis-mint-green: #7fffd4;
  --memphis-coral: #ff6f61;
  --memphis-lavender: #e6b8ff;

  /* Session states */
  --echoprax-state-idle: #b8b8c8;
  --echoprax-state-countdown: #ffea00;
  --echoprax-state-active: #ff6b9d;
  --echoprax-state-rest: #00d4ff;
  --echoprax-state-completed: #7fffd4;
  --echoprax-state-paused: #e6b8ff;
}
```

---

## Spacing System

Based on a 4px unit for consistent rhythm.

| Token | Value | Pixels | Usage                         |
| ----- | ----- | ------ | ----------------------------- |
| `xs`  | 4px   | 4      | Tight gaps, icon margins      |
| `sm`  | 8px   | 8      | Small gaps, inline spacing    |
| `md`  | 16px  | 16     | Default gutters, card padding |
| `lg`  | 24px  | 24     | Section spacing, larger gaps  |
| `xl`  | 32px  | 32     | Card padding, major sections  |
| `xxl` | 48px  | 48     | Hero sections, page margins   |

```typescript
// Usage in components
import { echoprax } from '@/theme/echoprax';

const cardStyles = {
  padding: echoprax.spacing.xl, // 32px
  marginBottom: echoprax.spacing.lg, // 24px
  gap: echoprax.spacing.md, // 16px
};
```

### CSS Custom Properties

```css
:root {
  --echoprax-space-xs: 4px;
  --echoprax-space-sm: 8px;
  --echoprax-space-md: 16px;
  --echoprax-space-lg: 24px;
  --echoprax-space-xl: 32px;
  --echoprax-space-xxl: 48px;
}
```

---

## Border Radii

Organic, friendly corners that reinforce the Memphis aesthetic.

| Token     | Value | Usage                        |
| --------- | ----- | ---------------------------- |
| `sm`      | 8px   | Small buttons, chips, tags   |
| `md`      | 12px  | Input fields, small cards    |
| `lg`      | 16px  | Standard cards, modals       |
| `organic` | 24px  | Hero elements, large buttons |

```typescript
radii: {
  sm: '8px',
  md: '12px',
  lg: '16px',
  organic: '24px',
}
```

---

## Touch Targets

All interactive elements must meet minimum touch target sizes for mobile usability.

| Category      | Size | Usage                          |
| ------------- | ---- | ------------------------------ |
| **Minimum**   | 44px | Small icons, secondary actions |
| **Secondary** | 48px | Navigation items, list actions |
| **Primary**   | 56px | Main buttons, form submissions |
| **Hero**      | 64px | Play/pause, critical CTAs      |

```typescript
// Touch target constants
const touchTargets = {
  minimum: '44px',
  secondary: '48px',
  primary: '56px',
  hero: '64px',
};

// Usage example - ensure clickable area is large enough
const IconButton = () => (
  <button
    style={{
      minWidth: touchTargets.minimum,
      minHeight: touchTargets.minimum,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Icon size={24} />
  </button>
);
```

---

## Shadows

Layered shadows for depth hierarchy on dark backgrounds.

| Token | Value                            | Usage                   |
| ----- | -------------------------------- | ----------------------- |
| `sm`  | `0 2px 8px rgba(0, 0, 0, 0.4)`   | Subtle elevation, chips |
| `md`  | `0 8px 24px rgba(0, 0, 0, 0.5)`  | Cards, dropdowns        |
| `lg`  | `0 16px 48px rgba(0, 0, 0, 0.6)` | Modals, overlays        |

```typescript
shadows: {
  sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
  md: '0 8px 24px rgba(0, 0, 0, 0.5)',
  lg: '0 16px 48px rgba(0, 0, 0, 0.6)',
}
```

---

## Glass Morphism

**Important:** Glass morphism is reserved for **interactive buttons only**. Cards and surfaces use solid Memphis backgrounds.

### Glass Button States

```typescript
const glassButton = {
  default: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  hover: {
    background: 'rgba(255, 255, 255, 0.14)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  active: {
    background: 'rgba(255, 255, 255, 0.18)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
  },
};
```

### Colored Glass Variant (Primary Actions)

```typescript
const primaryGlass = {
  background: 'rgba(255, 107, 157, 0.15)', // Hot pink tint
  border: '1px solid rgba(255, 107, 157, 0.3)',
  backdropFilter: 'blur(12px)',
};
```

### CSS Class

```css
.echoprax-glass-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 250ms var(--echoprax-easing-bouncy);
}

.echoprax-glass-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px) scale(1.02);
}

.echoprax-glass-btn:active {
  background: rgba(255, 255, 255, 0.18);
  transform: translateY(0) scale(0.98);
}
```

---

## Animation & Motion

### Easing Functions

| Name        | Value                                    | Usage                |
| ----------- | ---------------------------------------- | -------------------- |
| `bouncy`    | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | State changes, hover |
| `bouncyOut` | `cubic-bezier(0.34, 1.56, 0.64, 1)`      | Button press release |
| `smooth`    | `cubic-bezier(0.4, 0, 0.2, 1)`           | Subtle transitions   |

### Animation Definitions

```css
/* State change transition */
.echoprax-state-change {
  transition: all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Countdown pulse */
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

/* Decorative shape spin */
@keyframes memphis-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.echoprax-spin {
  animation: memphis-spin 20s linear infinite;
}

/* Floating shapes */
@keyframes memphis-float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.echoprax-float {
  animation: memphis-float 3s ease-in-out infinite;
}

/* Hover bounce */
.echoprax-hover-bounce {
  transition: transform 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.echoprax-hover-bounce:hover {
  transform: translateY(-4px) scale(1.02);
}
```

### Respecting Reduced Motion

**All animations must be wrapped in a `prefers-reduced-motion` query:**

```css
@media (prefers-reduced-motion: no-preference) {
  /* Animations here */
}

@media (prefers-reduced-motion: reduce) {
  .echoprax-state-change,
  .echoprax-countdown,
  .echoprax-spin,
  .echoprax-float,
  .echoprax-hover-bounce {
    transition: none;
    animation: none;
  }
}
```

### CSS Custom Properties

```css
:root {
  --echoprax-easing-bouncy: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --echoprax-easing-bouncy-out: cubic-bezier(0.34, 1.56, 0.64, 1);
  --echoprax-easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Breakpoints

Mobile-first responsive design with these breakpoint ranges:

| Token | Range          | Target Devices                          |
| ----- | -------------- | --------------------------------------- |
| `xs`  | < 375px        | Small phones (iPhone SE, older Android) |
| `sm`  | 375px - 639px  | Standard phones (iPhone, Pixel)         |
| `md`  | 640px - 767px  | Large phones, small tablets             |
| `lg`  | 768px - 1023px | Tablets (iPad)                          |
| `xl`  | 1024px+        | Desktop, large tablets                  |

### Media Query Usage

```css
/* Mobile-first approach: base styles are for smallest screens */

/* Small phones and up */
@media (min-width: 375px) {
}

/* Large phones / small tablets */
@media (min-width: 640px) {
}

/* Tablets */
@media (min-width: 768px) {
}

/* Desktop */
@media (min-width: 1024px) {
}
```

### Tailwind Classes

```html
<!-- Example: responsive timer size -->
<div class="text-6xl sm:text-7xl md:text-8xl lg:text-9xl">02:30</div>
```

---

## Component Patterns

### ViewHeader (Persistent Navigation)

Every view should include a consistent header with back navigation.

```tsx
interface ViewHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: JSX.Element;
}

const ViewHeader = (props: ViewHeaderProps) => (
  <header
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `${echoprax.spacing.md} ${echoprax.spacing.lg}`,
      minHeight: '56px',
    }}
  >
    <button
      onClick={props.onBack}
      aria-label="Go back"
      style={{
        minWidth: '44px',
        minHeight: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ChevronLeftIcon />
    </button>

    <h1 style={typography.headingMd}>{props.title}</h1>

    <div style={{ minWidth: '44px' }}>{props.rightAction}</div>
  </header>
);
```

### Cards (Solid Memphis Surfaces)

Cards use solid backgrounds, not glass. This is core to the Memphis aesthetic.

```typescript
const memphisSurfaces = {
  card: {
    background: '#1A1A1F', // Solid dark surface
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px', // radii.lg
  },
  elevated: {
    background: 'rgba(30, 30, 40, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
  },
};
```

```tsx
const WorkoutCard = (props: WorkoutCardProps) => (
  <article
    style={{
      ...memphisSurfaces.card,
      padding: echoprax.spacing.xl,
    }}
  >
    <h3 style={typography.headingSm}>{props.title}</h3>
    <p style={{ ...typography.bodySm, color: memphisColors.mutedText }}>{props.description}</p>
  </article>
);
```

### Buttons

#### Glass Buttons (Interactive/Secondary)

```tsx
const GlassButton = (props: ButtonProps) => (
  <button
    class="echoprax-glass-btn"
    style={{
      padding: `${echoprax.spacing.md} ${echoprax.spacing.lg}`,
      borderRadius: echoprax.radii.md,
      minHeight: '48px',
      ...typography.body,
      color: echoprax.colors.text,
    }}
  >
    {props.children}
  </button>
);
```

#### Solid Buttons (Primary CTAs)

```tsx
const PrimaryButton = (props: ButtonProps) => (
  <button
    style={{
      background: memphisColors.hotPink,
      border: 'none',
      borderRadius: echoprax.radii.organic,
      padding: `${echoprax.spacing.md} ${echoprax.spacing.xl}`,
      minHeight: '56px',
      ...typography.body,
      fontWeight: '600',
      color: '#FFFFFF',
      boxShadow: echoprax.shadows.md,
    }}
  >
    {props.children}
  </button>
);
```

### Form Inputs

```typescript
const inputStyles = {
  base: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: echoprax.radii.md,
    padding: `${echoprax.spacing.md} ${echoprax.spacing.lg}`,
    minHeight: '48px',
    ...typography.body,
    color: echoprax.colors.text,
  },
  focus: {
    borderColor: memphisColors.electricBlue,
    outline: `2px solid ${memphisColors.acidYellow}`,
    outlineOffset: '2px',
  },
  error: {
    borderColor: memphisColors.coral,
  },
};
```

```tsx
<input
  type="text"
  style={inputStyles.base}
  onFocus={(e) => Object.assign(e.target.style, inputStyles.focus)}
  onBlur={(e) => Object.assign(e.target.style, inputStyles.base)}
/>
```

---

## Decorative Elements

### Terrazzo Pattern

Used as a subtle background texture at very low opacity.

```typescript
const memphisPatterns = {
  terrazzo: `
    radial-gradient(circle at 20% 30%, #FF6B9D15 2px, transparent 2px),
    radial-gradient(circle at 60% 70%, #00D4FF15 3px, transparent 3px),
    radial-gradient(circle at 80% 20%, #FFEA0015 2px, transparent 2px),
    radial-gradient(circle at 40% 80%, #7FFFD415 2px, transparent 2px),
    radial-gradient(circle at 10% 60%, #FF6F6115 3px, transparent 3px),
    radial-gradient(circle at 90% 50%, #E6B8FF15 2px, transparent 2px)
  `,
};
```

**Usage:** Apply at 3% opacity maximum as a background layer.

```css
.terrazzo-bg {
  background-image: /* terrazzo pattern */;
  opacity: 0.03;
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 0;
}
```

### Memphis Shapes

Geometric decorative elements used sparingly in idle/menu states.

```typescript
const memphisShapes = {
  circle: (color: string, size: string) => ({
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
  }),

  triangle: (color: string, size: string) => ({
    width: '0',
    height: '0',
    borderLeft: `${parseInt(size) / 2}px solid transparent`,
    borderRight: `${parseInt(size) / 2}px solid transparent`,
    borderBottom: `${size} solid ${color}`,
  }),

  squiggle: (color: string) => ({
    stroke: color,
    strokeWidth: '3px',
    strokeLinecap: 'round',
    fill: 'none',
  }),

  arc: (color: string, size: string) => ({
    width: size,
    height: `calc(${size} / 2)`,
    borderRadius: `${size} ${size} 0 0`,
    border: `3px solid ${color}`,
    borderBottom: 'none',
    background: 'transparent',
  }),
};
```

### Decorative Element Guidelines

| Context           | Visibility                       |
| ----------------- | -------------------------------- |
| Home/Menu screens | Show shapes (floating, spinning) |
| Workout selection | Show shapes (subtle)             |
| Active workout    | **HIDE all decorative elements** |
| Rest periods      | Minimal shapes allowed           |
| Completion screen | Show shapes (celebration)        |

**Rationale:** During active exercise, the user needs to focus on the timer. Decorative elements become distracting and can affect performance perception.

```tsx
// Example: conditionally render decorations
const DecorativeShapes = () => {
  const { sessionState } = useWorkoutContext();

  // Hide during active workout
  if (sessionState === 'active' || sessionState === 'countdown') {
    return null;
  }

  return (
    <div class="echoprax-decorations" aria-hidden="true">
      {/* Memphis shapes */}
    </div>
  );
};
```

---

## Accessibility Requirements

### Focus States

All interactive elements must have visible focus indicators:

```typescript
const focusStyles = {
  visible: {
    outline: '2px solid #FFEA00', // Acid yellow
    outlineOffset: '2px',
  },
  ring: '0 0 0 2px #FFEA00',
};
```

```css
/* Apply to all focusable elements */
.echoprax-glass-btn:focus-visible,
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--memphis-acid-yellow);
  outline-offset: 2px;
}

/* Remove outline for mouse users */
.echoprax-glass-btn:focus:not(:focus-visible) {
  outline: none;
}
```

### Color Contrast

All text/background combinations meet WCAG AA minimum (4.5:1 for normal text, 3:1 for large text):

| Combination                 | Contrast Ratio | WCAG Level |
| --------------------------- | -------------- | ---------- |
| White on Deep Black         | 19.8:1         | AAA        |
| Muted Text on Deep Black    | 9.2:1          | AAA        |
| Hot Pink on Deep Black      | 6.2:1          | AA         |
| Electric Blue on Deep Black | 8.9:1          | AAA        |
| Acid Yellow on Deep Black   | 14.8:1         | AAA        |
| Mint Green on Deep Black    | 12.4:1         | AAA        |
| Coral on Deep Black         | 5.4:1          | AA         |
| Lavender on Deep Black      | 8.2:1          | AAA        |

### ARIA Patterns

#### Timer Announcement

```tsx
<div
  role="timer"
  aria-live="polite"
  aria-atomic="true"
  aria-label={`${minutes} minutes ${seconds} seconds remaining`}
>
  {formatTime(timeRemaining)}
</div>
```

#### State Changes

```tsx
<div role="status" aria-live="assertive" aria-label={`Workout state: ${currentState}`}>
  {stateLabel}
</div>
```

#### Button Labels

```tsx
<button aria-label="Start workout">
  <PlayIcon aria-hidden="true" />
</button>

<button aria-label="Pause workout">
  <PauseIcon aria-hidden="true" />
</button>

<button aria-label="Go back to previous screen">
  <ChevronLeftIcon aria-hidden="true" />
</button>
```

### Reduced Motion

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```typescript
// In components
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const animationDuration = prefersReducedMotion ? 0 : 300;
```

### Touch Target Compliance

- All buttons: minimum 44x44px
- Primary actions: 56x56px recommended
- Adequate spacing between targets (minimum 8px)

### Screen Reader Testing

Ensure the following are properly announced:

1. Timer countdown values
2. State changes (active, rest, paused, completed)
3. Round/set progress ("Round 3 of 5")
4. Exercise names and instructions
5. Navigation actions

---

## Quick Reference

### Import Paths

```typescript
import {
  echoprax,
  typography,
  memphisColors,
  sessionStateColors,
  memphisAccents,
  glassButton,
  memphisSurfaces,
  kineticAnimations,
  memphisPatterns,
  memphisShapes,
  focusStyles,
  getEchopraxCSS,
} from '@/theme/echoprax';
```

### CSS Custom Properties Summary

```css
/* Colors */
--echoprax-primary: #ff6b9d;
--echoprax-secondary: #00d4ff;
--echoprax-accent: #ffea00;
--echoprax-bg: #0d0d0d;
--echoprax-text: #ffffff;
--echoprax-text-muted: #b8b8c8;

/* Spacing (4px base) */
--echoprax-space-xs: 4px;
--echoprax-space-sm: 8px;
--echoprax-space-md: 16px;
--echoprax-space-lg: 24px;
--echoprax-space-xl: 32px;
--echoprax-space-xxl: 48px;

/* Easing */
--echoprax-easing-bouncy: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--echoprax-easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);

/* Session States */
--echoprax-state-idle: #b8b8c8;
--echoprax-state-countdown: #ffea00;
--echoprax-state-active: #ff6b9d;
--echoprax-state-rest: #00d4ff;
--echoprax-state-completed: #7fffd4;
--echoprax-state-paused: #e6b8ff;
```

---

_Last updated: January 2026_
_Theme file: `src/theme/echoprax.ts`_
