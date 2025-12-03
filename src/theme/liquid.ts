import { Theme } from './types';

// FRIENDLY - Liquid Design System
// Fluid, adaptive interfaces with organic animations
// Inspired by: water ripples, natural movement, morphing shapes
export const liquid: Theme = {
  name: 'friendly',
  colors: {
    primary: '#3B82F6', // Ocean blue
    secondary: '#06B6D4', // Cyan stream
    accent: '#8B5CF6', // Violet ripple
    background: '#F0F9FF', // Light sky
    surface: '#FFFFFF',
    text: '#0F172A', // Deep water
    textMuted: '#64748B', // Misty gray
    border: '#E2E8F0', // Foam white
  },
  fonts: {
    body: "'Plus Jakarta Sans', system-ui, sans-serif",
    heading: "'Plus Jakarta Sans', system-ui, sans-serif",
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
    sm: '12px',
    md: '20px',
    lg: '28px',
    organic: '50% 50% 40% 60% / 60% 40% 60% 40%', // fluid blob
  },
  shadows: {
    sm: '0 4px 12px rgba(59, 130, 246, 0.08)',
    md: '0 8px 24px rgba(59, 130, 246, 0.12)',
    lg: '0 16px 48px rgba(59, 130, 246, 0.16)',
  },
};

// Animation timing functions for fluid motion
export const liquidAnimations = {
  flow: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  ripple: 'cubic-bezier(0.4, 0, 0, 1)',
  morph: 'cubic-bezier(0.65, 0, 0.35, 1)',
};

// Gradient definitions
export const liquidGradients = {
  primary: `linear-gradient(135deg, ${liquid.colors.primary}, ${liquid.colors.secondary})`,
  accent: `linear-gradient(135deg, ${liquid.colors.secondary}, ${liquid.colors.accent})`,
  surface: `linear-gradient(180deg, ${liquid.colors.surface}, ${liquid.colors.background})`,
};

// CSS custom properties generator
export const liquidCSS = `
  :root {
    --friendly-primary: ${liquid.colors.primary};
    --friendly-secondary: ${liquid.colors.secondary};
    --friendly-accent: ${liquid.colors.accent};
    --friendly-bg: ${liquid.colors.background};
    --friendly-surface: ${liquid.colors.surface};
    --friendly-text: ${liquid.colors.text};
    --friendly-text-muted: ${liquid.colors.textMuted};
    --friendly-border: ${liquid.colors.border};
  }
`;
