import { Component, createEffect, createSignal, createMemo, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { format, isToday, isYesterday } from 'date-fns';
import {
  Calendar,
  ClockClockwise,
  CheckCircle,
  ArrowRight,
  Clock,
  ListBullets,
  ChartBar,
  Plus,
  PencilSimple,
  Trash,
  Copy,
  Warning,
  Archive,
  CalendarX,
} from 'phosphor-solid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { tempoDesign } from '../../theme/tempo-design';
import type { Session, SessionStatus } from '../../lib/types';
import { logger } from '../../../../lib/logger';
import { useSessionCrud } from '../hooks/useSessionCrud';
import { SessionCreateModal } from './session-create-modal';
import { SessionEditModal } from './session-edit-modal';
import { SessionDeleteModal } from './session-delete-modal';
import { SessionDuplicateModal } from './session-duplicate-modal';
import { SessionFilterBar } from './session-filter-bar';
import { SessionCloseoutModal } from './session-closeout-modal';
import { SessionLifecycleService } from '../../services/session-lifecycle.service';

interface SessionsListProps {
  // onSessionSelect is deprecated - component now uses router navigation
  onSessionSelect?: (sessionId: string) => void;
}

// Add aurora and progress animations to global styles
const auroraStyles = document.createElement('style');
auroraStyles.textContent = `
  @keyframes aurora-shift {
    0%, 100% {
      transform: translate(0, 0) scale(1);
      opacity: 0.6;
    }
    33% {
      transform: translate(30px, -20px) scale(1.1);
      opacity: 0.7;
    }
    66% {
      transform: translate(-20px, 30px) scale(0.95);
      opacity: 0.5;
    }
  }
  
  @keyframes aurora-pulse {
    0%, 100% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.6;
    }
  }

  @keyframes shimmer {
    0% {
      opacity: 0.1;
      transform: translateX(-100%);
    }
    50% {
      opacity: 0.15;
    }
    100% {
      opacity: 0.1;
      transform: translateX(100%);
    }
  }
`;
document.head.appendChild(auroraStyles);

export const SessionsList: Component<SessionsListProps> = (props) => {
  const navigate = useNavigate();
  const { sessions, allSessions, loading, error, refreshSessions, filterByStatus } = useSessionCrud();
  const [hoveredCard, setHoveredCard] = createSignal<string | null>(null);

  // Modal state management
  const [showCreateModal, setShowCreateModal] = createSignal(false);
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [showDuplicateModal, setShowDuplicateModal] = createSignal(false);
  const [showCloseoutModal, setShowCloseoutModal] = createSignal(false);
  const [selectedSession, setSelectedSession] = createSignal<Session | null>(null);
  const [activeFilter, setActiveFilter] = createSignal<SessionStatus | 'all'>('all');

  // Session lifecycle service
  const lifecycleService = new SessionLifecycleService();

  // Run auto-transitions on mount
  createEffect(() => {
    lifecycleService.runAutoTransitions().then(() => {
      refreshSessions();
    });
  });

  // Session counts for filter bar - use allSessions to show accurate counts regardless of active filter
  const sessionCounts = createMemo(() => {
    const all = allSessions();
    return {
      all: all.length,
      planned: all.filter((s) => s.status === 'planned').length,
      'in-progress': all.filter((s) => s.status === 'in-progress').length,
      incomplete: all.filter((s) => s.status === 'incomplete').length,
      completed: all.filter((s) => s.status === 'completed').length,
      archived: all.filter((s) => s.status === 'archived').length,
    };
  });

  // Overdue planned sessions (planned but date is in the past)
  const overduePlannedSessions = createMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return allSessions().filter((s) => s.status === 'planned' && s.date < today);
  });

  // Total sessions needing attention
  const needsAttentionCount = createMemo(() => {
    return sessionCounts().incomplete + overduePlannedSessions().length;
  });

  // Handlers
  const handleEdit = (session: Session) => {
    setSelectedSession(session);
    setShowEditModal(true);
  };

  const handleDelete = (session: Session) => {
    setSelectedSession(session);
    setShowDeleteModal(true);
  };

  const handleDuplicate = (session: Session) => {
    setSelectedSession(session);
    setShowDuplicateModal(true);
  };

  const handleCloseout = (session: Session) => {
    setSelectedSession(session);
    setShowCloseoutModal(true);
  };

  const handleCloseoutComplete = () => {
    setShowCloseoutModal(false);
    setSelectedSession(null);
    refreshSessions();
  };

  const handleRescheduleToToday = async (session: Session) => {
    const today = new Date().toISOString().split('T')[0];

    // Check if today already has a session
    const todaySession = allSessions().find((s) => s.date === today);
    if (todaySession) {
      // TODO: Could show a modal to merge or cancel
      alert('A session already exists for today. Please close out or delete it first.');
      return;
    }

    try {
      // Use the SessionStorageService to update the session date
      const { SessionStorageService } = await import('../../services/session-storage.service');
      const storageService = new SessionStorageService();

      await storageService.updateSessionMetadata(session.date, {
        date: today,
      });

      refreshSessions();
    } catch (error) {
      logger.error('Failed to reschedule session:', error);
    }
  };

  const handleModalClose = () => {
    setSelectedSession(null);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDuplicateModal(false);
  };

  const handleSessionCreated = () => {
    setShowCreateModal(false);
    refreshSessions();
  };

  const handleSessionUpdated = () => {
    handleModalClose();
    refreshSessions();
  };

  const handleSessionDeleted = () => {
    handleModalClose();
    refreshSessions();
  };

  const handleSessionDuplicated = () => {
    handleModalClose();
    refreshSessions();
  };

  const handleFilterChange = (filter: SessionStatus | 'all') => {
    setActiveFilter(filter);
    filterByStatus(filter);
  };

  const getDateLabel = (date: string) => {
    const sessionDate = new Date(date);
    if (isToday(sessionDate)) {
      return 'Today';
    } else if (isYesterday(sessionDate)) {
      return 'Yesterday';
    } else {
      return format(sessionDate, 'MMMM d, yyyy');
    }
  };

  const getStatusConfig = (session: Session) => {
    if (session.status === 'completed') {
      return {
        label: 'Completed',
        icon: CheckCircle,
        color: tempoDesign.colors.frog,
        bg: `${tempoDesign.colors.frog}15`,
        border: `${tempoDesign.colors.frog}40`,
        gradient: `linear-gradient(135deg, ${tempoDesign.colors.frog}20 0%, ${tempoDesign.colors.frog}05 100%)`,
        auroraColor: 'rgba(16, 185, 129, 0.2)',
      };
    }

    if (session.status === 'in-progress') {
      return {
        label: 'In Progress',
        icon: ClockClockwise,
        color: tempoDesign.colors.primary,
        bg: `${tempoDesign.colors.primary}15`,
        border: `${tempoDesign.colors.primary}40`,
        gradient: `linear-gradient(135deg, ${tempoDesign.colors.primary}20 0%, ${tempoDesign.colors.primary}05 100%)`,
        auroraColor: 'rgba(94, 106, 210, 0.2)',
      };
    }

    if (session.status === 'incomplete') {
      return {
        label: 'Incomplete',
        icon: Warning,
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)',
        gradient:
          'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)',
        auroraColor: 'rgba(239, 68, 68, 0.2)',
      };
    }

    if (session.status === 'archived') {
      return {
        label: 'Archived',
        icon: Archive,
        color: tempoDesign.colors.mutedForeground,
        bg: `${tempoDesign.colors.muted}`,
        border: `${tempoDesign.colors.border}`,
        gradient: `linear-gradient(135deg, ${tempoDesign.colors.muted} 0%, ${tempoDesign.colors.background} 100%)`,
        auroraColor: 'rgba(112, 112, 128, 0.1)',
      };
    }

    // Default: Planned
    return {
      label: 'Planned',
      icon: Calendar,
      color: tempoDesign.colors.amber[600],
      bg: `${tempoDesign.colors.amber[600]}15`,
      border: `${tempoDesign.colors.amber[600]}40`,
      gradient: `linear-gradient(135deg, ${tempoDesign.colors.amber[600]}20 0%, ${tempoDesign.colors.amber[600]}05 100%)`,
      auroraColor: 'rgba(217, 119, 6, 0.2)',
    };
  };

  const calculateProgress = (session: Session) => {
    const totalTimeboxes = session.storyBlocks.reduce(
      (sum: number, block: any) => sum + block.timeBoxes.length,
      0
    );
    const completedTimeboxes = session.storyBlocks.reduce(
      (sum: number, block: any) =>
        sum + block.timeBoxes.filter((tb: any) => tb.status === 'completed').length,
      0
    );
    return totalTimeboxes > 0 ? Math.round((completedTimeboxes / totalTimeboxes) * 100) : 0;
  };

  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        gap: '20px',
        position: 'relative',
      }}
    >
      {/* Aurora Background - Subtle atmospheric gradient */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          left: '-20%',
          width: '140%',
          height: '600px',
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(94, 106, 210, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, rgba(16, 185, 129, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(217, 119, 6, 0.08) 0%, transparent 50%)
          `,
          filter: 'blur(60px)',
          opacity: 0.6,
          'pointer-events': 'none',
          'z-index': 0,
          animation: 'aurora-shift 20s ease-in-out infinite',
        }}
      />

      {/* Floating orbs for extra atmosphere */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(94, 106, 210, 0.1) 0%, transparent 70%)',
          'border-radius': '50%',
          filter: 'blur(40px)',
          'pointer-events': 'none',
          'z-index': 0,
          animation: 'aurora-pulse 8s ease-in-out infinite',
        }}
      />

      {/* Content wrapper with relative positioning */}
      <div
        style={{
          position: 'relative',
          'z-index': 1,
          display: 'flex',
          'flex-direction': 'column',
          gap: '20px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'flex-start',
            gap: '20px',
            padding: '0 4px',
          }}
        >
          <div style={{ flex: 1 }}>
            <h2
              style={{
                'font-size': tempoDesign.typography.sizes['2xl'],
                'font-weight': tempoDesign.typography.weights.bold,
                margin: '0 0 8px 0',
                color: tempoDesign.colors.foreground,
                'letter-spacing': '-0.02em',
                'text-shadow': '0 2px 12px rgba(94, 106, 210, 0.3)',
              }}
            >
              Your Sessions
            </h2>
            <p
              style={{
                'font-size': tempoDesign.typography.sizes.base,
                color: tempoDesign.colors.mutedForeground,
                margin: 0,
                'line-height': tempoDesign.typography.lineHeights.relaxed,
              }}
            >
              Track your productivity journey, one session at a time
            </p>
          </div>

          {/* Create Session Button */}
          <Button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              height: '48px',
              'padding-left': '20px',
              'padding-right': '20px',
              'font-size': tempoDesign.typography.sizes.base,
              'font-weight': tempoDesign.typography.weights.semibold,
              background: `linear-gradient(90deg, ${tempoDesign.colors.primary} 0%, ${tempoDesign.colors.primary}dd 100%)`,
              color: '#FFFFFF',
              border: 'none',
              'border-radius': tempoDesign.radius.md,
              'box-shadow': `0 4px 16px ${tempoDesign.colors.primary}50, 0 0 24px rgba(94, 106, 210, 0.2)`,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Plus size={20} weight="bold" />
            Create Session
          </Button>
        </div>

        {/* Needs Attention Section */}
        <Show when={needsAttentionCount() > 0}>
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              'border-radius': tempoDesign.radius.lg,
              padding: '16px',
              'margin-bottom': '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '12px',
                'margin-bottom': '12px',
              }}
            >
              <Warning size={24} weight="fill" color="#EF4444" />
              <h3
                style={{
                  margin: 0,
                  'font-size': '16px',
                  'font-weight': '600',
                  color: tempoDesign.colors.foreground,
                }}
              >
                Needs Attention ({needsAttentionCount()})
              </h3>
            </div>
            <p
              style={{
                margin: '0 0 16px 0',
                'font-size': '14px',
                color: tempoDesign.colors.mutedForeground,
              }}
            >
              {sessionCounts().incomplete > 0 && overduePlannedSessions().length > 0
                ? 'You have incomplete sessions to close out and overdue planned sessions to reschedule.'
                : sessionCounts().incomplete > 0
                  ? 'You have incomplete sessions that need to be closed out. Extract unfinished work to your backlog or discard it.'
                  : 'You have overdue planned sessions that need to be rescheduled or closed out.'}
            </p>
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
              {/* Incomplete sessions */}
              <For each={sessions().filter((s) => s.status === 'incomplete')}>
                {(session) => (
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'space-between',
                      padding: '12px 16px',
                      background: tempoDesign.colors.card,
                      'border-radius': tempoDesign.radius.md,
                      border: `1px solid ${tempoDesign.colors.border}`,
                    }}
                  >
                    <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                      <Warning size={16} weight="fill" color="#EF4444" />
                      <div>
                        <span style={{ 'font-weight': '500', color: tempoDesign.colors.foreground }}>
                          {format(new Date(session.date), 'EEEE, MMM d, yyyy')}
                        </span>
                        <span
                          style={{
                            'margin-left': '12px',
                            'font-size': '13px',
                            color: tempoDesign.colors.mutedForeground,
                          }}
                        >
                          Incomplete - {session.storyBlocks.length} focus blocks
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCloseout(session)}
                      style={{
                        background: '#EF4444',
                        color: '#FFFFFF',
                      }}
                    >
                      Close Out
                    </Button>
                  </div>
                )}
              </For>

              {/* Overdue planned sessions */}
              <For each={overduePlannedSessions()}>
                {(session) => (
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'space-between',
                      padding: '12px 16px',
                      background: tempoDesign.colors.card,
                      'border-radius': tempoDesign.radius.md,
                      border: `1px solid ${tempoDesign.colors.amber[600]}40`,
                    }}
                  >
                    <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                      <CalendarX size={16} weight="fill" color={tempoDesign.colors.amber[600]} />
                      <div>
                        <span style={{ 'font-weight': '500', color: tempoDesign.colors.foreground }}>
                          {format(new Date(session.date), 'EEEE, MMM d, yyyy')}
                        </span>
                        <span
                          style={{
                            'margin-left': '12px',
                            'font-size': '13px',
                            color: tempoDesign.colors.amber[600],
                          }}
                        >
                          Overdue - {session.storyBlocks.length} focus blocks
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCloseout(session)}
                        style={{
                          'border-color': '#EF444440',
                          color: '#EF4444',
                        }}
                      >
                        Close Out
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRescheduleToToday(session)}
                        style={{
                          background: tempoDesign.colors.amber[600],
                          color: '#FFFFFF',
                        }}
                      >
                        Reschedule to Today
                      </Button>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Session Filter Bar */}
        <SessionFilterBar
          activeFilter={activeFilter()}
          sessionCounts={sessionCounts()}
          onFilterChange={handleFilterChange}
        />

        {/* Loading State */}
        <Show when={loading()}>
          <Card
            style={{
              background: `linear-gradient(135deg, ${tempoDesign.colors.card} 0%, rgba(94, 106, 210, 0.05) 100%)`,
              'backdrop-filter': 'blur(10px)',
            }}
          >
            <CardContent
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                padding: '64px 24px',
              }}
            >
              <div style={{ 'text-align': 'center' }}>
                <svg
                  style={{
                    width: '40px',
                    height: '40px',
                    'margin-bottom': '16px',
                    animation: 'spin 1s linear infinite',
                    color: tempoDesign.colors.primary,
                    opacity: 0.8,
                    filter: 'drop-shadow(0 0 8px rgba(94, 106, 210, 0.5))',
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="2"
                    opacity="0.25"
                  />
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p
                  style={{
                    'font-size': tempoDesign.typography.sizes.base,
                    color: tempoDesign.colors.mutedForeground,
                    margin: 0,
                    'font-weight': tempoDesign.typography.weights.medium,
                  }}
                >
                  Loading your sessions...
                </p>
              </div>
            </CardContent>
          </Card>
        </Show>

        {/* Error State */}
        <Show when={error()}>
          <Card
            style={{
              border: `1px solid ${tempoDesign.colors.destructive}`,
              background: `linear-gradient(135deg, ${tempoDesign.colors.destructive}15 0%, ${tempoDesign.colors.destructive}05 100%)`,
              'backdrop-filter': 'blur(10px)',
            }}
          >
            <CardContent style={{ padding: '20px' }}>
              <div style={{ display: 'flex', 'align-items': 'flex-start', gap: '12px' }}>
                <div
                  style={{
                    'flex-shrink': 0,
                    width: '40px',
                    height: '40px',
                    'border-radius': tempoDesign.radius.md,
                    background: `${tempoDesign.colors.destructive}20`,
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={tempoDesign.colors.destructive}
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      'font-weight': tempoDesign.typography.weights.semibold,
                      'font-size': tempoDesign.typography.sizes.base,
                      color: tempoDesign.colors.destructive,
                      'margin-bottom': '4px',
                      margin: '0 0 4px 0',
                    }}
                  >
                    Error loading sessions
                  </p>
                  <p
                    style={{
                      'font-size': tempoDesign.typography.sizes.sm,
                      color: tempoDesign.colors.mutedForeground,
                      margin: 0,
                      'line-height': tempoDesign.typography.lineHeights.relaxed,
                    }}
                  >
                    {error()?.message || 'An unknown error occurred'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Show>

        {/* Empty State */}
        <Show when={!loading() && !error() && sessions().length === 0}>
          <Card
            style={{
              background: `linear-gradient(135deg, ${tempoDesign.colors.card} 0%, rgba(94, 106, 210, 0.03) 100%)`,
              'backdrop-filter': 'blur(10px)',
            }}
          >
            <CardContent
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                padding: '64px 24px',
                'text-align': 'center',
              }}
            >
              <div>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 20px',
                    'border-radius': tempoDesign.radius.lg,
                    background: `linear-gradient(135deg, ${tempoDesign.colors.primary}20, ${tempoDesign.colors.frog}15)`,
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'box-shadow': `0 0 24px ${tempoDesign.colors.primary}30`,
                  }}
                >
                  <Calendar size={32} color={tempoDesign.colors.primary} weight="duotone" />
                </div>
                <h3
                  style={{
                    'font-size': tempoDesign.typography.sizes.lg,
                    'font-weight': tempoDesign.typography.weights.semibold,
                    'margin-bottom': '8px',
                    margin: '0 0 8px 0',
                    color: tempoDesign.colors.foreground,
                  }}
                >
                  No sessions yet
                </h3>
                <p
                  style={{
                    'font-size': tempoDesign.typography.sizes.base,
                    color: tempoDesign.colors.mutedForeground,
                    margin: 0,
                    'line-height': tempoDesign.typography.lineHeights.relaxed,
                    'max-width': '320px',
                  }}
                >
                  Create your first session using the Create Session button above
                </p>
              </div>
            </CardContent>
          </Card>
        </Show>

        {/* Sessions List */}
        <For each={sessions()}>
          {(session) => {
            const statusConfig = getStatusConfig(session);
            const progress = calculateProgress(session);
            const sessionId = session.date;
            const isHovered = () => hoveredCard() === sessionId;

            return (
              <Card
                onMouseEnter={() => setHoveredCard(sessionId)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: isHovered()
                    ? `1px solid ${statusConfig.border}`
                    : `1px solid ${tempoDesign.colors.cardBorder}`,
                  background: isHovered()
                    ? `linear-gradient(135deg, ${statusConfig.gradient}), ${tempoDesign.colors.card}`
                    : tempoDesign.colors.card,
                  transform: isHovered() ? 'translateY(-2px)' : 'translateY(0)',
                  'box-shadow': isHovered()
                    ? `0 8px 24px -8px ${statusConfig.color}40, ${tempoDesign.shadows.md}, 0 0 40px ${statusConfig.auroraColor}`
                    : tempoDesign.shadows.sm,
                  position: 'relative',
                  overflow: 'hidden',
                  'backdrop-filter': 'blur(8px)',
                }}
              >
                {/* Accent bar with gradient */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, ${statusConfig.color} 0%, ${statusConfig.color}80 50%, ${statusConfig.color}00 100%)`,
                    opacity: isHovered() ? 1 : 0.6,
                    transition: 'opacity 0.3s ease',
                  }}
                />

                {/* Subtle aurora glow on hover */}
                <Show when={isHovered()}>
                  <div
                    style={{
                      position: 'absolute',
                      top: '-50%',
                      right: '-20%',
                      width: '60%',
                      height: '200%',
                      background: `radial-gradient(ellipse, ${statusConfig.auroraColor} 0%, transparent 60%)`,
                      'pointer-events': 'none',
                      opacity: 0.4,
                      filter: 'blur(40px)',
                      animation: 'aurora-pulse 3s ease-in-out infinite',
                    }}
                  />
                </Show>

                <CardHeader
                  style={{
                    'padding-bottom': '16px',
                    'padding-top': '20px',
                    position: 'relative',
                    'z-index': 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'flex-start',
                      'justify-content': 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div style={{ flex: 1, 'min-width': 0 }}>
                      <CardTitle
                        style={{
                          'font-size': tempoDesign.typography.sizes.xl,
                          'font-weight': tempoDesign.typography.weights.bold,
                          'margin-bottom': '6px',
                          color: tempoDesign.colors.foreground,
                          'letter-spacing': '-0.01em',
                        }}
                      >
                        {getDateLabel(new Date(session.date).toISOString().split('T')[0])}
                      </CardTitle>
                      <CardDescription
                        style={{
                          'font-size': tempoDesign.typography.sizes.sm,
                          color: tempoDesign.colors.mutedForeground,
                          display: 'flex',
                          'align-items': 'center',
                          gap: '6px',
                        }}
                      >
                        <Calendar size={14} weight="duotone" />
                        {format(new Date(session.date), 'EEEE, MMMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      style={{
                        background: statusConfig.bg,
                        color: statusConfig.color,
                        'border-color': statusConfig.border,
                        display: 'flex',
                        'align-items': 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        'font-weight': tempoDesign.typography.weights.semibold,
                        'font-size': tempoDesign.typography.sizes.xs,
                        'box-shadow': `0 0 0 1px ${statusConfig.color}10`,
                      }}
                    >
                      <statusConfig.icon size={14} weight="duotone" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Enhanced Progress Bar */}
                  <div
                    style={{
                      'margin-top': '16px',
                      display: 'flex',
                      'flex-direction': 'column',
                      gap: '6px',
                    }}
                  >
                    {/* Progress Bar Track */}
                    <div
                      style={{
                        height: '16px',
                        'border-radius': tempoDesign.radius.full,
                        background: `${tempoDesign.colors.muted}`,
                        overflow: 'hidden',
                        position: 'relative',
                        border: `1.5px solid ${statusConfig.color}25`,
                        'box-shadow': `inset 0 2px 4px ${tempoDesign.colors.background}80`,
                      }}
                    >
                      {/* Fill Bar */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: `${progress}%`,
                          background: `linear-gradient(90deg, ${statusConfig.color} 0%, ${statusConfig.color}95 100%)`,
                          'border-radius': tempoDesign.radius.full,
                          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          'box-shadow': `0 0 20px ${statusConfig.color}80, inset 0 1px 3px rgba(255,255,255,0.2)`,
                          overflow: 'hidden',
                        }}
                      >
                        {/* Subtle shimmer effect - only on filled area */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)`,
                            animation: 'shimmer 3s infinite',
                          }}
                        />
                      </div>

                      {/* Milestone markers */}
                      <For each={[25, 50, 75]}>
                        {(milestone) => (
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: `${milestone}%`,
                              height: '100%',
                              width: '2px',
                              background: `${statusConfig.color}${progress >= milestone ? '60' : '25'}`,
                              'box-shadow':
                                progress >= milestone ? `0 0 8px ${statusConfig.color}` : 'none',
                              transition: 'all 0.3s ease',
                            }}
                          />
                        )}
                      </For>
                    </div>

                    {/* Progress Milestones Label */}
                    <div
                      style={{
                        display: 'flex',
                        'justify-content': 'space-between',
                        'align-items': 'center',
                        'padding-top': '2px',
                      }}
                    >
                      <span
                        style={{
                          'font-size': tempoDesign.typography.sizes.xs,
                          color: tempoDesign.colors.mutedForeground,
                          'font-weight': tempoDesign.typography.weights.medium,
                        }}
                      >
                        Started
                      </span>
                      <span
                        style={{
                          'font-size': tempoDesign.typography.sizes.xs,
                          color:
                            progress >= 50
                              ? statusConfig.color
                              : tempoDesign.colors.mutedForeground,
                          'font-weight':
                            progress >= 50
                              ? tempoDesign.typography.weights.bold
                              : tempoDesign.typography.weights.medium,
                          transition: 'color 0.3s ease',
                        }}
                      >
                        Halfway
                      </span>
                      <span
                        style={{
                          'font-size': tempoDesign.typography.sizes.xs,
                          color:
                            progress >= 100
                              ? statusConfig.color
                              : tempoDesign.colors.mutedForeground,
                          'font-weight':
                            progress >= 100
                              ? tempoDesign.typography.weights.bold
                              : tempoDesign.typography.weights.medium,
                          transition: 'color 0.3s ease',
                        }}
                      >
                        Complete
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent style={{ 'padding-top': '0px', position: 'relative', 'z-index': 1 }}>
                  {/* Stats Grid */}
                  <div
                    style={{
                      display: 'grid',
                      'grid-template-columns': 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '12px',
                      'margin-bottom': '20px',
                    }}
                  >
                    {/* Duration Stat */}
                    <div
                      style={{
                        padding: '16px',
                        'border-radius': tempoDesign.radius.md,
                        background: `linear-gradient(135deg, ${tempoDesign.colors.primary}12 0%, ${tempoDesign.colors.primary}05 100%)`,
                        border: `1px solid ${tempoDesign.colors.primary}15`,
                        transition: 'all 0.2s ease',
                        transform: isHovered() ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          gap: '8px',
                          'margin-bottom': '8px',
                        }}
                      >
                        <Clock size={16} weight="duotone" color={tempoDesign.colors.primary} />
                        <span
                          style={{
                            'font-size': tempoDesign.typography.sizes.xs,
                            color: tempoDesign.colors.mutedForeground,
                            'text-transform': 'uppercase',
                            'letter-spacing': '0.05em',
                            'font-weight': tempoDesign.typography.weights.medium,
                          }}
                        >
                          Total Time
                        </span>
                      </div>
                      <p
                        style={{
                          'font-size': tempoDesign.typography.sizes.xl,
                          'font-weight': tempoDesign.typography.weights.bold,
                          margin: 0,
                          color: tempoDesign.colors.foreground,
                          'letter-spacing': '-0.02em',
                        }}
                      >
                        {Math.floor(session.totalDuration / 60)}h {session.totalDuration % 60}m
                      </p>
                    </div>

                    {/* Blocks Stat */}
                    <div
                      style={{
                        padding: '16px',
                        'border-radius': tempoDesign.radius.md,
                        background: `linear-gradient(135deg, ${tempoDesign.colors.frog}12 0%, ${tempoDesign.colors.frog}05 100%)`,
                        border: `1px solid ${tempoDesign.colors.frog}15`,
                        transition: 'all 0.2s ease',
                        transform: isHovered() ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          gap: '8px',
                          'margin-bottom': '8px',
                        }}
                      >
                        <ListBullets size={16} weight="duotone" color={tempoDesign.colors.frog} />
                        <span
                          style={{
                            'font-size': tempoDesign.typography.sizes.xs,
                            color: tempoDesign.colors.mutedForeground,
                            'text-transform': 'uppercase',
                            'letter-spacing': '0.05em',
                            'font-weight': tempoDesign.typography.weights.medium,
                          }}
                        >
                          Blocks
                        </span>
                      </div>
                      <p
                        style={{
                          'font-size': tempoDesign.typography.sizes.xl,
                          'font-weight': tempoDesign.typography.weights.bold,
                          margin: 0,
                          color: tempoDesign.colors.foreground,
                          'letter-spacing': '-0.02em',
                        }}
                      >
                        {session.storyBlocks.length}
                      </p>
                    </div>

                    {/* Progress Stat */}
                    <div
                      style={{
                        padding: '16px',
                        'border-radius': tempoDesign.radius.md,
                        background: `linear-gradient(135deg, ${statusConfig.color}12 0%, ${statusConfig.color}05 100%)`,
                        border: `1px solid ${statusConfig.color}15`,
                        transition: 'all 0.2s ease',
                        transform: isHovered() ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          gap: '8px',
                          'margin-bottom': '8px',
                        }}
                      >
                        <ChartBar size={16} weight="duotone" color={statusConfig.color} />
                        <span
                          style={{
                            'font-size': tempoDesign.typography.sizes.xs,
                            color: tempoDesign.colors.mutedForeground,
                            'text-transform': 'uppercase',
                            'letter-spacing': '0.05em',
                            'font-weight': tempoDesign.typography.weights.medium,
                          }}
                        >
                          Progress
                        </span>
                      </div>
                      <p
                        style={{
                          'font-size': tempoDesign.typography.sizes.xl,
                          'font-weight': tempoDesign.typography.weights.bold,
                          margin: 0,
                          color: tempoDesign.colors.foreground,
                          'letter-spacing': '-0.02em',
                        }}
                      >
                        {progress}%
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons Row - Fitts's Law Compliant */}
                  <div
                    style={{
                      display: 'grid',
                      'grid-template-columns': '1fr auto auto',
                      gap: '12px',
                    }}
                  >
                    {/* Open Session Button - Main action */}
                    <Button
                      onClick={() => {
                        const dateKey = new Date(session.date).toISOString().split('T')[0];
                        // Use router navigation instead of callback
                        navigate(`/tempo/sessions/${dateKey}`);
                        // Keep backward compatibility if callback is provided
                        props.onSessionSelect?.(dateKey);
                      }}
                      style={{
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        gap: '8px',
                        height: '48px',
                        'font-size': tempoDesign.typography.sizes.base,
                        'font-weight': tempoDesign.typography.weights.semibold,
                        background: isHovered()
                          ? `linear-gradient(90deg, ${statusConfig.color} 0%, ${statusConfig.color}dd 100%)`
                          : `${statusConfig.color}15`,
                        color: isHovered() ? '#FFFFFF' : statusConfig.color,
                        border: `1px solid ${statusConfig.border}`,
                        'border-radius': tempoDesign.radius.md,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        'box-shadow': isHovered()
                          ? `0 4px 16px ${statusConfig.color}50, 0 0 24px ${statusConfig.auroraColor}`
                          : 'none',
                      }}
                    >
                      Open Session
                      <ArrowRight
                        size={16}
                        weight="bold"
                        style={{
                          transition: 'transform 0.2s ease',
                          transform: isHovered() ? 'translateX(4px)' : 'translateX(0)',
                        }}
                      />
                    </Button>

                    {/* Edit Button - 48x48 icon button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(session);
                      }}
                      variant="outline"
                      style={{
                        height: '48px',
                        width: '48px',
                        'min-width': '48px',
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'border-color': tempoDesign.colors.primary + '40',
                        color: tempoDesign.colors.primary,
                        'border-radius': tempoDesign.radius.md,
                        transition: 'all 0.2s ease',
                        padding: '0',
                      }}
                      title="Edit session"
                    >
                      <PencilSimple size={20} weight="bold" />
                    </Button>

                    {/* Delete Button - 48x48 icon button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(session);
                      }}
                      variant="outline"
                      style={{
                        height: '48px',
                        width: '48px',
                        'min-width': '48px',
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'border-color': tempoDesign.colors.destructive + '40',
                        color: tempoDesign.colors.destructive,
                        'border-radius': tempoDesign.radius.md,
                        transition: 'all 0.2s ease',
                        padding: '0',
                      }}
                      title="Delete session"
                    >
                      <Trash size={20} weight="bold" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          }}
        </For>
      </div>

      {/* Modals */}
      <SessionCreateModal
        isOpen={showCreateModal()}
        onClose={() => setShowCreateModal(false)}
        onSessionCreated={handleSessionCreated}
      />
      <SessionEditModal
        isOpen={showEditModal()}
        session={selectedSession()}
        onClose={handleModalClose}
        onSessionUpdated={handleSessionUpdated}
      />
      <SessionDeleteModal
        isOpen={showDeleteModal()}
        session={selectedSession()}
        onClose={handleModalClose}
        onDeleted={handleSessionDeleted}
      />
      <SessionDuplicateModal
        isOpen={showDuplicateModal()}
        session={selectedSession()}
        onClose={handleModalClose}
        onDuplicated={handleSessionDuplicated}
      />
      <SessionCloseoutModal
        isOpen={showCloseoutModal()}
        session={selectedSession()}
        onClose={() => {
          setShowCloseoutModal(false);
          setSelectedSession(null);
        }}
        onCloseout={handleCloseoutComplete}
      />
    </div>
  );
};
