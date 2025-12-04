import { Theme } from './types';

// =============================================================================
// PAPER TRAIL - CONSTRUCTION PAPER POP DESIGN SYSTEM
// =============================================================================
//
// BAM! A bold, tactile news experience that feels like you could peel it
// off the screen. High contrast. Thick lines. Electric yellow that POPS.
//
// Visual Philosophy:
// - Construction paper tactile feel - layered, liftable, REAL
// - Electric yellow accent that demands attention (caution tape energy)
// - Thick bold borders - no wimpy 1px lines here
// - Sharp edges, zero radius - modernist precision
// - High contrast black/white with yellow punctuation
//
// Inspired by: Construction paper, caution tape, Barbara Kruger,
//              Bauhaus posters, newspaper headlines, pop art

export const papertrail: Theme = {
  name: 'papertrail',
  colors: {
    primary: '#000000', // Pure black
    secondary: '#1A1A1A', // Near black
    accent: '#FFE500', // ELECTRIC YELLOW - the star of the show
    background: '#F5F5F0', // Warm paper white
    surface: '#FFFFFF', // Clean white
    text: '#000000', // Black ink
    textMuted: '#525252', // Dark gray (high contrast)
    border: '#000000', // BLACK borders - thick and bold
  },
  fonts: {
    body: "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
    heading: "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '40px',
    xxl: '64px',
  },
  radii: {
    sm: '0px', // SHARP. NO. RADIUS.
    md: '0px', // Precision cuts
    lg: '0px', // Like scissors through paper
    organic: '0px', // Even "organic" is sharp here
  },
  shadows: {
    // Construction paper layered shadows - offset, no blur
    sm: '2px 2px 0 rgba(0, 0, 0, 0.15)',
    md: '4px 4px 0 rgba(0, 0, 0, 0.2)',
    lg: '6px 6px 0 #000000', // Hard black shadow - BOLD
  },
};

// =============================================================================
// ELECTRIC YELLOW SCALE - THE HERO COLOR
// =============================================================================
// This yellow is LOUD. It's caution tape. It's a highlighter. It's BAM!

export const yellowScale = {
  50: '#FFFEF0', // Whisper
  100: '#FFFCD6', // Hint
  200: '#FFF8A3', // Glow
  300: '#FFF170', // Bright
  400: '#FFEA3D', // Hot
  500: '#FFE500', // ELECTRIC - Primary accent
  600: '#E6CE00', // Strong
  700: '#CCB700', // Deep
  800: '#998A00', // Muted
  900: '#665C00', // Shadow
};

// =============================================================================
// HIGH CONTRAST GRAYSCALE
// =============================================================================

export const inkScale = {
  white: '#FFFFFF',
  paper: '#F5F5F0', // Warm white
  light: '#E5E5E0', // Light gray
  mid: '#A3A3A3', // Mid gray
  dark: '#525252', // Dark gray
  ink: '#1A1A1A', // Near black
  black: '#000000', // Pure black
};

// =============================================================================
// DIFF/CHANGELOG COLORS - Bold and clear
// =============================================================================

export const diffColors = {
  added: {
    bg: '#DCFCE7',
    border: '#000000',
    text: '#166534',
    accent: '#22C55E',
  },
  removed: {
    bg: '#FEE2E2',
    border: '#000000',
    text: '#991B1B',
    accent: '#EF4444',
  },
  changed: {
    bg: yellowScale[200],
    border: '#000000',
    text: '#000000',
    accent: yellowScale[500],
  },
  context: {
    bg: inkScale.paper,
    border: inkScale.mid,
    text: inkScale.dark,
    accent: inkScale.mid,
  },
};

// =============================================================================
// KINETIC MOTION TOKENS - Snappy and energetic
// =============================================================================

export const motionTokens = {
  easing: {
    enter: 'cubic-bezier(0.0, 0.0, 0.2, 1)', // Smooth decel
    exit: 'cubic-bezier(0.4, 0.0, 1, 1)', // Quick accel
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Standard
    sharp: 'cubic-bezier(0.0, 0.0, 0.0, 1)', // SNAP - instant feel
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Playful overshoot
  },
  duration: {
    instant: '50ms', // Blink
    fast: '150ms', // Snappy
    normal: '250ms', // Standard
    slow: '400ms', // Deliberate
    emphasis: '600ms', // For drama
  },
  stagger: {
    char: '15ms',
    word: '40ms',
    line: '80ms',
    section: '150ms',
  },
};

// =============================================================================
// TYPOGRAPHY - Bold and punchy
// =============================================================================

