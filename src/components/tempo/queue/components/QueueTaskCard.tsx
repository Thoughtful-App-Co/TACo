/**
 * QueueTaskCard - Regular task card for The Queue
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, createSignal, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Clock, CalendarBlank, Trash, DotsThree, Calendar } from 'phosphor-solid';
import { tempoDesign } from '../../theme/tempo-design';
import type { TaskPriority } from '../../lib/types';
import { type QueueTask, PRIORITY_CONFIG, formatDuration, formatDueDate } from '../types';

interface QueueTaskCardProps {
  task: QueueTask;
  onSchedule: (taskId: string, date: string) => void;
  onDiscard: (taskId: string) => void;
  onEdit: (task: QueueTask) => void;
  onPriorityChange: (taskId: string, priority: TaskPriority) => void;
  onToggleFrog: (taskId: string) => void;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const QueueTaskCard: Component<QueueTaskCardProps> = (props) => {
  const [showActions, setShowActions] = createSignal(false);
  const [isHovered, setIsHovered] = createSignal(false);
  const [dropdownPos, setDropdownPos] = createSignal({ x: 0, y: 0 });
  let actionsButtonRef: HTMLButtonElement | undefined;

  // Close dropdown on outside click
  const handleClickOutside = (e: MouseEvent) => {
    if (showActions() && actionsButtonRef && !actionsButtonRef.contains(e.target as Node)) {
      setShowActions(false);
    }
  };

  document.addEventListener('click', handleClickOutside);
  onCleanup(() => document.removeEventListener('click', handleClickOutside));

  const openActionsMenu = () => {
    if (actionsButtonRef) {
      const rect = actionsButtonRef.getBoundingClientRect();
      const menuWidth = 160;
      const menuHeight = 200; // Estimated dropdown height
      const offset = 4;
      const edgePadding = 10;

      let x = rect.right - menuWidth;
      let y = rect.bottom + offset;

      // If menu would go off bottom edge, flip to above button
      if (y + menuHeight > window.innerHeight - edgePadding) {
        y = rect.top - menuHeight - offset;
      }

      // Safety: ensure not off top edge
      if (y < edgePadding) {
        y = edgePadding;
      }

      setDropdownPos({ x, y });
    }
    setShowActions(true);
  };

  const priorityConfig = () => PRIORITY_CONFIG[props.task.priority];
  const dueInfo = () => (props.task.dueDate ? formatDueDate(props.task.dueDate) : null);

  const handleDragStart = (e: DragEvent) => {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData('text/plain', props.task.id);
    e.dataTransfer.effectAllowed = 'move';
    props.onDragStart?.();
  };

  const handleDragEnd = () => {
    props.onDragEnd?.();
  };

  const handleScheduleToday = () => {
    const today = new Date().toISOString().split('T')[0];
    props.onSchedule(props.task.id, today);
    setShowActions(false);
  };

  const handleScheduleTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    props.onSchedule(props.task.id, tomorrow.toISOString().split('T')[0]);
    setShowActions(false);
  };

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        // Don't close showActions here - the Portal renders outside the card,
        // so closing on mouse leave prevents users from reaching the dropdown menu.
        // The dropdown closes via handleClickOutside or when an action is clicked.
      }}
      onClick={() => props.onEdit(props.task)}
      style={{
        display: 'flex',
        'align-items': 'stretch',
        background: tempoDesign.colors.card,
        'border-radius': tempoDesign.radius.md,
        border: `1px solid ${tempoDesign.colors.cardBorder}`,
        overflow: 'hidden',
        cursor: 'grab',
        opacity: props.isDragging ? 0.5 : 1,
        transform: props.isDragging ? 'scale(0.98)' : isHovered() ? 'translateY(-1px)' : 'none',
        'box-shadow': isHovered() ? tempoDesign.shadows.md : tempoDesign.shadows.sm,
        transition: `all ${tempoDesign.transitions.fast}`,
      }}
    >
      {/* Priority indicator bar */}
      <div
        style={{
          width: '4px',
          'flex-shrink': 0,
          background: priorityConfig().color,
        }}
      />

      {/* Content - single row layout */}
      <div
        style={{
          flex: 1,
          padding: '8px 12px',
          display: 'flex',
          'align-items': 'center',
          gap: '12px',
          'min-width': 0,
        }}
      >
        {/* Title */}
        <span
          style={{
            flex: 1,
            'font-size': tempoDesign.typography.sizes.sm,
            'font-weight': tempoDesign.typography.weights.medium,
            color: tempoDesign.colors.foreground,
            'white-space': 'nowrap',
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
          }}
        >
          {props.task.title}
        </span>

        {/* Metadata */}
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
            'flex-shrink': 0,
          }}
        >
          {/* Duration */}
          <span
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '4px',
              'font-size': tempoDesign.typography.sizes.xs,
              color: tempoDesign.colors.mutedForeground,
            }}
          >
            <Clock size={12} />
            {formatDuration(props.task.duration)}
          </span>

          {/* Due date */}
          <Show when={dueInfo()}>
            <span
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '4px',
                'font-size': tempoDesign.typography.sizes.xs,
                color: dueInfo()!.isOverdue
                  ? tempoDesign.colors.destructive
                  : dueInfo()!.isDueSoon
                    ? tempoDesign.colors.amber[600]
                    : tempoDesign.colors.mutedForeground,
                'font-weight': dueInfo()!.isOverdue || dueInfo()!.isDueSoon ? '500' : '400',
              }}
            >
              <CalendarBlank size={12} />
              {dueInfo()!.text}
            </span>
          </Show>

          {/* Priority badge */}
          <span
            style={{
              padding: '2px 6px',
              'border-radius': tempoDesign.radius.sm,
              background: priorityConfig().bg,
              'font-size': '10px',
              'font-weight': '500',
              color: priorityConfig().color,
              'text-transform': 'uppercase',
              'letter-spacing': '0.025em',
            }}
          >
            {priorityConfig().label}
          </span>
        </div>

        {/* Actions menu button */}
        <div style={{ 'flex-shrink': 0 }}>
          <button
            ref={actionsButtonRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openActionsMenu();
            }}
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              width: '24px',
              height: '24px',
              'border-radius': tempoDesign.radius.sm,
              border: 'none',
              background: showActions() ? tempoDesign.colors.secondary : 'transparent',
              color: tempoDesign.colors.mutedForeground,
              cursor: 'pointer',
              opacity: isHovered() || showActions() ? 1 : 0,
              transition: `all ${tempoDesign.transitions.fast}`,
            }}
            aria-label="Task actions"
          >
            <DotsThree size={16} weight="bold" />
          </button>

          {/* Actions dropdown */}
          <Show when={showActions()}>
            <Portal>
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'fixed',
                  top: `${dropdownPos().y}px`,
                  left: `${dropdownPos().x}px`,
                  background: tempoDesign.colors.card,
                  border: `1px solid ${tempoDesign.colors.border}`,
                  'border-radius': tempoDesign.radius.md,
                  'box-shadow': tempoDesign.shadows.lg,
                  'z-index': '10000',
                  'min-width': '160px',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={handleScheduleToday}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: tempoDesign.colors.foreground,
                    'font-size': tempoDesign.typography.sizes.sm,
                    cursor: 'pointer',
                    'text-align': 'left',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = tempoDesign.colors.secondary)
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Calendar size={16} />
                  Schedule Today
                </button>
                <button
                  type="button"
                  onClick={handleScheduleTomorrow}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: tempoDesign.colors.foreground,
                    'font-size': tempoDesign.typography.sizes.sm,
                    cursor: 'pointer',
                    'text-align': 'left',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = tempoDesign.colors.secondary)
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <CalendarBlank size={16} />
                  Schedule Tomorrow
                </button>
                <div
                  style={{
                    height: '1px',
                    background: tempoDesign.colors.border,
                    margin: '4px 0',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    props.onToggleFrog(props.task.id);
                    setShowActions(false);
                  }}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: props.task.isFrog
                      ? tempoDesign.colors.frog
                      : tempoDesign.colors.foreground,
                    'font-size': tempoDesign.typography.sizes.sm,
                    cursor: 'pointer',
                    'text-align': 'left',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = tempoDesign.colors.secondary)
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {props.task.isFrog ? 'Remove Frog' : 'Mark as Frog'}
                </button>
                <div
                  style={{
                    height: '1px',
                    background: tempoDesign.colors.border,
                    margin: '4px 0',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    props.onDiscard(props.task.id);
                    setShowActions(false);
                  }}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    color: tempoDesign.colors.destructive,
                    'font-size': tempoDesign.typography.sizes.sm,
                    cursor: 'pointer',
                    'text-align': 'left',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = tempoDesign.colors.secondary)
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Trash size={16} />
                  Discard
                </button>
              </div>
            </Portal>
          </Show>
        </div>
      </div>
    </div>
  );
};
