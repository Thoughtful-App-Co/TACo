/**
 * OCEAN Color Utilities - Visualization colors for Big Five traits
 *
 * Provides distinct colors for each OCEAN trait for use in charts and UI.
 * These colors are for visualization only - they do NOT affect the app theme
 * (RIASEC remains the theme driver).
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { OceanTrait } from '../../../../schemas/ocean.schema';

// OCEAN trait color palette
// Colors chosen to be visually distinct from RIASEC and harmonious together
export const oceanColors: Record<OceanTrait, string> = {
  openness: '#3B82F6', // Blue - represents exploration, imagination
  conscientiousness: '#22C55E', // Green - represents growth, reliability
  extraversion: '#F59E0B', // Amber - represents energy, warmth
  agreeableness: '#EC4899', // Pink - represents warmth, connection
  neuroticism: '#8B5CF6', // Purple - represents depth, intensity
};

// Softer/muted variants for backgrounds
export const oceanColorsLight: Record<OceanTrait, string> = {
  openness: '#DBEAFE', // Blue-50
  conscientiousness: '#DCFCE7', // Green-50
  extraversion: '#FEF3C7', // Amber-50
  agreeableness: '#FCE7F3', // Pink-50
  neuroticism: '#EDE9FE', // Purple-50
};

// Short codes for chart labels
export const oceanShortCodes: Record<OceanTrait, string> = {
  openness: 'O',
  conscientiousness: 'C',
  extraversion: 'E',
  agreeableness: 'A',
  neuroticism: 'N',
};

// Full names for display
export const oceanTraitNames: Record<OceanTrait, string> = {
  openness: 'Openness',
  conscientiousness: 'Conscientiousness',
  extraversion: 'Extraversion',
  agreeableness: 'Agreeableness',
  neuroticism: 'Neuroticism',
};

// Trait order for consistent display (OCEAN order)
export const OCEAN_TRAIT_ORDER: OceanTrait[] = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
];

/**
 * Get color for a trait
 */
export function getOceanColor(trait: OceanTrait): string {
  return oceanColors[trait];
}

/**
 * Get light/background color for a trait
 */
export function getOceanColorLight(trait: OceanTrait): string {
  return oceanColorsLight[trait];
}

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
 * Generate a gradient using the top two OCEAN traits
 */
export function oceanGradient(
  primaryTrait: OceanTrait,
  secondaryTrait: OceanTrait,
  angle: number = 135
): string {
  const primary = oceanColors[primaryTrait];
  const secondary = oceanColors[secondaryTrait];
  return `linear-gradient(${angle}deg, ${primary}, ${secondary})`;
}

/**
 * Generate a subtle background gradient for cards
 */
export function oceanCardBackground(trait: OceanTrait): string {
  const color = oceanColors[trait];
  return `linear-gradient(135deg, ${color}08, ${color}05, transparent)`;
}

/**
 * Generate a glow/shadow effect using trait color
 */
export function oceanGlow(
  trait: OceanTrait,
  intensity: 'subtle' | 'medium' | 'strong' = 'medium'
): string {
  const color = oceanColors[trait];
  const opacities = {
    subtle: 0.15,
    medium: 0.25,
    strong: 0.4,
  };

  const opacity = opacities[intensity];
  return `0 4px 20px ${hexToRgba(color, opacity)}, 0 2px 10px ${hexToRgba(color, opacity * 0.5)}`;
}

/**
 * Get bar chart colors for all traits
 */
export function getOceanChartColors(): { trait: OceanTrait; color: string; name: string }[] {
  return OCEAN_TRAIT_ORDER.map((trait) => ({
    trait,
    color: oceanColors[trait],
    name: oceanTraitNames[trait],
  }));
}

export default {
  oceanColors,
  oceanColorsLight,
  oceanShortCodes,
  oceanTraitNames,
  OCEAN_TRAIT_ORDER,
  getOceanColor,
  getOceanColorLight,
  oceanGradient,
  oceanCardBackground,
  oceanGlow,
  getOceanChartColors,
};
