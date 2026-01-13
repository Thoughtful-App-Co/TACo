/**
 * QueuePickerModal - Modal for selecting tasks from The Queue to add to a session
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createEffect, createMemo, For, Show, onMount } from 'solid-js';
import { X, Clock, Tray } from 'phosphor-solid';
import { tempoDesign } from '../../theme/tempo-design';
import { NeoCheckbox } from '../../ui/neo-checkbox';
import { logger } from '../../../../lib/logger';
import { type QueueTask, PRIORITY_CONFIG, formatDuration } from '../types';
import { QueueService } from '../services/queue.service';

const log = logger.create('QueuePickerModal');

interface QueuePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tasks: QueueTask[]) => void;
  /** Tasks already in the session (to exclude from selection) */
  excludeTaskIds?: string[];
}

export const QueuePickerModal: Component<QueuePickerModalProps> = (props) => {
  const [tasks, setTasks] = createSignal<QueueTask[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [selectedIds, setSelectedIds] = createSignal<Set<string>>(new Set());

  // Load tasks when modal opens
  createEffect(async () => {
    if (props.isOpen) {
      setIsLoading(true);
      setSelectedIds(new Set<string>());
      try {
        const loaded = await QueueService.getBacklogTasks();
        // Filter out excluded tasks
        const excludeSet = new Set(props.excludeTaskIds || []);
        const available = loaded.filter((t) => !excludeSet.has(t.id));
        setTasks(available);
      } catch (error) {
        log.error('Failed to load queue tasks', error);
      } finally {
        setIsLoading(false);
      }
    }
  });

  // Separate frogs and regular tasks
  const frogTasks = createMemo(() => tasks().filter((t) => t.isFrog));
  const regularTasks = createMemo(() => tasks().filter((t) => !t.isFrog));

  // Selected tasks
  const selectedTasks = createMemo(() => tasks().filter((t) => selectedIds().has(t.id)));

  const selectedDuration = createMemo(() =>
    selectedTasks().reduce((sum, t) => sum + t.duration, 0)
  );

  const toggleTask = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = selectedTasks();
    if (selected.length > 0) {
      props.onSelect(selected);
    }
    props.onClose();
  };

  return (
    <Show when={props.isOpen}>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          'z-index': 50,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          padding: '24px',
        }}
        onClick={props.onClose}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            'max-width': '520px',
            'max-height': '80vh',
            background: tempoDesign.colors.card,
            'border-radius': tempoDesign.radius.xl,
            border: `1px solid ${tempoDesign.colors.cardBorder}`,
            'box-shadow': tempoDesign.shadows.lg,
            display: 'flex',
            'flex-direction': 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
              padding: '20px 24px',
              'border-bottom': `1px solid ${tempoDesign.colors.border}`,
              'flex-shrink': 0,
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  'border-radius': tempoDesign.radius.lg,
                  background: `${tempoDesign.colors.primary}15`,
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                }}
              >
                <Tray size={20} color={tempoDesign.colors.primary} />
              </div>
              <div>
                <h2
                  style={{
                    margin: 0,
                    'font-size': tempoDesign.typography.sizes.lg,
                    'font-weight': tempoDesign.typography.weights.semibold,
                    color: tempoDesign.colors.foreground,
                  }}
                >
                  Pull from Queue
                </h2>
                <p
                  style={{
                    margin: 0,
                    'font-size': tempoDesign.typography.sizes.xs,
                    color: tempoDesign.colors.mutedForeground,
                  }}
                >
                  Select tasks to add to your session
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={props.onClose}
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                width: '36px',
                height: '36px',
                'border-radius': tempoDesign.radius.full,
                border: 'none',
                background: 'transparent',
                color: tempoDesign.colors.mutedForeground,
                cursor: 'pointer',
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              'overflow-y': 'auto',
              padding: '16px 24px',
            }}
          >
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
            <Show when={!isLoading() && tasks().length === 0}>
              <div
                style={{
                  display: 'flex',
                  'flex-direction': 'column',
                  'align-items': 'center',
                  'justify-content': 'center',
                  padding: '48px 24px',
                  'text-align': 'center',
                }}
              >
                <Tray
                  size={48}
                  weight="duotone"
                  color={tempoDesign.colors.mutedForeground}
                  style={{ 'margin-bottom': '16px' }}
                />
                <h3
                  style={{
                    margin: '0 0 8px 0',
                    'font-size': tempoDesign.typography.sizes.md,
                    'font-weight': tempoDesign.typography.weights.medium,
                    color: tempoDesign.colors.foreground,
                  }}
                >
                  Queue is empty
                </h3>
                <p
                  style={{
                    margin: 0,
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.mutedForeground,
                  }}
                >
                  Add tasks to The Queue first
                </p>
              </div>
            </Show>

            {/* Task list */}
            <Show when={!isLoading() && tasks().length > 0}>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
                {/* Frogs section */}
                <Show when={frogTasks().length > 0}>
                  <div>
                    <h4
                      style={{
                        margin: '0 0 8px 0',
                        'font-size': tempoDesign.typography.sizes.xs,
                        'font-weight': tempoDesign.typography.weights.semibold,
                        color: tempoDesign.colors.frog,
                        'text-transform': 'uppercase',
                        'letter-spacing': '0.05em',
                      }}
                    >
                      Frogs ({frogTasks().length})
                    </h4>
                    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
                      <For each={frogTasks()}>
                        {(task) => (
                          <TaskRow
                            task={task}
                            isSelected={selectedIds().has(task.id)}
                            onToggle={() => toggleTask(task.id)}
                          />
                        )}
                      </For>
                    </div>
                  </div>
                </Show>

                {/* Regular tasks */}
                <Show when={regularTasks().length > 0}>
                  <div>
                    <h4
                      style={{
                        margin: '0 0 8px 0',
                        'font-size': tempoDesign.typography.sizes.xs,
                        'font-weight': tempoDesign.typography.weights.semibold,
                        color: tempoDesign.colors.mutedForeground,
                        'text-transform': 'uppercase',
                        'letter-spacing': '0.05em',
                      }}
                    >
                      Tasks ({regularTasks().length})
                    </h4>
                    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
                      <For each={regularTasks()}>
                        {(task) => (
                          <TaskRow
                            task={task}
                            isSelected={selectedIds().has(task.id)}
                            onToggle={() => toggleTask(task.id)}
                          />
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
              </div>
            </Show>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
              padding: '16px 24px',
              'border-top': `1px solid ${tempoDesign.colors.border}`,
              background: tempoDesign.colors.muted,
              'flex-shrink': 0,
            }}
          >
            <span
              style={{
                'font-size': tempoDesign.typography.sizes.sm,
                color: tempoDesign.colors.mutedForeground,
              }}
            >
              {selectedIds().size} selected
              <Show when={selectedIds().size > 0}> ({formatDuration(selectedDuration())})</Show>
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={props.onClose}
                style={{
                  padding: '10px 16px',
                  'border-radius': tempoDesign.radius.md,
                  border: `1px solid ${tempoDesign.colors.border}`,
                  background: 'transparent',
                  color: tempoDesign.colors.foreground,
                  'font-size': tempoDesign.typography.sizes.sm,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selectedIds().size === 0}
                style={{
                  padding: '10px 16px',
                  'border-radius': tempoDesign.radius.md,
                  border: 'none',
                  background: tempoDesign.colors.primary,
                  color: tempoDesign.colors.primaryForeground,
                  'font-size': tempoDesign.typography.sizes.sm,
                  'font-weight': '500',
                  cursor: selectedIds().size === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedIds().size === 0 ? 0.5 : 1,
                }}
              >
                Add to Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};

