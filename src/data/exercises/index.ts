/**
 * Exercise Library - Lazy-loaded by body part
 *
 * This module provides on-demand loading of exercise data
 * to minimize initial bundle size.
 */

import type { Exercise } from '../../schemas/echoprax.schema';

export type BodyPart =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'cardio'
  | 'full_body'
  | 'flexibility';

export interface CategoryManifest {
  id: BodyPart;
  name: string;
  count: number;
  loader: () => Promise<unknown>;
}

/**
 * Exercise category manifest - metadata loaded immediately,
 * actual exercises loaded on-demand
 */
export const exerciseManifest: Record<BodyPart, CategoryManifest> = {
  chest: {
    id: 'chest',
    name: 'Chest',
    count: 25,
    loader: () => import('./chest.json'),
  },
  back: {
    id: 'back',
    name: 'Back',
    count: 35,
    loader: () => import('./back.json'),
  },
  legs: {
    id: 'legs',
    name: 'Legs',
    count: 50,
    loader: () => import('./legs.json'),
  },
  shoulders: {
    id: 'shoulders',
    name: 'Shoulders',
    count: 22,
    loader: () => import('./shoulders.json'),
  },
  arms: {
    id: 'arms',
    name: 'Arms',
    count: 26,
    loader: () => import('./arms.json'),
  },
  core: {
    id: 'core',
    name: 'Core',
    count: 33,
    loader: () => import('./core.json'),
  },
  cardio: {
    id: 'cardio',
    name: 'Cardio',
    count: 27,
    loader: () => import('./cardio.json'),
  },
  full_body: {
    id: 'full_body',
    name: 'Full Body',
    count: 25,
    loader: () => import('./full-body.json'),
  },
  flexibility: {
    id: 'flexibility',
    name: 'Flexibility & Mobility',
    count: 25,
    loader: () => import('./flexibility.json'),
  },
};

// Cache for loaded categories
const categoryCache = new Map<BodyPart, Exercise[]>();

/**
 * Get exercises for a specific body part (lazy loaded)
 */
export async function getExercisesByBodyPart(bodyPart: BodyPart): Promise<Exercise[]> {
  if (categoryCache.has(bodyPart)) {
    return categoryCache.get(bodyPart)!;
  }

  const manifest = exerciseManifest[bodyPart];
  if (!manifest) {
    return [];
  }

  const data = (await manifest.loader()) as {
    default?: { exercises: Exercise[] };
    exercises?: Exercise[];
  };
  const exercises = data.default?.exercises ?? data.exercises ?? [];
  categoryCache.set(bodyPart, exercises as Exercise[]);
  return exercises as Exercise[];
}

/**
 * Get exercises for multiple body parts
 */
export async function getExercisesByBodyParts(bodyParts: BodyPart[]): Promise<Exercise[]> {
  const results = await Promise.all(bodyParts.map(getExercisesByBodyPart));
  return results.flat();
}

/**
 * Get all exercises (loads all categories)
 */
export async function getAllExercises(): Promise<Exercise[]> {
  const allBodyParts = Object.keys(exerciseManifest) as BodyPart[];
  return getExercisesByBodyParts(allBodyParts);
}

interface SearchIndexEntry {
  id: string;
  name: string;
  bodyPart: BodyPart;
}

interface SearchIndex {
  exercises: SearchIndexEntry[];
}

/**
 * Search exercise index (lightweight, for search suggestions)
 * This uses a prebuilt index that loads quickly
 */
export async function searchExerciseIndex(query: string): Promise<SearchIndexEntry[]> {
  const indexModule = await import('./search-index.json');
  const index = indexModule as unknown as SearchIndex;
  const lowerQuery = query.toLowerCase();
  return index.exercises.filter((e) => e.name.toLowerCase().includes(lowerQuery));
}

/**
 * Get total exercise count without loading all data
 */
export function getTotalExerciseCount(): number {
  return Object.values(exerciseManifest).reduce((sum, cat) => sum + cat.count, 0);
}

/**
 * Get category list for UI
 */
export function getCategories(): Array<{ id: BodyPart; name: string; count: number }> {
  return Object.values(exerciseManifest).map(({ id, name, count }) => ({
    id,
    name,
    count,
  }));
}

/**
 * Clear the exercise cache (useful for testing or forcing refresh)
 */
export function clearExerciseCache(): void {
  categoryCache.clear();
}

/**
 * Preload specific categories in background
 */
export async function preloadCategories(bodyParts: BodyPart[]): Promise<void> {
  await Promise.all(bodyParts.map(getExercisesByBodyPart));
}
