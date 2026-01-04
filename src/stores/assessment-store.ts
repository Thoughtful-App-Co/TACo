/**
 * Unified Assessment Store
 *
 * Centralizes all assessment data (RIASEC, OCEAN, Jungian) in a single localStorage key.
 * This structure is backend-ready for future sync to server for premium users.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { RiasecScoreWithDetails } from '../services/onet';
import { OceanProfile, BfiAnswer } from '../schemas/ocean.schema';
import { logger } from '../lib/logger';

// Storage key
export const ASSESSMENT_STORE_KEY = 'tenure_assessments';

// RIASEC assessment data
export interface RiasecAssessment {
  answers: string[]; // Array of 60 answers (1-5 or '?')
  scores: RiasecScoreWithDetails | null; // Calculated RIASEC scores
  completedAt: string | null; // ISO timestamp
}

// OCEAN assessment data
export interface OceanAssessment {
  answers: BfiAnswer[]; // Array of 44 answers (1-5 or null)
  scores: OceanProfile | null; // Calculated Big Five scores
  archetype: {
    id: string;
    title: string;
    description: string;
  } | null;
  completedAt: string | null; // ISO timestamp
}

// Jungian assessment data
export interface JungianAssessment {
  type: 'jungian';
  answers: (1 | 2 | 3 | 4 | 5 | null)[]; // 32 OEJTS answers
  profile: {
    type: string; // Jungian type (e.g., "INTJ")
    dichotomies: {
      EI: any;
      SN: any;
      TF: any;
      JP: any;
    };
    dominantFunction: string;
    auxiliaryFunction: string;
    temperament: string;
  } | null;
  completedAt: string | null;
}

// Complete assessment store structure
export interface AssessmentStore {
  version: number; // Schema version for migrations
  riasec: RiasecAssessment | null;
  ocean: OceanAssessment | null;
  jungian: JungianAssessment | null;
}

// Default empty store
const DEFAULT_STORE: AssessmentStore = {
  version: 1,
  riasec: null,
  ocean: null,
  jungian: null,
};

/**
 * Load the complete assessment store from localStorage
 */
export function loadAssessmentStore(): AssessmentStore {
  try {
    const stored = localStorage.getItem(ASSESSMENT_STORE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_STORE, ...parsed };
    }
  } catch (e) {
    logger.storage.error('Failed to load assessment store:', e);
  }
  return { ...DEFAULT_STORE };
}

/**
 * Save the complete assessment store to localStorage
 */
export function saveAssessmentStore(store: AssessmentStore): void {
  try {
    localStorage.setItem(ASSESSMENT_STORE_KEY, JSON.stringify(store));
  } catch (e) {
    logger.storage.error('Failed to save assessment store:', e);
  }
}

/**
 * Update RIASEC assessment data
 */
export function updateRiasecAssessment(data: Partial<RiasecAssessment>): void {
  const store = loadAssessmentStore();
  store.riasec = {
    answers: data.answers || store.riasec?.answers || [],
    scores: data.scores !== undefined ? data.scores : store.riasec?.scores || null,
    completedAt:
      data.completedAt !== undefined ? data.completedAt : store.riasec?.completedAt || null,
  };
  saveAssessmentStore(store);
}

/**
 * Update OCEAN assessment data
 */
export function updateOceanAssessment(data: Partial<OceanAssessment>): void {
  const store = loadAssessmentStore();
  store.ocean = {
    answers: data.answers || store.ocean?.answers || new Array(44).fill(null),
    scores: data.scores !== undefined ? data.scores : store.ocean?.scores || null,
    archetype: data.archetype !== undefined ? data.archetype : store.ocean?.archetype || null,
    completedAt:
      data.completedAt !== undefined ? data.completedAt : store.ocean?.completedAt || null,
  };
  saveAssessmentStore(store);
}

/**
 * Get RIASEC assessment data
 */
export function getRiasecAssessment(): RiasecAssessment | null {
  const store = loadAssessmentStore();
  return store.riasec;
}

/**
 * Get OCEAN assessment data
 */
export function getOceanAssessment(): OceanAssessment | null {
  const store = loadAssessmentStore();
  return store.ocean;
}

/**
 * Update Jungian assessment data
 */
