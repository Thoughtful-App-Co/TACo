# Tenure Theme & Color System

## Font System (CONSISTENT ACROSS ALL VIEWS)

Both the main Tenure app and the Pipeline/Prospect view use the **same font family**:

| Element          | Font Family | Weight  | Size    |
| ---------------- | ----------- | ------- | ------- |
| **Headings**     | Dosis       | 700-800 | 32-56px |
| **Sub-headings** | Gafata      | 700     | 18-24px |
| **Body Text**    | Gafata      | 400     | 15-18px |

## Dynamic Color System ⚡

**IMPORTANT:** Tenure uses a **dynamic color system** that adapts based on your RIASEC personality assessment results.

### How It Works

When you complete the Discover assessment, your top 2 RIASEC personality types determine the app's color scheme:

```typescript
// After assessment completion
const top1 = sortedScores[0].key; // Your primary type
const top2 = sortedScores[1].key; // Your secondary type

// Theme dynamically updates
setCurrentTheme({
  colors: {
    primary: maximalist.riasec[top1], // Your primary color
    secondary: maximalist.riasec[top2], // Your secondary color
    accent: maximalist.riasec[top2],
  },
  gradients: {
    primary: `linear-gradient(135deg, ${top1Color}, ${top2Color})`,
  },
  shadows: {
    // Shadows tinted with your RIASEC colors
  },
});
```

### RIASEC Color Palette

Each personality type has a unique color:

| RIASEC Type       | Color           | Hex       | Character        |
| ----------------- | --------------- | --------- | ---------------- |
| **Realistic**     | Neon Orange     | `#F97316` | Hot, energetic   |
| **Investigative** | Neon Purple     | `#8B5CF6` | Cool, analytical |
| **Artistic**      | Hot Pink        | `#EC4899` | Hot, creative    |
| **Social**        | Emerald Green   | `#10B981` | Cool, harmonious |
| **Enterprising**  | Electric Yellow | `#EAB308` | Hot, dynamic     |
| **Conventional**  | Cyan            | `#06B6D4` | Cool, structured |

### Example Color Combinations

**The Engineer (Investigative + Realistic):**

- Primary: Neon Purple (#8B5CF6)
- Secondary: Neon Orange (#F97316)
- Gradient: Purple → Orange

**The Creator (Artistic + Social):**

- Primary: Hot Pink (#EC4899)
- Secondary: Emerald Green (#10B981)
- Gradient: Pink → Green

**The Strategist (Enterprising + Investigative):**

- Primary: Electric Yellow (#EAB308)
- Secondary: Neon Purple (#8B5CF6)
- Gradient: Yellow → Purple

---

## Default Colors (Before Assessment)

Before completing the Discover assessment, Tenure shows default neutral colors:

```typescript
colors: {
  primary: '#FFFFFF',    // White
  secondary: '#A3A3A3',  // Neutral 400
  accent: '#FFFFFF',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#F3F4F6',
}
```

---

## Maximalist vs LiquidTenure Themes

### Maximalist Theme (Main Tenure App)

**Used in:** Discover, Prepare, Matches tabs

**Visual Style:**

- **Colors:** Dynamic RIASEC colors (changes based on your assessment)
- **Default:** White/Neutral (before assessment)
- **Aesthetic:** Bold, vibrant, maximalist
- **Shadows:** Dynamically tinted based on RIASEC colors
- **Patterns:** Zigzag, dots, decorative elements

**Color Assignment:**

```typescript
// Dynamic based on YOUR personality
colors: {
  primary: riasecColors[yourTop1Type],
  secondary: riasecColors[yourTop2Type],
  accent: riasecColors[yourTop2Type],
}
```

---

### LiquidTenure Theme (Pipeline/Prospect View)

**Used in:** Prospect tab ("{username}'s Job Pipeline")

**Visual Style:**

- **Colors:** Inherits RIASEC-based colors from maximalist theme
- **Effects:** Glass morphism, backdrop blur
- **Animations:** Liquid flow, morph, ripple effects
- **Aesthetic:** Fluid, modern, professional overlay on RIASEC colors

**Implementation:**

```typescript
liquidTenure {
  colors: {
    ...maximalist.colors,          // Inherits YOUR RIASEC colors ✓
    surfaceLight: 'rgba(255, 255, 255, 0.03)',
    surfaceMedium: 'rgba(255, 255, 255, 0.06)',
  },

  fonts: maximalist.fonts,         // SAME FONTS ✓

  glass: {
    background: 'rgba(30, 30, 30, 0.6)',
    backdropFilter: 'blur(12px)',
  }
}
```

---

## Why Dynamic Colors?

### 1. **Personalization**

- Your unique RIASEC profile determines your visual experience
- Creates emotional connection with the app
- Reinforces your personality archetype visually

### 2. **Consistency Across Contexts**

- Same RIASEC colors in Discover, Matches, AND Pipeline
- No jarring visual transitions between sections
- Your personal color scheme follows you throughout

### 3. **Meaningful Aesthetics**

- Colors aren't arbitrary—they represent YOUR personality
- Gradient represents blend of your top 2 traits
- Shadows and accents reinforce your unique profile

---

## Key Takeaway

**Tenure's color system is 100% personalized based on your Discover assessment.**

```
Before Assessment:
  → Neutral colors (white/gray)

After Assessment:
  → YOUR RIASEC colors everywhere
  → Discover tab: Your colors
  → Matches tab: Your colors
  → Pipeline tab: Your colors + liquid effects
  → Prepare tab: Your colors

The only difference between views is:
  ✓ FONTS: Always the same (Dosis + Gafata)
  ✓ COLORS: Always YOUR RIASEC colors
  ✗ EFFECTS: Different per context (liquid glass in Pipeline, etc.)
```

The visual style adapts to context (exploration vs. tracking) while **your personal color identity remains constant**.
