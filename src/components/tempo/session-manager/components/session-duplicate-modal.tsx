import { Component, createSignal, Show, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import { X, Copy, Calendar, ArrowRight, Check, Warning, Clock, ListBullets } from 'phosphor-solid';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { tempoDesign } from '../../theme/tempo-design';
import { useSessionCrud } from '../hooks/useSessionCrud';
import type { Session } from '../../lib/types';
import { logger } from '../../../../lib/logger';
import { format, addDays } from 'date-fns';

const log = logger.create('SessionDuplicateModal');

interface SessionDuplicateModalProps {
  isOpen: boolean;
  session: Session | null;
  onClose: () => void;
  onDuplicated?: (session: Session) => void;
}

export const SessionDuplicateModal: Component<SessionDuplicateModalProps> = (props) => {
  const { duplicateSession, sessionExistsForDate } = useSessionCrud({ autoLoad: false });

  // Form state
  const [targetDate, setTargetDate] = createSignal('');
  const [resetProgress, setResetProgress] = createSignal(true);

  // UI state
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal(false);
  const [dateError, setDateError] = createSignal<string | null>(null);

  // Helper to format date for input
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Reset form when modal opens/closes or session changes
  createEffect(() => {
    if (props.isOpen && props.session) {
      // Set default target date to tomorrow
      const tomorrow = addDays(new Date(), 1);
      setTargetDate(formatDateForInput(tomorrow));
      setResetProgress(true);
      setError(null);
      setSuccess(false);
      setDateError(null);
      setIsLoading(false);
    }
  });

  // Format session date for display
  const formatSessionDate = (date: string): string => {
    try {
      return format(new Date(date), 'MMMM d, yyyy');
    } catch {
      return date;
    }
  };

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Get story count from session
  const getStoryCount = (): number => {
    return props.session?.storyBlocks?.length ?? 0;
  };

  // Get total duration from session
  const getTotalDuration = (): number => {
    return props.session?.totalDuration ?? 0;
  };

  // Validate target date when it changes
  const handleDateChange = async (newDate: string) => {
    setTargetDate(newDate);
    setDateError(null);
    setError(null);

    if (!newDate) {
      setDateError('Please select a target date');
      return;
    }

    // Check if session already exists for target date
    const exists = await sessionExistsForDate(newDate);
    if (exists) {
      setDateError('A session already exists for this date');
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isLoading()) {
      setTargetDate('');
      setResetProgress(true);
      setError(null);
      setSuccess(false);
      setDateError(null);
      props.onClose();
    }
  };

  // Handle duplicate
  const handleDuplicate = async () => {
    if (!props.session) {
      log.warn('No session to duplicate');
      return;
    }

    // Validate
    if (!targetDate()) {
      setError('Please select a target date');
      return;
    }

    if (dateError()) {
      setError(dateError());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      log.info(
        `Duplicating session from ${props.session.date} to ${targetDate()}, resetProgress: ${resetProgress()}`
      );

      const duplicated = await duplicateSession(props.session.date, targetDate(), resetProgress());

      if (duplicated) {
        setSuccess(true);
        log.info(`Session duplicated successfully to ${targetDate()}`);

        // Notify parent and close after brief delay
        setTimeout(() => {
          props.onDuplicated?.(duplicated);
          handleClose();
        }, 1500);
      } else {
        setError('Failed to duplicate session. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      log.error('Failed to duplicate session', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if form is valid
  const canDuplicate = (): boolean => {
    return !isLoading() && !!targetDate() && !dateError();
  };

  return (
    <Show when={props.isOpen && props.session}>
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
            'max-width': '500px',
            'max-height': '90vh',
            'overflow-y': 'auto',
            animation: 'modalSlideIn 0.2s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card
            style={{
              border: `1px solid ${tempoDesign.colors.border}`,
              'box-shadow': tempoDesign.shadows.lg,
            }}
          >
            {/* Header */}
            <CardHeader style={{ 'padding-bottom': '12px' }}>
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'space-between',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      'border-radius': tempoDesign.radius.lg,
                      background: `${tempoDesign.colors.primary}15`,
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                    }}
                  >
                    <Copy size={20} weight="fill" color={tempoDesign.colors.primary} />
                  </div>
                  <CardTitle style={{ 'font-size': tempoDesign.typography.sizes.lg }}>
                    Duplicate Session
                  </CardTitle>
                </div>
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
              <CardDescription style={{ 'margin-top': '8px', 'margin-left': '52px' }}>
                Copy this session to a new date
              </CardDescription>
            </CardHeader>

            {/* Content */}
            <CardContent style={{ display: 'flex', 'flex-direction': 'column', gap: '20px' }}>
              {/* Source Session Summary */}
              <div
                style={{
                  'background-color': tempoDesign.colors.secondary,
                  'border-radius': tempoDesign.radius.lg,
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                    'margin-bottom': '12px',
                  }}
                >
                  <Calendar size={16} color={tempoDesign.colors.mutedForeground} />
                  <span
                    style={{
                      'font-size': tempoDesign.typography.sizes.xs,
                      'font-weight': tempoDesign.typography.weights.medium,
                      color: tempoDesign.colors.mutedForeground,
                      'text-transform': 'uppercase',
                      'letter-spacing': '0.05em',
                    }}
                  >
                    Source Session
                  </span>
                </div>
                <p
                  style={{
                    margin: '0 0 12px 0',
                    'font-size': tempoDesign.typography.sizes.base,
                    'font-weight': tempoDesign.typography.weights.semibold,
                    color: tempoDesign.colors.foreground,
                  }}
                >
                  {formatSessionDate(props.session!.date)}
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    'flex-wrap': 'wrap',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '6px',
                      'font-size': tempoDesign.typography.sizes.sm,
                      color: tempoDesign.colors.mutedForeground,
                    }}
                  >
                    <ListBullets size={14} />
                    <span>
                      {getStoryCount()} {getStoryCount() === 1 ? 'story' : 'stories'}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '6px',
                      'font-size': tempoDesign.typography.sizes.sm,
                      color: tempoDesign.colors.mutedForeground,
                    }}
                  >
                    <Clock size={14} />
                    <span>{formatDuration(getTotalDuration())}</span>
                  </div>
                </div>
              </div>

              {/* Arrow indicator */}
              <div
                style={{
                  display: 'flex',
                  'justify-content': 'center',
                  'align-items': 'center',
                }}
              >
                <ArrowRight
                  size={24}
                  weight="bold"
                  color={tempoDesign.colors.mutedForeground}
                  style={{ transform: 'rotate(90deg)' }}
                />
              </div>

              {/* Target Date Picker */}
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
                <label
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                    'font-size': tempoDesign.typography.sizes.sm,
                    'font-weight': tempoDesign.typography.weights.medium,
                    color: tempoDesign.colors.foreground,
                  }}
                >
                  <Calendar size={16} />
                  Target Date *
                </label>
                <Input
                  type="date"
                  value={targetDate()}
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
                      margin: 0,
                    }}
                  >
                    {dateError()}
                  </p>
                </Show>
              </div>

              {/* Reset Progress Toggle */}
              <div
                style={{
                  padding: '16px',
                  'background-color': tempoDesign.colors.muted,
                  'border-radius': tempoDesign.radius.lg,
                  border: `1px solid ${tempoDesign.colors.border}`,
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    'align-items': 'flex-start',
                    gap: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      'border-radius': tempoDesign.radius.sm,
                      border: `2px solid ${resetProgress() ? tempoDesign.colors.primary : tempoDesign.colors.border}`,
                      background: resetProgress() ? tempoDesign.colors.primary : 'transparent',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      transition: 'all 0.2s ease-out',
                      cursor: 'pointer',
                      'flex-shrink': 0,
                      'margin-top': '2px',
                    }}
                    onClick={() => setResetProgress(!resetProgress())}
                  >
                    <Show when={resetProgress()}>
                      <Check size={14} weight="bold" color={tempoDesign.colors.primaryForeground} />
                    </Show>
                  </div>
                  <div style={{ flex: 1 }} onClick={() => setResetProgress(!resetProgress())}>
                    <p
                      style={{
                        margin: '0 0 4px 0',
                        'font-size': tempoDesign.typography.sizes.sm,
                        'font-weight': tempoDesign.typography.weights.medium,
                        color: tempoDesign.colors.foreground,
                      }}
                    >
                      Reset progress
                    </p>
                    <p
                      style={{
                        margin: 0,
                        'font-size': tempoDesign.typography.sizes.xs,
                        color: tempoDesign.colors.mutedForeground,
                        'line-height': '1.5',
                      }}
                    >
                      <Show
                        when={resetProgress()}
                        fallback="Preserve completion status from the source session"
                      >
                        All tasks and timeboxes will be reset to 'todo' status with progress at 0%
                      </Show>
                    </p>
                  </div>
                </label>
              </div>

              {/* Error Message */}
              <Show when={error()}>
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'flex-start',
                    gap: '8px',
                    'background-color': `${tempoDesign.colors.destructive}10`,
                    border: `1px solid ${tempoDesign.colors.destructive}30`,
                    'border-radius': tempoDesign.radius.lg,
                    padding: '12px',
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.destructive,
                  }}
                >
                  <Warning size={16} style={{ 'flex-shrink': 0, 'margin-top': '2px' }} />
                  <span>{error()}</span>
                </div>
              </Show>

              {/* Success Message */}
              <Show when={success()}>
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'flex-start',
                    gap: '8px',
                    'background-color': `${tempoDesign.colors.frog}10`,
                    border: `1px solid ${tempoDesign.colors.frog}30`,
                    'border-radius': tempoDesign.radius.lg,
                    padding: '12px',
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.frog,
                  }}
                >
                  <Check
                    size={16}
                    weight="bold"
                    style={{ 'flex-shrink': 0, 'margin-top': '2px' }}
                  />
                  <span>Session duplicated successfully!</span>
                </div>
              </Show>
            </CardContent>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '16px',
                'border-top': `1px solid ${tempoDesign.colors.border}`,
                'justify-content': 'flex-end',
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
                onClick={handleDuplicate}
                disabled={!canDuplicate()}
                style={{
                  'min-width': '140px',
                  gap: '8px',
                }}
              >
                <Show
                  when={isLoading()}
                  fallback={
                    <>
                      <Copy size={16} />
                      Duplicate
                    </>
                  }
                >
                  <span
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid transparent',
                        'border-top-color': tempoDesign.colors.primaryForeground,
                        'border-radius': '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    Duplicating...
                  </span>
                </Show>
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
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      </Portal>
    </Show>
  );
};