export function updateJungianAssessment(data: Partial<JungianAssessment>): void {
  const store = loadAssessmentStore();
  store.jungian = {
    type: 'jungian',
    answers: data.answers || store.jungian?.answers || new Array(32).fill(null),
    profile: data.profile !== undefined ? data.profile : store.jungian?.profile || null,
    completedAt:
      data.completedAt !== undefined ? data.completedAt : store.jungian?.completedAt || null,
  };
  saveAssessmentStore(store);
}

/**
 * Get Jungian assessment data
 */
export function getJungianAssessment(): JungianAssessment | null {
  const store = loadAssessmentStore();
  return store.jungian;
}

/**
 * Check if RIASEC is completed
 */
export function isRiasecCompleted(): boolean {
  const riasec = getRiasecAssessment();
  return riasec !== null && riasec.scores !== null;
}

/**
 * Check if OCEAN is completed
 */
export function isOceanCompleted(): boolean {
  const ocean = getOceanAssessment();
  return ocean !== null && ocean.scores !== null;
}

/**
 * Check if Jungian is completed
 */
export function isJungianCompleted(): boolean {
  const jungian = getJungianAssessment();
  return jungian !== null && jungian.profile !== null;
}

/**
 * Check if any assessment is completed
 */
export function hasAnyAssessmentCompleted(): boolean {
  return isRiasecCompleted() || isOceanCompleted() || isJungianCompleted();
}

/**
 * Check if both RIASEC and OCEAN are completed
 */
export function areBothAssessmentsCompleted(): boolean {
  return isRiasecCompleted() && isOceanCompleted();
}

/**
 * Check if all three assessments are completed
 */
export function areAllAssessmentsCompleted(): boolean {
  return isRiasecCompleted() && isOceanCompleted() && isJungianCompleted();
}

/**
 * Clear all assessment data
 */
export function clearAllAssessments(): void {
  saveAssessmentStore({ ...DEFAULT_STORE });
}

/**
 * Clear RIASEC assessment data
 */
export function clearRiasecAssessment(): void {
  const store = loadAssessmentStore();
  store.riasec = null;
  saveAssessmentStore(store);
}

/**
 * Clear OCEAN assessment data
 */
export function clearOceanAssessment(): void {
  const store = loadAssessmentStore();
  store.ocean = null;
  saveAssessmentStore(store);
}

/**
 * Clear Jungian assessment data
 */
export function clearJungianAssessment(): void {
  const store = loadAssessmentStore();
  store.jungian = null;
  saveAssessmentStore(store);
}

/**
 * Migrate legacy RIASEC data from old localStorage keys
 * Call this on app init to ensure existing users' data is preserved
 */
export function migrateLegacyRiasecData(): void {
  const store = loadAssessmentStore();

  // Skip if already migrated
  if (store.riasec !== null) {
    return;
  }

  try {
    // Try to load from legacy keys
    const legacyAnswers =
      localStorage.getItem('augment_answers') || localStorage.getItem('tenure_riasec_answers');

    if (legacyAnswers) {
      const answers = JSON.parse(legacyAnswers);

      // Note: Legacy scores are not stored, so they'll need to be recalculated
      // This is intentional - scores should be regenerated from answers for accuracy
      updateRiasecAssessment({
        answers,
        scores: null, // Will be recalculated when user views results
        completedAt: new Date().toISOString(), // Approximate
      });

      logger.storage.info('Successfully migrated legacy RIASEC data to unified store');
    }
  } catch (e) {
    logger.storage.error('Failed to migrate legacy RIASEC data:', e);
  }
}

/**
 * Export assessment data for backup
 */
export function exportAssessmentData(): string {
  const store = loadAssessmentStore();
  return JSON.stringify(store, null, 2);
}

/**
 * Import assessment data from backup
 */
export function importAssessmentData(data: string): boolean {
  try {
    const parsed = JSON.parse(data);

    // Validate basic structure
    if (typeof parsed === 'object' && parsed !== null) {
      saveAssessmentStore({ ...DEFAULT_STORE, ...parsed });
      return true;
    }

    return false;
  } catch (e) {
    logger.storage.error('Failed to import assessment data:', e);
    return false;
  }
}
