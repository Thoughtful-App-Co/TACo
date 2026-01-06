import { Component, createSignal, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { X, Warning, Archive, Trash, Check, Clock, ListBullets } from 'phosphor-solid';
import { format } from 'date-fns';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { tempoDesign } from '../../theme/tempo-design';
import { useSessionCrud } from '../hooks/useSessionCrud';
import type { Session } from '../../lib/types';
import { logger } from '../../../../lib/logger';

const log = logger.create('SessionDeleteModal');

interface SessionDeleteModalProps {
  isOpen: boolean;
  session: Session | null;
  onClose: () => void;
  onDeleted?: () => void;
}

type DeleteMode = 'archive' | 'permanent';

export const SessionDeleteModal: Component<SessionDeleteModalProps> = (props) => {
  const [deleteMode, setDeleteMode] = createSignal<DeleteMode>('archive');
  const [confirmChecked, setConfirmChecked] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const { deleteSession } = useSessionCrud({ autoLoad: false });

  const formatSessionDate = (date: string): string => {
    try {
      return format(new Date(date), 'MMMM d, yyyy');
    } catch {
      return date;
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getStoryCount = (): number => {
    return props.session?.storyBlocks?.length ?? 0;
  };

  const getTotalDuration = (): number => {
    return props.session?.totalDuration ?? 0;
  };

  const handleClose = () => {
    // Reset state on close
    setDeleteMode('archive');
    setConfirmChecked(false);
    setError(null);
    props.onClose();
  };

  const handleDelete = async () => {
    if (!props.session) {
      log.warn('No session to delete');
      return;
    }

    const isPermanent = deleteMode() === 'permanent';

    // Require confirmation for permanent delete
    if (isPermanent && !confirmChecked()) {
      setError('Please confirm permanent deletion by checking the checkbox');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      log.info(
        `${isPermanent ? 'Permanently deleting' : 'Archiving'} session: ${props.session.date}`
      );

      const success = await deleteSession(props.session.date, isPermanent);

      if (success) {
        log.info(`Session ${isPermanent ? 'deleted' : 'archived'} successfully`);
        props.onDeleted?.();
        handleClose();
      } else {
        setError(`Failed to ${isPermanent ? 'delete' : 'archive'} session. Please try again.`);
      }
    } catch (err) {
      log.error('Delete operation failed', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = (): boolean => {
    if (deleteMode() === 'permanent') {
      return confirmChecked() && !isDeleting();
    }
    return !isDeleting();
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
                      background: `${tempoDesign.colors.amber[600]}15`,
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                    }}
                  >
                    <Warning size={20} weight="fill" color={tempoDesign.colors.amber[600]} />
                  </div>
                  <CardTitle style={{ 'font-size': tempoDesign.typography.sizes.lg }}>
                    Delete Session
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  disabled={isDeleting()}
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
                Choose how you want to remove this session
              </CardDescription>
            </CardHeader>

            {/* Content */}
            <CardContent style={{ display: 'flex', 'flex-direction': 'column', gap: '20px' }}>
              {/* Session Summary */}
              <div
                style={{
                  'background-color': tempoDesign.colors.secondary,
                  'border-radius': tempoDesign.radius.lg,
                  padding: '16px',
                }}
              >
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

              {/* Delete Mode Selection */}
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
                {/* Archive Option */}
                <div
                  style={{
                    padding: '16px',
                    border: `2px solid ${deleteMode() === 'archive' ? tempoDesign.colors.amber[600] : tempoDesign.colors.border}`,
                    'border-radius': tempoDesign.radius.lg,
                    cursor: 'pointer',
                    background:
                      deleteMode() === 'archive'
                        ? `${tempoDesign.colors.amber[600]}08`
                        : 'transparent',
                    transition: 'all 0.2s ease-out',
                  }}
                  onClick={() => {
                    setDeleteMode('archive');
                    setError(null);
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        'border-radius': '50%',
                        border: `2px solid ${deleteMode() === 'archive' ? tempoDesign.colors.amber[600] : tempoDesign.colors.border}`,
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'flex-shrink': 0,
                        'margin-top': '2px',
                      }}
                    >
                      <Show when={deleteMode() === 'archive'}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            'border-radius': '50%',
                            background: tempoDesign.colors.amber[600],
                          }}
                        />
                      </Show>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          gap: '8px',
                          'margin-bottom': '4px',
                        }}
                      >
                        <Archive size={16} color={tempoDesign.colors.amber[600]} />
                        <h3
                          style={{
                            margin: 0,
                            'font-size': tempoDesign.typography.sizes.base,
                            'font-weight': tempoDesign.typography.weights.medium,
                            color: tempoDesign.colors.foreground,
                          }}
                        >
                          Archive Session
                        </h3>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          'font-size': tempoDesign.typography.sizes.sm,
                          color: tempoDesign.colors.mutedForeground,
                        }}
                      >
                        Move to archive. You can restore it later if needed.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Permanent Delete Option */}
                <div
                  style={{
                    padding: '16px',
                    border: `2px solid ${deleteMode() === 'permanent' ? tempoDesign.colors.destructive : tempoDesign.colors.border}`,
                    'border-radius': tempoDesign.radius.lg,
                    cursor: 'pointer',
                    background:
                      deleteMode() === 'permanent'
                        ? `${tempoDesign.colors.destructive}08`
                        : 'transparent',
                    transition: 'all 0.2s ease-out',
                  }}
                  onClick={() => {
                    setDeleteMode('permanent');
                    setError(null);
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        'border-radius': '50%',
                        border: `2px solid ${deleteMode() === 'permanent' ? tempoDesign.colors.destructive : tempoDesign.colors.border}`,
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'flex-shrink': 0,
                        'margin-top': '2px',
                      }}
                    >
                      <Show when={deleteMode() === 'permanent'}>
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
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          gap: '8px',
                          'margin-bottom': '4px',
                        }}
                      >
                        <Trash size={16} color={tempoDesign.colors.destructive} />
                        <h3
                          style={{
                            margin: 0,
                            'font-size': tempoDesign.typography.sizes.base,
                            'font-weight': tempoDesign.typography.weights.medium,
                            color: tempoDesign.colors.foreground,
                          }}
                        >
                          Delete Permanently
                        </h3>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          'font-size': tempoDesign.typography.sizes.sm,
                          color: tempoDesign.colors.mutedForeground,
                        }}
                      >
                        Remove completely. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Checkbox for Permanent Delete */}
              <Show when={deleteMode() === 'permanent'}>
                <div
                  style={{
                    'background-color': `${tempoDesign.colors.destructive}10`,
                    border: `1px solid ${tempoDesign.colors.destructive}30`,
                    'border-radius': tempoDesign.radius.lg,
                    padding: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <Warning
                      size={16}
                      color={tempoDesign.colors.destructive}
                      style={{ 'flex-shrink': 0, 'margin-top': '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: '0 0 12px 0',
                          'font-size': tempoDesign.typography.sizes.sm,
                          color: tempoDesign.colors.destructive,
                          'font-weight': tempoDesign.typography.weights.medium,
                        }}
                      >
                        Warning: This will permanently delete all session data including stories and
                        progress.
                      </p>
                      <label
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          'font-size': tempoDesign.typography.sizes.sm,
                          color: tempoDesign.colors.foreground,
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            'border-radius': tempoDesign.radius.sm,
                            border: `2px solid ${confirmChecked() ? tempoDesign.colors.destructive : tempoDesign.colors.border}`,
                            background: confirmChecked()
                              ? tempoDesign.colors.destructive
                              : 'transparent',
                            display: 'flex',
                            'align-items': 'center',
                            'justify-content': 'center',
                            transition: 'all 0.2s ease-out',
                            cursor: 'pointer',
                          }}
                          onClick={() => setConfirmChecked(!confirmChecked())}
                        >
                          <Show when={confirmChecked()}>
                            <Check
                              size={12}
                              weight="bold"
                              color={tempoDesign.colors.destructiveForeground}
                            />
                          </Show>
                        </div>
                        <span onClick={() => setConfirmChecked(!confirmChecked())}>
                          I understand this cannot be undone
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </Show>

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
            </CardContent>

            {/* Footer - Large buttons for Fitts's Law compliance */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '20px',
                'border-top': `1px solid ${tempoDesign.colors.border}`,
              }}
            >
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isDeleting()}
                style={{
                  flex: 1,
                  height: '52px',
                  'font-size': tempoDesign.typography.sizes.base,
                  'font-weight': tempoDesign.typography.weights.semibold,
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting() || (deleteMode() === 'permanent' && !confirmChecked())}
                style={{
                  flex: 1,
                  height: '52px',
                  'font-size': tempoDesign.typography.sizes.base,
                  'font-weight': tempoDesign.typography.weights.semibold,
                  background:
                    deleteMode() === 'archive'
                      ? tempoDesign.colors.amber[600]
                      : tempoDesign.colors.destructive,
                  color: tempoDesign.colors.destructiveForeground,
                }}
              >
                {isDeleting()
                  ? 'Processing...'
                  : deleteMode() === 'archive'
                    ? 'Archive Session'
                    : 'Delete Permanently'}
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
