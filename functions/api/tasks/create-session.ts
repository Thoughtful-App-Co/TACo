import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  DURATION_RULES as BaseDurationRules,
  TimeBox as DurationTimeBox,
  calculateDurationSummary,
  calculateTotalDuration,
  validateTaskDuration,
  generateSchedulingSuggestion,
  suggestSplitAdjustment,
} from '../../../src/components/tempo/lib/durationUtils';
import type {
  Task,
  TaskType,
  StoryType,
  APIProcessedTask,
  APIProcessedStory,
  APISessionResponse,
} from '../../../src/components/tempo/lib/types';
import {
  transformTaskData,
  transformStoryData,
  normalizeTaskTitle,
  isSplitTaskPart,
  getBaseTaskTitle,
  getBaseStoryTitle,
} from '../../../src/components/tempo/lib/transformUtils';
import { tasksLog } from '../../lib/logger';

// Cloudflare Pages Function for /api/tasks/create-session
// Handles session creation with Claude AI scheduling

interface Env {
  ANTHROPIC_API_KEY: string;
}

// Extend the duration rules to include the maximum consecutive work time
const DURATION_RULES = {
  ...BaseDurationRules,
  MAX_WORK_WITHOUT_BREAK: 90, // Maximum consecutive work minutes without a substantial break
};

// Input validation schemas
const TaskBreakSchema = z.object({
  after: z.number(),
  duration: z.number(),
  reason: z.string(),
});

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  duration: z.number(),
  taskCategory: z.enum(['focus', 'learning', 'review', 'research', 'social'] as const),
  projectType: z.string().optional(),
  isFrog: z.boolean(),
  isFlexible: z.boolean(),
  originalTitle: z.string().optional(),
  splitInfo: z
    .object({
      originalTitle: z.string().optional(),
      isParent: z.boolean(),
      partNumber: z.number().optional(),
      totalParts: z.number().optional(),
    })
    .optional(),
  suggestedBreaks: z.array(TaskBreakSchema).default([]),
});

const StorySchema = z.object({
  title: z.string(),
  summary: z.string(),
  icon: z.string(),
  estimatedDuration: z.number(),
  type: z.enum(['timeboxed', 'flexible', 'milestone'] as const),
  projectType: z.string(),
  category: z.string(),
  tasks: z.array(TaskSchema),
});

// Add a schema for story mapping
const StoryMappingSchema = z.object({
  possibleTitle: z.string(),
  originalTitle: z.string(),
});

// Update request schema to include story mapping
const RequestSchema = z.object({
  stories: z.array(StorySchema),
  startTime: z.string(),
  storyMapping: z.array(StoryMappingSchema).optional(),
});

class SessionCreationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'SessionCreationError';
  }
}

// Add types for response data structure
interface TimeBoxTask {
  id: string;
  title: string;
  duration: number;
  taskCategory?: TaskType;
  projectType?: string;
  originalTitle?: string;
  isFrog?: boolean;
  splitInfo?: {
    originalTitle?: string;
    isParent: boolean;
    partNumber?: number;
    totalParts?: number;
  };
  suggestedBreaks?: Array<{
    after: number;
    duration: number;
    reason: string;
  }>;
}

interface TimeBox extends DurationTimeBox {
  startTime: string;
  tasks: TimeBoxTask[];
}

interface StoryBlock {
  title: string;
  summary: string;
  icon: string;
  timeBoxes: TimeBox[];
  totalDuration: number;
  suggestions?: Array<{
    type: string;
    task: string;
    message: string;
    details: Record<string, unknown>;
  }>;
}

type SessionResponse = APISessionResponse;

// Add helper functions for task title handling
function getValidDurationRange(task: TimeBoxTask): { min: number; max: number } {
  // Account for breaks in the duration ranges
  const minWithBreak = DURATION_RULES.MIN_DURATION + DURATION_RULES.SHORT_BREAK;
  const maxWithBreak = DURATION_RULES.MAX_DURATION + DURATION_RULES.LONG_BREAK * 2; // Allow for two long breaks

  return {
    min: minWithBreak,
    max: maxWithBreak,
  };
}

function getDurationDescription(range: { min: number; max: number }, type: string): string {
  return `${range.min}-${range.max} minutes (including breaks, ${type})`;
}

