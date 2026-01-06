// /features/brain-dump/hooks/useBrainDump.ts
import { createSignal, createEffect, createMemo } from 'solid-js';
import { brainDumpService } from '../services/brain-dump-services';
import { SessionStorageService } from '../../services/session-storage.service';
import type { ProcessedStory, ProcessedTask } from '../../lib/types';
import { TaskRolloverService } from '../../services/task-rollover.service';
import { ErrorDetails } from '../types';
import { logger } from '../../../../lib/logger';
import { showNotification } from '../../../../lib/notifications';

const log = logger.create('BrainDump');

// Create a singleton instance of SessionStorageService
const sessionStorage = new SessionStorageService();

export function useBrainDump(onTasksProcessed?: (stories: ProcessedStory[]) => void) {
  const [tasks, setTasks] = createSignal<string>('');
  const [processedStories, setProcessedStories] = createSignal<ProcessedStory[]>([]);
  const [editedDurations, setEditedDurations] = createSignal<Record<string, number>>({});
  const [retryCount, setRetryCount] = createSignal(0);
  const [shouldNotifyParent, setShouldNotifyParent] = createSignal(false);
  const [isInputLocked, setIsInputLocked] = createSignal(false);

  // Task processing state
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [taskProcessingStep, setTaskProcessingStep] = createSignal<string>('');
  const [taskProcessingProgress, setTaskProcessingProgress] = createSignal(0);
  const [taskProcessingError, setTaskProcessingError] = createSignal<ErrorDetails | null>(null);

  // Session creation state
  const [isCreatingSession, setIsCreatingSession] = createSignal(false);
  const [sessionCreationStep, setSessionCreationStep] = createSignal<string>('');
  const [sessionCreationProgress, setSessionCreationProgress] = createSignal(0);
  const [sessionCreationError, setSessionCreationError] = createSignal<ErrorDetails | null>(null);

  // Create the rollover service once (no useMemo needed in Solid, just create it)
  const rolloverService = new TaskRolloverService();

  // Combined processing info - using createMemo for computed values
  const currentProcessingStep = createMemo(() =>
    isProcessing() ? taskProcessingStep() : isCreatingSession() ? sessionCreationStep() : ''
  );
  const currentProcessingProgress = createMemo(() =>
    isProcessing() ? taskProcessingProgress() : isCreatingSession() ? sessionCreationProgress() : 0
  );
  const currentError = createMemo(() => taskProcessingError() || sessionCreationError());

  // Effect to notify parent when stories are processed
  createEffect(() => {
    if (shouldNotifyParent() && processedStories().length > 0 && onTasksProcessed) {
      onTasksProcessed(processedStories());
      setShouldNotifyParent(false);
    }
  });

  const processTasks = async (shouldRetry = false) => {
    if (shouldRetry) {
      setRetryCount((prev) => prev + 1);
    } else {
      setRetryCount(0);
    }

    setIsProcessing(true);
    setTaskProcessingStep('Analyzing tasks...');
    setTaskProcessingProgress(20);
    setTaskProcessingError(null);

    try {
      const taskList = tasks()
        .split('\n')
        .filter((task) => task.trim());

      if (taskList.length === 0) {
        throw new Error('Please enter at least one task');
      }

      setTaskProcessingStep('Processing with AI...');
      setTaskProcessingProgress(40);

      const data = await brainDumpService.processTasks(taskList);

      setTaskProcessingStep('Organizing stories...');
      setTaskProcessingProgress(80);

      // Validate the response structure
      if (!data.stories || !Array.isArray(data.stories)) {
        log.error('Invalid response structure: ' + JSON.stringify(data));
        throw new Error('Invalid response format: missing stories array');
      }

      // Validate each story has the required fields
      const invalidStories = data.stories.filter((story: ProcessedStory) => {
        return !story.title || !story.tasks || !Array.isArray(story.tasks);
      });

      if (invalidStories.length > 0) {
        log.error('Invalid stories found: ' + JSON.stringify(invalidStories));
        throw new Error('Some stories are missing required fields');
      }

      setProcessedStories(data.stories);
      setShouldNotifyParent(true);
      setIsInputLocked(true); // Lock input after successful processing

      // Initialize edited durations
      const initialDurations: Record<string, number> = {};
      data.stories.forEach((story: ProcessedStory) => {
        initialDurations[story.title] = story.estimatedDuration;
      });
      setEditedDurations(initialDurations);

      setTaskProcessingProgress(100);
      setTaskProcessingStep('Complete!');

      // Show success notification to user
      showNotification({
        type: 'success',
        message: `Analyzed ${data.stories.length} work block${data.stories.length === 1 ? '' : 's'}. Review and create session when ready.`,
        duration: 4000,
      });
    } catch (error) {
      log.error('Failed to process tasks: ' + String(error));

      let errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      let errorCode = 'UNKNOWN_ERROR';
      let errorDetails = error;

      // Error handling logic
      if (error instanceof Error && typeof error.message === 'string') {
        try {
          if (error.message.includes('Details:')) {
            const [message, details] = error.message.split('\n\nDetails:');
            try {
              const parsedDetails = JSON.parse(details);
              errorDetails = parsedDetails;
              if (parsedDetails.response) {
                try {
                  const parsedResponse = JSON.parse(parsedDetails.response);
                  errorDetails = {
                    ...parsedDetails,
                    response: parsedResponse,
                  };
                } catch (e) {
                  // Keep the original response if parsing fails
                }
              }
            } catch (e) {
              errorDetails = details.trim();
            }
            errorMessage = message.trim();
          }
        } catch (e) {
          errorDetails = error.message;
        }
      }

      // Determine user-friendly message and notification type based on error
      let userMessage = errorMessage;
      let notificationAction: { label: string; onClick: () => void } | undefined;

      if (
        errorMessage.includes('Authentication required') ||
        errorMessage.includes('Sign in required') ||
        errorMessage.includes('MISSING_AUTH')
      ) {
        errorCode = 'AUTH_REQUIRED';
        userMessage = 'Please sign in to use AI features';
        notificationAction = {
          label: 'Sign In',
          onClick: () => {
            // Trigger sign in flow - dispatch event that App.tsx can listen to
            window.dispatchEvent(new CustomEvent('taco:show-login'));
          },
        };
      } else if (
        errorMessage.includes('Subscription required') ||
        errorMessage.includes('SUBSCRIPTION_REQUIRED') ||
        errorMessage.includes('tempo_extras')
      ) {
        errorCode = 'SUBSCRIPTION_REQUIRED';
        userMessage = 'Tempo Extras subscription required to use AI features ($12/mo)';
        notificationAction = {
          label: 'Subscribe',
          onClick: () => {
            window.location.href = '/pricing#tempo-extras';
          },
        };
      } else if (
        errorMessage.includes('Session expired') ||
        errorMessage.includes('SESSION_EXPIRED')
      ) {
        errorCode = 'SESSION_EXPIRED';
        userMessage = 'Your session has expired. Please sign in again.';
        notificationAction = {
          label: 'Sign In',
          onClick: () => {
            window.dispatchEvent(new CustomEvent('taco:show-login'));
          },
        };
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        errorCode = 'RATE_LIMITED';
        userMessage = 'Too many requests. Please wait a moment and try again.';
      }

      // Show toast notification to user
      showNotification({
        type: 'error',
        message: userMessage,
        duration: 8000,
        action: notificationAction,
      });

      setTaskProcessingError({
        message: errorMessage,
        code: errorCode,
        details: errorDetails,
      });
      setTaskProcessingStep('Error occurred');
      setTaskProcessingProgress(0);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setTaskProcessingProgress(0);
        setTaskProcessingStep('');
      }, 1000);
    }
  };

  const handleCreateSession = async () => {
    setIsCreatingSession(true);
    setSessionCreationError(null);
    setSessionCreationStep('Preparing session data...');
    setSessionCreationProgress(10);

    try {
      // Apply edited durations to stories while preserving all fields
      const currentStories = processedStories();
      const currentDurations = editedDurations();
      const updatedStories = currentStories.map((story) => ({
        ...story,
        estimatedDuration: currentDurations[story.title] || story.estimatedDuration,
        tasks: story.tasks.map((task) => ({ ...task })),
        projectType: story.projectType || 'Default Project',
        category: story.category || 'Development',
      }));

      // Pre-validation: Check if we have any stories with tasks
      if (
        updatedStories.length === 0 ||
        updatedStories.some((story) => !story.tasks || story.tasks.length === 0)
      ) {
        throw new Error('No valid tasks found for session creation');
      }

      // Log the stories being sent for debugging
      log.debug(`Stories for session creation: ${JSON.stringify(updatedStories, null, 2)}`);

      // Get current time and ensure it's valid
      const now = new Date();
      if (isNaN(now.getTime())) {
        throw new Error('Invalid current date/time');
      }

      const startTime = now.toISOString();
      setSessionCreationProgress(20);
      setSessionCreationStep('Creating session plan...');

      // Call service to create session
      const sessionPlan = await brainDumpService.createSession(updatedStories, startTime);

      setSessionCreationProgress(60);
      setSessionCreationStep('Processing session data...');

      // Validate session plan
      if (!sessionPlan || typeof sessionPlan !== 'object') {
        log.error('Invalid session plan: ' + JSON.stringify(sessionPlan));
        throw new Error('Failed to create a valid session plan');
      }

      // Check required properties
      if (!sessionPlan.storyBlocks || !Array.isArray(sessionPlan.storyBlocks)) {
        log.error('Session plan missing story blocks: ' + JSON.stringify(sessionPlan));
        throw new Error('Session plan missing required story blocks');
      }

      if (sessionPlan.storyBlocks.length === 0) {
        log.error('Session plan has empty story blocks array: ' + JSON.stringify(sessionPlan));
        throw new Error('Session plan contains no story blocks');
      }

      // Ensure we have a valid total duration
      const validTotalDuration = validateSessionDuration(sessionPlan);
      log.debug(`Validated session duration: ${validTotalDuration} minutes`);

      // Format today's date as YYYY-MM-DD for the session key
      const today = now.toISOString().split('T')[0];

      // Calculate end time with duration validation
      const durationMs = Math.floor(validTotalDuration) * 60 * 1000;

      // Validate duration range (between 1 minute and 24 hours)
      if (durationMs <= 0) {
        log.error(`Invalid duration (too small): ${validTotalDuration}`);
        throw new Error(`Session duration is too short: ${validTotalDuration} minutes`);
      }

      if (durationMs > 24 * 60 * 60 * 1000) {
        log.error(`Invalid duration (too large): ${validTotalDuration}`);
        throw new Error(`Session duration exceeds maximum allowed: ${validTotalDuration} minutes`);
      }

      // Calculate end time
      const endTime = new Date(now.getTime() + durationMs);

      // Validate end time
      if (isNaN(endTime.getTime())) {
        log.error(
          `End time calculation failed: now=${now.toISOString()}, durationMs=${durationMs}, totalDuration=${validTotalDuration}`
        );
        throw new Error('Failed to calculate a valid end time');
      }

      setSessionCreationProgress(80);
      setSessionCreationStep('Saving session...');

      // Session is now saved by the brain dump service
      setSessionCreationProgress(100);
      setSessionCreationStep('Session created successfully!');

      // Clear the form
      setTasks('');
      setProcessedStories([]);
      setEditedDurations({});
      setIsInputLocked(false);

      // After successful session creation, archive any previous active sessions
      try {
        const recentSession = await rolloverService.getMostRecentActiveSession();

        if (recentSession) {
          log.debug(`Archiving previous session: ${recentSession.date}`);
          await rolloverService.archiveSession(recentSession.date);
        }
      } catch (archiveError) {
        // Log but don't fail if archiving fails
        log.error('Error archiving previous session: ' + String(archiveError));
      }

      // Session created successfully - user can navigate via Sessions tab
      log.info(`Session created successfully for date: ${today}`);

      // Show success notification to user
      showNotification({
        type: 'success',
        message: 'Session created! Navigate to Sessions tab to start.',
        duration: 5000,
      });
    } catch (error) {
      log.error('Failed to create session: ' + String(error));

      // Detailed error handling
      let errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      let errorCode = 'SESSION_ERROR';
      let errorDetails = error;

      // Try to extract more details if available
      if (error instanceof Error) {
        if (error.message.includes('Details:')) {
          try {
            const [message, details] = error.message.split('\n\nDetails:');
            errorMessage = message.trim();
            try {
              errorDetails = JSON.parse(details.trim());
            } catch {
              errorDetails = details.trim();
            }
          } catch (e) {
            // If parsing fails, use the original error message
            errorDetails = error.message;
          }
        }

        // Check for specific error messages
        if (error.message.includes('work time') && error.message.includes('break')) {
          errorCode = 'EXCESSIVE_WORK_TIME';
          errorMessage =
            'Session contains too much consecutive work time without breaks. Try splitting large tasks or adding breaks.';
        } else if (error.message.includes('duration')) {
          errorCode = 'INVALID_DURATION';
          errorMessage = 'Invalid session duration. Please check your task durations.';
        }
      }

      // Show toast notification to user for session creation errors
      showNotification({
        type: 'error',
        message: errorMessage,
        duration: 8000,
      });

      setSessionCreationError({
        message: errorMessage,
        code: errorCode,
        details: errorDetails,
      });

      setSessionCreationProgress(0);
      setSessionCreationStep('Error creating session');
    } finally {
      setTimeout(() => {
        setIsCreatingSession(false);
        setSessionCreationProgress(0);
        setSessionCreationStep('');
      }, 1000);
    }
  };

  // Helper function to validate and extract session duration
  interface SessionPlanWithDuration extends Record<string, unknown> {
    totalDuration?: number;
    storyBlocks?: Array<{
      totalDuration?: number;
    }>;
    stories?: Array<{
      estimatedDuration?: number;
    }>;
  }

  function validateSessionDuration(sessionPlan: SessionPlanWithDuration): number {
    log.debug('Validating session duration for plan');

    // Check if totalDuration is directly available and valid
    if (typeof sessionPlan.totalDuration === 'number' && sessionPlan.totalDuration > 0) {
      log.debug(`Using provided totalDuration: ${sessionPlan.totalDuration}`);
      return sessionPlan.totalDuration;
    }

    log.warn('Session plan missing valid totalDuration, calculating from story blocks');

    // Calculate from story blocks if available
    if (Array.isArray(sessionPlan.storyBlocks) && sessionPlan.storyBlocks.length > 0) {
      const calculatedDuration = sessionPlan.storyBlocks.reduce(
        (sum: number, block) =>
          sum + (typeof block.totalDuration === 'number' ? block.totalDuration : 0),
        0
      );

      if (calculatedDuration > 0) {
        log.debug(`Calculated duration from blocks: ${calculatedDuration}`);

        // Update the session plan with the calculated value
        sessionPlan.totalDuration = calculatedDuration;

        return calculatedDuration;
      }
    }

    // If we can't calculate from blocks, try using the sum of story estimatedDurations
    if (Array.isArray(sessionPlan.stories) && sessionPlan.stories.length > 0) {
      const durationFromStories = sessionPlan.stories.reduce(
        (sum: number, story) =>
          sum + (typeof story.estimatedDuration === 'number' ? story.estimatedDuration : 0),
        0
      );

      if (durationFromStories > 0) {
        log.debug(`Calculated duration from stories: ${durationFromStories}`);

        // Update the session plan
        sessionPlan.totalDuration = durationFromStories;

        return durationFromStories;
      }
    }

    // Last resort: check if we have the original stories with durations
    const currentStories = processedStories();
    const currentDurations = editedDurations();
    if (currentStories.length > 0) {
      const originalDuration = currentStories.reduce(
        (sum, story) => sum + (currentDurations[story.title] || story.estimatedDuration || 0),
        0
      );

      if (originalDuration > 0) {
        log.debug(`Using original story durations as fallback: ${originalDuration}`);

        // Update the session plan
        sessionPlan.totalDuration = originalDuration;

        return originalDuration;
      }
    }

    // If all else fails, throw an error
    log.error('Could not determine valid session duration from any source');
    throw new Error('Unable to determine valid session duration');
  }

  const handleDurationChange = (storyTitle: string, newDuration: number) => {
    setEditedDurations((prev) => {
      const updated = {
        ...prev,
        [storyTitle]: newDuration,
      };

      // Update stories with new durations while preserving all fields
      const currentStories = processedStories();
      const updatedStories = currentStories.map((story) => {
        if (story.title === storyTitle) {
          const oldDuration = story.estimatedDuration;
          const scaleFactor = newDuration / oldDuration;

          // Scale task durations proportionally and round to nearest minute
          const updatedTasks = story.tasks.map((task) => ({
            ...task,
            duration: Math.max(1, Math.round(task.duration * scaleFactor)),
          }));

          // Calculate total after initial scaling
          let totalTaskDuration = updatedTasks.reduce((sum, task) => sum + task.duration, 0);

          // Distribute any remaining difference across tasks evenly
          if (totalTaskDuration !== newDuration) {
            const diff = newDuration - totalTaskDuration;
            const tasksToAdjust = [...updatedTasks]
              .sort((a, b) => b.duration - a.duration) // Sort by duration descending
              .slice(0, Math.abs(diff)); // Take as many tasks as we need to adjust

            // Add or subtract 1 minute from each task until we reach the target
            tasksToAdjust.forEach((task) => {
              const taskIndex = updatedTasks.findIndex((t) => t.title === task.title);
              if (taskIndex !== -1) {
                updatedTasks[taskIndex].duration += diff > 0 ? 1 : -1;
                totalTaskDuration += diff > 0 ? 1 : -1;
              }
            });

            // If we still have a difference, adjust the longest task
            if (totalTaskDuration !== newDuration) {
              const longestTask = updatedTasks.reduce(
                (max, task) => (task.duration > max.duration ? task : max),
                updatedTasks[0]
              );
              const taskIndex = updatedTasks.findIndex((t) => t.title === longestTask.title);
              updatedTasks[taskIndex].duration += newDuration - totalTaskDuration;
            }
          }

          return {
            ...story,
            estimatedDuration: newDuration,
            tasks: updatedTasks,
          };
        }
        return story;
      });

      setProcessedStories(updatedStories);
      setShouldNotifyParent(true);

      return updated;
    });
  };

  const handleRetry = () => {
    setIsInputLocked(false); // Unlock input on retry
    setProcessedStories([]); // Clear processed stories
    setEditedDurations({}); // Reset durations
    setTaskProcessingError(null);
    setSessionCreationError(null);
  };

  return {
    // State - return signals directly
    tasks,
    setTasks,
    processedStories,
    editedDurations,
    isInputLocked,
    retryCount,

    // Processing status - return signals directly
    isProcessing,
    isCreatingSession,
    processingStep: currentProcessingStep,
    processingProgress: currentProcessingProgress,
    error: currentError,

    // Actions
    processTasks,
    handleCreateSession,
    handleDurationChange,
    handleRetry,
  };
}
