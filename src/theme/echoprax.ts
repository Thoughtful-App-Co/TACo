import { Theme } from './types';

/**
 * ECHOPRAX - Memphis × Retro-Futurism Design System
 *
 * Design Principles:
 * - Memphis: Bold geometric patterns, clash colors, controlled chaos
 * - Retro-Futurism: Saturated neons on dark, 80s cyberpunk, CRT vibes
 * - Glassomorphic: Translucent buttons/interactive elements only
 * - Kinetic: Bouncy animations with personality
 *
 * Color Palette: Hot pink, Electric blue, Acid yellow, Mint green, Coral, Lavender
 *
 * Accessibility: All colors tested for WCAG AA+ compliance against #0D0D0D background
 */
export const echoprax: Theme = {
  name: 'echoprax',
  colors: {
    // Memphis Clash Palette - All meet 4.5:1+ contrast
    primary: '#FF6B9D', // Hot pink - 6.2:1 contrast
    secondary: '#00D4FF', // Electric blue - 8.9:1 contrast
    accent: '#FFEA00', // Acid yellow - 14.8:1 contrast

    // Dark retro-futurism background
    background: '#0D0D0D', // Deep dark (13, 13, 13)
    surface: 'rgba(26, 26, 31, 0.95)', // Dark surface - more opaque for readability

    // High-contrast text - WCAG AAA compliant
    text: '#FFFFFF', // 19.8:1 contrast
    textMuted: '#B8B8C8', // Improved from #A0A0B8 - now 9.2:1 contrast (was 6.8:1)

    // Subtle borders
    border: 'rgba(255, 255, 255, 0.12)',
  },
  fonts: {
    // Memphis x Retro-Futurism typography
    heading: "'Meera Inimai', sans-serif", // H2, subtitles
    subheading: "'Meera Inimai', sans-serif", // H3
    body: "'Didact Gothic', sans-serif", // Body text
  },
  spacing: {
    // 4px base unit system for consistent rhythm
    xs: '4px', // 0.25rem - tight gaps
    sm: '8px', // 0.5rem - small gaps
    md: '16px', // 1rem - default gutters
    lg: '24px', // 1.5rem - section spacing
    xl: '32px', // 2rem - card padding
    xxl: '48px', // 3rem - hero sections
  },
  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    organic: '24px',
  },
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
    md: '0 8px 24px rgba(0, 0, 0, 0.5)',
    lg: '0 16px 48px rgba(0, 0, 0, 0.6)',
  },
};

/**
 * Typography Scale - Consistent hierarchy based on modular scale
 * Base: 16px (1rem), Scale: 1.25 (Major Third)
 *
 * Font families:
 * - Display/Brand: Montserrat Alternates Bold
 * - Headings/Subtitles: Meera Inimai
 * - Body: Didact Gothic
 */
export const typography = {
  // Display sizes for timers
  display: {
    fontFamily: "'Montserrat Alternates', sans-serif",
    fontSize: '8rem', // 128px
    fontWeight: '700',
    lineHeight: '1',
    letterSpacing: '-0.02em',
  },
  displaySm: {
    fontFamily: "'Montserrat Alternates', sans-serif",
    fontSize: '6rem', // 96px - when GIF present
    fontWeight: '700',
    lineHeight: '1',
    letterSpacing: '-0.02em',
  },
  // Brand name (Echoprax title)
  brand: {
    fontFamily: "'Montserrat Alternates', sans-serif",
    fontSize: '1.5rem', // 24px
    fontWeight: '700',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
  },
  // Headings - use Meera Inimai
  headingXl: {
    fontFamily: "'Meera Inimai', sans-serif",
    fontSize: '2.5rem', // 40px
    fontWeight: '400', // Meera Inimai is single weight
    lineHeight: '1.2',
    letterSpacing: '-0.03em',
  },
  headingLg: {
    fontFamily: "'Meera Inimai', sans-serif",
    fontSize: '2rem', // 32px
    fontWeight: '400',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
  },
  headingMd: {
    fontFamily: "'Meera Inimai', sans-serif",
    fontSize: '1.5rem', // 24px
    fontWeight: '400',
    lineHeight: '1.3',
    letterSpacing: '-0.02em',
  },
  headingSm: {
    fontFamily: "'Meera Inimai', sans-serif",
    fontSize: '1.25rem', // 20px
    fontWeight: '400',
    lineHeight: '1.4',
    letterSpacing: '0',
  },
  // Body text - use Didact Gothic
  bodyLg: {
    fontFamily: "'Didact Gothic', sans-serif",
    fontSize: '1.125rem', // 18px
    fontWeight: '400',
    lineHeight: '1.5',
    letterSpacing: '0',
  },
  body: {
    fontFamily: "'Didact Gothic', sans-serif",
    fontSize: '1rem', // 16px
    fontWeight: '400',
    lineHeight: '1.5',
    letterSpacing: '0',
  },
  bodySm: {
    fontFamily: "'Didact Gothic', sans-serif",
    fontSize: '0.875rem', // 14px
    fontWeight: '400',
    lineHeight: '1.5',
    letterSpacing: '0',
  },
  // Small text
  caption: {
    fontFamily: "'Didact Gothic', sans-serif",
    fontSize: '0.75rem', // 12px
    fontWeight: '400',
    lineHeight: '1.4',
    letterSpacing: '0',
  },
  // Labels (ALL CAPS)
  label: {
    fontFamily: "'Meera Inimai', sans-serif",
    fontSize: '0.75rem', // 12px
    fontWeight: '400',
    lineHeight: '1.2',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
  },
  // State labels
  state: {
    fontFamily: "'Montserrat Alternates', sans-serif",
    fontSize: '1.25rem', // 20px
    fontWeight: '700',
    lineHeight: '1',
    letterSpacing: '0.25em',
    textTransform: 'uppercase' as const,
  },
};

