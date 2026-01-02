/**
 * Jungian Type Assessment Scoring Service
 *
 * Handles scoring, type calculation, and localStorage integration
 * for the OEJTS (Open-Source Jung Type Scales) assessment.
 *
 * Note: This is an open-source implementation of Jungian typology.
 * Myers-Briggs Type Indicator® (MBTI®) is a registered trademark.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import type {
  OejtsAnswer,
  JungianProfile,
  JungianType,
  DichotomyScore,
  Dichotomy,
  CognitiveFunction,
  Temperament,
} from '../schemas/jungian.schema';
import {
  getPreferenceStrength,
  scoreToPercentage,
  getCognitiveFunctions,
  getTemperament,
} from '../schemas/jungian.schema';
import { OEJTS_QUESTIONS } from '../data/oejts-questions';
import { getJungianAssessment, updateJungianAssessment } from '../stores/assessment-store';

/**
 * Calculate dichotomy score from answers
 * Each dichotomy has 8 questions (4 for each pole)
 */
function calculateDichotomyScore(dichotomy: Dichotomy, answers: OejtsAnswer[]): DichotomyScore {
  const questions = OEJTS_QUESTIONS.filter((q) => q.dichotomy === dichotomy);

  let firstPoleScore = 0;
  let secondPoleScore = 0;

  questions.forEach((q) => {
    const answer = answers[q.id - 1];
    if (answer === null) return; // Skip unanswered

    // Determine which pole this question favors
    const poleMap: Record<Dichotomy, [string, string]> = {
      EI: ['E', 'I'],
      SN: ['S', 'N'],
      TF: ['T', 'F'],
      JP: ['J', 'P'],
    };

    const [firstPole, secondPole] = poleMap[dichotomy];

    if (q.pole === firstPole) {
      firstPoleScore += answer; // Direct scoring
    } else {
      secondPoleScore += answer; // Direct scoring
    }
  });

  // Calculate net score (difference between poles)
  const netScore = firstPoleScore - secondPoleScore;
  const [firstPole, secondPole] = dichotomy.split('') as [string, string];

  // Determine preference
  const preference = netScore >= 0 ? firstPole : secondPole;
  const absScore = Math.abs(netScore);

  // Normalize to 0-8 range (4 questions per pole, max answer 5 = 20 per pole, diff max 40, normalize to 8)
  const normalizedScore = Math.round((absScore / 40) * 8);

  return {
    preference,
    score: netScore >= 0 ? normalizedScore : -normalizedScore,
    percentage: scoreToPercentage(normalizedScore),
    strength: getPreferenceStrength(normalizedScore),
  };
}

/**
 * Calculate complete MBTI profile from answers
 */
export function calculateJungianProfile(answers: OejtsAnswer[]): JungianProfile {
  // Calculate dichotomy scores
  const EI = calculateDichotomyScore('EI', answers);
  const SN = calculateDichotomyScore('SN', answers);
  const TF = calculateDichotomyScore('TF', answers);
  const JP = calculateDichotomyScore('JP', answers);

  // Construct 4-letter type code
  const typeCode =
    `${EI.preference}${SN.preference}${TF.preference}${JP.preference}` as JungianType;

  // Get cognitive functions
  const [dominant, auxiliary, tertiary, inferior] = getCognitiveFunctions(typeCode);

  // Get temperament
  const temperament = getTemperament(typeCode);

  return {
    type: typeCode,
    dichotomies: { EI, SN, TF, JP },
    dominantFunction: dominant,
    auxiliaryFunction: auxiliary,
    temperament,
  };
}

/**
 * Load Jungian answers from unified store
 */
export function loadJungianAnswers(): OejtsAnswer[] | null {
  const assessment = getJungianAssessment();
  return assessment?.answers || null;
}

/**
 * Save Jungian answers to unified store
 */
export function saveJungianAnswers(answers: OejtsAnswer[]): void {
  const existing = getJungianAssessment() || {
    type: 'jungian' as const,
    answers: [],
    profile: null,
    completedAt: null,
  };

  updateJungianAssessment({
    ...existing,
    answers,
  });
}

/**
 * Load complete Jungian profile from unified store
 */
export function loadJungianProfile(): JungianProfile | null {
  const assessment = getJungianAssessment();
  if (!assessment?.profile) return null;

  // Type assertion is safe here since we control the data structure
  return assessment.profile as JungianProfile;
}

/**
 * Save complete profile to unified store
 */
export function saveJungianProfile(profile: JungianProfile): void {
  const existing = getJungianAssessment() || {
    type: 'jungian' as const,
    answers: [],
    profile: null,
    completedAt: null,
  };

  updateJungianAssessment({
    ...existing,
    profile,
    completedAt: new Date().toISOString(),
  });
}

/**
 * Clear Jungian assessment data
 */
export function clearJungianAssessment(): void {
  updateJungianAssessment({
    type: 'jungian',
    answers: [],
    profile: null,
    completedAt: null,
  });
}

/**
 * Get cognitive function description
 */
export function getCognitiveFunctionDescription(fn: CognitiveFunction): {
  name: string;
  description: string;
} {
  const descriptions: Record<CognitiveFunction, { name: string; description: string }> = {
    Te: {
      name: 'Extraverted Thinking',
      description: 'Organizing the external world through logic and efficiency',
    },
    Ti: {
      name: 'Introverted Thinking',
      description: 'Analyzing internal frameworks and logical consistency',
    },
    Fe: {
      name: 'Extraverted Feeling',
      description: 'Creating harmony and connection with others',
    },
    Fi: {
      name: 'Introverted Feeling',
      description: 'Aligning actions with personal values and authenticity',
    },
    Se: {
      name: 'Extraverted Sensing',
      description: 'Engaging with the present moment and sensory experience',
    },
    Si: {
      name: 'Introverted Sensing',
      description: 'Drawing on past experiences and detailed memories',
    },
    Ne: {
      name: 'Extraverted Intuition',
      description: 'Exploring possibilities and making connections',
    },
    Ni: {
      name: 'Introverted Intuition',
      description: 'Synthesizing patterns into singular insights',
    },
  };

  return descriptions[fn];
}

/**
 * Get temperament description
 */
export function getTemperamentDescription(temp: Temperament): {
  name: string;
  description: string;
} {
  const descriptions: Record<Temperament, { name: string; description: string }> = {
    NT: {
      name: 'Rational',
      description: 'Strategic, analytical, and focused on competence and knowledge',
    },
    NF: {
      name: 'Idealist',
      description: 'Authentic, empathetic, and focused on meaning and potential',
    },
    SJ: {
      name: 'Guardian',
      description: 'Responsible, organized, and focused on duty and stability',
    },
    SP: {
      name: 'Artisan',
      description: 'Adaptable, pragmatic, and focused on action and results',
    },
  };

  return descriptions[temp];
}
