import { Component, createSignal, For, Show, createEffect, createMemo } from 'solid-js';
import { Portal } from 'solid-js/web';
import { X, Plus, Trash, Clock, CaretDown, Warning, Check, XCircle } from 'phosphor-solid';
import { format } from 'date-fns';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { NeoNumberInput } from '../../ui/neo-number-input';
import { Card, CardContent } from '../../ui/card';
import { ReorderButtons } from '../../ui/reorder-buttons';
import { tempoDesign } from '../../theme/tempo-design';
import { useSessionCrud } from '../hooks/useSessionCrud';
import type { Session, StoryBlock, TimeBox, SessionStatus, TimeBoxType } from '../../lib/types';
import { logger } from '../../../../lib/logger';

const log = logger.create('SessionEditModal');

// ============================================================================
// DESIGN CONSTANTS
// ============================================================================

// Color palette for focus blocks
const FOCUS_BLOCK_COLORS = [
  { accent: '#5E6AD2', bg: 'rgba(94, 106, 210, 0.08)', border: 'rgba(94, 106, 210, 0.2)' }, // Purple
  { accent: '#10B981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)' }, // Green
  { accent: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)' }, // Amber
  { accent: '#3B82F6', bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)' }, // Blue
  { accent: '#EC4899', bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.2)' }, // Pink
];

// Timebox type configuration (icons removed per AGENTS.md guidelines)
const TIMEBOX_TYPE_CONFIG: Record<TimeBoxType, { color: string; bg: string; label: string }> = {
  work: { color: '#5E6AD2', bg: 'rgba(94, 106, 210, 0.15)', label: 'Work' },
  'short-break': {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
    label: 'Short Break',
  },
  'long-break': {
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.15)',
    label: 'Long Break',
  },
  debrief: { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', label: 'Debrief' },
};

const SESSION_STATUSES: { value: SessionStatus; label: string; color: string }[] = [
  { value: 'planned', label: 'Planned', color: tempoDesign.colors.mutedForeground },
  { value: 'in-progress', label: 'In Progress', color: tempoDesign.colors.amber[600] },
  { value: 'completed', label: 'Completed', color: tempoDesign.colors.frog },
  { value: 'archived', label: 'Archived', color: tempoDesign.colors.mutedForeground },
];

// ============================================================================
// TYPES
// ============================================================================

interface SessionEditModalProps {
  isOpen: boolean;
  session: Session | null;
  onClose: () => void;
  onSessionUpdated?: (session: Session) => void;
}

interface FormTimebox {
  id: string;
  type: TimeBoxType;
  duration: number;
  status?: 'todo' | 'completed' | 'in-progress' | 'cancelled';
  actualDuration?: number;
}

