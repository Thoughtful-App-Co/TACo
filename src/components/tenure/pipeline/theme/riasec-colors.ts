/**
 * RIASEC Color Utilities - Duotone theming based on Holland Codes
 *
 * Provides dynamic color pairing for duotone icons and UI elements
 * based on user's RIASEC profile or job type classification.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

// RIASEC type definitions
export type RiasecType =
  | 'realistic'
  | 'investigative'
  | 'artistic'
  | 'social'
  | 'enterprising'
  | 'conventional';

// RIASEC color palette from maximalist theme
export const riasecColors: Record<RiasecType, string> = {
  realistic: '#F97316', // Neon Orange (Hot)
  investigative: '#8B5CF6', // Neon Purple (Cool)
  artistic: '#EC4899', // Hot Pink (Hot)
  social: '#10B981', // Emerald Green (Cool)
  enterprising: '#EAB308', // Electric Yellow (Hot)
  conventional: '#06B6D4', // Cyan (Cool)
};

// Temperature classification for harmonious pairing
export const colorTemperature: Record<RiasecType, 'hot' | 'cool'> = {
  realistic: 'hot',
  investigative: 'cool',
  artistic: 'hot',
  social: 'cool',
  enterprising: 'hot',
  conventional: 'cool',
};

// Complementary pairings for duotone effects
// Each type has a natural complement that creates visual harmony
export const complementaryPairs: Record<RiasecType, RiasecType> = {
  realistic: 'investigative', // Orange + Purple
  investigative: 'artistic', // Purple + Pink
  artistic: 'social', // Pink + Green
  social: 'enterprising', // Green + Yellow
  enterprising: 'conventional', // Yellow + Cyan
  conventional: 'realistic', // Cyan + Orange
};

// Adjacent pairings for subtle, harmonious effects
export const adjacentPairs: Record<RiasecType, RiasecType> = {
  realistic: 'enterprising', // Orange + Yellow (warm harmony)
  investigative: 'conventional', // Purple + Cyan (cool harmony)
  artistic: 'investigative', // Pink + Purple (cool-warm blend)
  social: 'conventional', // Green + Cyan (cool harmony)
  enterprising: 'artistic', // Yellow + Pink (warm harmony)
  conventional: 'investigative', // Cyan + Purple (cool harmony)
};

// ============================================================================
// DUOTONE COLOR DERIVATION
// ============================================================================

export interface DuotoneColors {
  primary: string;
  secondary: string;
  primaryOpacity: number;
  secondaryOpacity: number;
}

/**
 * Get duotone color pair based on RIASEC type
 * Uses complementary pairing for maximum visual depth
 */
export function getDuotoneColors(
  primaryType: RiasecType,
  mode: 'complementary' | 'adjacent' | 'monochrome' = 'complementary'
): DuotoneColors {
  const primary = riasecColors[primaryType];

  let secondary: string;
  switch (mode) {
    case 'complementary':
      secondary = riasecColors[complementaryPairs[primaryType]];
      break;
    case 'adjacent':
      secondary = riasecColors[adjacentPairs[primaryType]];
      break;
    case 'monochrome':
    default:
      secondary = primary;
      break;
  }

  return {
    primary,
    secondary,
    primaryOpacity: 1,
    secondaryOpacity: 0.4,
  };
}

/**
 * Get duotone colors from a RIASEC score profile
 * Uses top two types for primary/secondary colors
 */
export function getDuotoneFromProfile(riasecScores: Record<string, number>): DuotoneColors {
  // Sort types by score descending
  const sorted = Object.entries(riasecScores)
    .sort(([, a], [, b]) => b - a)
    .map(([type]) => type.toLowerCase() as RiasecType);

  const primaryType = sorted[0] || 'investigative';
  const secondaryType = sorted[1] || complementaryPairs[primaryType];

  return {
    primary: riasecColors[primaryType],
    secondary: riasecColors[secondaryType],
    primaryOpacity: 1,
    secondaryOpacity: 0.4,
  };
}

