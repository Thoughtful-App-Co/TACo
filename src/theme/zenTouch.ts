import { Theme } from './types';

// FRIENDLY - Modern Blue Gradient System
// "IT SUCKS, MAKE IT POP!" Philosophy Applied
// Duotone (Blue + Cyan Gradient), Modern Glass, Fitts Optimized
export const zenTouch: Theme = {
  name: 'modernBlueGradient',
  colors: {
    // Duotone Gradient Pair
    primary: '#3B82F6',      // Electric Blue
    secondary: '#06B6D4',    // Cyan (Creates gradient with primary)
    
    // Modern Dark Foundation (Richer, deeper)
    accent: '#818CF8',       // Soft Indigo (Premium feel)
    background: '#030712',   // Near Black with blue undertone
    surface: '#0F172A',      // Elevated surface
    text: '#F8FAFC',         // Pure white
    textMuted: '#64748B',    // Balanced gray
    border: '#1E293B',       // Subtle, modern borders
  },
  fonts: {
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
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
    sm: '8px',    // Softer, modern
    md: '12px',
    lg: '16px',
    organic: '20px', // Pill shapes
  },
  shadows: {
    sm: '0 2px 8px rgba(59, 130, 246, 0.1)',
    md: '0 8px 32px rgba(59, 130, 246, 0.15)',
    lg: '0 24px 64px rgba(59, 130, 246, 0.2)',
  },
};

// Extended Design Tokens (Modern Enhancements)
export const modernTokens = {
  // Gradient definitions
  gradients: {
    primary: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
    primaryReverse: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    surface: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
    glow: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
    mesh: `
      radial-gradient(at 40% 20%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
      radial-gradient(at 80% 0%, rgba(6, 182, 212, 0.1) 0px, transparent 50%),
      radial-gradient(at 0% 50%, rgba(129, 140, 248, 0.1) 0px, transparent 50%)
    `,
  },
  
  // Glass effect
  glass: {
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px) saturate(180%)',
  },
  
  // Glow effects
  glow: {
    primary: '0 0 20px rgba(59, 130, 246, 0.5)',
    secondary: '0 0 20px rgba(6, 182, 212, 0.5)',
    text: '0 0 40px rgba(59, 130, 246, 0.3)',
  },
  
  // Typography scale (modular scale 1.25)
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    '4xl': '2.5rem',  // 40px
    '5xl': '3rem',    // 48px
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  lineHeight: {
    tight: '1.1',
    snug: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
  
  // Transitions
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

// Animation keyframes (for CSS injection)
export const keyframes = `
  @keyframes pulse-glow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

export const zenAnimations = {
  fade: 'cubic-bezier(0.4, 0, 0.2, 1)',
  slide: 'cubic-bezier(0.16, 1, 0.3, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};
