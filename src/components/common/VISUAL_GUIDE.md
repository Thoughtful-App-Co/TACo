# RegionUnavailableMessage - Visual Guide

This document shows the visual appearance of the `RegionUnavailableMessage` component in different modes.

## Full Mode (Default)

```
┌─────────────────────────────────────────────────────────────┐
│ 🌍 Labor Market Data Not Yet Available                     │
│                                                              │
│ We don't currently have labor market data for Canada.       │
│ We're working on expanding our coverage globally.           │
│                                                              │
│ CURRENTLY SUPPORTED:                                        │
│ • United States                                             │
│   (Bureau of Labor Statistics (BLS))                        │
│                                                              │
│ COMING SOON:                                                │
│ • European Union                                            │
│   (Eurostat)                                                │
│ • Canada                                                    │
│   (Statistics Canada)                                       │
│ • United Kingdom                                            │
│   (Office for National Statistics)                          │
│ • Australia                                                 │
│   (Australian Bureau of Statistics)                         │
└─────────────────────────────────────────────────────────────┘
```

**Styling:**

- Background: Light blue tint (rgba(59, 130, 246, 0.15))
- Border: Blue (rgba(59, 130, 246, 0.3))
- Text color: Dark blue (#2563EB)
- Padding: 18px 20px
- Border radius: 12px

---

## Compact Mode

```
┌─────────────────────────────────────────────────────────────┐
│ ℹ️ Labor market data not available for Canada.             │
│   Currently US only.                                        │
└─────────────────────────────────────────────────────────────┘
```

**Styling:**

- Background: Light blue tint (rgba(59, 130, 246, 0.15))
- Border: Blue (rgba(59, 130, 246, 0.3))
- Text color: Dark blue (#2563EB)
- Padding: 10px 14px
- Border radius: 8px
- Font size: 13px

---

## Color Reference

The component uses the semantic color system from `/theme/semantic-colors.ts`:

```typescript
semanticColors.info = {
  base: '#3B82F6', // Blue 500 - main text
  light: '#60A5FA', // Blue 400 - coming soon items
  dark: '#2563EB', // Blue 600 - primary text
  bg: 'rgba(59, 130, 246, 0.15)', // light background
  border: 'rgba(59, 130, 246, 0.3)', // border
};
```

---

## Typography

- Font family: 'Space Grotesk', system-ui, sans-serif
- Full mode font size: 14px
- Compact mode font size: 13px
- Line height: 1.5 (compact), 1.6 (full message)
- Heading weight: 600
- Section titles: 13px, uppercase, letter-spacing 0.025em

---

## Accessibility Features

1. **Semantic HTML**
   - Uses `<h3>` for heading
   - Uses `<p>` for paragraphs
   - Uses `<ul>` and `<li>` for lists

2. **ARIA Attributes**
   - `role="status"` - identifies as status region
   - `aria-live="polite"` - announces changes politely
   - `aria-labelledby` - connects heading to content
   - `aria-hidden="true"` - hides decorative elements

3. **Visual Indicators**
   - Info-level coloring (blue, not error red)
   - Clear contrast ratios
   - Consistent spacing
   - Readable font sizes

---

## Responsive Behavior

The component is **fluid-width** by default:

- Adapts to container width
- Minimum effective width: ~300px
- Maximum recommended width: ~600px
- Works well in cards, modals, and page sections

---

## Use Cases

### 1. Feature Gating

Hide premium labor market features for unsupported regions:

```tsx
<Show
  when={isLaborMarketAvailable(userCountry)}
  fallback={<RegionUnavailableMessage {...regionProps} />}
>
  <LaborMarketWidget />
</Show>
```

### 2. Inline Notice

Small notice within a larger component:

```tsx
<div class="salary-section">
  <h4>Salary Insights</h4>
  <RegionUnavailableMessage {...props} compact />
</div>
```

### 3. Dedicated Info Page

Full explanation on a dedicated page or modal:

```tsx
<RegionUnavailableMessage
  countryCode={country}
  countryName={countryName}
  showSupportedRegions={true}
/>
```

---

**Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.**
