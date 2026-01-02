import {
  OceanTrait,
  OceanTraitScore,
  OceanProfile,
  BfiAnswer,
  OCEAN_TRAIT_META,
  BFI_QUESTIONS_PER_TRAIT,
} from '../schemas/ocean.schema';
import { BFI_QUESTIONS_BY_TRAIT } from '../data/bfi-questions';
import {
  getOceanAssessment,
  updateOceanAssessment,
  clearOceanAssessment,
  isOceanCompleted,
} from '../stores/assessment-store';

/**
 * OCEAN/Big Five Scoring Service
 *
 * Handles scoring of the 44-item Big Five Inventory (BFI-44)
 * including reverse-scored items and percentage normalization.
 */

/**
 * Reverse score a single answer (1↔5, 2↔4, 3=3)
 */
export function reverseScore(answer: number): number {
  return 6 - answer;
}

/**
 * Calculate raw score for a single trait
 * Handles reverse-scored items automatically
 */
export function calculateTraitRawScore(trait: OceanTrait, answers: BfiAnswer[]): number {
  const traitQuestions = BFI_QUESTIONS_BY_TRAIT[trait];
  let totalScore = 0;
  let answeredCount = 0;

  for (const question of traitQuestions) {
    const answer = answers[question.id - 1]; // answers array is 0-indexed
    if (answer !== null && answer !== undefined) {
      const score = question.reversed ? reverseScore(answer) : answer;
      totalScore += score;
      answeredCount++;
    }
  }

  // If some questions weren't answered, prorate the score
  if (answeredCount > 0 && answeredCount < traitQuestions.length) {
    totalScore = Math.round((totalScore / answeredCount) * traitQuestions.length);
  }

  return totalScore;
}

/**
 * Convert raw score to percentage (0-100)
 * Based on the number of items per trait
 */
export function rawScoreToPercentage(rawScore: number, trait: OceanTrait): number {
  const numItems = BFI_QUESTIONS_PER_TRAIT[trait];
  const minPossible = numItems * 1; // All 1s
  const maxPossible = numItems * 5; // All 5s
  const range = maxPossible - minPossible;

  const percentage = ((rawScore - minPossible) / range) * 100;
  return Math.round(Math.max(0, Math.min(100, percentage)));
}

/**
 * Determine trait level based on percentage
 */
export function getTraitLevel(percentage: number): 'low' | 'moderate' | 'high' {
  if (percentage < 35) return 'low';
  if (percentage > 65) return 'high';
  return 'moderate';
}

/**
 * Generate description based on trait and level
 */
function getTraitDescription(trait: OceanTrait, level: 'low' | 'moderate' | 'high'): string {
  const descriptions: Record<OceanTrait, Record<string, string>> = {
    openness: {
      high: 'You are imaginative, curious, and open to new experiences. You enjoy exploring novel ideas and have broad intellectual interests.',
      moderate:
        'You balance practicality with creativity, being open to new ideas while also valuing proven approaches.',
      low: 'You prefer familiar routines and practical solutions. You value tradition and tend to be more conventional in your thinking.',
    },
    conscientiousness: {
      high: 'You are highly organized, disciplined, and goal-oriented. You plan ahead and follow through on commitments reliably.',
      moderate:
        'You balance structure with flexibility, maintaining organization while adapting to changing circumstances.',
      low: 'You prefer flexibility and spontaneity over rigid planning. You adapt easily and are comfortable with ambiguity.',
    },
    extraversion: {
      high: 'You are outgoing, energetic, and thrive in social situations. You enjoy being around others and are often the center of attention.',
      moderate:
        'You are comfortable in both social and solitary settings, adapting your energy level to the situation.',
      low: 'You prefer quieter, more solitary activities. You recharge through alone time and prefer deep one-on-one connections.',
    },
    agreeableness: {
      high: "You are compassionate, cooperative, and trusting. You prioritize harmony and are considerate of others' feelings.",
      moderate:
        'You balance cooperation with assertiveness, being friendly while also standing up for your own needs.',
      low: 'You are direct, competitive, and skeptical. You prioritize logic over harmony and are comfortable with conflict.',
    },
    neuroticism: {
      high: 'You experience emotions intensely and may be more sensitive to stress. You are self-aware and attuned to potential problems.',
      moderate:
        'You have a balanced emotional life, experiencing stress at times but generally coping effectively.',
      low: 'You are emotionally stable and resilient. You remain calm under pressure and recover quickly from setbacks.',
    },
  };

  return descriptions[trait][level];
}

/**
 * Calculate complete trait score with all metadata
 */
export function calculateTraitScore(trait: OceanTrait, answers: BfiAnswer[]): OceanTraitScore {
  const rawScore = calculateTraitRawScore(trait, answers);
  const percentage = rawScoreToPercentage(rawScore, trait);
  const level = getTraitLevel(percentage);
  const meta = OCEAN_TRAIT_META[trait];

  return {
    score: rawScore,
    percentage,
    level,
    title: meta.title,
    description: getTraitDescription(trait, level),
    facets: meta.facets,
  };
}

/**
 * Calculate complete OCEAN profile from answers
 */
export function calculateOceanProfile(answers: BfiAnswer[]): OceanProfile {
  return {
    openness: calculateTraitScore('openness', answers),
    conscientiousness: calculateTraitScore('conscientiousness', answers),
    extraversion: calculateTraitScore('extraversion', answers),
    agreeableness: calculateTraitScore('agreeableness', answers),
    neuroticism: calculateTraitScore('neuroticism', answers),
  };
}

/**
 * Get sorted traits by percentage (highest first)
 */
export function getSortedTraits(
  profile: OceanProfile
): Array<{ trait: OceanTrait; score: OceanTraitScore }> {
  const traits: OceanTrait[] = [
    'openness',
    'conscientiousness',
    'extraversion',
    'agreeableness',
    'neuroticism',
  ];

  return traits
    .map((trait) => ({ trait, score: profile[trait] }))
    .sort((a, b) => b.score.percentage - a.score.percentage);
}

/**
 * Save answers to unified store
 */
export function saveOceanAnswers(answers: BfiAnswer[]): void {
  updateOceanAssessment({ answers });
}

/**
 * Load answers from unified store
 */
export function loadOceanAnswers(): BfiAnswer[] | null {
  const ocean = getOceanAssessment();
  return ocean?.answers || null;
}

/**
 * Save complete profile (with archetype) to unified store
 */
export function saveOceanProfile(
  profile: OceanProfile,
  archetype?: { id: string; title: string; description: string }
): void {
  updateOceanAssessment({
    scores: profile,
    archetype: archetype || null,
    completedAt: new Date().toISOString(),
  });
}

/**
 * Load profile from unified store
 */
export function loadOceanProfile(): OceanProfile | null {
  const ocean = getOceanAssessment();
  return ocean?.scores || null;
}

/**
 * Load archetype from unified store
 */
export function loadOceanArchetype(): { id: string; title: string; description: string } | null {
  const ocean = getOceanAssessment();
  return ocean?.archetype || null;
}

/**
 * Clear all OCEAN data from unified store
 */
export function clearOceanData(): void {
  clearOceanAssessment();
}

/**
 * Get completion date
 */
export function getOceanCompletedAt(): Date | null {
  const ocean = getOceanAssessment();
  if (ocean?.completedAt) {
    return new Date(ocean.completedAt);
  }
  return null;
}

// Re-export isOceanCompleted from store for convenience
export { isOceanCompleted };
