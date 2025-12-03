import { Theme } from './types';

// MANIFEST - Brutalistic Design System
// Exposed structure, harsh typography, raw aesthetic
// Inspired by: Brutalist architecture, Bloomberg Businessweek, Craigslist
export const brutalist: Theme = {
  name: 'manifest',
  colors: {
    primary: '#000000', // Pure black
    secondary: '#1A1A1A', // Near black
    accent: '#FF0000', // Raw red
    background: '#FFFFFF', // Stark white
    surface: '#F5F5F5', // Concrete gray
    text: '#000000', // High contrast
    textMuted: '#666666', // Industrial gray
    border: '#000000', // Hard edge
  },
  fonts: {
    body: "'IBM Plex Mono', 'Courier New', monospace",
    heading: "'Arial Black', 'Helvetica Neue', sans-serif",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '32px',
    xl: '64px',
    xxl: '128px',
  },
  radii: {
    sm: '0px',
    md: '0px',
    lg: '0px',
    organic: '0px', // No curves - intentionally brutal
  },
  shadows: {
    sm: '4px 4px 0 #000000',
    md: '8px 8px 0 #000000',
    lg: '12px 12px 0 #000000',
  },
};

// Dramatic scale for typography hierarchy
export const brutalScale = {
  display: '72px',
  h1: '48px',
  h2: '32px',
  h3: '20px',
  body: '14px',
  caption: '11px',
};

// High-contrast accent colors
export const brutalAccents = {
  danger: '#FF0000',
  warning: '#FFFF00',
  success: '#00FF00',
  info: '#0000FF',
};

// CSS custom properties generator
export const brutalistCSS = `
  :root {
    --manifest-primary: ${brutalist.colors.primary};
    --manifest-secondary: ${brutalist.colors.secondary};
    --manifest-accent: ${brutalist.colors.accent};
    --manifest-bg: ${brutalist.colors.background};
    --manifest-surface: ${brutalist.colors.surface};
    --manifest-text: ${brutalist.colors.text};
    --manifest-text-muted: ${brutalist.colors.textMuted};
    --manifest-border: ${brutalist.colors.border};
  }
`;
