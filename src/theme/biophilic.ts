import { Theme } from './types';

// NURTURE - Biomorphic Design System
// Inspired by: leaf venation, ocean depths, morning dew
export const biophilic: Theme = {
  name: 'nurture',
  colors: {
    primary: '#2D5A45',      // Deep forest
    secondary: '#4A7C6F',    // Moss
    accent: '#8FB8A8',       // Sage mist
    background: '#F7FAF8',   // Morning fog
    surface: '#FFFFFF',
    text: '#1A2F25',         // Deep earth
    textMuted: '#5A7268',    // Weathered stone
    border: '#D4E5DD',       // Lichen
  },
  fonts: {
    body: "'DM Sans', system-ui, sans-serif",
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
    sm: '8px',
    md: '16px',
    lg: '24px',
    organic: '60% 40% 50% 50% / 40% 50% 50% 60%', // blob shape
  },
  shadows: {
    sm: '0 2px 8px rgba(45, 90, 69, 0.08)',
    md: '0 8px 24px rgba(45, 90, 69, 0.12)',
    lg: '0 16px 48px rgba(45, 90, 69, 0.16)',
  },
};

// CSS custom properties generator
export const biophilicCSS = `
  :root {
    --nurture-primary: ${biophilic.colors.primary};
    --nurture-secondary: ${biophilic.colors.secondary};
    --nurture-accent: ${biophilic.colors.accent};
    --nurture-bg: ${biophilic.colors.background};
    --nurture-surface: ${biophilic.colors.surface};
    --nurture-text: ${biophilic.colors.text};
    --nurture-text-muted: ${biophilic.colors.textMuted};
    --nurture-border: ${biophilic.colors.border};
  }
`;
