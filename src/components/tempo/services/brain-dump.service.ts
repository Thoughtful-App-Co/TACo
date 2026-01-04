// Brain Dump Service - Ported from Next.js to SolidJS
// Handles task processing and session creation via API calls

import type { DifficultyLevel, ProcessedStory, ProcessedTask, BaseStatus } from '../lib/types';
import { DURATION_RULES, roundToNearestBlock } from '../lib/durationUtils';
import { TaskPersistenceService } from './task-persistence.service';
import { ApiConfigService } from './api-config.service';
import { logger } from '../../../lib/logger';

const log = logger.create('BrainDump');

// API Error types
export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface ErrorDetails {
  message: string;
  code?: string;
  stack?: string;
  details?: unknown;
  cause?: unknown;
  response?: Record<string, unknown>;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as ApiError).error === 'string'
  );
}

// Helper to determine task difficulty based on duration
const determineDifficulty = (duration: number): DifficultyLevel => {
  if (duration <= 30) return 'low';
  if (duration <= 60) return 'medium';
  return 'high';
};

/**
 * Process raw task list into structured stories via API
 */
const processTasks = async (taskList: string[]) => {
  const apiKey = ApiConfigService.getClaudeApiKey();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Add API key to headers if available (for client-side processing)
  if (apiKey) {
    headers['X-Claude-API-Key'] = apiKey;
  }

  const response = await fetch('/api/tasks/process', {
    method: 'POST',
    headers,
    body: JSON.stringify({ tasks: taskList }),
  });

  const data = await response.json();

  if (!response.ok) {
    // If the response contains error details, throw them
    if (isApiError(data)) {
      const errorDetails = data.details
        ? `\n\nDetails: ${JSON.stringify(data.details, null, 2)}`
        : '';
      throw new Error(`${data.error}${errorDetails}`);
    }
    // If it's a raw error message
    throw new Error(data.error || 'Failed to process tasks');
  }

  // Ensure all tasks have a valid duration and difficulty
  if (data.stories) {
    data.stories = data.stories.map((story: ProcessedStory) => ({
      ...story,
      tasks: story.tasks.map((task: ProcessedTask) => {
        const validDuration = task.duration || DURATION_RULES.MIN_DURATION;
        return {
          ...task,
          duration: validDuration,
          // Add difficulty based on duration if not already present
          difficulty: (task as any).difficulty || determineDifficulty(validDuration),
        };
      }),
    }));
  }

  return data;
};

/**
 * Modify stories based on error types to retry session creation
 * Implements aggressive task splitting and break insertion
 */