interface FormFocusBlock {
  id: string;
  title: string;
  totalDuration: number;
  timeboxes: FormTimebox[];
  progress: number;
  hasProgress: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const calculateTotalDuration = (focusBlocks: FormFocusBlock[]): number => {
  return focusBlocks.reduce((total, block) => {
    const blockDuration = block.timeboxes.reduce((sum, tb) => sum + tb.duration, 0);
    return total + blockDuration;
  }, 0);
};

const calculateBlockDuration = (block: FormFocusBlock): number => {
  return block.timeboxes.reduce((sum, tb) => sum + tb.duration, 0);
};

const formatSessionDate = (date: string): string => {
  try {
    return format(new Date(date), 'MMMM d, yyyy');
  } catch {
    return date;
  }
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const getBlockColor = (index: number) => {
  return FOCUS_BLOCK_COLORS[index % FOCUS_BLOCK_COLORS.length];
};

const createEmptyTimebox = (): FormTimebox => ({
  id: generateId(),
  type: 'work',
  duration: 25,
  status: 'todo',
});

const createEmptyFocusBlock = (): FormFocusBlock => ({
  id: generateId(),
  title: '',
  totalDuration: 25,
  timeboxes: [createEmptyTimebox()],
  progress: 0,
  hasProgress: false,
});

// Convert session to form state
const sessionToFormState = (session: Session): FormFocusBlock[] => {
  return session.storyBlocks.map((block) => {
    const timeboxes: FormTimebox[] = block.timeBoxes.map((tb, idx) => ({
      id: `${block.id}-tb-${idx}-${Date.now()}`,
      type: tb.type,
      duration: tb.duration,
      status: tb.status,
      actualDuration: tb.actualDuration,
    }));

    const hasProgress = block.progress > 0 || timeboxes.some((tb) => tb.status !== 'todo');

    return {
      id: block.id,
      title: block.title,
      totalDuration: block.totalDuration,
      timeboxes,
      progress: block.progress,
      hasProgress,
    };
  });
};

// Convert form state back to session story blocks
const formStateToStoryBlocks = (formBlocks: FormFocusBlock[]): StoryBlock[] => {
  return formBlocks.map((formBlock) => {
    const timeBoxes: TimeBox[] = formBlock.timeboxes.map((formTb) => ({
      type: formTb.type,
      duration: formTb.duration,
      status: formTb.status || 'todo',
      actualDuration: formTb.actualDuration,
    }));

    const totalDuration = timeBoxes.reduce((sum, tb) => sum + tb.duration, 0);

    return {
      id: formBlock.id,
      title: formBlock.title,
      timeBoxes,
      totalDuration,
      progress: formBlock.progress,
      taskIds: [],
    };
  });
};

// Deep equality check for detecting changes
const hasFormChanged = (
  original: FormFocusBlock[],
  current: FormFocusBlock[],
  originalStatus: SessionStatus,
  currentStatus: SessionStatus
): boolean => {
  if (originalStatus !== currentStatus) return true;
  if (original.length !== current.length) return true;

  for (let i = 0; i < original.length; i++) {
    const origBlock = original[i];
    const currBlock = current[i];

    if (origBlock.title !== currBlock.title) return true;
    if (origBlock.timeboxes.length !== currBlock.timeboxes.length) return true;

    for (let j = 0; j < origBlock.timeboxes.length; j++) {
      const origTb = origBlock.timeboxes[j];
      const currTb = currBlock.timeboxes[j];

      if (origTb.type !== currTb.type) return true;
      if (origTb.duration !== currTb.duration) return true;
    }
  }

  return false;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SessionEditModal: Component<SessionEditModalProps> = (props) => {
  const { updateSession } = useSessionCrud({ autoLoad: false });

  // Form state
  const [focusBlocks, setFocusBlocks] = createSignal<FormFocusBlock[]>([]);
  const [originalFocusBlocks, setOriginalFocusBlocks] = createSignal<FormFocusBlock[]>([]);
  const [sessionStatus, setSessionStatus] = createSignal<SessionStatus>('planned');
  const [originalStatus, setOriginalStatus] = createSignal<SessionStatus>('planned');

  // UI state
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = createSignal(false);
  const [blockToRemove, setBlockToRemove] = createSignal<{
    id: string;
    hasProgress: boolean;
  } | null>(null);

  // Computed values
  const isDirty = () =>
    hasFormChanged(originalFocusBlocks(), focusBlocks(), originalStatus(), sessionStatus());

  const totalDuration = createMemo(() => calculateTotalDuration(focusBlocks()));

  const currentStatusConfig = createMemo(() => {
    return SESSION_STATUSES.find((s) => s.value === sessionStatus()) || SESSION_STATUSES[0];
  });

  // Initialize form when session changes or modal opens
  createEffect(() => {
    if (props.isOpen && props.session) {
      const formState = sessionToFormState(props.session);
      setFocusBlocks(JSON.parse(JSON.stringify(formState)));
      setOriginalFocusBlocks(JSON.parse(JSON.stringify(formState)));
      setSessionStatus(props.session.status);
      setOriginalStatus(props.session.status);
      setError(null);
      setSuccess(false);
      setShowUnsavedWarning(false);
      setBlockToRemove(null);
      log.debug(`Initialized edit form for session: ${props.session.date}`);
    }
  });

  // Reset UI state when modal closes
  createEffect(() => {
    if (!props.isOpen) {
      setError(null);
      setSuccess(false);
      setShowUnsavedWarning(false);
      setBlockToRemove(null);
      setIsLoading(false);
    }
  });

  // Focus block management
  const addFocusBlock = () => {
    setFocusBlocks([...focusBlocks(), createEmptyFocusBlock()]);
    log.debug('Added new focus block');
  };

  const requestRemoveFocusBlock = (blockId: string) => {
    const block = focusBlocks().find((b) => b.id === blockId);
    if (!block) return;

    if (focusBlocks().length <= 1) {
      setError('Session must have at least one focus block');
      return;
    }

    if (block.hasProgress) {
      setBlockToRemove({ id: blockId, hasProgress: true });
    } else {
      removeFocusBlock(blockId);
    }
  };

  const removeFocusBlock = (blockId: string) => {
    if (focusBlocks().length > 1) {
      setFocusBlocks(focusBlocks().filter((b) => b.id !== blockId));
      setBlockToRemove(null);
      log.debug(`Removed focus block: ${blockId}`);
    }
  };

  const updateFocusBlock = (blockId: string, updates: Partial<FormFocusBlock>) => {
    setFocusBlocks(focusBlocks().map((b) => (b.id === blockId ? { ...b, ...updates } : b)));
  };

  const moveFocusBlock = (blockId: string, direction: 'up' | 'down') => {
    const blocks = [...focusBlocks()];
    const index = blocks.findIndex((b) => b.id === blockId);

    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];

    setFocusBlocks(blocks);
    log.debug(`Moved focus block ${blockId} ${direction}`);
  };

  // Timebox management
  const addTimebox = (blockId: string) => {
    setFocusBlocks(
      focusBlocks().map((b) => {
        if (b.id === blockId) {
          return {
            ...b,
            timeboxes: [...b.timeboxes, createEmptyTimebox()],
          };
        }
        return b;
      })
    );
    log.debug(`Added timebox to block: ${blockId}`);
  };

  const removeTimebox = (blockId: string, timeboxId: string) => {
    setFocusBlocks(
      focusBlocks().map((b) => {
        if (b.id === blockId && b.timeboxes.length > 1) {
          return {
            ...b,
            timeboxes: b.timeboxes.filter((tb) => tb.id !== timeboxId),
          };
        }
        return b;
      })
    );
    log.debug(`Removed timebox ${timeboxId} from block ${blockId}`);
  };

  const updateTimebox = (blockId: string, timeboxId: string, updates: Partial<FormTimebox>) => {
    setFocusBlocks(
      focusBlocks().map((b) => {
        if (b.id === blockId) {
          return {
            ...b,
            timeboxes: b.timeboxes.map((tb) => (tb.id === timeboxId ? { ...tb, ...updates } : tb)),
          };
        }
        return b;
      })
    );
  };

  const moveTimebox = (blockId: string, timeboxId: string, direction: 'up' | 'down') => {
    setFocusBlocks(
      focusBlocks().map((b) => {
        if (b.id !== blockId) return b;

        const timeboxes = [...b.timeboxes];
        const index = timeboxes.findIndex((tb) => tb.id === timeboxId);

        if (index === -1) return b;
        if (direction === 'up' && index === 0) return b;
        if (direction === 'down' && index === timeboxes.length - 1) return b;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        [timeboxes[index], timeboxes[newIndex]] = [timeboxes[newIndex], timeboxes[index]];

        return { ...b, timeboxes };
      })
    );
    log.debug(`Moved timebox ${timeboxId} ${direction} in block ${blockId}`);
  };

  // Validation
  const validateForm = (): string | null => {
    const blocks = focusBlocks();
    if (blocks.length === 0) {
      return 'At least one focus block is required';
    }

    for (const block of blocks) {
      if (!block.title.trim()) {
        return 'All focus blocks must have a title';
      }

      if (block.timeboxes.length === 0) {
        return `Focus block "${block.title}" must have at least one timebox`;
      }

      for (const timebox of block.timeboxes) {
        if (timebox.duration <= 0) {
          return 'All timeboxes must have a duration greater than 0';
        }
      }
    }

    return null;
  };

  // Form submission
  const handleSubmit = async () => {
    if (!props.session) return;

    setError(null);
    setSuccess(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    log.info(`Updating session for date: ${props.session.date}`);

    try {
      const updatedStoryBlocks = formStateToStoryBlocks(focusBlocks());
      const total = calculateTotalDuration(focusBlocks());

      const updatedSession = await updateSession(props.session.date, {
        storyBlocks: updatedStoryBlocks,
        status: sessionStatus(),
        totalDuration: total,
      });

      if (updatedSession) {
        setSuccess(true);
        log.info(`Session updated successfully for date: ${props.session.date}`);

        // Update original state to reflect saved changes
        setOriginalFocusBlocks(JSON.parse(JSON.stringify(focusBlocks())));
        setOriginalStatus(sessionStatus());

        // Notify parent and close after brief delay
        setTimeout(() => {
          props.onSessionUpdated?.(updatedSession);
          props.onClose();
        }, 1000);
      } else {
        setError('Failed to update session. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      log.error('Failed to update session', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading()) return;

    if (isDirty()) {
      setShowUnsavedWarning(true);
    } else {
      props.onClose();
    }
  };

  const confirmClose = () => {
    setShowUnsavedWarning(false);
    props.onClose();
  };

  const cancelClose = () => {
    setShowUnsavedWarning(false);
  };

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
          onClick={handleClose}
        />

        {/* Modal */}
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            'z-index': 10000,
            width: '100%',
            'max-width': '800px',
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
                  'margin-bottom': '16px',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    'font-size': '20px',
                    'font-weight': tempoDesign.typography.weights.bold,
                    color: tempoDesign.colors.foreground,
                  }}
                >
                  Edit Session
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  disabled={isLoading()}
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

              {/* Session Summary Bar */}
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '16px',
                  padding: '12px 16px',
                  background: tempoDesign.colors.muted,
                  'border-radius': tempoDesign.radius.md,
                  'flex-wrap': 'wrap',
                }}
              >
                {/* Date */}
                <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                  <span style={{ 'font-size': '14px', color: tempoDesign.colors.mutedForeground }}>
                    Date:
                  </span>
                  <span
                    style={{
                      'font-size': '14px',
                      'font-weight': tempoDesign.typography.weights.medium,
                      color: tempoDesign.colors.foreground,
                    }}
                  >
                    {formatSessionDate(props.session!.date)}
                  </span>
                </div>

                {/* Divider */}
                <div
                  style={{
                    width: '1px',
                    height: '20px',
                    background: tempoDesign.colors.border,
                  }}
                />

                {/* Status */}
                <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                  <span style={{ 'font-size': '14px', color: tempoDesign.colors.mutedForeground }}>
                    Status:
                  </span>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={sessionStatus()}
                      onChange={(e) => setSessionStatus(e.currentTarget.value as SessionStatus)}
                      disabled={isLoading()}
                      style={{
                        padding: '4px 28px 4px 10px',
                        'border-radius': tempoDesign.radius.sm,
                        border: `1px solid ${tempoDesign.colors.input}`,
                        background: tempoDesign.colors.background,
                        color: currentStatusConfig().color,
                        'font-size': '13px',
                        'font-weight': tempoDesign.typography.weights.medium,
                        'font-family': tempoDesign.typography.fontFamily,
                        cursor: 'pointer',
                        appearance: 'none',
                      }}
                    >
                      <For each={SESSION_STATUSES}>
                        {(status) => <option value={status.value}>{status.label}</option>}
                      </For>
                    </select>
                    <CaretDown
                      size={12}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        'pointer-events': 'none',
                        color: tempoDesign.colors.mutedForeground,
                      }}
                    />
                  </div>
                </div>

