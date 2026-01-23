import { createEffect, createMemo, createSignal, onCleanup, batch, untrack, on } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import type { TimeBox, TimeBoxTask, Session } from '../../lib/types';
import type { SessionManagerState } from '../store/session-state';
import { createInitialState, selectors } from '../store/session-state';
import { sessionReducer } from '../store/session-reducer';
import { sessionActions, SessionAction } from '../store/session-actions';
import { SessionStorageService } from '../../services/session-storage.service';
import { browserNotificationService } from '../../services/browser-notification.service';
import { logger } from '../../../../lib/logger';
import { showNotification } from '../../../../lib/notifications';

const log = logger.create('SessionReducer');

// Modal state for timer completion prompts
interface CompletionModalState {
  isOpen: boolean;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'success' | 'default';
}

interface TaskCompletionModalState {
  isOpen: boolean;
  taskName: string;
  storyId: string;
  timeBoxIndex: number;
  taskIndex: number;
}

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

  // Modal state for completion prompts
  completionModal: () => CompletionModalState;
  hideCompletionModal: () => void;

  // Task completion modal state
  taskCompletionModal: () => TaskCompletionModalState;
  hideTaskCompletionModal: () => void;
  confirmTaskCompletion: (minutesSpent: number) => void;

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
  const navigate = useNavigate();

  // Create the store with initial state
  const [state, setState] = createStore<SessionManagerState>(createInitialState(id));

  // Modal state for timer completion prompts
  const [completionModal, setCompletionModal] = createSignal<CompletionModalState>({
    isOpen: false,
    title: '',
    description: '',
  });

  const showCompletionModal = (options: Omit<CompletionModalState, 'isOpen'>) => {
    setCompletionModal({ ...options, isOpen: true });
  };

  const hideCompletionModal = () => {
    setCompletionModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Task completion modal state
  const [taskCompletionModal, setTaskCompletionModal] = createSignal<TaskCompletionModalState>({
    isOpen: false,
    taskName: '',
    storyId: '',
    timeBoxIndex: -1,
    taskIndex: -1,
  });

  const showTaskCompletionModal = (options: Omit<TaskCompletionModalState, 'isOpen'>) => {
    setTaskCompletionModal({ ...options, isOpen: true });
  };

  const hideTaskCompletionModal = () => {
    setTaskCompletionModal((prev) => ({ ...prev, isOpen: false }));
  };

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

  // Effect to handle timer completion (when timer reaches 0)
  createEffect(() => {
    const remaining = state.timer.timeRemaining;
    const wasRunning = state.timer.lastTickAt !== null;

    // Timer just reached 0 (was running and now stopped at 0)
    if (remaining === 0 && !state.timer.isRunning && wasRunning) {
      const activeBox = state.timer.activeTimeBox;
      if (activeBox && state.session) {
        const story = state.session.storyBlocks.find((s) => s.id === activeBox.storyId);
        const taskName = story?.title || 'Timer';

        // Send browser notification
        browserNotificationService.notifyTimerComplete(taskName, false);
      }
    }
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
    const currentSession = untrack(() => state.session);

    if (!storyId || !currentSession) {
      log.error('Cannot toggle task: storyId or session missing');
      return;
    }

    const newStatus = (task.status ?? 'todo') as 'todo' | 'completed';

    // If completing a task, show the time estimation modal
    if (newStatus === 'completed') {
      const story = currentSession.storyBlocks.find((s) => s.id === storyId);
      const timeBox = story?.timeBoxes[timeBoxIndex];
      const taskData = timeBox?.tasks?.[taskIndex];

      showTaskCompletionModal({
        taskName: taskData?.title || `Task ${taskIndex + 1}`,
        storyId,
        timeBoxIndex,
        taskIndex,
      });
      return;
    }

    // If unchecking (marking as todo), just do it directly
    log.debug(`Setting task ${taskIndex} in timebox ${timeBoxIndex} to ${newStatus}`);

    dispatch(sessionActions.toggleTask(storyId, timeBoxIndex, taskIndex, newStatus));

    storageService.updateTaskStatus(
      currentSession.date,
      storyId,
      timeBoxIndex,
      taskIndex,
      newStatus
    );
  };

  const confirmTaskCompletion = (minutesSpent: number) => {
    const modal = untrack(() => taskCompletionModal());
    if (!modal.storyId) return;

    const currentSession = untrack(() => state.session);
    if (!currentSession) return;

    if (minutesSpent === 0) {
      log.debug(`Task completed (time tracking skipped)`);
    } else {
      log.debug(`Task completed with ${minutesSpent} minutes spent`);
    }

    // Dispatch the task toggle action
    dispatch(
      sessionActions.toggleTask(modal.storyId, modal.timeBoxIndex, modal.taskIndex, 'completed')
    );

    // Persist to storage
    storageService.updateTaskStatus(
      currentSession.date,
      modal.storyId,
      modal.timeBoxIndex,
      modal.taskIndex,
      'completed'
    );

    // TODO: Save the time spent to the task (you may need to extend the data model for this)

    hideTaskCompletionModal();

    // Check if all tasks are now completed
    const story = currentSession.storyBlocks.find((s) => s.id === modal.storyId);
    const timeBox = story?.timeBoxes[modal.timeBoxIndex];

    if (timeBox && timeBox.status === 'in-progress' && timeBox.tasks) {
      const allTasksComplete = timeBox.tasks.every((t, idx) =>
        idx === modal.taskIndex ? true : t.status === 'completed'
      );

      if (allTasksComplete) {
        const nextTimeBox = findNextTimeBox();
        showCompletionModal({
          title: 'All Tasks Complete!',
          description: 'Great work! All tasks in this timebox are done. Complete the timebox?',
          actionLabel: nextTimeBox ? 'Complete & Start Next' : 'Complete TimeBox',
          variant: 'default',
          onAction: () => {
            hideCompletionModal();
            completeTimeBox(modal.storyId, modal.timeBoxIndex);
          },
        });
      }
    }
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
        storageService.saveActualDuration(
          currentSession.date,
          storyId,
          timeBoxIndex,
          actualDuration
        );
      }
    }

    // Show completion modal and offer to start next
    const nextTimeBox = findNextTimeBox();
    if (nextTimeBox) {
      showCompletionModal({
        title: 'TimeBox Completed!',
        description: 'Great work! Ready for the next one?',
        actionLabel: 'Start Next',
        variant: 'default',
        onAction: () => {
          hideCompletionModal();
          const session = untrack(() => state.session);
          const story = session?.storyBlocks.find((s) => s.id === nextTimeBox.storyId);
          const tb = story?.timeBoxes[nextTimeBox.timeBoxIndex];
          if (tb) {
            startTimeBox(nextTimeBox.storyId, nextTimeBox.timeBoxIndex, tb.duration);
          }
        },
      });
    } else if (isSessionComplete()) {
      // Send browser notification for session complete
      browserNotificationService.notifyTimerComplete('All tasks', true);

      showCompletionModal({
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

    // Use showNotification from lib/notifications instead of toast
    showNotification({
      type: 'info',
      message: `Timer adjusted to ${Math.floor(newTime / 60)}:${String(newTime % 60).padStart(2, '0')}`,
      duration: 2000,
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

    // Modal state
    completionModal,
    hideCompletionModal,

    // Task completion modal state
    taskCompletionModal,
    hideTaskCompletionModal,
    confirmTaskCompletion,

    // Direct dispatch
    dispatch,
  };
}
