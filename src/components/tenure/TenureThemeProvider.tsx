/**
 * Tenure Theme Provider
 *
 * Provides dynamic theming context for the Tenure app based on:
 * 1. User's RIASEC profile (from Discover assessment) for primary/secondary colors
 * 2. Fixed semantic colors (success, warning, error) for consistency
 * 3. Merged liquid-tenure theme tokens
 *
 * Usage:
 *   <TenureThemeProvider>
 *     <YourComponent />
 *   </TenureThemeProvider>
 *
 *   // In components:
 *   const theme = useTenureTheme();
 *   <div style={{ color: theme.colors.primary }}>...</div>
 *   <div style={{ color: theme.semantic.success.base }}>...</div>
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createContext, useContext, ParentComponent, createMemo } from 'solid-js';
import { liquidTenure } from './pipeline/theme/liquid-tenure';
import { getCurrentDuotone } from './pipeline/theme/riasec-colors';
import {
  semanticColors,
  velocityColors,
  scoreColors,
  agingColors,
  trendColors,
} from '../../theme/semantic-colors';

// ============================================================================
// THEME TYPE DEFINITION
// ============================================================================

export type TenureTheme = typeof liquidTenure & {
  semantic: typeof semanticColors;
  velocity: typeof velocityColors;
  score: typeof scoreColors;
  aging: typeof agingColors;
  trend: typeof trendColors;
  // Dynamic colors from RIASEC profile
  dynamic: {
    primary: string;
    secondary: string;
  };
};

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const TenureThemeContext = createContext<TenureTheme>();

/**
 * Hook to access Tenure theme in any child component
 *
 * @throws Error if used outside TenureThemeProvider
 * @returns TenureTheme object with all theme tokens
 *
 * @example
 * const theme = useTenureTheme();
 * <div style={{ color: theme.colors.primary }}>Themed text</div>
 * <div style={{ background: theme.semantic.success.bg }}>Success card</div>
 */
export function useTenureTheme(): TenureTheme {
  const context = useContext(TenureThemeContext);
  if (!context) {
    throw new Error('useTenureTheme must be used within TenureThemeProvider');
  }
  return context;
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * TenureThemeProvider - Provides theme context to all Tenure components
 *
 * Automatically:
 * - Loads RIASEC profile from localStorage
 * - Derives dynamic primary/secondary colors
 * - Merges with liquidTenure base theme
 * - Provides semantic color tokens
 * - Updates when localStorage changes (via reactive createMemo)
 *
 * @example
 * <TenureThemeProvider>
 *   <PipelineView />
 *   <TrendsView />
 * </TenureThemeProvider>
 */
export const TenureThemeProvider: ParentComponent = (props) => {
  // Create reactive theme object that updates when RIASEC profile changes
  const theme = createMemo((): TenureTheme => {
    // Get dynamic colors from RIASEC profile (or defaults)
    const duotone = getCurrentDuotone();

    // Merge liquidTenure with dynamic colors and semantic tokens
    return {
      ...liquidTenure,
      // Override base colors with dynamic RIASEC colors
      colors: {
        ...liquidTenure.colors,
        primary: duotone.primary,
        secondary: duotone.secondary,
      },
      // Add semantic colors
      semantic: semanticColors,
      velocity: velocityColors,
      score: scoreColors,
      aging: agingColors,
      trend: trendColors,
      // Expose dynamic colors separately for explicit usage
      dynamic: {
        primary: duotone.primary,
        secondary: duotone.secondary,
      },
    };
  });

  return (
    <TenureThemeContext.Provider value={theme()}>{props.children}</TenureThemeContext.Provider>
  );
};

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook to get semantic colors only (success, warning, error, etc.)
 */
export function useSemanticColors() {
  const theme = useTenureTheme();
  return theme.semantic;
}

/**
 * Hook to get dynamic RIASEC-based colors only
 */
export function useDynamicColors() {
  const theme = useTenureTheme();
  return theme.dynamic;
}

/**
 * Hook to get velocity status colors
 */
export function useVelocityColors() {
  const theme = useTenureTheme();
  return theme.velocity;
}

/**
 * Hook to get score range colors
 */
export function useScoreColors() {
  const theme = useTenureTheme();
  return theme.score;
}

/**
 * Hook to get aging indicator colors
 */
export function useAgingColors() {
  const theme = useTenureTheme();
  return theme.aging;
}

/**
 * Hook to get trend direction colors
 */
export function useTrendColors() {
  const theme = useTenureTheme();
  return theme.trend;
}

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

export { semanticColors, velocityColors, scoreColors, agingColors, trendColors };
export type {
  SemanticColorKey,
  VelocityStatus,
  ScoreRange,
  AgingStatus,
  TrendDirection,
} from '../../theme/semantic-colors';