const modifyStoriesForRetry = (
  stories: ProcessedStory[],
  error: { details?: { block?: string; preventiveModification?: boolean } } | unknown
): ProcessedStory[] => {
  // Create a deep copy to avoid mutating the original data
  const modifiedStories = JSON.parse(JSON.stringify(stories)) as ProcessedStory[];

  log.debug('Modifying stories for retry. Error details:', (error as any)?.details);

  // Check if we have a specific error for a block
  const problematicBlock = (error as any)?.details?.block;

  // More aggressive task splitting - use duration rules from durationUtils
  modifiedStories.forEach((story) => {
    log.debug(`Processing story "${story.title}" with ${story.tasks.length} tasks`);
    const updatedTasks: ProcessedTask[] = [];
    let cumulativeWorkTime = 0;

    // Store original title for reference before any splitting
    const originalTitle = story.title;

    // Set an even more aggressive max task duration for large blocks
    // This is to ensure we don't exceed MAX_WORK_WITHOUT_BREAK
    const isProblematicBlock = problematicBlock && story.title === problematicBlock;
    const maxTaskDuration = isProblematicBlock
      ? Math.floor(DURATION_RULES.MAX_WORK_WITHOUT_BREAK / 3) // Even more aggressive for problem blocks (30 mins)
      : Math.floor(DURATION_RULES.MAX_WORK_WITHOUT_BREAK / 2); // Standard aggressive (45 mins)

    // First pass: Split all tasks that exceed the max duration or contribute to excessive work time
    story.tasks.forEach((task, taskIndex) => {
      // If this task would push cumulative work time over the limit, split it even if duration is small
      const wouldExceedLimit =
        cumulativeWorkTime + task.duration > DURATION_RULES.MAX_WORK_WITHOUT_BREAK;

      // Always split large tasks or tasks that would push us over the limit
      if (task.duration > maxTaskDuration || wouldExceedLimit) {
        log.debug(`Splitting task "${task.title}" (${task.duration} minutes) into smaller parts`);

        // For extremely large tasks, be even more aggressive with splitting
        const effectiveMaxTaskDuration = Math.min(
          maxTaskDuration,
          wouldExceedLimit
            ? DURATION_RULES.MAX_WORK_WITHOUT_BREAK - cumulativeWorkTime
            : maxTaskDuration
        );

        const numParts = Math.max(2, Math.ceil(task.duration / effectiveMaxTaskDuration));
        let remainingDuration = task.duration;

        for (let i = 0; i < numParts; i++) {
          // Reset cumulative work time after each part (assuming breaks will be added)
          if (i > 0) {
            cumulativeWorkTime = 0;
          }

          // Calculate part duration and round to nearest block
          const rawPartDuration =
            i === numParts - 1
              ? remainingDuration
              : Math.min(effectiveMaxTaskDuration, remainingDuration);

          const partDuration = roundToNearestBlock(rawPartDuration);
          remainingDuration -= partDuration;

          // Update cumulative work time
          cumulativeWorkTime += partDuration;

          // Create new task part with explicit break requirements
          const newTask: ProcessedTask = {
            ...task,
            title: `${task.title} (Part ${i + 1} of ${numParts})`,
            duration: partDuration,
            needsSplitting: false,
            suggestedBreaks: [],
            isFlexible: task.isFlexible,
            taskCategory: task.taskCategory,
            projectType: task.projectType,
            isFrog: task.isFrog,
            originalTitle: task.title, // Track original title
          };

          // Always add a break after each part (except the last one)
          if (i < numParts - 1) {
            newTask.suggestedBreaks.push({
              after: partDuration,
              duration: DURATION_RULES.LONG_BREAK,
              reason: 'Required break between task segments',
            });
            cumulativeWorkTime = 0; // Reset after break
          }

          updatedTasks.push(newTask);
        }
      } else {
        // For shorter tasks, still track cumulative work time
        const roundedDuration = roundToNearestBlock(task.duration);
        cumulativeWorkTime += roundedDuration;

        const newTask: ProcessedTask = {
          ...task,
          duration: roundedDuration,
          suggestedBreaks: [...(task.suggestedBreaks || [])],
          isFlexible: task.isFlexible,
          taskCategory: task.taskCategory,
          projectType: task.projectType,
          isFrog: task.isFrog,
        };

        // Add break if we're approaching the limit
        if (cumulativeWorkTime >= DURATION_RULES.MAX_WORK_WITHOUT_BREAK * 0.7) {
          // Use 70% as threshold for preemptive breaks
          newTask.suggestedBreaks.push({
            after: roundedDuration,
            duration: DURATION_RULES.LONG_BREAK,
            reason: 'Preemptive break to prevent excessive work time',
          });
          cumulativeWorkTime = 0; // Reset after break
        } else if (taskIndex < story.tasks.length - 1) {
          // Add short break between tasks if not the last task
          newTask.suggestedBreaks.push({
            after: roundedDuration,
            duration: DURATION_RULES.SHORT_BREAK,
            reason: 'Short break between tasks',
          });
        }

        updatedTasks.push(newTask);
      }
    });

    // If this is specifically the story mentioned in the error, do additional processing
    if (isProblematicBlock) {
      log.debug(`Found story that caused the error: ${story.title}`);

      // Add a reference to the original title if this is an affected story
      story.originalTitle = originalTitle;

      // Second pass: ensure no sequence of tasks exceeds MAX_WORK_WITHOUT_BREAK
      let runningWorkTime = 0;
      const finalTasks: ProcessedTask[] = [];

      for (let i = 0; i < updatedTasks.length; i++) {
        const task = updatedTasks[i];

        // If adding this task would exceed the limit, add a break task first
        if (runningWorkTime + task.duration > DURATION_RULES.MAX_WORK_WITHOUT_BREAK) {
          // Add a break task
          log.debug(
            `Inserting additional break before task "${task.title}" (running work time: ${runningWorkTime})`
          );

          // Ensure the original task includes a required break
          if (!task.suggestedBreaks || task.suggestedBreaks.length === 0) {
            task.suggestedBreaks = [
              {
                after: 0, // At the beginning
                duration: DURATION_RULES.LONG_BREAK,
                reason: 'Required break to prevent excessive consecutive work time',
              },
            ];
          }

          runningWorkTime = task.duration;
        } else {
          runningWorkTime += task.duration;
        }

        finalTasks.push(task);

        // Reset running time if this task has a break at the end
        if (task.suggestedBreaks && task.suggestedBreaks.some((b) => b.after === task.duration)) {
          runningWorkTime = 0;
        }
      }

      // Use the final tasks list with added breaks
      story.tasks = finalTasks;
    } else {
      // Use the updated tasks list for non-problematic stories
      story.tasks = updatedTasks;
    }

    // Recalculate story duration with new tasks and breaks
    recalculateStoryDuration(story);
  });

  return modifiedStories;
};

