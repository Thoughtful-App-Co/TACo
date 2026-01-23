/**
 * Mobile Design Tokens
 *
 * Comprehensive design system tokens extracted from TACo Tenure app audit (Jan 2026).
 * These tokens standardize spacing, colors, typography, and other design primitives
 * to ensure consistency across all mobile views.
 *
 * Usage:
 * ```tsx
 * import { mobileTokens } from '@/theme/mobile-tokens';
 *
 * <div style={{ padding: mobileTokens.spacing.containerPadding.mobile }}>
 * ```
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

// ============================================================================
// SPACING SCALE
// ============================================================================

/**
 * Spacing Scale (8px base unit)
 *
 * Rationale:
 * - 8px base unit is divisible and scales well across devices
 * - Values extracted from audit showing most common spacings
 * - Eliminates inconsistent 6px, 10px, 14px values
 */
export const spacing = {
  /** 4px - Micro spacing (tight gaps) */
  xs: '4px',
  /** 8px - Small spacing (related elements) */
  sm: '8px',
  /** 12px - Standard spacing (UI elements) */
  md: '12px',
  /** 16px - Section spacing (cards, grids) */
  lg: '16px',
  /** 24px - Major sections */
  xl: '24px',
  /** 32px - Large section breaks */
  '2xl': '32px',
  /** 48px - Extra large spacing */
  '3xl': '48px',

  // Semantic spacing tokens
  containerPadding: {
    /** 16px on mobile, 32px on desktop */
    mobile: '16px',
    desktop: '32px',
  },
  sectionGap: {
    /** 24px on mobile, 32px on desktop */
    mobile: '24px',
    desktop: '32px',
  },
  cardPadding: {
    /** 16px on mobile, 24px on desktop */
    mobile: '16px',
    desktop: '24px',
  },
} as const;

// ============================================================================
// COLOR TOKENS
// ============================================================================

/**
 * Opacity Scale
 *
 * Standardized RGBA opacity values for consistent layering.
 * Use with white (255, 255, 255) for light-on-dark surfaces.
 */
export const opacity = {
  /** 0.03 - Barely visible background surfaces */
  subtle: 0.03,
  /** 0.05 - Light surface lift */
  light: 0.05,
  /** 0.08 - Medium surfaces and hover states */
  medium: 0.08,
  /** 0.1 - Standard overlays */
  standard: 0.1,
  /** 0.12 - Border opacity (especially mobile) */
  border: 0.12,
  /** 0.15 - Status badge backgrounds */
  statusBg: 0.15,
  /** 0.3 - Status badge borders */
  statusBorder: 0.3,
} as const;

/**
 * Surface Colors (RGBA with standardized opacity)
 *
 * These create layered depth on dark backgrounds.
 */
export const surfaces = {
  /** rgba(255, 255, 255, 0.03) - Subtle card backgrounds */
  subtle: `rgba(255, 255, 255, ${opacity.subtle})`,
  /** rgba(255, 255, 255, 0.05) - Light card lift */
  light: `rgba(255, 255, 255, ${opacity.light})`,
  /** rgba(255, 255, 255, 0.08) - Medium surface or hover state */
  medium: `rgba(255, 255, 255, ${opacity.medium})`,
  /** rgba(255, 255, 255, 0.1) - Standard overlay */
  standard: `rgba(255, 255, 255, ${opacity.standard})`,
} as const;

/**
 * Border Colors
 */
export const borders = {
  /** rgba(255, 255, 255, 0.08) - Light borders */
  light: `rgba(255, 255, 255, ${opacity.medium})`,
  /** rgba(255, 255, 255, 0.12) - Standard borders (mobile) */
  standard: `rgba(255, 255, 255, ${opacity.border})`,
  /** #374151 - Cool Grey 700 (theme border) */
  grey: '#374151',
} as const;

// ============================================================================
// GLASSOMORPHIC DESIGN TOKENS
// ============================================================================

/**
 * Glassomorphic Design Tokens
 *
 * Frosted glass appearance following Apple/Microsoft design patterns.
 * Creates depth and modernity while maintaining readability.
 *
 * Reference: docs/context_engineering/design/glassomorphic.mdc
 */
