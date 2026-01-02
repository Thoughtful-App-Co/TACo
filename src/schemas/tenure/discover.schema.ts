/**
 * Tenure Discover Schema - RIASEC Career Assessment
 *
 * Holland's RIASEC model for career interest assessment.
 * Stores assessment answers, calculated scores, and career recommendations.
 *
 * RIASEC Types:
 * - R (Realistic): Practical, hands-on work
 * - I (Investigative): Research, analysis, problem-solving
 * - A (Artistic): Creative, expressive work
 * - S (Social): Helping, teaching, serving others
 * - E (Enterprising): Leadership, persuasion, business
 * - C (Conventional): Organizing, data management, detail-oriented
 *
 * @module schemas/tenure/discover
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { z } from 'zod';

// =============================================================================
// RIASEC TYPES
// =============================================================================

export type RiasecType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';

export const RIASEC_TYPES: RiasecType[] = ['R', 'I', 'A', 'S', 'E', 'C'];

export const RIASEC_LABELS: Record<RiasecType, string> = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional',
};

export const RIASEC_DESCRIPTIONS: Record<RiasecType, string> = {
  R: 'Practical, hands-on problem solvers who enjoy working with tools, machines, and physical materials.',
  I: 'Analytical thinkers who enjoy research, exploration, and understanding how things work.',
  A: 'Creative individuals who value self-expression and enjoy working in unstructured environments.',
  S: 'Helpers and teachers who enjoy working with and supporting other people.',
  E: 'Leaders and persuaders who enjoy business, politics, and taking initiative.',
  C: 'Organizers who enjoy working with data, details, and following established procedures.',
};

// =============================================================================
// ASSESSMENT QUESTIONS & ANSWERS
// =============================================================================

export interface RiasecQuestion {
  id: string;
  text: string;
  type: RiasecType;
  category: 'activity' | 'competency' | 'occupation';
}

export interface RiasecAnswer {
  questionId: string;
  value: number; // 1-5 scale (1 = Strongly Disagree, 5 = Strongly Agree)
  answeredAt: Date;
}

export const RiasecAnswerSchema = z.object({
  questionId: z.string(),
  value: z.number().int().min(1).max(5),
  answeredAt: z.date(),
});

// =============================================================================
// RIASEC PROFILE
// =============================================================================

export interface RiasecScores {
  R: number; // 0-100 normalized score
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

export const RiasecScoresSchema = z.object({
  R: z.number().min(0).max(100),
  I: z.number().min(0).max(100),
  A: z.number().min(0).max(100),
  S: z.number().min(0).max(100),
  E: z.number().min(0).max(100),
  C: z.number().min(0).max(100),
});

export interface RiasecProfile {
  id: string;
  userId: string;

  // Raw answers (preserved for re-calculation)
  answers: Record<string, number>; // questionId -> value (1-5)

  // Calculated scores (0-100 normalized)
  scores: RiasecScores;

  // Dominant types (top 2-3)
  dominantTypes: RiasecType[];

  // Holland code (e.g., "RIA", "SEC")
  hollandCode: string;

  // Assessment metadata
  assessmentVersion: number;
  completedAt: Date;
  questionsAnswered: number;
  totalQuestions: number;

  // Sync metadata
  createdAt: Date;
  updatedAt: Date;
}

export const RiasecProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  answers: z.record(z.string(), z.number()),
  scores: RiasecScoresSchema,
  dominantTypes: z.array(z.enum(['R', 'I', 'A', 'S', 'E', 'C'])),
  hollandCode: z.string().min(2).max(3),
  assessmentVersion: z.number().int().min(1),
  completedAt: z.date(),
  questionsAnswered: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// =============================================================================
// CAREER RECOMMENDATIONS
// =============================================================================

export interface CareerRecommendation {
  socCode: string; // Standard Occupational Classification code
  title: string;
  description?: string;
  riasecCode: string; // e.g., "RIA"
  matchScore: number; // 0-100
  medianSalary?: number;
  growthOutlook?: 'excellent' | 'good' | 'fair' | 'limited' | 'declining';
}

export const CareerRecommendationSchema = z.object({
  socCode: z.string(),
  title: z.string(),
  description: z.string().optional(),
  riasecCode: z.string(),
  matchScore: z.number().min(0).max(100),
  medianSalary: z.number().optional(),
  growthOutlook: z.enum(['excellent', 'good', 'fair', 'limited', 'declining']).optional(),
});

// =============================================================================
// DISCOVER STATE (for assessment flow)
// =============================================================================

export type DiscoverStep = 'intro' | 'assessment' | 'results' | 'explore';

export interface DiscoverState {
  currentStep: DiscoverStep;
  currentQuestionIndex: number;
  answers: Record<string, number>; // questionId -> value
  isComplete: boolean;
  startedAt?: Date;
  lastActivityAt: Date;
}

export const DiscoverStateSchema = z.object({
  currentStep: z.enum(['intro', 'assessment', 'results', 'explore']),
  currentQuestionIndex: z.number().int().min(0),
  answers: z.record(z.string(), z.number()),
  isComplete: z.boolean(),
  startedAt: z.date().optional(),
  lastActivityAt: z.date(),
});

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Calculate RIASEC scores from raw answers
 */
export function calculateRiasecScores(
  answers: Record<string, number>,
  questions: RiasecQuestion[]
): RiasecScores {
  const typeTotals: Record<RiasecType, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const typeCounts: Record<RiasecType, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  for (const question of questions) {
    const answer = answers[question.id];
    if (answer !== undefined) {
      typeTotals[question.type] += answer;
      typeCounts[question.type]++;
    }
  }

  // Normalize to 0-100 scale
  const scores: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  for (const type of RIASEC_TYPES) {
    if (typeCounts[type] > 0) {
      // Average (1-5) -> percentage (0-100)
      const average = typeTotals[type] / typeCounts[type];
      scores[type] = Math.round(((average - 1) / 4) * 100);
    }
  }

  return scores;
}

/**
 * Get dominant types (top N by score)
 */
export function getDominantTypes(scores: RiasecScores, count: number = 3): RiasecType[] {
  return (Object.entries(scores) as [RiasecType, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .filter(([_, score]) => score > 0)
    .map(([type]) => type);
}

/**
 * Generate Holland code from scores
 */
export function generateHollandCode(scores: RiasecScores): string {
  return getDominantTypes(scores, 3).join('');
}

/**
 * Calculate fit score between user profile and a job's RIASEC code
 */
export function calculateJobFitScore(userScores: RiasecScores, jobRiasecCode: string): number {
  if (!jobRiasecCode || jobRiasecCode.length === 0) return 0;

  const jobTypes = jobRiasecCode.split('') as RiasecType[];
  let totalScore = 0;
  let weight = 1;

  // Weight decreases for each subsequent type (primary > secondary > tertiary)
  for (const type of jobTypes) {
    if (type in userScores) {
      totalScore += userScores[type] * weight;
    }
    weight *= 0.6; // 1.0, 0.6, 0.36...
  }

  // Normalize to 0-100
  const maxPossible = 100 * (1 + 0.6 + 0.36); // If all scores were 100
  return Math.round((totalScore / maxPossible) * 100);
}