function findMatchingTaskTitle(searchTitle: string, availableTitles: string[]): string | undefined {
  const normalizedSearch = normalizeTaskTitle(searchTitle);

  // Log for debugging
  tasksLog.debug(`Matching title: "${searchTitle}" normalized to "${normalizedSearch}"`);

  // First check for split task matches
  const splitMatches = availableTitles.filter(
    (title) =>
      title.includes('(Part') && normalizeTaskTitle(title.split('(Part')[0]) === normalizedSearch
  );

  if (splitMatches.length > 0) {
    tasksLog.debug(`Found split task matches: ${splitMatches.join(', ')}`);
    // Return the first part to represent the whole task
    return splitMatches[0].split('(Part')[0].trim();
  }

  // Try exact match first
  const exactMatch = availableTitles.find((title) => {
    const normalizedTitle = normalizeTaskTitle(title);
    tasksLog.debug(`Comparing with: "${title}" normalized to "${normalizedTitle}"`);
    return normalizedTitle === normalizedSearch;
  });

  if (exactMatch) {
    tasksLog.debug(`Found exact match: "${exactMatch}"`);
    return exactMatch;
  }

  // Try fuzzy matching for project names
  const fuzzyMatch = availableTitles.find((title) => {
    const normalizedTitle = normalizeTaskTitle(title);
    // Check if the core project names match
    const searchWords = normalizedSearch.split(' ').filter((word) => word.length > 2);
    const titleWords = normalizedTitle.split(' ').filter((word) => word.length > 2);

    const matchingWords = searchWords.filter((word) =>
      titleWords.some((titleWord: string) => titleWord.includes(word) || word.includes(titleWord))
    );

    return matchingWords.length >= Math.min(2, searchWords.length);
  });

  if (fuzzyMatch) {
    tasksLog.debug(`Found fuzzy match: "${fuzzyMatch}"`);
    return fuzzyMatch;
  }

  tasksLog.debug(`No match found for "${searchTitle}"`);
  return undefined;
}

interface StoryWithTitle {
  title: string;
  estimatedDuration?: number;
  tasks: unknown[];
  originalTitle?: string;
  [key: string]: unknown;
}

interface StoryMapping {
  possibleTitle: string;
  originalTitle: string;
}

// Update findOriginalStory function to use story mapping if available
function findOriginalStory(
  storyTitle: string,
  stories: StoryWithTitle[],
  storyMapping?: StoryMapping[]
): StoryWithTitle | null {
  // Special case for "Break" blocks which don't correspond to actual stories
  if (storyTitle === 'Break' || storyTitle.toLowerCase().includes('break')) {
    tasksLog.debug(`Creating dummy story for special block: ${storyTitle}`);
    // Return a dummy story object with minimal required properties
    return {
      title: storyTitle,
      estimatedDuration: 15, // Default duration for breaks
      tasks: [],
      type: 'flexible',
      projectType: 'System',
      category: 'Break',
      summary: 'Scheduled break time',
    };
  }

  // First check if we have mapping data available and try to use it
  if (storyMapping && storyMapping.length > 0) {
    // Find this title in the mapping
    const mapping = storyMapping.find((m) => m.possibleTitle === storyTitle);
    if (mapping) {
      // Use the original title from mapping to find the story
      const originalStory = stories.find((s) => s.title === mapping.originalTitle);
      if (originalStory) {
        tasksLog.debug(`Found story using mapping: ${storyTitle} -> ${mapping.originalTitle}`);
        return originalStory;
      }
    }
  }

  // If mapping doesn't work or isn't available, try other methods

  // First try exact match
  let original = stories.find((story) => story.title === storyTitle);
  if (original) return original;

  // If not found and title contains "Part X of Y", try matching the base title
  if (isSplitTaskPart(storyTitle)) {
    const baseTitle = getBaseStoryTitle(storyTitle);
    original = stories.find((story) => story.title === baseTitle);
    if (original) return original;

    // Try fuzzy match on base title
    original = stories.find((story) => {
      return story.title.includes(baseTitle) || baseTitle.includes(story.title);
    });
    if (original) return original;
  }

  // Try fuzzy match as last resort
  original = stories.find((story) => {
    const storyWords = story.title.toLowerCase().split(/\s+/);
    const searchWords = storyTitle.toLowerCase().split(/\s+/);

    // Count matching words
    const matchCount = searchWords.filter((word) =>
      storyWords.some((storyWord) => storyWord.includes(word) || word.includes(storyWord))
    ).length;

    // Require at least 50% of words to match or minimum 2 words
    return matchCount >= Math.max(2, Math.floor(searchWords.length / 2));
  });

  if (original) {
    tasksLog.debug(`Found story using fuzzy match: ${storyTitle} -> ${original.title}`);
  }

  return original || null;
}

function buildOriginalTasksMap(stories: z.infer<typeof StorySchema>[]): Map<string, string> {
  // Create a map of normalized task titles to original task titles
  const tasksMap = new Map<string, string>();

  stories.forEach((story) => {
    story.tasks.forEach((task: { title: string }) => {
      const normalizedTitle = normalizeTaskTitle(task.title);
      tasksMap.set(normalizedTitle, task.title);
    });
  });

  return tasksMap;
}

