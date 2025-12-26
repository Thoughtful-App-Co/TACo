/**
 * Pricing Module - Design Tokens
 * Centralized design system tokens for consistent styling
 */

export const tokens = {
  colors: {
    background: '#0F0F1A',
    backgroundLight: '#1A1A2E',
    surface: 'rgba(255, 255, 255, 0.03)',
    surfaceHover: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.15)',
    text: '#FAFAFA',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    textDim: 'rgba(255, 255, 255, 0.4)',
    accent: {
      coral: '#FF6B6B',
      yellow: '#FFE66D',
      teal: '#4ECDC4',
    },
    success: '#10B981',
  },
  fonts: {
    body: "'Geist', system-ui, sans-serif",
    brand: "'Shupp', 'Geist', system-ui, sans-serif",
    mono: "'Geist Mono', monospace",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },
} as const;
