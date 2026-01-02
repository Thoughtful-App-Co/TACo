import { z } from 'zod';

/**
 * OCEAN/Big Five Personality Schema
 * Based on the Big Five Inventory (BFI-44)
 *
 * The Big Five traits are:
 * - Openness to Experience (O): Imagination, curiosity, open-mindedness
 * - Conscientiousness (C): Organization, dependability, self-discipline
 * - Extraversion (E): Sociability, assertiveness, positive emotionality
 * - Agreeableness (A): Cooperation, trust, empathy
 * - Neuroticism (N): Anxiety, emotional instability, moodiness
 */

// OCEAN trait type
export type OceanTrait =
  | 'openness'
  | 'conscientiousness'
  | 'extraversion'
  | 'agreeableness'
  | 'neuroticism';

// Individual trait score with metadata
export interface OceanTraitScore {
  score: number; // Raw score (sum of item responses, adjusted for reverse scoring)
  percentage: number; // Normalized to 0-100 scale
  level: 'low' | 'moderate' | 'high'; // Categorical interpretation
  title: string; // Human-readable trait name
  description: string; // What this trait means
  facets?: string[]; // Sub-facets of the trait
}

// Complete OCEAN profile
export interface OceanProfile {
  openness: OceanTraitScore;
  conscientiousness: OceanTraitScore;
  extraversion: OceanTraitScore;
  agreeableness: OceanTraitScore;
  neuroticism: OceanTraitScore;
}

// BFI Question structure
export interface BfiQuestion {
  id: number; // Question number (1-44)
  text: string; // "I see myself as someone who..."
  trait: OceanTrait; // Which trait this measures
  reversed: boolean; // Whether scoring is reversed (1=5, 2=4, etc.)
}

// User's answer to a question (1-5 Likert scale)
export type BfiAnswer = 1 | 2 | 3 | 4 | 5 | null;

// OCEAN Archetype based on trait combinations
export interface OceanArchetype {
  id: string;
  title: string;
  description: string;
  traits: {
    primary: OceanTrait;
    primaryLevel: 'high' | 'low';
    secondary?: OceanTrait;
    secondaryLevel?: 'high' | 'low';
  };
  strengths: string[];
  workStyle: string;
}

// Zod schemas for validation
export const OceanTraitSchema = z.enum([
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
]);

export const BfiAnswerSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.null(),
]);

export const OceanTraitScoreSchema = z.object({
  score: z.number(),
  percentage: z.number().min(0).max(100),
  level: z.enum(['low', 'moderate', 'high']),
  title: z.string(),
  description: z.string(),
  facets: z.array(z.string()).optional(),
});

export const OceanProfileSchema = z.object({
  openness: OceanTraitScoreSchema,
  conscientiousness: OceanTraitScoreSchema,
  extraversion: OceanTraitScoreSchema,
  agreeableness: OceanTraitScoreSchema,
  neuroticism: OceanTraitScoreSchema,
});

export const OceanAssessmentResultSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  completedAt: z.date(),
  answers: z.array(BfiAnswerSchema),
  profile: OceanProfileSchema,
  archetype: z
    .object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
    })
    .optional(),
});

// Type exports from Zod schemas
export type OceanAssessmentResult = z.infer<typeof OceanAssessmentResultSchema>;

// Trait metadata for UI display
export const OCEAN_TRAIT_META: Record<
  OceanTrait,
  {
    title: string;
    shortCode: string;
    highLabel: string;
    lowLabel: string;
    description: string;
    facets: string[];
  }
> = {
  openness: {
    title: 'Openness to Experience',
    shortCode: 'O',
    highLabel: 'Curious & Creative',
    lowLabel: 'Practical & Conventional',
    description: 'Reflects imagination, creativity, and openness to new ideas and experiences.',
    facets: ['Fantasy', 'Aesthetics', 'Feelings', 'Actions', 'Ideas', 'Values'],
  },
  conscientiousness: {
    title: 'Conscientiousness',
    shortCode: 'C',
    highLabel: 'Organized & Disciplined',
    lowLabel: 'Flexible & Spontaneous',
    description: 'Reflects organization, dependability, and goal-directed behavior.',
    facets: [
      'Competence',
      'Order',
      'Dutifulness',
      'Achievement Striving',
      'Self-Discipline',
      'Deliberation',
    ],
  },
  extraversion: {
    title: 'Extraversion',
    shortCode: 'E',
    highLabel: 'Outgoing & Energetic',
    lowLabel: 'Reserved & Reflective',
    description: 'Reflects sociability, assertiveness, and positive emotionality.',
    facets: [
      'Warmth',
      'Gregariousness',
      'Assertiveness',
      'Activity',
      'Excitement-Seeking',
      'Positive Emotions',
    ],
  },
  agreeableness: {
    title: 'Agreeableness',
    shortCode: 'A',
    highLabel: 'Cooperative & Trusting',
    lowLabel: 'Competitive & Skeptical',
    description: 'Reflects cooperation, trust, and concern for social harmony.',
    facets: [
      'Trust',
      'Straightforwardness',
      'Altruism',
      'Compliance',
      'Modesty',
      'Tender-Mindedness',
    ],
  },
  neuroticism: {
    title: 'Neuroticism',
    shortCode: 'N',
    highLabel: 'Sensitive & Vigilant',
    lowLabel: 'Calm & Resilient',
    description: 'Reflects emotional sensitivity, anxiety, and stress reactivity.',
    facets: [
      'Anxiety',
      'Angry Hostility',
      'Depression',
      'Self-Consciousness',
      'Impulsiveness',
      'Vulnerability',
    ],
  },
};

// Number of questions per trait in BFI-44
export const BFI_QUESTIONS_PER_TRAIT: Record<OceanTrait, number> = {
  openness: 10,
  conscientiousness: 9,
  extraversion: 8,
  agreeableness: 9,
  neuroticism: 8,
};

// Total questions in BFI-44
export const BFI_TOTAL_QUESTIONS = 44;
