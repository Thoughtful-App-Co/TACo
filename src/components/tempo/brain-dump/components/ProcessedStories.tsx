// /features/brain-dump/components/ProcessedStories.tsx
import { Show, For } from 'solid-js';
import { Info, CircleDashed } from 'phosphor-solid';
import { Button } from '../../ui/button';
import { StoryCard } from './StoryCard';
import type { ProcessedStory } from '../../lib/types';
import { tempoDesign } from '../../theme/tempo-design';

interface ProcessedStoriesProps {
  stories: ProcessedStory[];
  editedDurations: Record<string, number>;
  onDurationChange: (storyTitle: string, newDuration: number) => void;
  isCreatingSession?: boolean;
  onRetry?: () => void;
  onCreateSession?: () => Promise<any>;
}

export const ProcessedStories = (props: ProcessedStoriesProps) => {
  // Check for potential session planning issues
  const hasLongStories = () => props.stories.some((story) => story.estimatedDuration > 90);
  const hasLongTasks = () =>
    props.stories.some((story) => story.tasks.some((task) => task.duration > 60));

  // Only render if there are stories
  return (
    <Show when={props.stories.length > 0}>
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
        <Show when={hasLongStories() || hasLongTasks()}>
          <div
            style={{
              background: tempoDesign.colors.amber[50],
              border: `1px solid ${tempoDesign.colors.amber[200]}`,
              'border-radius': tempoDesign.radius.lg,
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <Info
                style={{
                  height: '16px',
                  width: '16px',
                  color: tempoDesign.colors.amber[600],
                  'flex-shrink': 0,
                  'margin-top': '2px',
                }}
              />
              <div>
                <h4
                  style={{
                    'font-weight': tempoDesign.typography.weights.medium,
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.amber[900],
                    margin: 0,
                  }}
                >
                  Productivity Optimization
                </h4>
                <div style={{ 'margin-top': '8px' }}>
                  <p
                    style={{
                      'font-size': tempoDesign.typography.sizes.sm,
                      color: tempoDesign.colors.amber[800],
                      margin: 0,
                    }}
                  >
                    Duration adjustments recommended to optimize focus and efficiency:
                  </p>
                  <ul
                    style={{
                      'margin-top': '8px',
                      'font-size': tempoDesign.typography.sizes.xs,
                      color: tempoDesign.colors.amber[700],
                      margin: '8px 0 0 0',
                      padding: 0,
                      'list-style': 'none',
                      display: 'flex',
                      'flex-direction': 'column',
                      gap: '4px',
                    }}
                  >
                    <Show when={hasLongStories()}>
                      <li>
                        • Work blocks exceeding 90 minutes require strategic breaks to maintain
                        cognitive performance
                      </li>
                    </Show>
                    <Show when={hasLongTasks()}>
                      <li>
                        • Tasks over 60 minutes benefit from division into focused, manageable
                        segments
                      </li>
                    </Show>
                    <li>
                      • Consider refining durations or restructuring complex tasks for optimal
                      session planning
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Show>

        <Show when={props.onRetry && props.onCreateSession}>
          <div
            style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between' }}
          >
            <h3 style={{ 'font-weight': tempoDesign.typography.weights.medium, margin: 0 }}>
              Focus Block Analysis
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button onClick={props.onRetry} variant="outline" size="sm">
                Reset Analysis
              </Button>
              <Button
                onClick={props.onCreateSession}
                size="sm"
                disabled={props.isCreatingSession ?? false}
              >
                <Show when={props.isCreatingSession} fallback="Schedule Work Session">
                  <>
                    <CircleDashed
                      style={{
                        'margin-right': '8px',
                        height: '16px',
                        width: '16px',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    Generating...
                  </>
                </Show>
              </Button>
            </div>
          </div>
        </Show>

        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
          <For each={props.stories}>
            {(story) => (
              <StoryCard
                story={story}
                editedDuration={props.editedDurations[story.title] || story.estimatedDuration}
                onDurationChange={props.onDurationChange}
              />
            )}
          </For>
        </div>
      </div>
    </Show>
  );
};
