/**
 * Exercise Library Service
 *
 * Provides exercise search and filtering based on workout areas.
 * Wraps the lazy-loaded exercise data from src/data/exercises/
 */

import type { Exercise, WorkoutArea, ExerciseConstraints } from '../../../schemas/echoprax.schema';
import {
  type BodyPart,
  getExercisesByBodyPart,
  getExercisesByBodyParts,
  getAllExercises,
  searchExerciseIndex,
  getCategories,
  getTotalExerciseCount,
  preloadCategories,
} from '../../../data/exercises';
import { logger } from '../../../lib/logger';

const log = logger.create('ExerciseLibrary');

export interface ExerciseFilterOptions {
  bodyParts?: BodyPart[];
  equipment?: string[];
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
  category?: ('strength' | 'cardio' | 'flexibility' | 'plyometric')[];
  tags?: string[];
  searchQuery?: string;
}

export interface FilteredExercise extends Exercise {
  /** Whether this exercise can be performed in the selected area */
  isAvailable: boolean;
  /** Equipment needed but not available */
  missingEquipment: string[];
  /** Constraint violations (e.g., "requires jumping") */
  constraintViolations: string[];
}

/**
 * Check if an exercise is compatible with area constraints
 */
function checkConstraintCompatibility(
  exercise: Exercise,
  areaConstraints: WorkoutArea['constraints']
): string[] {
  const violations: string[] = [];
  const ec = exercise.constraints;

  if (!ec) return violations;

  if (ec.requiresLyingDown && areaConstraints.noLyingDown) {
    violations.push('Requires lying down');
  }
  if (ec.requiresJumping && areaConstraints.noJumping) {
    violations.push('Requires jumping');
  }
  if (ec.requiresSprinting && areaConstraints.noSprinting) {
    violations.push('Requires sprinting');
  }
  if (ec.noiseLevel === 'loud' && areaConstraints.mustBeQuiet) {
    violations.push('Too loud');
  }
  if (ec.noiseLevel === 'moderate' && areaConstraints.mustBeQuiet) {
    violations.push('May be too loud');
  }
  if (ec.ceilingHeight === 'high' && areaConstraints.lowCeiling) {
    violations.push('Requires high ceiling');
  }
  if (ec.outdoorOnly && !areaConstraints.outdoorAvailable) {
    violations.push('Requires outdoor space');
  }

  return violations;
}

/**
 * Check if all required equipment is available
 */
function checkEquipmentAvailability(
  requiredEquipment: string[],
  availableEquipment: string[]
): string[] {
  return requiredEquipment.filter((eq) => !availableEquipment.includes(eq));
}

