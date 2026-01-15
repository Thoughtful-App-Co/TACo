/**
 * Queue Service - Task persistence and business logic for The Queue
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { nanoid } from 'nanoid';
import { logger } from '../../../../lib/logger';
import { notifyTempoDataChanged } from '../../../../lib/sync';
import type { TaskPriority, TaskSource } from '../../lib/types';
import {
  type QueueTask,
  type SuggestionStrategy,
  type SessionSuggestion,
  calculateEffectivePriority,
  calculateAgeInDays,
  PRIORITY_ORDER,
} from '../types';

const log = logger.create('QueueService');
const STORAGE_KEY = 'tempo_queue_tasks';
const SETTINGS_KEY = 'tempo_queue_settings';

export interface QueueSettings {
  suggestionStrategy: SuggestionStrategy;
  defaultDuration: number;
  showCompletedTasks: boolean;
}

const DEFAULT_SETTINGS: QueueSettings = {
  suggestionStrategy: 'priority',
  defaultDuration: 25,
  showCompletedTasks: false,
};

/**
 * Queue Service - manages task persistence and operations
 */
export class QueueService {
  // =========================================================================
  // SETTINGS
  // =========================================================================

  static getSettings(): QueueSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      log.error('Failed to load queue settings', error);
    }
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: Partial<QueueSettings>): void {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      log.info('Queue settings saved');

      // Notify sync manager of data change
      notifyTempoDataChanged();
    } catch (error) {
      log.error('Failed to save queue settings', error);
    }
  }

  static hasSetStrategy(): boolean {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        return settings.suggestionStrategy !== undefined;
      }
    } catch {
      // ignore
    }
    return false;
  }

  // =========================================================================
  // TASK CRUD
  // =========================================================================

  static async getAllTasks(): Promise<QueueTask[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const tasks: QueueTask[] = JSON.parse(stored);

      // Enrich with computed fields
      return tasks.map((task) => ({
        ...task,
        effectivePriority: calculateEffectivePriority(task),
        ageInDays: calculateAgeInDays(task.createdAt),
      }));
    } catch (error) {
      log.error('Failed to load tasks', error);
      return [];
    }
  }

  static async getBacklogTasks(): Promise<QueueTask[]> {
    const tasks = await this.getAllTasks();
    return tasks
      .filter((t) => t.status === 'backlog')
      .sort((a, b) => (b.effectivePriority || 0) - (a.effectivePriority || 0));
  }

  static async getTaskById(id: string): Promise<QueueTask | null> {
    const tasks = await this.getAllTasks();
    return tasks.find((t) => t.id === id) || null;
  }

  static async createTask(data: {
    title: string;
    description?: string;
    duration: number;
    priority?: TaskPriority;
    isFrog?: boolean;
    dueDate?: string;
    tags?: string[];
    source?: TaskSource;
  }): Promise<QueueTask> {
    const now = new Date().toISOString();
    const task: QueueTask = {
      id: nanoid(),
      title: data.title,
      description: data.description,
      duration: data.duration || this.getSettings().defaultDuration,
      priority: data.priority || 'medium',
      isFrog: data.isFrog || false,
      dueDate: data.dueDate,
      tags: data.tags,
      source: data.source || { type: 'manual', extractedAt: now },
      status: 'backlog',
      createdAt: now,
      lastUpdated: now,
    };

    const tasks = await this.getAllTasks();
    tasks.push(task);
    await this.saveTasks(tasks);

    log.info(`Created task: ${task.title}`);
    return {
      ...task,
      effectivePriority: calculateEffectivePriority(task),
      ageInDays: 0,
    };
  }

  static async createBulkTasks(
    lines: string[],
    defaultPriority: TaskPriority = 'medium'
  ): Promise<QueueTask[]> {
    const now = new Date().toISOString();
    const created: QueueTask[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Parse duration from line (e.g., "task name - 30m" or "task name (1h)")
      const durationMatch =
        trimmed.match(/[-–]\s*(\d+)\s*m(?:in)?s?$/i) ||
        trimmed.match(/\((\d+)\s*m(?:in)?s?\)$/i) ||
        trimmed.match(/[-–]\s*(\d+(?:\.\d+)?)\s*h(?:ours?)?$/i) ||
        trimmed.match(/\((\d+(?:\.\d+)?)\s*h(?:ours?)?\)$/i);

      let duration = this.getSettings().defaultDuration;
      let title = trimmed;

      if (durationMatch) {
        const value = parseFloat(durationMatch[1]);
        // Check if it's hours
        if (trimmed.toLowerCase().includes('h')) {
          duration = Math.round(value * 60);
        } else {
          duration = Math.round(value);
        }
        // Remove duration from title
        title = trimmed.replace(durationMatch[0], '').trim();
      }

      // Check for FROG marker
      const isFrog = /\bfrog\b/i.test(title);
      if (isFrog) {
        title = title.replace(/\bfrog\b/i, '').trim();
      }

      // Clean up trailing dashes or parentheses
      title = title
        .replace(/[-–]\s*$/, '')
        .replace(/\(\s*\)$/, '')
        .trim();

      if (!title) continue;

      const task: QueueTask = {
        id: nanoid(),
        title,
        duration,
        priority: isFrog ? 'high' : defaultPriority,
        isFrog,
        source: { type: 'import', extractedAt: now },
        status: 'backlog',
        createdAt: now,
        lastUpdated: now,
      };

      created.push(task);
    }

    if (created.length > 0) {
      const tasks = await this.getAllTasks();
      tasks.push(...created);
      await this.saveTasks(tasks);
      log.info(`Bulk created ${created.length} tasks`);
    }

    return created.map((t) => ({
      ...t,
      effectivePriority: calculateEffectivePriority(t),
      ageInDays: 0,
    }));
  }

  static async updateTask(id: string, updates: Partial<QueueTask>): Promise<QueueTask | null> {
    const tasks = await this.getAllTasks();
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
      log.warn(`Task not found: ${id}`);
      return null;
    }

    const updated: QueueTask = {
      ...tasks[index],
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    tasks[index] = updated;
    await this.saveTasks(tasks);

    log.info(`Updated task: ${updated.title}`);
    return {
      ...updated,
      effectivePriority: calculateEffectivePriority(updated),
      ageInDays: calculateAgeInDays(updated.createdAt),
    };
  }

  static async deleteTask(id: string): Promise<boolean> {
    const tasks = await this.getAllTasks();
    const filtered = tasks.filter((t) => t.id !== id);

    if (filtered.length === tasks.length) {
      return false;
    }

    await this.saveTasks(filtered);
    log.info(`Deleted task: ${id}`);
    return true;
  }

  static async discardTask(id: string): Promise<QueueTask | null> {
    return this.updateTask(id, { status: 'discarded' });
  }

  static async completeTask(id: string): Promise<QueueTask | null> {
    return this.updateTask(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  }

  // =========================================================================
  // PRIORITY OPERATIONS
  // =========================================================================

  static async updatePriority(id: string, priority: TaskPriority): Promise<QueueTask | null> {
    return this.updateTask(id, { priority });
  }

  static async toggleFrog(id: string): Promise<QueueTask | null> {
    const task = await this.getTaskById(id);
    if (!task) return null;
    return this.updateTask(id, { isFrog: !task.isFrog });
  }

  static async setDueDate(id: string, dueDate: string | undefined): Promise<QueueTask | null> {
    return this.updateTask(id, { dueDate });
  }

  // =========================================================================
  // SCHEDULING
  // =========================================================================

  static async scheduleTask(id: string, targetDate: string): Promise<QueueTask | null> {
    return this.updateTask(id, {
      status: 'scheduled',
      scheduledFor: targetDate,
    });
  }

  static async unscheduleTask(id: string): Promise<QueueTask | null> {
    return this.updateTask(id, {
      status: 'backlog',
      scheduledFor: undefined,
      scheduledSessionId: undefined,
    });
  }

  static async getScheduledTasksForDate(date: string): Promise<QueueTask[]> {
    const tasks = await this.getAllTasks();
    return tasks.filter((t) => t.status === 'scheduled' && t.scheduledFor === date);
  }

  // =========================================================================
  // SESSION PLANNING
  // =========================================================================

  static async suggestTasksForSession(
    availableMinutes: number,
    strategy?: SuggestionStrategy
  ): Promise<SessionSuggestion> {
    const effectiveStrategy = strategy || this.getSettings().suggestionStrategy;
    const backlogTasks = await this.getBacklogTasks();

    // Sort based on strategy
    const sorted = [...backlogTasks].sort((a, b) => {
      switch (effectiveStrategy) {
        case 'priority':
          // Already sorted by effective priority from getBacklogTasks
          return (b.effectivePriority || 0) - (a.effectivePriority || 0);

        case 'quick-wins':
          // Shorter tasks first
          return a.duration - b.duration;

        case 'due-date':
          // Tasks with due dates first, sorted by due date
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          return (b.effectivePriority || 0) - (a.effectivePriority || 0);

        case 'balanced':
          // Mix: prioritize frogs, then alternate by duration
          if (a.isFrog && !b.isFrog) return -1;
          if (!a.isFrog && b.isFrog) return 1;
          // Then by effective priority
          return (b.effectivePriority || 0) - (a.effectivePriority || 0);

        default:
          return 0;
      }
    });

    // Fill the available time
    const selected: QueueTask[] = [];
    let totalDuration = 0;

    for (const task of sorted) {
      if (totalDuration + task.duration <= availableMinutes) {
        selected.push(task);
        totalDuration += task.duration;
      }
    }

    return {
      tasks: selected,
      totalDuration,
      utilizationPercent: Math.round((totalDuration / availableMinutes) * 100),
      frogsIncluded: selected.filter((t) => t.isFrog).length,
    };
  }

  // =========================================================================
  // STATISTICS
  // =========================================================================

  static async getStats(): Promise<{
    totalBacklog: number;
    totalDuration: number;
    frogCount: number;
    overdueCount: number;
    byPriority: Record<TaskPriority, number>;
  }> {
    const tasks = await this.getBacklogTasks();
    const today = new Date().toISOString().split('T')[0];

    const byPriority: Record<TaskPriority, number> = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    let totalDuration = 0;
    let frogCount = 0;
    let overdueCount = 0;

    for (const task of tasks) {
      byPriority[task.priority]++;
      totalDuration += task.duration;
      if (task.isFrog) frogCount++;
      if (task.dueDate && task.dueDate < today) overdueCount++;
    }

    return {
      totalBacklog: tasks.length,
      totalDuration,
      frogCount,
      overdueCount,
      byPriority,
    };
  }

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  private static async saveTasks(tasks: QueueTask[]): Promise<void> {
    try {
      // Strip computed fields before saving
      const toStore = tasks.map(({ effectivePriority, ageInDays, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));

      // Notify sync manager of data change
      notifyTempoDataChanged();
    } catch (error) {
      log.error('Failed to save tasks', error);
      throw new Error('Failed to save tasks');
    }
  }

  // =========================================================================
  // MIGRATION FROM OLD TASK PERSISTENCE
  // =========================================================================

  static async migrateFromOldStorage(): Promise<number> {
    const OLD_STORAGE_KEY = 'tempo_tasks';
    try {
      const oldData = localStorage.getItem(OLD_STORAGE_KEY);
      if (!oldData) return 0;

      const oldTasks = JSON.parse(oldData);
      const backlogTasks = oldTasks.filter((t: { status: string }) => t.status === 'backlog');

      if (backlogTasks.length === 0) return 0;

      // Transform to new format
      const migrated: QueueTask[] = backlogTasks.map((t: Record<string, unknown>) => ({
        id: (t.id as string) || nanoid(),
        title: (t.title as string) || 'Untitled',
        description: t.description as string | undefined,
        duration: (t.duration as number) || 25,
        priority: (t.priority as TaskPriority) || 'medium',
        isFrog: (t.isFrog as boolean) || false,
        dueDate: undefined,
        source: (t.source as TaskSource) || {
          type: 'manual',
          extractedAt: new Date().toISOString(),
        },
        status: 'backlog' as const,
        createdAt: (t.createdAt as string) || new Date().toISOString(),
        lastUpdated: (t.lastUpdated as string) || new Date().toISOString(),
        tags: t.tags as string[] | undefined,
        difficulty: t.difficulty as QueueTask['difficulty'],
        taskCategory: t.taskCategory as QueueTask['taskCategory'],
      }));

      // Merge with any existing queue tasks
      const existing = await this.getAllTasks();
      const existingIds = new Set(existing.map((t) => t.id));
      const newTasks = migrated.filter((t) => !existingIds.has(t.id));

      if (newTasks.length > 0) {
        await this.saveTasks([...existing, ...newTasks]);
        log.info(`Migrated ${newTasks.length} tasks from old storage`);
      }

      return newTasks.length;
    } catch (error) {
      log.error('Failed to migrate from old storage', error);
      return 0;
    }
  }
}