function validateAllTasksIncluded(
  originalTasks: z.infer<typeof TaskSchema>[],
  scheduledTasks: TimeBoxTask[]
): {
  isMissingTasks: boolean;
  missingTasks: string[];
  scheduledCount: number;
  originalCount: number;
} {
  // Create maps to track tasks by ID and title
  const originalTaskMap = new Map<string, z.infer<typeof TaskSchema>>();
  const titleToIdMap = new Map<string, string>();
  const idToTitlesMap = new Map<string, Set<string>>();

  // Build maps of original tasks
  // Group split task parts by their shared ID
  originalTasks.forEach((task) => {
    originalTaskMap.set(task.id, task);
    titleToIdMap.set(task.title.toLowerCase(), task.id);

    // Track all titles associated with each ID (for split tasks sharing the same ID)
    if (!idToTitlesMap.has(task.id)) {
      idToTitlesMap.set(task.id, new Set());
    }
    idToTitlesMap.get(task.id)!.add(task.title.toLowerCase());

    if (task.originalTitle) {
      titleToIdMap.set(task.originalTitle.toLowerCase(), task.id);
      idToTitlesMap.get(task.id)!.add(task.originalTitle.toLowerCase());
    }
  });

  // Filter out Break blocks before validation
  const filteredScheduledTasks = scheduledTasks.filter((task) => {
    // Skip "Break" tasks in validation
    return !task.title.includes('Break');
  });

  // Track which task IDs have been accounted for
  const accountedIds = new Set<string>();
  // Track which specific split part titles have been scheduled
  const scheduledTitles = new Set<string>();

  // Track scheduled tasks and their relationships
  filteredScheduledTasks.forEach((task) => {
    const taskTitleLower = task.title.toLowerCase();
    scheduledTitles.add(taskTitleLower);

    // Get the original title from either splitInfo or originalTitle property
    const originalTitle = task.splitInfo?.originalTitle || task.originalTitle;

    // Handle split tasks - check both splitInfo.originalTitle and direct originalTitle
    if (originalTitle) {
      const originalId = titleToIdMap.get(originalTitle.toLowerCase());
      if (originalId) {
        accountedIds.add(originalId);
      }
    }

    // Also try to match by task ID directly
    if (task.id) {
      const matchedId = titleToIdMap.get(taskTitleLower);
      if (matchedId) {
        accountedIds.add(matchedId);
      }
      // If the task ID exists in our original map, mark it as accounted
      if (originalTaskMap.has(task.id)) {
        accountedIds.add(task.id);
      }
    }

    // Try matching by title (including split task format "Task (Part X of Y)")
    const baseTitle = getBaseTaskTitle(taskTitleLower);
    const baseTitleId = titleToIdMap.get(baseTitle);
    if (baseTitleId) {
      accountedIds.add(baseTitleId);
    }
  });

  // Find missing tasks - tasks whose ID was never accounted for
  // For split tasks, we consider them accounted if ANY part was scheduled
  const missingTasks: string[] = [];
  const checkedIds = new Set<string>();

  originalTasks.forEach((task) => {
    // Skip if we already checked this ID (handles split tasks with same ID)
    if (checkedIds.has(task.id)) {
      return;
    }
    checkedIds.add(task.id);

    if (!accountedIds.has(task.id)) {
      // For split tasks, report the original title if available, otherwise the task title
      const reportTitle = task.originalTitle || task.title;
      // Avoid duplicates
      if (!missingTasks.includes(reportTitle)) {
        missingTasks.push(reportTitle);
      }
    }
  });

  return {
    isMissingTasks: missingTasks.length > 0,
    missingTasks,
    scheduledCount: filteredScheduledTasks.length,
    originalCount: originalTasks.length,
  };
}

