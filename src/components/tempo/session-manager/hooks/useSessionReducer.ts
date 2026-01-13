import { createEffect, createMemo, onCleanup, batch, untrack, on } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import type { TimeBox, TimeBoxTask, Session } from '../../lib/types';
import type { SessionManagerState } from '../store/session-state';
import { createInitialState, selectors } from '../store/session-state';
import { sessionReducer } from '../store/session-reducer';
import { sessionActions, SessionAction } from '../store/session-actions';
import { SessionStorageService } from '../../services/session-storage.service';
import { logger } from '../../../../lib/logger';

const log = logger.create('SessionReducer');

// Toast fallback (same as useSession)
const useToastFallback = () => {
  const toast = (props: {
    title: string;
    description: string;
    variant?: string;
    actionLabel?: string;
    onAction?: () => void;
  }) => {
    if (
      props.actionLabel &&
      props.onAction &&
      window.confirm(`${props.title}\n${props.description}\n\nDo you want to ${props.actionLabel}?`)
    ) {
      props.onAction();
    }
  };

  return { toast };
};

export interface UseSessionReducerProps {
  id?: string;
  storageService?: SessionStorageService;
}

export interface UseSessionReducerReturn {
  // State accessors (reactive getters) - matches UseSessionReturn
  session: () => Session | null;
  loading: () => boolean;
  error: () => Error | null;
  activeTimeBox: () => { storyId: string; timeBoxIndex: number } | null;
  timeRemaining: () => number | null;
  isTimerRunning: () => boolean;

  // Computed values
  isSessionComplete: () => boolean;
  completedPercentage: () => number;

