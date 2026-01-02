import { z } from 'zod';

/**
 * Jungian Cognitive Type Schema
 * Based on Open-Source Jung Type Scales (OEJTS)
 *
 * Note: This is an open-source implementation of Jungian typology.
 * Myers-Briggs Type Indicator® (MBTI®) is a registered trademark.
 *
 * The four dichotomies are:
 * - E/I: Extraversion vs Introversion (energy source)
 * - S/N: Sensing vs Intuition (information gathering)
 * - T/F: Thinking vs Feeling (decision making)
 * - J/P: Judging vs Perceiving (lifestyle orientation)
 *
 * Results in 16 possible types (e.g., INTJ, ENFP, ISTJ, etc.)
 */

// Individual dichotomy preferences
export type Dichotomy = 'EI' | 'SN' | 'TF' | 'JP';

// Letter codes for each preference
export type EI = 'E' | 'I'; // Extraversion / Introversion
export type SN = 'S' | 'N'; // Sensing / Intuition
export type TF = 'T' | 'F'; // Thinking / Feeling
export type JP = 'J' | 'P'; // Judging / Perceiving

// Complete 4-letter Jungian type (16 types based on OEJTS)
export type JungianType =
  | 'INTJ'
  | 'INTP'
  | 'ENTJ'
  | 'ENTP'
  | 'INFJ'
  | 'INFP'
  | 'ENFJ'
  | 'ENFP'
  | 'ISTJ'
  | 'ISFJ'
  | 'ESTJ'
  | 'ESFJ'
  | 'ISTP'
  | 'ISFP'
  | 'ESTP'
  | 'ESFP';

// Dichotomy score with strength indicator
export interface DichotomyScore {
  preference: string; // 'E' or 'I', 'S' or 'N', etc.
  score: number; // Raw score difference (-8 to +8)
  percentage: number; // Preference strength (50-100%)
  strength: 'slight' | 'moderate' | 'clear' | 'very clear'; // Categorical interpretation
}

// Complete Jungian type profile
export interface JungianProfile {
  type: JungianType; // 4-letter type code
  dichotomies: {
    EI: DichotomyScore; // Extraversion/Introversion
    SN: DichotomyScore; // Sensing/Intuition
    TF: DichotomyScore; // Thinking/Feeling
    JP: DichotomyScore; // Judging/Perceiving
  };
  dominantFunction: CognitiveFunction; // Primary cognitive function
  auxiliaryFunction: CognitiveFunction; // Secondary cognitive function
  temperament: Temperament; // Keirsey temperament
}

// Cognitive functions (Jungian stack)
export type CognitiveFunction =
  | 'Te' // Extraverted Thinking
  | 'Ti' // Introverted Thinking
  | 'Fe' // Extraverted Feeling
  | 'Fi' // Introverted Feeling
  | 'Se' // Extraverted Sensing
  | 'Si' // Introverted Sensing
  | 'Ne' // Extraverted Intuition
  | 'Ni'; // Introverted Intuition

// Keirsey temperaments
export type Temperament =
  | 'NT' // Rational (Intuitive Thinker)
  | 'NF' // Idealist (Intuitive Feeler)
  | 'SJ' // Guardian (Sensing Judger)
  | 'SP'; // Artisan (Sensing Perceiver)

// OEJTS Question structure
export interface OejtsQuestion {
  id: number; // Question number (1-32)
  text: string; // Question text
  dichotomy: Dichotomy; // Which dichotomy this measures
  direction: 'positive' | 'negative'; // Scoring direction
  pole: string; // Which pole this question favors (e.g., 'E', 'I', 'S', 'N')
}

// User's answer to a question (1-5 Likert scale)
export type OejtsAnswer = 1 | 2 | 3 | 4 | 5 | null;

// Jungian Type description with archetype
export interface JungianArchetype {
  type: JungianType;
  nickname: string; // e.g., "The Architect", "The Advocate"
  description: string; // Comprehensive description
  strengths: string[]; // Key strengths
  weaknesses: string[]; // Potential blind spots
  cognitiveStack: [CognitiveFunction, CognitiveFunction, CognitiveFunction, CognitiveFunction]; // Full function stack
  idealCareers: string[]; // Example career fits
  famousPeople: string[]; // Example famous people with this type
  workStyle: string; // How they approach work
  temperament: Temperament; // Keirsey temperament
}

// Zod schemas for validation
export const DichotomySchema = z.enum(['EI', 'SN', 'TF', 'JP']);

export const JungianTypeSchema = z.enum([
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
]);

export const CognitiveFunctionSchema = z.enum(['Te', 'Ti', 'Fe', 'Fi', 'Se', 'Si', 'Ne', 'Ni']);

export const TemperamentSchema = z.enum(['NT', 'NF', 'SJ', 'SP']);

export const OejtsAnswerSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.null(),
]);

export const DichotomyScoreSchema = z.object({
  preference: z.string(),
  score: z.number().min(-8).max(8),
  percentage: z.number().min(50).max(100),
  strength: z.enum(['slight', 'moderate', 'clear', 'very clear']),
});

