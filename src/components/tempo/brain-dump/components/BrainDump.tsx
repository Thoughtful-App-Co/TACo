// /features/brain-dump/components/BrainDump.tsx
// Solid.js component

import { createSignal, Show } from 'solid-js';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { CircleDashed, Lock, CaretRight, Question } from 'phosphor-solid';
import { useBrainDump } from '../hooks/useBrainDump';
import { ProcessedStories } from './ProcessedStories';
import type { ProcessedStory } from '../../lib/types';
import { tempoDesign } from '../../theme/tempo-design';

interface BrainDumpProps {
  onTasksProcessed?: (stories: ProcessedStory[]) => void;
}

/**
 * BrainDump Component:
 * - Provides an input area for users to enter tasks.
 * - Uses AI to analyze and optimize tasks into work blocks.
 * - Displays real-time feedback, errors, and suggestions.
 * - Allows users to create structured work sessions.
 */
export const BrainDump = (props: BrainDumpProps) => {
  const {
    tasks,
    setTasks,
    processedStories,
    editedDurations,
    isInputLocked,
    isProcessing,
    isCreatingSession,
    processingStep,
    processTasks,
    handleCreateSession,
    handleDurationChange,
    handleRetry,
  } = useBrainDump(props.onTasksProcessed);

  return (
    <Card>
      <CardContent
        style={{ display: 'flex', 'flex-direction': 'column', gap: '16px', padding: '16px' }}
      >
        <div style={{ position: 'relative' }}>
          <Textarea
            placeholder={`task .init
Update client dashboard design 🐸
Send weekly progress report - 20m
Research API integration - 1h
Schedule team meeting - by Thursday
Update project docs
Finalize product specs - EOD`}
            value={tasks()}
            onInput={(e) => !isInputLocked() && setTasks(e.currentTarget.value)}
            disabled={isInputLocked()}
            style={{
              'min-height': '150px',
              'font-family': tempoDesign.typography.monoFamily,
              'font-size': tempoDesign.typography.sizes.base,
            }}
          />
          <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
            <Button
              variant="ghost"
              size="icon"
              style={{ color: tempoDesign.colors.mutedForeground }}
              title="Task entry tips: Use clear verbs, estimate time (30m), prioritize with 🐸 FROG, add deadlines"
            >
              <Question style={{ height: '16px', width: '16px' }} />
            </Button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            'justify-content': 'flex-end',
            'align-items': 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              'font-size': tempoDesign.typography.sizes.xs,
              color: tempoDesign.colors.mutedForeground,
              display: 'flex',
              'align-items': 'center',
              gap: '4px',
            }}
          >
            <CaretRight style={{ height: '12px', width: '12px' }} />
            <span>Analyze to optimize</span>
          </div>
          <Button
            onClick={() => processTasks(false)}
            disabled={!tasks().trim() || isProcessing() || isInputLocked()}
            style={{ width: '128px' }}
          >
            <Show
              when={isProcessing()}
              fallback={
                <Show when={isInputLocked()} fallback="Analyze">
                  <>
                    <Lock style={{ 'margin-right': '8px', height: '16px', width: '16px' }} />
                    Locked
                  </>
                </Show>
              }
            >
              <>
                <CircleDashed
                  style={{
                    'margin-right': '8px',
                    height: '16px',
                    width: '16px',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Analyzing
              </>
            </Show>
          </Button>
        </div>

        <Show when={processedStories().length > 0}>
          <div
            style={{
              display: 'flex',
              'flex-direction': 'column',
              gap: '16px',
              'padding-top': '16px',
              'border-top': `1px solid ${tempoDesign.colors.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
              }}
            >
              <h3
                style={{
                  'font-size': tempoDesign.typography.sizes.lg,
                  'font-weight': tempoDesign.typography.weights.medium,
                  margin: 0,
                }}
              >
                Work Blocks
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button onClick={handleRetry} variant="outline" size="sm">
                  Reset
                </Button>
                <Button onClick={handleCreateSession} size="sm" disabled={isCreatingSession()}>
                  <Show when={isCreatingSession()} fallback="Create Session">
                    <>
                      <CircleDashed
                        style={{
                          'margin-right': '8px',
                          height: '16px',
                          width: '16px',
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                      {processingStep() || 'Creating'}
                    </>
                  </Show>
                </Button>
              </div>
            </div>
            <ProcessedStories
              stories={processedStories()}
              editedDurations={editedDurations()}
              onDurationChange={handleDurationChange}
            />
          </div>
        </Show>
      </CardContent>
    </Card>
  );
};
