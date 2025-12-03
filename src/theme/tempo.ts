import { Theme } from './types';

// TEMPO - Dark Mode Design System
// Clean, focused, minimal with precision typography
// Inspired by: Linear app, command line interfaces, IDE aesthetics
export const tempo: Theme = {
  name: 'tempo',
  colors: {
    primary: '#5E6AD2', // Linear purple
    secondary: '#6B7280', // Slate gray
    accent: '#F59E0B', // Amber for active/focus
    background: '#0D0D0D', // Near black
    surface: '#1A1A1A', // Elevated surface
    text: '#F9FAFB', // High contrast white
    textMuted: '#9CA3AF', // Muted gray
    border: '#2D2D2D', // Subtle border
  },
  fonts: {
    body: "'Inter', system-ui, sans-serif",
    heading: "'Inter', system-ui, sans-serif",
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
    md: '6px',
    lg: '8px',
    organic: '4px', // Linear keeps it rectangular
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 12px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
  },
};

// Status colors for task states
export const taskColors = {
  backlog: '#6B7280',
  todo: '#9CA3AF',
  inProgress: '#5E6AD2',
  done: '#10B981',
  cancelled: '#EF4444',
};

// CSS custom properties generator (defined after theme object)
export const getTempoCSS = () => `
  :root {
    --tempo-primary: ${tempo.colors.primary};
    --tempo-secondary: ${tempo.colors.secondary};
    --tempo-accent: ${tempo.colors.accent};
    --tempo-bg: ${tempo.colors.background};
    --tempo-surface: ${tempo.colors.surface};
    --tempo-text: ${tempo.colors.text};
    --tempo-text-muted: ${tempo.colors.textMuted};
    --tempo-border: ${tempo.colors.border};
  }
`;

export const tempoCSS = getTempoCSS();