// Helper function to parse time from either ISO string or HH:MM format
function parseTimeString(timeStr: string): Date {
  const result = new Date();

  // Check if it's an ISO string
  if (timeStr.includes('T') || timeStr.includes('Z')) {
    const parsed = new Date(timeStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Try HH:MM format
  const parts = timeStr.split(':').map(Number);
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    result.setHours(parts[0], parts[1], 0, 0);
    return result;
  }

  // Fallback to current time
  tasksLog.warn(`Could not parse time string: ${timeStr}, using current time`);
  return result;
}

// Helper function to format time as ISO string
function formatTimeAsISO(date: Date): string {
  return date.toISOString();
}

// Add helper function to insert breaks when work time exceeds maximum allowed
function insertMissingBreaks(storyBlocks: StoryBlock[]): StoryBlock[] {
  // Create a deep copy to avoid modifying the original directly
  const updatedBlocks = JSON.parse(JSON.stringify(storyBlocks));

  for (let blockIndex = 0; blockIndex < updatedBlocks.length; blockIndex++) {
    const block = updatedBlocks[blockIndex];
    const updatedTimeBoxes: TimeBox[] = [];

    let consecutiveWorkTime = 0;
    let currentTime = new Date();

    // Set the start time for the first time box
    if (block.timeBoxes.length > 0 && block.timeBoxes[0].startTime) {
      currentTime = parseTimeString(block.timeBoxes[0].startTime);
    }

    for (let i = 0; i < block.timeBoxes.length; i++) {
      const timeBox = block.timeBoxes[i];

      // Check if we need to insert a break BEFORE adding this work block
      // This prevents exceeding the max work time
      if (timeBox.type === 'work') {
        const projectedWorkTime = consecutiveWorkTime + timeBox.duration;

        if (projectedWorkTime > DURATION_RULES.MAX_WORK_WITHOUT_BREAK && consecutiveWorkTime > 0) {
          tasksLog.debug(
            `Inserting break BEFORE work session "${timeBox.tasks?.[0]?.title || 'unknown'}" at ${formatTimeAsISO(currentTime)} (would exceed limit: ${projectedWorkTime} min)`
          );

          // Create a new break time box BEFORE the work
          const breakDuration = 15;
          const breakTimeBox: TimeBox = {
            type: 'long-break',
            startTime: formatTimeAsISO(currentTime),
            duration: breakDuration,
            tasks: [],
          };

          // Add the break first
          updatedTimeBoxes.push(breakTimeBox);

          // Update current time
          currentTime = new Date(currentTime.getTime() + breakDuration * 60000);

          // Reset consecutive work time counter
          consecutiveWorkTime = 0;
        }
      }

      // Update the timeBox's start time
      timeBox.startTime = formatTimeAsISO(currentTime);

      // Add the current timeBox to our updated list
      updatedTimeBoxes.push(timeBox);

      // Update current time based on this time box duration
      currentTime = new Date(currentTime.getTime() + timeBox.duration * 60000);

      // Track consecutive work time
      if (timeBox.type === 'work') {
        consecutiveWorkTime += timeBox.duration;
      } else if (timeBox.type === 'long-break') {
        consecutiveWorkTime = 0;
      } else if (timeBox.type === 'short-break') {
        consecutiveWorkTime = Math.max(0, consecutiveWorkTime - 25);
      }
    }

    // Update the timeBoxes array with our modified version
    block.timeBoxes = updatedTimeBoxes;

    // Recalculate the block's total duration
    const { totalDuration } = calculateDurationSummary(block.timeBoxes);
    block.totalDuration = totalDuration;
  }

  return updatedBlocks;
}

// Extract the inferred type from the schema
type Story = z.infer<typeof StorySchema>;

// Upgrade task objects to the session model
function upgradeTaskToSessionTask(task: z.infer<typeof TaskSchema>): TimeBoxTask {
  return {
    id: task.id,
    title: task.title,
    duration: task.duration,
    taskCategory: task.taskCategory,
    projectType: task.projectType,
    isFrog: task.isFrog,
    originalTitle: task.originalTitle,
    splitInfo: task.splitInfo,
    suggestedBreaks: task.suggestedBreaks || [],
  };
}

// Add retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
};

