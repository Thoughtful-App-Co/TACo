/**
 * PlanSessionPanel - Slide-in panel for planning a session from queue tasks
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createEffect, createMemo, For, Show, onMount } from 'solid-js';
import { X, Clock, CalendarBlank, Lightning, Plus, Minus, Check, CaretDown } from 'phosphor-solid';
import { useNavigate } from '@solidjs/router';
import { tempoDesign } from '../../theme/tempo-design';
import { logger } from '../../../../lib/logger';
import {
  type QueueTask,
  type SuggestionStrategy,
  type SessionSuggestion,
  formatDuration,
  PRIORITY_CONFIG,
} from '../types';
import { QueueService } from '../services/queue.service';
import { SessionStorageService } from '../../services/session-storage.service';

const log = logger.create('PlanSessionPanel');

interface PlanSessionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: () => void;
}

const TIME_PRESETS = [
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: 'Half-day', minutes: 240 },
];

const DATE_PRESETS = [
  { label: 'Today', getValue: () => new Date().toISOString().split('T')[0] },
  {
    label: 'Tomorrow',
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    },
  },
];

const STRATEGY_OPTIONS: { value: SuggestionStrategy; label: string; description: string }[] = [
  { value: 'priority', label: 'Priority First', description: 'Frogs and urgent tasks first' },
  { value: 'quick-wins', label: 'Quick Wins', description: 'Shorter tasks first' },
  { value: 'due-date', label: 'Due Date', description: 'Closest deadlines first' },
  { value: 'balanced', label: 'Balanced', description: 'Mix of priority and duration' },
];

export const PlanSessionPanel: Component<PlanSessionPanelProps> = (props) => {
  const navigate = useNavigate();

  // Form state
  const [availableMinutes, setAvailableMinutes] = createSignal(60);
  const [customMinutes, setCustomMinutes] = createSignal('');
  const [targetDate, setTargetDate] = createSignal(new Date().toISOString().split('T')[0]);
  const [customDate, setCustomDate] = createSignal('');
  const [strategy, setStrategy] = createSignal<SuggestionStrategy>('priority');
  const [showStrategyPicker, setShowStrategyPicker] = createSignal(false);

  // Suggestion state
  const [suggestion, setSuggestion] = createSignal<SessionSuggestion | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = createSignal<Set<string>>(new Set());
  const [isLoading, setIsLoading] = createSignal(false);
  const [isCreating, setIsCreating] = createSignal(false);

  // Check if user has set strategy preference
  const [needsStrategyPrompt, setNeedsStrategyPrompt] = createSignal(false);

  onMount(() => {
    if (!QueueService.hasSetStrategy()) {
      setNeedsStrategyPrompt(true);
    } else {
      const settings = QueueService.getSettings();
      setStrategy(settings.suggestionStrategy);
    }
  });

  // Load suggestions when params change
  createEffect(async () => {
    if (!props.isOpen) return;

    setIsLoading(true);
    try {
      const result = await QueueService.suggestTasksForSession(availableMinutes(), strategy());
      setSuggestion(result);
      // Auto-select all suggested tasks
      setSelectedTaskIds(new Set(result.tasks.map((t) => t.id)));
    } catch (error) {
      log.error('Failed to load suggestions', error);
    } finally {
      setIsLoading(false);
    }
  });

  // Selected tasks details
  const selectedTasks = createMemo(() => {
    if (!suggestion()) return [];
    return suggestion()!.tasks.filter((t) => selectedTaskIds().has(t.id));
  });

  const selectedDuration = createMemo(() =>
    selectedTasks().reduce((sum, t) => sum + t.duration, 0)
  );

  const utilizationPercent = createMemo(() =>
    Math.round((selectedDuration() / availableMinutes()) * 100)
  );

  // Handlers
  const handleTimePreset = (minutes: number) => {
    setAvailableMinutes(minutes);
    setCustomMinutes('');
  };

  const handleCustomMinutes = (value: string) => {
    setCustomMinutes(value);
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed > 0) {
      setAvailableMinutes(parsed);
    }
  };

  const handleDatePreset = (getValue: () => string) => {
    setTargetDate(getValue());
    setCustomDate('');
  };

  const handleCustomDate = (value: string) => {
    setCustomDate(value);
    if (value) {
      setTargetDate(value);
    }
  };

  const handleStrategySelect = (value: SuggestionStrategy) => {
    setStrategy(value);
    QueueService.saveSettings({ suggestionStrategy: value });
    setShowStrategyPicker(false);
    setNeedsStrategyPrompt(false);
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleCreateSession = async () => {
    if (selectedTasks().length === 0 || isCreating()) return;

    setIsCreating(true);
    try {
      // Create session with selected tasks
      const storageService = new SessionStorageService();

      // Build story blocks from selected tasks
      const storyBlocks = selectedTasks().map((task) => ({
        id: task.id,
        title: task.title,
        timeBoxes: [
          {
            type: 'work' as const,
            duration: task.duration,
            tasks: [
              {
                title: task.title,
                duration: task.duration,
                isFrog: task.isFrog,
              },
            ],
            status: 'todo' as const,
          },
        ],
        totalDuration: task.duration,
        progress: 0,
        taskIds: [task.id],
      }));

      // Save session
      const session = {
        date: targetDate(),
        storyBlocks,
        status: 'planned' as const,
        totalDuration: selectedDuration(),
        lastUpdated: new Date().toISOString(),
      };
      await storageService.saveSession(targetDate(), session);

      // Schedule the tasks
      for (const task of selectedTasks()) {
        await QueueService.scheduleTask(task.id, targetDate());
      }

      log.info(`Created session for ${targetDate()} with ${selectedTasks().length} tasks`);
      props.onSessionCreated();

      // Navigate to the session
      navigate(`/tempo/sessions/${targetDate()}`);
    } catch (error) {
      log.error('Failed to create session', error);
    } finally {
      setIsCreating(false);
    }
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
          background: 'rgba(0, 0, 0, 0.5)',
          'z-index': 50,
        }}
        onClick={props.onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          'max-width': '420px',
          'z-index': 51,
          background: tempoDesign.colors.background,
          'box-shadow': '-4px 0 24px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          'flex-direction': 'column',
          animation: 'slideInFromRight 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>
          {`
            @keyframes slideInFromRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}
        </style>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
            padding: '20px 24px',
            'border-bottom': `1px solid ${tempoDesign.colors.border}`,
          }}
        >
          <h2
            style={{
              margin: 0,
              'font-size': tempoDesign.typography.sizes.xl,
              'font-weight': tempoDesign.typography.weights.semibold,
              color: tempoDesign.colors.foreground,
            }}
          >
            Plan Your Session
          </h2>
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
        <div style={{ flex: 1, 'overflow-y': 'auto', padding: '24px' }}>
          {/* Strategy prompt (first time) */}
          <Show when={needsStrategyPrompt()}>
            <div
              style={{
                padding: '16px',
                'border-radius': tempoDesign.radius.lg,
                background: `${tempoDesign.colors.primary}10`,
                border: `1px solid ${tempoDesign.colors.primary}30`,
                'margin-bottom': '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '8px',
                  'margin-bottom': '12px',
                }}
              >
                <Lightning size={18} color={tempoDesign.colors.primary} />
                <span
                  style={{
                    'font-size': tempoDesign.typography.sizes.sm,
                    'font-weight': '600',
                    color: tempoDesign.colors.foreground,
                  }}
                >
                  How should we suggest tasks?
                </span>
              </div>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
                <For each={STRATEGY_OPTIONS}>
                  {(option) => (
                    <button
                      type="button"
                      onClick={() => handleStrategySelect(option.value)}
                      style={{
                        display: 'flex',
                        'flex-direction': 'column',
                        'align-items': 'flex-start',
                        gap: '2px',
                        padding: '12px',
                        'border-radius': tempoDesign.radius.md,
                        border: `1px solid ${tempoDesign.colors.border}`,
                        background: tempoDesign.colors.card,
                        cursor: 'pointer',
                        'text-align': 'left',
                      }}
                    >
                      <span
                        style={{
                          'font-size': tempoDesign.typography.sizes.sm,
                          'font-weight': '500',
                          color: tempoDesign.colors.foreground,
                        }}
                      >
                        {option.label}
                      </span>
                      <span
                        style={{
                          'font-size': tempoDesign.typography.sizes.xs,
                          color: tempoDesign.colors.mutedForeground,
                        }}
                      >
                        {option.description}
                      </span>
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Time selection */}
          <div style={{ 'margin-bottom': '24px' }}>
            <label
              style={{
                display: 'block',
                'font-size': tempoDesign.typography.sizes.sm,
                'font-weight': '500',
                color: tempoDesign.colors.foreground,
                'margin-bottom': '8px',
              }}
            >
              <Clock size={14} style={{ 'margin-right': '6px', 'vertical-align': 'middle' }} />
              How much time do you have?
            </label>
            <div style={{ display: 'flex', gap: '8px', 'flex-wrap': 'wrap' }}>
              <For each={TIME_PRESETS}>
                {(preset) => (
                  <button
                    type="button"
                    onClick={() => handleTimePreset(preset.minutes)}
                    style={{
                      padding: '8px 14px',
                      'border-radius': tempoDesign.radius.md,
                      border: `1px solid ${
                        availableMinutes() === preset.minutes && !customMinutes()
                          ? tempoDesign.colors.primary
                          : tempoDesign.colors.border
                      }`,
                      background:
                        availableMinutes() === preset.minutes && !customMinutes()
                          ? `${tempoDesign.colors.primary}15`
                          : 'transparent',
                      color:
                        availableMinutes() === preset.minutes && !customMinutes()
                          ? tempoDesign.colors.primary
                          : tempoDesign.colors.foreground,
                      'font-size': tempoDesign.typography.sizes.sm,
                      'font-weight': '500',
                      cursor: 'pointer',
                    }}
                  >
                    {preset.label}
                  </button>
                )}
              </For>
              <input
                type="number"
                placeholder="Custom"
                value={customMinutes()}
                onInput={(e) => handleCustomMinutes(e.currentTarget.value)}
                style={{
                  width: '80px',
                  padding: '8px 12px',
                  'border-radius': tempoDesign.radius.md,
                  border: `1px solid ${customMinutes() ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                  background: customMinutes() ? `${tempoDesign.colors.primary}15` : 'transparent',
                  color: tempoDesign.colors.foreground,
                  'font-size': tempoDesign.typography.sizes.sm,
                  'text-align': 'center',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Date selection */}
          <div style={{ 'margin-bottom': '24px' }}>
            <label
              style={{
                display: 'block',
                'font-size': tempoDesign.typography.sizes.sm,
                'font-weight': '500',
                color: tempoDesign.colors.foreground,
                'margin-bottom': '8px',
              }}
            >
              <CalendarBlank
                size={14}
                style={{ 'margin-right': '6px', 'vertical-align': 'middle' }}
              />
              When?
            </label>
            <div style={{ display: 'flex', gap: '8px', 'flex-wrap': 'wrap' }}>
              <For each={DATE_PRESETS}>
                {(preset) => (
                  <button
                    type="button"
                    onClick={() => handleDatePreset(preset.getValue)}
                    style={{
                      padding: '8px 14px',
                      'border-radius': tempoDesign.radius.md,
                      border: `1px solid ${
                        targetDate() === preset.getValue() && !customDate()
                          ? tempoDesign.colors.primary
                          : tempoDesign.colors.border
                      }`,
                      background:
                        targetDate() === preset.getValue() && !customDate()
                          ? `${tempoDesign.colors.primary}15`
                          : 'transparent',
                      color:
                        targetDate() === preset.getValue() && !customDate()
                          ? tempoDesign.colors.primary
                          : tempoDesign.colors.foreground,
                      'font-size': tempoDesign.typography.sizes.sm,
                      'font-weight': '500',
                      cursor: 'pointer',
                    }}
                  >
                    {preset.label}
                  </button>
                )}
              </For>
              <input
                type="date"
                value={customDate()}
                onInput={(e) => handleCustomDate(e.currentTarget.value)}
                style={{
                  padding: '8px 12px',
                  'border-radius': tempoDesign.radius.md,
                  border: `1px solid ${customDate() ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                  background: customDate() ? `${tempoDesign.colors.primary}15` : 'transparent',
                  color: tempoDesign.colors.foreground,
                  'font-size': tempoDesign.typography.sizes.sm,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: '1px',
              background: tempoDesign.colors.border,
              'margin-bottom': '24px',
            }}
          />

          {/* Suggested tasks */}
          <div>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
                'margin-bottom': '12px',
              }}
            >
              <span
                style={{
                  'font-size': tempoDesign.typography.sizes.sm,
                  'font-weight': '500',
                  color: tempoDesign.colors.foreground,
                }}
              >
                Suggested Tasks
              </span>
              <span
                style={{
                  'font-size': tempoDesign.typography.sizes.xs,
                  color:
                    utilizationPercent() > 100
                      ? tempoDesign.colors.destructive
                      : tempoDesign.colors.mutedForeground,
                }}
              >
                {formatDuration(selectedDuration())} of {formatDuration(availableMinutes())} (
                {utilizationPercent()}%)
              </span>
            </div>

            <Show when={isLoading()}>
              <p
                style={{
                  'font-size': tempoDesign.typography.sizes.sm,
                  color: tempoDesign.colors.mutedForeground,
                  padding: '24px',
                  'text-align': 'center',
                }}
              >
                Loading suggestions...
              </p>
            </Show>

            <Show when={!isLoading() && suggestion()}>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
                <For each={suggestion()!.tasks}>
                  {(task) => (
                    <div
                      onClick={() => toggleTaskSelection(task.id)}
                      style={{
                        display: 'flex',
                        'align-items': 'center',
                        gap: '12px',
                        padding: '12px',
                        'border-radius': tempoDesign.radius.md,
                        background: selectedTaskIds().has(task.id)
                          ? tempoDesign.colors.secondary
                          : tempoDesign.colors.card,
                        border: `1px solid ${
                          selectedTaskIds().has(task.id)
                            ? tempoDesign.colors.primary
                            : tempoDesign.colors.cardBorder
                        }`,
                        cursor: 'pointer',
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          'border-radius': tempoDesign.radius.sm,
                          border: `2px solid ${
                            selectedTaskIds().has(task.id)
                              ? tempoDesign.colors.primary
                              : tempoDesign.colors.border
                          }`,
                          background: selectedTaskIds().has(task.id)
                            ? tempoDesign.colors.primary
                            : 'transparent',
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                          'flex-shrink': 0,
                        }}
                      >
                        <Show when={selectedTaskIds().has(task.id)}>
                          <Check size={12} color="white" weight="bold" />
                        </Show>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, 'min-width': 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            'align-items': 'center',
                            gap: '6px',
                            'margin-bottom': '4px',
                          }}
                        >
                          <Show when={task.isFrog}>
                            <span
                              style={{
                                padding: '2px 6px',
                                'border-radius': '4px',
                                background: `${tempoDesign.colors.frog}20`,
                                'font-size': '10px',
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
                              'font-weight': '500',
                              color: tempoDesign.colors.foreground,
                              'white-space': 'nowrap',
                              overflow: 'hidden',
                              'text-overflow': 'ellipsis',
                            }}
                          >
                            {task.title}
                          </span>
                        </div>
                        <span
                          style={{
                            'font-size': tempoDesign.typography.sizes.xs,
                            color: tempoDesign.colors.mutedForeground,
                          }}
                        >
                          {formatDuration(task.duration)}
                        </span>
                      </div>
                    </div>
                  )}
                </For>

                <Show when={suggestion()!.tasks.length === 0}>
                  <p
                    style={{
                      'font-size': tempoDesign.typography.sizes.sm,
                      color: tempoDesign.colors.mutedForeground,
                      padding: '24px',
                      'text-align': 'center',
                    }}
                  >
                    No tasks match the available time
                  </p>
                </Show>
              </div>
            </Show>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            'border-top': `1px solid ${tempoDesign.colors.border}`,
            background: tempoDesign.colors.muted,
          }}
        >
          <button
            type="button"
            onClick={handleCreateSession}
            disabled={selectedTasks().length === 0 || isCreating()}
            style={{
              width: '100%',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              gap: '8px',
              padding: '12px 20px',
              'border-radius': tempoDesign.radius.md,
              border: 'none',
              background: tempoDesign.colors.primary,
              color: tempoDesign.colors.primaryForeground,
              'font-size': tempoDesign.typography.sizes.sm,
              'font-weight': '600',
              cursor: selectedTasks().length === 0 || isCreating() ? 'not-allowed' : 'pointer',
              opacity: selectedTasks().length === 0 || isCreating() ? 0.5 : 1,
            }}
          >
            {isCreating() ? 'Creating...' : `Create Session (${selectedTasks().length} tasks)`}
          </button>
        </div>
      </div>
    </Show>
  );
};
