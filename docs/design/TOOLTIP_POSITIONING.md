# Tooltip Positioning Paradigm

**Last Updated:** December 29, 2025  
**Status:** Active Design Standard

## Overview

All tooltips across TACo applications must follow these mandatory requirements:

1. **ALWAYS use `<Portal>` from `solid-js/web`** to render tooltips
2. Use intelligent positioning to keep tooltips visible and near their trigger elements

---

## ⚠️ MANDATORY: Portal Rendering

**ALL tooltips MUST be rendered using SolidJS Portal.** This is non-negotiable.

### Why Portal is Required

Parent containers often have CSS properties (`transform`, `filter`, `will-change`, `overflow: hidden`) that create new containing blocks and break `position: fixed` positioning. Portal renders the tooltip at the document root, completely escaping these issues.

### Required Pattern

```typescript
import { Portal } from 'solid-js/web';

// ✅ CORRECT - Always use Portal
<Portal>
  <Show when={showTooltip()}>
    <div style={{ position: 'fixed', left: `${x}px`, top: `${y}px`, 'z-index': 10000 }}>
      {/* Tooltip content */}
    </div>
  </Show>
</Portal>

// ❌ WRONG - Never render tooltips inline
<Show when={showTooltip()}>
  <div style={{ position: 'fixed', ... }}>
    {/* This WILL break in many contexts */}
  </div>
</Show>
```

### Portal Import

```typescript
import { Portal } from 'solid-js/web';
```

---

## Core Principles

### 1. Position Near Trigger Element

Tooltips should appear **near the element that triggered them**, with intelligent positioning to avoid viewport overflow.

**Two positioning strategies:**

#### A. Near-Point Positioning (for graphs, charts, small elements)

- Position tooltip close to the trigger element (typically 12px offset)
- Center horizontally on the element
- Default to above, flip to below if insufficient space
- Constrain horizontally to prevent viewport overflow
- **Use when:** Small clickable areas, data points, icons

#### B. Center-Biased Positioning (for larger UI elements)

- Position tooltip toward the center of the viewport
- Left-side elements → tooltip biases right (toward center)
- Right-side elements → tooltip biases left (toward center)
- **Use when:** List items, cards, larger interactive elements

**Rationale:** Different UI contexts require different positioning strategies. Small elements (like graph points) need tooltips close by for clarity, while larger elements benefit from center-biased positioning to keep tooltips in the optimal reading area.

### 2. Horizontal Bias

- **Left Side Elements:** If the trigger element is on the left half of the screen, position the tooltip to the right (toward center)
- **Right Side Elements:** If the trigger element is on the right half of the screen, position the tooltip to the left (toward center)

### 3. Vertical Flexibility

- **Default:** Position tooltip above the element
- **Fallback:** If insufficient space above, position below the element
- **Consideration:** Account for tooltip height when determining available space

### 4. Intelligent Spacing

Calculate available space on all sides and use appropriate padding/margins to prevent tooltips from touching viewport edges.

## Implementation Patterns

### Pattern A: Near-Point Positioning (Graphs/Charts)

Use this for small interactive elements where the tooltip should appear close to the trigger.

```typescript
const calculateNearPointPosition = (triggerElement: HTMLElement | SVGElement) => {
  const rect = triggerElement.getBoundingClientRect();

  // Viewport measurements
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Point center position
  const pointX = rect.left + rect.width / 2;
  const pointY = rect.top + rect.height / 2;

  // Tooltip dimensions
  const tooltipWidth = 200;
  const tooltipHeight = 80;
  const offset = 12; // Distance from point

  // Available space
  const spaceTop = rect.top;
  const spaceBottom = viewportHeight - rect.bottom;

  // Default: above and centered on point
  let x = pointX;
  let y = pointY - offset;
  let isBelow = false;

  // Flip vertically if needed
  if (spaceTop < tooltipHeight + offset && spaceBottom > tooltipHeight + offset) {
    y = pointY + offset;
    isBelow = true;
  }

  // Constrain horizontally to viewport
  const minX = tooltipWidth / 2 + 10;
  const maxX = viewportWidth - tooltipWidth / 2 - 10;
  x = Math.max(minX, Math.min(maxX, x));

  return { x, y, isBelow };
};
```

### Pattern B: Center-Biased Positioning (UI Elements)

Use this for larger UI elements like list items, cards, or buttons.

```typescript
const calculateCenterBiasedPosition = (triggerElement: HTMLElement | SVGElement) => {
  const rect = triggerElement.getBoundingClientRect();

  // Viewport measurements
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const centerX = viewportWidth / 2;

  // Element center
  const elementCenterX = rect.left + rect.width / 2;

  // Tooltip dimensions
  const tooltipWidth = 320;
  const tooltipHeight = 200;
  const padding = 12;

  // Available space
  const spaceLeft = rect.left;
  const spaceRight = viewportWidth - rect.right;
  const spaceTop = rect.top;
  const spaceBottom = viewportHeight - rect.bottom;

  // Horizontal positioning - bias toward center
  let x = elementCenterX;
  if (elementCenterX < centerX) {
    // Element on left - bias right toward center
    if (spaceRight >= tooltipWidth / 2) {
      x = Math.min(elementCenterX + tooltipWidth / 4, centerX);
    }
  } else {
    // Element on right - bias left toward center
    if (spaceLeft >= tooltipWidth / 2) {
      x = Math.max(elementCenterX - tooltipWidth / 4, centerX);
    }
  }

  // Vertical positioning - prefer top, fallback to bottom
  let y = rect.top - padding;
  let isBelow = false;

  if (spaceTop < tooltipHeight + padding && spaceBottom > spaceTop) {
    y = rect.bottom + padding;
    isBelow = true;
  }

  return { x, y, isBelow };
};
```