export class ExerciseLibraryService {
  /**
   * Get exercises filtered by a workout area's equipment and constraints
   */
  static async getExercisesForArea(
    area: WorkoutArea,
    options: ExerciseFilterOptions = {}
  ): Promise<FilteredExercise[]> {
    log.debug('Getting exercises for area', { areaId: area.id, options });

    // Load exercises based on body part filter
    let exercises: Exercise[];
    if (options.bodyParts && options.bodyParts.length > 0) {
      exercises = await getExercisesByBodyParts(options.bodyParts);
    } else {
      exercises = await getAllExercises();
    }

    // Filter and annotate each exercise
    const filtered = exercises.map((exercise) => {
      const missingEquipment = checkEquipmentAvailability(exercise.equipment, area.equipment);
      const constraintViolations = checkConstraintCompatibility(exercise, area.constraints);
      const isAvailable = missingEquipment.length === 0 && constraintViolations.length === 0;

      return {
        ...exercise,
        isAvailable,
        missingEquipment,
        constraintViolations,
      } as FilteredExercise;
    });

    // Apply additional filters
    let result = filtered;

    if (options.difficulty && options.difficulty.length > 0) {
      result = result.filter((e) => options.difficulty!.includes(e.difficulty));
    }

    if (options.category && options.category.length > 0) {
      result = result.filter((e) => options.category!.includes(e.category));
    }

    if (options.tags && options.tags.length > 0) {
      result = result.filter((e) => e.tags?.some((tag) => options.tags!.includes(tag)));
    }

    if (options.searchQuery && options.searchQuery.trim()) {
      const query = options.searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.targetMuscle.toLowerCase().includes(query) ||
          e.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    log.debug('Filtered exercises', {
      total: exercises.length,
      filtered: result.length,
      available: result.filter((e) => e.isAvailable).length,
    });

    return result;
  }

  /**
   * Get only available exercises for an area (excludes unavailable)
   */
  static async getAvailableExercisesForArea(
    area: WorkoutArea,
    options: ExerciseFilterOptions = {}
  ): Promise<Exercise[]> {
    const filtered = await this.getExercisesForArea(area, options);
    return filtered.filter((e) => e.isAvailable);
  }

  /**
   * Search exercises by name (uses lightweight index)
   */
  static async searchByName(
    query: string
  ): Promise<Array<{ id: string; name: string; bodyPart: BodyPart }>> {
    if (!query || query.trim().length < 2) {
      return [];
    }
    return searchExerciseIndex(query);
  }

  /**
   * Get exercise by ID (loads the relevant category)
   */
  static async getExerciseById(id: string, bodyPart?: BodyPart): Promise<Exercise | null> {
    // If we know the body part, load just that category
    if (bodyPart) {
      const exercises = await getExercisesByBodyPart(bodyPart);
      return exercises.find((e) => e.id === id) ?? null;
    }

    // Otherwise search all categories
    const all = await getAllExercises();
    return all.find((e) => e.id === id) ?? null;
  }

  /**
   * Get available categories
   */
  static getCategories() {
    return getCategories();
  }

  /**
   * Get total exercise count
   */
  static getTotalCount() {
    return getTotalExerciseCount();
  }

  /**
   * Preload common categories in background
   */
  static async preloadCommon(): Promise<void> {
    // Preload the most commonly used categories
    await preloadCategories(['chest', 'back', 'legs', 'core', 'cardio']);
    log.debug('Preloaded common exercise categories');
  }

  /**
   * Get exercises grouped by body part for an area
   */
  static async getExercisesGroupedByBodyPart(
    area: WorkoutArea
  ): Promise<Record<BodyPart, FilteredExercise[]>> {
    const categories = getCategories();
    const grouped: Record<string, FilteredExercise[]> = {};

    await Promise.all(
      categories.map(async (cat) => {
        const exercises = await this.getExercisesForArea(area, { bodyParts: [cat.id] });
        grouped[cat.id] = exercises;
      })
    );

    return grouped as Record<BodyPart, FilteredExercise[]>;
  }

  /**
   * Get substitution suggestions for an unavailable exercise
   */
  static async getSubstitutions(exercise: Exercise, area: WorkoutArea): Promise<Exercise[]> {
    if (!exercise.substitutions || exercise.substitutions.length === 0) {
      return [];
    }

    const substitutions: Exercise[] = [];

    for (const sub of exercise.substitutions) {
      // Check if we have the equipment for this substitution
      const hasEquipment = sub.equipment.every((eq) => area.equipment.includes(eq));
      if (hasEquipment) {
        const subExercise = await this.getExerciseById(sub.exercise, exercise.bodyPart as BodyPart);
        if (subExercise) {
          substitutions.push(subExercise);
        }
      }
    }

    return substitutions;
  }

  /**
   * Get similar exercises (same body part, available in area)
   */
  static async getSimilarExercises(
    exercise: Exercise,
    area: WorkoutArea,
    limit: number = 5
  ): Promise<Exercise[]> {
    const available = await this.getAvailableExercisesForArea(area, {
      bodyParts: [exercise.bodyPart as BodyPart],
    });

    // Filter out the original exercise and limit results
    return available.filter((e) => e.id !== exercise.id).slice(0, limit);
  }
}

export { type BodyPart };
