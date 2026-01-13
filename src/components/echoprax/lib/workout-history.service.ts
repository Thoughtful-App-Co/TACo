/**
 * Workout History Service
 *
 * Tracks completed workouts for statistics and history.
 * Stores completion records separately from workout definitions.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import type { WorkoutSession } from '../../../schemas/echoprax.schema';
import { logger } from '../../../lib/logger';

const log = logger.create('EchopraxHistory');

const HISTORY_KEY = 'echoprax_workout_history';
const MAX_HISTORY_ENTRIES = 100; // Keep last 100 completions

/**
 * Record of a completed workout
 */
export interface WorkoutCompletionRecord {
  /** Unique ID for this completion */
  id: string;
  /** ID of the workout that was completed */
  workoutId: string;
  /** Name of the workout at time of completion */
  workoutName: string;
  /** When the workout started */
  startedAt: string; // ISO date
  /** When the workout completed */
  completedAt: string; // ISO date
  /** Actual elapsed time in seconds */
  actualDuration: number;
  /** Expected duration from workout definition */
  expectedDuration: number;
  /** Number of exercises completed */
  exercisesCompleted: number;
  /** Total exercises in workout */
  totalExercises: number;
  /** Whether workout was completed in full or exited early */
  completionType: 'full' | 'partial';
  /** Optional notes from user */
  notes?: string;
}

/**
 * Statistics aggregated from history
 */
export interface WorkoutStats {
  totalWorkouts: number;
  totalTimeMinutes: number;
  averageDurationMinutes: number;
  completionRate: number; // percentage of full completions
  streakDays: number;
  lastWorkoutDate: string | null;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
}

export class WorkoutHistoryService {
  /**
   * Record a completed workout
   */
  static recordCompletion(
    workout: WorkoutSession,
    startedAt: Date,
    actualDuration: number,
    exercisesCompleted: number,
    completionType: 'full' | 'partial'
  ): WorkoutCompletionRecord {
    try {
      const history = this.getHistory();

      const record: WorkoutCompletionRecord = {
        id: crypto.randomUUID(),
        workoutId: workout.id,
        workoutName: workout.name,
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
        actualDuration,
        expectedDuration: workout.totalDuration,
        exercisesCompleted,
        totalExercises:
          (workout.warmup?.length || 0) + workout.main.length + (workout.cooldown?.length || 0),
        completionType,
      };

      // Add to beginning of array (most recent first)
      history.unshift(record);

      // Trim to max entries
      if (history.length > MAX_HISTORY_ENTRIES) {
        history.splice(MAX_HISTORY_ENTRIES);
      }

      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

      log.info('Workout completion recorded', {
        workoutName: workout.name,
        duration: actualDuration,
        completionType,
      });

      return record;
    } catch (error) {
      log.error('Failed to record workout completion', error);
      throw new Error('Failed to record workout completion');
    }
  }

  /**
   * Get all workout history
   */
  static getHistory(): WorkoutCompletionRecord[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      if (!data) return [];
      return JSON.parse(data) as WorkoutCompletionRecord[];
    } catch (error) {
      log.error('Failed to retrieve workout history', error);
      return [];
    }
  }

  /**
   * Get history for a specific workout
   */
  static getWorkoutHistory(workoutId: string): WorkoutCompletionRecord[] {
    return this.getHistory().filter((r) => r.workoutId === workoutId);
  }

  /**
   * Get recent completions (last N)
   */
  static getRecentCompletions(limit: number = 10): WorkoutCompletionRecord[] {
    return this.getHistory().slice(0, limit);
  }

  /**
   * Calculate aggregate statistics
   */
  static getStats(): WorkoutStats {
    const history = this.getHistory();

    if (history.length === 0) {
      return {
        totalWorkouts: 0,
        totalTimeMinutes: 0,
        averageDurationMinutes: 0,
        completionRate: 0,
        streakDays: 0,
        lastWorkoutDate: null,
        workoutsThisWeek: 0,
        workoutsThisMonth: 0,
      };
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalTimeSeconds = history.reduce((sum, r) => sum + r.actualDuration, 0);
    const fullCompletions = history.filter((r) => r.completionType === 'full').length;

    // Calculate workout days for streak
    const workoutDays = new Set(
      history.map((r) => new Date(r.completedAt).toISOString().split('T')[0])
    );

    // Calculate streak (consecutive days from today going backwards)
    let streakDays = 0;
    const today = new Date().toISOString().split('T')[0];
    const checkDate = new Date();

    // Start from yesterday if no workout today
    if (!workoutDays.has(today)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (workoutDays.has(checkDate.toISOString().split('T')[0])) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return {
      totalWorkouts: history.length,
      totalTimeMinutes: Math.round(totalTimeSeconds / 60),
      averageDurationMinutes: Math.round(totalTimeSeconds / history.length / 60),
      completionRate: Math.round((fullCompletions / history.length) * 100),
      streakDays,
      lastWorkoutDate: history[0]?.completedAt || null,
      workoutsThisWeek: history.filter((r) => new Date(r.completedAt) >= oneWeekAgo).length,
      workoutsThisMonth: history.filter((r) => new Date(r.completedAt) >= oneMonthAgo).length,
    };
  }

  /**
   * Clear all history (for testing/reset)
   */
  static clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_KEY);
      log.info('Workout history cleared');
    } catch (error) {
      log.error('Failed to clear history', error);
    }
  }

  /**
   * Delete a specific completion record
   */
  static deleteRecord(recordId: string): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter((r) => r.id !== recordId);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
      log.debug('Deleted history record', { recordId });
    } catch (error) {
      log.error('Failed to delete history record', error);
    }
  }
}