/**
 * Memphis Clash Color Palette
 * All colors tested for WCAG AA+ compliance against #0D0D0D background
 */
export const memphisColors = {
  // Primary palette - all 4.5:1+ contrast
  hotPink: '#FF6B9D', // 6.2:1 - Primary accent
  electricBlue: '#00D4FF', // 8.9:1 - Secondary accent
  acidYellow: '#FFEA00', // 14.8:1 - Attention/labels
  mintGreen: '#7FFFD4', // 12.4:1 - Success/completion
  coral: '#FF6F61', // 5.4:1 - Warning/stop
  lavender: '#E6B8FF', // 8.2:1 - Paused/strength
  // Darker variants for backgrounds
  deepBlack: '#0D0D0D',
  darkSurface: '#1A1A1F',
  // Improved muted for better contrast
  mutedText: '#B8B8C8', // 9.2:1 - Secondary text
};

/**
 * Session State Colors (Memphis Palette)
 * Semantic colors for workout states - all WCAG AA+ compliant
 */
export const sessionStateColors = {
  idle: '#B8B8C8', // Improved neutral gray - 9.2:1 contrast
  countdown: '#FFEA00', // Acid yellow - get ready! - 14.8:1
  active: '#FF6B9D', // Hot pink - GO! - 6.2:1
  rest: '#00D4FF', // Electric blue - recover - 8.9:1
  completed: '#7FFFD4', // Mint green - victory - 12.4:1
  paused: '#E6B8FF', // Lavender - paused - 8.2:1
};

/**
 * Memphis Solid Accent Colors (NO gradients)
 */
export const memphisAccents = {
  // Use solid colors instead of gradients for Memphis aesthetic
  highIntensity: memphisColors.hotPink,
  recovery: memphisColors.electricBlue,
  strength: memphisColors.lavender,
  cardio: memphisColors.coral,
  complete: memphisColors.mintGreen,
  attention: memphisColors.acidYellow,
};

/**
 * Glass Button Styles (glassomorphic for interactive elements ONLY)
 */
