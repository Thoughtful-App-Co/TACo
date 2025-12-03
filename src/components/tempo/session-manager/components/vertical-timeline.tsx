import { createSignal, For, Show } from 'solid-js';
import { Clock, CheckCircle, Play, Coffee, FileText, ArrowCounterClockwise } from 'phosphor-solid';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Button } from '../../ui/button';
import type { StoryBlock, TimeBox, TimeBoxTask, TimeBoxStatus } from '../../lib/types';
import { timeboxTypeConfig, statusColorConfig } from '../config/timeline-config';
import { tempoDesign } from '../../theme/tempo-design';

// Interface for the vertical timeline component
export interface VerticalTimelineProps {
  storyBlocks: StoryBlock[];
  activeTimeBoxId?: string;
  activeStoryId?: string;
  activeTimeBoxIndex?: number;
  startTime?: string;
  completedPercentage: number;
  onTaskClick?: (
    storyId: string,
    timeBoxIndex: number,
    taskIndex: number,
    task: TimeBoxTask
  ) => void;
  onTimeBoxClick?: (storyId: string, timeBoxIndex: number) => void;
  onStartTimeBox?: (storyId: string, timeBoxIndex: number, duration: number) => void;
  onCompleteTimeBox?: (storyId: string, timeBoxIndex: number) => void;
  onUndoCompleteTimeBox?: (storyId: string, timeBoxIndex: number) => void;
  onStartSessionDebrief?: (duration: number) => void;
  isCompactView?: boolean;
}