export const glass = {
  /** Background colors with transparency */
  background: {
    /** Light glass - rgba(255, 255, 255, 0.08) */
    light: 'rgba(255, 255, 255, 0.08)',
    /** Medium glass - rgba(255, 255, 255, 0.12) */
    medium: 'rgba(255, 255, 255, 0.12)',
    /** Heavy glass - rgba(255, 255, 255, 0.18) */
    heavy: 'rgba(255, 255, 255, 0.18)',
    /** Dark glass (for dark mode) - rgba(20, 20, 20, 0.65) */
    dark: 'rgba(20, 20, 20, 0.65)',
    /** Elevated glass - rgba(30, 30, 35, 0.85) */
    elevated: 'rgba(30, 30, 35, 0.85)',
  },

  /** Border colors for glass elements */
  border: {
    /** Subtle border - rgba(255, 255, 255, 0.08) */
    subtle: 'rgba(255, 255, 255, 0.08)',
    /** Light border - rgba(255, 255, 255, 0.12) */
    light: 'rgba(255, 255, 255, 0.12)',
    /** Medium border - rgba(255, 255, 255, 0.18) */
    medium: 'rgba(255, 255, 255, 0.18)',
    /** Accent border with color */
    accent: 'rgba(96, 165, 250, 0.3)',
  },

  /** Blur values for backdrop-filter */
  blur: {
    /** Light blur - 8px */
    light: 'blur(8px)',
    /** Medium blur - 12px */
    medium: 'blur(12px)',
    /** Heavy blur - 16px */
    heavy: 'blur(16px)',
    /** Intense blur - 24px */
    intense: 'blur(24px)',
  },

  /** Shadow values for glass depth */
  shadow: {
    /** Subtle inset glow */
    inset: 'inset 0 1px 1px rgba(255, 255, 255, 0.05)',
    /** Soft outer shadow */
    soft: '0 4px 16px rgba(0, 0, 0, 0.15)',
    /** Elevated shadow */
    elevated: '0 8px 32px rgba(0, 0, 0, 0.25)',
    /** Glow effect */
    glow: '0 0 20px rgba(96, 165, 250, 0.15)',
  },

  /** Pre-composed glass styles */
  presets: {
    /** Header glass style */
    header: {
      background: 'rgba(15, 15, 18, 0.75)',
      backdropFilter: 'blur(16px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
    },
    /** Card glass style */
    card: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    /** Button glass style */
    button: {
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
    },
    /** Modal glass style */
    modal: {
      background: 'rgba(20, 20, 25, 0.9)',
      backdropFilter: 'blur(24px) saturate(150%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
  },
} as const;

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================

/**
 * Font Families
 *
 * Rationale:
 * - Playfair Display: Serif for headings, brand personality
 * - Space Grotesk: Sans-serif for body, legibility
 * - System fallbacks for performance
 */
export const fonts = {
  /** Playfair Display - Headings, titles */
  heading: "'Playfair Display', Georgia, serif",
  /** Space Grotesk - Body text, UI elements */
  body: "'Space Grotesk', system-ui, sans-serif",
  /** System monospace - Code, data (future use) */
  mono: "'SF Mono', 'Monaco', 'Menlo', monospace",
} as const;

/**
 * Font Size Scale
 *
 * Mobile-first responsive scale extracted from audit.
 * Use with viewport conditions for responsive typography.
 */
export const fontSize = {
  /** 11px - Micro text, badges, stats */
  xs: '11px',
  /** 12px - Small text, captions */
  sm: '12px',
  /** 14px - Base body text (increased from 13px for readability) */
  base: '14px',
  /** 15px - Comfortable reading text */
  md: '15px',
  /** 18px - Section headers, emphasized text */
  lg: '18px',
  /** 20px - Large headers */
  xl: '20px',
  /** 24px - Major section headers */
  '2xl': '24px',
  /** 28px - Mobile hero text */
  '3xl': '28px',
  /** 32px - Desktop section headers */
  '4xl': '32px',
  /** 48px - Desktop hero text */
  '5xl': '48px',

  // Semantic responsive tokens
  pageTitle: {
    /** 24px on mobile, 32px on tablet, 48px on desktop */
    mobile: '24px',
    tablet: '32px',
    desktop: '48px',
  },
  sectionTitle: {
    /** 18px on mobile, 20px on tablet, 24px on desktop */
    mobile: '18px',
    tablet: '20px',
    desktop: '24px',
  },
  cardTitle: {
    /** 16px on mobile, 18px on desktop */
    mobile: '16px',
    desktop: '18px',
  },
} as const;

/**
 * Font Weights
 */
export const fontWeight = {
  /** 400 - Regular body text */
  normal: '400',
  /** 500 - Medium emphasis */
  medium: '500',
  /** 600 - Semibold subheadings */
  semibold: '600',
  /** 700 - Bold headings */
  bold: '700',
} as const;

/**
 * Line Heights
 */
export const lineHeight = {
  /** 1 - Tight (stat values, single-line headings) */
  tight: '1',
  /** 1.25 - Snug (multi-line headings) */
  snug: '1.25',
  /** 1.5 - Normal (body text) */
  normal: '1.5',
  /** 1.6 - Relaxed (comfortable reading) */
  relaxed: '1.6',
} as const;

// ============================================================================
// BORDER RADIUS SCALE
// ============================================================================

/**
 * Border Radius Scale
 *
 * Standardized from audit to eliminate 6px, add 10px.
 */
export const radii = {
  /** 6px - Extra small (badges, small elements) */
  xs: '6px',
  /** 8px - Small elements, tight radius */
  sm: '8px',
  /** 10px - Standard buttons (most common) */
  md: '10px',
  /** 12px - Large buttons, cards */
  lg: '12px',
  /** 16px - Large cards, panels */
  xl: '16px',
  /** 20px - Extra large cards */
  '2xl': '20px',
  /** 24px - Hero sections */
  '3xl': '24px',
  /** 9999px - Fully rounded pills */
  pill: '9999px',
} as const;

// ============================================================================
// COMPONENT-SPECIFIC DIMENSIONS
// ============================================================================

/**
 * Touch Target Sizes
 *
 * Following WCAG 2.1 AAA guidelines and Apple/Google HIG recommendations.
 * Upgraded from 44px minimum to 48px for better accessibility.
 *
 * References:
 * - Apple HIG: 44pt minimum, 48pt recommended
 * - Material Design: 48dp minimum
 * - WCAG 2.1 AAA: 44x44 CSS pixels minimum
 */
export const touchTargets = {
  /** 44px - Legacy minimum (WCAG AA) - use for tight spaces only */
  legacy: '44px',
  /** 48px - New minimum accessible touch target (recommended) */
  minimum: '48px',
  /** 52px - Comfortable touch target */
  comfortable: '52px',
  /** 56px - Large touch target (primary actions, mobile header) */
  large: '56px',
  /** 64px - Extra large (FAB, prominent actions) */
  xl: '64px',
} as const;

/**
 * Mobile Header Dimensions
 */
export const mobileHeader = {
  /** 56px - Standard mobile navigation header height */
  height: '56px',
  /** 0 12px - Horizontal padding only */
  padding: '0 12px',
  /** 48px - Button size (touch-friendly, upgraded from 44px) */
  buttonSize: '48px',
  /** 10px - Button border radius */
  buttonRadius: radii.md,
  /** 100 - Z-index for sticky positioning */
  zIndex: 100,
  /** blur(12px) - Backdrop blur effect */
  backdropBlur: 'blur(12px)',
  /** rgba(15, 15, 18, 0.95) - Semi-transparent background */
  background: 'rgba(15, 15, 18, 0.95)',
} as const;

/**
 * Mobile Drawer Dimensions
 */
export const mobileDrawer = {
  /** 280px - Standard drawer width */
  width: '280px',
  /** 85vw - Maximum drawer width (viewport constraint) */
  maxWidth: '85vw',
  /** 999 - Backdrop z-index */
  backdropZIndex: 999,
  /** 1000 - Drawer panel z-index */
  panelZIndex: 1000,
  /** rgba(0, 0, 0, 0.6) - Backdrop overlay color */
  backdropColor: 'rgba(0, 0, 0, 0.6)',
  /** blur(4px) - Backdrop blur effect */
  backdropBlur: 'blur(4px)',
} as const;

// ============================================================================
// SAFE AREA INSETS
// ============================================================================

/**
 * Safe Area Insets
 *
 * CSS environment variables for handling device-specific safe areas:
 * - iPhone notch/Dynamic Island
 * - iPhone home indicator
 * - Android gesture navigation bar
 * - Android display cutouts
 *
 * Usage:
 * ```tsx
 * // In inline styles (needs fallback)
 * paddingTop: `max(${mobileTokens.spacing.lg}, env(safe-area-inset-top))`
 *
 * // Better: use the pre-composed values
 * paddingTop: mobileTokens.safeArea.top
 * paddingBottom: mobileTokens.safeArea.bottom
 * ```
 *
 * Note: These use CSS `env()` which requires the viewport meta tag:
 * <meta name="viewport" content="..., viewport-fit=cover">
 */
export const safeArea = {
  /** env(safe-area-inset-top, 0px) - Top safe area (notch, status bar) */
  top: 'env(safe-area-inset-top, 0px)',
  /** env(safe-area-inset-right, 0px) - Right safe area (landscape mode) */
  right: 'env(safe-area-inset-right, 0px)',
  /** env(safe-area-inset-bottom, 0px) - Bottom safe area (home indicator, gesture bar) */
  bottom: 'env(safe-area-inset-bottom, 0px)',
  /** env(safe-area-inset-left, 0px) - Left safe area (landscape mode) */
  left: 'env(safe-area-inset-left, 0px)',

  /**
   * Pre-composed padding values that combine safe area with minimum spacing.
   * These ensure content is never too close to edges even on devices without safe areas.
   */
  padding: {
    /** max(16px, env(safe-area-inset-top)) - Top with minimum 16px */
    top: 'max(16px, env(safe-area-inset-top, 0px))',
    /** max(16px, env(safe-area-inset-right)) - Right with minimum 16px */
    right: 'max(16px, env(safe-area-inset-right, 0px))',
    /** max(16px, env(safe-area-inset-bottom)) - Bottom with minimum 16px */
    bottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
    /** max(16px, env(safe-area-inset-left)) - Left with minimum 16px */
    left: 'max(16px, env(safe-area-inset-left, 0px))',
  },

  /**
   * Header-specific safe area that accounts for the header height.
   * Use for content that sits below a fixed header.
   */
  headerOffset: 'calc(56px + env(safe-area-inset-top, 0px))',

  /**
   * Bottom nav specific safe area with minimum height for the nav bar.
   * Use for content padding when bottom nav is present.
   */
  bottomNavOffset: 'calc(56px + env(safe-area-inset-bottom, 0px))',
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

/**
 * Z-Index Layers
 *
 * Rationale: Minimal z-index usage indicates clean stacking.
 * Only define when necessary for overlays.
 */
export const zIndex = {
  /** 0 - Base layer (default) */
  base: 0,
  /** 10 - Dropdowns, popovers */
  dropdown: 10,
  /** 100 - Sticky elements (mobile header) */
  sticky: 100,
  /** 999 - Modal backdrops */
  backdrop: 999,
  /** 1000 - Modal panels, drawers */
  modal: 1000,
  /** 2000 - Toast notifications */
  toast: 2000,
  /** 3000 - Tooltips (highest) */
  tooltip: 3000,
} as const;

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

/**
 * Animation Durations (from liquid-tenure theme)
 */
export const duration = {
  /** 150ms - Fast transitions (hover, focus) */
  fast: '150ms',
  /** 250ms - Standard transitions (most UI changes) */
  normal: '250ms',
  /** 400ms - Slow transitions (complex animations) */
  slow: '400ms',
  /** 600ms - Shape morphing */
  morph: '600ms',
} as const;

/**
 * Easing Functions
 */
export const easing = {
  /** cubic-bezier(0.4, 0, 0.2, 1) - Smooth flow */
  flow: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** cubic-bezier(0.4, 0, 0.6, 1) - Pulse effect */
  pulse: 'cubic-bezier(0.4, 0, 0.6, 1)',
  /** cubic-bezier(0.25, 0.1, 0.25, 1) - Slide in */
  slideIn: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  /** cubic-bezier(0.33, 1, 0.68, 1) - Fade up */
  fadeUp: 'cubic-bezier(0.33, 1, 0.68, 1)',
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

/**
 * Responsive Breakpoints
 *
 * Mobile-first approach. Use these with media queries or JS.
 */
export const breakpoints = {
  /** 768px - Mobile devices */
  mobile: 768,
  /** 1024px - Tablets */
  tablet: 1024,
  /** 1280px - Desktop */
  desktop: 1280,
  /** 1920px - Large desktop */
  wide: 1920,
} as const;

// ============================================================================
// COMBINED MOBILE TOKENS EXPORT
// ============================================================================

/**
 * Complete mobile design token system.
 *
 * Import this object to access all design tokens:
 * ```tsx
 * import { mobileTokens } from '@/theme/mobile-tokens';
 *
 * const buttonStyle = {
 *   padding: mobileTokens.spacing.md,
 *   borderRadius: mobileTokens.radii.md,
 *   minHeight: mobileTokens.touchTargets.minimum,
 * };
 * ```
 */
export const mobileTokens = {
  spacing,
  opacity,
  surfaces,
  borders,
  glass,
  fonts,
  fontSize,
  fontWeight,
  lineHeight,
  radii,
  touchTargets,
  mobileHeader,
  mobileDrawer,
  safeArea,
  zIndex,
  duration,
  easing,
  breakpoints,
} as const;

// TypeScript type for intellisense
export type MobileTokens = typeof mobileTokens;

export default mobileTokens;
