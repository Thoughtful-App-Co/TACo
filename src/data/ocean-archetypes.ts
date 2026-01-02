import { OceanArchetype, OceanTrait, OceanProfile } from '../schemas/ocean.schema';

/**
 * OCEAN Archetypes
 *
 * Personality archetypes based on combinations of Big Five traits.
 * Used to give users a memorable, relatable label for their personality profile.
 */

export const OCEAN_ARCHETYPES: OceanArchetype[] = [
  // High Openness combinations
  {
    id: 'explorer',
    title: 'The Explorer',
    description:
      'Curious and emotionally grounded, you thrive when discovering new ideas, places, and perspectives. Your stability allows you to venture boldly into the unknown.',
    traits: {
      primary: 'openness',
      primaryLevel: 'high',
      secondary: 'neuroticism',
      secondaryLevel: 'low',
    },
    strengths: ['Innovation', 'Adaptability', 'Intellectual curiosity', 'Calm under pressure'],
    workStyle: 'Best in roles requiring creativity, research, or strategic thinking with autonomy.',
  },
  {
    id: 'visionary',
    title: 'The Visionary',
    description:
      'Creative and outgoing, you inspire others with your ideas and enthusiasm. You see possibilities where others see obstacles.',
    traits: {
      primary: 'openness',
      primaryLevel: 'high',
      secondary: 'extraversion',
      secondaryLevel: 'high',
    },
    strengths: ['Creative leadership', 'Inspiring others', 'Big-picture thinking', 'Networking'],
    workStyle: 'Best in roles combining innovation with collaboration and public engagement.',
  },
  {
    id: 'philosopher',
    title: 'The Philosopher',
    description:
      'Deeply curious yet introspective, you prefer exploring ideas in depth rather than breadth. You value meaningful insights over surface-level novelty.',
    traits: {
      primary: 'openness',
      primaryLevel: 'high',
      secondary: 'extraversion',
      secondaryLevel: 'low',
    },
    strengths: [
      'Deep analysis',
      'Original thinking',
      'Written communication',
      'Independent research',
    ],
    workStyle: 'Best in roles requiring deep expertise, writing, or solitary creative work.',
  },

  // High Conscientiousness combinations
  {
    id: 'achiever',
    title: 'The Achiever',
    description:
      'Disciplined and emotionally stable, you set ambitious goals and consistently reach them. Your reliability makes you a cornerstone of any team.',
    traits: {
      primary: 'conscientiousness',
      primaryLevel: 'high',
      secondary: 'neuroticism',
      secondaryLevel: 'low',
    },
    strengths: ['Goal achievement', 'Stress management', 'Reliability', 'Long-term planning'],
    workStyle:
      'Best in roles with clear objectives, measurable outcomes, and leadership responsibility.',
  },
  {
    id: 'director',
    title: 'The Director',
    description:
      'Organized and assertive, you excel at coordinating people and projects. You bring structure to chaos and keep teams on track.',
    traits: {
      primary: 'conscientiousness',
      primaryLevel: 'high',
      secondary: 'extraversion',
      secondaryLevel: 'high',
    },
    strengths: ['Project management', 'Team leadership', 'Process optimization', 'Delegation'],
    workStyle: 'Best in management, operations, or coordination roles with team interaction.',
  },
  {
    id: 'specialist',
    title: 'The Specialist',
    description:
      'Methodical and focused, you develop deep expertise through disciplined practice. You prefer mastery over breadth.',
    traits: {
      primary: 'conscientiousness',
      primaryLevel: 'high',
      secondary: 'extraversion',
      secondaryLevel: 'low',
    },
    strengths: ['Technical mastery', 'Attention to detail', 'Quality focus', 'Independent work'],
    workStyle: 'Best in technical, analytical, or craft-based roles requiring deep expertise.',
  },

  // High Extraversion combinations
  {
    id: 'connector',
    title: 'The Connector',
    description:
      'Outgoing and warm, you build bridges between people and create inclusive environments. Your energy is contagious.',
    traits: {
      primary: 'extraversion',
      primaryLevel: 'high',
      secondary: 'agreeableness',
      secondaryLevel: 'high',
    },
    strengths: ['Relationship building', 'Team morale', 'Conflict mediation', 'Community building'],
    workStyle: 'Best in people-focused roles: HR, customer success, community management, sales.',
  },
  {
    id: 'catalyst',
    title: 'The Catalyst',
    description:
      "Energetic and direct, you drive action and aren't afraid to challenge the status quo. You make things happen.",
    traits: {
      primary: 'extraversion',
      primaryLevel: 'high',
      secondary: 'agreeableness',
      secondaryLevel: 'low',
    },
    strengths: ['Driving change', 'Assertive communication', 'Competitive edge', 'Quick decisions'],
    workStyle: 'Best in sales, entrepreneurship, or leadership roles requiring bold action.',
  },

  // High Agreeableness combinations
  {
    id: 'counselor',
    title: 'The Counselor',
    description:
      'Compassionate and insightful, you help others navigate challenges with empathy and wisdom. People trust you with their problems.',
    traits: {
      primary: 'agreeableness',
      primaryLevel: 'high',
      secondary: 'openness',
      secondaryLevel: 'high',
    },
    strengths: ['Empathy', 'Active listening', 'Conflict resolution', 'Mentoring'],
    workStyle: 'Best in helping professions: coaching, counseling, teaching, healthcare.',
  },
  {
    id: 'supporter',
    title: 'The Supporter',
    description:
      "Reliable and cooperative, you're the backbone of any team. You ensure everyone has what they need to succeed.",
    traits: {
      primary: 'agreeableness',
      primaryLevel: 'high',
      secondary: 'conscientiousness',
      secondaryLevel: 'high',
    },
    strengths: ['Teamwork', 'Dependability', 'Service orientation', "Attention to others' needs"],
    workStyle: 'Best in support, administrative, or service roles with clear processes.',
  },

  // High Neuroticism combinations (reframed positively)
  {
    id: 'sentinel',
    title: 'The Sentinel',
    description:
      'Vigilant and detail-oriented, you notice problems before others do. Your sensitivity to risk helps teams avoid pitfalls.',
    traits: {
      primary: 'neuroticism',
      primaryLevel: 'high',
      secondary: 'conscientiousness',
      secondaryLevel: 'high',
    },
    strengths: ['Risk assessment', 'Quality control', 'Anticipating problems', 'Thoroughness'],
    workStyle: 'Best in quality assurance, compliance, editing, or risk management roles.',
  },
  {
    id: 'artist',
    title: 'The Artist',
    description:
      'Emotionally deep and creative, you channel intense feelings into meaningful work. Your sensitivity fuels your art.',
    traits: {
      primary: 'neuroticism',
      primaryLevel: 'high',
      secondary: 'openness',
      secondaryLevel: 'high',
    },
    strengths: ['Emotional depth', 'Creative expression', 'Authenticity', 'Artistic sensitivity'],
    workStyle: 'Best in creative fields where emotional authenticity is valued.',
  },

  // Low trait combinations
  {
    id: 'pragmatist',
    title: 'The Pragmatist',
    description:
      "Practical and grounded, you focus on what works rather than what's novel. You value proven methods and tangible results.",
    traits: {
      primary: 'openness',
      primaryLevel: 'low',
      secondary: 'conscientiousness',
      secondaryLevel: 'high',
    },
    strengths: ['Practical solutions', 'Consistency', 'Risk aversion', 'Operational excellence'],
    workStyle:
      'Best in operational, administrative, or maintenance roles with established processes.',
  },
  {
    id: 'free-spirit',
    title: 'The Free Spirit',
    description:
      "Flexible and adaptable, you go with the flow and don't sweat the small stuff. You thrive in dynamic environments.",
    traits: {
      primary: 'conscientiousness',
      primaryLevel: 'low',
      secondary: 'openness',
      secondaryLevel: 'high',
    },
    strengths: ['Adaptability', 'Spontaneity', 'Stress tolerance', 'Creative improvisation'],
    workStyle: 'Best in creative, startup, or fast-changing environments without rigid structure.',
  },
  {
    id: 'analyst',
    title: 'The Analyst',
    description:
      'Logical and independent, you make decisions based on data rather than emotion. You value objectivity and efficiency.',
    traits: {
      primary: 'agreeableness',
      primaryLevel: 'low',
      secondary: 'conscientiousness',
      secondaryLevel: 'high',
    },
    strengths: ['Objective analysis', 'Tough decisions', 'Efficiency focus', 'Critical thinking'],
    workStyle: 'Best in analytical, financial, or technical roles requiring objectivity.',
  },
  {
    id: 'observer',
    title: 'The Observer',
    description:
      'Quiet and perceptive, you understand situations deeply before engaging. Your reserve is a source of strength.',
    traits: {
      primary: 'extraversion',
      primaryLevel: 'low',
      secondary: 'openness',
      secondaryLevel: 'high',
    },
    strengths: ['Deep observation', 'Thoughtful analysis', 'Written over verbal', 'Focus'],
    workStyle: 'Best in research, writing, analysis, or backend roles with limited meetings.',
  },
];