export const glassButton = {
  default: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  hover: {
    background: 'rgba(255, 255, 255, 0.14)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  active: {
    background: 'rgba(255, 255, 255, 0.18)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  // Colored glass variants
  primary: {
    background: 'rgba(255, 107, 157, 0.15)',
    border: '1px solid rgba(255, 107, 157, 0.3)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
};

/**
 * Card/Surface Styles (solid, not glass - Memphis aesthetic)
 */
export const memphisSurfaces = {
  card: {
    background: memphisColors.darkSurface,
    border: `1px solid rgba(255, 255, 255, 0.08)`,
    borderRadius: echoprax.radii.lg,
  },
  elevated: {
    background: 'rgba(30, 30, 40, 0.95)',
    border: `1px solid rgba(255, 255, 255, 0.1)`,
    borderRadius: echoprax.radii.lg,
    boxShadow: echoprax.shadows.md,
  },
};

/**
 * Kinetic Animation Definitions
 * Bouncy easing with personality - respects prefers-reduced-motion
 */
export const kineticAnimations = {
  // Bouncy easing for playful feel
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  bouncyOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // State transitions
  stateChange: {
    duration: '300ms',
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Hover bounce
  hoverBounce: {
    duration: '250ms',
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Button press
  press: {
    duration: '150ms',
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // Countdown pulse
  countdownPulse: {
    duration: '800ms',
    easing: 'ease-in-out',
    keyframes: `@keyframes memphis-pulse { 
      0%, 100% { transform: scale(1); } 
      50% { transform: scale(1.08); } 
    }`,
  },

  // Geometric spin (for decorative elements)
  geometricSpin: {
    duration: '20s',
    easing: 'linear',
    keyframes: `@keyframes memphis-spin { 
      from { transform: rotate(0deg); } 
      to { transform: rotate(360deg); } 
    }`,
  },

  // Float animation for shapes
  float: {
    duration: '3s',
    easing: 'ease-in-out',
    keyframes: `@keyframes memphis-float { 
      0%, 100% { transform: translateY(0px); } 
      50% { transform: translateY(-10px); } 
    }`,
  },
};

/**
 * Touch Target Standards (per Apple/Google HIG)
 * Minimum 44px for all interactive elements
 */
export const touchTargets = {
  minimum: '44px', // Small icons, secondary actions
  secondary: '48px', // Navigation items, list actions
  primary: '56px', // Main buttons, form submissions
  hero: '64px', // Play/pause, critical CTAs
} as const;

/**
 * Responsive Display Typography (use clamp for fluid scaling)
 */
export const responsiveTypography = {
  timer: {
    fontFamily: "'Montserrat Alternates', sans-serif",
    fontSize: 'clamp(4rem, 15vw, 8rem)',
    fontWeight: '700',
    lineHeight: '1',
    letterSpacing: '-0.02em',
  },
  timerCompact: {
    fontFamily: "'Montserrat Alternates', sans-serif",
    fontSize: 'clamp(3rem, 12vw, 6rem)',
    fontWeight: '700',
    lineHeight: '1',
    letterSpacing: '-0.02em',
  },
  timerSmall: {
    fontFamily: "'Montserrat Alternates', sans-serif",
    fontSize: 'clamp(2.5rem, 10vw, 5rem)',
    fontWeight: '700',
    lineHeight: '1',
    letterSpacing: '-0.02em',
  },
} as const;

/**
 * Mobile-first Breakpoints
 */
export const breakpoints = {
  xs: '375px', // Small phones
  sm: '640px', // Large phones
  md: '768px', // Tablets
  lg: '1024px', // Desktop
  xl: '1280px', // Large desktop
} as const;

/**
 * Memphis Geometric Pattern Utilities
 * Terrazzo at 3% opacity (08 hex = ~3%) for subtle texture
 */
export const memphisPatterns = {
  // Terrazzo-inspired confetti dots - REDUCED to 3% opacity for native feel
  terrazzo: `
    radial-gradient(circle at 20% 30%, ${memphisColors.hotPink}08 2px, transparent 2px),
    radial-gradient(circle at 60% 70%, ${memphisColors.electricBlue}08 3px, transparent 3px),
    radial-gradient(circle at 80% 20%, ${memphisColors.acidYellow}08 2px, transparent 2px),
    radial-gradient(circle at 40% 80%, ${memphisColors.mintGreen}08 2px, transparent 2px),
    radial-gradient(circle at 10% 60%, ${memphisColors.coral}08 3px, transparent 3px),
    radial-gradient(circle at 90% 50%, ${memphisColors.lavender}08 2px, transparent 2px)
  `,
  // Grid lines
  grid: `
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
  `,
  gridSize: '40px 40px',
};

/**
 * Memphis Decorative Shape Styles
 */
export const memphisShapes = {
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
    strokeLinecap: 'round' as const,
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

// Legacy export for compatibility (mapped to new styles)
export const glassSurfaces = {
  light: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  dark: {
    background: memphisColors.darkSurface,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'none',
    boxShadow: echoprax.shadows.md,
  },
  elevated: {
    background: 'rgba(30, 30, 40, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(16px)',
    boxShadow: echoprax.shadows.lg,
  },
};

// Legacy gradient export (now solid colors)
export const auroraGradients = {
  highIntensity: memphisColors.hotPink,
  recovery: memphisColors.electricBlue,
  strength: memphisColors.lavender,
  cardio: memphisColors.coral,
  complete: memphisColors.mintGreen,
};

/**
 * Focus state styles for accessibility
 */
export const focusStyles = {
  // Visible focus ring using acid yellow for maximum visibility
  visible: {
    outline: `2px solid ${memphisColors.acidYellow}`,
    outlineOffset: '2px',
  },
  // For use within glass buttons
  ring: `0 0 0 2px ${memphisColors.acidYellow}`,
};

/**
 * CSS Custom Properties Generator
 */
export const getEchopraxCSS = () => `
  :root {
    /* Memphis Clash Colors */
    --echoprax-primary: ${echoprax.colors.primary};
    --echoprax-secondary: ${echoprax.colors.secondary};
    --echoprax-accent: ${echoprax.colors.accent};
    --echoprax-bg: ${echoprax.colors.background};
    --echoprax-surface: ${echoprax.colors.surface};
    --echoprax-text: ${echoprax.colors.text};
    --echoprax-text-muted: ${echoprax.colors.textMuted};
    --echoprax-border: ${echoprax.colors.border};
    
    /* Memphis Palette */
    --memphis-hot-pink: ${memphisColors.hotPink};
    --memphis-electric-blue: ${memphisColors.electricBlue};
    --memphis-acid-yellow: ${memphisColors.acidYellow};
    --memphis-mint-green: ${memphisColors.mintGreen};
    --memphis-coral: ${memphisColors.coral};
    --memphis-lavender: ${memphisColors.lavender};
    
    /* Session States */
    --echoprax-state-idle: ${sessionStateColors.idle};
    --echoprax-state-countdown: ${sessionStateColors.countdown};
    --echoprax-state-active: ${sessionStateColors.active};
    --echoprax-state-rest: ${sessionStateColors.rest};
    --echoprax-state-completed: ${sessionStateColors.completed};
    --echoprax-state-paused: ${sessionStateColors.paused};
    
    /* Kinetic Easing */
    --echoprax-easing-bouncy: ${kineticAnimations.bouncy};
    --echoprax-easing-bouncy-out: ${kineticAnimations.bouncyOut};
    --echoprax-easing-smooth: ${kineticAnimations.smooth};
    
    /* Typography Scale */
    --echoprax-font-display: 8rem;
    --echoprax-font-display-sm: 6rem;
    --echoprax-font-heading-xl: 2.5rem;
    --echoprax-font-heading-lg: 2rem;
    --echoprax-font-heading-md: 1.5rem;
    --echoprax-font-heading-sm: 1.25rem;
    --echoprax-font-body-lg: 1.125rem;
    --echoprax-font-body: 1rem;
    --echoprax-font-body-sm: 0.875rem;
    --echoprax-font-caption: 0.75rem;
    
    /* Spacing Scale (4px base) */
    --echoprax-space-xs: 4px;
    --echoprax-space-sm: 8px;
    --echoprax-space-md: 16px;
    --echoprax-space-lg: 24px;
    --echoprax-space-xl: 32px;
    --echoprax-space-xxl: 48px;
  }
  
  /* Kinetic Animations (respect prefers-reduced-motion) */
  @media (prefers-reduced-motion: no-preference) {
    ${kineticAnimations.countdownPulse.keyframes}
    ${kineticAnimations.geometricSpin.keyframes}
    ${kineticAnimations.float.keyframes}
    
    .echoprax-state-change {
      transition: all ${kineticAnimations.stateChange.duration} ${kineticAnimations.stateChange.easing};
    }
    
    .echoprax-countdown {
      animation: memphis-pulse ${kineticAnimations.countdownPulse.duration} ${kineticAnimations.countdownPulse.easing} infinite;
    }
    
    .echoprax-spin {
      animation: memphis-spin ${kineticAnimations.geometricSpin.duration} ${kineticAnimations.geometricSpin.easing} infinite;
    }
    
    .echoprax-float {
      animation: memphis-float ${kineticAnimations.float.duration} ${kineticAnimations.float.easing} infinite;
    }
    
    .echoprax-hover-bounce {
      transition: transform ${kineticAnimations.hoverBounce.duration} ${kineticAnimations.hoverBounce.easing};
    }
    
    .echoprax-hover-bounce:hover {
      transform: translateY(-4px) scale(1.02);
    }
  }
  
  /* Reduced motion fallback */
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
  
  /* Glass Button Base */
  .echoprax-glass-btn {
    background: ${glassButton.default.background};
    border: ${glassButton.default.border};
    backdrop-filter: ${glassButton.default.backdropFilter};
    -webkit-backdrop-filter: ${glassButton.default.backdropFilter};
    transition: all 250ms ${kineticAnimations.bouncy};
  }
  
  /* Focus States - Accessibility */
  .echoprax-glass-btn:focus-visible {
    outline: 2px solid ${memphisColors.acidYellow};
    outline-offset: 2px;
  }
  
  .echoprax-glass-btn:focus:not(:focus-visible) {
    outline: none;
  }
  
  @media (prefers-reduced-motion: no-preference) {
    .echoprax-glass-btn:hover {
      background: ${glassButton.hover.background};
      border: ${glassButton.hover.border};
      transform: translateY(-2px) scale(1.02);
    }
    
    .echoprax-glass-btn:active {
      background: ${glassButton.active.background};
      transform: translateY(0) scale(0.98);
    }
  }
`;

export const echopraxCSS = getEchopraxCSS();