/**
 * Get default duotone colors when no RIASEC profile is available
 * Uses Investigative (purple) + Artistic (pink) as a sophisticated default
 */
export function getDefaultDuotone(): DuotoneColors {
  return {
    primary: riasecColors.investigative, // Purple
    secondary: riasecColors.artistic, // Pink
    primaryOpacity: 1,
    secondaryOpacity: 0.35,
  };
}

// ============================================================================
// STATUS-BASED THEMING
// ============================================================================

// Map pipeline statuses to RIASEC-inspired colors
export const statusToRiasec: Record<string, RiasecType> = {
  saved: 'conventional', // Cyan - organized, methodical
  applied: 'enterprising', // Yellow - action, initiative
  screening: 'investigative', // Purple - analysis, evaluation
  interviewing: 'social', // Green - interpersonal, connection
  offered: 'artistic', // Pink - creative success
  accepted: 'social', // Green - positive outcome
  rejected: 'realistic', // Orange - practical reality
  withdrawn: 'conventional', // Cyan - organized decision
};

/**
 * Get duotone colors for a pipeline status
 */
export function getStatusDuotone(status: string): DuotoneColors {
  const riasecType = statusToRiasec[status] || 'investigative';
  return getDuotoneColors(riasecType, 'adjacent');
}

// ============================================================================
// GRADIENT GENERATORS
// ============================================================================

/**
 * Convert hex color to rgba format
 */
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Generate a duotone gradient CSS string
 */
export function duotoneGradient(
  colors: DuotoneColors,
  angle: number = 135,
  type: 'linear' | 'radial' = 'linear'
): string {
  const primaryColor = hexToRgba(colors.primary, colors.primaryOpacity);
  const secondaryColor = hexToRgba(colors.secondary, colors.secondaryOpacity);

  if (type === 'radial') {
    return `radial-gradient(circle, ${primaryColor}, ${secondaryColor})`;
  }

  return `linear-gradient(${angle}deg, ${colors.primary}, ${colors.secondary})`;
}

/**
 * Generate a subtle background gradient for cards
 */
export function duotoneCardBackground(colors: DuotoneColors): string {
  return `linear-gradient(135deg, ${colors.primary}08, ${colors.secondary}05, transparent)`;
}

/**
 * Generate a glow/shadow effect using duotone colors
 */
export function duotoneGlow(
  colors: DuotoneColors,
  intensity: 'subtle' | 'medium' | 'strong' = 'medium'
): string {
  const opacities = {
    subtle: { primary: 0.15, secondary: 0.1 },
    medium: { primary: 0.25, secondary: 0.15 },
    strong: { primary: 0.4, secondary: 0.25 },
  };

  const { primary: pOpacity, secondary: sOpacity } = opacities[intensity];

  return `0 4px 20px ${hexToRgba(colors.primary, pOpacity)}, 0 2px 10px ${hexToRgba(colors.secondary, sOpacity)}`;
}

// ============================================================================
// RIASEC SCORE STORAGE KEY
// ============================================================================

export const RIASEC_STORAGE_KEY = 'augment_answers';

/**
 * Load RIASEC scores from localStorage
 */
export function loadRiasecScores(): Record<string, number> | null {
  try {
    const stored = localStorage.getItem(RIASEC_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load RIASEC scores:', e);
  }
  return null;
}

/**
 * Get current duotone theme based on stored RIASEC profile
 */
export function getCurrentDuotone(): DuotoneColors {
  const scores = loadRiasecScores();
  if (scores && Object.keys(scores).length > 0) {
    return getDuotoneFromProfile(scores);
  }
  return getDefaultDuotone();
}

export default {
  riasecColors,
  getDuotoneColors,
  getDuotoneFromProfile,
  getDefaultDuotone,
  getStatusDuotone,
  getCurrentDuotone,
  duotoneGradient,
  duotoneCardBackground,
  duotoneGlow,
};
