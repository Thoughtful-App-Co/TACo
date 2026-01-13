/**
 * Tempo Notification Service
 *
 * Provides notification counts and state for tab badges and alerts.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { QueueService } from '../queue/services/queue.service';
import { SessionStorageService } from './session-storage.service';
import { logger } from '../../../lib/logger';

const log = logger.create('TempoNotificationService');

export interface NotificationState {
  sessions: {
    count: number;
    hasUrgent: boolean;
    scheduledForToday: number;
    overdueSessions: number;
  };
  queue: {
    count: number;
    hasOverdue: boolean;
    overdueCount: number;
  };
}

/**
 * Service for managing notification state across Tempo tabs
 */
export class TempoNotificationService {
  private static storageService = new SessionStorageService();

  /**
   * Get count of tasks scheduled for today (from Queue)
   */
  static async getScheduledForTodayCount(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tasks = await QueueService.getScheduledTasksForDate(today);
      return tasks.length;
    } catch (error) {
      log.error('Failed to get scheduled tasks for today', error);
      return 0;
    }
  }

  /**
   * Get count of sessions that need attention (incomplete + overdue planned)
   */
  static async getOverdueSessionCount(): Promise<number> {
    try {
      const sessions = await this.storageService.getAllSessions();
      const today = new Date().toISOString().split('T')[0];

      const needsAttention = sessions.filter(
        (s) =>
          s.status === 'incomplete' || (s.status === 'planned' && s.date < today)
      );

      return needsAttention.length;
    } catch (error) {
      log.error('Failed to get overdue session count', error);
      return 0;
    }
  }

  /**
   * Get total backlog task count
   */
  static async getBacklogCount(): Promise<number> {
    try {
      const tasks = await QueueService.getBacklogTasks();
      return tasks.length;
    } catch (error) {
      log.error('Failed to get backlog count', error);
      return 0;
    }
  }

  /**
   * Get count of overdue tasks (past due date)
   */
  static async getOverdueTaskCount(): Promise<number> {
    try {
      const stats = await QueueService.getStats();
      return stats.overdueCount;
    } catch (error) {
      log.error('Failed to get overdue task count', error);
      return 0;
    }
  }

  /**
   * Get combined notification state for all tabs
   */
  static async getNotificationState(): Promise<NotificationState> {
    try {
      const [scheduledToday, overdueSessions, stats] = await Promise.all([
        this.getScheduledForTodayCount(),
        this.getOverdueSessionCount(),
        QueueService.getStats(),
      ]);

      return {
        sessions: {
          count: scheduledToday + overdueSessions,
          hasUrgent: overdueSessions > 0,
          scheduledForToday: scheduledToday,
          overdueSessions,
        },
        queue: {
          count: stats.totalBacklog,
          hasOverdue: stats.overdueCount > 0,
          overdueCount: stats.overdueCount,
        },
      };
    } catch (error) {
      log.error('Failed to get notification state', error);
      return {
        sessions: {
          count: 0,
          hasUrgent: false,
          scheduledForToday: 0,
          overdueSessions: 0,
        },
        queue: {
          count: 0,
          hasOverdue: false,
          overdueCount: 0,
        },
      };
    }
  }

  /**
   * Get scheduled tasks for a specific date
   * Used by SessionCreateModal to show tasks scheduled for the selected date
   */
  static async getScheduledTasksForDate(date: string) {
    try {
      return await QueueService.getScheduledTasksForDate(date);
    } catch (error) {
      log.error(`Failed to get scheduled tasks for ${date}`, error);
      return [];
    }
  }
}
