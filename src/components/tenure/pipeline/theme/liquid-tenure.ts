/**
 * Liquid-Tenure Theme - Blends Maximalist base with Liquid motion design
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { maximalist, maxGradients } from '../../../../theme/maximalist';
import { liquid, liquidAnimations, liquidGradients } from '../../../../theme/liquid';
import { semanticColors } from '../../../../theme/semantic-colors';

// ============================================================================
// LIQUID ANIMATIONS
// ============================================================================

export const pipelineAnimations = {
  // Core liquid animations
  ...liquidAnimations,

  // Pipeline-specific
  pulse: 'cubic-bezier(0.4, 0, 0.6, 1)',
  slideIn: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  fadeUp: 'cubic-bezier(0.33, 1, 0.68, 1)',

  // Durations
  fast: '150ms',
  normal: '250ms',
  slow: '400ms',
  morph: '600ms',
};

// ============================================================================
// STATUS COLORS WITH LIQUID GRADIENTS
// ============================================================================

export const statusColors = {
  saved: {
    bg: 'rgba(100, 116, 139, 0.15)',
    border: 'rgba(100, 116, 139, 0.3)',
    text: '#94A3B8',
    gradient: 'linear-gradient(135deg, #64748B, #475569)',
    glow: '0 0 20px rgba(100, 116, 139, 0.3)',
  },
  applied: {
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.3)',
    text: '#60A5FA',
    gradient: liquidGradients.primary,
    glow: '0 0 20px rgba(59, 130, 246, 0.4)',
  },
  screening: {
    bg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.3)',
    text: '#22D3EE',
    gradient: 'linear-gradient(135deg, #06B6D4, #0891B2)',
    glow: '0 0 20px rgba(6, 182, 212, 0.4)',
  },
  interviewing: {
    bg: 'rgba(139, 92, 246, 0.15)',
    border: 'rgba(139, 92, 246, 0.3)',
    text: '#A78BFA',
    gradient: maxGradients.vapor,
    glow: '0 0 20px rgba(139, 92, 246, 0.4)',
  },
  offered: {
    bg: 'rgba(234, 179, 8, 0.15)',
    border: 'rgba(234, 179, 8, 0.3)',
    text: '#FBBF24',
    gradient: maxGradients.luxe,
    glow: '0 0 20px rgba(234, 179, 8, 0.4)',
  },
  accepted: {
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
    text: '#34D399',
    gradient: maxGradients.aurora,
    glow: '0 0 20px rgba(16, 185, 129, 0.4)',
  },
  rejected: {
    bg: 'rgba(107, 114, 128, 0.1)',
    border: 'rgba(107, 114, 128, 0.2)',
    text: '#9CA3AF',
    gradient: 'linear-gradient(135deg, #6B7280, #4B5563)',
    glow: 'none',
  },
  withdrawn: {
    bg: 'rgba(107, 114, 128, 0.1)',
    border: 'rgba(107, 114, 128, 0.2)',
    text: '#9CA3AF',
    gradient: 'linear-gradient(135deg, #6B7280, #4B5563)',
    glow: 'none',
  },
};

// ============================================================================
// AGING INDICATOR COLORS (now from semantic-colors.ts)
// ============================================================================

export const agingColors = {
  fresh: {
    color: semanticColors.info.base,
    bg: semanticColors.info.bg,
    border: semanticColors.info.border,
    pulse: false,
  },
  warning: {
    color: semanticColors.warning.base,
    bg: semanticColors.warning.bg,
    border: semanticColors.warning.border,
    pulse: true,
  },
  critical: {
    color: semanticColors.error.base,
    bg: semanticColors.error.bg,
    border: semanticColors.error.border,
    pulse: true,
  },
};

// ============================================================================
// SCORE COLORS (now from semantic-colors.ts)
// ============================================================================

export const scoreColors = {
  excellent: { color: semanticColors.success.base, label: 'Excellent Match' }, // 80-100
  good: { color: semanticColors.optimal.base, label: 'Good Match' }, // 60-79
  moderate: { color: semanticColors.warning.light, label: 'Moderate Match' }, // 40-59
  weak: { color: semanticColors.warning.base, label: 'Weak Match' }, // 20-39
  poor: { color: semanticColors.error.base, label: 'Poor Match' }, // 0-19
};

export function getScoreColor(score: number): { color: string; label: string } {
  if (score >= 80) return scoreColors.excellent;
  if (score >= 60) return scoreColors.good;
  if (score >= 40) return scoreColors.moderate;
  if (score >= 20) return scoreColors.weak;
  return scoreColors.poor;
}

// ============================================================================
// LIQUID TENURE THEME
// ============================================================================

export const liquidTenure = {
  // Base colors from maximalist
  colors: {
    ...maximalist.colors,
    // Liquid overrides for softer surfaces
    surfaceLight: 'rgba(255, 255, 255, 0.03)',
    surfaceMedium: 'rgba(255, 255, 255, 0.06)',
    surfaceHover: 'rgba(255, 255, 255, 0.08)',
  },

  // Fonts from maximalist
  fonts: maximalist.fonts,

  // Spacing from maximalist
  spacing: maximalist.spacing,

  // Radii - blend maximalist with liquid organic shapes
  radii: {
    ...maximalist.radii,
    pill: '9999px',
    fluid: liquid.radii.organic,
    card: '16px',
    button: '12px',
  },

  // Shadows with liquid glow effects
  shadows: {
    ...maximalist.shadows,
    card: '0 4px 24px rgba(0, 0, 0, 0.2)',
    cardHover: '0 8px 32px rgba(0, 0, 0, 0.3)',
    glow: (color: string) => `0 0 24px ${color}40`,
  },

  // Glass morphism effects
  glass: {
    background: 'rgba(30, 30, 30, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(12px)',
  },

  // Pipeline-specific
  status: statusColors,
  aging: agingColors,
  score: scoreColors,

  // Animations
  animations: pipelineAnimations,

  // Gradients
  gradients: {
    ...maxGradients,
    ...liquidGradients,
    mesh: `
      radial-gradient(at 40% 20%, ${maximalist.colors.primary}15 0px, transparent 50%),
      radial-gradient(at 80% 0%, ${maximalist.colors.secondary}10 0px, transparent 50%),
      radial-gradient(at 0% 50%, ${liquid.colors.primary}08 0px, transparent 50%)
    `,
  },
};

// ============================================================================
// CSS KEYFRAMES (inject into document)
// ============================================================================

export const pipelineKeyframes = `
  @keyframes pipeline-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.02); }
  }

  @keyframes pipeline-glow {
    0%, 100% { box-shadow: 0 0 20px currentColor; }
    50% { box-shadow: 0 0 30px currentColor; }
  }

  @keyframes pipeline-slide-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pipeline-fade-up {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pipeline-ripple {
    0% { transform: scale(0); opacity: 0.5; }
    100% { transform: scale(4); opacity: 0; }
  }

  @keyframes pipeline-stream {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes pipeline-typing {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes aging-pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @keyframes border-glow {
    0%, 100% { border-color: rgba(255, 255, 255, 0.1); }
    50% { border-color: rgba(255, 255, 255, 0.2); }
  }

  @keyframes subtle-lift {
    from { transform: translateY(4px); opacity: 0.8; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes stat-count {
    0% { transform: scale(1); }
    50% { transform: scale(1.08); }
    100% { transform: scale(1); }
  }

  @keyframes accordion-slide-down {
    from {
      opacity: 0;
      max-height: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      max-height: 2000px;
      transform: translateY(0);
    }
  }

  /* Aurora background drift animations - very subtle, slow */
  @keyframes aurora-drift-1 {
    0%, 100% {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }
    25% {
      transform: translate(2%, 3%) scale(1.02);
      opacity: 0.95;
    }
    50% {
      transform: translate(-1%, 5%) scale(1.01);
      opacity: 0.9;
    }
    75% {
      transform: translate(-2%, 2%) scale(1.03);
      opacity: 0.95;
    }
  }

  @keyframes aurora-drift-2 {
    0%, 100% {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }
    33% {
      transform: translate(-3%, 2%) scale(1.02);
      opacity: 0.92;
    }
    66% {
      transform: translate(2%, -2%) scale(0.98);
      opacity: 0.88;
    }
  }

  @keyframes aurora-drift-3 {
    0%, 100% {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }
    40% {
      transform: translate(3%, -3%) scale(1.03);
      opacity: 0.9;
    }
    80% {
      transform: translate(-2%, 2%) scale(0.99);
      opacity: 0.95;
    }
  }

  @keyframes aurora-drift-4 {
    0%, 100% {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }
    50% {
      transform: translate(1%, 2%) scale(1.05);
      opacity: 0.85;
    }
  }

  .pipeline-card {
    animation: pipeline-fade-up 0.3s ${pipelineAnimations.flow} forwards;
  }

  .pipeline-stream-bg {
    background: linear-gradient(
      90deg,
      transparent,
      rgba(59, 130, 246, 0.1),
      transparent
    );
    background-size: 200% 100%;
    animation: pipeline-stream 2s linear infinite;
  }

  .aging-indicator.warning,
  .aging-indicator.critical {
    animation: aging-pulse 2s ease-in-out infinite;
  }

  /* Button hover effects */
  .pipeline-btn {
    background: #0A0A0A;
    color: #FFFFFF;
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  
  .pipeline-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.1);
  }
  
  .pipeline-btn:active:not(:disabled) {
    transform: translateY(0);
    filter: brightness(0.95);
  }
  
  .pipeline-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Tab hover effects */
  .pipeline-tab {
    transition: all 0.2s ease;
  }
  
  .pipeline-tab:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .pipeline-tab.active:hover {
    background: rgba(217, 70, 239, 0.2);
  }

  /* Card hover effects - enhanced */
  .pipeline-card-hover {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .pipeline-card-hover:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  }

  /* Application card specific */
  .application-card {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .application-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--card-accent, rgba(255,255,255,0.2)), transparent);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .application-card:hover::before {
    opacity: 1;
  }

  .application-card:hover {
    transform: translateY(-2px) scale(1.01);
  }

  /* Icon button hover */
  .pipeline-icon-btn {
    transition: all 0.15s ease;
  }
  
  .pipeline-icon-btn:hover {
    transform: scale(1.05);
    opacity: 0.9;
  }

  /* Stat cards */
  .stat-card {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .stat-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.03) 50%, transparent 60%);
    background-size: 200% 200%;
    background-position: -200% 0;
    pointer-events: none;
    transition: none;
  }

  .stat-card:hover::after {
    animation: shimmer 1.5s ease-in-out;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  }

  .stat-card:hover .stat-value {
    animation: stat-count 0.3s ease;
  }

  /* Column headers */
  .column-header {
    transition: all 0.2s ease;
  }

  .column-header:hover {
    filter: brightness(1.1);
  }

  /* Sankey node hover */
  .sankey-node {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sankey-node:hover {
    transform: scale(1.02);
    filter: brightness(1.15);
  }

  /* Status badge glow on hover */
  .status-badge {
    transition: all 0.15s ease;
  }

  .status-badge:hover {
    filter: brightness(1.15);
    box-shadow: 0 0 12px currentColor;
  }
`;

// ============================================================================
// COMPONENT STYLE HELPERS
// ============================================================================

export const pipelineStyles = {
  card: {
    background: liquidTenure.glass.background,
    border: liquidTenure.glass.border,
    backdropFilter: liquidTenure.glass.backdropFilter,
    borderRadius: liquidTenure.radii.card,
    transition: `all ${pipelineAnimations.normal} ${pipelineAnimations.flow}`,
  },

  cardHover: {
    transform: 'translateY(-2px)',
    boxShadow: liquidTenure.shadows.cardHover,
  },

  button: {
    padding: '12px 24px',
    borderRadius: liquidTenure.radii.button,
    fontWeight: '600',
    transition: `all ${pipelineAnimations.fast} ${pipelineAnimations.flow}`,
    cursor: 'pointer',
  },

  // Default button: black bg, white outline, white text
  buttonDefault: {
    background: '#0A0A0A',
    color: '#FFFFFF',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },

  // Selected/Active button: black bg, white outline (thicker), white text
  buttonSelected: {
    background: '#0A0A0A',
    color: '#FFFFFF',
    border: '2px solid #FFFFFF',
  },

  // Primary button (when RIASEC colors active): uses primary color
  buttonPrimary: {
    background: maxGradients.primary,
    color: 'white',
    border: 'none',
    boxShadow: liquidTenure.shadows.glow(maximalist.colors.primary),
  },

  buttonGhost: {
    background: 'transparent',
    color: '#FFFFFF',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },

  input: {
    width: '100%',
    padding: '14px 16px',
    background: liquidTenure.colors.background,
    border: `1px solid ${liquidTenure.colors.border}`,
    borderRadius: liquidTenure.radii.button,
    color: liquidTenure.colors.text,
    fontSize: '14px',
    transition: `border-color ${pipelineAnimations.fast}`,
    outline: 'none',
  },

  inputFocus: {
    borderColor: liquidTenure.colors.primary,
  },

  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: liquidTenure.radii.pill,
    fontSize: '12px',
    fontWeight: '600',
  },

  statusBadge: (status: keyof typeof statusColors) => ({
    ...pipelineStyles.badge,
    background: statusColors[status].bg,
    border: `1px solid ${statusColors[status].border}`,
    color: statusColors[status].text,
  }),

  agingBadge: (aging: keyof typeof agingColors) => ({
    ...pipelineStyles.badge,
    background: agingColors[aging].bg,
    border: `1px solid ${agingColors[aging].border}`,
    color: agingColors[aging].color,
  }),

  scoreBadge: (score: number) => {
    const { color } = getScoreColor(score);
    return {
      ...pipelineStyles.badge,
      background: `${color}20`,
      border: `1px solid ${color}40`,
      color,
    };
  },
};

export default liquidTenure;