  // Actions - matches UseSessionReturn
  handleTaskClick: (
    storyId: string | undefined,
    timeBoxIndex: number,
    taskIndex: number,
    task: TimeBoxTask
  ) => void;
  startTimeBox: (storyId: string, timeBoxIndex: number, duration: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  completeTimeBox: (storyId: string, timeBoxIndex: number) => void;
  undoCompleteTimeBox: (storyId: string, timeBoxIndex: number) => void;
  updateTimeRemaining: (newTime: number) => void;

  // Utilities
  findNextWorkTimeBox: () => { storyId: string; timeBoxIndex: number } | null;
  findNextTimeBox: () => { storyId: string; timeBoxIndex: number } | null;
  isCurrentTimeBox: (timeBox: TimeBox) => boolean;

  // Direct dispatch for advanced use cases
  dispatch: (action: SessionAction) => void;
}

/**
 * Custom hook that wraps the session reducer with SolidJS reactivity.
 *
 * Uses createStore internally but dispatches actions through the reducer
 * for predictable state transitions.
 *
 * This is a drop-in replacement for useSession with the same API.
 */
export function useSessionReducer({
  id,
  storageService = new SessionStorageService(),
}: UseSessionReducerProps = {}): UseSessionReducerReturn {
  const { toast } = useToastFallback();
  const navigate = useNavigate();

  // Create the store with initial state
  const [state, setState] = createStore<SessionManagerState>(createInitialState(id));

  // Timer interval reference
  let timerIntervalRef: ReturnType<typeof setInterval> | null = null;

  /**
   * Dispatch an action through the reducer and update the store
   * Uses untrack to prevent reactive dependencies when reading state
   */
  const dispatch = (action: SessionAction) => {
    // Skip logging for high-frequency actions
    if (action.type !== 'TIMER_TICK') {
      log.debug(`Dispatching: ${action.type}`, action);
    }

    // Use untrack to read state without creating reactive dependencies
    // This prevents infinite loops when dispatch is called from effects
    const currentState = untrack(() => ({
      session: state.session,
      timer: { ...state.timer },
      status: state.status,
      error: state.error,
      sessionId: state.sessionId,
    }));

    // Run the reducer to get new state
    const newState = sessionReducer(currentState, action);

    // Update the store with the new state using batch for efficiency
    batch(() => {
      setState('session', newState.session);
      setState('timer', newState.timer);
      setState('status', newState.status);
      setState('error', newState.error);
    });
  };

  // ===========================================================================
  // TIMER INTERVAL MANAGEMENT
  // ===========================================================================

  const startTimerInterval = () => {
    if (timerIntervalRef) {
      clearInterval(timerIntervalRef);
    }

    timerIntervalRef = setInterval(() => {
      dispatch(sessionActions.tick());
    }, 1000);
  };

  const stopTimerInterval = () => {
    if (timerIntervalRef) {
      clearInterval(timerIntervalRef);
      timerIntervalRef = null;
    }
  };

  // Effect to manage timer interval based on isRunning state
  createEffect(() => {
    if (
      state.timer.isRunning &&
      state.timer.timeRemaining !== null &&
      state.timer.timeRemaining > 0
    ) {
      startTimerInterval();
    } else {
      stopTimerInterval();
    }

    onCleanup(stopTimerInterval);
  });

  // ===========================================================================
  // PERSISTENCE EFFECTS
  // ===========================================================================

  // Persist session changes
  createEffect(() => {
    if (state.session && state.session.date) {
      storageService.saveSession(state.session.date, state.session);
    }
  });

  // Persist timer state changes
  createEffect(() => {
    if (state.sessionId) {
      storageService.saveTimerState(
        state.sessionId,
        state.timer.activeTimeBox,
        state.timer.timeRemaining,
        state.timer.isRunning
      );
    }
  });

  // Load session on mount - use on() to only track id changes
  // Track whether we've already loaded to prevent duplicate loads
  let hasLoaded = false;

  createEffect(
    on(
      () => id,
      (sessionId) => {
        if (!sessionId) {
          setState('status', 'idle');
          hasLoaded = false;
          return;
        }

        // Prevent duplicate loads for the same id
        if (hasLoaded) return;
        hasLoaded = true;

        const loadSession = async () => {
          dispatch(sessionActions.loadStart());

          try {
            const loadedSession = await storageService.getSession(sessionId);

            if (loadedSession) {
              dispatch(sessionActions.loadSuccess(loadedSession));

              // Restore timer state
              const timerState = await storageService.getTimerState(sessionId);
              if (timerState && timerState.activeTimeBox) {
                dispatch(
                  sessionActions.restoreTimer(
                    timerState.activeTimeBox,
                    timerState.timeRemaining,
                    timerState.isTimerRunning
                  )
                );
              }
            } else {
              dispatch(sessionActions.loadError(new Error('Session not found')));
            }
          } catch (err) {
            dispatch(
              sessionActions.loadError(
                err instanceof Error ? err : new Error('Failed to load session')
              )
            );
          }
        };

        loadSession();
      }
    )
  );

  // Handle page unload - persist timer state
  createEffect(() => {
    const handleBeforeUnload = () => {
      if (state.sessionId) {
        storageService.saveTimerState(
          state.sessionId,
          state.timer.activeTimeBox,
          state.timer.timeRemaining,
          state.timer.isRunning
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && state.sessionId) {
        handleBeforeUnload();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    onCleanup(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      handleBeforeUnload();
    });
  });

  // ===========================================================================
  // COMPUTED VALUES
  // ===========================================================================

  const completedPercentage = createMemo(() =>
    selectors.completedPercentage({
      session: state.session,
      timer: state.timer,
      status: state.status,
      error: state.error,
      sessionId: state.sessionId,
    })
  );

  const isSessionComplete = createMemo(() => completedPercentage() === 100);

  // ===========================================================================
  // ACTION HANDLERS
  // ===========================================================================

  const handleTaskClick = (
    storyId: string | undefined,
    timeBoxIndex: number,
    taskIndex: number,
    task: TimeBoxTask
  ) => {
    // Use untrack to read state without creating dependencies
    const currentSession = untrack(() => state.session);

    if (!storyId || !currentSession) {
      log.error('Cannot toggle task: storyId or session missing');
      return;
    }

    const newStatus = task.status === 'completed' ? 'todo' : 'completed';

    log.debug(`Toggling task ${taskIndex} in timebox ${timeBoxIndex} to ${newStatus}`);

    dispatch(sessionActions.toggleTask(storyId, timeBoxIndex, taskIndex, newStatus));

    // Also persist to storage service
    storageService.updateTaskStatus(
      currentSession.date,
      storyId,
      timeBoxIndex,
      taskIndex,
      newStatus
    );
  };

  const startTimeBox = (storyId: string, timeBoxIndex: number, duration: number) => {
    log.debug(`Starting timebox: ${storyId}[${timeBoxIndex}] for ${duration} minutes`);

    dispatch(sessionActions.startTimer(storyId, timeBoxIndex, duration));

    const currentSession = untrack(() => state.session);
    if (currentSession) {
      storageService.updateTimeBoxStatus(currentSession.date, storyId, timeBoxIndex, 'in-progress');
    }
  };

  const pauseTimer = () => {
    log.debug('Pausing timer');
    dispatch(sessionActions.pauseTimer());
  };

  const resumeTimer = () => {
    log.debug('Resuming timer');
    dispatch(sessionActions.resumeTimer());
  };

  const resetTimer = () => {
    log.debug('Resetting timer');
    dispatch(sessionActions.resetTimer());
  };

  const completeTimeBox = (storyId: string, timeBoxIndex: number) => {
    log.debug(`Completing timebox: ${storyId}[${timeBoxIndex}]`);

    const currentSession = untrack(() => state.session);

    // Calculate actual duration before dispatching
    let actualDuration: number | undefined;
    if (currentSession) {
      const story = currentSession.storyBlocks.find((s) => s.id === storyId);
      const timeBox = story?.timeBoxes[timeBoxIndex];
      if (timeBox?.startTime) {
        const startTime = new Date(timeBox.startTime);
        const endTime = new Date();
        actualDuration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      }
    }

    dispatch(sessionActions.completeTimeBox(storyId, timeBoxIndex, actualDuration));
    dispatch(sessionActions.completeTimer());

    if (currentSession) {
      storageService.updateTimeBoxStatus(currentSession.date, storyId, timeBoxIndex, 'completed');

      if (actualDuration !== undefined) {
        storageService.saveActualDuration(currentSession.date, storyId, timeBoxIndex, actualDuration);
      }
    }

    // Show toast and offer to start next
    const nextTimeBox = findNextTimeBox();
    if (nextTimeBox) {
      toast({
        title: 'TimeBox Completed!',
        description: 'Great work! Ready for the next one?',
        actionLabel: 'Start Next',
        onAction: () => {
          const session = untrack(() => state.session);
          const story = session?.storyBlocks.find((s) => s.id === nextTimeBox.storyId);
          const tb = story?.timeBoxes[nextTimeBox.timeBoxIndex];
          if (tb) {
            startTimeBox(nextTimeBox.storyId, nextTimeBox.timeBoxIndex, tb.duration);
          }
        },
      });
    } else if (isSessionComplete()) {
      toast({
        title: 'Session Complete!',
        description: 'Congratulations! You completed all timeboxes.',
        variant: 'success',
      });
    }
  };

  const undoCompleteTimeBox = (storyId: string, timeBoxIndex: number) => {
    log.debug(`Undoing complete for timebox: ${storyId}[${timeBoxIndex}]`);

    dispatch(sessionActions.undoCompleteTimeBox(storyId, timeBoxIndex));

    const currentSession = untrack(() => state.session);
    if (currentSession) {
      storageService.updateTimeBoxStatus(currentSession.date, storyId, timeBoxIndex, 'todo');
    }
  };

  const updateTimeRemaining = (newTime: number) => {
    log.debug(`Updating time remaining to: ${newTime} seconds`);
    dispatch(sessionActions.setTime(newTime));

    toast({
      title: 'Timer Adjusted',
      description: `Time set to ${Math.floor(newTime / 60)}:${String(newTime % 60).padStart(2, '0')}`,
    });
  };

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================

  const findNextWorkTimeBox = () =>
    selectors.findNextWorkTimeBox({
      session: state.session,
      timer: state.timer,
      status: state.status,
      error: state.error,
      sessionId: state.sessionId,
    });

  const findNextTimeBox = () =>
    selectors.findNextTimeBox({
      session: state.session,
      timer: state.timer,
      status: state.status,
      error: state.error,
      sessionId: state.sessionId,
    });

  const isCurrentTimeBox = (timeBox: TimeBox) => {
    if (!state.timer.activeTimeBox || !state.session) return false;

    // Find the timebox in the session and compare
    const story = state.session.storyBlocks.find(
      (s) => s.id === state.timer.activeTimeBox!.storyId
    );
    if (!story) return false;

    const activeTimeBox = story.timeBoxes[state.timer.activeTimeBox.timeBoxIndex];
    return activeTimeBox === timeBox;
  };

  // ===========================================================================
  // RETURN VALUE
  // ===========================================================================

  return {
    // State accessors
    session: () => state.session,
    loading: () => state.status === 'loading',
    error: () => state.error,
    activeTimeBox: () => state.timer.activeTimeBox,
    timeRemaining: () => state.timer.timeRemaining,
    isTimerRunning: () => state.timer.isRunning,

    // Computed values
    isSessionComplete,
    completedPercentage,

    // Actions
    handleTaskClick,
    startTimeBox,
    pauseTimer,
    resumeTimer,
    resetTimer,
    completeTimeBox,
    undoCompleteTimeBox,
    updateTimeRemaining,

    // Utilities
    findNextWorkTimeBox,
    findNextTimeBox,
    isCurrentTimeBox,

    // Direct dispatch
    dispatch,
  };
}
