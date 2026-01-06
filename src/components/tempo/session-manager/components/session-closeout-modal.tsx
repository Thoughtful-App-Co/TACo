import { Component, createSignal, For, Show, createEffect, createMemo } from 'solid-js';
import { Portal } from 'solid-js/web';
import { X, Warning, Check, Clock, Package, Tray, CalendarPlus, Trash } from 'phosphor-solid';
import { format } from 'date-fns';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { tempoDesign } from '../../theme/tempo-design';
import {
  SessionLifecycleService,
  type CloseoutResult,
} from '../../services/session-lifecycle.service';
import { TaskPersistenceService } from '../../services/task-persistence.service';
import type { Session } from '../../lib/types';
import { logger } from '../../../../lib/logger';

const log = logger.create('SessionCloseoutModal');

// ============================================================================
// TYPES
// ============================================================================

interface SessionCloseoutModalProps {
  isOpen: boolean;
  session: Session | null;
  onClose: () => void;
  onCloseout?: (result: CloseoutResult) => void;
}

type CloseoutAction = 'backlog' | 'tomorrow' | 'discard';

interface IncompleteFocusBlock {
  id: string;
  title: string;
  remainingDuration: number;
  incompleteTimeboxes: number;
  totalTimeboxes: number;
  hasProgress: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const formatSessionDate = (date: string): string => {
  try {
    return format(new Date(date), 'EEEE, MMMM d, yyyy');
  } catch {
    return date;
  }
};

const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SessionCloseoutModal: Component<SessionCloseoutModalProps> = (props) => {
  const lifecycleService = new SessionLifecycleService();

  // Form state
  const [selectedAction, setSelectedAction] = createSignal<CloseoutAction>('backlog');
  const [selectedBlockIds, setSelectedBlockIds] = createSignal<Set<string>>(new Set());

  // UI state
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Computed: Session statistics
  const sessionStats = createMemo(() => {
    if (!props.session) {
      return {
        completedBlocks: 0,
        incompleteBlocks: 0,
        completedDuration: 0,
        incompleteDuration: 0,
        totalDuration: 0,
        progressPercent: 0,
      };
    }

    let completedDuration = 0;
    let incompleteDuration = 0;
    let completedBlocks = 0;
    let incompleteBlocks = 0;

    props.session.storyBlocks.forEach((block) => {
      const workTimeboxes = block.timeBoxes.filter((tb) => tb.type === 'work');
      const completedTimeboxes = workTimeboxes.filter((tb) => tb.status === 'completed');
      const incompleteTimeboxes = workTimeboxes.filter((tb) => tb.status !== 'completed');

      completedDuration += completedTimeboxes.reduce(
        (sum, tb) => sum + (tb.actualDuration || tb.duration),
        0
      );
      incompleteDuration += incompleteTimeboxes.reduce((sum, tb) => sum + tb.duration, 0);

      if (incompleteTimeboxes.length === 0) {
        completedBlocks++;
      } else {
        incompleteBlocks++;
      }
    });

    const totalDuration = completedDuration + incompleteDuration;
    const progressPercent = totalDuration > 0 ? (completedDuration / totalDuration) * 100 : 0;

    return {
      completedBlocks,
      incompleteBlocks,
      completedDuration,
      incompleteDuration,
      totalDuration,
      progressPercent,
    };
  });

  // Computed: Incomplete focus blocks for extraction
  const incompleteFocusBlocks = createMemo((): IncompleteFocusBlock[] => {
    if (!props.session) return [];

    return props.session.storyBlocks
      .filter((block) => {
        const workTimeboxes = block.timeBoxes.filter((tb) => tb.type === 'work');
        return workTimeboxes.some((tb) => tb.status !== 'completed');
      })
      .map((block) => {
        const workTimeboxes = block.timeBoxes.filter((tb) => tb.type === 'work');
        const incompleteTimeboxes = workTimeboxes.filter((tb) => tb.status !== 'completed');
        const completedTimeboxes = workTimeboxes.filter((tb) => tb.status === 'completed');

        return {
          id: block.id,
          title: block.title || 'Untitled Focus Block',
          remainingDuration: incompleteTimeboxes.reduce((sum, tb) => sum + tb.duration, 0),
          incompleteTimeboxes: incompleteTimeboxes.length,
          totalTimeboxes: workTimeboxes.length,
          hasProgress: completedTimeboxes.length > 0,
        };
      });
  });

  // Initialize selection when modal opens
  createEffect(() => {
    if (props.isOpen && props.session) {
      // Select all incomplete blocks by default
      const allIncompleteIds = new Set<string>(incompleteFocusBlocks().map((b) => b.id));
      setSelectedBlockIds(allIncompleteIds);
      setSelectedAction('backlog');
      setError(null);
      log.debug(`Initialized closeout modal for session: ${props.session.date}`);
    }
  });

  // Reset state when modal closes
  createEffect(() => {
    if (!props.isOpen) {
      setSelectedBlockIds(new Set<string>());
      setError(null);
      setIsProcessing(false);
    }
  });

  // Toggle block selection
  const toggleBlockSelection = (blockId: string) => {
    setSelectedBlockIds((prev) => {
      const next = new Set<string>(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    const allIds = incompleteFocusBlocks().map((b) => b.id);
    const allSelected = allIds.every((id) => selectedBlockIds().has(id));

    if (allSelected) {
      setSelectedBlockIds(new Set<string>());
    } else {
      setSelectedBlockIds(new Set<string>(allIds));
    }
  };

  // Handle closeout
  const handleCloseout = async () => {
    if (!props.session) return;

    setIsProcessing(true);
    setError(null);

    try {
      const action = selectedAction();
      const selected = Array.from(selectedBlockIds());

      log.info(`Closing out session ${props.session.date} with action: ${action}`, {
        selectedBlocks: selected.length,
      });

      let result: CloseoutResult;

      if (action === 'discard') {
        // Simply mark session as completed without extracting
        result = await lifecycleService.closeoutSession(props.session.date, {
          extractToBacklog: false,
        });
      } else if (action === 'backlog') {
        // Extract to backlog
        result = await lifecycleService.closeoutSession(props.session.date, {
          extractToBacklog: true,
          focusBlockIdsToExtract: selected.length > 0 ? selected : undefined,
        });
      } else if (action === 'tomorrow') {
        // Extract to backlog first, then schedule for tomorrow
        result = await lifecycleService.closeoutSession(props.session.date, {
          extractToBacklog: true,
          focusBlockIdsToExtract: selected.length > 0 ? selected : undefined,
        });

        // Schedule extracted tasks for tomorrow
        if (result.success && result.extractedTaskIds.length > 0) {
          const tomorrowDate = getTomorrowDate();
          for (const taskId of result.extractedTaskIds) {
            await TaskPersistenceService.scheduleTask(taskId, tomorrowDate);
          }
          log.info(`Scheduled ${result.extractedTaskIds.length} tasks for ${tomorrowDate}`);
        }
      } else {
        result = {
          success: false,
          extractedTaskIds: [],
          newSessionStatus: 'incomplete',
          error: 'Unknown action',
        };
      }

      if (result.success) {
        log.info(`Session ${props.session.date} closed out successfully`, {
          extractedTasks: result.extractedTaskIds.length,
          newStatus: result.newSessionStatus,
        });

        props.onCloseout?.(result);
        props.onClose();
      } else {
        setError(result.error || 'Failed to close out session');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      log.error('Failed to close out session', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const allBlocksSelected = createMemo(() => {
    const allIds = incompleteFocusBlocks().map((b) => b.id);
    return allIds.length > 0 && allIds.every((id) => selectedBlockIds().has(id));
  });

  return (
    <Show when={props.isOpen && props.session}>
      <Portal>
        {/* Backdrop */}
        <div
          style={{
            position: 'fixed',
            inset: '0',
            background: 'rgba(0, 0, 0, 0.6)',
            'z-index': 9999,
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => !isProcessing() && props.onClose()}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="closeout-modal-title"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            'z-index': 10000,
            width: '100%',
            'max-width': '560px',
            'max-height': '90vh',
            display: 'flex',
            'flex-direction': 'column',
            animation: 'modalSlideIn 0.2s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card
            style={{
              border: `1px solid ${tempoDesign.colors.border}`,
              'box-shadow': tempoDesign.shadows.lg,
              display: 'flex',
              'flex-direction': 'column',
              'max-height': '90vh',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '24px',
                'border-bottom': `1px solid ${tempoDesign.colors.border}`,
                'flex-shrink': 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'space-between',
                  'margin-bottom': '8px',
                }}
              >
                <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      'border-radius': tempoDesign.radius.lg,
                      background: `${tempoDesign.colors.amber[600]}15`,
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                    }}
                  >
                    <Warning size={22} weight="fill" color={tempoDesign.colors.amber[600]} />
                  </div>
                  <div>
                    <h2
                      id="closeout-modal-title"
                      style={{
                        margin: 0,
                        'font-size': '18px',
                        'font-weight': tempoDesign.typography.weights.semibold,
                        color: tempoDesign.colors.foreground,
                      }}
                    >
                      Close Out Session
                    </h2>
                    <p
                      style={{
                        margin: '4px 0 0 0',
                        'font-size': '13px',
                        color: tempoDesign.colors.mutedForeground,
                      }}
                    >
                      {formatSessionDate(props.session!.date)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={props.onClose}
                  disabled={isProcessing()}
                  aria-label="Close modal"
                  style={{
                    height: '36px',
                    width: '36px',
                    'border-radius': tempoDesign.radius.full,
                  }}
                >
                  <X size={18} />
                </Button>
              </div>
            </div>

            {/* Scrollable Content */}
            <CardContent
              style={{
                display: 'flex',
                'flex-direction': 'column',
                gap: '20px',
                'overflow-y': 'auto',
                'flex-grow': 1,
                padding: '24px',
              }}
            >
              {/* Summary Section */}
              <div
                style={{
                  background: tempoDesign.colors.muted,
                  'border-radius': tempoDesign.radius.lg,
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'margin-bottom': '16px',
                  }}
                >
                  {/* Completed */}
                  <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        'border-radius': tempoDesign.radius.md,
                        background: `${tempoDesign.colors.frog}15`,
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                      }}
                    >
                      <Check size={16} weight="bold" color={tempoDesign.colors.frog} />
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          'font-size': '13px',
                          color: tempoDesign.colors.mutedForeground,
                        }}
                      >
                        Completed
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0 0',
                          'font-size': '15px',
                          'font-weight': tempoDesign.typography.weights.semibold,
                          color: tempoDesign.colors.frog,
                        }}
                      >
                        {sessionStats().completedBlocks} block
                        {sessionStats().completedBlocks !== 1 ? 's' : ''} (
                        {formatDuration(sessionStats().completedDuration)})
                      </p>
                    </div>
                  </div>

                  {/* Incomplete */}
                  <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        'border-radius': tempoDesign.radius.md,
                        background: `${tempoDesign.colors.amber[600]}15`,
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                      }}
                    >
                      <Clock size={16} weight="bold" color={tempoDesign.colors.amber[600]} />
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          'font-size': '13px',
                          color: tempoDesign.colors.mutedForeground,
                        }}
                      >
                        Incomplete
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0 0',
                          'font-size': '15px',
                          'font-weight': tempoDesign.typography.weights.semibold,
                          color: tempoDesign.colors.amber[600],
                        }}
                      >
                        {sessionStats().incompleteBlocks} block
                        {sessionStats().incompleteBlocks !== 1 ? 's' : ''} (
                        {formatDuration(sessionStats().incompleteDuration)})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    height: '8px',
                    'border-radius': tempoDesign.radius.full,
                    background: tempoDesign.colors.secondary,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${sessionStats().progressPercent}%`,
                      background: tempoDesign.colors.frog,
                      'border-radius': tempoDesign.radius.full,
                      transition: 'width 0.3s ease-out',
                    }}
                  />
                </div>
                <p
                  style={{
                    margin: '8px 0 0 0',
                    'font-size': '12px',
                    color: tempoDesign.colors.mutedForeground,
                    'text-align': 'center',
                  }}
                >
                  {Math.round(sessionStats().progressPercent)}% complete
                </p>
              </div>

              {/* Incomplete Focus Blocks List */}
              <Show when={incompleteFocusBlocks().length > 0}>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'space-between',
                      'margin-bottom': '12px',
                    }}
                  >
                    <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                      <Package size={16} color={tempoDesign.colors.mutedForeground} />
                      <span
                        style={{
                          'font-size': '14px',
                          'font-weight': tempoDesign.typography.weights.medium,
                          color: tempoDesign.colors.foreground,
                        }}
                      >
                        Incomplete Focus Blocks
                      </span>
                    </div>
                    <button
                      onClick={toggleSelectAll}
                      disabled={isProcessing()}
                      aria-label={allBlocksSelected() ? 'Deselect all blocks' : 'Select all blocks'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        'font-size': '13px',
                        color: tempoDesign.colors.primary,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        'border-radius': tempoDesign.radius.sm,
                      }}
                    >
                      {allBlocksSelected() ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
                    <For each={incompleteFocusBlocks()}>
                      {(block) => {
                        const isSelected = () => selectedBlockIds().has(block.id);

                        return (
                          <div
                            role="checkbox"
                            aria-checked={isSelected()}
                            aria-label={`Select ${block.title}`}
                            tabIndex={0}
                            onClick={() => !isProcessing() && toggleBlockSelection(block.id)}
                            onKeyDown={(e) => {
                              if ((e.key === 'Enter' || e.key === ' ') && !isProcessing()) {
                                e.preventDefault();
                                toggleBlockSelection(block.id);
                              }
                            }}
                            style={{
                              display: 'flex',
                              'align-items': 'center',
                              gap: '12px',
                              padding: '12px',
                              background: isSelected()
                                ? `${tempoDesign.colors.primary}10`
                                : tempoDesign.colors.secondary,
                              'border-radius': tempoDesign.radius.md,
                              border: `1px solid ${isSelected() ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                              cursor: isProcessing() ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s ease-out',
                              opacity: isProcessing() ? 0.6 : 1,
                            }}
                          >
                            {/* Checkbox */}
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                'border-radius': tempoDesign.radius.sm,
                                border: `2px solid ${isSelected() ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                                background: isSelected()
                                  ? tempoDesign.colors.primary
                                  : 'transparent',
                                display: 'flex',
                                'align-items': 'center',
                                'justify-content': 'center',
                                'flex-shrink': 0,
                                transition: 'all 0.15s ease-out',
                              }}
                            >
                              <Show when={isSelected()}>
                                <Check size={12} weight="bold" color="#FFFFFF" />
                              </Show>
                            </div>

                            {/* Block info */}
                            <div style={{ flex: 1, 'min-width': 0 }}>
                              <p
                                style={{
                                  margin: 0,
                                  'font-size': '14px',
                                  'font-weight': tempoDesign.typography.weights.medium,
                                  color: tempoDesign.colors.foreground,
                                  'white-space': 'nowrap',
                                  overflow: 'hidden',
                                  'text-overflow': 'ellipsis',
                                }}
                              >
                                {block.title}
                              </p>
                              <p
                                style={{
                                  margin: '4px 0 0 0',
                                  'font-size': '12px',
                                  color: tempoDesign.colors.mutedForeground,
                                }}
                              >
                                {block.incompleteTimeboxes} of {block.totalTimeboxes} timebox
                                {block.totalTimeboxes !== 1 ? 'es' : ''} remaining
                              </p>
                            </div>

                            {/* Duration badge */}
                            <div
                              style={{
                                padding: '4px 10px',
                                'border-radius': tempoDesign.radius.full,
                                background: `${tempoDesign.colors.amber[600]}15`,
                                'font-size': '12px',
                                'font-weight': tempoDesign.typography.weights.medium,
                                color: tempoDesign.colors.amber[600],
                                'flex-shrink': 0,
                              }}
                            >
                              {formatDuration(block.remainingDuration)}
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </div>
              </Show>

              {/* Action Options */}
              <div>
                <p
                  style={{
                    margin: '0 0 12px 0',
                    'font-size': '14px',
                    'font-weight': tempoDesign.typography.weights.medium,
                    color: tempoDesign.colors.foreground,
                  }}
                >
                  What would you like to do with incomplete work?
                </p>

                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
                  {/* Send to Backlog */}
                  <div
                    role="radio"
                    aria-checked={selectedAction() === 'backlog'}
                    aria-label="Send to Backlog"
                    tabIndex={0}
                    onClick={() => !isProcessing() && setSelectedAction('backlog')}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !isProcessing()) {
                        e.preventDefault();
                        setSelectedAction('backlog');
                      }
                    }}
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      background:
                        selectedAction() === 'backlog'
                          ? `${tempoDesign.colors.primary}10`
                          : 'transparent',
                      'border-radius': tempoDesign.radius.md,
                      border: `2px solid ${selectedAction() === 'backlog' ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                      cursor: isProcessing() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease-out',
                      opacity: isProcessing() ? 0.6 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        'border-radius': '50%',
                        border: `2px solid ${selectedAction() === 'backlog' ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'flex-shrink': 0,
                      }}
                    >
                      <Show when={selectedAction() === 'backlog'}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            'border-radius': '50%',
                            background: tempoDesign.colors.primary,
                          }}
                        />
                      </Show>
                    </div>
                    <Tray size={18} color={tempoDesign.colors.primary} />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: 0,
                          'font-size': '14px',
                          'font-weight': tempoDesign.typography.weights.medium,
                          color: tempoDesign.colors.foreground,
                        }}
                      >
                        Send to Backlog
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0 0',
                          'font-size': '12px',
                          color: tempoDesign.colors.mutedForeground,
                        }}
                      >
                        Selected blocks become backlog tasks for later
                      </p>
                    </div>
                  </div>

                  {/* Move to Tomorrow */}
                  <div
                    role="radio"
                    aria-checked={selectedAction() === 'tomorrow'}
                    aria-label="Move to Tomorrow"
                    tabIndex={0}
                    onClick={() => !isProcessing() && setSelectedAction('tomorrow')}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !isProcessing()) {
                        e.preventDefault();
                        setSelectedAction('tomorrow');
                      }
                    }}
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      background:
                        selectedAction() === 'tomorrow'
                          ? `${tempoDesign.colors.primary}10`
                          : 'transparent',
                      'border-radius': tempoDesign.radius.md,
                      border: `2px solid ${selectedAction() === 'tomorrow' ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                      cursor: isProcessing() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease-out',
                      opacity: isProcessing() ? 0.6 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        'border-radius': '50%',
                        border: `2px solid ${selectedAction() === 'tomorrow' ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'flex-shrink': 0,
                      }}
                    >
                      <Show when={selectedAction() === 'tomorrow'}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            'border-radius': '50%',
                            background: tempoDesign.colors.primary,
                          }}
                        />
                      </Show>
                    </div>
                    <CalendarPlus size={18} color={tempoDesign.colors.primary} />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: 0,
                          'font-size': '14px',
                          'font-weight': tempoDesign.typography.weights.medium,
                          color: tempoDesign.colors.foreground,
                        }}
                      >
                        Move to Tomorrow
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0 0',
                          'font-size': '12px',
                          color: tempoDesign.colors.mutedForeground,
                        }}
                      >
                        Schedule selected blocks for tomorrow's session
                      </p>
                    </div>
                  </div>

                  {/* Discard */}
                  <div
                    role="radio"
                    aria-checked={selectedAction() === 'discard'}
                    aria-label="Discard incomplete work"
                    tabIndex={0}
                    onClick={() => !isProcessing() && setSelectedAction('discard')}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !isProcessing()) {
                        e.preventDefault();
                        setSelectedAction('discard');
                      }
                    }}
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      background:
                        selectedAction() === 'discard'
                          ? `${tempoDesign.colors.destructive}10`
                          : 'transparent',
                      'border-radius': tempoDesign.radius.md,
                      border: `2px solid ${selectedAction() === 'discard' ? tempoDesign.colors.destructive : tempoDesign.colors.border}`,
                      cursor: isProcessing() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease-out',
                      opacity: isProcessing() ? 0.6 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        'border-radius': '50%',
                        border: `2px solid ${selectedAction() === 'discard' ? tempoDesign.colors.destructive : tempoDesign.colors.border}`,
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'flex-shrink': 0,
                      }}
                    >
                      <Show when={selectedAction() === 'discard'}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            'border-radius': '50%',
                            background: tempoDesign.colors.destructive,
                          }}
                        />
                      </Show>
                    </div>
                    <Trash size={18} color={tempoDesign.colors.destructive} />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: 0,
                          'font-size': '14px',
                          'font-weight': tempoDesign.typography.weights.medium,
                          color: tempoDesign.colors.foreground,
                        }}
                      >
                        Discard
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0 0',
                          'font-size': '12px',
                          color: tempoDesign.colors.mutedForeground,
                        }}
                      >
                        Mark session complete, incomplete work will be lost
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning for discard */}
              <Show when={selectedAction() === 'discard'}>
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'flex-start',
                    gap: '12px',
                    'background-color': `${tempoDesign.colors.destructive}10`,
                    border: `1px solid ${tempoDesign.colors.destructive}30`,
                    'border-radius': tempoDesign.radius.md,
                    padding: '12px 16px',
                  }}
                >
                  <Warning
                    size={18}
                    weight="fill"
                    color={tempoDesign.colors.destructive}
                    style={{ 'flex-shrink': 0, 'margin-top': '2px' }}
                  />
                  <p
                    style={{
                      margin: 0,
                      'font-size': '13px',
                      color: tempoDesign.colors.destructive,
                      'line-height': tempoDesign.typography.lineHeights.normal,
                    }}
                  >
                    Discarding will permanently lose all incomplete work from this session. This
                    action cannot be undone.
                  </p>
                </div>
              </Show>

              {/* Error Message */}
              <Show when={error()}>
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '12px',
                    'background-color': `${tempoDesign.colors.destructive}15`,
                    border: `1px solid ${tempoDesign.colors.destructive}30`,
                    'border-radius': tempoDesign.radius.md,
                    padding: '12px 16px',
                    'font-size': '14px',
                    color: tempoDesign.colors.destructive,
                  }}
                >
                  <Warning size={18} weight="fill" />
                  {error()}
                </div>
              </Show>
            </CardContent>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '20px 24px',
                'border-top': `1px solid ${tempoDesign.colors.border}`,
                'flex-shrink': 0,
                background: tempoDesign.colors.card,
              }}
            >
              <Button
                variant="outline"
                onClick={props.onClose}
                disabled={isProcessing()}
                aria-label="Cancel closeout"
                style={{
                  flex: 1,
                  height: '52px',
                  'font-size': '15px',
                  'font-weight': tempoDesign.typography.weights.semibold,
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCloseout}
                disabled={isProcessing()}
                aria-label="Close out session"
                style={{
                  flex: 1,
                  height: '52px',
                  'font-size': '15px',
                  'font-weight': tempoDesign.typography.weights.semibold,
                  background:
                    selectedAction() === 'discard'
                      ? tempoDesign.colors.destructive
                      : tempoDesign.colors.primary,
                }}
              >
                {isProcessing() ? 'Processing...' : 'Close Out Session'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Keyframe animations */}
        <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
      </Portal>
    </Show>
  );
};
