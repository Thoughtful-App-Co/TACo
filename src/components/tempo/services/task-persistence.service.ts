import { nanoid } from 'nanoid';
import type { Task, Session, TaskPriority } from '../lib/types';
import { logger } from '../../../lib/logger';

const STORAGE_KEY = 'tempo_tasks';

interface StoredTask extends Omit<Task, 'lastUpdated'> {
  lastUpdated: string;
}

export class TaskPersistenceService {
  /**
   * Save tasks to persistent storage
   */
  static async saveTasks(tasks: Task[]): Promise<void> {
    try {
      const now = new Date().toISOString();
      const tasksWithIds = tasks.map((task) => ({
        ...task,
        id: task.id || nanoid(),
        lastUpdated: now,
      })) as StoredTask[];

      // Get existing tasks
      const existingTasks = await this.getTasks();

      // Create a map of existing tasks by ID for quick lookup
      const existingTaskMap = new Map(existingTasks.map((task) => [task.id, task]));

      // Merge new tasks with existing ones, updating if they exist
      const mergedTasks = tasksWithIds.map((task) => {
        const existingTask = existingTaskMap.get(task.id);
        if (existingTask) {
          return {
            ...existingTask,
            ...task,
            lastUpdated: now,
          } as StoredTask;
        }
        return task;
      });

      // Add any existing tasks that weren't in the new set
      existingTasks.forEach((task) => {
        if (!tasksWithIds.some((newTask) => newTask.id === task.id)) {
          mergedTasks.push({
            ...task,
            lastUpdated: task.lastUpdated || now,
          } as StoredTask);
        }
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedTasks));
    } catch (error) {
      logger.storage.error('Error saving tasks:', error);
      throw new Error('Failed to save tasks');
    }
  }

  /**
   * Retrieve tasks from persistent storage
   */
  static async getTasks(): Promise<Task[]> {
    try {
      const tasksJson = localStorage.getItem(STORAGE_KEY);
      if (!tasksJson) return [];
      const storedTasks = JSON.parse(tasksJson) as StoredTask[];
      return storedTasks.map((task) => ({
        ...task,
        lastUpdated: task.lastUpdated,
      }));
    } catch (error) {
      logger.storage.error('Error retrieving tasks:', error);
      throw new Error('Failed to retrieve tasks');
    }
  }

