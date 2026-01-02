import { BfiQuestion, OceanTrait } from '../schemas/ocean.schema';

/**
 * Big Five Inventory (BFI-44)
 *
 * Original: John, O. P., & Srivastava, S. (1999). The Big Five trait taxonomy.
 *
 * All items begin with "I see myself as someone who..."
 *
 * Scoring: 1 = Disagree strongly, 2 = Disagree a little, 3 = Neither agree nor disagree,
 *          4 = Agree a little, 5 = Agree strongly
 *
 * R = Reverse-scored item (1=5, 2=4, 3=3, 4=2, 5=1)
 */

export const BFI_QUESTIONS: BfiQuestion[] = [
  // Extraversion items: 1, 6R, 11, 16, 21R, 26, 31R, 36
  { id: 1, text: 'Is talkative', trait: 'extraversion', reversed: false },
  { id: 6, text: 'Is reserved', trait: 'extraversion', reversed: true },
  { id: 11, text: 'Is full of energy', trait: 'extraversion', reversed: false },
  { id: 16, text: 'Generates a lot of enthusiasm', trait: 'extraversion', reversed: false },
  { id: 21, text: 'Tends to be quiet', trait: 'extraversion', reversed: true },
  { id: 26, text: 'Has an assertive personality', trait: 'extraversion', reversed: false },
  { id: 31, text: 'Is sometimes shy, inhibited', trait: 'extraversion', reversed: true },
  { id: 36, text: 'Is outgoing, sociable', trait: 'extraversion', reversed: false },

  // Agreeableness items: 2R, 7, 12R, 17, 22, 27R, 32, 37R, 42
  { id: 2, text: 'Tends to find fault with others', trait: 'agreeableness', reversed: true },
  { id: 7, text: 'Is helpful and unselfish with others', trait: 'agreeableness', reversed: false },
  { id: 12, text: 'Starts quarrels with others', trait: 'agreeableness', reversed: true },
  { id: 17, text: 'Has a forgiving nature', trait: 'agreeableness', reversed: false },
  { id: 22, text: 'Is generally trusting', trait: 'agreeableness', reversed: false },
  { id: 27, text: 'Can be cold and aloof', trait: 'agreeableness', reversed: true },
  {
    id: 32,
    text: 'Is considerate and kind to almost everyone',
    trait: 'agreeableness',
    reversed: false,
  },
  { id: 37, text: 'Is sometimes rude to others', trait: 'agreeableness', reversed: true },
  { id: 42, text: 'Likes to cooperate with others', trait: 'agreeableness', reversed: false },

  // Conscientiousness items: 3, 8R, 13, 18R, 23R, 28, 33, 38, 43R
  { id: 3, text: 'Does a thorough job', trait: 'conscientiousness', reversed: false },
  { id: 8, text: 'Can be somewhat careless', trait: 'conscientiousness', reversed: true },
  { id: 13, text: 'Is a reliable worker', trait: 'conscientiousness', reversed: false },
  { id: 18, text: 'Tends to be disorganized', trait: 'conscientiousness', reversed: true },
  { id: 23, text: 'Tends to be lazy', trait: 'conscientiousness', reversed: true },
  {
    id: 28,
    text: 'Perseveres until the task is finished',
    trait: 'conscientiousness',
    reversed: false,
  },
  { id: 33, text: 'Does things efficiently', trait: 'conscientiousness', reversed: false },
  {
    id: 38,
    text: 'Makes plans and follows through with them',
    trait: 'conscientiousness',
    reversed: false,
  },
  { id: 43, text: 'Is easily distracted', trait: 'conscientiousness', reversed: true },

  // Neuroticism items: 4, 9R, 14, 19, 24R, 29, 34R, 39
  { id: 4, text: 'Is depressed, blue', trait: 'neuroticism', reversed: false },
  { id: 9, text: 'Is relaxed, handles stress well', trait: 'neuroticism', reversed: true },
  { id: 14, text: 'Can be tense', trait: 'neuroticism', reversed: false },
  { id: 19, text: 'Worries a lot', trait: 'neuroticism', reversed: false },
  { id: 24, text: 'Is emotionally stable, not easily upset', trait: 'neuroticism', reversed: true },
  { id: 29, text: 'Can be moody', trait: 'neuroticism', reversed: false },
  { id: 34, text: 'Remains calm in tense situations', trait: 'neuroticism', reversed: true },
  { id: 39, text: 'Gets nervous easily', trait: 'neuroticism', reversed: false },

  // Openness items: 5, 10, 15, 20, 25, 30, 35R, 40, 41R, 44
  { id: 5, text: 'Is original, comes up with new ideas', trait: 'openness', reversed: false },
  { id: 10, text: 'Is curious about many different things', trait: 'openness', reversed: false },
  { id: 15, text: 'Is ingenious, a deep thinker', trait: 'openness', reversed: false },
  { id: 20, text: 'Has an active imagination', trait: 'openness', reversed: false },
  { id: 25, text: 'Is inventive', trait: 'openness', reversed: false },
  { id: 30, text: 'Values artistic, aesthetic experiences', trait: 'openness', reversed: false },
  { id: 35, text: 'Prefers work that is routine', trait: 'openness', reversed: true },
  { id: 40, text: 'Likes to reflect, play with ideas', trait: 'openness', reversed: false },
  { id: 41, text: 'Has few artistic interests', trait: 'openness', reversed: true },
  {
    id: 44,
    text: 'Is sophisticated in art, music, or literature',
    trait: 'openness',
    reversed: false,
  },
];

// Get questions sorted by ID for sequential presentation
export const BFI_QUESTIONS_SORTED = [...BFI_QUESTIONS].sort((a, b) => a.id - b.id);

// Get questions grouped by trait
export const BFI_QUESTIONS_BY_TRAIT: Record<OceanTrait, BfiQuestion[]> = {
  openness: BFI_QUESTIONS.filter((q) => q.trait === 'openness'),
  conscientiousness: BFI_QUESTIONS.filter((q) => q.trait === 'conscientiousness'),
  extraversion: BFI_QUESTIONS.filter((q) => q.trait === 'extraversion'),
  agreeableness: BFI_QUESTIONS.filter((q) => q.trait === 'agreeableness'),
  neuroticism: BFI_QUESTIONS.filter((q) => q.trait === 'neuroticism'),
};

// Question stem that precedes all items
export const BFI_QUESTION_STEM = 'I see myself as someone who...';

// Response options for the 5-point Likert scale
export const BFI_RESPONSE_OPTIONS = [
  { value: 1, label: 'Disagree strongly', shortLabel: 'Strongly Disagree' },
  { value: 2, label: 'Disagree a little', shortLabel: 'Disagree' },
  { value: 3, label: 'Neither agree nor disagree', shortLabel: 'Neutral' },
  { value: 4, label: 'Agree a little', shortLabel: 'Agree' },
  { value: 5, label: 'Agree strongly', shortLabel: 'Strongly Agree' },
] as const;
