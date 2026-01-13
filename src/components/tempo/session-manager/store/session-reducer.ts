import type { SessionManagerState } from './session-state';
import type { SessionAction } from './session-actions';
import type {
  StoryBlock,
  TimeBox,
  TimeBoxTask,
  TimeBoxStatus,
  SessionStatus,
} from '../../lib/types';

/**
 * Pure helper: Calculate story progress based on completed work timeboxes
 */
function calculateStoryProgress(timeBoxes: TimeBox[]): number {
  const workBoxes = timeBoxes.filter((box) => box.type === 'work');
  const completedWorkBoxes = workBoxes.filter((box) => box.status === 'completed');
  return workBoxes.length > 0
    ? Math.round((completedWorkBoxes.length / workBoxes.length) * 100)
    : 0;
}

/**
 * Pure helper: Calculate timebox status based on task completion
 */
function calculateTimeBoxStatusFromTasks(tasks: TimeBoxTask[]): TimeBoxStatus {
  if (!tasks || tasks.length === 0) return 'todo';

  const allCompleted = tasks.every((t) => t.status === 'completed');
  const anyCompleted = tasks.some((t) => t.status === 'completed');

  if (allCompleted) return 'completed';
  if (anyCompleted) return 'in-progress';
  return 'todo';
}

/**
 * Pure helper: Calculate session status based on all work timeboxes
 */
function calculateSessionStatus(storyBlocks: StoryBlock[]): SessionStatus {
  const allWorkBoxes = storyBlocks.flatMap((story) =>
    story.timeBoxes.filter((box) => box.type === 'work')
  );

  if (allWorkBoxes.length === 0) return 'planned';

  const allCompleted = allWorkBoxes.every((box) => box.status === 'completed');
  const anyInProgress = allWorkBoxes.some((box) => box.status === 'in-progress');
  const anyCompleted = allWorkBoxes.some((box) => box.status === 'completed');

  if (allCompleted) return 'completed';
  if (anyInProgress || anyCompleted) return 'in-progress';
  return 'planned';
}

/**
 * Pure helper: Update story blocks with cascading progress recalculation
 */
function updateStoryBlocksWithCascade(
  storyBlocks: StoryBlock[],
  storyId: string,
  updateFn: (story: StoryBlock, storyIndex: number) => StoryBlock
): StoryBlock[] {
  return storyBlocks.map((story, index) => {
    if (story.id !== storyId) return story;

    const updatedStory = updateFn(story, index);

    // Recalculate progress after any update
    return {
      ...updatedStory,
      progress: calculateStoryProgress(updatedStory.timeBoxes),
    };
  });
}

/**
 * Pure helper: Reset all in-progress timeboxes to todo (when starting a new one)
 */
function resetInProgressTimeBoxes(storyBlocks: StoryBlock[]): StoryBlock[] {
  return storyBlocks.map((story) => ({
    ...story,
    timeBoxes: story.timeBoxes.map((tb) =>
      tb.status === 'in-progress' ? { ...tb, status: 'todo' as TimeBoxStatus } : tb
    ),
  }));
}

/**
 * Main session reducer function
 *
 * This reducer handles all state transitions for the session manager.
 * Cascading updates (task -> timebox -> story -> session) are handled automatically.
 */
