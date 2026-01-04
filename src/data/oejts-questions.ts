import type { OejtsQuestion } from '../schemas/jungian.schema';
import { logger } from '../lib/logger';

const log = logger.create('OEJTS');

/**
 * Open-Source Jung Type Scales (OEJTS) Questions
 *
 * 32 questions measuring 4 dichotomies (8 questions each):
 * - E/I: Extraversion vs Introversion (energy source)
 * - S/N: Sensing vs Intuition (information gathering)
 * - T/F: Thinking vs Feeling (decision making)
 * - J/P: Judging vs Perceiving (lifestyle orientation)
 *
 * Scoring:
 * - 5-point Likert scale: 1 (Disagree) to 5 (Agree)
 * - Positive direction: Higher score favors the specified pole
 * - Negative direction: Higher score favors the opposite pole
 * - Neutral (3) = no preference
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

export const OEJTS_QUESTIONS: OejtsQuestion[] = [
  // ============================================================================
  // E/I: Extraversion vs Introversion (Questions 1-8)
  // ============================================================================
  {
    id: 1,
    text: 'I gain energy from being around other people',
    dichotomy: 'EI',
    direction: 'positive',
    pole: 'E',
  },
  {
    id: 2,
    text: 'I prefer to work alone rather than in groups',
    dichotomy: 'EI',
    direction: 'positive',
    pole: 'I',
  },
  {
    id: 3,
    text: 'I enjoy being the center of attention',
    dichotomy: 'EI',
    direction: 'positive',
    pole: 'E',
  },
  {
    id: 4,
    text: 'I need time alone to recharge my energy',
    dichotomy: 'EI',
    direction: 'positive',
    pole: 'I',
  },
  {
    id: 5,
    text: 'I feel comfortable starting conversations with strangers',
    dichotomy: 'EI',
    direction: 'positive',
    pole: 'E',
  },
  {
    id: 6,
    text: 'I think things through carefully before speaking',
    dichotomy: 'EI',
    direction: 'positive',
    pole: 'I',
  },
  {
    id: 7,
    text: 'I prefer a wide circle of acquaintances over a few close friends',
    dichotomy: 'EI',
    direction: 'positive',
    pole: 'E',
  },
  {
    id: 8,
    text: 'I find too much social interaction draining',
    dichotomy: 'EI',
    direction: 'positive',
    pole: 'I',
  },

  // ============================================================================
  // S/N: Sensing vs Intuition (Questions 9-16)
  // ============================================================================
  {
    id: 9,
    text: 'I focus on concrete facts and details rather than possibilities',
    dichotomy: 'SN',
    direction: 'positive',
    pole: 'S',
  },
  {
    id: 10,
    text: 'I enjoy exploring abstract concepts and theories',
    dichotomy: 'SN',
    direction: 'positive',
    pole: 'N',
  },
  {
    id: 11,
    text: 'I prefer practical, hands-on solutions',
    dichotomy: 'SN',
    direction: 'positive',
    pole: 'S',
  },
  {
    id: 12,
    text: 'I often think about future possibilities and potential',
    dichotomy: 'SN',
    direction: 'positive',
    pole: 'N',
  },
  {
    id: 13,
    text: 'I trust what I can see, hear, and touch',
    dichotomy: 'SN',
    direction: 'positive',
    pole: 'S',
  },
  {
    id: 14,
    text: 'I rely on hunches and gut feelings when making decisions',
    dichotomy: 'SN',
    direction: 'positive',
    pole: 'N',
  },
  {
    id: 15,
    text: 'I prefer step-by-step instructions over big-picture overviews',
    dichotomy: 'SN',
    direction: 'positive',
    pole: 'S',
  },
  {
    id: 16,
    text: 'I enjoy imagining innovative solutions to problems',
    dichotomy: 'SN',
    direction: 'positive',
    pole: 'N',
  },

  // ============================================================================
  // T/F: Thinking vs Feeling (Questions 17-24)
  // ============================================================================
  {
    id: 17,
    text: 'I make decisions based on logic and objective analysis',
    dichotomy: 'TF',
    direction: 'positive',
    pole: 'T',
  },
  {
    id: 18,
    text: 'I consider how decisions will affect people emotionally',
    dichotomy: 'TF',
    direction: 'positive',
    pole: 'F',
  },
  {
    id: 19,
    text: 'I value truth and accuracy over harmony',
    dichotomy: 'TF',
    direction: 'positive',
    pole: 'T',
  },
  {
    id: 20,
    text: 'I prioritize maintaining good relationships over being right',
    dichotomy: 'TF',
    direction: 'positive',
    pole: 'F',
  },
  {
    id: 21,
    text: 'I prefer to analyze problems objectively rather than emotionally',
    dichotomy: 'TF',
    direction: 'positive',
    pole: 'T',
  },
  {
    id: 22,
    text: 'I am guided by my values and what feels right',
    dichotomy: 'TF',
    direction: 'positive',
    pole: 'F',
  },
  {
    id: 23,
    text: 'I believe firm logic is more important than tact',
    dichotomy: 'TF',
    direction: 'positive',
    pole: 'T',
  },
  {
    id: 24,
    text: "I am sensitive to others' feelings and emotions",
    dichotomy: 'TF',
    direction: 'positive',
    pole: 'F',
  },

  // ============================================================================
  // J/P: Judging vs Perceiving (Questions 25-32)
  // ============================================================================
  {
    id: 25,
    text: 'I prefer to plan things in advance',
    dichotomy: 'JP',
    direction: 'positive',
    pole: 'J',
  },
  {
    id: 26,
    text: 'I like to keep my options open and be spontaneous',
    dichotomy: 'JP',
    direction: 'positive',
    pole: 'P',
  },
  {
    id: 27,
    text: 'I feel more comfortable when things are organized and settled',
    dichotomy: 'JP',
    direction: 'positive',
    pole: 'J',
  },
  {
    id: 28,
    text: 'I adapt easily to changing circumstances',
    dichotomy: 'JP',
    direction: 'positive',
    pole: 'P',
  },
  {
    id: 29,
    text: 'I like to complete tasks well before deadlines',
    dichotomy: 'JP',
    direction: 'positive',
    pole: 'J',
  },
  {
    id: 30,
    text: 'I work best under pressure and close to deadlines',
    dichotomy: 'JP',
    direction: 'positive',
    pole: 'P',
  },
  {
    id: 31,
    text: 'I prefer clear structure and defined expectations',
    dichotomy: 'JP',
    direction: 'positive',
    pole: 'J',
  },
  {
    id: 32,
    text: 'I enjoy exploring new approaches without a fixed plan',
    dichotomy: 'JP',
    direction: 'positive',
    pole: 'P',
  },
];

/**
 * Validation: Ensure we have exactly 8 questions per dichotomy
 */
const validateQuestions = () => {
  const counts = {
    EI: OEJTS_QUESTIONS.filter((q) => q.dichotomy === 'EI').length,
    SN: OEJTS_QUESTIONS.filter((q) => q.dichotomy === 'SN').length,
    TF: OEJTS_QUESTIONS.filter((q) => q.dichotomy === 'TF').length,
    JP: OEJTS_QUESTIONS.filter((q) => q.dichotomy === 'JP').length,
  };

  const errors: string[] = [];
  Object.entries(counts).forEach(([key, count]) => {
    if (count !== 8) {
      errors.push(`${key} has ${count} questions (expected 8)`);
    }
  });

  if (errors.length > 0) {
    log.error('OEJTS Questions validation failed:', errors);
  }

  return errors.length === 0;
};

// Run validation in development
if (import.meta.env.DEV) {
  validateQuestions();
}