                {/* Divider */}
                <div
                  style={{
                    width: '1px',
                    height: '20px',
                    background: tempoDesign.colors.border,
                  }}
                />

                {/* Total Duration */}
                <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                  <Clock size={16} weight="bold" color={tempoDesign.colors.primary} />
                  <span
                    style={{
                      'font-size': '16px',
                      'font-weight': tempoDesign.typography.weights.bold,
                      color: tempoDesign.colors.foreground,
                    }}
                  >
                    {formatDuration(totalDuration())}
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <CardContent
              style={{
                display: 'flex',
                'flex-direction': 'column',
                gap: '24px',
                'overflow-y': 'auto',
                'flex-grow': 1,
                padding: '24px',
              }}
            >
              {/* Focus Blocks Section Header */}
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '8px',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    'font-size': '16px',
                    'font-weight': tempoDesign.typography.weights.semibold,
                    color: tempoDesign.colors.foreground,
                  }}
                >
                  Focus Blocks
                </h3>
                <span
                  style={{
                    'margin-left': '8px',
                    padding: '2px 8px',
                    'border-radius': tempoDesign.radius.full,
                    background: tempoDesign.colors.secondary,
                    'font-size': '12px',
                    color: tempoDesign.colors.mutedForeground,
                  }}
                >
                  {focusBlocks().length} {focusBlocks().length === 1 ? 'block' : 'blocks'}
                </span>
              </div>

              {/* Focus Block List */}
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '20px' }}>
                <For each={focusBlocks()}>
                  {(block, blockIndex) => {
                    const colorScheme = getBlockColor(blockIndex());
                    return (
                      <div
                        style={{
                          background: colorScheme.bg,
                          'border-radius': tempoDesign.radius.lg,
                          border: `1px solid ${colorScheme.border}`,
                          'border-left': `4px solid ${colorScheme.accent}`,
                          padding: '20px',
                          'box-shadow': tempoDesign.shadows.sm,
                        }}
                      >
                        {/* Focus Block Header */}
                        <div
                          style={{
                            display: 'flex',
                            'align-items': 'center',
                            gap: '12px',
                            'margin-bottom': '16px',
                          }}
                        >
                          {/* Block Number Badge */}
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              'border-radius': tempoDesign.radius.full,
                              background: colorScheme.accent,
                              color: '#FFFFFF',
                              display: 'flex',
                              'align-items': 'center',
                              'justify-content': 'center',
                              'font-size': '14px',
                              'font-weight': tempoDesign.typography.weights.bold,
                              'flex-shrink': 0,
                            }}
                          >
                            {blockIndex() + 1}
                          </div>

                          {/* Block Title */}
                          <span
                            style={{
                              'font-size': '15px',
                              'font-weight': tempoDesign.typography.weights.semibold,
                              color: tempoDesign.colors.foreground,
                            }}
                          >
                            Focus Block {blockIndex() + 1}
                          </span>

                          <Show when={block.hasProgress}>
                            <span
                              style={{
                                padding: '2px 8px',
                                'border-radius': tempoDesign.radius.sm,
                                background: `${tempoDesign.colors.amber[600]}20`,
                                'font-size': '12px',
                                color: tempoDesign.colors.amber[600],
                              }}
                            >
                              has progress
                            </span>
                          </Show>

                          {/* Spacer */}
                          <div style={{ flex: 1 }} />

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', 'align-items': 'center', gap: '4px' }}>
                            <ReorderButtons
                              onMoveUp={() => moveFocusBlock(block.id, 'up')}
                              onMoveDown={() => moveFocusBlock(block.id, 'down')}
                              isFirst={blockIndex() === 0}
                              isLast={blockIndex() === focusBlocks().length - 1}
                              disabled={isLoading()}
                              size="md"
                              itemLabel="focus block"
                            />
                            <Show when={focusBlocks().length > 1}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => requestRemoveFocusBlock(block.id)}
                                disabled={isLoading()}
                                aria-label="Remove focus block"
                                style={{
                                  height: '28px',
                                  width: '28px',
                                  padding: '4px',
                                  color: tempoDesign.colors.destructive,
                                }}
                              >
                                <Trash size={14} />
                              </Button>
                            </Show>
                          </div>
                        </div>

                        {/* Title Input */}
                        <div style={{ 'margin-bottom': '16px' }}>
                          <label
                            style={{
                              display: 'block',
                              'font-size': '14px',
                              'font-weight': tempoDesign.typography.weights.medium,
                              color: tempoDesign.colors.foreground,
                              'margin-bottom': '8px',
                            }}
                          >
                            Title *
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g., Feature Development, Design Review..."
                            value={block.title}
                            onInput={(e) =>
                              updateFocusBlock(block.id, { title: e.currentTarget.value })
                            }
                            disabled={isLoading()}
                            style={{
                              width: '100%',
                              background: tempoDesign.colors.background,
                            }}
                          />
                        </div>

                        {/* Timeboxes Section */}
                        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
                          <div
                            style={{
                              display: 'flex',
                              'align-items': 'center',
                              'justify-content': 'space-between',
                            }}
                          >
                            <span
                              style={{
                                'font-size': '14px',
                                'font-weight': tempoDesign.typography.weights.medium,
                                color: tempoDesign.colors.foreground,
                                display: 'flex',
                                'align-items': 'center',
                                gap: '8px',
                              }}
                            >
                              <Clock size={14} />
                              Timeboxes
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addTimebox(block.id)}
                              disabled={isLoading()}
                              aria-label="Add timebox"
                              style={{
                                gap: '4px',
                                padding: '4px 12px',
                                height: '28px',
                                color: colorScheme.accent,
                              }}
                            >
                              <Plus size={12} />
                              Add
                            </Button>
                          </div>

                          {/* Timebox List */}
                          <For each={block.timeboxes}>
                            {(timebox, tbIndex) => {
                              const typeConfig = TIMEBOX_TYPE_CONFIG[timebox.type];
                              return (
                                <div
                                  style={{
                                    background: tempoDesign.colors.background,
                                    'border-radius': tempoDesign.radius.md,
                                    border: `1px solid ${tempoDesign.colors.border}`,
                                    padding: '12px',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'grid',
                                      'grid-template-columns': 'auto 1fr 100px auto auto',
                                      gap: '12px',
                                      'align-items': 'center',
                                    }}
                                  >
                                    {/* Reorder Controls */}
                                    <ReorderButtons
                                      onMoveUp={() => moveTimebox(block.id, timebox.id, 'up')}
                                      onMoveDown={() => moveTimebox(block.id, timebox.id, 'down')}
                                      isFirst={tbIndex() === 0}
                                      isLast={tbIndex() === block.timeboxes.length - 1}
                                      disabled={isLoading()}
                                      size="sm"
                                      itemLabel="timebox"
                                    />

                                    {/* Type Select */}
                                    <div style={{ position: 'relative' }}>
                                      <select
                                        value={timebox.type}
                                        onChange={(e) =>
                                          updateTimebox(block.id, timebox.id, {
                                            type: e.currentTarget.value as TimeBoxType,
                                          })
                                        }
                                        disabled={isLoading()}
                                        style={{
                                          width: '100%',
                                          padding: '8px 36px 8px 12px',
                                          'border-radius': tempoDesign.radius.md,
                                          border: `1px solid ${tempoDesign.colors.input}`,
                                          background: typeConfig.bg,
                                          color: typeConfig.color,
                                          'font-size': '13px',
                                          'font-weight': tempoDesign.typography.weights.medium,
                                          'font-family': tempoDesign.typography.fontFamily,
                                          cursor: 'pointer',
                                          appearance: 'none',
                                        }}
                                      >
                                        <option value="work">Work</option>
                                        <option value="short-break">Short Break</option>
                                        <option value="long-break">Long Break</option>
                                        <option value="debrief">Debrief</option>
                                      </select>
                                      <CaretDown
                                        size={12}
                                        style={{
                                          position: 'absolute',
                                          right: '10px',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          'pointer-events': 'none',
                                          color: typeConfig.color,
                                        }}
                                      />
                                    </div>

                                    {/* Duration Input */}
                                    <NeoNumberInput
                                      value={timebox.duration}
                                      onChange={(value) =>
                                        updateTimebox(block.id, timebox.id, {
                                          duration: value,
                                        })
                                      }
                                      min={1}
                                      max={180}
                                      step={5}
                                      disabled={isLoading()}
                                      width="60px"
                                      suffix="min"
                                      aria-label="Timebox duration in minutes"
                                    />

                                    {/* Status indicator */}
                                    <Show when={timebox.status && timebox.status !== 'todo'}>
                                      <div
                                        style={{
                                          display: 'flex',
                                          'align-items': 'center',
                                          gap: '4px',
                                          padding: '4px 10px',
                                          'border-radius': tempoDesign.radius.sm,
                                          background:
                                            timebox.status === 'completed'
                                              ? `${tempoDesign.colors.frog}20`
                                              : timebox.status === 'cancelled'
                                                ? 'rgba(249, 115, 22, 0.2)'
                                                : `${tempoDesign.colors.amber[600]}20`,
                                          color:
                                            timebox.status === 'completed'
                                              ? tempoDesign.colors.frog
                                              : timebox.status === 'cancelled'
                                                ? '#F97316'
                                                : tempoDesign.colors.amber[600],
                                          'font-size': '12px',
                                          'font-weight': tempoDesign.typography.weights.medium,
                                          'white-space': 'nowrap',
                                        }}
                                      >
                                        {timebox.status === 'cancelled' ? (
                                          <XCircle size={12} weight="bold" />
                                        ) : (
                                          <Check size={12} weight="bold" />
                                        )}
                                        {timebox.status === 'completed'
                                          ? 'Done'
                                          : timebox.status === 'cancelled'
                                            ? 'Cancelled'
                                            : 'Active'}
                                      </div>
                                    </Show>
                                    <Show when={!timebox.status || timebox.status === 'todo'}>
                                      <div style={{ width: '60px' }} />
                                    </Show>

                                    {/* Delete Button */}
                                    <Show when={block.timeboxes.length > 1}>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeTimebox(block.id, timebox.id)}
                                        disabled={isLoading()}
                                        aria-label="Remove timebox"
                                        style={{
                                          color: tempoDesign.colors.destructive,
                                          height: '28px',
                                          width: '28px',
                                          opacity: 0.7,
                                        }}
                                      >
                                        <Trash size={14} />
                                      </Button>
                                    </Show>
                                    <Show when={block.timeboxes.length <= 1}>
                                      <div style={{ width: '28px' }} />
                                    </Show>
                                  </div>
                                </div>
                              );
                            }}
                          </For>
                        </div>

                        {/* Block Duration Summary */}
                        <div
                          style={{
                            display: 'flex',
                            'align-items': 'center',
                            'justify-content': 'flex-end',
                            gap: '8px',
                            'margin-top': '16px',
                            'padding-top': '12px',
                            'border-top': `1px dashed ${colorScheme.border}`,
                          }}
                        >
                          <span
                            style={{
                              'font-size': '13px',
                              color: tempoDesign.colors.mutedForeground,
                            }}
                          >
                            Block Duration:
                          </span>
                          <span
                            style={{
                              'font-size': '14px',
                              'font-weight': tempoDesign.typography.weights.semibold,
                              color: colorScheme.accent,
                            }}
                          >
                            {formatDuration(calculateBlockDuration(block))}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                </For>

                {/* Add Focus Block Button (Dashed Card Style) */}
                <div
                  onClick={addFocusBlock}
                  role="button"
                  tabIndex={0}
                  aria-label="Add focus block"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      addFocusBlock();
                    }
                  }}
                  style={{
                    border: `2px dashed ${tempoDesign.colors.border}`,
                    'border-radius': tempoDesign.radius.lg,
                    padding: '24px',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    color: tempoDesign.colors.mutedForeground,
                    transition: 'all 0.2s ease',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = tempoDesign.colors.primary;
                    e.currentTarget.style.color = tempoDesign.colors.primary;
                    e.currentTarget.style.background = `${tempoDesign.colors.primary}08`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = tempoDesign.colors.border;
                    e.currentTarget.style.color = tempoDesign.colors.mutedForeground;
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Plus size={20} />
                  <span
                    style={{
                      'font-size': '15px',
                      'font-weight': tempoDesign.typography.weights.medium,
                    }}
                  >
                    Add Focus Block
                  </span>
                </div>
              </div>

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

              {/* Success Message */}
              <Show when={success()}>
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '12px',
                    'background-color': `${tempoDesign.colors.frog}15`,
                    border: `1px solid ${tempoDesign.colors.frog}30`,
                    'border-radius': tempoDesign.radius.md,
                    padding: '12px 16px',
                    'font-size': '14px',
                    color: tempoDesign.colors.frog,
                  }}
                >
                  <Check size={18} weight="bold" />
                  Session updated successfully!
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
                onClick={handleClose}
                disabled={isLoading()}
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
                onClick={handleSubmit}
                disabled={isLoading() || !isDirty()}
                style={{
                  flex: 1,
                  height: '52px',
                  'font-size': '15px',
                  'font-weight': tempoDesign.typography.weights.semibold,
                  opacity: !isDirty() && !isLoading() ? 0.5 : 1,
                }}
              >
                {isLoading() ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Unsaved Changes Warning Modal */}
        <Show when={showUnsavedWarning()}>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              'z-index': 52,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
            }}
            onClick={cancelClose}
          >
            <Card
              style={{
                'max-width': '420px',
                margin: '0 16px',
                border: `1px solid ${tempoDesign.colors.border}`,
                'box-shadow': tempoDesign.shadows.lg,
              }}
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <CardContent style={{ padding: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '12px',
                    'margin-bottom': '16px',
                  }}
                >
                  <Warning size={24} weight="fill" color={tempoDesign.colors.amber[600]} />
                  <h3
                    style={{
                      margin: 0,
                      'font-size': '18px',
                      'font-weight': tempoDesign.typography.weights.semibold,
                      color: tempoDesign.colors.foreground,
                    }}
                  >
                    Unsaved Changes
                  </h3>
                </div>
                <p
                  style={{
                    margin: '0 0 24px 0',
                    'font-size': '14px',
                    color: tempoDesign.colors.mutedForeground,
                    'line-height': tempoDesign.typography.lineHeights.normal,
                  }}
                >
                  You have unsaved changes. Are you sure you want to close without saving?
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button
                    variant="outline"
                    onClick={cancelClose}
                    style={{
                      flex: 1,
                      height: '44px',
                      'font-weight': tempoDesign.typography.weights.medium,
                    }}
                  >
                    Keep Editing
                  </Button>
                  <Button
                    onClick={confirmClose}
                    style={{
                      flex: 1,
                      height: '44px',
                      background: tempoDesign.colors.destructive,
                      color: '#FFFFFF',
                      'font-weight': tempoDesign.typography.weights.medium,
                    }}
                  >
                    Discard Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Show>

        {/* Remove Focus Block Confirmation Modal */}
        <Show when={blockToRemove()}>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              'z-index': 52,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
            }}
            onClick={() => setBlockToRemove(null)}
          >
            <Card
              style={{
                'max-width': '420px',
                margin: '0 16px',
                border: `1px solid ${tempoDesign.colors.border}`,
                'box-shadow': tempoDesign.shadows.lg,
              }}
              onClick={(e: MouseEvent) => e.stopPropagation()}
            >
              <CardContent style={{ padding: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '12px',
                    'margin-bottom': '16px',
                  }}
                >
                  <Warning size={24} weight="fill" color={tempoDesign.colors.amber[600]} />
                  <h3
                    style={{
                      margin: 0,
                      'font-size': '18px',
                      'font-weight': tempoDesign.typography.weights.semibold,
                      color: tempoDesign.colors.foreground,
                    }}
                  >
                    Remove Focus Block with Progress
                  </h3>
                </div>
                <p
                  style={{
                    margin: '0 0 24px 0',
                    'font-size': '14px',
                    color: tempoDesign.colors.mutedForeground,
                    'line-height': tempoDesign.typography.lineHeights.normal,
                  }}
                >
                  This focus block has progress recorded. Removing it will delete all associated
                  progress data. Are you sure you want to continue?
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button
                    variant="outline"
                    onClick={() => setBlockToRemove(null)}
                    style={{
                      flex: 1,
                      height: '44px',
                      'font-weight': tempoDesign.typography.weights.medium,
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => removeFocusBlock(blockToRemove()!.id)}
                    style={{
                      flex: 1,
                      height: '44px',
                      background: tempoDesign.colors.destructive,
                      color: '#FFFFFF',
                      'font-weight': tempoDesign.typography.weights.medium,
                    }}
                  >
                    Remove Block
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Show>

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
