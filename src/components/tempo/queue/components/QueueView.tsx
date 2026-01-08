/**
 * QueueView - Main page component for The Queue tab
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createEffect, createMemo, For, Show, onMount } from 'solid-js';
import {
  Tray,
  Upload,
  Clock,
  CalendarBlank,
  Funnel,
  ListBullets,
  SquaresFour,
} from 'phosphor-solid';
import { tempoDesign } from '../../theme/tempo-design';
import { logger } from '../../../../lib/logger';
import type { TaskPriority } from '../../lib/types';
import {
  type QueueTask,
  type QueueViewMode,
  PRIORITY_CONFIG,
  PRIORITY_ORDER,
  formatDuration,
} from '../types';
import { QueueService } from '../services/queue.service';
import { QueueTaskCard } from './QueueTaskCard';
import { FrogTaskCard } from './FrogTaskCard';
import { QuickAddTask } from './QuickAddTask';
import { BulkImportModal } from './BulkImportModal';
import { PlanSessionPanel } from './PlanSessionPanel';

const log = logger.create('QueueView');

export const QueueView: Component = () => {
  // Data state
  const [tasks, setTasks] = createSignal<QueueTask[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);

  // UI state
  const [viewMode, setViewMode] = createSignal<QueueViewMode>('list');
  const [filterPriority, setFilterPriority] = createSignal<TaskPriority | 'all'>('all');
  const [showBulkImport, setShowBulkImport] = createSignal(false);
  const [showPlanSession, setShowPlanSession] = createSignal(false);
  const [editingTask, setEditingTask] = createSignal<QueueTask | null>(null);

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = createSignal<string | null>(null);

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  const loadTasks = async () => {
    try {
      const loaded = await QueueService.getBacklogTasks();
      setTasks(loaded);
    } catch (error) {
      log.error('Failed to load tasks', error);
    } finally {
      setIsLoading(false);
    }
  };

  onMount(async () => {
    // Try to migrate from old storage
    await QueueService.migrateFromOldStorage();
    await loadTasks();
  });

  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================

  // Separate frogs and regular tasks
  const frogTasks = createMemo(() => tasks().filter((t) => t.isFrog));
  const regularTasks = createMemo(() => tasks().filter((t) => !t.isFrog));

  // Filter by priority if set
  const filteredRegularTasks = createMemo(() => {
    if (filterPriority() === 'all') return regularTasks();
    return regularTasks().filter((t) => t.priority === filterPriority());
  });

  // Group by priority for kanban view
  const tasksByPriority = createMemo(() => {
    const grouped: Record<TaskPriority, QueueTask[]> = {
      urgent: [],
      high: [],
      medium: [],
      low: [],
    };

    for (const task of regularTasks()) {
      grouped[task.priority].push(task);
    }

    return grouped;
  });

  // Stats
  const stats = createMemo(() => {
    const allTasks = tasks();
    return {
      total: allTasks.length,
      frogs: frogTasks().length,
      totalDuration: allTasks.reduce((sum, t) => sum + t.duration, 0),
      overdue: allTasks.filter(
        (t) => t.dueDate && t.dueDate < new Date().toISOString().split('T')[0]
      ).length,
    };
  });

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleAddTask = async (data: {
    title: string;
    duration: number;
    priority: TaskPriority;
    isFrog: boolean;
    dueDate?: string;
  }) => {
    try {
      await QueueService.createTask(data);
      await loadTasks();
    } catch (error) {
      log.error('Failed to add task', error);
      throw error;
    }
  };

  const handleBulkImport = async (lines: string[], defaultPriority: TaskPriority) => {
    try {
      const created = await QueueService.createBulkTasks(lines, defaultPriority);
      await loadTasks();
      return created.length;
    } catch (error) {
      log.error('Failed to bulk import', error);
      throw error;
    }
  };

  const handleScheduleTask = async (taskId: string, date: string) => {
    try {
      await QueueService.scheduleTask(taskId, date);
      await loadTasks();
    } catch (error) {
      log.error('Failed to schedule task', error);
    }
  };

  const handleDiscardTask = async (taskId: string) => {
    try {
      await QueueService.discardTask(taskId);
      await loadTasks();
    } catch (error) {
      log.error('Failed to discard task', error);
    }
  };

  const handleToggleFrog = async (taskId: string) => {
    try {
      await QueueService.toggleFrog(taskId);
      await loadTasks();
    } catch (error) {
      log.error('Failed to toggle frog', error);
    }
  };

  const handlePriorityChange = async (taskId: string, priority: TaskPriority) => {
    try {
      await QueueService.updatePriority(taskId, priority);
      await loadTasks();
    } catch (error) {
      log.error('Failed to update priority', error);
    }
  };

  const handleEditTask = (task: QueueTask) => {
    // TODO: Open edit modal
    setEditingTask(task);
    log.info('Edit task:', task.title);
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        gap: '24px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          'flex-wrap': 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              'border-radius': tempoDesign.radius.xl,
              background: `${tempoDesign.colors.primary}15`,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
            }}
          >
            <Tray size={26} weight="fill" color={tempoDesign.colors.primary} />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                'font-size': tempoDesign.typography.sizes['2xl'],
                'font-weight': tempoDesign.typography.weights.semibold,
                color: tempoDesign.colors.foreground,
              }}
            >
              The Queue
            </h1>
            <p
              style={{
                margin: 0,
                'font-size': tempoDesign.typography.sizes.sm,
                color: tempoDesign.colors.mutedForeground,
              }}
            >
              {stats().total} tasks &middot; {formatDuration(stats().totalDuration)} total
              <Show when={stats().frogs > 0}> &middot; {stats().frogs} frogs</Show>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
          {/* View toggle */}
          <div
            style={{
              display: 'flex',
              'border-radius': tempoDesign.radius.md,
              border: `1px solid ${tempoDesign.colors.border}`,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                width: '36px',
                height: '36px',
                border: 'none',
                background: viewMode() === 'list' ? tempoDesign.colors.secondary : 'transparent',
                color:
                  viewMode() === 'list'
                    ? tempoDesign.colors.foreground
                    : tempoDesign.colors.mutedForeground,
                cursor: 'pointer',
              }}
              aria-label="List view"
            >
              <ListBullets size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                width: '36px',
                height: '36px',
                border: 'none',
                background: viewMode() === 'kanban' ? tempoDesign.colors.secondary : 'transparent',
                color:
                  viewMode() === 'kanban'
                    ? tempoDesign.colors.foreground
                    : tempoDesign.colors.mutedForeground,
                cursor: 'pointer',
              }}
              aria-label="Board view"
            >
              <SquaresFour size={18} />
            </button>
          </div>

          {/* Bulk import button */}
          <button
            type="button"
            onClick={() => setShowBulkImport(true)}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '6px',
              padding: '8px 14px',
              'border-radius': tempoDesign.radius.md,
              border: `1px solid ${tempoDesign.colors.border}`,
              background: 'transparent',
              color: tempoDesign.colors.foreground,
              'font-size': tempoDesign.typography.sizes.sm,
              'font-weight': '500',
              cursor: 'pointer',
            }}
          >
            <Upload size={16} />
            Import
          </button>

          {/* Plan session button */}
          <button
            type="button"
            onClick={() => setShowPlanSession(true)}
            disabled={stats().total === 0}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '6px',
              padding: '8px 14px',
              'border-radius': tempoDesign.radius.md,
              border: 'none',
              background: tempoDesign.colors.primary,
              color: tempoDesign.colors.primaryForeground,
              'font-size': tempoDesign.typography.sizes.sm,
              'font-weight': '500',
              cursor: stats().total === 0 ? 'not-allowed' : 'pointer',
              opacity: stats().total === 0 ? 0.5 : 1,
            }}
          >
            <CalendarBlank size={16} />
            Plan Session
          </button>
        </div>
      </div>

      {/* Quick add */}
      <QuickAddTask
        onAdd={handleAddTask}
        defaultDuration={QueueService.getSettings().defaultDuration}
      />

      {/* Loading state */}
      <Show when={isLoading()}>
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            padding: '48px',
          }}
        >
          <p
            style={{
              'font-size': tempoDesign.typography.sizes.sm,
              color: tempoDesign.colors.mutedForeground,
            }}
          >
            Loading queue...
          </p>
        </div>
      </Show>

      {/* Empty state */}
      <Show when={!isLoading() && stats().total === 0}>
        <div
          style={{
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            'justify-content': 'center',
            padding: '64px 24px',
            'text-align': 'center',
            background: tempoDesign.colors.card,
            'border-radius': tempoDesign.radius.xl,
            border: `1px solid ${tempoDesign.colors.cardBorder}`,
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              'border-radius': tempoDesign.radius.xl,
              background: tempoDesign.colors.muted,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'margin-bottom': '20px',
            }}
          >
            <Tray size={36} weight="duotone" color={tempoDesign.colors.mutedForeground} />
          </div>
          <h3
            style={{
              margin: '0 0 8px 0',
              'font-size': tempoDesign.typography.sizes.lg,
              'font-weight': tempoDesign.typography.weights.semibold,
              color: tempoDesign.colors.foreground,
            }}
          >
            Your queue is empty
          </h3>
          <p
            style={{
              margin: 0,
              'font-size': tempoDesign.typography.sizes.sm,
              color: tempoDesign.colors.mutedForeground,
              'max-width': '320px',
              'line-height': '1.5',
            }}
          >
            Add tasks using the form above, or import a list of tasks to get started.
          </p>
        </div>
      </Show>

      {/* Task list */}
      <Show when={!isLoading() && stats().total > 0}>
        <Show when={viewMode() === 'list'} fallback={renderKanbanView()}>
          {renderListView()}
        </Show>
      </Show>

      {/* Modals */}
      <BulkImportModal
        isOpen={showBulkImport()}
        onClose={() => setShowBulkImport(false)}
        onImport={handleBulkImport}
      />

      <PlanSessionPanel
        isOpen={showPlanSession()}
        onClose={() => setShowPlanSession(false)}
        onSessionCreated={() => {
          setShowPlanSession(false);
          loadTasks();
        }}
      />
    </div>
  );

  // =========================================================================
  // RENDER HELPERS
  // =========================================================================

  function renderListView() {
    return (
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '24px' }}>
        {/* Frog pond section */}
        <Show when={frogTasks().length > 0}>
          <div>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
                'margin-bottom': '12px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  'font-size': tempoDesign.typography.sizes.sm,
                  'font-weight': tempoDesign.typography.weights.semibold,
                  color: tempoDesign.colors.frog,
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.05em',
                }}
              >
                The Pond
              </h3>
              <span
                style={{
                  'font-size': tempoDesign.typography.sizes.xs,
                  color: tempoDesign.colors.mutedForeground,
                }}
              >
                {frogTasks().length} {frogTasks().length === 1 ? 'frog' : 'frogs'}
              </span>
            </div>

            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
              <For each={frogTasks()}>
                {(task) => (
                  <FrogTaskCard
                    task={task}
                    onSchedule={handleScheduleTask}
                    onDiscard={handleDiscardTask}
                    onEdit={handleEditTask}
                    onPriorityChange={handlePriorityChange}
                    onToggleFrog={handleToggleFrog}
                    isDragging={draggedTaskId() === task.id}
                    onDragStart={() => setDraggedTaskId(task.id)}
                    onDragEnd={() => setDraggedTaskId(null)}
                  />
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Regular tasks by priority */}
        <For each={PRIORITY_ORDER}>
          {(priority) => {
            const priorityTasks = () => regularTasks().filter((t) => t.priority === priority);

            return (
              <Show when={priorityTasks().length > 0}>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '8px',
                      'margin-bottom': '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        'border-radius': '50%',
                        background: PRIORITY_CONFIG[priority].color,
                      }}
                    />
                    <h3
                      style={{
                        margin: 0,
                        'font-size': tempoDesign.typography.sizes.sm,
                        'font-weight': tempoDesign.typography.weights.semibold,
                        color: tempoDesign.colors.foreground,
                        'text-transform': 'uppercase',
                        'letter-spacing': '0.05em',
                      }}
                    >
                      {PRIORITY_CONFIG[priority].label}
                    </h3>
                    <span
                      style={{
                        'font-size': tempoDesign.typography.sizes.xs,
                        color: tempoDesign.colors.mutedForeground,
                      }}
                    >
                      {priorityTasks().length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
                    <For each={priorityTasks()}>
                      {(task) => (
                        <QueueTaskCard
                          task={task}
                          onSchedule={handleScheduleTask}
                          onDiscard={handleDiscardTask}
                          onEdit={handleEditTask}
                          onPriorityChange={handlePriorityChange}
                          onToggleFrog={handleToggleFrog}
                          isDragging={draggedTaskId() === task.id}
                          onDragStart={() => setDraggedTaskId(task.id)}
                          onDragEnd={() => setDraggedTaskId(null)}
                        />
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            );
          }}
        </For>
      </div>
    );
  }

  function renderKanbanView() {
    return (
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(4, 1fr)',
          gap: '16px',
          'min-height': '400px',
        }}
      >
        <For each={PRIORITY_ORDER}>
          {(priority) => (
            <div
              style={{
                display: 'flex',
                'flex-direction': 'column',
                background: tempoDesign.colors.muted,
                'border-radius': tempoDesign.radius.lg,
                padding: '12px',
                'min-height': '300px',
              }}
            >
              {/* Column header */}
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '8px',
                  'padding-bottom': '12px',
                  'margin-bottom': '12px',
                  'border-bottom': `1px solid ${tempoDesign.colors.border}`,
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    'border-radius': '50%',
                    background: PRIORITY_CONFIG[priority].color,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    'font-size': tempoDesign.typography.sizes.sm,
                    'font-weight': tempoDesign.typography.weights.semibold,
                    color: tempoDesign.colors.foreground,
                  }}
                >
                  {PRIORITY_CONFIG[priority].label}
                </span>
                <span
                  style={{
                    'font-size': tempoDesign.typography.sizes.xs,
                    color: tempoDesign.colors.mutedForeground,
                    padding: '2px 8px',
                    'border-radius': tempoDesign.radius.full,
                    background: tempoDesign.colors.secondary,
                  }}
                >
                  {tasksByPriority()[priority].length}
                </span>
              </div>

              {/* Tasks */}
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px', flex: 1 }}>
                <For each={tasksByPriority()[priority]}>
                  {(task) =>
                    task.isFrog ? (
                      <FrogTaskCard
                        task={task}
                        onSchedule={handleScheduleTask}
                        onDiscard={handleDiscardTask}
                        onEdit={handleEditTask}
                        onPriorityChange={handlePriorityChange}
                        onToggleFrog={handleToggleFrog}
                        isDragging={draggedTaskId() === task.id}
                        onDragStart={() => setDraggedTaskId(task.id)}
                        onDragEnd={() => setDraggedTaskId(null)}
                      />
                    ) : (
                      <QueueTaskCard
                        task={task}
                        onSchedule={handleScheduleTask}
                        onDiscard={handleDiscardTask}
                        onEdit={handleEditTask}
                        onPriorityChange={handlePriorityChange}
                        onToggleFrog={handleToggleFrog}
                        isDragging={draggedTaskId() === task.id}
                        onDragStart={() => setDraggedTaskId(task.id)}
                        onDragEnd={() => setDraggedTaskId(null)}
                      />
                    )
                  }
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    );
  }
};