export const VerticalTimeline = (props: VerticalTimelineProps) => {
  const [visibleBoxes, setVisibleBoxes] = createSignal<Set<string>>(new Set());

  // Helper to get timebox icon
  const getTimeBoxIcon = (type: string, status: TimeBoxStatus) => {
    if (status === 'completed') return <CheckCircle size={20} weight="fill" />;

    switch (type) {
      case 'work':
        return <Clock size={20} />;
      case 'short-break':
      case 'long-break':
        return <Coffee size={20} />;
      case 'debrief':
        return <FileText size={20} />;
      default:
        return <Clock size={20} />;
    }
  };

  // Helper to get timebox type label
  const getTypeLabel = (type: string) => {
    const config = timeboxTypeConfig[type as keyof typeof timeboxTypeConfig];
    return config?.title || type;
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Timeline container */}
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '32px' }}>
        <For each={props.storyBlocks}>
          {(story, storyIdx) => (
            <div style={{ position: 'relative' }}>
              {/* Story Header */}
              <div style={{ 'margin-bottom': '16px' }}>
                <h3
                  style={{
                    'font-size': tempoDesign.typography.sizes.lg,
                    'font-weight': tempoDesign.typography.weights.semibold,
                    margin: 0,
                  }}
                >
                  {story.title}
                </h3>
              </div>

              {/* TimeBoxes for this story */}
              <div
                style={{
                  display: 'flex',
                  'flex-direction': 'column',
                  gap: '16px',
                  'margin-left': '32px',
                }}
              >
                <For each={story.timeBoxes}>
                  {(timeBox, boxIdx) => {
                    const isActive = props.activeTimeBoxId === `${story.id}-box-${boxIdx()}`;
                    const boxId = `${story.id}-box-${boxIdx()}`;

                    return (
                      <div
                        data-id={boxId}
                        style={{
                          position: 'relative',
                          padding: '16px',
                          'border-radius': tempoDesign.radius.lg,
                          border: isActive
                            ? `1px solid ${tempoDesign.colors.primary}`
                            : timeBox.status === 'in-progress'
                              ? `1px solid ${tempoDesign.colors.primary}`
                              : `1px solid ${tempoDesign.colors.border}`,
                          transition: 'all 0.2s ease',
                          background:
                            timeBox.status === 'completed'
                              ? tempoDesign.colors.muted
                              : tempoDesign.colors.card,
                          ...(isActive
                            ? {
                                'box-shadow': `0 0 0 2px ${tempoDesign.colors.primary}30`,
                              }
                            : {}),
                        }}
                      >
                        {/* TimeBox Header */}
                        <div
                          style={{
                            display: 'flex',
                            'align-items': 'flex-start',
                            'justify-content': 'space-between',
                            'margin-bottom': '12px',
                          }}
                        >
                          <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
                            <div
                              style={{
                                padding: '8px',
                                'border-radius': tempoDesign.radius.full,
                                display: 'flex',
                                'align-items': 'center',
                                'justify-content': 'center',
                                background:
                                  timeBox.status === 'completed'
                                    ? tempoDesign.colors.frogBg
                                    : tempoDesign.colors.secondary,
                                color:
                                  timeBox.status === 'completed'
                                    ? tempoDesign.colors.frog
                                    : tempoDesign.colors.foreground,
                              }}
                            >
                              {getTimeBoxIcon(timeBox.type, timeBox.status || 'todo')}
                            </div>
                            <div>
                              <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                                <Badge variant="outline">{getTypeLabel(timeBox.type)}</Badge>
                                <span
                                  style={{
                                    'font-size': tempoDesign.typography.sizes.sm,
                                    color: tempoDesign.colors.mutedForeground,
                                  }}
                                >
                                  {timeBox.duration} min
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                            <Show when={timeBox.status === 'todo'}>
                              <Button
                                size="sm"
                                onClick={() =>
                                  props.onStartTimeBox?.(story.id, boxIdx(), timeBox.duration)
                                }
                                title="Start this timebox"
                              >
                                <Play size={16} style={{ 'margin-right': '4px' }} />
                                Start
                              </Button>
                            </Show>

                            <Show when={timeBox.status === 'in-progress'}>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => props.onCompleteTimeBox?.(story.id, boxIdx())}
                                title="Complete this timebox"
                              >
                                <CheckCircle size={16} style={{ 'margin-right': '4px' }} />
                                Complete
                              </Button>
                            </Show>

                            <Show when={timeBox.status === 'completed'}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => props.onUndoCompleteTimeBox?.(story.id, boxIdx())}
                                title="Undo completion"
                              >
                                <ArrowCounterClockwise
                                  size={16}
                                  style={{ 'margin-right': '4px' }}
                                />
                                Undo
                              </Button>
                            </Show>
                          </div>
                        </div>

                        {/* Tasks */}
                        <Show when={timeBox.tasks && timeBox.tasks.length > 0}>
                          <div
                            style={{
                              display: 'flex',
                              'flex-direction': 'column',
                              gap: '8px',
                              'margin-top': '12px',
                            }}
                          >
                            <For each={timeBox.tasks}>
                              {(task, taskIdx) => (
                                <div
                                  style={{
                                    display: 'flex',
                                    'align-items': 'center',
                                    gap: '8px',
                                    padding: '8px',
                                    'border-radius': tempoDesign.radius.sm,
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    ...(task.status === 'completed' ? { opacity: 0.6 } : {}),
                                  }}
                                  onClick={() => {
                                    const newTask = {
                                      ...task,
                                      status: task.status === 'completed' ? 'todo' : 'completed',
                                    } as TimeBoxTask;
                                    props.onTaskClick?.(story.id, boxIdx(), taskIdx(), newTask);
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor =
                                      tempoDesign.colors.secondary)
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor = 'transparent')
                                  }
                                >
                                  <Show
                                    when={task.status === 'completed'}
                                    fallback={
                                      <div
                                        style={{
                                          width: '16px',
                                          height: '16px',
                                          'border-radius': '4px',
                                          border: `1px solid ${tempoDesign.colors.mutedForeground}`,
                                        }}
                                      />
                                    }
                                  >
                                    <CheckCircle
                                      size={16}
                                      weight="fill"
                                      style={{ color: tempoDesign.colors.frog }}
                                    />
                                  </Show>
                                  <span
                                    style={{
                                      'font-size': tempoDesign.typography.sizes.sm,
                                      flex: 1,
                                      color:
                                        task.status === 'completed'
                                          ? tempoDesign.colors.mutedForeground
                                          : tempoDesign.colors.foreground,
                                      'text-decoration':
                                        task.status === 'completed' ? 'line-through' : 'none',
                                    }}
                                  >
                                    {task.title}
                                  </span>
                                </div>
                              )}
                            </For>
                          </div>
                        </Show>

                        {/* Progress bar for in-progress timeboxes */}
                        <Show when={timeBox.status === 'in-progress'}>
                          <div style={{ 'margin-top': '12px' }}>
                            <Progress value={50} style={{ height: '8px' }} />
                          </div>
                        </Show>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>

      {/* Session completion section */}
      <Show when={props.completedPercentage === 100}>
        <div
          style={{
            'margin-top': '32px',
            padding: '24px',
            'border-radius': tempoDesign.radius.lg,
            border: `1px solid ${tempoDesign.colors.frog}40`,
            background: `${tempoDesign.colors.frog}10`,
          }}
        >
          <div
            style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between' }}
          >
            <div>
              <h3
                style={{
                  'font-size': tempoDesign.typography.sizes.lg,
                  'font-weight': tempoDesign.typography.weights.semibold,
                  color: tempoDesign.colors.frog,
                  margin: 0,
                }}
              >
                Session Complete! 🎉
              </h3>
              <p
                style={{
                  'font-size': tempoDesign.typography.sizes.sm,
                  color: tempoDesign.colors.frog,
                  opacity: 0.9,
                  margin: '4px 0 0 0',
                }}
              >
                All tasks have been completed. Time for a debrief!
              </p>
            </div>
            <Button onClick={() => props.onStartSessionDebrief?.(10)} size="lg">
              <FileText size={20} style={{ 'margin-right': '8px' }} />
              Start Debrief
            </Button>
          </div>
        </div>
      </Show>
    </div>
  );
};
