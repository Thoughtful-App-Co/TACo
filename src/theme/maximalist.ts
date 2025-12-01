import { Theme } from './types';

// AUGMENT - Maximalism Design System
// Rich patterns, visual density, abundant detail
// Inspired by: Baroque, Memphis Design, Versace
export const maximalist: Theme = {
  name: 'augment',
  colors: {
    primary: '#D946EF',      // Fuchsia 500
    secondary: '#8B5CF6',    // Violet 500
    accent: '#FBBF24',       // Amber 400
    background: '#121212',   // Near Black (Grayscale for pop)
    surface: '#1E1E1E',      // Dark Grey
    text: '#F3F4F6',         // Cool Grey 100
    textMuted: '#9CA3AF',    // Cool Grey 400
    border: '#374151',       // Cool Grey 700
  },
  riasec: {
    realistic: '#F97316',    // Neon Orange (Hot)
    investigative: '#8B5CF6', // Neon Purple (Cool)
    artistic: '#EC4899',     // Hot Pink (Hot)
    social: '#10B981',       // Emerald Green (Cool)
    enterprising: '#EAB308', // Electric Yellow (Hot)
    conventional: '#06B6D4', // Cyan (Cool)
  },
  fonts: {
    body: "'Space Grotesk', system-ui, sans-serif",
    heading: "'Playfair Display', Georgia, serif",
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
    organic: '30% 70% 70% 30% / 30% 30% 70% 70%', // decorative blob
  },
  shadows: {
    sm: '0 4px 12px rgba(147, 51, 234, 0.2), 0 2px 4px rgba(236, 72, 153, 0.1)',
    md: '0 8px 24px rgba(147, 51, 234, 0.3), 0 4px 8px rgba(236, 72, 153, 0.2)',
    lg: '0 16px 48px rgba(147, 51, 234, 0.4), 0 8px 16px rgba(236, 72, 153, 0.3)',
  },
};

// Extended color palette for patterns
export const maxPalette = {
  coral: '#FF6B6B',
  teal: '#4ECDC4',
  gold: '#FFD93D',
  mint: '#6BCB77',
  blush: '#FFB5B5',
  electric: '#00D4FF',
};

// Gradient definitions
export const maxGradients = {
  primary: `linear-gradient(135deg, ${maximalist.colors.primary}, ${maximalist.colors.secondary})`,
  sunset: `linear-gradient(135deg, #F97316, #EC4899)`, // Hot gradient
  aurora: `linear-gradient(135deg, #10B981, #06B6D4)`, // Cool gradient
  luxe: `linear-gradient(135deg, #EAB308, #F97316)`,
  vapor: `linear-gradient(135deg, #8B5CF6, #06B6D4)`, // Vaporwave
};

// Pattern SVG backgrounds
export const maxPatterns = {
  dots: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='%236366F1' fill-opacity='0.3'/%3E%3C/svg%3E")`,
  zigzag: `url("data:image/svg+xml,%3Csvg width='40' height='12' viewBox='0 0 40 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6 L10 0 L20 6 L30 0 L40 6 L40 12 L30 6 L20 12 L10 6 L0 12' fill='%23EC4899' fill-opacity='0.1'/%3E%3C/svg%3E")`,
};

// CSS custom properties generator
export const maximalistCSS = `
  :root {
    --augment-primary: ${maximalist.colors.primary};
    --augment-secondary: ${maximalist.colors.secondary};
    --augment-accent: ${maximalist.colors.accent};
    --augment-bg: ${maximalist.colors.background};
    --augment-surface: ${maximalist.colors.surface};
    --augment-text: ${maximalist.colors.text};
    --augment-text-muted: ${maximalist.colors.textMuted};
    --augment-border: ${maximalist.colors.border};
  }
`;
