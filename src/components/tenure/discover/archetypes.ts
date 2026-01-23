/**
 * RIASEC Hybrid Archetypes
 *
 * Defines personality archetype combinations based on RIASEC assessment results.
 * These archetypes combine the top two RIASEC types to create meaningful labels.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

export interface Archetype {
  title: string;
  description: string;
}

export const ARCHETYPES: Record<string, Archetype> = {
  // Pure Types (fallback if scores are very skewed)
  realistic: {
    title: 'The Maker',
    description: 'You thrive when building, fixing, and working with your hands.',
  },
  investigative: {
    title: 'The Thinker',
    description: 'You analyze, research, and solve complex problems logically.',
  },
  artistic: {
    title: 'The Creator',
    description: 'You express yourself through innovative design and creative works.',
  },
  social: {
    title: 'The Helper',
    description: 'You empower others through teaching, healing, and guidance.',
  },
  enterprising: {
    title: 'The Persuader',
    description: 'You lead teams and sell ideas with energy and confidence.',
  },
  conventional: {
    title: 'The Organizer',
    description: 'You create order and efficiency through structured systems.',
  },
  // Hybrid Combinations (sorted alphabetically by key for lookup)
  'investigative-realistic': {
    title: 'The Engineer',
    description:
      'You combine practical skills with analytical depth to build functional solutions.',
  },
  'artistic-realistic': {
    title: 'The Artisan',
    description: 'You craft beautiful, tangible objects with skill and creative flair.',
  },
  'realistic-social': {
    title: 'The Service Technician',
    description: 'You use practical skills to directly help others in tangible ways.',
  },
  'enterprising-realistic': {
    title: 'The Contractor',
    description: 'You manage projects and lead teams in hands-on environments.',
  },
  'conventional-realistic': {
    title: 'The Builder',
    description: 'You execute precise, structured work with tangible materials.',
  },
  'artistic-investigative': {
    title: 'The Architect',
    description: 'You merge creative vision with rigorous logic to design complex systems.',
  },
  'investigative-social': {
    title: 'The Diagnostician',
    description: 'You analyze problems to provide deep care and understanding for people.',
  },
  'enterprising-investigative': {
    title: 'The Strategist',
    description: 'You use data and analysis to lead organizations toward success.',
  },
  'conventional-investigative': {
    title: 'The Analyst',
    description: 'You organize data and systems with scientific precision.',
  },
  'artistic-social': {
    title: 'The Teacher',
    description: 'You use creativity to inspire and educate others.',
  },
  'artistic-enterprising': {
    title: 'The Innovator',
    description: 'You turn creative ideas into marketable products and ventures.',
  },
  'artistic-conventional': {
    title: 'The Editor',
    description: 'You bring structure and polish to creative output.',
  },
  'enterprising-social': {
    title: 'The Community Leader',
    description: 'You bring people together to achieve shared goals through influence.',
  },
  'conventional-social': {
    title: 'The Administrator',
    description: 'You support people through efficient, well-managed systems.',
  },
  'conventional-enterprising': {
    title: 'The Executive',
    description: 'You manage business operations with structure and authority.',
  },
};

/**
 * Get the hybrid archetype for the top two RIASEC types.
 * Keys are sorted alphabetically for consistent lookup.
 */
export function getHybridArchetype(type1: string, type2: string): Archetype | null {
  const key = [type1, type2].sort().join('-');
  return ARCHETYPES[key] || null;
}
