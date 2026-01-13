import { Component, createSignal, For, Show, createEffect, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';
import {
  X,
  Plus,
  Trash,
  Clock,
  ListBullets,
  Tray,
  CaretDown,
  CalendarCheck,
  ArrowCounterClockwise,
  Warning,
} from 'phosphor-solid';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { tempoDesign } from '../../theme/tempo-design';
import { useSessionCrud } from '../hooks/useSessionCrud';
import { TaskPersistenceService } from '../../services/task-persistence.service';
import { QueueService } from '../../queue/services/queue.service';
import type { QueueTask } from '../../queue/types';
import type { Session, StoryBlock, TimeBox, TimeBoxTask, TimeBoxType, Task } from '../../lib/types';
import { logger } from '../../../../lib/logger';

const log = logger.create('SessionCreateModal');

interface SessionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated?: (session: Session) => void;
}

// Internal types for form state
interface FormTimebox {
  id: string;
  type: TimeBoxType;
  duration: number;
  tasks: string[];
}

interface FormFocusBlock {
  id: string;
  title: string;
  totalDuration: number;
  timeboxes: FormTimebox[];
  sourceTaskId?: string; // Track source for marking as scheduled
}

// Helper functions
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const calculateTotalDuration = (focusBlocks: FormFocusBlock[]): number => {
  return focusBlocks.reduce((total, block) => {
    const blockDuration = block.timeboxes.reduce((sum, tb) => sum + tb.duration, 0);
    return total + blockDuration;
  }, 0);
};

const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createEmptyTimebox = (): FormTimebox => ({
  id: generateId(),
  type: 'work',
  duration: 25,
  tasks: [],
});

const createEmptyFocusBlock = (): FormFocusBlock => ({
  id: generateId(),
  title: '',
  totalDuration: 25,
  timeboxes: [createEmptyTimebox()],
});