### Transform Application

Apply the appropriate CSS transform based on vertical position:

```typescript
// If positioned above (default)
transform: 'translate(-50%, -100%)';

// If positioned below (fallback)
transform: 'translate(-50%, 0%)';
```

## Reference Implementations

### Existing Implementations

#### Pattern A: Near-Point Positioning

1. **`/src/components/tenure/pipeline/trends/components/ActivityTimelineChart.tsx`**
   - Graph data point tooltips positioned near the point
   - Handles SVG element positioning
   - Vertical flip when near top of viewport
   - Horizontal constraint to prevent overflow
   - **Best reference for graph/chart tooltips**

#### Pattern B: Center-Biased Positioning

1. **`/src/components/tenure/pipeline/ui/Tooltip.tsx`**
   - Full implementation with `position="auto"` mode
   - Supports horizontal and vertical center-biasing
   - Includes 200ms fade animation
   - **Best reference for UI element tooltips**

2. **`/src/components/tenure/pipeline/trends/components/InfoTooltip.tsx`**
   - Info icon tooltips with center-biasing
   - Portal-based rendering to avoid clipping
   - Rich content support

3. **`/src/components/tenure/pipeline/components/SankeyView.tsx`**
   - Complex tooltip with left/right alignment
   - Prevents overflow on right edge
   - **Good reference for flow chart tooltips**

### Components to Update

If creating new tooltip implementations, use the pattern from `Tooltip.tsx` as the baseline. Avoid creating custom positioning logic unless there's a specific requirement.

## Anti-Patterns

❌ **Don't do this:**

```typescript
// Fixed positioning without viewport awareness
setTooltipPosition({
  x: rect.left + rect.width / 2,
  y: rect.top - 10,
});
```

❌ **Don't do this:**

```typescript
// No consideration for available space
transform: 'translate(-50%, -100%)'; // Always above, even if clipped
```

❌ **Don't do this:**

```typescript
// Using center-bias for small graph points (tooltip too far from point)
if (elementCenterX < centerX) {
  x = Math.min(elementCenterX + tooltipWidth / 4, centerX);
}
```

✅ **Do this instead:**

```typescript
// For graphs: Near-point with viewport constraints
const x = Math.max(minX, Math.min(maxX, pointX));
const y = spaceTop < tooltipHeight ? pointY + offset : pointY - offset;
```

✅ **Or this for UI elements:**

```typescript
// For UI: Center-biased with viewport awareness
const calculatePosition = () => {
  // Calculate center bias based on element position
  // Check available space
  // Choose optimal position
  return { x, y, isBelow };
};
```

❌ **Don't do this:**

```typescript
// No consideration for available space
transform: 'translate(-50%, -100%)'; // Always above, even if clipped
```

✅ **Do this instead:**

```typescript
// Center-biased with viewport awareness
const calculatePosition = () => {
  // Calculate center bias
  // Check available space
  // Choose optimal position
  return { x, y, isBelow };
};
```

## Edge Cases

### Small Viewports (Mobile)

- Reduce tooltip width for viewports < 480px
- Consider bottom sheet pattern for complex tooltips
- Ensure minimum padding from screen edges (16px recommended)

### Long Content

- Set `max-height` with scroll for very long tooltips
- Consider truncation with "show more" for excessive content
- Prefer concise tooltip content

### Multiple Tooltips

- Only one tooltip should be visible at a time
- Previous tooltip should fade out before new one appears
- Use tooltip manager/state if needed

### Portal Rendering (MANDATORY)

**ALL tooltips MUST use Portal.** See the mandatory section at the top of this document.

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

## Accessibility

- Use `role="tooltip"` on tooltip container
- Use `aria-describedby` on trigger element pointing to tooltip ID
- Ensure tooltips are keyboard accessible (show on focus, hide on blur)
- Support both hover and click/tap interactions
- Minimum 200ms delay before showing to prevent flicker

## Animation Standards

- **Fade in:** 200ms ease
- **Fade out:** 200ms ease
- **Position transition:** Smooth when tooltip position changes
- Use `@keyframes tooltipFadeIn` for consistent animation

```css
@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -100%) translateY(5px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%) translateY(0);
  }
}
```

## Testing Checklist

When implementing or updating tooltips, verify:

- [ ] **Tooltip uses `<Portal>` from `solid-js/web`** (MANDATORY)
- [ ] Tooltip appears correctly when trigger is on left side of screen
- [ ] Tooltip appears correctly when trigger is on right side of screen
- [ ] Tooltip appears correctly when trigger is near top of screen
- [ ] Tooltip appears correctly when trigger is near bottom of screen
- [ ] Tooltip never overflows viewport horizontally
- [ ] Tooltip never overflows viewport vertically
- [ ] Tooltip animates smoothly on show/hide
- [ ] Tooltip is keyboard accessible
- [ ] Tooltip works on mobile viewports
- [ ] Multiple tooltips don't overlap
- [ ] Tooltip has appropriate z-index (10000 recommended)
- [ ] Tooltip renders correctly inside containers with `transform` or `overflow: hidden`

## Migration Guide

If updating an existing tooltip implementation:

1. Identify current positioning logic
2. Extract trigger element rect with `getBoundingClientRect()`
3. Calculate viewport center
4. Apply center-biasing logic for horizontal position
5. Add vertical flip logic if not present
6. Update transform to use calculated `isBelow` flag
7. Test all edge cases from checklist
8. Update component documentation

## Questions?

For questions or clarifications about tooltip positioning, refer to:

- `/src/components/tenure/pipeline/ui/Tooltip.tsx` (canonical implementation)
- This document
- The Design System docs at `/docs/design/DESIGN_SYSTEM.md`
