// /features/brain-dump/components/StoryCard.tsx
// Solid.js component
import { Show, For } from 'solid-js';
import { Badge } from '../../ui/badge';
import { Clock, Info } from 'phosphor-solid';
import { Input } from '../../ui/input';
import type { ProcessedStory, ProcessedTask } from '../types';
import { DifficultyBadge } from './DifficultyBadge';
import { tempoDesign } from '../../theme/tempo-design';

interface StoryCardProps {
  story: ProcessedStory;
  editedDuration: number;
  onDurationChange: (storyTitle: string, newDuration: number) => void;
}

export const StoryCard = (props: StoryCardProps) => {
  const renderTaskBreaks = (task: ProcessedTask) => {
    if (!task.suggestedBreaks?.length) return null;

    return (
      <div
        style={{
          'margin-left': '24px',
          'margin-top': '4px',
          'font-size': tempoDesign.typography.sizes.xs,
          color: tempoDesign.colors.mutedForeground,
          display: 'flex',
          'flex-direction': 'column',
          gap: '4px',
        }}
      >
        <For each={task.suggestedBreaks}>
          {(breakInfo) => (
            <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
              <Info style={{ height: '12px', width: '12px', 'flex-shrink': 0 }} />
              <span style={{ 'font-size': tempoDesign.typography.sizes.xs }}>
                Break recommended at {breakInfo.after}m: {breakInfo.duration}m duration
                {breakInfo.reason && ` - ${breakInfo.reason}`}
              </span>
            </div>
          )}
        </For>
      </div>
    );
  };

  return (
    <div
      style={{
        'border-radius': tempoDesign.radius.lg,
        border: `1px solid ${tempoDesign.colors.cardBorder}`,
        background: tempoDesign.colors.card,
        color: tempoDesign.colors.cardForeground,
        'box-shadow': tempoDesign.shadows.sm,
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', 'align-items': 'flex-start', gap: '8px' }}>
        <span style={{ 'font-size': tempoDesign.typography.sizes['2xl'] }}>{props.story.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
            <h5
              style={{
                'font-weight': tempoDesign.typography.weights.medium,
                'line-height': 1,
                'letter-spacing': '-0.025em',
                margin: 0,
              }}
            >
              {props.story.title}
            </h5>
            <Badge variant={props.story.type === 'flexible' ? 'outline' : 'default'}>
              {props.story.type}
            </Badge>
            <Show when={props.story.projectType}>
              <Badge variant="secondary" style={{ 'font-size': tempoDesign.typography.sizes.xs }}>
                {props.story.projectType}
              </Badge>
            </Show>
          </div>
          <div style={{ 'font-size': tempoDesign.typography.sizes.sm }}>
            <p
              style={{
                'margin-top': '4px',
                color: tempoDesign.colors.mutedForeground,
                'line-height': tempoDesign.typography.lineHeights.relaxed,
                margin: '4px 0 0 0',
              }}
            >
              {props.story.summary}
            </p>
            <ul
              style={{
                'margin-top': '8px',
                display: 'flex',
                'flex-direction': 'column',
                gap: '8px',
                padding: 0,
                'list-style': 'none',
              }}
            >
              <For each={props.story.tasks}>
                {(task) => (
                  <li style={{ 'margin-bottom': '4px' }}>
                    <div style={{ display: 'flex' }}>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            'align-items': 'center',
                            gap: '8px',
                            'flex-wrap': 'wrap',
                          }}
                        >
                          <span style={{ 'font-size': tempoDesign.typography.sizes.sm }}>•</span>
                          <span
                            style={{
                              'font-size': tempoDesign.typography.sizes.sm,
                              ...(task.isFrog
                                ? {
                                    'font-weight': tempoDesign.typography.weights.medium,
                                    color: tempoDesign.colors.primary,
                                  }
                                : {}),
                            }}
                          >
                            {task.title}
                          </span>
                          <Show when={task.isFrog}>
                            <Badge
                              variant="secondary"
                              style={{
                                background: tempoDesign.colors.frogBg,
                                color: tempoDesign.colors.frog,
                                'font-size': tempoDesign.typography.sizes.xs,
                                padding: '0 8px',
                                height: '20px',
                              }}
                            >
                              <span style={{ 'margin-right': '4px' }}>🐸</span>
                              HIGH PRIORITY
                            </Badge>
                          </Show>
                          <Badge
                            variant="outline"
                            style={{
                              'font-size': tempoDesign.typography.sizes.xs,
                              'text-transform': 'capitalize',
                            }}
                          >
                            {task.taskCategory}
                          </Badge>
                          <Show
                            when={task.projectType && task.projectType !== props.story.projectType}
                          >
                            <Badge
                              variant="secondary"
                              style={{ 'font-size': tempoDesign.typography.sizes.xs }}
                            >
                              {task.projectType}
                            </Badge>
                          </Show>
                          <Show
                            when={task.isFlexible}
                            fallback={
                              <Show when={task.duration > 0}>
                                <span
                                  style={{
                                    'font-size': tempoDesign.typography.sizes.xs,
                                    color: tempoDesign.colors.mutedForeground,
                                  }}
                                >
                                  ({task.duration} min estimate)
                                </span>
                              </Show>
                            }
                          >
                            <Badge
                              variant="outline"
                              style={{ 'font-size': tempoDesign.typography.sizes.xs }}
                            >
                              time flexible
                            </Badge>
                          </Show>
                        </div>

                        {renderTaskBreaks(task)}
                      </div>

                      <Show when={task.difficulty}>
                        <div
                          style={{
                            'flex-shrink': 0,
                            'margin-left': '8px',
                            'align-self': 'flex-start',
                            'margin-top': '4px',
                          }}
                        >
                          <DifficultyBadge difficulty={task.difficulty!} duration={task.duration} />
                        </div>
                      </Show>
                    </div>
                  </li>
                )}
              </For>
            </ul>
            <Show when={props.story.type !== 'milestone'}>
              <div
                style={{
                  'margin-top': '12px',
                  display: 'flex',
                  'align-items': 'center',
                  gap: '8px',
                }}
              >
                <Clock
                  style={{
                    height: '16px',
                    width: '16px',
                    color: tempoDesign.colors.mutedForeground,
                  }}
                />
                <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                  <Input
                    type="number"
                    value={props.editedDuration || ''}
                    onInput={(e) => {
                      const value = e.currentTarget.value;
                      const duration = parseInt(value, 10);
                      if (!isNaN(duration) && duration > 0) {
                        props.onDurationChange(props.story.title, duration);
                      }
                    }}
                    style={{
                      width: '80px',
                      height: '28px',
                      'font-size': tempoDesign.typography.sizes.sm,
                    }}
                    min="1"
                  />
                  <span
                    style={{
                      'font-size': tempoDesign.typography.sizes.sm,
                      color: tempoDesign.colors.mutedForeground,
                    }}
                  >
                    min estimated duration
                  </span>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};
