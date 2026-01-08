import type { WorkoutSession } from '../../../schemas/echoprax.schema';
import { logger } from '../../../lib/logger';

const STORAGE_KEY = 'echoprax_workouts';

const log = logger.create('EchopraxStorage');

/**
 * Stored representation of WorkoutSession with Date fields as ISO strings
 */
interface StoredWorkoutSession extends Omit<
  WorkoutSession,
  'createdAt' | 'scheduledFor' | 'startedAt' | 'completedAt'
> {
  createdAt: string;
  scheduledFor?: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Convert a WorkoutSession to its stored representation (Dates -> ISO strings)
 */
function serializeWorkout(workout: WorkoutSession): StoredWorkoutSession {
  return {
    ...workout,
    createdAt: workout.createdAt.toISOString(),
    scheduledFor: workout.scheduledFor?.toISOString(),
    startedAt: workout.startedAt?.toISOString(),
    completedAt: workout.completedAt?.toISOString(),
  };
}

/**
 * Convert a stored workout to runtime representation (ISO strings -> Dates)
 */
function deserializeWorkout(stored: StoredWorkoutSession): WorkoutSession {
  return {
    ...stored,
    createdAt: new Date(stored.createdAt),
    scheduledFor: stored.scheduledFor ? new Date(stored.scheduledFor) : undefined,
    startedAt: stored.startedAt ? new Date(stored.startedAt) : undefined,
    completedAt: stored.completedAt ? new Date(stored.completedAt) : undefined,
  };
}

export class WorkoutPersistenceService {
  /**
   * Save a single workout to persistent storage
   */
  static async saveWorkout(workout: WorkoutSession): Promise<WorkoutSession> {
    try {
      const workouts = await this.getWorkouts();
      const existingIndex = workouts.findIndex((w) => w.id === workout.id);

      if (existingIndex !== -1) {
        workouts[existingIndex] = workout;
      } else {
        workouts.push(workout);
      }

      const storedWorkouts = workouts.map(serializeWorkout);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedWorkouts));

      log.debug('Saved workout', { id: workout.id, name: workout.name });
      return workout;
    } catch (error) {
      log.error('Error saving workout:', error);
      throw new Error('Failed to save workout');
    }
  }

  /**
   * Retrieve all workouts from persistent storage
   */
  static async getWorkouts(): Promise<WorkoutSession[]> {
    try {
      const workoutsJson = localStorage.getItem(STORAGE_KEY);
      if (!workoutsJson) return [];

      const storedWorkouts = JSON.parse(workoutsJson) as StoredWorkoutSession[];
      return storedWorkouts.map(deserializeWorkout);
    } catch (error) {
      log.error('Error retrieving workouts:', error);
      throw new Error('Failed to retrieve workouts');
    }
  }

  /**
   * Get a single workout by ID
   */
  static async getWorkoutById(id: string): Promise<WorkoutSession | null> {
    try {
      const workouts = await this.getWorkouts();
      return workouts.find((w) => w.id === id) ?? null;
    } catch (error) {
      log.error('Error retrieving workout by ID:', error);
      throw new Error('Failed to retrieve workout');
    }
  }

  /**
   * Update a specific workout
   */
  static async updateWorkout(
    id: string,
    updates: Partial<WorkoutSession>
  ): Promise<WorkoutSession> {
    try {
      const workouts = await this.getWorkouts();
      const workoutIndex = workouts.findIndex((w) => w.id === id);

      if (workoutIndex === -1) {
        throw new Error('Workout not found');
      }

      const updatedWorkout: WorkoutSession = {
        ...workouts[workoutIndex],
        ...updates,
      };

      workouts[workoutIndex] = updatedWorkout;

      const storedWorkouts = workouts.map(serializeWorkout);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedWorkouts));

      log.debug('Updated workout', { id, updates: Object.keys(updates) });
      return updatedWorkout;
    } catch (error) {
      log.error('Error updating workout:', error);
      throw new Error('Failed to update workout');
    }
  }

  /**
   * Delete a specific workout
   */
  static async deleteWorkout(id: string): Promise<void> {
    try {
      const workouts = await this.getWorkouts();
      const filteredWorkouts = workouts.filter((w) => w.id !== id);

      const storedWorkouts = filteredWorkouts.map(serializeWorkout);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedWorkouts));

      log.debug('Deleted workout', { id });
    } catch (error) {
      log.error('Error deleting workout:', error);
      throw new Error('Failed to delete workout');
    }
  }

  /**
   * Duplicate a workout with a new ID and optional new name
   */
  static async duplicateWorkout(id: string, newName?: string): Promise<WorkoutSession> {
    try {
      const workout = await this.getWorkoutById(id);

      if (!workout) {
        throw new Error('Workout not found');
      }

      const duplicatedWorkout: WorkoutSession = {
        ...workout,
        id: globalThis.crypto.randomUUID(),
        name: newName ?? `${workout.name} (Copy)`,
        createdAt: new Date(),
        scheduledFor: undefined,
        startedAt: undefined,
        completedAt: undefined,
        status: 'draft',
      };

      await this.saveWorkout(duplicatedWorkout);

      log.debug('Duplicated workout', { originalId: id, newId: duplicatedWorkout.id });
      return duplicatedWorkout;
    } catch (error) {
      log.error('Error duplicating workout:', error);
      throw new Error('Failed to duplicate workout');
    }
  }

  /**
   * Get workouts filtered by status
   */
  static async getWorkoutsByStatus(status: WorkoutSession['status']): Promise<WorkoutSession[]> {
    try {
      const workouts = await this.getWorkouts();
      return workouts.filter((w) => w.status === status);
    } catch (error) {
      log.error('Error retrieving workouts by status:', error);
      throw new Error('Failed to retrieve workouts by status');
    }
  }
}
