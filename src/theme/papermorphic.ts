import { Theme } from './types';

// LOL - Papermorphic Design System
// Subtle shadows, paper-like depth, tactile feel
// Inspired by: Material Design (reduced), paper crafts, skeuomorphism
export const papermorphic: Theme = {
  name: 'lol',
  colors: {
    primary: '#2196F3',      // Paper blue
    secondary: '#607D8B',    // Blue gray
    accent: '#FF9800',       // Orange marker
    background: '#FAFAFA',   // Light paper
    surface: '#FFFFFF',      // White card
    text: '#212121',         // Ink black
    textMuted: '#757575',    // Pencil gray
    border: '#E0E0E0',       // Fold line
  },
  fonts: {
    body: "'Roboto', system-ui, sans-serif",
    heading: "'Roboto', system-ui, sans-serif",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    organic: '8px', // Subtle paper curl
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
  },
};

// Elevation system (0-5 scale)
export const paperElevation = {
  0: 'none',
  1: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
  2: '0 3px 6px rgba(0, 0, 0, 0.09), 0 2px 4px rgba(0, 0, 0, 0.06)',
  3: '0 6px 10px rgba(0, 0, 0, 0.1), 0 3px 6px rgba(0, 0, 0, 0.06)',
  4: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
  5: '0 15px 25px rgba(0, 0, 0, 0.12), 0 5px 10px rgba(0, 0, 0, 0.04)',
};

// Category color chips
export const paperChips: Record<string, { bg: string; text: string }> = {
  chores: { bg: '#E3F2FD', text: '#1565C0' },
  kitchen: { bg: '#FFF3E0', text: '#E65100' },
  laundry: { bg: '#F3E5F5', text: '#7B1FA2' },
  outdoor: { bg: '#E8F5E9', text: '#2E7D32' },
  bathroom: { bg: '#E0F7FA', text: '#00838F' },
  general: { bg: '#ECEFF1', text: '#455A64' },
};

// CSS custom properties generator
export const papermorphicCSS = `
  :root {
    --lol-primary: ${papermorphic.colors.primary};
    --lol-secondary: ${papermorphic.colors.secondary};
    --lol-accent: ${papermorphic.colors.accent};
    --lol-bg: ${papermorphic.colors.background};
    --lol-surface: ${papermorphic.colors.surface};
    --lol-text: ${papermorphic.colors.text};
    --lol-text-muted: ${papermorphic.colors.textMuted};
    --lol-border: ${papermorphic.colors.border};
  }
`;
