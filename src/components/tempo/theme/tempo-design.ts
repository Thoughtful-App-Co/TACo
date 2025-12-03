/**
 * Tempo Design System
 * Bespoke, inline-style design tokens for Tempo app
 * No external CSS libraries - pure craftsmanship
 */

export const tempoDesign = {
  // Color palette - Dark mode optimized
  colors: {
    // Base colors
    background: '#0A0A0F',
    foreground: '#FAFAFA',

    // Card colors
    card: '#1A1A24',
    cardForeground: '#FAFAFA',
    cardBorder: '#2A2A3A',

    // Primary accent
    primary: '#5E6AD2',
    primaryForeground: '#FFFFFF',
    primaryHover: '#4E5AC2',

    // Secondary
    secondary: '#2A2A3A',
    secondaryForeground: '#A0A0B0',
    secondaryHover: '#3A3A4A',

    // Muted/subtle
    muted: '#1A1A24',
    mutedForeground: '#707080',

    // Accent
    accent: '#2A2A3A',
    accentForeground: '#FAFAFA',

    // Destructive
    destructive: '#DC2626',
    destructiveForeground: '#FFFFFF',

    // Border/input
    border: '#2A2A3A',
    input: '#2A2A3A',
    ring: '#5E6AD2',

    // Status colors
    amber: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },

    // Frog priority
    frog: '#10B981',
    frogBg: 'rgba(16, 185, 129, 0.1)',
  },

  // Typography
  typography: {
    fontFamily: "'Geist', 'DM Sans', system-ui, -apple-system, sans-serif",
    monoFamily: "'Geist Mono', 'Monaco', 'Menlo', monospace",
    sizes: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      md: '15px',
      lg: '16px',
      xl: '18px',
      '2xl': '24px',
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.7',
    },
  },

  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
  },

  // Border radius
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.4)',
  },

  // Transitions
  transitions: {
    fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Common component styles
export const tempoComponents = {
  // Container
  container: {
    'max-width': '1280px',
    margin: '0 auto',
    padding: '0 24px',
  },

  // Card
  card: {
    'border-radius': tempoDesign.radius.lg,
    border: `1px solid ${tempoDesign.colors.cardBorder}`,
    background: tempoDesign.colors.card,
    color: tempoDesign.colors.cardForeground,
    'box-shadow': tempoDesign.shadows.sm,
  },

  // Button base
  button: {
    display: 'inline-flex',
    'align-items': 'center',
    'justify-content': 'center',
    gap: '8px',
    'border-radius': tempoDesign.radius.md,
    'font-size': tempoDesign.typography.sizes.sm,
    'font-weight': tempoDesign.typography.weights.medium,
    'font-family': tempoDesign.typography.fontFamily,
    transition: `all ${tempoDesign.transitions.normal}`,
    cursor: 'pointer',
    border: 'none',
    'white-space': 'nowrap',
  },

  // Button variants
  buttonPrimary: {
    background: tempoDesign.colors.primary,
    color: tempoDesign.colors.primaryForeground,
    padding: '8px 12px',
    height: '36px',
  },

  buttonSecondary: {
    background: tempoDesign.colors.secondary,
    color: tempoDesign.colors.secondaryForeground,
    padding: '8px 12px',
    height: '36px',
  },

  buttonOutline: {
    background: 'transparent',
    color: tempoDesign.colors.foreground,
    border: `1px solid ${tempoDesign.colors.border}`,
    padding: '8px 12px',
    height: '36px',
  },

  buttonGhost: {
    background: 'transparent',
    color: tempoDesign.colors.foreground,
    padding: '8px 12px',
    height: '36px',
  },

  buttonIcon: {
    background: 'transparent',
    color: tempoDesign.colors.mutedForeground,
    padding: '8px',
    width: '36px',
    height: '36px',
    'border-radius': tempoDesign.radius.md,
  },

  // Input
  input: {
    display: 'flex',
    width: '100%',
    'border-radius': tempoDesign.radius.md,
    border: `1px solid ${tempoDesign.colors.input}`,
    background: tempoDesign.colors.background,
    padding: '8px 12px',
    'font-size': tempoDesign.typography.sizes.sm,
    'font-family': tempoDesign.typography.fontFamily,
    color: tempoDesign.colors.foreground,
    transition: `border-color ${tempoDesign.transitions.fast}`,
    outline: 'none',
  },

  // Textarea
  textarea: {
    display: 'flex',
    width: '100%',
    'min-height': '80px',
    'border-radius': tempoDesign.radius.md,
    border: `1px solid ${tempoDesign.colors.input}`,
    background: tempoDesign.colors.background,
    padding: '12px',
    'font-size': tempoDesign.typography.sizes.sm,
    'font-family': "'Geist Mono', 'Monaco', 'Menlo', monospace",
    color: tempoDesign.colors.foreground,
    'line-height': tempoDesign.typography.lineHeights.relaxed,
    resize: 'vertical',
    transition: `border-color ${tempoDesign.transitions.fast}`,
    outline: 'none',
  },

  // Badge
  badge: {
    display: 'inline-flex',
    'align-items': 'center',
    'border-radius': tempoDesign.radius.full,
    padding: '2px 10px',
    'font-size': tempoDesign.typography.sizes.xs,
    'font-weight': tempoDesign.typography.weights.medium,
    'font-family': tempoDesign.typography.fontFamily,
    'white-space': 'nowrap',
  },

  badgeDefault: {
    background: tempoDesign.colors.primary,
    color: tempoDesign.colors.primaryForeground,
  },

  badgeSecondary: {
    background: tempoDesign.colors.secondary,
    color: tempoDesign.colors.secondaryForeground,
  },

  badgeOutline: {
    background: 'transparent',
    color: tempoDesign.colors.foreground,
    border: `1px solid ${tempoDesign.colors.border}`,
  },
};
