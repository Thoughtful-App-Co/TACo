import type {
  Session,
  StoryBlock,
  TimeBox,
  TimeBoxTask,
  BaseStatus,
  TimeBoxStatus,
  SessionStatus,
} from '../lib/types';
import { sessionStorage } from '../lib/sessionStorage';
import { logger } from '../../../lib/logger';

const log = logger.create('SessionStorage');

const SESSION_PREFIX = 'session-';

export class SessionStorageService {
  /**
   * Get a session by date
   */
  async getSession(date: string): Promise<Session | null> {
    log.debug(`Getting session for date: ${date}`);
    let storedSession: any = null;
    try {
      storedSession = await sessionStorage.getSession(date);
    } catch (error) {
      log.error(`Error getting session for date: ${date}`, error);
      return null;
    }

    if (!storedSession) {
      log.debug(`No session found for date: ${date}`);

      // For development only: if no session exists, create a dummy session
      // TODO: Replace process.env.NODE_ENV with import.meta.env.DEV once available
      if (import.meta.env?.DEV) {
        log.debug(`Creating dummy session for development`);
        const dummySession = this.createDummySession(date);
        await this.saveSession(date, dummySession);
        return dummySession;
      }

      return null;
    }

    log.debug(
      `Found session for date: ${date} with ${storedSession.storyBlocks?.length || 0} story blocks`
    );

    return {
      date: this.formatDate(date),
      storyBlocks: storedSession.storyBlocks || [],
      status: (storedSession.status as SessionStatus) || 'planned',
      totalDuration: storedSession.totalDuration || 0,
      lastUpdated: storedSession.lastUpdated || new Date().toISOString(),
    };
  }

