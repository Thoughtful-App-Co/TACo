# Thoughtful App Co. - Design Specifications

## Overview
Two distinct design systems for two products under one brand umbrella.

---

## 1. NURTURE - Biophilic Design System

### Design Philosophy
*"Nature flows, technology grows"*

Mimics natural patterns to reduce stress and enhance user connection with relationship management.

### Typography
| Element | Font | Weight | Size |
|---------|------|--------|------|
| Heading | DM Sans | 600 | 36px |
| Subheading | DM Sans | 600 | 20px |
| Body | DM Sans | 400 | 16px |
| Caption | DM Sans | 400 | 13px |

**Rationale**: DM Sans offers subtle organic qualities with slightly rounded terminals that soften the digital feel.

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#2D5A45` | Deep forest - primary actions, icons |
| Secondary | `#4A7C6F` | Moss - secondary elements |
| Accent | `#8FB8A8` | Sage mist - highlights, organic shapes |
| Background | `#F7FAF8` | Morning fog - page background |
| Surface | `#FFFFFF` | Card backgrounds |
| Text | `#1A2F25` | Deep earth - primary text |
| Text Muted | `#5A7268` | Weathered stone - secondary text |
| Border | `#D4E5DD` | Lichen - dividers, borders |

### Spacing Scale
```
xs: 4px   | sm: 8px   | md: 16px
lg: 24px  | xl: 40px  | xxl: 64px
```

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| sm | 8px | Small elements |
| md | 16px | Buttons, inputs |
| lg | 24px | Cards |
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
*"Natural reading, digital paper"*

Optimized for extended reading and case documentation review.

### Typography
| Element | Font | Weight | Size |
|---------|------|--------|------|
| Heading | DM Sans | 600 | 28px |
| Subheading | DM Sans | 500 | 15px |
| Body | Crimson Pro | 400 | 18px |
| Caption | DM Sans | 500 | 12px |

**Rationale**: Crimson Pro (serif) for optimal reading comfort; DM Sans for UI chrome to create clear hierarchy.

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#1C1C1C` | Ink black - primary actions |
| Secondary | `#4A4A4A` | Soft charcoal - icons |
| Accent | `#D4A574` | Warm sepia - highlights |
| Background | `#FAFAF7` | Natural paper - page bg |
| Surface | `#FFFFFF` | Bright paper - cards |
| Text | `#2C2C2C` | Reading ink - body text |
| Text Muted | `#6B6B6B` | Faded text - captions |
| Border | `#E8E8E4` | Paper edge - dividers |

### Watercolor Highlights
| Color | Value | Usage |
|-------|-------|-------|
| Yellow | `rgba(255, 235, 120, 0.4)` | Key dates, important |
| Blue | `rgba(150, 200, 240, 0.35)` | Names, entities |
| Pink | `rgba(255, 180, 180, 0.35)` | Warnings |
| Green | `rgba(180, 230, 180, 0.35)` | Positive outcomes |

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| sm | 2px | Subtle rounding |
| md | 4px | Buttons, badges |
| lg | 8px | Cards |

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