export const typeScale = {
  // Headlines - BIG AND BOLD
  banner: {
    size: '56px',
    weight: 900,
    lineHeight: 1.0,
    letterSpacing: '-0.03em',
    textTransform: 'uppercase' as const,
  },
  headline: {
    size: '36px',
    weight: 800,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },
  subheadline: {
    size: '24px',
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
  },
  // Body
  lead: {
    size: '20px',
    weight: 500,
    lineHeight: 1.5,
    letterSpacing: '0',
  },
  body: {
    size: '16px',
    weight: 400,
    lineHeight: 1.6,
    letterSpacing: '0',
  },
  // Meta
  label: {
    size: '13px',
    weight: 700,
    lineHeight: 1.3,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  caption: {
    size: '12px',
    weight: 500,
    lineHeight: 1.4,
    letterSpacing: '0.02em',
  },
  timestamp: {
    size: '11px',
    weight: 600,
    lineHeight: 1.3,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  },
};

// =============================================================================
// GRAPH TOKENS - For entity visualization
// =============================================================================

export const graphTokens = {
  node: {
    person: { fill: yellowScale[500], stroke: '#000000' },
    organization: { fill: '#A78BFA', stroke: '#000000' },
    topic: { fill: '#FFFFFF', stroke: '#000000' },
    location: { fill: '#6EE7B7', stroke: '#000000' },
    event: { fill: inkScale.light, stroke: '#000000' },
    source: { fill: inkScale.mid, stroke: '#000000' },
    correction: { fill: yellowScale[500], stroke: '#000000' },
  } as Record<string, { fill: string; stroke: string }>,
  edge: {
    strong: { stroke: '#000000', width: 3 },
    normal: { stroke: '#000000', width: 2 },
    weak: { stroke: inkScale.mid, width: 1 },
    correction: { stroke: yellowScale[500], width: 3, dashArray: '8,4' },
  },
};

// =============================================================================
// CSS CUSTOM PROPERTIES
// =============================================================================

export const papertrailCSS = `
  :root {
    /* Core palette */
    --pt-primary: ${papertrail.colors.primary};
    --pt-secondary: ${papertrail.colors.secondary};
    --pt-accent: ${papertrail.colors.accent};
    --pt-bg: ${papertrail.colors.background};
    --pt-surface: ${papertrail.colors.surface};
    --pt-text: ${papertrail.colors.text};
    --pt-text-muted: ${papertrail.colors.textMuted};
    --pt-border: ${papertrail.colors.border};
    
    /* Yellow scale */
    --pt-yellow-50: ${yellowScale[50]};
    --pt-yellow-100: ${yellowScale[100]};
    --pt-yellow-200: ${yellowScale[200]};
    --pt-yellow-300: ${yellowScale[300]};
    --pt-yellow-400: ${yellowScale[400]};
    --pt-yellow-500: ${yellowScale[500]};
    --pt-yellow-600: ${yellowScale[600]};
    --pt-yellow-700: ${yellowScale[700]};
    --pt-yellow-800: ${yellowScale[800]};
    --pt-yellow-900: ${yellowScale[900]};
    
    /* Ink scale */
    --pt-ink-white: ${inkScale.white};
    --pt-ink-paper: ${inkScale.paper};
    --pt-ink-light: ${inkScale.light};
    --pt-ink-mid: ${inkScale.mid};
    --pt-ink-dark: ${inkScale.dark};
    --pt-ink-ink: ${inkScale.ink};
    --pt-ink-black: ${inkScale.black};
    
    /* Motion */
    --pt-ease-enter: ${motionTokens.easing.enter};
    --pt-ease-exit: ${motionTokens.easing.exit};
    --pt-ease-standard: ${motionTokens.easing.standard};
    --pt-ease-sharp: ${motionTokens.easing.sharp};
    --pt-ease-bounce: ${motionTokens.easing.bounce};
    --pt-duration-instant: ${motionTokens.duration.instant};
    --pt-duration-fast: ${motionTokens.duration.fast};
    --pt-duration-normal: ${motionTokens.duration.normal};
    --pt-duration-slow: ${motionTokens.duration.slow};
    
    /* Typography */
    --pt-font-body: ${papertrail.fonts.body};
    --pt-font-heading: ${papertrail.fonts.heading};
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    :root {
      --pt-duration-instant: 0ms;
      --pt-duration-fast: 0ms;
      --pt-duration-normal: 0ms;
      --pt-duration-slow: 0ms;
    }
  }
`;

// =============================================================================
// KINETIC ANIMATIONS - BAM!
// =============================================================================

export const kineticAnimations = `
  /* Slide in with punch */
  @keyframes pt-slam-in {
    0% {
      opacity: 0;
      transform: translateY(-20px) scale(1.1);
    }
    70% {
      transform: translateY(2px) scale(0.98);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  /* Pop in */
  @keyframes pt-pop {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  /* Shake for attention */
  @keyframes pt-shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-4px); }
    40% { transform: translateX(4px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
  
  /* Yellow pulse */
  @keyframes pt-pulse-yellow {
    0%, 100% {
      box-shadow: 0 0 0 0 ${yellowScale[500]}40;
    }
    50% {
      box-shadow: 0 0 0 8px ${yellowScale[500]}00;
    }
  }
  
  /* Strikethrough animation */
  @keyframes pt-strike {
    from { width: 0; }
    to { width: 100%; }
  }
  
  /* Tape peel effect */
  @keyframes pt-peel {
    0% {
      transform: perspective(400px) rotateX(0deg);
      box-shadow: 4px 4px 0 #000;
    }
    100% {
      transform: perspective(400px) rotateX(-5deg);
      box-shadow: 4px 8px 0 #000;
    }
  }
`;

// =============================================================================
// UTILITY: Construction paper "lifted" effect
// =============================================================================

export const liftedStyle = {
  border: '3px solid #000000',
  boxShadow: '4px 4px 0 #000000',
  background: '#FFFFFF',
};

export const liftedYellowStyle = {
  border: '3px solid #000000',
  boxShadow: '4px 4px 0 #000000',
  background: yellowScale[500],
  color: '#000000',
};

// =============================================================================
// UTILITY: Accent bar styles
// =============================================================================

export const accentBar = {
  height: '6px',
  background: yellowScale[500],
  border: 'none',
};

export const thickBorder = '3px solid #000000';
export const thinBorder = '2px solid #000000';
