# Doodle Icons

Hand-drawn style icon system for Thoughtful App Co. company-level features.

## Overview

Doodle Icons are the **official icon set for all TACo company-level interfaces**, including:

- Homepage & footer
- Investors page
- Pricing page
- Auth flows (login/signup)
- User account & billing
- Admin panels
- Marketing pages

**Do NOT use in individual apps** (Tempo, Tenure, Nurture, etc.) - each app has its own icon system.

## Design Philosophy

- **Hand-drawn aesthetic** - Reflects TACo's human-first, anti-corporate values
- **Consistent stroke width** - 1.5px for main paths
- **Organic imperfections** - Subtle sketch details for authenticity
- **Inspired by** [Khushmeen's Doodle Icons](https://khushmeen.com/icons.html)

## Available Icons

### Philosophy & Values

- `DoodleHeart` - Human Good, Community
- `DoodleShield` - Local-First, Privacy
- `DoodleSparkle` - Anti-Dark Patterns, Good Design
- `DoodlePeople` - Open Contribution, Community

### Business & Growth

- `DoodleLightbulb` - Ideas, Innovation
- `DoodleRocket` - Launch, Progress
- `DoodleHandshake` - Partnerships, Sponsors
- `DoodleLeaf` - Growth, Sustainability

### Technology & Tools

- `DoodlePhone` - Phone as Server, Mobile-First
- `DoodleCode` - Open Source, Development
- `DoodlePalette` - Design, Creativity
- `DoodleCompass` - Strategy, Direction

## Usage

```tsx
import { DoodleHeart, DoodleShield } from '@/components/common/DoodleIcons';

// Basic usage
<DoodleHeart size={24} color="#FF6B6B" />

// In a list with text
<li style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
  <DoodleShield size={18} color="#4ECDC4" />
  <span>Local-First Principles</span>
</li>

// In a heading
<h3 style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
  <DoodleRocket size={22} color="#FFE66D" />
  Gamified Hackathons
</h3>
```

## Props

```tsx
interface IconProps {
  size?: number; // Default: 24
  color?: string; // Default: 'currentColor'
  style?: JSX.CSSProperties;
  class?: string;
}
```

## Color Guidelines

Use TACo brand colors for consistency:

| Color  | Hex       | Use For                         |
| ------ | --------- | ------------------------------- |
| Coral  | `#FF6B6B` | Warm, human, community concepts |
| Teal   | `#4ECDC4` | Trust, security, technology     |
| Yellow | `#FFE66D` | Innovation, energy, creativity  |
| Purple | `#9333EA` | Premium, collaboration          |
| Green  | `#10B981` | Growth, success                 |

## Size Guidelines

| Context          | Size    | Example            |
| ---------------- | ------- | ------------------ |
| Footer links     | 18px    | Philosophy section |
| Inline with text | 18-20px | List items         |
| Section headings | 22-24px | Key Initiatives    |
| Hero/Feature     | 28-32px | Marketing sections |

## Accessibility

- **Minimum size:** 18px for UI elements
- **Always pair with text** for context
- **Color contrast:** Ensure 4.5:1 minimum against background
- **Semantic HTML:** Use proper heading levels when icons are in headings

## Examples in Codebase

- **Homepage Footer:** `src/App.tsx` - Philosophy section with 4 icons
- **Investors Page:** `src/components/InvestorsPage.tsx` - Key Initiatives with 4 icons
- **Login Modal:** `src/components/common/LoginModal.tsx` - DoodleShield (security), DoodleSparkle (success)
- **Paywall Modal:** `src/components/common/Paywall.tsx` - DoodleRocket (upgrades), DoodleShield (backup)

## Adding New Icons

When creating new Doodle Icons:

1. **Follow the style:**
   - 1.5px stroke width for main paths
   - `stroke-linecap="round"` and `stroke-linejoin="round"`
   - Add 1-2 subtle sketch accent strokes (0.6-1px width, reduced opacity)

2. **Use the template:**

```tsx
export const DoodleNewIcon: Component<IconProps> = (props) => {
  const size = () => props.size || 24;
  return (
    <svg
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill="none"
      style={props.style}
      class={props.class}
    >
      <path
        d="M..." // Main icon path
        stroke={props.color || 'currentColor'}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      {/* Optional sketch accent */}
      <path d="M..." stroke={props.color || 'currentColor'} stroke-width="1" opacity="0.6" />
    </svg>
  );
};
```

3. **Export it:**

```tsx
export const DoodleIcons = {
  // ... existing icons
  NewIcon: DoodleNewIcon,
};
```

## License

These custom implementations are part of TACo's design system. Original Doodle Icons by Khushmeen are CC0 (public domain).