  /**
   * Update a specific task
   */
  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const tasks = await this.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);

    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const updatedTask = {
      ...tasks[taskIndex],
      ...updates,
      lastUpdated: new Date().toISOString(),
    } as StoredTask;

    tasks[taskIndex] = updatedTask;
    await this.saveTasks(tasks);
    return updatedTask;
  }

  /**
   * Delete a specific task
   */
  static async deleteTask(taskId: string): Promise<void> {
    const tasks = await this.getTasks();
    const filteredTasks = tasks.filter((t) => t.id !== taskId);
    await this.saveTasks(filteredTasks);
  }

  /**
   * Clear all tasks from storage
   */
  static async clearTasks(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      logger.storage.error('Error clearing tasks:', error);
      throw new Error('Failed to clear tasks');
    }
  }

  /**
   * Get tasks by status
   */
  static async getTasksByStatus(status: 'todo' | 'completed'): Promise<Task[]> {
    const tasks = await this.getTasks();
    return tasks.filter((task) => task.status === status);
  }

  /**
   * Get tasks by date range
   */
  static async getTasksByDateRange(startDate: Date, endDate: Date): Promise<Task[]> {
    const tasks = await this.getTasks();
    return tasks.filter((task) => {
      if (!task.lastUpdated) return false;
      const taskDate = new Date(task.lastUpdated);
      return taskDate >= startDate && taskDate <= endDate;
    });
  }

  /**
   * Get all tasks in backlog status, sorted by priority then date
   */
  static async getBacklogTasks(): Promise<Task[]> {
    const tasks = await this.getTasks();
    return tasks
      .filter((task) => task.status === 'backlog')
      .sort((a, b) => {
        // Sort by priority first (urgent > high > medium > low)
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const aPriority = priorityOrder[a.priority || 'medium'];
        const bPriority = priorityOrder[b.priority || 'medium'];
        if (aPriority !== bPriority) return aPriority - bPriority;

        // Then by creation date (newest first)
        const aDate = new Date(a.createdAt || 0).getTime();
        const bDate = new Date(b.createdAt || 0).getTime();
        return bDate - aDate;
      });
  }

  /**
   * Get backlog tasks grouped by source session date
   */
  static async getBacklogTasksBySource(): Promise<Map<string, Task[]>> {
    const backlogTasks = await this.getBacklogTasks();
    const grouped = new Map<string, Task[]>();

    backlogTasks.forEach((task) => {
      const sourceDate = task.source?.sessionDate || 'manual';
      if (!grouped.has(sourceDate)) {
        grouped.set(sourceDate, []);
      }
      grouped.get(sourceDate)!.push(task);
    });

    return grouped;
  }

  /**
   * Extract incomplete work from a session and create backlog tasks
   * @param session - The session to extract from
   * @param focusBlockIds - IDs of focus blocks to extract (if empty, extracts all incomplete)
   * @returns Array of created backlog tasks
   */
  static async extractFromSession(session: Session, focusBlockIds?: string[]): Promise<Task[]> {
    const now = new Date().toISOString();
    const createdTasks: Task[] = [];

    for (const block of session.storyBlocks) {
      // Skip if specific blocks requested and this isn't one of them
      if (focusBlockIds && focusBlockIds.length > 0 && !focusBlockIds.includes(block.id)) {
        continue;
      }

      // Check if block has incomplete work
      const incompleteTimeboxes = block.timeBoxes.filter(
        (tb) => tb.status !== 'completed' && tb.type === 'work'
      );

      if (incompleteTimeboxes.length === 0) continue;

      // Calculate incomplete duration
      const incompleteDuration = incompleteTimeboxes.reduce((sum, tb) => sum + tb.duration, 0);

      // Create a backlog task for this focus block
      const task: Task = {
        id: nanoid(),
        title: block.title || 'Untitled Focus Block',
        description: `Extracted from session on ${session.date}. ${incompleteTimeboxes.length} incomplete timebox(es).`,
        duration: incompleteDuration,
        difficulty: 'medium',
        taskCategory: 'focus',
        isFrog: false,
        status: 'backlog',
        source: {
          type: 'session-closeout',
          sessionDate: session.date,
          focusBlockId: block.id,
          focusBlockTitle: block.title,
          extractedAt: now,
        },
        priority: 'medium',
        children: [],
        refined: false,
        createdAt: now,
        lastUpdated: now,
      };

      // Extract frog status if any timebox had a frog task
      for (const tb of incompleteTimeboxes) {
        if (tb.tasks?.some((t) => t.isFrog)) {
          task.isFrog = true;
          task.priority = 'high';
          break;
        }
      }

      createdTasks.push(task);
    }

    // Save all created tasks
    if (createdTasks.length > 0) {
      await this.saveTasks(createdTasks);
      logger.tasks.info(`Extracted ${createdTasks.length} tasks from session ${session.date}`);
    }

    return createdTasks;
  }

  /**
   * Schedule a backlog task for a specific date
   */
  static async scheduleTask(
    taskId: string,
    targetDate: string,
    focusBlockId?: string
  ): Promise<Task> {
    return this.updateTask(taskId, {
      status: 'scheduled',
      scheduledFor: targetDate,
      scheduledFocusBlockId: focusBlockId,
      lastUpdated: new Date().toISOString(),
    });
  }

  /**
   * Return a scheduled task to backlog
   */
  static async unscheduleTask(taskId: string): Promise<Task> {
    return this.updateTask(taskId, {
      status: 'backlog',
      scheduledFor: undefined,
      scheduledFocusBlockId: undefined,
      lastUpdated: new Date().toISOString(),
    });
  }

  /**
   * Discard a backlog task (soft delete - keeps record)
   */
  static async discardTask(taskId: string): Promise<Task> {
    return this.updateTask(taskId, {
      status: 'discarded',
      lastUpdated: new Date().toISOString(),
    });
  }

  /**
   * Create a new backlog task manually
   */
  static async createBacklogTask(taskData: {
    title: string;
    description?: string;
    duration: number;
    priority?: TaskPriority;
    isFrog?: boolean;
    tags?: string[];
  }): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: nanoid(),
      title: taskData.title,
      description: taskData.description || '',
      duration: taskData.duration,
      difficulty: 'medium',
      taskCategory: 'focus',
      isFrog: taskData.isFrog || false,
      status: 'backlog',
      source: {
        type: 'manual',
        extractedAt: now,
      },
      priority: taskData.priority || 'medium',
      tags: taskData.tags,
      children: [],
      refined: false,
      createdAt: now,
      lastUpdated: now,
    };

    await this.saveTasks([task]);
    logger.tasks.info(`Created manual backlog task: ${task.title}`);

    return task;
  }

  /**
   * Get count of backlog tasks
   */
  static async getBacklogCount(): Promise<number> {
    const tasks = await this.getTasks();
    return tasks.filter((task) => task.status === 'backlog').length;
  }

  /**
   * Get tasks scheduled for a specific date
   */
  static async getScheduledTasksForDate(date: string): Promise<Task[]> {
    const tasks = await this.getTasks();
    return tasks.filter((task) => task.status === 'scheduled' && task.scheduledFor === date);
  }
}
