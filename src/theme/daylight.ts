import { Theme } from './types';

// JUSTINCASE - Daylight Reading System
// Inspired by: e-ink, physical books, minimal eye strain
export const daylight: Theme = {
  name: 'justincase',
  colors: {
    primary: '#1C1C1C',      // Ink black
    secondary: '#4A4A4A',    // Soft charcoal
    accent: '#D4A574',       // Warm highlight (sepia marker)
    background: '#FAFAF7',   // Natural paper
    surface: '#FFFFFF',      // Bright paper
    text: '#2C2C2C',         // Reading ink
    textMuted: '#6B6B6B',    // Faded text
    border: '#E8E8E4',       // Paper edge
  },
  fonts: {
    body: "'Crimson Pro', Georgia, 'Times New Roman', serif",
    heading: "'DM Sans', system-ui, sans-serif",
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
    sm: '2px',
    md: '4px',
    lg: '8px',
    organic: '2px',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.04)',
    md: '0 4px 12px rgba(0, 0, 0, 0.06)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.08)',
  },
};

// Watercolor highlight colors
export const highlights = {
  yellow: 'rgba(255, 235, 120, 0.4)',
  blue: 'rgba(150, 200, 240, 0.35)',
  pink: 'rgba(255, 180, 180, 0.35)',
  green: 'rgba(180, 230, 180, 0.35)',
};

export const daylightCSS = `
  :root {
    --case-primary: ${daylight.colors.primary};
    --case-secondary: ${daylight.colors.secondary};
    --case-accent: ${daylight.colors.accent};
    --case-bg: ${daylight.colors.background};
    --case-surface: ${daylight.colors.surface};
    --case-text: ${daylight.colors.text};
    --case-text-muted: ${daylight.colors.textMuted};
    --case-border: ${daylight.colors.border};
  }
`;