export const JungianProfileSchema = z.object({
  type: JungianTypeSchema,
  dichotomies: z.object({
    EI: DichotomyScoreSchema,
    SN: DichotomyScoreSchema,
    TF: DichotomyScoreSchema,
    JP: DichotomyScoreSchema,
  }),
  dominantFunction: CognitiveFunctionSchema,
  auxiliaryFunction: CognitiveFunctionSchema,
  temperament: TemperamentSchema,
});

// Metadata for each dichotomy
export const DICHOTOMY_METADATA = {
  EI: {
    title: 'Energy Orientation',
    poles: {
      E: {
        label: 'Extraversion',
        description: 'Draws energy from external world, people, and activities',
        traits: ['Outgoing', 'Action-oriented', 'Sociable', 'Expressive'],
      },
      I: {
        label: 'Introversion',
        description: 'Draws energy from internal world, reflection, and solitude',
        traits: ['Reflective', 'Thoughtful', 'Reserved', 'Focused'],
      },
    },
  },
  SN: {
    title: 'Information Gathering',
    poles: {
      S: {
        label: 'Sensing',
        description: 'Focuses on concrete facts, details, and present realities',
        traits: ['Practical', 'Detail-oriented', 'Realistic', 'Hands-on'],
      },
      N: {
        label: 'Intuition',
        description: 'Focuses on patterns, possibilities, and future potential',
        traits: ['Imaginative', 'Abstract', 'Visionary', 'Conceptual'],
      },
    },
  },
  TF: {
    title: 'Decision Making',
    poles: {
      T: {
        label: 'Thinking',
        description: 'Makes decisions based on logic, analysis, and objective criteria',
        traits: ['Logical', 'Analytical', 'Objective', 'Critical'],
      },
      F: {
        label: 'Feeling',
        description: 'Makes decisions based on values, harmony, and impact on people',
        traits: ['Empathetic', 'Harmonious', 'Values-driven', 'Personal'],
      },
    },
  },
  JP: {
    title: 'Lifestyle Orientation',
    poles: {
      J: {
        label: 'Judging',
        description: 'Prefers structure, planning, and closure',
        traits: ['Organized', 'Structured', 'Decisive', 'Planned'],
      },
      P: {
        label: 'Perceiving',
        description: 'Prefers flexibility, spontaneity, and openness',
        traits: ['Flexible', 'Adaptable', 'Spontaneous', 'Open-ended'],
      },
    },
  },
} as const;

/**
 * Helper function to calculate preference strength
 * Based on raw score difference
 */
export function getPreferenceStrength(
  score: number
): 'slight' | 'moderate' | 'clear' | 'very clear' {
  const absScore = Math.abs(score);
  if (absScore >= 6) return 'very clear';
  if (absScore >= 4) return 'clear';
  if (absScore >= 2) return 'moderate';
  return 'slight';
}

/**
 * Helper function to calculate percentage from raw score
 * Score ranges from -8 to +8 (8 questions per dichotomy)
 */
export function scoreToPercentage(score: number): number {
  // Normalize to 50-100% range
  const absScore = Math.abs(score);
  return 50 + (absScore / 8) * 50;
}

/**
 * Helper function to determine dominant and auxiliary functions
 * Based on Jungian type
 */
export function getCognitiveFunctions(
  type: JungianType
): [CognitiveFunction, CognitiveFunction, CognitiveFunction, CognitiveFunction] {
  const functionStacks: Record<
    JungianType,
    [CognitiveFunction, CognitiveFunction, CognitiveFunction, CognitiveFunction]
  > = {
    INTJ: ['Ni', 'Te', 'Fi', 'Se'],
    INTP: ['Ti', 'Ne', 'Si', 'Fe'],
    ENTJ: ['Te', 'Ni', 'Se', 'Fi'],
    ENTP: ['Ne', 'Ti', 'Fe', 'Si'],
    INFJ: ['Ni', 'Fe', 'Ti', 'Se'],
    INFP: ['Fi', 'Ne', 'Si', 'Te'],
    ENFJ: ['Fe', 'Ni', 'Se', 'Ti'],
    ENFP: ['Ne', 'Fi', 'Te', 'Si'],
    ISTJ: ['Si', 'Te', 'Fi', 'Ne'],
    ISFJ: ['Si', 'Fe', 'Ti', 'Ne'],
    ESTJ: ['Te', 'Si', 'Ne', 'Fi'],
    ESFJ: ['Fe', 'Si', 'Ne', 'Ti'],
    ISTP: ['Ti', 'Se', 'Ni', 'Fe'],
    ISFP: ['Fi', 'Se', 'Ni', 'Te'],
    ESTP: ['Se', 'Ti', 'Fe', 'Ni'],
    ESFP: ['Se', 'Fi', 'Te', 'Ni'],
  };
  return functionStacks[type];
}

/**
 * Helper function to determine Keirsey temperament
 */
export function getTemperament(type: JungianType): Temperament {
  const secondLetter = type[1] as 'N' | 'S';
  const fourthLetter = type[3] as 'J' | 'P';

  if (secondLetter === 'N' && type[2] === 'T') return 'NT'; // Rational
  if (secondLetter === 'N' && type[2] === 'F') return 'NF'; // Idealist
  if (secondLetter === 'S' && fourthLetter === 'J') return 'SJ'; // Guardian
  if (secondLetter === 'S' && fourthLetter === 'P') return 'SP'; // Artisan
  return 'NT'; // Fallback
}