async function retryWithBackoff<T>(operation: () => Promise<T>, retryCount = 0): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('overloaded') &&
      retryCount < RETRY_CONFIG.maxRetries
    ) {
      const delay = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, retryCount),
        RETRY_CONFIG.maxDelay
      );
      tasksLog.debug(`API overloaded, retrying in ${delay}ms (attempt ${retryCount + 1})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(operation, retryCount + 1);
    }
    throw error;
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Check for API key in request header (for "Bring Your Own Key" feature)
  // Falls back to environment variable for production/shared dev environments
  const apiKeyFromHeader = request.headers.get('X-API-Key');
  const apiKey = apiKeyFromHeader || env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          'API key not provided. Please configure your API key in settings or set ANTHROPIC_API_KEY environment variable.',
        code: 'MISSING_API_KEY',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  const currentTime = new Date();
  let startTime;
  let stories;
  let storyMapping;

  try {
    const body = await request.json();
    const { stories, startTime, storyMapping } = RequestSchema.parse(body);

    tasksLog.debug(`Received ${stories.length} stories for session creation`);
    if (storyMapping) {
      tasksLog.debug(`Received mapping data for ${storyMapping.length} possible story titles`);
    }

    const startDateTime = new Date(startTime);

    // Validate that total duration is a reasonable value
    const totalDuration = stories.reduce((sum, story) => sum + story.estimatedDuration, 0);
    if (totalDuration > 24 * 60) {
      // More than 24 hours
      throw new SessionCreationError(
        'Total session duration exceeds maximum limit',
        'DURATION_EXCEEDED',
        { totalDuration, maxDuration: 24 * 60 }
      );
    }

    // Create a map of original tasks for validation
    const originalTasksMap = buildOriginalTasksMap(stories);

    try {
      // Log input data
      tasksLog.debug('Creating session with stories:', JSON.stringify(stories, null, 2));
      tasksLog.debug('Start time:', startDateTime.toLocaleTimeString());

      // Use the Task type from our schema instead of the imported type
      const enhancedStories = stories.map((story: z.infer<typeof StorySchema>) => ({
        ...story,
        tasks: story.tasks.map((task: z.infer<typeof TaskSchema>) => ({
          ...task,
          originalTitle: task.originalTitle || task.title,
        })),
      }));

      // Wrap the Anthropic API call with retry logic
      const response = await retryWithBackoff(async () => {
        const result = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 4000,
          temperature: 0.7,
          messages: [
            {
              role: 'user',
              content: `Based on these stories, create a detailed session plan with time boxes.

Rules:
1. Each story becomes a "story block" containing all its tasks and breaks
2. FROG tasks should be scheduled as early as possible
3. Follow all duration, break and constraints exactly as specified
4. Round all times to 5-minute increments
5. Add a short break (5 mins) between tasks within a story
6. Add a longer break (15 mins) between story blocks
7. Add appropriate breaks to prevent working more than ${DURATION_RULES.MAX_WORK_WITHOUT_BREAK} minutes continuously
8. IMPORTANT: Keep your response as concise as possible while maintaining accuracy

Session Parameter Details:
- Start Time: ${startTime}
- Total Stories: ${stories.length}

Stories Data:
${JSON.stringify(enhancedStories, null, 2)}

Respond with a JSON session plan that follows this exact structure:
{
  "summary": {
    "totalSessions": number,
    "startTime": "ISO string",
    "endTime": "ISO string", 
    "totalDuration": number
  },
  "storyBlocks": [
    {
      "title": "Story title",
      "summary": "Story summary",
      "icon": "emoji",
      "timeBoxes": [
        {
          "type": "work" | "short-break" | "long-break" | "debrief",
          "duration": number,
          "tasks": [
            {
              "id": "string",
              "title": "string",
              "duration": number,
              "taskCategory": "focus" | "learning" | "review" | "research" | "social",
              "projectType": "string" (optional),
              "isFrog": boolean
            }
          ],
          "startTime": "ISO string",
          "endTime": "ISO string"
        }
      ],
      "totalDuration": number
    }
  ]
}

CRITICAL RULES:
- YOU MUST INCLUDE ALL ${stories.length} STORIES AND ALL ${stories.reduce((sum, s) => sum + s.tasks.length, 0)} TASKS - do not skip any
- Keep summaries extremely brief - just a few words is sufficient
- Use short emoji icons
- ENSURE your complete response fits within the available tokens
- NEVER omit or truncate any part of the JSON structure
- Produce valid, complete JSON with no trailing commas
- NEVER change the story or task order provided
- Preserve all task properties exactly as provided (id, title, duration, taskCategory, projectType, isFrog)
- Use ISO date strings for all times
- Include empty tasks array for break time boxes
- Ensure all durations are in minutes
- Calculate accurate start and end times for each time box
- If a task has "(Part X of Y)" in its title, include it exactly as written`,
            },
          ],
        });
        return result;
      });

      const messageContent = response.content[0];
      if (!('text' in messageContent)) {
        throw new SessionCreationError(
          'Invalid response format from AI',
          'INVALID_RESPONSE',
          messageContent
        );
      }

      try {
        // Log the raw response for debugging
        tasksLog.debug('Raw session plan response:', messageContent.text);

        let parsedData;
        try {
          // Try to extract JSON if the response contains multiple objects
          const jsonMatch = messageContent.text.match(/\{[\s\S]*\}/);
          let jsonText = jsonMatch ? jsonMatch[0] : messageContent.text;

          // Check if the JSON appears to be truncated
          if (
            jsonText.trim().endsWith('":') ||
            jsonText.trim().endsWith(',') ||
            !jsonText.trim().endsWith('}')
          ) {
            tasksLog.warn('JSON appears to be truncated or malformed');

            // Try to reconstruct if it's a known response pattern by checking the structure
            if (jsonText.includes('"storyBlocks"') && jsonText.includes('"summary"')) {
              // This is likely our expected format but truncated
              tasksLog.warn('Attempting to reconstruct truncated JSON with the expected structure');

              // Check if we're missing the final closing brace
              if (
                !jsonText.trim().endsWith('}') &&
                jsonText.split('{').length > jsonText.split('}').length
              ) {
                jsonText = jsonText + '}}'; // Add closing braces for potentially nested unclosed objects
              }
            } else {
              throw new Error('JSON structure is too damaged to repair automatically');
            }
          }

          // Rest of the parsing logic remains the same
          try {
            parsedData = JSON.parse(jsonText);
          } catch (initialParseError) {
            // If standard parsing fails, try a more lenient approach
            tasksLog.warn('Standard JSON parsing failed, attempting repair:', initialParseError);

            // Check if we can fix common truncation issues
            const fixedJson = jsonText
              .replace(/,\s*}$/, '}') // Fix trailing commas
              .replace(/,\s*]$/, ']') // Fix trailing commas in arrays
              .replace(/:\s*}/, ':null}') // Fix missing values
              .replace(/:\s*]/, ':null]'); // Fix missing values in arrays

            parsedData = JSON.parse(fixedJson);
          }
        } catch (parseError) {
          tasksLog.error('JSON parsing failed after repair attempts:', parseError);
          throw new SessionCreationError(
            'Failed to parse AI response as JSON',
            'JSON_PARSE_ERROR',
            {
              error: parseError,
              response: messageContent.text,
            }
          );
        }

        // Validate that the parsed data has all required fields
        if (
          !parsedData.summary ||
          !parsedData.storyBlocks ||
          !Array.isArray(parsedData.storyBlocks)
        ) {
          tasksLog.error('Parsed data is missing required fields');
          throw new SessionCreationError(
            'AI response is missing required data structure',
            'INVALID_DATA_STRUCTURE',
            {
              parsedData,
              missingFields: [
                !parsedData.summary ? 'summary' : null,
                !parsedData.storyBlocks ? 'storyBlocks' : null,
                parsedData.storyBlocks && !Array.isArray(parsedData.storyBlocks)
                  ? 'storyBlocks (not an array)'
                  : null,
              ].filter(Boolean),
            }
          );
        }

        // Ensure each story block has the required fields
        for (let i = 0; i < parsedData.storyBlocks.length; i++) {
          const block = parsedData.storyBlocks[i];
          if (!block.title || !block.timeBoxes || !Array.isArray(block.timeBoxes)) {
            tasksLog.error(`Story block at index ${i} is missing required fields`);

            // Try to repair the block with minimal data
            if (!block.title) block.title = `Story Block ${i + 1}`;
            if (!block.summary) block.summary = `Tasks for story block ${i + 1}`;
            if (!block.icon) block.icon = '📋';
            if (!block.timeBoxes || !Array.isArray(block.timeBoxes)) {
              tasksLog.warn(`Reconstructing missing timeBoxes for story block ${i}`);
              block.timeBoxes = [];
            }
            block.totalDuration = block.timeBoxes.reduce(
              (sum: number, box: { duration?: number }) => sum + (box.duration || 0),
              0
            );
          }
        }

        // Transform fields to ensure consistent property names
        if (parsedData.storyBlocks && Array.isArray(parsedData.storyBlocks)) {
          parsedData.storyBlocks = parsedData.storyBlocks.map((block: any) => {
            // Transform the story block itself
            const transformedBlock = transformStoryData(block);

            // Transform timeBoxes and their tasks
            if (transformedBlock.timeBoxes && Array.isArray(transformedBlock.timeBoxes)) {
              transformedBlock.timeBoxes = transformedBlock.timeBoxes.map((timeBox: any) => {
                // Transform tasks within each time box
                if (timeBox.tasks && Array.isArray(timeBox.tasks)) {
                  timeBox.tasks = timeBox.tasks.map(transformTaskData);
                }
                return timeBox;
              });
            }

            // Transform story properties if needed
            const blockTitle = String(transformedBlock.title || 'unknown');
            if (!transformedBlock.storyType && transformedBlock.type) {
              tasksLog.debug(`Transforming story type -> storyType for "${blockTitle}"`);
              transformedBlock.storyType = String(transformedBlock.type);
            }

            if (!transformedBlock.projectType && transformedBlock.project) {
              tasksLog.debug(`Transforming story project -> projectType for "${blockTitle}"`);
              transformedBlock.projectType = String(transformedBlock.project);
              delete transformedBlock.project;
            }

            return transformedBlock;
          });
        }

        // Create a map of original task durations for validation
        const originalTaskDurations = new Map<string, number>();
        stories.forEach((story: z.infer<typeof StorySchema>) => {
          story.tasks.forEach((task: z.infer<typeof TaskSchema>) => {
            originalTaskDurations.set(task.title, task.duration);
          });
        });

        // After processing and transforming the data, validate it
        // This ensures any renamed properties (type->taskCategory, project->projectType) are properly processed
        tasksLog.debug('Validating processed session plan...');
        const storyBlocks = parsedData.storyBlocks || [];

        // Verify all tasks have the correct properties
        storyBlocks.forEach((block: any) => {
          // Transform story properties if needed
          if (!block.storyType && block.type) {
            tasksLog.debug(
              `Transforming story type -> storyType for "${block.title || 'unknown'}"`
            );
            block.storyType = block.type;
          }

          if (!block.projectType && block.project) {
            tasksLog.debug(
              `Transforming story project -> projectType for "${block.title || 'unknown'}"`
            );
            block.projectType = block.project;
            delete block.project;
          }

          if (block.timeBoxes && Array.isArray(block.timeBoxes)) {
            block.timeBoxes.forEach((timeBox: any) => {
              if (timeBox.tasks && Array.isArray(timeBox.tasks)) {
                timeBox.tasks.forEach((task: any) => {
                  // Ensure task has taskCategory property (originally might have been type)
                  if (!task.taskCategory && task.type) {
                    tasksLog.debug(`Transforming task type -> taskCategory for "${task.title}"`);
                    task.taskCategory = task.type;
                    delete task.type;
                  }

                  // Ensure task has projectType property (originally might have been project)
                  if (!task.projectType && task.project) {
                    tasksLog.debug(`Transforming task project -> projectType for "${task.title}"`);
                    task.projectType = task.project;
                    delete task.project;
                  }
                });
              }
            });
          }
        });

        // Add additional duration validations
        try {
          // After parsing the AI response but before validation, insert missing breaks
          tasksLog.debug('Checking for and inserting missing breaks...');
          parsedData.storyBlocks = insertMissingBreaks(parsedData.storyBlocks);

          // Validate each story block's duration matches its time boxes
          for (const block of parsedData.storyBlocks) {
            tasksLog.debug(`\nValidating story block: ${block.title}`);

            // Use the utility functions for duration calculations
            const { workDuration, breakDuration, totalDuration } = calculateDurationSummary(
              block.timeBoxes
            );

            tasksLog.debug('- Work time total:', workDuration);
            tasksLog.debug('- Break time total:', breakDuration);
            tasksLog.debug('- Total duration:', totalDuration);

            // Find the original story to update its duration
            const originalStory = findOriginalStory(block.title, stories, storyMapping);
            if (!originalStory) {
              throw new SessionCreationError(
                'Story not found in original stories',
                'UNKNOWN_STORY',
                { block: block.title }
              );
            }

            // Update the story's estimated duration to match the actual work time
            // For break blocks, the workDuration might be 0, so use totalDuration instead
            originalStory.estimatedDuration = workDuration || totalDuration;

            // Validate total duration includes both work and breaks
            // Special handling for pure break blocks which might have 0 work duration
            const expectedTotal = workDuration + breakDuration;
            if (
              totalDuration !== expectedTotal &&
              !(workDuration === 0 && totalDuration === breakDuration)
            ) {
              throw new SessionCreationError(
                'Story block duration calculation error',
                'BLOCK_DURATION_ERROR',
                {
                  block: block.title,
                  totalDuration,
                  workDuration,
                  breakDuration,
                  expectedTotal: workDuration + breakDuration,
                }
              );
            }

            // Update the story block's totalDuration
            block.totalDuration = totalDuration;

            // Log the final durations for debugging
            tasksLog.debug('Final block durations:');
            tasksLog.debug('- Total (with breaks):', totalDuration);
            tasksLog.debug('- Work time:', workDuration);
            tasksLog.debug('- Break time:', breakDuration);

            // Validation for maximum work time without substantial break
            // Note: This validation should pass after insertMissingBreaks has run,
            // as that function inserts long breaks before work blocks that would exceed the limit
            let consecutiveWorkTime = 0;

            for (let i = 0; i < block.timeBoxes.length; i++) {
              const currentBox = block.timeBoxes[i];

              if (currentBox.type === 'work') {
                consecutiveWorkTime += currentBox.duration;

                // Log for debugging
                if (consecutiveWorkTime > DURATION_RULES.MAX_WORK_WITHOUT_BREAK * 0.9) {
                  tasksLog.debug(
                    `Warning: Block "${block.title}" approaching max work time: ${consecutiveWorkTime}/${DURATION_RULES.MAX_WORK_WITHOUT_BREAK} min`
                  );
                }

                if (consecutiveWorkTime > DURATION_RULES.MAX_WORK_WITHOUT_BREAK) {
                  // This should not happen if insertMissingBreaks worked correctly
                  tasksLog.error(
                    `Block "${block.title}" exceeded max work time after break insertion`
                  );
                  tasksLog.error(
                    `Time boxes:`,
                    JSON.stringify(
                      block.timeBoxes.map((b: TimeBox) => ({ type: b.type, duration: b.duration })),
                      null,
                      2
                    )
                  );

                  throw new SessionCreationError(
                    'Too much work time without a substantial break',
                    'EXCESSIVE_WORK_TIME',
                    {
                      block: block.title,
                      timeBox: currentBox.startTime,
                      consecutiveWorkTime,
                      maxAllowed: DURATION_RULES.MAX_WORK_WITHOUT_BREAK,
                    }
                  );
                }
              } else if (currentBox.type === 'long-break') {
                consecutiveWorkTime = 0;
              } else if (currentBox.type === 'short-break') {
                // Short breaks reduce accumulated work time but don't fully reset it
                consecutiveWorkTime = Math.max(0, consecutiveWorkTime - 25);
              }
            }
          }

          // Validate total session duration
          const calculatedDuration = parsedData.storyBlocks.reduce(
            (acc: number, block: StoryBlock) => acc + calculateTotalDuration(block.timeBoxes),
            0
          );

          tasksLog.debug('\nValidating total session duration:');
          tasksLog.debug('- Calculated:', calculatedDuration);
          tasksLog.debug('- Reported:', parsedData.summary.totalDuration);

          // Update the summary total duration to match calculated
          parsedData.summary.totalDuration = calculatedDuration;
        } catch (error) {
          if (error instanceof SessionCreationError) throw error;
          throw new SessionCreationError('Duration validation failed', 'VALIDATION_ERROR', error);
        }

        // Extract all scheduled task titles for validation
        const allScheduledTasks: TimeBoxTask[] = parsedData.storyBlocks.flatMap(
          (block: StoryBlock) => {
            // Skip "Break" blocks entirely during task extraction
            if (block.title === 'Break' || block.title.toLowerCase().includes('break')) {
              tasksLog.debug(`Skipping Break block "${block.title}" during task validation`);
              return [];
            }

            return block.timeBoxes
              .filter((box: TimeBox) => box.type === 'work')
              .flatMap((box: TimeBox) => box.tasks || []);
          }
        );

        // Log for debugging
        tasksLog.debug(`\nTask validation:`);
        tasksLog.debug(`- Stories returned by AI: ${parsedData.storyBlocks.length}`);
        tasksLog.debug(`- Stories expected: ${stories.length}`);
        tasksLog.debug(`- Tasks scheduled: ${allScheduledTasks.length}`);
        tasksLog.debug(
          `- Tasks expected: ${stories.reduce((sum: number, s: Story) => sum + s.tasks.length, 0)}`
        );

        // Check if any stories are missing entirely
        const returnedStoryTitles = new Set(
          parsedData.storyBlocks.map((b: StoryBlock) => b.title.toLowerCase())
        );
        const missingStories = stories.filter(
          (s: Story) => !returnedStoryTitles.has(s.title.toLowerCase())
        );
        if (missingStories.length > 0) {
          tasksLog.error(
            `WARNING: AI response is missing entire stories: ${missingStories.map((s: Story) => s.title).join(', ')}`
          );
        }

        // Validate that all original tasks are included
        const validationResult = validateAllTasksIncluded(
          stories.flatMap((story: Story) => story.tasks),
          allScheduledTasks
        );

        if (validationResult.isMissingTasks) {
          tasksLog.error('Missing tasks in schedule:', validationResult.missingTasks);
          tasksLog.error(
            `Scheduled ${validationResult.scheduledCount} of ${validationResult.originalCount} tasks`
          );
          throw new SessionCreationError(
            'Some tasks are missing from the schedule',
            'MISSING_TASKS',
            validationResult
          );
        }

        return new Response(JSON.stringify(parsedData), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        if (error instanceof SessionCreationError) throw error;

        throw new SessionCreationError('Failed to process session plan', 'PROCESSING_ERROR', error);
      }
    } catch (error) {
      tasksLog.error('Session creation error:', error);

      if (error instanceof SessionCreationError) {
        return new Response(
          JSON.stringify({
            error: error.message,
            code: error.code,
            details: error.details,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: 'Failed to create session plan',
          code: 'INTERNAL_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    tasksLog.error('Session creation error:', error);

    if (error instanceof SessionCreationError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
          details: error.details,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (error instanceof Error && error.message.includes('overloaded')) {
      return new Response(
        JSON.stringify({
          type: 'error',
          error: {
            type: 'overloaded_error',
            message: 'Service is temporarily overloaded, please try again',
          },
        }),
        {
          status: 529,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
