/**
 * Session State Persistence Service
 *
 * Persists active workout session state to localStorage so users can:
 * - Leave mid-workout and come back
 * - Resume where they left off after browser refresh
 * - See "Continue Workout" option on home screen
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import type { SessionState, WorkoutSession } from '../../../schemas/echoprax.schema';
import { logger } from '../../../lib/logger';

const log = logger.create('EchopraxSession');

const ACTIVE_SESSION_KEY = 'echoprax_active_session';

/**
 * Persisted session state - everything needed to resume a workout
 */
export interface PersistedSessionState {
  /** The workout being played */
  workoutId: string;
  /** Full workout data (in case it was modified/deleted) */
  workout: WorkoutSession;
  /** Current state of the session */
  state: SessionState;
  /** Index of the current block in the flattened workout */
  currentBlockIndex: number;
  /** Current set number (1-indexed) */
  currentSet: number;
  /** Time remaining on current timer (seconds) */
  timeRemaining: number;
  /** Total elapsed time (seconds) */
  elapsedTime: number;
  /** Whether voice is muted */
  isMuted: boolean;
  /** When this state was saved */
  savedAt: string; // ISO date string
  /** Version for future migrations */
  version: number;
}

const CURRENT_VERSION = 1;

/**
 * Maximum age of a persisted session before it's considered stale (24 hours)
 */
const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000;

export class SessionStateService {
  /**
   * Save the current session state to localStorage
   */
  static saveSession(state: Omit<PersistedSessionState, 'savedAt' | 'version'>): void {
    try {
      const persistedState: PersistedSessionState = {
        ...state,
        savedAt: new Date().toISOString(),
        version: CURRENT_VERSION,
      };

      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(persistedState));
      log.debug('Session state saved', {
        workoutId: state.workoutId,
        blockIndex: state.currentBlockIndex,
        elapsedTime: state.elapsedTime,
      });
    } catch (error) {
      log.error('Failed to save session state', error);
    }
  }

  /**
   * Get the currently persisted session (if any, and if not stale)
   */
  static getActiveSession(): PersistedSessionState | null {
    try {
      const data = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (!data) return null;

      const state = JSON.parse(data) as PersistedSessionState;

      // Check if session is stale
      const savedAt = new Date(state.savedAt).getTime();
      const age = Date.now() - savedAt;

      if (age > MAX_SESSION_AGE_MS) {
        log.info('Stale session found, clearing', {
          age: Math.round(age / 1000 / 60) + ' minutes',
        });
        this.clearSession();
        return null;
      }

      // Don't return completed sessions
      if (state.state === 'completed') {
        this.clearSession();
        return null;
      }

      log.debug('Active session found', {
        workoutId: state.workoutId,
        state: state.state,
        savedAt: state.savedAt,
      });

      return state;
    } catch (error) {
      log.error('Failed to retrieve session state', error);
      return null;
    }
  }

  /**
   * Check if there's an active session that can be resumed
   */
  static hasActiveSession(): boolean {
    return this.getActiveSession() !== null;
  }

  /**
   * Clear the active session (called when workout completes or user exits)
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      log.debug('Session cleared');
    } catch (error) {
      log.error('Failed to clear session', error);
    }
  }

  /**
   * Update just the time-related fields (called frequently during workout)
   * More efficient than saving the full state every second
   */
  static updateSessionTime(timeRemaining: number, elapsedTime: number): void {
    try {
      const data = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (!data) return;

      const state = JSON.parse(data) as PersistedSessionState;
      state.timeRemaining = timeRemaining;
      state.elapsedTime = elapsedTime;
      state.savedAt = new Date().toISOString();

      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(state));
    } catch (error) {
      // Don't log every time - this is called frequently
    }
  }

  /**
   * Update session state (called on state transitions)
   */
  static updateSessionState(
    sessionState: SessionState,
    currentBlockIndex: number,
    currentSet: number,
    timeRemaining: number
  ): void {
    try {
      const data = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (!data) return;

      const state = JSON.parse(data) as PersistedSessionState;
      state.state = sessionState;
      state.currentBlockIndex = currentBlockIndex;
      state.currentSet = currentSet;
      state.timeRemaining = timeRemaining;
      state.savedAt = new Date().toISOString();

      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(state));

      log.debug('Session state updated', {
        state: sessionState,
        blockIndex: currentBlockIndex,
        set: currentSet,
      });
    } catch (error) {
      log.error('Failed to update session state', error);
    }
  }
}
