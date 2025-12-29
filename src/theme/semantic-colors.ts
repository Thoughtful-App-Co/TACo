/**
 * Semantic Color System
 *
 * Provides consistent semantic colors (success, warning, error, info, optimal, critical)
 * that remain fixed for accessibility and UX consistency across the application.
 *
 * These colors DO NOT change based on RIASEC profile - they maintain semantic meaning.
 * Only primary/secondary/accent colors change based on user preferences.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { liquid } from './liquid';

// ============================================================================
// SEMANTIC COLOR DEFINITIONS
// ============================================================================

/**
 * Fixed semantic colors that maintain consistent meaning across all themes
 */
export const semanticColors = {
  // Success states (green family)
  success: {
    base: '#10B981', // Emerald 500
    light: '#34D399', // Emerald 400
    dark: '#059669', // Emerald 600
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
  },

  // Warning states (amber/orange family)
  warning: {
    base: '#F59E0B', // Amber 500
    light: '#FBBF24', // Amber 400
    dark: '#D97706', // Amber 600
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.3)',
  },

  // Error/Critical states (red family)
  error: {
    base: '#EF4444', // Red 500
    light: '#F87171', // Red 400
    dark: '#DC2626', // Red 600
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.3)',
  },

  // Informational states (blue family - from liquid.ts)
  info: {
    base: liquid.colors.primary, // #3B82F6 Blue 500
    light: '#60A5FA', // Blue 400
    dark: '#2563EB', // Blue 600
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.3)',
  },

  // Optimal/Excellence states (cyan family)
  optimal: {
    base: '#06B6D4', // Cyan 500
    light: '#22D3EE', // Cyan 400
    dark: '#0891B2', // Cyan 600
    bg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.3)',
  },

  // Neutral states (gray family)
  neutral: {
    base: '#6B7280', // Gray 500
    light: '#9CA3AF', // Gray 400
    dark: '#4B5563', // Gray 600
    bg: 'rgba(107, 114, 128, 0.1)',
    border: 'rgba(107, 114, 128, 0.2)',
  },
} as const;

// ============================================================================
// VELOCITY STATUS COLORS
// ============================================================================

/**
 * Colors for application velocity status indicators
 */
export const velocityColors = {
  low: semanticColors.warning, // Below optimal range
  optimal: semanticColors.success, // Within ideal range (10-15 apps/week)
  high: semanticColors.info, // Above optimal (not bad, just higher volume)
} as const;

// ============================================================================
// SCORE RANGE COLORS
// ============================================================================

/**
 * Colors for match score ranges (0-100 scale)
 */
export const scoreColors = {
  excellent: {
    // 80-100
    color: semanticColors.success.base,
    label: 'Excellent Match',
  },
  good: {
    // 60-79
    color: semanticColors.optimal.base,
    label: 'Good Match',
  },
  moderate: {
    // 40-59
    color: semanticColors.warning.light,
    label: 'Moderate Match',
  },
  weak: {
    // 20-39
    color: semanticColors.warning.base,
    label: 'Weak Match',
  },
  poor: {
    // 0-19
    color: semanticColors.error.base,
    label: 'Poor Match',
  },
} as const;

/**
 * Get score color and label from numeric score
 */
export function getScoreColor(score: number): { color: string; label: string } {
  if (score >= 80) return scoreColors.excellent;
  if (score >= 60) return scoreColors.good;
  if (score >= 40) return scoreColors.moderate;
  if (score >= 20) return scoreColors.weak;
  return scoreColors.poor;
}

// ============================================================================
// AGING INDICATOR COLORS
// ============================================================================

/**
 * Colors for time-based aging indicators
 */
export const agingColors = {
  fresh: {
    // Recently updated (< 7 days)
    color: semanticColors.info.base,
    bg: semanticColors.info.bg,
    border: semanticColors.info.border,
    pulse: false,
  },
  warning: {
    // Getting stale (7-14 days)
    color: semanticColors.warning.base,
    bg: semanticColors.warning.bg,
    border: semanticColors.warning.border,
    pulse: true,
  },
  critical: {
    // Very stale (> 14 days)
    color: semanticColors.error.base,
    bg: semanticColors.error.bg,
    border: semanticColors.error.border,
    pulse: true,
  },
} as const;

// ============================================================================
// TREND DIRECTION COLORS
// ============================================================================

/**
 * Colors for trend indicators (up/down/stable)
 */
export const trendColors = {
  up: {
    color: semanticColors.success.base,
    bg: semanticColors.success.bg,
    border: semanticColors.success.border,
  },
  down: {
    color: semanticColors.error.base,
    bg: semanticColors.error.bg,
    border: semanticColors.error.border,
  },
  stable: {
    color: semanticColors.neutral.base,
    bg: semanticColors.neutral.bg,
    border: semanticColors.neutral.border,
  },
} as const;

// ============================================================================
// SEASONAL HIRING COLORS
// ============================================================================

/**
 * Colors for seasonal hiring score visualization (1-10 scale)
 */
export function getSeasonalScoreColor(score: number): string {
  if (score >= 9) return semanticColors.success.base; // Excellent
  if (score >= 7) return semanticColors.info.base; // Good
  if (score >= 5) return semanticColors.warning.base; // Moderate
  return semanticColors.error.base; // Poor
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert hex color to rgba format
 */
export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Create background color with opacity
 */
export function createBgColor(hex: string, opacity: number = 0.15): string {
  return hexToRgba(hex, opacity);
}

/**
 * Create border color with opacity
 */
export function createBorderColor(hex: string, opacity: number = 0.3): string {
  return hexToRgba(hex, opacity);
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SemanticColorKey = keyof typeof semanticColors;
export type VelocityStatus = keyof typeof velocityColors;
export type ScoreRange = keyof typeof scoreColors;
export type AgingStatus = keyof typeof agingColors;
export type TrendDirection = keyof typeof trendColors;