/**
 * Find the best matching archetype for an OCEAN profile
 */
export function findOceanArchetype(profile: OceanProfile): OceanArchetype {
  // Get traits sorted by percentage
  const traits = [
    {
      trait: 'openness' as OceanTrait,
      pct: profile.openness.percentage,
      level: profile.openness.level,
    },
    {
      trait: 'conscientiousness' as OceanTrait,
      pct: profile.conscientiousness.percentage,
      level: profile.conscientiousness.level,
    },
    {
      trait: 'extraversion' as OceanTrait,
      pct: profile.extraversion.percentage,
      level: profile.extraversion.level,
    },
    {
      trait: 'agreeableness' as OceanTrait,
      pct: profile.agreeableness.percentage,
      level: profile.agreeableness.level,
    },
    {
      trait: 'neuroticism' as OceanTrait,
      pct: profile.neuroticism.percentage,
      level: profile.neuroticism.level,
    },
  ].sort((a, b) => b.pct - a.pct);

  const highestTrait = traits[0];
  const lowestTrait = traits[traits.length - 1];

  // Find archetype matching primary high trait
  let bestMatch = OCEAN_ARCHETYPES.find((arch) => {
    if (arch.traits.primary !== highestTrait.trait || arch.traits.primaryLevel !== 'high') {
      return false;
    }
    // Check secondary trait match if specified
    if (arch.traits.secondary && arch.traits.secondaryLevel) {
      const secondaryProfile = profile[arch.traits.secondary];
      const secondaryMatch =
        arch.traits.secondaryLevel === 'high'
          ? secondaryProfile.level === 'high'
          : secondaryProfile.level === 'low';
      return secondaryMatch;
    }
    return true;
  });

  // If no match found with secondary, find by primary only
  if (!bestMatch) {
    bestMatch = OCEAN_ARCHETYPES.find(
      (arch) => arch.traits.primary === highestTrait.trait && arch.traits.primaryLevel === 'high'
    );
  }

  // If still no match, try matching on lowest trait being low
  if (!bestMatch) {
    bestMatch = OCEAN_ARCHETYPES.find(
      (arch) => arch.traits.primary === lowestTrait.trait && arch.traits.primaryLevel === 'low'
    );
  }

  // Fallback to Explorer if nothing matches
  return bestMatch || OCEAN_ARCHETYPES[0];
}

/**
 * Get archetype by ID
 */
export function getArchetypeById(id: string): OceanArchetype | undefined {
  return OCEAN_ARCHETYPES.find((arch) => arch.id === id);
}

export default OCEAN_ARCHETYPES;