// Task row component
interface TaskRowProps {
  task: QueueTask;
  isSelected: boolean;
  onToggle: () => void;
}

const TaskRow: Component<TaskRowProps> = (props) => {
  const priorityConfig = () => PRIORITY_CONFIG[props.task.priority];

  return (
    <div
      onClick={props.onToggle}
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '12px',
        padding: '10px 12px',
        'border-radius': tempoDesign.radius.md,
        background: props.isSelected ? tempoDesign.colors.secondary : tempoDesign.colors.card,
        border: `1px solid ${
          props.isSelected ? tempoDesign.colors.primary : tempoDesign.colors.cardBorder
        }`,
        cursor: 'pointer',
        transition: `all ${tempoDesign.transitions.fast}`,
      }}
    >
      {/* Checkbox */}
      <NeoCheckbox
        checked={props.isSelected}
        onChange={() => {}} // Row click handles toggle
        size="md"
        variant="primary"
      />

      {/* Priority indicator */}
      <div
        style={{
          width: '8px',
          height: '8px',
          'border-radius': '50%',
          background: priorityConfig().color,
          'flex-shrink': 0,
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, 'min-width': 0 }}>
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '6px',
          }}
        >
          <Show when={props.task.isFrog}>
            <span
              style={{
                padding: '1px 5px',
                'border-radius': '4px',
                background: `${tempoDesign.colors.frog}20`,
                'font-size': '9px',
                'font-weight': '600',
                color: tempoDesign.colors.frog,
              }}
            >
              FROG
            </span>
          </Show>
          <span
            style={{
              'font-size': tempoDesign.typography.sizes.sm,
              color: tempoDesign.colors.foreground,
              'white-space': 'nowrap',
              overflow: 'hidden',
              'text-overflow': 'ellipsis',
            }}
          >
            {props.task.title}
          </span>
        </div>
      </div>

      {/* Duration */}
      <span
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: '4px',
          'font-size': tempoDesign.typography.sizes.xs,
          color: tempoDesign.colors.mutedForeground,
          'flex-shrink': 0,
        }}
      >
        <Clock size={12} />
        {formatDuration(props.task.duration)}
      </span>
    </div>
  );
};
