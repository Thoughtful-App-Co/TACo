/**
 * Prosper-Tenure Theme - Extends liquidTenure with wealth/prosperity colors
 *
 * Gold/Green/Purple palette for compensation tracking
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { liquidTenure } from '../../pipeline/theme/liquid-tenure';

// ============================================================================
// PROSPER COLOR PALETTE
// ============================================================================

export const prosperColors = {
  // Wealth colors
  gold: '#D4AF37',
  goldLight: '#F4D03F',
  goldDark: '#B8962B',

  green: '#10B981',
  greenLight: '#34D399',
  greenDark: '#059669',

  purple: '#A855F7',
  purpleLight: '#C084FC',
  purpleDark: '#9333EA',

  // Market comparison
  percentile10: '#EF4444',
  percentile25: '#F97316',
  median: '#10B981',
  percentile75: '#3B82F6',
  percentile90: '#8B5CF6',

  userLine: '#D4AF37',
  gridLines: 'rgba(255, 255, 255, 0.06)',
};

export const prosperGradients = {
  goldShimmer: 'linear-gradient(135deg, #F4D03F, #D4AF37, #B8962B)',
  wealthGlow: 'linear-gradient(135deg, #10B981, #34D399)',
  achievement: 'linear-gradient(135deg, #A855F7, #C084FC)',
  growth: 'linear-gradient(90deg, #10B981, #D4AF37)',
};

// ============================================================================
// SALARY CHART COLORS
// ============================================================================

export const salaryColors = {
  userLine: prosperColors.gold,
  percentile10: prosperColors.percentile10,
  percentile25: prosperColors.percentile25,
  median: prosperColors.median,
  percentile75: prosperColors.percentile75,
  percentile90: prosperColors.percentile90,
  gridLines: prosperColors.gridLines,
};

/**
 * Get color for a percentile value
 */
export function getPercentileColor(percentile: number): string {
  if (percentile >= 90) return salaryColors.percentile90;
  if (percentile >= 75) return salaryColors.percentile75;
  if (percentile >= 50) return salaryColors.median;
  if (percentile >= 25) return salaryColors.percentile25;
  return salaryColors.percentile10;
}

// ============================================================================
// PROSPER THEME (extends liquidTenure)
// ============================================================================

export const prosperTenure = {
  ...liquidTenure,

  // Keep RIASEC dynamic primary color, only override secondary/accent
  colors: {
    ...liquidTenure.colors,
    // primary: inherited from liquidTenure (RIASEC dynamic color)
    secondary: prosperColors.green,
    accent: prosperColors.purple,
  },

  // Add prosper-specific gradients
  gradients: {
    ...liquidTenure.gradients,
    ...prosperGradients,
  },

  // Prosper-specific exports
  prosper: {
    colors: prosperColors,
    gradients: prosperGradients,
    salaryColors,
    getPercentileColor,
  },
};

export default prosperTenure;