/**
 * Recalculate story duration based on tasks and breaks
 */
function recalculateStoryDuration(story: ProcessedStory): void {
  // Calculate total duration including breaks
  const totalWorkTime = story.tasks.reduce((sum, task) => sum + task.duration, 0);
  const totalBreakTime = story.tasks.reduce(
    (sum, task) => sum + (task.suggestedBreaks?.reduce((bSum, b) => bSum + b.duration, 0) || 0),
    0
  );

  story.estimatedDuration = roundToNearestBlock(totalWorkTime + totalBreakTime);
  log.debug(
    `Recalculated duration for "${story.title}": ${story.estimatedDuration} minutes (work: ${totalWorkTime}, breaks: ${totalBreakTime})`
  );
}

/**
 * Create a session from processed stories
 * Includes retry logic with story modification on errors
 *
 * NOTE: This currently uses session-storage service which needs to be ported
 * For now, it will save to localStorage directly as a placeholder
 */
const createSession = async (stories: ProcessedStory[], startTime: string, maxRetries = 10) => {
  let currentStories = [...stories];
  let retryCount = 0;
  let lastError = null;

  // Create a map of story titles (including modified ones) to original stories
  // This will help with story matching on the server side
  const titleToStoryMap = new Map<string, ProcessedStory>();

  // Pre-process the stories before first attempt - be proactive
  currentStories = modifyStoriesForRetry(currentStories, {
    details: {
      preventiveModification: true,
    },
  });

  // Build mapping of all story titles (original and split) to their original stories
  currentStories.forEach((story) => {
    // Store by current title
    titleToStoryMap.set(story.title, story);

    // If there's an original title stored, map that too
    if (story.originalTitle && story.originalTitle !== story.title) {
      titleToStoryMap.set(story.originalTitle, story);
    }

    // Also add mappings for task titles with parts
    story.tasks.forEach((task) => {
      if (task.title.includes('Part') && task.originalTitle) {
        // Create a synthetic story title that might be generated by task splitting
        const syntheticStoryTitle = `${story.title}: ${task.title}`;
        titleToStoryMap.set(syntheticStoryTitle, story);

        // Also try with just the original task title
        const baseStoryTitle = `${story.title}: ${task.originalTitle}`;
        titleToStoryMap.set(baseStoryTitle, story);
      }
    });
  });

  log.debug(`Created mapping for ${titleToStoryMap.size} potential story titles`);

  // Only validate that the totalDuration is a valid multiple of BLOCK_SIZE and above MIN_DURATION
  const totalDuration = currentStories.reduce((sum, story) => sum + story.estimatedDuration, 0);
  if (
    totalDuration < DURATION_RULES.MIN_DURATION ||
    totalDuration % DURATION_RULES.BLOCK_SIZE !== 0
  ) {
    throw new Error(
      `Invalid total duration: ${totalDuration} minutes. Must be at least ${DURATION_RULES.MIN_DURATION} minutes and a multiple of ${DURATION_RULES.BLOCK_SIZE} minutes.`
    );
  }

  while (retryCount < maxRetries) {
    try {
      log.debug(`Attempting to create session (attempt ${retryCount + 1}/${maxRetries})`);
      log.debug('Total duration:', totalDuration, 'minutes');

      // Convert processed stories to tasks and save them
      const tasks = currentStories.flatMap((story) =>
        story.tasks.map((task) => ({
          id: task.id || crypto.randomUUID(),
          title: task.title,
          description: '',
          duration: task.duration,
          difficulty: (task as any).difficulty || ('medium' as DifficultyLevel),
          taskCategory: task.taskCategory,
          projectType: task.projectType,
          isFrog: task.isFrog || false,
          status: 'todo' as BaseStatus,
          children: [],
          refined: true,
          needsSplitting: task.needsSplitting,
          splitInfo: task.splitInfo,
          storyId: story.title,
        }))
      );

      // Save tasks to persistent storage
      await TaskPersistenceService.saveTasks(tasks);

      // Ensure all tasks have IDs before sending
      currentStories.forEach((story) => {
        story.tasks.forEach((task) => {
          if (!task.id) {
            task.id = crypto.randomUUID();
            log.debug(`Added missing ID to task: ${task.title}`);
          }
        });
      });

      // Add story mapping to the request
      const apiKey = ApiConfigService.getClaudeApiKey();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      // Add API key to headers if available (for client-side processing)
      if (apiKey) {
        headers['X-Claude-API-Key'] = apiKey;
      }

      const request = {
        stories: currentStories,
        startTime,
        storyMapping: Array.from(titleToStoryMap.keys()).map((title) => ({
          possibleTitle: title,
          originalTitle:
            titleToStoryMap.get(title)?.originalTitle || titleToStoryMap.get(title)?.title,
        })),
      };

      const response = await fetch('/api/tasks/create-session', {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      // Get the raw text first to handle potential parsing issues
      const rawText = await response.text();

      // Validate response size
      if (rawText.length > 10_000_000) {
        // 10MB limit
        throw new Error('Response too large', {
          cause: { code: 'RESPONSE_TOO_LARGE', size: rawText.length },
        });
      }

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        log.error('Failed to parse response as JSON:', parseError);
        log.debug('Raw response:', rawText.substring(0, 1000) + '...');

        // Try to recover from common JSON issues
        const cleanedText = rawText.replace(/\n/g, '').replace(/\r/g, '').replace(/\t/g, '').trim();

        try {
          data = JSON.parse(cleanedText);
        } catch (secondaryParseError) {
          throw new Error('Failed to parse API response as JSON', {
            cause: {
              code: 'PARSE_ERROR',
              originalError: parseError,
              secondaryError: secondaryParseError,
              rawResponse: rawText.substring(0, 1000) + '...', // First 1000 chars for debugging
            },
          });
        }
      }

      if (!response.ok) {
        // If the response contains error details, throw them
        if (isApiError(data)) {
          const errorDetails = data.details
            ? `\n\nDetails: ${JSON.stringify(data.details, null, 2)}`
            : '';
          throw new Error(`${data.error}${errorDetails}`, { cause: data });
        }
        // If it's a raw error message
        throw new Error(data.error || 'Failed to create session', { cause: data });
      }

      // Validate the response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid session response: not an object', {
          cause: { code: 'INVALID_RESPONSE', response: data },
        });
      }

      if (!data.storyBlocks || !Array.isArray(data.storyBlocks)) {
        throw new Error('Invalid session response: missing storyBlocks array', {
          cause: { code: 'MISSING_STORY_BLOCKS', response: data },
        });
      }

      // Validate each story block
      for (const block of data.storyBlocks) {
        if (!block.title || !block.timeBoxes || !Array.isArray(block.timeBoxes)) {
          throw new Error('Invalid story block structure', {
            cause: { code: 'INVALID_BLOCK_STRUCTURE', block },
          });
        }
      }

      if (typeof data.totalDuration !== 'number' || data.totalDuration <= 0) {
        // If totalDuration is missing or invalid, calculate it from story blocks
        log.warn('Session response missing valid totalDuration, calculating from story blocks');

        const calculatedTotalDuration = data.storyBlocks.reduce(
          (sum: number, block: any) => sum + (block.totalDuration || 0),
          0
        );

        if (calculatedTotalDuration <= 0) {
          throw new Error('Cannot calculate valid session duration from story blocks', {
            cause: { code: 'INVALID_DURATION', response: data },
          });
        }

        // Set the calculated duration
        data.totalDuration = calculatedTotalDuration;
        log.debug(`Set totalDuration to calculated value: ${calculatedTotalDuration} minutes`);
      }

      // Save session to localStorage
      // TODO: Replace with SessionStorageService once ported
      try {
        const today = new Date(startTime).toISOString().split('T')[0];
        log.debug(`Saving session for date: ${today} with data:`, {
          summary: {
            totalDuration: data.totalDuration,
            storyBlocksCount: data.storyBlocks.length,
            startTime,
          },
        });

        // Ensure all required fields are present for a valid session
        const sessionToSave = {
          ...data,
          status: 'planned',
          totalDuration: data.totalDuration,
          lastUpdated: new Date().toISOString(),
          // These are required fields for StoredSession
          totalSessions: 1,
          startTime: startTime,
          endTime: new Date(
            new Date(startTime).getTime() + data.totalDuration * 60 * 1000
          ).toISOString(),
          // Add required StoryBlock fields if missing
          storyBlocks: data.storyBlocks.map((block: any, index: number) => ({
            ...block,
            id: block.id || `story-${index}-${Date.now()}`,
            progress: 0,
            timeBoxes: (block.timeBoxes || []).map((timeBox: any) => ({
              ...timeBox,
              status: timeBox.status || 'todo',
              // Ensure task fields are correctly structured
              tasks: (timeBox.tasks || []).map((task: any) => ({
                ...task,
                status: task.status || 'todo',
              })),
            })),
          })),
        };

        // Save to localStorage (temporary until SessionStorageService is ported)
        const storageKey = `tempo-session-${today}`;
        localStorage.setItem(storageKey, JSON.stringify(sessionToSave));
        log.debug(`Session saved to localStorage with key: ${storageKey}`);

        // Verify the session was saved correctly
        const savedSession = localStorage.getItem(storageKey);
        if (!savedSession) {
          log.error('Failed to verify saved session - not found in localStorage');
          throw new Error('Session was not properly saved to storage');
        } else {
          log.info(`Session successfully saved and verified`);
        }

        return data;
      } catch (error) {
        log.error('Failed to save session:', error);
        throw new Error('Failed to save session to storage');
      }
    } catch (error) {
      log.error(`Session creation attempt ${retryCount + 1} failed:`, error);
      lastError = error;

      // Check if this is a parsing error that might benefit from retry
      const shouldRetry =
        error instanceof Error &&
        (error.message.includes('parse') || error.message.includes('JSON'));

      // Don't retry on the last attempt or if it's not a parsing error
      if (retryCount >= maxRetries - 1 || !shouldRetry) {
        log.error(`Maximum retry limit (${maxRetries}) reached or non-retryable error. Giving up.`);
        break;
      }

      // For parsing errors, we don't modify the stories, just retry
      if (!shouldRetry) {
        // Modify stories based on the error
        currentStories = modifyStoriesForRetry(
          currentStories,
          error instanceof Error ? (error as any).cause || error : error
        );
      }

      retryCount++;

      // Wait a moment before retrying, longer for parsing errors
      await new Promise((resolve) => setTimeout(resolve, shouldRetry ? 2000 : 1000));
    }
  }

  // If we've exhausted all retries, throw the last error
  if (lastError) {
    if (lastError instanceof Error) {
      throw lastError;
    } else {
      throw new Error('Failed to create session after multiple attempts', { cause: lastError });
    }
  }

  throw new Error('Failed to create session due to unknown error');
};

export const brainDumpService = {
  processTasks,
  createSession,
} as const;
