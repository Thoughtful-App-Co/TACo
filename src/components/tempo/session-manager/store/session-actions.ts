import type { Session, TimeBoxStatus, TimeBoxTask } from '../../lib/types';

/**
 * All possible action types for the session reducer
 */
export type SessionAction =
  // Session lifecycle
  | { type: 'SESSION_LOAD_START' }
  | { type: 'SESSION_LOAD_SUCCESS'; payload: { session: Session } }
  | { type: 'SESSION_LOAD_ERROR'; payload: { error: Error } }
  | { type: 'SESSION_UPDATE'; payload: { session: Session } }
  | { type: 'SESSION_CLEAR' }

  // Timer actions
  | {
      type: 'TIMER_START';
      payload: { storyId: string; timeBoxIndex: number; durationSeconds: number };
    }
  | { type: 'TIMER_PAUSE' }
  | { type: 'TIMER_RESUME' }
  | { type: 'TIMER_RESET' }
  | { type: 'TIMER_TICK' }
  | { type: 'TIMER_SET_TIME'; payload: { timeRemaining: number } }
  | { type: 'TIMER_COMPLETE' }
  | {
      type: 'TIMER_RESTORE';
      payload: {
        activeTimeBox: { storyId: string; timeBoxIndex: number } | null;
        timeRemaining: number | null;
        isRunning: boolean;
      };
    }

  // TimeBox actions
  | { type: 'TIMEBOX_START'; payload: { storyId: string; timeBoxIndex: number } }
  | {
      type: 'TIMEBOX_COMPLETE';
      payload: { storyId: string; timeBoxIndex: number; actualDuration?: number };
    }
  | {
      type: 'TIMEBOX_UNDO_COMPLETE';
      payload: { storyId: string; timeBoxIndex: number };
    }
  | {
      type: 'TIMEBOX_SET_STATUS';
      payload: { storyId: string; timeBoxIndex: number; status: TimeBoxStatus };
    }

  // Task actions
  | {
      type: 'TASK_TOGGLE';
      payload: {
        storyId: string;
        timeBoxIndex: number;
        taskIndex: number;
        status: 'todo' | 'completed';
      };
    }
  | {
      type: 'TASK_UPDATE';
      payload: {
        storyId: string;
        timeBoxIndex: number;
        taskIndex: number;
        updates: Partial<TimeBoxTask>;
      };
    }

  // Batch/Cascade actions (internal use)
  | { type: 'CASCADE_PROGRESS_UPDATE' };

/**
 * Action creator functions for type safety and convenience
 */
export const sessionActions = {
  // Session lifecycle
  loadStart: (): SessionAction => ({ type: 'SESSION_LOAD_START' }),

  loadSuccess: (session: Session): SessionAction => ({
    type: 'SESSION_LOAD_SUCCESS',
    payload: { session },
  }),

  loadError: (error: Error): SessionAction => ({
    type: 'SESSION_LOAD_ERROR',
    payload: { error },
  }),

  updateSession: (session: Session): SessionAction => ({
    type: 'SESSION_UPDATE',
    payload: { session },
  }),

  clearSession: (): SessionAction => ({ type: 'SESSION_CLEAR' }),

  // Timer
  startTimer: (storyId: string, timeBoxIndex: number, durationMinutes: number): SessionAction => ({
    type: 'TIMER_START',
    payload: { storyId, timeBoxIndex, durationSeconds: durationMinutes * 60 },
  }),

  pauseTimer: (): SessionAction => ({ type: 'TIMER_PAUSE' }),

  resumeTimer: (): SessionAction => ({ type: 'TIMER_RESUME' }),

  resetTimer: (): SessionAction => ({ type: 'TIMER_RESET' }),

  tick: (): SessionAction => ({ type: 'TIMER_TICK' }),

  setTime: (timeRemaining: number): SessionAction => ({
    type: 'TIMER_SET_TIME',
    payload: { timeRemaining },
  }),

  completeTimer: (): SessionAction => ({ type: 'TIMER_COMPLETE' }),

  restoreTimer: (
    activeTimeBox: { storyId: string; timeBoxIndex: number } | null,
    timeRemaining: number | null,
    isRunning: boolean
  ): SessionAction => ({
    type: 'TIMER_RESTORE',
    payload: { activeTimeBox, timeRemaining, isRunning },
  }),

  // TimeBox
  startTimeBox: (storyId: string, timeBoxIndex: number): SessionAction => ({
    type: 'TIMEBOX_START',
    payload: { storyId, timeBoxIndex },
  }),

  completeTimeBox: (
    storyId: string,
    timeBoxIndex: number,
    actualDuration?: number
  ): SessionAction => ({
    type: 'TIMEBOX_COMPLETE',
    payload: { storyId, timeBoxIndex, actualDuration },
  }),

  undoCompleteTimeBox: (storyId: string, timeBoxIndex: number): SessionAction => ({
    type: 'TIMEBOX_UNDO_COMPLETE',
    payload: { storyId, timeBoxIndex },
  }),

  setTimeBoxStatus: (
    storyId: string,
    timeBoxIndex: number,
    status: TimeBoxStatus
  ): SessionAction => ({
    type: 'TIMEBOX_SET_STATUS',
    payload: { storyId, timeBoxIndex, status },
  }),

  // Task
  toggleTask: (
    storyId: string,
    timeBoxIndex: number,
    taskIndex: number,
    status: 'todo' | 'completed'
  ): SessionAction => ({
    type: 'TASK_TOGGLE',
    payload: { storyId, timeBoxIndex, taskIndex, status },
  }),

  updateTask: (
    storyId: string,
    timeBoxIndex: number,
    taskIndex: number,
    updates: Partial<TimeBoxTask>
  ): SessionAction => ({
    type: 'TASK_UPDATE',
    payload: { storyId, timeBoxIndex, taskIndex, updates },
  }),

  // Internal
  cascadeProgressUpdate: (): SessionAction => ({ type: 'CASCADE_PROGRESS_UPDATE' }),
};
