/**
 * FrogTaskCard - Lily pad styled card for Frog (high priority) tasks
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, createSignal } from 'solid-js';
import { Clock, CalendarBlank, Trash, DotsThree, Calendar } from 'phosphor-solid';
import { tempoDesign } from '../../theme/tempo-design';
import type { TaskPriority } from '../../lib/types';
import {
  type QueueTask,
  PRIORITY_CONFIG,
  formatDuration,
  formatRelativeTime,
  formatDueDate,
} from '../types';

interface FrogTaskCardProps {
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

// Lily pad colors - subtle green gradient
const LILY_PAD = {
  bgGradient: 'linear-gradient(135deg, #1A2F1A 0%, #0F1F0F 100%)',
  border: 'rgba(16, 185, 129, 0.3)',
  borderHover: 'rgba(16, 185, 129, 0.5)',
  shadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
  shadowHover: '0 6px 16px rgba(16, 185, 129, 0.25)',
  accent: '#10B981',
  accentBg: 'rgba(16, 185, 129, 0.15)',
};

export const FrogTaskCard: Component<FrogTaskCardProps> = (props) => {
  const [showActions, setShowActions] = createSignal(false);
  const [isHovered, setIsHovered] = createSignal(false);

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
        setShowActions(false);
      }}
      onClick={() => props.onEdit(props.task)}
      style={{
        position: 'relative',
        background: LILY_PAD.bgGradient,
        'border-radius': '16px', // More organic, rounded shape
        border: `1px solid ${isHovered() ? LILY_PAD.borderHover : LILY_PAD.border}`,
        overflow: 'hidden',
        cursor: 'grab',
        opacity: props.isDragging ? 0.5 : 1,
        transform: props.isDragging ? 'scale(0.98)' : isHovered() ? 'translateY(-2px)' : 'none',
        'box-shadow': isHovered() ? LILY_PAD.shadowHover : LILY_PAD.shadow,
        transition: `all ${tempoDesign.transitions.fast}`,
      }}
    >
      {/* Subtle water ripple effect overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at 30% 20%, ${LILY_PAD.accent}08 0%, transparent 50%)`,
          'pointer-events': 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          padding: '14px 18px',
          display: 'flex',
          'flex-direction': 'column',
          gap: '10px',
        }}
      >
        {/* Title row */}
        <div
          style={{
            display: 'flex',
            'align-items': 'flex-start',
            gap: '10px',
          }}
        >
          {/* Frog badge */}
          <span
            style={{
              'flex-shrink': 0,
              padding: '3px 8px',
              'border-radius': '8px',
              background: LILY_PAD.accentBg,
              'font-size': '10px',
              'font-weight': '700',
              color: LILY_PAD.accent,
              'letter-spacing': '0.05em',
              'text-transform': 'uppercase',
            }}
          >
            FROG
          </span>

          <span
            style={{
              flex: 1,
              'font-size': tempoDesign.typography.sizes.sm,
              'font-weight': tempoDesign.typography.weights.semibold,
              color: tempoDesign.colors.foreground,
              'line-height': '1.4',
              'word-break': 'break-word',
            }}
          >
            {props.task.title}
          </span>

          {/* Actions menu button */}
          <div style={{ position: 'relative', 'flex-shrink': 0 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions());
              }}
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                width: '28px',
                height: '28px',
                'border-radius': tempoDesign.radius.sm,
                border: 'none',
                background: showActions() ? LILY_PAD.accentBg : 'transparent',
                color: LILY_PAD.accent,
                cursor: 'pointer',
                opacity: isHovered() || showActions() ? 1 : 0,
                transition: `all ${tempoDesign.transitions.fast}`,
              }}
              aria-label="Task actions"
            >
              <DotsThree size={18} weight="bold" />
            </button>

            {/* Actions dropdown */}
            <Show when={showActions()}>
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  'margin-top': '4px',
                  background: tempoDesign.colors.card,
                  border: `1px solid ${tempoDesign.colors.border}`,
                  'border-radius': tempoDesign.radius.md,
                  'box-shadow': tempoDesign.shadows.lg,
                  'z-index': 20,
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
                  Remove Frog
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
            </Show>
          </div>
        </div>

        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '12px',
            'flex-wrap': 'wrap',
          }}
        >
          {/* Duration */}
          <span
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '4px',
              'font-size': tempoDesign.typography.sizes.xs,
              color: LILY_PAD.accent,
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

          {/* Age */}
          <Show when={!dueInfo() && props.task.ageInDays && props.task.ageInDays > 0}>
            <span
              style={{
                'font-size': tempoDesign.typography.sizes.xs,
                color: tempoDesign.colors.mutedForeground,
              }}
            >
              {formatRelativeTime(props.task.createdAt)}
            </span>
          </Show>

          {/* Priority badge (if not already high/urgent due to frog) */}
          <Show when={props.task.priority !== 'high' && props.task.priority !== 'urgent'}>
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
          </Show>
        </div>
      </div>
    </div>
  );
};