  /**
   * Creates a dummy session for development testing
   * This should only be used in development environments
   */
  private createDummySession(date: string): Session {
    const formattedDate = this.formatDate(date);
    log.debug(`Creating dummy session for date: ${formattedDate}`);

    return {
      date: formattedDate,
      storyBlocks: [
        {
          id: 'story-1',
          title: 'Example Story 1',
          progress: 0,
          totalDuration: 55, // 25 + 5 + 25
          taskIds: [],
          timeBoxes: [
            {
              type: 'work',
              duration: 25,
              status: 'todo',
              tasks: [
                { title: 'Task 1', status: 'todo', duration: 0 },
                { title: 'Task 2', status: 'todo', duration: 0 },
              ],
            },
            {
              type: 'short-break',
              duration: 5,
              status: 'todo',
              tasks: [],
            },
            {
              type: 'work',
              duration: 25,
              status: 'todo',
              tasks: [{ title: 'Task 3', status: 'todo', duration: 0 }],
            },
          ],
        },
        {
          id: 'story-2',
          title: 'Example Story 2',
          progress: 0,
          totalDuration: 25,
          taskIds: [],
          timeBoxes: [
            {
              type: 'work',
              duration: 25,
              status: 'todo',
              tasks: [
                { title: 'Task 4', status: 'todo', duration: 0 },
                { title: 'Task 5', status: 'todo', duration: 0 },
              ],
            },
          ],
        },
      ],
      status: 'planned',
      totalDuration: 80,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get all sessions
   */
  async getAllSessions(): Promise<Session[]> {
    log.debug(`Getting all sessions`);
    let storedSessions: Record<string, any> = {};
    try {
      storedSessions = await sessionStorage.getAllSessions();
    } catch (error) {
      log.error(`Error getting all sessions`, error);
      return [];
    }
    const sessionCount = Object.keys(storedSessions).length;
    log.debug(`Found ${sessionCount} sessions`);

    if (sessionCount === 0) {
      // Debug: check localStorage directly to see if there are any session keys
      const allStorageKeys: Array<string | null> = [];
      for (let i = 0; i < localStorage.length; i++) {
        allStorageKeys.push(localStorage.key(i));
      }
      log.debug(`Debug - All localStorage keys:`, allStorageKeys);

      // Check for any session keys specifically
      const sessionKeys = allStorageKeys.filter(
        (key): key is string => key !== null && key.startsWith('session-')
      );
      if (sessionKeys.length > 0) {
        log.debug(
          `Found ${sessionKeys.length} raw session keys, but they were not loaded by sessionStorage:`,
          sessionKeys
        );

        // Try to manually retrieve and fix this
        const manuallyLoadedSessions = [];
        for (const key of sessionKeys) {
          try {
            const rawData = localStorage.getItem(key);
            if (rawData) {
              const sessionData = JSON.parse(rawData);
              const date = key.replace('session-', '');
              manuallyLoadedSessions.push({
                date: this.formatDate(date),
                storyBlocks: sessionData.storyBlocks || [],
                status: (sessionData.status as SessionStatus) || 'planned',
                totalDuration: sessionData.totalDuration || 0,
                lastUpdated: sessionData.lastUpdated || new Date().toISOString(),
              });
              log.debug(`Manually recovered session for date: ${date}`);
            }
          } catch (error) {
            log.error(`Failed to manually parse session from key ${key}:`, error);
          }
        }

        if (manuallyLoadedSessions.length > 0) {
          log.debug(`Returning ${manuallyLoadedSessions.length} manually loaded sessions`);
          return manuallyLoadedSessions;
        }
      }
    }

    return Object.entries(storedSessions).map(([date, session]) => ({
      date: this.formatDate(date),
      storyBlocks: session.storyBlocks,
      status: (session.status as SessionStatus) || 'planned',
      totalDuration: session.totalDuration,
      lastUpdated: session.lastUpdated,
    }));
  }

  /**
   * Save a session
   */
  async saveSession(date: string, session: Session): Promise<void> {
    const formattedDate = this.formatDate(date);
    log.debug(
      `Saving session for date: ${formattedDate} with ${session.storyBlocks?.length || 0} story blocks and total duration: ${session.totalDuration}`
    );

    try {
      await sessionStorage.saveSession(formattedDate, {
        ...session,
        totalSessions: 1, // Required by StoredSession
        startTime: session.lastUpdated || new Date().toISOString(),
        endTime: new Date().toISOString(),
        frogMetrics: { total: 0, scheduled: 0, scheduledWithinTarget: 0 }, // Required by SessionPlan
      });

      // Verify the session was saved
      const verifySession: any = await sessionStorage.getSession(formattedDate);
      if (!verifySession) {
        log.error(`Failed to verify session save for date: ${formattedDate}`);
      } else {
        log.info(`Successfully saved and verified session for date: ${formattedDate}`);
      }
    } catch (error) {
      log.error(`Error saving session for date: ${formattedDate}`, error);
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(date: string): Promise<void> {
    sessionStorage.deleteSession(this.formatDate(date));
  }

  /**
   * Update task status and recalculate related states
   */
  async updateTaskStatus(
    date: string,
    storyId: string | undefined,
    timeBoxIndex: number,
    taskIndex: number,
    status: 'todo' | 'completed'
  ): Promise<boolean> {
    // If storyId is undefined, we can't update the task status
    if (!storyId) {
      log.error('Cannot update task status: storyId is undefined');
      return false;
    }

    log.debug(
      `Updating task status in session ${date}, story ${storyId}, timeBox ${timeBoxIndex}, task ${taskIndex} to ${status}`
    );

    const result = sessionStorage.updateTaskStatus(date, storyId, timeBoxIndex, taskIndex, status);
    log.debug(`Task status update result: ${result}`);

    return result;
  }

  /**
   * Update timebox status and recalculate related states
   */
  async updateTimeBoxStatus(
    date: string,
    storyId: string,
    timeBoxIndex: number,
    status: TimeBoxStatus
  ): Promise<boolean> {
    return sessionStorage.updateTimeBoxStatus(date, storyId, timeBoxIndex, status);
  }

  /**
   * Calculate session status based on all work timeboxes
   */
  private calculateSessionStatus(storyBlocks: StoryBlock[]): SessionStatus {
    const allWorkBoxes = storyBlocks.flatMap((story) =>
      story.timeBoxes.filter((box) => box.type === 'work')
    );

    const allCompleted = allWorkBoxes.every((box) => box.status === 'completed');
    const anyInProgress = allWorkBoxes.some((box) => box.status === 'in-progress');
    const anyCompleted = allWorkBoxes.some((box) => box.status === 'completed');

    if (allCompleted) return 'completed';
    if (anyInProgress || anyCompleted) return 'in-progress';
    return 'planned';
  }

  /**
   * Calculate story progress based on completed work timeboxes
   */
  private calculateStoryProgress(timeBoxes: TimeBox[]): number {
    const workBoxes = timeBoxes.filter((box) => box.type === 'work');
    const completedWorkBoxes = workBoxes.filter((box) => box.status === 'completed');
    return workBoxes.length > 0
      ? Math.round((completedWorkBoxes.length / workBoxes.length) * 100)
      : 0;
  }

  /**
   * Update story blocks with new task status
   */
  private updateStoryBlocksWithTaskStatus(
    storyBlocks: StoryBlock[],
    storyId: string,
    timeBoxIndex: number,
    taskIndex: number,
    status: 'todo' | 'completed'
  ): StoryBlock[] {
    return storyBlocks.map((story) => {
      if (story.id === storyId && story.timeBoxes[timeBoxIndex]) {
        const timeBox = story.timeBoxes[timeBoxIndex];
        if (timeBox.tasks && timeBox.tasks[taskIndex]) {
          const updatedTasks = [...timeBox.tasks];
          updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], status };

          const timeBoxStatus = this.calculateTimeBoxStatus(updatedTasks);
          const updatedTimeBoxes = [...story.timeBoxes];
          updatedTimeBoxes[timeBoxIndex] = {
            ...timeBox,
            tasks: updatedTasks,
            status: timeBoxStatus,
          };

          const progress = this.calculateStoryProgress(updatedTimeBoxes);
          return {
            ...story,
            timeBoxes: updatedTimeBoxes,
            progress,
          };
        }
      }
      return story;
    });
  }

  /**
   * Update story blocks with new timebox status
   */
  private updateStoryBlocksWithTimeBoxStatus(
    storyBlocks: StoryBlock[],
    storyId: string,
    timeBoxIndex: number,
    status: TimeBoxStatus
  ): StoryBlock[] {
    return storyBlocks.map((story) => {
      if (story.id === storyId && story.timeBoxes[timeBoxIndex]) {
        const updatedTimeBoxes = [...story.timeBoxes];
        const timeBox = updatedTimeBoxes[timeBoxIndex];

        // Update tasks based on timebox status
        if (timeBox.tasks) {
          timeBox.tasks = timeBox.tasks.map((task) => ({
            ...task,
            status: status === 'completed' ? 'completed' : 'todo',
          }));
        }

        updatedTimeBoxes[timeBoxIndex] = {
          ...timeBox,
          status,
        };

        const progress = this.calculateStoryProgress(updatedTimeBoxes);
        return {
          ...story,
          timeBoxes: updatedTimeBoxes,
          progress,
        };
      }
      return story;
    });
  }

  /**
   * Calculate timebox status based on its tasks
   */
  private calculateTimeBoxStatus(tasks: TimeBoxTask[]): TimeBoxStatus {
    const allTasksCompleted = tasks.every((task) => task.status === 'completed');
    const anyTaskCompleted = tasks.some((task) => task.status === 'completed');

    if (allTasksCompleted) return 'completed';
    if (anyTaskCompleted) return 'in-progress';
    return 'todo';
  }

  /**
   * Save timer state for a session
   */
  async saveTimerState(
    date: string,
    activeTimeBox: { storyId: string; timeBoxIndex: number } | null,
    timeRemaining: number | null,
    isTimerRunning: boolean
  ): Promise<boolean> {
    try {
      const formattedDate = this.formatDate(date);
      log.debug(`Saving timer state for date: ${formattedDate}`);

      return sessionStorage.saveTimerState(
        formattedDate,
        activeTimeBox,
        timeRemaining,
        isTimerRunning
      );
    } catch (error) {
      log.error(`Error saving timer state for date: ${date}:`, error);
      return false;
    }
  }

  /**
   * Save actual duration for a timebox
   */
  async saveActualDuration(
    date: string,
    storyId: string,
    timeBoxIndex: number,
    actualDuration: number
  ): Promise<boolean> {
    try {
      const formattedDate = this.formatDate(date);
      log.debug(
        `Saving actual duration of ${actualDuration}min for timebox ${timeBoxIndex} in story ${storyId}`
      );

      // Get the session
      const session = await sessionStorage.getSession(formattedDate);
      if (!session) {
        log.error(`No session found for date: ${formattedDate}`);
        return false;
      }

      // Find the story
      const storyIndex = session.storyBlocks.findIndex((s) => s.id === storyId);
      if (storyIndex === -1) {
        log.error(`Story with ID ${storyId} not found`);
        return false;
      }

      // Find the timebox
      const timeBox = session.storyBlocks[storyIndex].timeBoxes[timeBoxIndex];
      if (!timeBox) {
        log.error(`TimeBox at index ${timeBoxIndex} not found`);
        return false;
      }

      // Log timebox details for debugging
      log.debug(`TimeBox details before update:`);
      log.debug(`  Type: ${timeBox.type}`);
      log.debug(`  Duration: ${timeBox.duration}min`);
      log.debug(`  Status: ${timeBox.status}`);
      log.debug(`  Start Time: ${timeBox.startTime || 'Not set'}`);
      log.debug(`  Actual Duration: ${timeBox.actualDuration || 'Not set'}`);

      // Set the actual duration
      timeBox.actualDuration = actualDuration;

      // Ensure timeBox has a startTime (required for time calculations)
      if (!timeBox.startTime) {
        // Create a synthetic startTime based on the end time and actual duration
        const syntheticStartTime = new Date();
        syntheticStartTime.setMinutes(syntheticStartTime.getMinutes() - actualDuration);
        timeBox.startTime = syntheticStartTime.toISOString();
        log.debug(`Created synthetic startTime: ${timeBox.startTime}`);
      }

      // Save the updated session
      const sessionData: Session = {
        date: formattedDate,
        storyBlocks: session.storyBlocks,
        status: (session.status as SessionStatus) || 'planned',
        totalDuration: session.totalDuration || 0,
        lastUpdated: new Date().toISOString(),
      };

      await this.saveSession(formattedDate, sessionData);

      // Verify the save worked by checking if the actual duration was saved
      const verifySession = await sessionStorage.getSession(formattedDate);
      if (
        verifySession &&
        verifySession.storyBlocks[storyIndex] &&
        verifySession.storyBlocks[storyIndex].timeBoxes[timeBoxIndex]
      ) {
        const savedActualDuration =
          verifySession.storyBlocks[storyIndex].timeBoxes[timeBoxIndex].actualDuration;

        if (savedActualDuration === actualDuration) {
          log.debug(`Successfully verified actual duration was saved: ${savedActualDuration}min`);
          return true;
        } else {
          log.error(
            `Verification failed - Expected: ${actualDuration}min, Got: ${savedActualDuration}min`
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      log.error(`Error saving actual duration:`, error);
      return false;
    }
  }

  /**
   * Get timer state for a session
   */
  async getTimerState(date: string): Promise<{
    activeTimeBox: { storyId: string; timeBoxIndex: number } | null;
    timeRemaining: number | null;
    isTimerRunning: boolean;
  } | null> {
    try {
      const timerState = await sessionStorage.getTimerState(date);
      return timerState;
    } catch (error) {
      log.error(`Error getting timer state for date: ${date}`, error);
      return null;
    }
  }

  /**
   * Archives the session for the given date.
   * This changes the session status to 'archived' so it won't be shown in active views
   *
   * @param date The date of the session to archive
   * @returns A boolean indicating whether the archiving was successful
   */
  async archiveSession(date: string): Promise<boolean> {
    try {
      const formattedDate = this.formatDate(date);
      const session = await this.getSession(formattedDate);

      if (!session) {
        log.error(`No session found for date: ${formattedDate}`);
        return false;
      }

      // Update session status to archived
      const updatedSession: Session = {
        ...session,
        status: 'archived',
        lastUpdated: new Date().toISOString(),
      };

      await this.saveSession(formattedDate, updatedSession);
      log.info(`Successfully archived session for date: ${formattedDate}`);
      return true;
    } catch (error) {
      log.error(`Error archiving session for date: ${date}:`, error);
      return false;
    }
  }

  /**
   * Unarchives the session for the given date.
   * This changes the session status from 'archived' back to 'planned'
   *
   * @param date The date of the session to unarchive
   * @returns A boolean indicating whether the unarchiving was successful
   */
  async unarchiveSession(date: string): Promise<boolean> {
    try {
      const formattedDate = this.formatDate(date);
      const session = await this.getSession(formattedDate);

      if (!session) {
        log.error(`No session found for date: ${formattedDate}`);
        return false;
      }

      // Update session status back to planned
      const updatedSession: Session = {
        ...session,
        status: 'planned',
        lastUpdated: new Date().toISOString(),
      };

      await this.saveSession(formattedDate, updatedSession);
      log.info(`Successfully unarchived session for date: ${formattedDate}`);
      return true;
    } catch (error) {
      log.error(`Error unarchiving session for date: ${date}:`, error);
      return false;
    }
  }

  /**
   * Format a date string to YYYY-MM-DD format
   */
  private formatDate(date: string): string {
    // If date already includes hyphens (YYYY-MM-DD), return as is
    if (date.includes('-') && date.split('-').length === 3) {
      return date;
    }

    // Try to parse as date and format
    try {
      const parsedDate = new Date(date);
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      log.error('Failed to parse date:', date);
      return date; // Return original if parsing fails
    }
  }

  /**
   * Normalize a session object to ensure all required fields are present
   */
  private normalizeSession(session: any): Session {
    if (!session || typeof session !== 'object') {
      throw new Error('Invalid session data');
    }

    // Ensure date is in correct format
    const date = this.formatDate(session.date);

    return {
      ...session,
      date,
      status: session.status || 'planned',
      storyBlocks: session.storyBlocks || [],
      totalDuration: session.totalDuration || 0,
      lastUpdated: session.lastUpdated || new Date().toISOString(),
    };
  }

  private getKey(date: string): string {
    return `${SESSION_PREFIX}${date}`;
  }
}