export function sessionReducer(
  state: SessionManagerState,
  action: SessionAction
): SessionManagerState {
  switch (action.type) {
    // =========================================================================
    // SESSION LIFECYCLE
    // =========================================================================

    case 'SESSION_LOAD_START':
      return {
        ...state,
        status: 'loading',
        error: null,
      };

    case 'SESSION_LOAD_SUCCESS':
      return {
        ...state,
        session: action.payload.session,
        status: 'success',
        error: null,
      };

    case 'SESSION_LOAD_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload.error,
      };

    case 'SESSION_UPDATE':
      return {
        ...state,
        session: action.payload.session,
      };

    case 'SESSION_CLEAR':
      return {
        ...state,
        session: null,
        timer: {
          activeTimeBox: null,
          timeRemaining: null,
          isRunning: false,
          lastTickAt: null,
        },
        status: 'idle',
        error: null,
      };

    // =========================================================================
    // TIMER ACTIONS
    // =========================================================================

    case 'TIMER_START': {
      const { storyId, timeBoxIndex, durationSeconds } = action.payload;

      if (!state.session) return state;

      // Reset any in-progress timeboxes and set the new one
      let updatedStoryBlocks = resetInProgressTimeBoxes(state.session.storyBlocks);

      // Set the target timebox to in-progress with startTime
      updatedStoryBlocks = updateStoryBlocksWithCascade(
        updatedStoryBlocks,
        storyId,
        (story) => ({
          ...story,
          timeBoxes: story.timeBoxes.map((tb, idx) =>
            idx === timeBoxIndex
              ? {
                  ...tb,
                  status: 'in-progress' as TimeBoxStatus,
                  startTime: new Date().toISOString(),
                }
              : tb
          ),
        })
      );

      // Recalculate session status
      const newSessionStatus = calculateSessionStatus(updatedStoryBlocks);

      return {
        ...state,
        session: {
          ...state.session,
          storyBlocks: updatedStoryBlocks,
          status: newSessionStatus,
          lastUpdated: new Date().toISOString(),
        },
        timer: {
          activeTimeBox: { storyId, timeBoxIndex },
          timeRemaining: durationSeconds,
          isRunning: true,
          lastTickAt: Date.now(),
        },
      };
    }

    case 'TIMER_PAUSE':
      return {
        ...state,
        timer: {
          ...state.timer,
          isRunning: false,
          lastTickAt: null,
        },
      };

    case 'TIMER_RESUME':
      if (state.timer.timeRemaining === null || state.timer.timeRemaining <= 0) {
        return state;
      }
      return {
        ...state,
        timer: {
          ...state.timer,
          isRunning: true,
          lastTickAt: Date.now(),
        },
      };

    case 'TIMER_RESET': {
      if (!state.session || !state.timer.activeTimeBox) return state;

      const { storyId, timeBoxIndex } = state.timer.activeTimeBox;
      const story = state.session.storyBlocks.find((s) => s.id === storyId);
      if (!story) return state;

      const timeBox = story.timeBoxes[timeBoxIndex];
      if (!timeBox) return state;

      return {
        ...state,
        timer: {
          ...state.timer,
          timeRemaining: timeBox.duration * 60,
          isRunning: false,
          lastTickAt: null,
        },
      };
    }

    case 'TIMER_TICK': {
      if (!state.timer.isRunning || state.timer.timeRemaining === null) {
        return state;
      }

      const newTimeRemaining = Math.max(0, state.timer.timeRemaining - 1);

      // If timer reached zero, stop running but keep activeTimeBox
      if (newTimeRemaining === 0) {
        return {
          ...state,
          timer: {
            ...state.timer,
            timeRemaining: 0,
            isRunning: false,
            lastTickAt: null,
          },
        };
      }

      return {
        ...state,
        timer: {
          ...state.timer,
          timeRemaining: newTimeRemaining,
          lastTickAt: Date.now(),
        },
      };
    }

    case 'TIMER_SET_TIME':
      return {
        ...state,
        timer: {
          ...state.timer,
          timeRemaining: Math.max(0, action.payload.timeRemaining),
        },
      };

    case 'TIMER_COMPLETE':
      return {
        ...state,
        timer: {
          activeTimeBox: null,
          timeRemaining: null,
          isRunning: false,
          lastTickAt: null,
        },
      };

    case 'TIMER_RESTORE':
      return {
        ...state,
        timer: {
          activeTimeBox: action.payload.activeTimeBox,
          timeRemaining: action.payload.timeRemaining,
          isRunning: action.payload.isRunning,
          lastTickAt: action.payload.isRunning ? Date.now() : null,
        },
      };

    // =========================================================================
    // TIMEBOX ACTIONS
    // =========================================================================

    case 'TIMEBOX_START': {
      if (!state.session) return state;

      const { storyId, timeBoxIndex } = action.payload;

      // Reset any in-progress timeboxes first
      let updatedStoryBlocks = resetInProgressTimeBoxes(state.session.storyBlocks);

      // Set the target timebox to in-progress
      updatedStoryBlocks = updateStoryBlocksWithCascade(
        updatedStoryBlocks,
        storyId,
        (story) => ({
          ...story,
          timeBoxes: story.timeBoxes.map((tb, idx) =>
            idx === timeBoxIndex
              ? {
                  ...tb,
                  status: 'in-progress' as TimeBoxStatus,
                  startTime: new Date().toISOString(),
                }
              : tb
          ),
        })
      );

      const newSessionStatus = calculateSessionStatus(updatedStoryBlocks);

      return {
        ...state,
        session: {
          ...state.session,
          storyBlocks: updatedStoryBlocks,
          status: newSessionStatus,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    case 'TIMEBOX_COMPLETE': {
      if (!state.session) return state;

      const { storyId, timeBoxIndex, actualDuration } = action.payload;

      const updatedStoryBlocks = updateStoryBlocksWithCascade(
        state.session.storyBlocks,
        storyId,
        (story) => ({
          ...story,
          timeBoxes: story.timeBoxes.map((tb, idx) => {
            if (idx !== timeBoxIndex) return tb;

            // Calculate actual duration if not provided
            let computedActualDuration = actualDuration;
            if (computedActualDuration === undefined && tb.startTime) {
              const startTime = new Date(tb.startTime);
              const endTime = new Date();
              computedActualDuration = Math.round(
                (endTime.getTime() - startTime.getTime()) / 60000
              );
            }

            return {
              ...tb,
              status: 'completed' as TimeBoxStatus,
              actualDuration: computedActualDuration ?? tb.duration,
              // Mark all tasks as completed
              tasks: tb.tasks?.map((task) => ({
                ...task,
                status: 'completed' as TimeBoxStatus,
              })),
            };
          }),
        })
      );

      const newSessionStatus = calculateSessionStatus(updatedStoryBlocks);

      // Reset timer if this was the active timebox
      const shouldResetTimer =
        state.timer.activeTimeBox?.storyId === storyId &&
        state.timer.activeTimeBox?.timeBoxIndex === timeBoxIndex;

      return {
        ...state,
        session: {
          ...state.session,
          storyBlocks: updatedStoryBlocks,
          status: newSessionStatus,
          lastUpdated: new Date().toISOString(),
        },
        timer: shouldResetTimer
          ? { activeTimeBox: null, timeRemaining: null, isRunning: false, lastTickAt: null }
          : state.timer,
      };
    }

    case 'TIMEBOX_UNDO_COMPLETE': {
      if (!state.session) return state;

      const { storyId, timeBoxIndex } = action.payload;

      const updatedStoryBlocks = updateStoryBlocksWithCascade(
        state.session.storyBlocks,
        storyId,
        (story) => ({
          ...story,
          timeBoxes: story.timeBoxes.map((tb, idx) => {
            if (idx !== timeBoxIndex) return tb;

            // Only allow undoing completed timeboxes
            if (tb.status !== 'completed') return tb;

            return {
              ...tb,
              status: 'todo' as TimeBoxStatus,
              actualDuration: undefined,
              startTime: undefined,
              // Reset tasks to todo
              tasks: tb.tasks?.map((task) => ({
                ...task,
                status: 'todo' as TimeBoxStatus,
              })),
            };
          }),
        })
      );

      const newSessionStatus = calculateSessionStatus(updatedStoryBlocks);

      return {
        ...state,
        session: {
          ...state.session,
          storyBlocks: updatedStoryBlocks,
          status: newSessionStatus,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    case 'TIMEBOX_SET_STATUS': {
      if (!state.session) return state;

      const { storyId, timeBoxIndex, status } = action.payload;

      const updatedStoryBlocks = updateStoryBlocksWithCascade(
        state.session.storyBlocks,
        storyId,
        (story) => ({
          ...story,
          timeBoxes: story.timeBoxes.map((tb, idx) =>
            idx === timeBoxIndex ? { ...tb, status } : tb
          ),
        })
      );

      const newSessionStatus = calculateSessionStatus(updatedStoryBlocks);

      return {
        ...state,
        session: {
          ...state.session,
          storyBlocks: updatedStoryBlocks,
          status: newSessionStatus,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    // =========================================================================
    // TASK ACTIONS
    // =========================================================================

    case 'TASK_TOGGLE': {
      if (!state.session) return state;

      const { storyId, timeBoxIndex, taskIndex, status } = action.payload;

      const updatedStoryBlocks = updateStoryBlocksWithCascade(
        state.session.storyBlocks,
        storyId,
        (story) => {
          const timeBox = story.timeBoxes[timeBoxIndex];
          if (!timeBox?.tasks?.[taskIndex]) return story;

          // Update the task
          const updatedTasks = timeBox.tasks.map((task, idx) =>
            idx === taskIndex ? { ...task, status } : task
          );

          // Calculate new timebox status based on tasks
          const newTimeBoxStatus = calculateTimeBoxStatusFromTasks(updatedTasks);

          return {
            ...story,
            timeBoxes: story.timeBoxes.map((tb, idx) =>
              idx === timeBoxIndex
                ? { ...tb, tasks: updatedTasks, status: newTimeBoxStatus }
                : tb
            ),
          };
        }
      );

      const newSessionStatus = calculateSessionStatus(updatedStoryBlocks);

      // Check if task completion resulted in timebox completion
      const updatedStory = updatedStoryBlocks.find((s) => s.id === storyId);
      const updatedTimeBox = updatedStory?.timeBoxes[timeBoxIndex];
      const timeBoxJustCompleted = updatedTimeBox?.status === 'completed';

      // Reset timer if the active timebox just got auto-completed
      const shouldResetTimer =
        timeBoxJustCompleted &&
        state.timer.activeTimeBox?.storyId === storyId &&
        state.timer.activeTimeBox?.timeBoxIndex === timeBoxIndex;

      return {
        ...state,
        session: {
          ...state.session,
          storyBlocks: updatedStoryBlocks,
          status: newSessionStatus,
          lastUpdated: new Date().toISOString(),
        },
        timer: shouldResetTimer
          ? { activeTimeBox: null, timeRemaining: null, isRunning: false, lastTickAt: null }
          : state.timer,
      };
    }

    case 'TASK_UPDATE': {
      if (!state.session) return state;

      const { storyId, timeBoxIndex, taskIndex, updates } = action.payload;

      const updatedStoryBlocks = updateStoryBlocksWithCascade(
        state.session.storyBlocks,
        storyId,
        (story) => {
          const timeBox = story.timeBoxes[timeBoxIndex];
          if (!timeBox?.tasks?.[taskIndex]) return story;

          const updatedTasks = timeBox.tasks.map((task, idx) =>
            idx === taskIndex ? { ...task, ...updates } : task
          );

          // Recalculate timebox status if status was updated
          const newTimeBoxStatus =
            updates.status !== undefined
              ? calculateTimeBoxStatusFromTasks(updatedTasks)
              : timeBox.status;

          return {
            ...story,
            timeBoxes: story.timeBoxes.map((tb, idx) =>
              idx === timeBoxIndex
                ? { ...tb, tasks: updatedTasks, status: newTimeBoxStatus }
                : tb
            ),
          };
        }
      );

      const newSessionStatus = calculateSessionStatus(updatedStoryBlocks);

      return {
        ...state,
        session: {
          ...state.session,
          storyBlocks: updatedStoryBlocks,
          status: newSessionStatus,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    // =========================================================================
    // CASCADE/INTERNAL ACTIONS
    // =========================================================================

    case 'CASCADE_PROGRESS_UPDATE': {
      if (!state.session) return state;

      // Recalculate all story progress and session status
      const updatedStoryBlocks = state.session.storyBlocks.map((story) => ({
        ...story,
        progress: calculateStoryProgress(story.timeBoxes),
      }));

      const newSessionStatus = calculateSessionStatus(updatedStoryBlocks);

      return {
        ...state,
        session: {
          ...state.session,
          storyBlocks: updatedStoryBlocks,
          status: newSessionStatus,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    default:
      return state;
  }
}
