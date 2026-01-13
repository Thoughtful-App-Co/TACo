import type {
  Session,
  StoryBlock,
  TimeBox,
  TimeBoxStatus,
  SessionStatus,
} from '../../lib/types';

/**
 * Timer-specific state, separate from session data for clarity
 */
export interface TimerState {
  /** Currently active timebox identifier */
  activeTimeBox: { storyId: string; timeBoxIndex: number } | null;
  /** Time remaining in seconds */
  timeRemaining: number | null;
  /** Whether the timer is actively counting down */
  isRunning: boolean;
  /** Timestamp when timer was last started/resumed (for persistence) */
  lastTickAt: number | null;
}

/**
 * Async operation status
 */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Complete session manager state
 */
export interface SessionManagerState {
  /** The current session data */
  session: Session | null;

  /** Timer-related state */
  timer: TimerState;

  /** Async operation status */
  status: AsyncStatus;

  /** Error if any async operation failed */
  error: Error | null;

  /** Session ID/date being managed */
  sessionId: string | null;
}

/**
 * Initial state factory
 */
export function createInitialState(sessionId?: string): SessionManagerState {
  return {
    session: null,
    timer: {
      activeTimeBox: null,
      timeRemaining: null,
      isRunning: false,
      lastTickAt: null,
    },
    status: 'idle',
    error: null,
    sessionId: sessionId ?? null,
  };
}

/**
 * Derived state computations (kept pure for memoization)
 */
export const selectors = {
  /** Calculate completed percentage based on work timeboxes */
  completedPercentage(state: SessionManagerState): number {
    if (!state.session) return 0;

    const allWorkTimeBoxes = state.session.storyBlocks.flatMap((story) =>
      story.timeBoxes.filter((tb) => tb.type === 'work')
    );

    const totalWorkBoxes = allWorkTimeBoxes.length;
    const completedWorkBoxes = allWorkTimeBoxes.filter(
      (tb) => tb.status === 'completed'
    ).length;

    return totalWorkBoxes > 0
      ? Math.round((completedWorkBoxes / totalWorkBoxes) * 100)
      : 0;
  },

  /** Check if session is fully complete */
  isSessionComplete(state: SessionManagerState): boolean {
    return selectors.completedPercentage(state) === 100;
  },

  /** Find next available timebox (any type) */
  findNextTimeBox(
    state: SessionManagerState
  ): { storyId: string; timeBoxIndex: number } | null {
    if (!state.session) return null;

    for (const story of state.session.storyBlocks) {
      for (let j = 0; j < story.timeBoxes.length; j++) {
        if (story.timeBoxes[j].status === 'todo' || !story.timeBoxes[j].status) {
          return { storyId: story.id, timeBoxIndex: j };
        }
      }
    }
    return null;
  },

  /** Find next work timebox specifically */
  findNextWorkTimeBox(
    state: SessionManagerState
  ): { storyId: string; timeBoxIndex: number } | null {
    if (!state.session) return null;

    for (const story of state.session.storyBlocks) {
      for (let j = 0; j < story.timeBoxes.length; j++) {
        const tb = story.timeBoxes[j];
        if (tb.type === 'work' && (tb.status === 'todo' || !tb.status)) {
          return { storyId: story.id, timeBoxIndex: j };
        }
      }
    }
    return null;
  },

  /** Get active timebox details */
  getActiveTimeBoxDetails(state: SessionManagerState): {
    story: StoryBlock;
    timeBox: TimeBox;
    storyIndex: number;
    timeBoxIndex: number;
  } | null {
    if (!state.session || !state.timer.activeTimeBox) return null;

    const storyIndex = state.session.storyBlocks.findIndex(
      (s) => s.id === state.timer.activeTimeBox!.storyId
    );
    if (storyIndex === -1) return null;

    const story = state.session.storyBlocks[storyIndex];
    const timeBox = story.timeBoxes[state.timer.activeTimeBox.timeBoxIndex];

    if (!timeBox) return null;

    return {
      story,
      timeBox,
      storyIndex,
      timeBoxIndex: state.timer.activeTimeBox.timeBoxIndex,
    };
  },

  /** Get formatted time remaining as MM:SS */
  formattedTimeRemaining(state: SessionManagerState): string {
    if (state.timer.timeRemaining === null) return '00:00';

    const minutes = Math.floor(state.timer.timeRemaining / 60);
    const seconds = state.timer.timeRemaining % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  },
};