export const SessionCreateModal: Component<SessionCreateModalProps> = (props) => {
  const { createSession, sessionExistsForDate } = useSessionCrud({ autoLoad: false });

  // Form state
  const [sessionDate, setSessionDate] = createSignal(formatDateForInput(new Date()));
  const [sessionTitle, setSessionTitle] = createSignal('');
  const [focusBlocks, setFocusBlocks] = createSignal<FormFocusBlock[]>([createEmptyFocusBlock()]);

  // Backlog state
  const [backlogTasks, setBacklogTasks] = createSignal<Task[]>([]);
  const [selectedBacklogTasks, setSelectedBacklogTasks] = createSignal<Set<string>>(new Set());
  const [showBacklogSection, setShowBacklogSection] = createSignal(true);

  // Scheduled tasks from Queue (tasks scheduled for the selected date)
  const [scheduledTasks, setScheduledTasks] = createSignal<QueueTask[]>([]);
  const [showScheduledSection, setShowScheduledSection] = createSignal(true);

  // UI state
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal(false);
  const [dateError, setDateError] = createSignal<string | null>(null);

  // Undo state for scheduled tasks addition
  const [undoState, setUndoState] = createSignal<{
    previousBlocks: FormFocusBlock[];
    addedTaskIds: string[];
    timeoutId?: ReturnType<typeof setTimeout>;
  } | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = createSignal<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
    variant?: 'destructive' | 'warning';
  } | null>(null);

  // Reset form when modal closes
  createEffect(() => {
    if (!props.isOpen) {
      resetForm();
    }
  });

  // Load backlog tasks on mount
  createEffect(() => {
    if (props.isOpen) {
      TaskPersistenceService.getBacklogTasks().then((tasks) => {
        setBacklogTasks(tasks);
        log.debug(`Loaded ${tasks.length} backlog tasks`);
      });
    }
  });

  const resetForm = () => {
    // Clear any pending undo timeout
    const undo = undoState();
    if (undo?.timeoutId) {
      clearTimeout(undo.timeoutId);
    }

    setSessionDate(formatDateForInput(new Date()));
    setSessionTitle('');
    setFocusBlocks([createEmptyFocusBlock()]);
    setBacklogTasks([]);
    setSelectedBacklogTasks(new Set<string>());
    setShowBacklogSection(true);
    setScheduledTasks([]);
    setShowScheduledSection(true);
    setError(null);
    setSuccess(false);
    setDateError(null);
    setIsLoading(false);
    setUndoState(null);
    setConfirmModal(null);
  };

  // Cleanup undo timeout on unmount
  onCleanup(() => {
    const undo = undoState();
    if (undo?.timeoutId) {
      clearTimeout(undo.timeoutId);
    }
  });

  // Check date availability when date changes
  const handleDateChange = async (newDate: string) => {
    setSessionDate(newDate);
    setDateError(null);

    if (newDate) {
      const exists = await sessionExistsForDate(newDate);
      if (exists) {
        setDateError('A session already exists for this date');
      }

      // Load scheduled tasks for this date from the Queue
      const scheduled = await QueueService.getScheduledTasksForDate(newDate);
      setScheduledTasks(scheduled);
      log.debug(`Loaded ${scheduled.length} scheduled tasks for ${newDate}`);
    } else {
      setScheduledTasks([]);
    }
  };

  // Load scheduled tasks for today when modal opens
  createEffect(() => {
    if (props.isOpen) {
      const today = sessionDate();
      QueueService.getScheduledTasksForDate(today).then((tasks) => {
        setScheduledTasks(tasks);
        log.debug(`Loaded ${tasks.length} scheduled tasks for ${today}`);
      });
    }
  });

  // Backlog task selection
  const toggleBacklogTask = (taskId: string) => {
    const current = selectedBacklogTasks();
    const next = new Set(current);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }
    setSelectedBacklogTasks(next);
  };

  const addSelectedBacklogTasksAsFocusBlocks = () => {
    const selected = selectedBacklogTasks();
    const tasks = backlogTasks().filter((t) => selected.has(t.id));

    const newBlocks = tasks.map((task) => ({
      id: generateId(),
      title: task.title,
      totalDuration: task.duration,
      timeboxes: [
        {
          id: generateId(),
          type: 'work' as TimeBoxType,
          duration: task.duration,
          tasks: [],
        },
      ],
      sourceTaskId: task.id, // Track source for marking as scheduled
    }));

    setFocusBlocks([...focusBlocks(), ...newBlocks]);
    setSelectedBacklogTasks(new Set<string>());
    log.info(`Added ${newBlocks.length} focus blocks from backlog`);
  };

  // Add all scheduled tasks as focus blocks
  const addScheduledTasksAsFocusBlocks = () => {
    const tasks = scheduledTasks();
    if (tasks.length === 0) return;

    // Clear any existing undo timeout
    const existingUndo = undoState();
    if (existingUndo?.timeoutId) {
      clearTimeout(existingUndo.timeoutId);
    }

    // Save current state for undo
    const previousBlocks = [...focusBlocks()];
    const addedTaskIds = tasks.map((t) => t.id);

    const newBlocks = tasks.map((task) => ({
      id: generateId(),
      title: task.title,
      totalDuration: task.duration,
      timeboxes: [
        {
          id: generateId(),
          type: 'work' as TimeBoxType,
          duration: task.duration,
          tasks: [],
        },
      ],
      sourceTaskId: task.id, // Track source for updating scheduledSessionId
    }));

    // Replace empty initial block or add to existing
    const currentBlocks = focusBlocks();
    if (currentBlocks.length === 1 && !currentBlocks[0].title) {
      setFocusBlocks(newBlocks);
    } else {
      setFocusBlocks([...currentBlocks, ...newBlocks]);
    }

    // Set undo state with 10 second timeout
    const timeoutId = setTimeout(() => {
      setUndoState(null);
    }, 10000);

    setUndoState({
      previousBlocks,
      addedTaskIds,
      timeoutId,
    });

    log.info(`Added ${newBlocks.length} focus blocks from scheduled tasks`);
  };

  // Undo the last scheduled tasks addition
  const undoAddScheduledTasks = () => {
    const undo = undoState();
    if (!undo) return;

    // Clear the timeout
    if (undo.timeoutId) {
      clearTimeout(undo.timeoutId);
    }

    // Restore previous state
    setFocusBlocks(undo.previousBlocks);
    setUndoState(null);

    log.info('Undid scheduled tasks addition');
  };

  // Return a focus block back to the queue (for blocks that came from scheduled tasks)
  const returnFocusBlockToQueue = (blockId: string) => {
    const block = focusBlocks().find((b) => b.id === blockId);
    if (!block) return;

    setConfirmModal({
      isOpen: true,
      title: 'Return to Queue',
      message: `Remove "${block.title || 'Untitled'}" from this session? The task will remain in your queue.`,
      confirmLabel: 'Remove from Session',
      variant: 'warning',
      onConfirm: () => {
        // Remove the focus block
        if (focusBlocks().length > 1) {
          setFocusBlocks(focusBlocks().filter((b) => b.id !== blockId));
          log.info(`Returned focus block ${blockId} to queue`);
        } else {
          // If it's the last block, replace with empty
          setFocusBlocks([createEmptyFocusBlock()]);
          log.info(`Returned last focus block ${blockId} to queue, created empty block`);
        }
        setConfirmModal(null);
      },
    });
  };

  // Confirm deletion of a focus block
  const confirmRemoveFocusBlock = (blockId: string) => {
    const block = focusBlocks().find((b) => b.id === blockId);
    if (!block || focusBlocks().length <= 1) return;

    setConfirmModal({
      isOpen: true,
      title: 'Delete Focus Block',
      message: `Are you sure you want to delete "${block.title || 'Untitled'}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
      onConfirm: () => {
        setFocusBlocks(focusBlocks().filter((s) => s.id !== blockId));
        setConfirmModal(null);
        log.debug(`Removed focus block: ${blockId}`);
      },
    });
  };

  // Focus block management
  const addFocusBlock = () => {
    setFocusBlocks([...focusBlocks(), createEmptyFocusBlock()]);
    log.debug('Added new focus block');
  };

  const updateFocusBlock = (blockId: string, updates: Partial<FormFocusBlock>) => {
    setFocusBlocks(focusBlocks().map((s) => (s.id === blockId ? { ...s, ...updates } : s)));
  };

  // Timebox management
  const addTimebox = (blockId: string) => {
    setFocusBlocks(
      focusBlocks().map((s) => {
        if (s.id === blockId) {
          return {
            ...s,
            timeboxes: [...s.timeboxes, createEmptyTimebox()],
          };
        }
        return s;
      })
    );
    log.debug(`Added timebox to focus block: ${blockId}`);
  };

  const removeTimebox = (blockId: string, timeboxId: string) => {
    setFocusBlocks(
      focusBlocks().map((s) => {
        if (s.id === blockId && s.timeboxes.length > 1) {
          return {
            ...s,
            timeboxes: s.timeboxes.filter((tb) => tb.id !== timeboxId),
          };
        }
        return s;
      })
    );
    log.debug(`Removed timebox ${timeboxId} from focus block ${blockId}`);
  };

  const updateTimebox = (blockId: string, timeboxId: string, updates: Partial<FormTimebox>) => {
    setFocusBlocks(
      focusBlocks().map((s) => {
        if (s.id === blockId) {
          return {
            ...s,
            timeboxes: s.timeboxes.map((tb) => (tb.id === timeboxId ? { ...tb, ...updates } : tb)),
          };
        }
        return s;
      })
    );
  };

  // Task management within timeboxes
  const addTask = (blockId: string, timeboxId: string) => {
    setFocusBlocks(
      focusBlocks().map((s) => {
        if (s.id === blockId) {
          return {
            ...s,
            timeboxes: s.timeboxes.map((tb) => {
              if (tb.id === timeboxId) {
                return { ...tb, tasks: [...tb.tasks, ''] };
              }
              return tb;
            }),
          };
        }
        return s;
      })
    );
  };

  const removeTask = (blockId: string, timeboxId: string, taskIndex: number) => {
    setFocusBlocks(
      focusBlocks().map((s) => {
        if (s.id === blockId) {
          return {
            ...s,
            timeboxes: s.timeboxes.map((tb) => {
              if (tb.id === timeboxId) {
                const newTasks = [...tb.tasks];
                newTasks.splice(taskIndex, 1);
                return { ...tb, tasks: newTasks };
              }
              return tb;
            }),
          };
        }
        return s;
      })
    );
  };

  const updateTask = (blockId: string, timeboxId: string, taskIndex: number, value: string) => {
    setFocusBlocks(
      focusBlocks().map((s) => {
        if (s.id === blockId) {
          return {
            ...s,
            timeboxes: s.timeboxes.map((tb) => {
              if (tb.id === timeboxId) {
                const newTasks = [...tb.tasks];
                newTasks[taskIndex] = value;
                return { ...tb, tasks: newTasks };
              }
              return tb;
            }),
          };
        }
        return s;
      })
    );
  };

  // Validation
  const validateForm = (): string | null => {
    if (!sessionDate()) {
      return 'Please select a date';
    }

    if (dateError()) {
      return dateError();
    }

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
          return `All timeboxes must have a duration greater than 0`;
        }
      }
    }

    return null;
  };

  // Convert form data to session format
  const convertToSession = (): {
    date: string;
    storyBlocks: StoryBlock[];
    totalDuration: number;
  } => {
    const convertedBlocks: StoryBlock[] = focusBlocks().map((formBlock) => {
      const timeBoxes: TimeBox[] = formBlock.timeboxes.map((formTb) => {
        const tasks: TimeBoxTask[] = formTb.tasks
          .filter((t) => t.trim())
          .map((title) => ({
            title,
            duration: 0,
            status: 'todo' as const,
          }));

        return {
          type: formTb.type,
          duration: formTb.duration,
          tasks: tasks.length > 0 ? tasks : undefined,
          status: 'todo' as const,
        };
      });

      const totalDuration = timeBoxes.reduce((sum, tb) => sum + tb.duration, 0);

      return {
        id: formBlock.id,
        title: formBlock.title,
        timeBoxes,
        totalDuration,
        progress: 0,
        taskIds: [],
      };
    });

    return {
      date: sessionDate(),
      storyBlocks: convertedBlocks,
      totalDuration: calculateTotalDuration(focusBlocks()),
    };
  };

  // Form submission
  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    log.info(`Creating session for date: ${sessionDate()}`);

    try {
      const sessionData = convertToSession();
      const newSession = await createSession({
        date: sessionData.date,
        storyBlocks: sessionData.storyBlocks,
        totalDuration: sessionData.totalDuration,
        status: 'planned',
      });

      if (newSession) {
        // Mark backlog tasks as scheduled
        const usedTaskIds = focusBlocks()
          .filter((b) => b.sourceTaskId)
          .map((b) => b.sourceTaskId as string);

        for (const taskId of usedTaskIds) {
          await TaskPersistenceService.scheduleTask(taskId, sessionDate());
        }

        if (usedTaskIds.length > 0) {
          log.info(`Marked ${usedTaskIds.length} backlog tasks as scheduled`);
        }

        setSuccess(true);
        log.info(`Session created successfully for date: ${sessionDate()}`);

        // Notify parent and close after brief delay
        setTimeout(() => {
          props.onSessionCreated?.(newSession);
          props.onClose();
        }, 1000);
      } else {
        setError('Failed to create session. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      log.error('Failed to create session', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading()) {
      props.onClose();
    }
  };

  return (
    <Show when={props.isOpen}>
      <Portal>
        {/* Backdrop */}
        <div
          style={{
            position: 'fixed',
            inset: '0',
            background: 'rgba(0, 0, 0, 0.5)',
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
            'max-width': '700px',
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
            <CardHeader style={{ 'padding-bottom': '12px', 'flex-shrink': 0 }}>
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'space-between',
                }}
              >
                <CardTitle style={{ 'font-size': tempoDesign.typography.sizes.lg }}>
                  Create New Session
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  disabled={isLoading()}
                  style={{
                    height: '32px',
                    width: '32px',
                    'border-radius': tempoDesign.radius.full,
                  }}
                >
                  <X size={16} />
                </Button>
              </div>
              <CardDescription style={{ 'margin-top': '8px' }}>
                Plan your focus session with focus blocks and timeboxes
              </CardDescription>
            </CardHeader>

            {/* Scrollable Content */}
            <CardContent
              style={{
                display: 'flex',
                'flex-direction': 'column',
                gap: '20px',
                'overflow-y': 'auto',
                'flex-grow': 1,
                'padding-bottom': '16px',
              }}
            >
              {/* Date and Title Section */}
              <div style={{ display: 'flex', gap: '16px', 'flex-wrap': 'wrap' }}>
                {/* Date Picker */}
                <div style={{ flex: '1', 'min-width': '200px' }}>
                  <label
                    style={{
                      display: 'block',
                      'font-size': tempoDesign.typography.sizes.sm,
                      'font-weight': tempoDesign.typography.weights.medium,
                      color: tempoDesign.colors.foreground,
                      'margin-bottom': '8px',
                    }}
                  >
                    Date *
                  </label>
                  <Input
                    type="date"
                    value={sessionDate()}
                    onInput={(e) => handleDateChange(e.currentTarget.value)}
                    disabled={isLoading()}
                    style={{
                      width: '100%',
                      ...(dateError() && {
                        'border-color': tempoDesign.colors.destructive,
                      }),
                    }}
                  />
                  <Show when={dateError()}>
                    <p
                      style={{
                        'font-size': tempoDesign.typography.sizes.xs,
                        color: tempoDesign.colors.destructive,
                        margin: '4px 0 0 0',
                      }}
                    >
                      {dateError()}
                    </p>
                  </Show>
                </div>

                {/* Session Title (optional) */}
                <div style={{ flex: '1', 'min-width': '200px' }}>
                  <label
                    style={{
                      display: 'block',
                      'font-size': tempoDesign.typography.sizes.sm,
                      'font-weight': tempoDesign.typography.weights.medium,
                      color: tempoDesign.colors.foreground,
                      'margin-bottom': '8px',
                    }}
                  >
                    Session Title (optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Morning Deep Work"
                    value={sessionTitle()}
                    onInput={(e) => setSessionTitle(e.currentTarget.value)}
                    disabled={isLoading()}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Scheduled Tasks Section - Tasks already scheduled for this date */}
              <Show when={scheduledTasks().length > 0}>
                <div
                  style={{
                    background: `${tempoDesign.colors.frog}08`,
                    border: `1px solid ${tempoDesign.colors.frog}30`,
                    'border-radius': tempoDesign.radius.lg,
                    padding: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'space-between',
                      'margin-bottom': showScheduledSection() ? '12px' : '0',
                      cursor: 'pointer',
                    }}
                    onClick={() => setShowScheduledSection(!showScheduledSection())}
                  >
                    <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                      <CalendarCheck size={20} color={tempoDesign.colors.frog} />
                      <span
                        style={{
                          'font-size': '15px',
                          'font-weight': '600',
                          color: tempoDesign.colors.foreground,
                        }}
                      >
                        Scheduled for this Date
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          'border-radius': tempoDesign.radius.full,
                          background: tempoDesign.colors.frog,
                          color: '#FFFFFF',
                          'font-size': '12px',
                          'font-weight': '600',
                        }}
                      >
                        {scheduledTasks().length}
                      </span>
                    </div>
                    <CaretDown
                      size={16}
                      style={{
                        transform: showScheduledSection() ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: tempoDesign.colors.mutedForeground,
                      }}
                    />
                  </div>

                  <Show when={showScheduledSection()}>
                    <p
                      style={{
                        margin: '0 0 12px 0',
                        'font-size': '13px',
                        color: tempoDesign.colors.mutedForeground,
                      }}
                    >
                      These tasks were scheduled from The Queue for this date
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        'flex-direction': 'column',
                        gap: '8px',
                        'margin-bottom': '12px',
                      }}
                    >
                      <For each={scheduledTasks()}>
                        {(task) => (
                          <div
                            style={{
                              display: 'flex',
                              'align-items': 'center',
                              gap: '12px',
                              padding: '12px',
                              background: tempoDesign.colors.background,
                              border: `1px solid ${tempoDesign.colors.frog}30`,
                              'border-radius': tempoDesign.radius.md,
                            }}
                          >
                            {/* Checkmark icon */}
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                'border-radius': tempoDesign.radius.sm,
                                background: `${tempoDesign.colors.frog}20`,
                                display: 'flex',
                                'align-items': 'center',
                                'justify-content': 'center',
                                'flex-shrink': 0,
                              }}
                            >
                              <CalendarCheck size={12} color={tempoDesign.colors.frog} />
                            </div>

                            {/* Task info */}
                            <div style={{ flex: 1, 'min-width': 0 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  'align-items': 'center',
                                  gap: '8px',
                                }}
                              >
                                <span
                                  style={{
                                    'font-weight': '500',
                                    color: tempoDesign.colors.foreground,
                                    overflow: 'hidden',
                                    'text-overflow': 'ellipsis',
                                    'white-space': 'nowrap',
                                  }}
                                >
                                  {task.title}
                                </span>
                                <Show when={task.isFrog}>
                                  <span
                                    style={{
                                      padding: '2px 6px',
                                      'border-radius': tempoDesign.radius.sm,
                                      background: `${tempoDesign.colors.frog}20`,
                                      'font-size': '10px',
                                      'font-weight': '600',
                                      color: tempoDesign.colors.frog,
                                    }}
                                  >
                                    FROG
                                  </span>
                                </Show>
                              </div>
                            </div>

                            {/* Duration */}
                            <span
                              style={{
                                padding: '4px 8px',
                                'border-radius': tempoDesign.radius.sm,
                                background: tempoDesign.colors.muted,
                                'font-size': '12px',
                                'font-weight': '500',
                                color: tempoDesign.colors.mutedForeground,
                                'flex-shrink': 0,
                              }}
                            >
                              {task.duration} min
                            </span>
                          </div>
                        )}
                      </For>
                    </div>

                    <Button
                      onClick={addScheduledTasksAsFocusBlocks}
                      style={{
                        width: '100%',
                        height: '40px',
                        background: tempoDesign.colors.frog,
                        color: '#FFFFFF',
                      }}
                    >
                      Add {scheduledTasks().length} Scheduled Task
                      {scheduledTasks().length > 1 ? 's' : ''} as Focus Blocks
                    </Button>
                  </Show>
                </div>
              </Show>

              {/* Pull from Backlog Section */}
              <Show when={backlogTasks().length > 0}>
                <div
                  style={{
                    background: `${tempoDesign.colors.primary}08`,
                    border: `1px solid ${tempoDesign.colors.primary}20`,
                    'border-radius': tempoDesign.radius.lg,
                    padding: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'space-between',
                      'margin-bottom': showBacklogSection() ? '12px' : '0',
                      cursor: 'pointer',
                    }}
                    onClick={() => setShowBacklogSection(!showBacklogSection())}
                  >
                    <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                      <Tray size={20} color={tempoDesign.colors.primary} />
                      <span
                        style={{
                          'font-size': '15px',
                          'font-weight': '600',
                          color: tempoDesign.colors.foreground,
                        }}
                      >
                        Pull from Backlog
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          'border-radius': tempoDesign.radius.full,
                          background: tempoDesign.colors.primary,
                          color: '#FFFFFF',
                          'font-size': '12px',
                          'font-weight': '600',
                        }}
                      >
                        {backlogTasks().length}
                      </span>
                    </div>
                    <CaretDown
                      size={16}
                      style={{
                        transform: showBacklogSection() ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: tempoDesign.colors.mutedForeground,
                      }}
                    />
                  </div>

                  <Show when={showBacklogSection()}>
                    <p
                      style={{
                        margin: '0 0 12px 0',
                        'font-size': '13px',
                        color: tempoDesign.colors.mutedForeground,
                      }}
                    >
                      Select tasks from your backlog to add as focus blocks
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        'flex-direction': 'column',
                        gap: '8px',
                        'margin-bottom': '12px',
                      }}
                    >
                      <For each={backlogTasks()}>
                        {(task) => (
                          <div
                            onClick={() => toggleBacklogTask(task.id)}
                            style={{
                              display: 'flex',
                              'align-items': 'center',
                              gap: '12px',
                              padding: '12px',
                              background: selectedBacklogTasks().has(task.id)
                                ? `${tempoDesign.colors.primary}15`
                                : tempoDesign.colors.background,
                              border: `1px solid ${selectedBacklogTasks().has(task.id) ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                              'border-radius': tempoDesign.radius.md,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {/* Checkbox */}
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                'border-radius': tempoDesign.radius.sm,
                                border: `2px solid ${selectedBacklogTasks().has(task.id) ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                                background: selectedBacklogTasks().has(task.id)
                                  ? tempoDesign.colors.primary
                                  : 'transparent',
                                display: 'flex',
                                'align-items': 'center',
                                'justify-content': 'center',
                                'flex-shrink': 0,
                              }}
                            >
                              <Show when={selectedBacklogTasks().has(task.id)}>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path
                                    d="M2 6L5 9L10 3"
                                    stroke="white"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                  />
                                </svg>
                              </Show>
                            </div>

                            {/* Task info */}
                            <div style={{ flex: 1, 'min-width': 0 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  'align-items': 'center',
                                  gap: '8px',
                                  'margin-bottom': '4px',
                                }}
                              >
                                <span
                                  style={{
                                    'font-weight': '500',
                                    color: tempoDesign.colors.foreground,
                                    overflow: 'hidden',
                                    'text-overflow': 'ellipsis',
                                    'white-space': 'nowrap',
                                  }}
                                >
                                  {task.title}
                                </span>
                                <Show when={task.isFrog}>
                                  <span
                                    style={{
                                      padding: '2px 6px',
                                      'border-radius': tempoDesign.radius.sm,
                                      background: `${tempoDesign.colors.frog}20`,
                                      'font-size': '10px',
                                      'font-weight': '600',
                                      color: tempoDesign.colors.frog,
                                    }}
                                  >
                                    FROG
                                  </span>
                                </Show>
                              </div>
                              <Show when={task.source?.focusBlockTitle}>
                                <span
                                  style={{
                                    'font-size': '12px',
                                    color: tempoDesign.colors.mutedForeground,
                                  }}
                                >
                                  From: {task.source?.focusBlockTitle}
                                </span>
                              </Show>
                            </div>

                            {/* Duration */}
                            <span
                              style={{
                                padding: '4px 8px',
                                'border-radius': tempoDesign.radius.sm,
                                background: tempoDesign.colors.muted,
                                'font-size': '12px',
                                'font-weight': '500',
                                color: tempoDesign.colors.mutedForeground,
                                'flex-shrink': 0,
                              }}
                            >
                              {task.duration} min
                            </span>
                          </div>
                        )}
                      </For>
                    </div>

                    <Show when={selectedBacklogTasks().size > 0}>
                      <Button
                        onClick={addSelectedBacklogTasksAsFocusBlocks}
                        style={{
                          width: '100%',
                          height: '40px',
                          background: tempoDesign.colors.primary,
                          color: '#FFFFFF',
                        }}
                      >
                        Add {selectedBacklogTasks().size} Task
                        {selectedBacklogTasks().size > 1 ? 's' : ''} as Focus Blocks
                      </Button>
                    </Show>
                  </Show>
                </div>
              </Show>

              {/* Focus Blocks Section */}
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                  }}
                >
                  <h4
                    style={{
                      'font-size': tempoDesign.typography.sizes.md,
                      'font-weight': tempoDesign.typography.weights.semibold,
                      color: tempoDesign.colors.foreground,
                      margin: 0,
                    }}
                  >
                    Focus Blocks
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addFocusBlock}
                    disabled={isLoading()}
                    style={{ gap: '4px' }}
                  >
                    <Plus size={14} />
                    Add Focus Block
                  </Button>
                </div>

                {/* Focus Block List */}
                <For each={focusBlocks()}>
                  {(block, blockIndex) => (
                    <div
                      style={{
                        background: tempoDesign.colors.muted,
                        'border-radius': tempoDesign.radius.lg,
                        border: `1px solid ${tempoDesign.colors.border}`,
                        padding: '16px',
                      }}
                    >
                      {/* Focus Block Header */}
                      <div
                        style={{
                          display: 'flex',
                          'align-items': 'flex-start',
                          gap: '12px',
                          'margin-bottom': '16px',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <label
                            style={{
                              display: 'block',
                              'font-size': tempoDesign.typography.sizes.xs,
                              color: tempoDesign.colors.mutedForeground,
                              'margin-bottom': '4px',
                            }}
                          >
                            Focus Block {blockIndex() + 1} Title *
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g., Feature Development"
                            value={block.title}
                            onInput={(e) =>
                              updateFocusBlock(block.id, { title: e.currentTarget.value })
                            }
                            disabled={isLoading()}
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '4px',
                            'margin-top': '20px',
                          }}
                        >
                          {/* Return to Queue button (for blocks from scheduled tasks) */}
                          <Show when={block.sourceTaskId}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => returnFocusBlockToQueue(block.id)}
                              disabled={isLoading()}
                              title="Return to queue"
                              style={{
                                color: tempoDesign.colors.primary,
                              }}
                            >
                              <ArrowCounterClockwise size={16} />
                            </Button>
                          </Show>
                          {/* Delete button */}
                          <Show when={focusBlocks().length > 1 || block.sourceTaskId}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmRemoveFocusBlock(block.id)}
                              disabled={isLoading()}
                              title="Delete focus block"
                              style={{
                                color: tempoDesign.colors.destructive,
                              }}
                            >
                              <Trash size={16} />
                            </Button>
                          </Show>
                        </div>
                      </div>

                      {/* Timeboxes */}
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
                              'font-size': tempoDesign.typography.sizes.sm,
                              'font-weight': tempoDesign.typography.weights.medium,
                              color: tempoDesign.colors.foreground,
                              display: 'flex',
                              'align-items': 'center',
                              gap: '6px',
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
                            style={{ gap: '4px', padding: '4px 8px', height: '28px' }}
                          >
                            <Plus size={12} />
                            Add
                          </Button>
                        </div>

                        <For each={block.timeboxes}>
                          {(timebox, _tbIndex) => (
                            <div
                              style={{
                                background: tempoDesign.colors.background,
                                'border-radius': tempoDesign.radius.md,
                                border: `1px solid ${tempoDesign.colors.border}`,
                                padding: '12px',
                              }}
                            >
                              {/* Timebox Header Row */}
                              <div
                                style={{
                                  display: 'flex',
                                  'align-items': 'center',
                                  gap: '12px',
                                  'flex-wrap': 'wrap',
                                }}
                              >
                                {/* Type Select */}
                                <div style={{ 'min-width': '120px' }}>
                                  <label
                                    style={{
                                      display: 'block',
                                      'font-size': tempoDesign.typography.sizes.xs,
                                      color: tempoDesign.colors.mutedForeground,
                                      'margin-bottom': '4px',
                                    }}
                                  >
                                    Type
                                  </label>
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
                                      padding: '8px 12px',
                                      'border-radius': tempoDesign.radius.md,
                                      border: `1px solid ${tempoDesign.colors.input}`,
                                      background: tempoDesign.colors.background,
                                      color: tempoDesign.colors.foreground,
                                      'font-size': tempoDesign.typography.sizes.sm,
                                      'font-family': tempoDesign.typography.fontFamily,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <option value="work">Work</option>
                                    <option value="short-break">Short Break</option>
                                    <option value="long-break">Long Break</option>
                                  </select>
                                </div>

                                {/* Duration Input */}
                                <div style={{ width: '100px' }}>
                                  <label
                                    style={{
                                      display: 'block',
                                      'font-size': tempoDesign.typography.sizes.xs,
                                      color: tempoDesign.colors.mutedForeground,
                                      'margin-bottom': '4px',
                                    }}
                                  >
                                    Minutes
                                  </label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="180"
                                    value={timebox.duration}
                                    onInput={(e) =>
                                      updateTimebox(block.id, timebox.id, {
                                        duration: parseInt(e.currentTarget.value) || 0,
                                      })
                                    }
                                    disabled={isLoading()}
                                    style={{ width: '100%' }}
                                  />
                                </div>

                                <div style={{ 'margin-left': 'auto' }}>
                                  <Show when={block.timeboxes.length > 1}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeTimebox(block.id, timebox.id)}
                                      disabled={isLoading()}
                                      style={{
                                        color: tempoDesign.colors.destructive,
                                        height: '28px',
                                        width: '28px',
                                        'margin-top': '20px',
                                      }}
                                    >
                                      <Trash size={14} />
                                    </Button>
                                  </Show>
                                </div>
                              </div>

                              {/* Tasks Section (only for work timeboxes) */}
                              <Show when={timebox.type === 'work'}>
                                <div
                                  style={{
                                    'margin-top': '12px',
                                    'padding-top': '12px',
                                    'border-top': `1px solid ${tempoDesign.colors.border}`,
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
                                    <span
                                      style={{
                                        'font-size': tempoDesign.typography.sizes.xs,
                                        color: tempoDesign.colors.mutedForeground,
                                        display: 'flex',
                                        'align-items': 'center',
                                        gap: '4px',
                                      }}
                                    >
                                      <ListBullets size={12} />
                                      Tasks (optional)
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => addTask(block.id, timebox.id)}
                                      disabled={isLoading()}
                                      style={{
                                        gap: '4px',
                                        padding: '2px 6px',
                                        height: '24px',
                                        'font-size': tempoDesign.typography.sizes.xs,
                                      }}
                                    >
                                      <Plus size={10} />
                                      Add Task
                                    </Button>
                                  </div>

                                  <For each={timebox.tasks}>
                                    {(task, taskIndex) => (
                                      <div
                                        style={{
                                          display: 'flex',
                                          'align-items': 'center',
                                          gap: '8px',
                                          'margin-bottom': '8px',
                                        }}
                                      >
                                        <Input
                                          type="text"
                                          placeholder={`Task ${taskIndex() + 1}`}
                                          value={task}
                                          onInput={(e) =>
                                            updateTask(
                                              block.id,
                                              timebox.id,
                                              taskIndex(),
                                              e.currentTarget.value
                                            )
                                          }
                                          disabled={isLoading()}
                                          style={{
                                            flex: 1,
                                            'font-size': tempoDesign.typography.sizes.xs,
                                            padding: '6px 10px',
                                          }}
                                        />
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            removeTask(block.id, timebox.id, taskIndex())
                                          }
                                          disabled={isLoading()}
                                          style={{
                                            color: tempoDesign.colors.mutedForeground,
                                            height: '24px',
                                            width: '24px',
                                          }}
                                        >
                                          <X size={12} />
                                        </Button>
                                      </div>
                                    )}
                                  </For>
                                </div>
                              </Show>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>

              {/* Total Duration Display */}
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'flex-end',
                  gap: '8px',
                  'padding-top': '8px',
                  'border-top': `1px solid ${tempoDesign.colors.border}`,
                }}
              >
                <Clock size={16} weight="bold" color={tempoDesign.colors.mutedForeground} />
                <span
                  style={{
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.mutedForeground,
                  }}
                >
                  Total Duration:
                </span>
                <span
                  style={{
                    'font-size': tempoDesign.typography.sizes.md,
                    'font-weight': tempoDesign.typography.weights.semibold,
                    color: tempoDesign.colors.foreground,
                  }}
                >
                  {calculateTotalDuration(focusBlocks())} min
                </span>
              </div>

              {/* Error Message */}
              <Show when={error()}>
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                    'background-color': `${tempoDesign.colors.destructive}15`,
                    border: `1px solid ${tempoDesign.colors.destructive}30`,
                    'border-radius': tempoDesign.radius.md,
                    padding: '12px',
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.destructive,
                  }}
                >
                  {error()}
                </div>
              </Show>

              {/* Success Message */}
              <Show when={success()}>
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                    'background-color': `${tempoDesign.colors.frog}15`,
                    border: `1px solid ${tempoDesign.colors.frog}30`,
                    'border-radius': tempoDesign.radius.md,
                    padding: '12px',
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.frog,
                  }}
                >
                  Session created successfully!
                </div>
              </Show>
            </CardContent>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '16px 24px',
                'border-top': `1px solid ${tempoDesign.colors.border}`,
                'justify-content': 'flex-end',
                'flex-shrink': 0,
              }}
            >
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading()}
                style={{ 'min-width': '80px' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading() || !!dateError()}
                style={{ 'min-width': '100px' }}
              >
                {isLoading() ? 'Creating...' : 'Create Session'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Undo Toast */}
        <Show when={undoState()}>
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              'align-items': 'center',
              gap: '12px',
              padding: '12px 16px',
              background: tempoDesign.colors.card,
              border: `1px solid ${tempoDesign.colors.primary}`,
              'border-radius': tempoDesign.radius.lg,
              'box-shadow': tempoDesign.shadows.lg,
              'z-index': 10001,
              animation: 'slideUp 0.2s ease-out',
            }}
          >
            <span
              style={{
                color: tempoDesign.colors.foreground,
                'font-size': tempoDesign.typography.sizes.sm,
              }}
            >
              Added {undoState()?.addedTaskIds.length} scheduled task
              {(undoState()?.addedTaskIds.length || 0) > 1 ? 's' : ''} as focus blocks
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={undoAddScheduledTasks}
              style={{
                gap: '6px',
                padding: '6px 12px',
                height: '32px',
              }}
            >
              <ArrowCounterClockwise size={14} />
              Undo
            </Button>
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
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
      </Portal>

      {/* Confirmation Modal */}
      <Show when={confirmModal()?.isOpen}>
        <Portal>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              'z-index': 10002,
              animation: 'fadeIn 0.15s ease-out',
            }}
            onClick={() => setConfirmModal(null)}
          />
          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              'max-width': '400px',
              background: tempoDesign.colors.card,
              border: `1px solid ${tempoDesign.colors.cardBorder}`,
              'border-radius': tempoDesign.radius.xl,
              'box-shadow': tempoDesign.shadows.lg,
              padding: '24px',
              'z-index': 10003,
              animation: 'modalSlideIn 0.2s ease-out',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '12px',
                'margin-bottom': '16px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  'border-radius': '50%',
                  background:
                    confirmModal()?.variant === 'destructive'
                      ? `${tempoDesign.colors.destructive}20`
                      : `${tempoDesign.colors.amber[600]}20`,
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                }}
              >
                <Warning
                  size={20}
                  color={
                    confirmModal()?.variant === 'destructive'
                      ? tempoDesign.colors.destructive
                      : tempoDesign.colors.amber[600]
                  }
                />
              </div>
              <h3
                style={{
                  margin: 0,
                  'font-size': tempoDesign.typography.sizes.lg,
                  'font-weight': tempoDesign.typography.weights.semibold,
                  color: tempoDesign.colors.foreground,
                }}
              >
                {confirmModal()?.title}
              </h3>
            </div>

            {/* Message */}
            <p
              style={{
                margin: '0 0 24px 0',
                'font-size': tempoDesign.typography.sizes.sm,
                color: tempoDesign.colors.mutedForeground,
                'line-height': '1.5',
              }}
            >
              {confirmModal()?.message}
            </p>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                'justify-content': 'flex-end',
                gap: '12px',
              }}
            >
              <Button variant="ghost" onClick={() => setConfirmModal(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => confirmModal()?.onConfirm()}
                style={{
                  background:
                    confirmModal()?.variant === 'destructive'
                      ? tempoDesign.colors.destructive
                      : tempoDesign.colors.amber[600],
                  color: '#FFFFFF',
                }}
              >
                {confirmModal()?.confirmLabel || 'Confirm'}
              </Button>
            </div>
          </div>
        </Portal>
      </Show>
    </Show>
  );
};
