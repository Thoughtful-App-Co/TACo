// /features/brain-dump/components/BrainDump.tsx
// Solid.js component

import { createSignal, Show } from 'solid-js';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { CircleDashed, Lock, CaretRight, Question, Tray, ArrowSquareIn } from 'phosphor-solid';
import { useBrainDump } from '../hooks/useBrainDump';
import { ProcessedStories } from './ProcessedStories';
import type { ProcessedStory } from '../../lib/types';
import { tempoDesign } from '../../theme/tempo-design';
import { useTempoAIAccess } from '../../hooks/useTempoAIAccess';
import { Paywall } from '../../../common/Paywall';
import { useAuth } from '../../../../lib/auth-context';
import { QueuePickerModal } from '../../queue/components/QueuePickerModal';
import type { QueueTask } from '../../queue/types';
import { BrainDumpLockOverlay } from './BrainDumpLockOverlay';

interface BrainDumpProps {
  onTasksProcessed?: (stories: ProcessedStory[]) => void;
  onOpenSettings?: () => void;
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
    isSendingToQueue,
    processingStep,
    processTasks,
    handleCreateSession,
    handleSendToQueue,
    handleDurationChange,
    handleRetry,
  } = useBrainDump(props.onTasksProcessed);

  // AI access control - checks both API key AND subscription
  const { canUseAI, requireAccess, showPaywall, setShowPaywall } = useTempoAIAccess();
  const auth = useAuth();

  // Queue picker state
  const [showQueuePicker, setShowQueuePicker] = createSignal(false);

  // Handle pulling tasks from the queue into the textarea
  const handlePullFromQueue = (queueTasks: QueueTask[]) => {
    const taskLines = queueTasks
      .map((t) => {
        let line = t.title;
        if (t.duration) line += ` - ${t.duration}m`;
        if (t.isFrog) line += ' FROG';
        return line;
      })
      .join('\n');

    const current = tasks();
    setTasks(current ? current + '\n' + taskLines : taskLines);
  };

  return (
    <>
      <div style={{ position: 'relative' }}>
        {/* Lock overlay when user has no API key and no subscription */}
        <Show when={!canUseAI() && !auth.hasAppExtras('tempo')}>
          <BrainDumpLockOverlay onOpenSettings={() => props.onOpenSettings?.()} />
        </Show>

        <Card
          style={{
            filter: !canUseAI() ? 'blur(3px)' : 'none',
            opacity: !canUseAI() ? 0.6 : 1,
            'pointer-events': !canUseAI() ? 'none' : 'auto',
            transition: 'filter 0.2s ease-out, opacity 0.2s ease-out',
          }}
        >
          <CardContent
            style={{ display: 'flex', 'flex-direction': 'column', gap: '16px', padding: '16px' }}
          >
            <div style={{ position: 'relative' }}>
              <Textarea
                placeholder={`task .init
Update client dashboard design FROG
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
                  title="Task entry tips: Use clear verbs, estimate time (30m), prioritize with FROG keyword, add deadlines"
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
              <Button
                variant="outline"
                onClick={() => setShowQueuePicker(true)}
                disabled={isInputLocked()}
                title="Pull tasks from The Queue"
              >
                <ArrowSquareIn style={{ 'margin-right': '6px', height: '14px', width: '14px' }} />
                Pull from Queue
              </Button>
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
                onClick={() => requireAccess(() => processTasks(false), { showPaywallModal: true })}
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
                    <Button
                      onClick={handleSendToQueue}
                      variant="outline"
                      size="sm"
                      disabled={isSendingToQueue() || isCreatingSession()}
                      title="Add tasks to The Queue for later scheduling"
                    >
                      <Show
                        when={isSendingToQueue()}
                        fallback={
                          <>
                            <Tray
                              style={{
                                'margin-right': '6px',
                                height: '14px',
                                width: '14px',
                              }}
                            />
                            To Queue
                          </>
                        }
                      >
                        <>
                          <CircleDashed
                            style={{
                              'margin-right': '6px',
                              height: '14px',
                              width: '14px',
                              animation: 'spin 1s linear infinite',
                            }}
                          />
                          Adding...
                        </>
                      </Show>
                    </Button>
                    <Button
                      onClick={handleCreateSession}
                      size="sm"
                      disabled={isCreatingSession() || isSendingToQueue()}
                    >
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
                  isCreatingSession={isCreatingSession()}
                  onDurationChange={handleDurationChange}
                  onRetry={handleRetry}
                  onCreateSession={handleCreateSession}
                />
              </div>
            </Show>
          </CardContent>
        </Card>
      </div>
      {/* Paywall modal - rendered outside Card to avoid z-index issues */}
      <Paywall
        isOpen={showPaywall()}
        onClose={() => setShowPaywall(false)}
        feature="tempo_extras"
        featureName="AI Brain Dump Processing"
      />

      {/* Queue picker modal for pulling tasks */}
      <QueuePickerModal
        isOpen={showQueuePicker()}
        onClose={() => setShowQueuePicker(false)}
        onSelect={handlePullFromQueue}
      />
    </>
  );
};
