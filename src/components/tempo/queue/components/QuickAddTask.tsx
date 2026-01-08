/**
 * QuickAddTask - Inline task creation form
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { Plus, Clock, CalendarBlank, CaretDown } from 'phosphor-solid';
import { tempoDesign } from '../../theme/tempo-design';
import type { TaskPriority } from '../../lib/types';
import { PRIORITY_CONFIG, PRIORITY_ORDER } from '../types';

interface QuickAddTaskProps {
  onAdd: (task: {
    title: string;
    duration: number;
    priority: TaskPriority;
    isFrog: boolean;
    dueDate?: string;
  }) => Promise<void>;
  defaultDuration?: number;
}

export const QuickAddTask: Component<QuickAddTaskProps> = (props) => {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const [title, setTitle] = createSignal('');
  const [duration, setDuration] = createSignal(props.defaultDuration || 25);
  const [priority, setPriority] = createSignal<TaskPriority>('medium');
  const [isFrog, setIsFrog] = createSignal(false);
  const [dueDate, setDueDate] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = createSignal(false);

  const resetForm = () => {
    setTitle('');
    setDuration(props.defaultDuration || 25);
    setPriority('medium');
    setIsFrog(false);
    setDueDate('');
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!title().trim() || isSubmitting()) return;

    setIsSubmitting(true);
    try {
      await props.onAdd({
        title: title().trim(),
        duration: duration(),
        priority: priority(),
        isFrog: isFrog(),
        dueDate: dueDate() || undefined,
      });
      resetForm();
      // Keep form expanded for quick consecutive adds
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
      resetForm();
    }
  };

  return (
    <div
      style={{
        background: tempoDesign.colors.card,
        'border-radius': tempoDesign.radius.lg,
        border: `1px solid ${tempoDesign.colors.cardBorder}`,
        overflow: 'hidden',
      }}
    >
      <Show
        when={isExpanded()}
        fallback={
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              width: '100%',
              padding: '14px 16px',
              background: 'transparent',
              border: 'none',
              color: tempoDesign.colors.mutedForeground,
              'font-size': tempoDesign.typography.sizes.sm,
              cursor: 'pointer',
              transition: `all ${tempoDesign.transitions.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = tempoDesign.colors.secondary;
              e.currentTarget.style.color = tempoDesign.colors.foreground;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = tempoDesign.colors.mutedForeground;
            }}
          >
            <Plus size={18} weight="bold" />
            Add task...
          </button>
        }
      >
        <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
          {/* Title input */}
          <input
            type="text"
            placeholder="What needs to be done?"
            value={title()}
            onInput={(e) => setTitle(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting()}
            autofocus
            style={{
              width: '100%',
              padding: '10px 12px',
              'border-radius': tempoDesign.radius.md,
              border: `1px solid ${tempoDesign.colors.input}`,
              background: tempoDesign.colors.background,
              color: tempoDesign.colors.foreground,
              'font-size': tempoDesign.typography.sizes.sm,
              'font-family': tempoDesign.typography.fontFamily,
              outline: 'none',
              'margin-bottom': '12px',
            }}
          />

          {/* Options row */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '12px',
              'flex-wrap': 'wrap',
              'margin-bottom': '12px',
            }}
          >
            {/* Duration */}
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '6px',
              }}
            >
              <Clock size={14} color={tempoDesign.colors.mutedForeground} />
              <input
                type="number"
                min="1"
                max="480"
                value={duration()}
                onInput={(e) => setDuration(parseInt(e.currentTarget.value) || 25)}
                disabled={isSubmitting()}
                style={{
                  width: '60px',
                  padding: '6px 8px',
                  'border-radius': tempoDesign.radius.sm,
                  border: `1px solid ${tempoDesign.colors.input}`,
                  background: tempoDesign.colors.background,
                  color: tempoDesign.colors.foreground,
                  'font-size': tempoDesign.typography.sizes.xs,
                  'font-family': tempoDesign.typography.fontFamily,
                  outline: 'none',
                  'text-align': 'center',
                }}
              />
              <span
                style={{
                  'font-size': tempoDesign.typography.sizes.xs,
                  color: tempoDesign.colors.mutedForeground,
                }}
              >
                min
              </span>
            </div>

            {/* Priority dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowPriorityDropdown(!showPriorityDropdown())}
                disabled={isSubmitting()}
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  'border-radius': tempoDesign.radius.sm,
                  border: `1px solid ${tempoDesign.colors.input}`,
                  background: PRIORITY_CONFIG[priority()].bg,
                  color: PRIORITY_CONFIG[priority()].color,
                  'font-size': tempoDesign.typography.sizes.xs,
                  'font-weight': '500',
                  cursor: 'pointer',
                }}
              >
                {PRIORITY_CONFIG[priority()].label}
                <CaretDown size={12} />
              </button>

              <Show when={showPriorityDropdown()}>
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    'margin-top': '4px',
                    background: tempoDesign.colors.card,
                    border: `1px solid ${tempoDesign.colors.border}`,
                    'border-radius': tempoDesign.radius.md,
                    'box-shadow': tempoDesign.shadows.lg,
                    'z-index': 10,
                    'min-width': '100px',
                    overflow: 'hidden',
                  }}
                >
                  {PRIORITY_ORDER.map((p) => (
                    <button
                      type="button"
                      onClick={() => {
                        setPriority(p);
                        setShowPriorityDropdown(false);
                      }}
                      style={{
                        display: 'flex',
                        'align-items': 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '8px 12px',
                        background: priority() === p ? tempoDesign.colors.secondary : 'transparent',
                        border: 'none',
                        color: PRIORITY_CONFIG[p].color,
                        'font-size': tempoDesign.typography.sizes.xs,
                        'font-weight': '500',
                        cursor: 'pointer',
                        'text-align': 'left',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = tempoDesign.colors.secondary)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          priority() === p ? tempoDesign.colors.secondary : 'transparent')
                      }
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          'border-radius': '50%',
                          background: PRIORITY_CONFIG[p].color,
                        }}
                      />
                      {PRIORITY_CONFIG[p].label}
                    </button>
                  ))}
                </div>
              </Show>
            </div>

            {/* Due date */}
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '6px',
              }}
            >
              <CalendarBlank size={14} color={tempoDesign.colors.mutedForeground} />
              <input
                type="date"
                value={dueDate()}
                onInput={(e) => setDueDate(e.currentTarget.value)}
                disabled={isSubmitting()}
                style={{
                  padding: '6px 8px',
                  'border-radius': tempoDesign.radius.sm,
                  border: `1px solid ${tempoDesign.colors.input}`,
                  background: tempoDesign.colors.background,
                  color: dueDate()
                    ? tempoDesign.colors.foreground
                    : tempoDesign.colors.mutedForeground,
                  'font-size': tempoDesign.typography.sizes.xs,
                  'font-family': tempoDesign.typography.fontFamily,
                  outline: 'none',
                }}
              />
            </div>

            {/* Frog toggle */}
            <label
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '6px',
                cursor: 'pointer',
                'font-size': tempoDesign.typography.sizes.xs,
                color: isFrog() ? tempoDesign.colors.frog : tempoDesign.colors.mutedForeground,
                'font-weight': isFrog() ? '600' : '400',
              }}
            >
              <input
                type="checkbox"
                checked={isFrog()}
                onChange={(e) => setIsFrog(e.currentTarget.checked)}
                disabled={isSubmitting()}
                style={{
                  width: '14px',
                  height: '14px',
                  cursor: 'pointer',
                  'accent-color': tempoDesign.colors.frog,
                }}
              />
              Frog
            </label>
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
            }}
          >
            <button
              type="submit"
              disabled={!title().trim() || isSubmitting()}
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                gap: '6px',
                padding: '8px 16px',
                'border-radius': tempoDesign.radius.md,
                border: 'none',
                background: tempoDesign.colors.primary,
                color: tempoDesign.colors.primaryForeground,
                'font-size': tempoDesign.typography.sizes.sm,
                'font-weight': '500',
                cursor: !title().trim() || isSubmitting() ? 'not-allowed' : 'pointer',
                opacity: !title().trim() || isSubmitting() ? 0.5 : 1,
                transition: `all ${tempoDesign.transitions.fast}`,
              }}
            >
              <Plus size={16} weight="bold" />
              {isSubmitting() ? 'Adding...' : 'Add Task'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                resetForm();
              }}
              disabled={isSubmitting()}
              style={{
                padding: '8px 16px',
                'border-radius': tempoDesign.radius.md,
                border: `1px solid ${tempoDesign.colors.border}`,
                background: 'transparent',
                color: tempoDesign.colors.mutedForeground,
                'font-size': tempoDesign.typography.sizes.sm,
                cursor: 'pointer',
                transition: `all ${tempoDesign.transitions.fast}`,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Show>
    </div>
  );
};
