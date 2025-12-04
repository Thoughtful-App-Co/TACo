import { createSignal, createEffect, createMemo, onCleanup } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import type { StoryBlock, TimeBox, TimeBoxTask, Session, TimeBoxStatus } from '../../lib/types';
import { SessionStorageService } from '../../services/session-storage.service';

// This is a minimal toast implementation since we don't have access to the actual toast component
// Replace with your actual toast implementation when available
const useToastFallback = () => {
  const toast = (props: {
    title: string;
    description: string;
    variant?: string;
    actionLabel?: string;
    onAction?: () => void;
  }) => {
    console.log(`[Toast] ${props.title}: ${props.description}`);
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

export interface UseSessionProps {
  id?: string;
  storageService?: SessionStorageService;
}

// Session mode type for user-selected work style
export type SessionMode = 'tasks' | 'flow';

// User-created subtask interface
export interface UserSubtask {
  id: string;
  title: string;
  status: 'todo' | 'completed';
}

export interface UseSessionReturn {
  session: () => Session | null;
  loading: () => boolean;
  error: () => Error | null;
  activeTimeBox: () => { storyId: string; timeBoxIndex: number } | null;
  activeSessionMode: () => SessionMode | null;
  timeRemaining: () => number | null;
  isTimerRunning: () => boolean;
  isSessionComplete: () => boolean;
  completedPercentage: () => number;
  handleTaskClick: (
    storyId: string | undefined,
    timeBoxIndex: number,
    taskIndex: number,
    task: TimeBoxTask
  ) => void;
  startTimeBox: (
    storyId: string,
    timeBoxIndex: number,
    duration: number,
    mode?: SessionMode,
    userSubtasks?: UserSubtask[]
  ) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  completeTimeBox: (storyId: string, timeBoxIndex: number) => void;
  undoCompleteTimeBox: (storyId: string, timeBoxIndex: number) => void;
  findNextWorkTimeBox: () => { storyId: string; timeBoxIndex: number } | null;
  findNextTimeBox: () => { storyId: string; timeBoxIndex: number } | null;
  isCurrentTimeBox: (timeBox: TimeBox) => boolean;
  updateTimeRemaining: (newTime: number) => void;
  getActiveStoryTitle: () => string | null;
}

export const useSession = ({
  id,
  storageService = new SessionStorageService(),
}: UseSessionProps): UseSessionReturn => {
  const { toast } = useToastFallback();
  const navigate = useNavigate();
  const [session, setSession] = createSignal<Session | null>(null);
  const [loading, setLoading] = createSignal<boolean>(true);
  const [error, setError] = createSignal<Error | null>(null);

  // Session mode state (tasks or flow)
  const [activeSessionMode, setActiveSessionMode] = createSignal<SessionMode | null>(null);

  // Timer state
  const [activeTimeBox, setActiveTimeBox] = createSignal<{
    storyId: string;
    timeBoxIndex: number;
  } | null>(null);
  const [timeRemaining, setTimeRemaining] = createSignal<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = createSignal<boolean>(false);
  // Use ref instead of state for timer ID to prevent re-renders
  let timerIdRef: ReturnType<typeof setInterval> | null = null;

  // Calculate session progress
  const completedPercentage = createMemo(() => {
    if (!session()) return 0;

    const allWorkTimeBoxes = session()!.storyBlocks.flatMap((story) =>
      story.timeBoxes
        .map((timeBox, index) => ({ timeBox, storyId: story.id, index }))
        .filter((item) => item.timeBox.type === 'work')
    );

    const totalWorkBoxes = allWorkTimeBoxes.length;
    const completedWorkBoxes = allWorkTimeBoxes.filter(
      (item) => item.timeBox.status === 'completed'
    ).length;

    return totalWorkBoxes > 0 ? Math.round((completedWorkBoxes / totalWorkBoxes) * 100) : 0;
  });

  const isSessionComplete = createMemo(() => {
    return completedPercentage() === 100;
  });

  // Update session in storage
  const updateSession = async (updatedSession: Session): Promise<void> => {
    try {
      if (!updatedSession.date) return;

      // Call the service to save the updated session
      await storageService.saveSession(updatedSession.date, updatedSession);
      setSession(updatedSession);

      // Refresh the page if needed
      navigate(window.location.pathname, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update session'));
      toast({
        title: 'Error',
        description: 'Failed to update session',
        variant: 'destructive',
      });
    }
  };

  // Find the next available work timebox
  const findNextTimeBox = () => {
    if (!session()) return null;

    for (let i = 0; i < session()!.storyBlocks.length; i++) {
      const story = session()!.storyBlocks[i];
      for (let j = 0; j < story.timeBoxes.length; j++) {
        const timeBox = story.timeBoxes[j];
        if (timeBox.status === 'todo') {
          return { storyId: story.id, timeBoxIndex: j };
        }
      }
    }

    return null;
  };

  // For backward compatibility - finds only work timeboxes
  const findNextWorkTimeBox = () => {
    if (!session()) return null;

    for (let i = 0; i < session()!.storyBlocks.length; i++) {
      const story = session()!.storyBlocks[i];
      for (let j = 0; j < story.timeBoxes.length; j++) {
        const timeBox = story.timeBoxes[j];
        if (timeBox.type === 'work' && timeBox.status === 'todo') {
          return { storyId: story.id, timeBoxIndex: j };
        }
      }
    }

    return null;
  };

  // Helper to calculate story progress
  const calculateStoryProgress = (story: StoryBlock): number => {
    const workTimeBoxes = story.timeBoxes.filter((tb) => tb.type === 'work');
    if (workTimeBoxes.length === 0) return 0;

    const completedTimeBoxes = workTimeBoxes.filter((tb) => tb.status === 'completed');
    return Math.round((completedTimeBoxes.length / workTimeBoxes.length) * 100);
  };

  // Helper to find an in-progress timebox
  const findInProgressTimeBox = (currentSession: Session) => {
    for (let i = 0; i < currentSession.storyBlocks.length; i++) {
      const story = currentSession.storyBlocks[i];
      for (let j = 0; j < story.timeBoxes.length; j++) {
        if (story.timeBoxes[j].status === 'in-progress') {
          return { storyId: story.id, timeBoxIndex: j };
        }
      }
    }
    return null;
  };

  // Undo the completion of a timebox
  const undoCompleteTimeBox = (storyId: string, timeBoxIndex: number) => {
    if (!session()) return;

    const storyIndex = session()!.storyBlocks.findIndex((story) => story.id === storyId);

    if (storyIndex === -1) {
      console.error(`Story with ID ${storyId} not found`);
      return;
    }

    // Get the current timebox
    const currentTimeBox = session()!.storyBlocks[storyIndex].timeBoxes[timeBoxIndex];

    // Only allow undoing completed timeboxes
    if (currentTimeBox.status !== 'completed') {
      console.warn('Cannot undo a timebox that is not completed');
      return;
    }

    // Create fully immutable update for SolidJS reactivity
    const updatedSession: Session = {
      ...session()!,
      storyBlocks: session()!.storyBlocks.map((story, sIdx) => {
        if (sIdx !== storyIndex) return story;

        const updatedTimeBoxes = story.timeBoxes.map((tb, tbIdx) => {
          if (tbIdx !== timeBoxIndex) return tb;
          return {
            ...tb,
            status: 'todo' as TimeBoxStatus,
            // Reset tasks to todo status
            tasks: tb.tasks?.map((task) => ({ ...task, status: 'todo' as const })) || [],
          };
        });

        return {
          ...story,
          timeBoxes: updatedTimeBoxes,
          progress: calculateStoryProgress({ ...story, timeBoxes: updatedTimeBoxes }),
        };
      }),
    };

    // Update session in storage
    updateSession(updatedSession);

    // Call the API to update the timebox status
    storageService.updateTimeBoxStatus(
      session()!.date,
      storyId,
      timeBoxIndex,
      'todo' as TimeBoxStatus
    );

    toast({
      title: 'Timebox Reverted',
      description: "The timebox has been reverted to 'todo' status.",
    });
  };

  // Complete a timebox
  const completeTimeBox = (storyId: string, timeBoxIndex: number) => {
    if (!session()) return;

    // Stop the timer if it's running
    if (timerIdRef) {
      clearInterval(timerIdRef);
      timerIdRef = null;
    }

    const storyIndex = session()!.storyBlocks.findIndex((story) => story.id === storyId);

    if (storyIndex === -1) {
      console.error(`Story with ID ${storyId} not found`);
      return;
    }

    const currentTimeBox = session()!.storyBlocks[storyIndex].timeBoxes[timeBoxIndex];

    // Calculate actual duration
    let actualDuration: number;
    let startTime = currentTimeBox.startTime;

    if (startTime) {
      const startDate = new Date(startTime);
      const endTime = new Date();
      actualDuration = Math.round((endTime.getTime() - startDate.getTime()) / 60000);

      console.log(
        `TimeBox completed - Type: ${currentTimeBox.type}, ID: ${storyId}-${timeBoxIndex}`
      );
      console.log(`  Start Time: ${startTime}`);
      console.log(`  End Time: ${endTime.toISOString()}`);
      console.log(
        `  Actual Duration: ${actualDuration}min (planned: ${currentTimeBox.duration}min)`
      );
    } else {
      // Handle missing startTime by creating a synthetic one
      console.warn(
        `TimeBox has no startTime record! Type: ${currentTimeBox.type}, ID: ${storyId}-${timeBoxIndex}`
      );

      if (currentTimeBox.type === 'work') {
        actualDuration = Math.max(1, Math.floor(currentTimeBox.duration * 0.8));
        console.log(`Using synthetic duration for focus session: ${actualDuration}min`);
      } else {
        const variation = -Math.floor(Math.random() * 2);
        actualDuration = Math.max(1, currentTimeBox.duration + variation);
        console.log(`Using synthetic duration for break: ${actualDuration}min`);
      }

      startTime = new Date(new Date().getTime() - actualDuration * 60000).toISOString();
    }

    // Save actual duration to storage
    if (session()!.date) {
      storageService.saveActualDuration(session()!.date, storyId, timeBoxIndex, actualDuration);
    }

    // Reset timer state if this was the active timebox
    if (activeTimeBox()?.storyId === storyId && activeTimeBox()?.timeBoxIndex === timeBoxIndex) {
      setActiveTimeBox(null);
      setTimeRemaining(null);
      setIsTimerRunning(false);
    }

    // Create fully immutable update for SolidJS reactivity
    const updatedSession: Session = {
      ...session()!,
      storyBlocks: session()!.storyBlocks.map((story, sIdx) => {
        if (sIdx !== storyIndex) return story;

        const updatedTimeBoxes = story.timeBoxes.map((tb, tbIdx) => {
          if (tbIdx !== timeBoxIndex) return tb;
          return {
            ...tb,
            status: 'completed' as TimeBoxStatus,
            startTime,
            actualDuration,
            // Mark all tasks as completed
            tasks: tb.tasks?.map((task) => ({ ...task, status: 'completed' as const })) || [],
          };
        });

        return {
          ...story,
          timeBoxes: updatedTimeBoxes,
          progress: calculateStoryProgress({ ...story, timeBoxes: updatedTimeBoxes }),
        };
      }),
    };

    // Update session in storage
    updateSession(updatedSession);

    // Call the API to update the timebox status
    storageService.updateTimeBoxStatus(
      session()!.date,
      storyId,
      timeBoxIndex,
      'completed' as TimeBoxStatus
    );

    // Find next timebox to suggest
    const nextTimeBox = findNextTimeBox();
    if (nextTimeBox) {
      const nextStoryIndex = updatedSession.storyBlocks.findIndex(
        (story) => story.id === nextTimeBox.storyId
      );
      if (nextStoryIndex !== -1) {
        const nextBoxType =
          updatedSession.storyBlocks[nextStoryIndex].timeBoxes[nextTimeBox.timeBoxIndex].type;
        const boxTypeLabel =
          nextBoxType === 'work'
            ? 'focus session'
            : nextBoxType === 'short-break' || nextBoxType === 'long-break'
              ? 'break'
              : nextBoxType === 'debrief'
                ? 'debrief session'
                : 'next activity';

        toast({
          title: 'Timebox Completed',
          description: `Your next ${boxTypeLabel} is ready to start. Check the highlighted button.`,
          actionLabel: 'Go to Next',
          onAction: () => {},
        });
      }
    } else {
      toast({
        title: 'Timebox Completed',
        description: 'All timeboxes have been completed!',
      });
    }
  };

  // Start a timebox with optional user-created subtasks
  const startTimeBox = (
    storyId: string,
    timeBoxIndex: number,
    duration: number,
    mode: SessionMode = 'tasks',
    userSubtasks?: UserSubtask[]
  ) => {
    if (!session()) return;

    // Clear any existing timers
    if (timerIdRef) {
      clearInterval(timerIdRef);
      timerIdRef = null;
    }

    const storyIndex = session()!.storyBlocks.findIndex((story) => story.id === storyId);

    if (storyIndex === -1) {
      // Handle the special case for session-debrief
      if (storyId === 'session-debrief') {
        console.log(`Starting debrief timer for ${duration} minutes`);

        // Set timer state without attempting to update non-existent timeBox
        setActiveTimeBox({ storyId, timeBoxIndex });
        setActiveSessionMode(mode);
        setTimeRemaining(duration * 60); // Convert minutes to seconds
        setIsTimerRunning(true);

        toast({
          title: 'Debrief Started',
          description: `Timer set for ${duration} minutes to reflect on your session.`,
        });

        return;
      }

      console.error(`Story with ID ${storyId} not found`);
      return;
    }

    // Build the new tasks array for the target timebox
    let newTasks: TimeBoxTask[];
    if (mode === 'flow') {
      newTasks = [];
    } else if (userSubtasks && userSubtasks.length > 0) {
      // Convert UserSubtask to TimeBoxTask format
      newTasks = userSubtasks.map((subtask) => ({
        title: subtask.title,
        duration: 0, // User subtasks don't have individual durations
        status: subtask.status as 'todo' | 'completed',
        isFrog: false,
        isFlexible: true,
      }));
    } else {
      // Keep existing tasks if any
      newTasks = [...(session()!.storyBlocks[storyIndex].timeBoxes[timeBoxIndex].tasks || [])];
    }

    // Create a fully immutable update to trigger SolidJS reactivity
    const updatedSession: Session = {
      ...session()!,
      storyBlocks: session()!.storyBlocks.map((story, sIdx) => ({
        ...story,
        timeBoxes: story.timeBoxes.map((tb, tbIdx) => {
          // Reset any previously in-progress timeboxes to todo
          if (tb.status === 'in-progress') {
            return { ...tb, status: 'todo' as TimeBoxStatus };
          }
          // Update the target timebox
          if (sIdx === storyIndex && tbIdx === timeBoxIndex) {
            return {
              ...tb,
              status: 'in-progress' as TimeBoxStatus,
              tasks: newTasks,
              startTime: new Date().toISOString(),
            };
          }
          return tb;
        }),
      })),
    };

    const timeBox = updatedSession.storyBlocks[storyIndex].timeBoxes[timeBoxIndex];
    console.log(
      `Starting TimeBox - Type: ${timeBox.type}, Mode: ${mode}, ID: ${storyId}-${timeBoxIndex}, Start Time: ${timeBox.startTime}`
    );
    if (userSubtasks && userSubtasks.length > 0) {
      console.log(`  User subtasks: ${userSubtasks.map((t) => t.title).join(', ')}`);
    }

    // Set timer state and session mode
    setActiveTimeBox({ storyId, timeBoxIndex });
    setActiveSessionMode(mode);
    setTimeRemaining(duration * 60); // Convert minutes to seconds
    setIsTimerRunning(true);

    // Update session in storage
    updateSession(updatedSession);

    // Call the API to update the timebox status
    storageService.updateTimeBoxStatus(
      session()!.date,
      storyId,
      timeBoxIndex,
      'in-progress' as TimeBoxStatus
    );

    const storyTitle = updatedSession.storyBlocks[storyIndex].title;
    toast({
      title: mode === 'flow' ? 'Focus Session Started' : 'Session Started',
      description: `${storyTitle} - ${duration} minutes`,
    });
  };

  // Get the title of the active story block
  const getActiveStoryTitle = (): string | null => {
    const active = activeTimeBox();
    if (!active || !session()) return null;

    const story = session()!.storyBlocks.find((s) => s.id === active.storyId);
    return story?.title || null;
  };

  // Handle task click
  const handleTaskClick = (
    storyId: string | undefined,
    timeBoxIndex: number,
    taskIndex: number,
    task: TimeBoxTask
  ) => {
    if (!session() || !storyId) {
      console.error('Cannot toggle task status: session or storyId is undefined');
      return;
    }

    console.log('TASK UPDATE - Checking if task status changed in props:', task.status);

    const storyIndex = session()!.storyBlocks.findIndex((story) => story.id === storyId);

    if (storyIndex === -1) {
      console.error(`Story with ID ${storyId} not found`);
      return;
    }

    // Validate that the timeBox and its tasks array exist
    const currentTimeBox = session()!.storyBlocks[storyIndex].timeBoxes[timeBoxIndex];
    if (!currentTimeBox || !currentTimeBox.tasks) {
      console.error(`TimeBox or tasks array not found at index ${timeBoxIndex}`);
      return;
    }

    // Get the current task
    const currentTask = currentTimeBox.tasks[taskIndex];

    // Only proceed if the status has actually changed
    if (currentTask.status === task.status) {
      console.log('Task status unchanged, no update needed');
      return;
    }

    console.log('Updating task status from', currentTask.status, 'to', task.status);

    // Build new tasks array with the updated task
    const newTasks = currentTimeBox.tasks.map((t, idx) =>
      idx === taskIndex ? { ...t, status: task.status } : t
    );

    // Check if all tasks are completed in this timebox
    const allTasksCompleted = newTasks.every((t) => t.status === 'completed');

    // If this is the active timebox and all tasks completed, reset timer state
    if (allTasksCompleted) {
      if (activeTimeBox()?.storyId === storyId && activeTimeBox()?.timeBoxIndex === timeBoxIndex) {
        setActiveTimeBox(null);
        setTimeRemaining(null);
        setIsTimerRunning(false);
        if (timerIdRef) clearInterval(timerIdRef);
      }
    }

    // Create fully immutable update for SolidJS reactivity
    const updatedSession: Session = {
      ...session()!,
      storyBlocks: session()!.storyBlocks.map((story, sIdx) => {
        if (sIdx !== storyIndex) return story;

        const updatedTimeBoxes = story.timeBoxes.map((tb, tbIdx) => {
          if (tbIdx !== timeBoxIndex) return tb;
          return {
            ...tb,
            tasks: newTasks,
            status: allTasksCompleted ? ('completed' as TimeBoxStatus) : tb.status,
          };
        });

        return {
          ...story,
          timeBoxes: updatedTimeBoxes,
          progress: calculateStoryProgress({ ...story, timeBoxes: updatedTimeBoxes }),
        };
      }),
    };

    // Update session in storage
    updateSession(updatedSession);

    // Call server-side action to update task status
    storageService.updateTaskStatus(
      session()!.date,
      storyId,
      timeBoxIndex,
      taskIndex,
      // Convert any status to either 'todo' or 'completed' for API compatibility
      (task.status === 'completed' ? 'completed' : 'todo') as 'todo' | 'completed'
    );
  };

  // Pause the timer
  const pauseTimer = () => {
    if (!isTimerRunning() || !session() || !activeTimeBox() || timeRemaining() === null) return;

    setIsTimerRunning(false);

    if (timerIdRef) {
      clearInterval(timerIdRef);
      timerIdRef = null;
    }

    // Persist the paused timer state
    if (session()!.date) {
      storageService.saveTimerState(session()!.date, activeTimeBox(), timeRemaining(), false);
    }

    toast({
      title: 'Timer Paused',
      description: 'You can resume the timer when ready',
    });
  };

  // Resume the timer
  const resumeTimer = () => {
    if (isTimerRunning() || !activeTimeBox() || timeRemaining() === null || timeRemaining()! <= 0)
      return;

    setIsTimerRunning(true);

    // Persist the resumed timer state
    if (session()?.date) {
      storageService.saveTimerState(session()!.date, activeTimeBox(), timeRemaining(), true);
    }

    toast({
      title: 'Timer Resumed',
      description: `${Math.floor(timeRemaining()! / 60)}:${(timeRemaining()! % 60).toString().padStart(2, '0')} remaining`,
    });
  };

  // Reset the timer
  const resetTimer = () => {
    if (!session() || !activeTimeBox()) return;

    if (timerIdRef) {
      clearInterval(timerIdRef);
      timerIdRef = null;
    }

    const storyIndex = session()!.storyBlocks.findIndex(
      (story) => story.id === activeTimeBox()!.storyId
    );

    if (storyIndex !== -1) {
      const duration =
        session()!.storyBlocks[storyIndex].timeBoxes[activeTimeBox()!.timeBoxIndex].duration;
      const newTimeRemaining = duration * 60;
      setTimeRemaining(newTimeRemaining);
      setIsTimerRunning(false);

      // Persist the reset timer state
      if (session()!.date) {
        storageService.saveTimerState(session()!.date, activeTimeBox(), newTimeRemaining, false);
      }

      toast({
        title: 'Timer Reset',
        description: `Timer reset to ${duration} minutes`,
      });
    }
  };

  // Update time remaining - new function for time adjustment
  const updateTimeRemaining = (newTime: number) => {
    if (!activeTimeBox() || !session()) return;

    // Update the time remaining
    setTimeRemaining(newTime);

    // Persist the updated timer state
    if (session()!.date) {
      storageService.saveTimerState(session()!.date, activeTimeBox(), newTime, isTimerRunning());
    }

    // Optionally notify the user
    const minutes = Math.floor(newTime / 60);
    const seconds = newTime % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    toast({
      title: 'Timer Adjusted',
      description: `Time updated to ${formattedTime}`,
    });
  };

  // Check if a timebox is the current active one
  const isCurrentTimeBox = (timeBox: TimeBox) => {
    if (!activeTimeBox() || !session()) return false;

    const storyIndex = session()!.storyBlocks.findIndex(
      (story) => story.id === activeTimeBox()!.storyId
    );
    if (storyIndex === -1) return false;

    const activeBox = session()!.storyBlocks[storyIndex].timeBoxes[activeTimeBox()!.timeBoxIndex];

    // Compare objects to see if they're the same instance
    return activeBox === timeBox;
  };

  // Track if we've already triggered auto-complete for the current timebox
  // This prevents multiple completions from firing
  let autoCompleteTriggered = false;

  // Start timer interval for countdown
  const startTimerInterval = () => {
    // Clear existing timer if any
    if (timerIdRef) {
      clearInterval(timerIdRef);
    }

    // Reset auto-complete flag when starting a new timer
    autoCompleteTriggered = false;

    // Create new timer
    timerIdRef = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime === null || prevTime <= 0) {
          // Stop the timer if time is up
          if (timerIdRef) {
            clearInterval(timerIdRef);
            timerIdRef = null;
          }
          setIsTimerRunning(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  // Effect to auto-complete timebox when timer reaches 0
  createEffect(() => {
    const remaining = timeRemaining();
    const active = activeTimeBox();

    // Only trigger when timer reaches exactly 0, there's an active timebox,
    // and we haven't already triggered auto-complete
    if (remaining === 0 && active && !autoCompleteTriggered) {
      autoCompleteTriggered = true;

      console.log(
        `Timer completed for timebox ${active.storyId}-${active.timeBoxIndex}, auto-completing...`
      );

      // Use setTimeout to ensure state updates have propagated
      setTimeout(() => {
        completeTimeBox(active.storyId, active.timeBoxIndex);
      }, 100);
    }

    // Reset the flag when a new timebox becomes active (timeRemaining changes from null/0 to a positive value)
    if (remaining !== null && remaining > 0) {
      autoCompleteTriggered = false;
    }
  });

  // Effect to handle starting/stopping timer based on isTimerRunning state
  createEffect(() => {
    if (isTimerRunning() && timeRemaining() !== null && timeRemaining()! > 0) {
      startTimerInterval();
    } else if (!isTimerRunning() && timerIdRef) {
      clearInterval(timerIdRef);
      timerIdRef = null;
    }

    // Save timer state whenever it changes
    if (session() && session()!.date && activeTimeBox()) {
      storageService.saveTimerState(
        session()!.date,
        activeTimeBox(),
        timeRemaining(),
        isTimerRunning()
      );
    }

    // Cleanup timer on unmount
    onCleanup(() => {
      if (timerIdRef) {
        clearInterval(timerIdRef);
        timerIdRef = null;
      }
    });
  });

  // Ensure startTime is set for the activeTimeBox whenever it changes
  createEffect(() => {
    if (!session() || !activeTimeBox()) return;

    const updatedSession = { ...session()! };
    const storyIndex = updatedSession.storyBlocks.findIndex(
      (story) => story.id === activeTimeBox()!.storyId
    );

    if (storyIndex === -1) return;

    const timeBox = updatedSession.storyBlocks[storyIndex].timeBoxes[activeTimeBox()!.timeBoxIndex];

    // Make sure startTime is set for all timeboxes when active
    if (timeBox && !timeBox.startTime && timeBox.status === 'in-progress') {
      console.log(
        `Setting missing startTime for active TimeBox - Type: ${timeBox.type}, ID: ${activeTimeBox()!.storyId}-${activeTimeBox()!.timeBoxIndex}`
      );
      timeBox.startTime = new Date().toISOString();
      updateSession(updatedSession);
    }
  });

  // Load session
  createEffect(() => {
    const loadSession = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const loadedSession = await storageService.getSession(id);
        if (loadedSession) {
          setSession(loadedSession);

          // Load timer state from storage first
          const timerState = await storageService.getTimerState(id);

          if (timerState && timerState.activeTimeBox) {
            // Use persisted timer state if available
            setActiveTimeBox(timerState.activeTimeBox);
            setTimeRemaining(timerState.timeRemaining);
            setIsTimerRunning(timerState.isTimerRunning);
          } else {
            // Fall back to finding in-progress timebox
            const inProgressTimeBox = findInProgressTimeBox(loadedSession);
            if (inProgressTimeBox) {
              setActiveTimeBox(inProgressTimeBox);
              // Set time remaining based on the stored remaining time or default to full duration
              const storyIndex = loadedSession.storyBlocks.findIndex(
                (s) => s.id === inProgressTimeBox.storyId
              );
              if (storyIndex !== -1) {
                const timeBox =
                  loadedSession.storyBlocks[storyIndex].timeBoxes[inProgressTimeBox.timeBoxIndex];
                setTimeRemaining((timeBox as any).remainingTime || timeBox.duration * 60);
              }
            }
          }
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load session'));
        setLoading(false);
      }
    };

    loadSession();
  });

  // Persist timer state when user leaves the page
  createEffect(() => {
    // Function to run before page unload
    const handleBeforeUnload = () => {
      // Save current timer state if session exists
      if (session()?.date) {
        // Calculate the exact remaining time for accurate persistence
        const exactTimeRemaining = timeRemaining();

        // If timer is running, adjust the time for accuracy
        if (isTimerRunning() && timerIdRef) {
          // We can't depend on exact calculations during unload, so we just save what we know
          storageService.saveTimerState(
            session()!.date,
            activeTimeBox(),
            exactTimeRemaining,
            isTimerRunning()
          );
        }
      }
    };

    // Add event listener for when the page is about to be unloaded
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Add event listener for when user navigates within the app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && session()?.date) {
        storageService.saveTimerState(
          session()!.date,
          activeTimeBox(),
          timeRemaining(),
          isTimerRunning()
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up event listeners
    onCleanup(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Also save timer state on component unmount
      if (session()?.date) {
        storageService.saveTimerState(
          session()!.date,
          activeTimeBox(),
          timeRemaining(),
          isTimerRunning()
        );
      }
    });
  });

  return {
    session,
    loading,
    error,
    activeTimeBox,
    activeSessionMode,
    timeRemaining,
    isTimerRunning,
    isSessionComplete,
    completedPercentage,
    handleTaskClick,
    startTimeBox,
    pauseTimer,
    resumeTimer,
    resetTimer,
    completeTimeBox,
    undoCompleteTimeBox,
    findNextWorkTimeBox,
    findNextTimeBox,
    isCurrentTimeBox,
    getActiveStoryTitle,
    updateTimeRemaining,
  };
};
