/**
 * Queue Types - The Queue (Todo) System
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import type { TaskPriority, TaskSource, DifficultyLevel, TaskCategory } from '../lib/types';

/**
 * Task suggestion strategy for session planning
 */
export type SuggestionStrategy = 'priority' | 'quick-wins' | 'due-date' | 'balanced';

/**
 * View mode for the queue
 */
export type QueueViewMode = 'list' | 'kanban';

/**
 * Queue task with enhanced properties for the todo system
 */
export interface QueueTask {
  id: string;
  title: string;
  description?: string;
  duration: number; // estimated minutes

  // Priority system
  priority: TaskPriority;
  isFrog: boolean;

  // Due date system (optional, affects effective priority)
  dueDate?: string; // ISO date string YYYY-MM-DD

  // Tracking
  createdAt: string;
  lastUpdated?: string;
  completedAt?: string;

  // Source tracking
  source: TaskSource;

  // Status
  status: 'backlog' | 'scheduled' | 'completed' | 'discarded';
  scheduledFor?: string; // date string YYYY-MM-DD
  scheduledSessionId?: string;

  // Metadata
  tags?: string[];
  difficulty?: DifficultyLevel;
  taskCategory?: TaskCategory;
  projectType?: string;

  // Computed (not stored, calculated at runtime)
  effectivePriority?: number;
  ageInDays?: number;
}

/**
 * Grouped tasks for display
 */
export interface TaskGroup {
  key: string;
  label: string;
  tasks: QueueTask[];
  count: number;
  totalDuration: number;
}

/**
 * Priority configuration with colors
 */
export interface PriorityConfig {
  color: string;
  bg: string;
  label: string;
  weight: number; // base weight for effective priority calculation
}

export const PRIORITY_CONFIG: Record<TaskPriority, PriorityConfig> = {
  urgent: {
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    label: 'Urgent',
    weight: 100,
  },
  high: {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
    label: 'High',
    weight: 75,
  },
  medium: {
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.15)',
    label: 'Medium',
    weight: 50,
  },
  low: {
    color: '#6B7280',
    bg: 'rgba(107, 114, 128, 0.15)',
    label: 'Low',
    weight: 25,
  },
};

export const PRIORITY_ORDER: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

/**
 * Session planning request
 */
export interface PlanSessionRequest {
  availableMinutes: number;
  targetDate: string;
  strategy: SuggestionStrategy;
  selectedTaskIds?: string[]; // override auto-suggestion with specific tasks
}

/**
 * Session planning suggestion
 */
export interface SessionSuggestion {
  tasks: QueueTask[];
  totalDuration: number;
  utilizationPercent: number; // how much of available time is used
  frogsIncluded: number;
}

/**
 * Calculate effective priority for a task
 * Higher number = higher priority
 */
export function calculateEffectivePriority(task: QueueTask): number {
  const config = PRIORITY_CONFIG[task.priority];
  let score = config.weight;

  // Frog boost: +15
  if (task.isFrog) {
    score += 15;
  }

  // Due date boost
  if (task.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      // Overdue: +60
      score += 60;
    } else if (daysUntilDue === 0) {
      // Due today: +50
      score += 50;
    } else if (daysUntilDue === 1) {
      // Due tomorrow: +30
      score += 30;
    } else if (daysUntilDue <= 7) {
      // Due this week: +20
      score += 20;
    }
  }

  // Age boost: +5 per day old, caps at +25
  const ageInDays = calculateAgeInDays(task.createdAt);
  score += Math.min(ageInDays * 5, 25);

  return score;
}

/**
 * Calculate age in days from creation date
 */
export function calculateAgeInDays(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format relative time (e.g., "3 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

/**
 * Format due date relative to today
 */
export function formatDueDate(dueDate: string): {
  text: string;
  isOverdue: boolean;
  isDueSoon: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isDueSoon: false };
  }
  if (diffDays === 0) {
    return { text: 'Due today', isOverdue: false, isDueSoon: true };
  }
  if (diffDays === 1) {
    return { text: 'Due tomorrow', isOverdue: false, isDueSoon: true };
  }
  if (diffDays <= 7) {
    return { text: `Due in ${diffDays}d`, isOverdue: false, isDueSoon: true };
  }
  return { text: `Due in ${diffDays}d`, isOverdue: false, isDueSoon: false };
}
