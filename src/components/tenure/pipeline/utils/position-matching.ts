/**
 * Position Matching Utilities - Fuzzy matching for job titles
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

/**
 * Seniority levels to remove for normalization
 */
const SENIORITY_LEVELS = [
  'senior',
  'sr',
  'junior',
  'jr',
  'lead',
  'principal',
  'staff',
  'entry level',
  'entry-level',
  'mid level',
  'mid-level',
  'intermediate',
  'associate',
  'chief',
  'head of',
  'director of',
  'vp of',
  'vice president',
  'manager',
  'mgr',
];

/**
 * Common job title variations and noise words
 */
const NOISE_WORDS = [
  'the',
  'a',
  'an',
  '&',
  'and',
  'or',
  'for',
  'of',
  'at',
  'in',
  'with',
  '-',
  '/',
  '|',
  'full time',
  'full-time',
  'part time',
  'part-time',
  'remote',
  'hybrid',
  'onsite',
  'contract',
  'freelance',
  'temporary',
  'temp',
];

/**
 * Normalize a job title for fuzzy matching
 * Steps:
 * 1. Convert to lowercase
 * 2. Remove seniority levels
 * 3. Remove noise words
 * 4. Remove special characters and extra spaces
 * 5. Trim and dedupe spaces
 */
export function normalizeJobTitle(title: string): string {
  let normalized = title.toLowerCase().trim();

  // Remove seniority levels
  for (const level of SENIORITY_LEVELS) {
    const regex = new RegExp(`\\b${level}\\b`, 'gi');
    normalized = normalized.replace(regex, ' ');
  }

  // Remove noise words
  for (const word of NOISE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    normalized = normalized.replace(regex, ' ');
  }

  // Remove special characters (keep letters, numbers, spaces)
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');

  // Collapse multiple spaces into one
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Group job titles by normalized form
 * Returns a Map of normalized title -> original titles
 */
export function groupPositions(positions: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  for (const position of positions) {
    const normalized = normalizeJobTitle(position);

    if (!groups.has(normalized)) {
      groups.set(normalized, []);
    }

    groups.get(normalized)!.push(position);
  }

  return groups;
}

/**
 * Get the canonical/display name for a group of positions
 * Prefers the shortest version, or the most common version
 */
export function getCanonicalPositionName(positions: string[]): string {
  if (positions.length === 0) return '';
  if (positions.length === 1) return positions[0];

  // Count frequency of each position
  const frequency = new Map<string, number>();
  for (const pos of positions) {
    frequency.set(pos, (frequency.get(pos) || 0) + 1);
  }

  // Find the most frequent, or shortest if tie
  let canonical = positions[0];
  let maxFreq = frequency.get(canonical) || 0;

  for (const pos of positions) {
    const freq = frequency.get(pos) || 0;
    if (freq > maxFreq || (freq === maxFreq && pos.length < canonical.length)) {
      canonical = pos;
      maxFreq = freq;
    }
  }

  return canonical;
}

/**
 * Check if two job titles are similar (fuzzy match)
 */
export function arePositionsSimilar(title1: string, title2: string): boolean {
  return normalizeJobTitle(title1) === normalizeJobTitle(title2);
}
