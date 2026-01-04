import { Component, createEffect, createSignal, For, Show } from 'solid-js';
import { format, isToday, isYesterday } from 'date-fns';
import {
  Calendar,
  ClockClockwise,
  CheckCircle,
  ArrowRight,
  Clock,
  ListBullets,
  ChartBar,
} from 'phosphor-solid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { tempoDesign } from '../../theme/tempo-design';
import { SessionStorageService } from '../../services/session-storage.service';
import type { Session } from '../../lib/types';
import { logger } from '../../../../lib/logger';

interface SessionsListProps {
  onSessionSelect?: (sessionId: string) => void;
}

// Add aurora animation to global styles
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
`;
document.head.appendChild(auroraStyles);

export const SessionsList: Component<SessionsListProps> = (props) => {
  const [sessions, setSessions] = createSignal<Session[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [hoveredCard, setHoveredCard] = createSignal<string | null>(null);
  const storageService = new SessionStorageService();

  createEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        const allSessions = await storageService.getAllSessions();
        // Sort by date descending (most recent first)
        const sorted = allSessions.sort(
          (a: Session, b: Session) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setSessions(sorted);
      } catch (err) {
        logger.storage.error('Failed to load sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  });

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
        <div style={{ padding: '0 4px' }}>
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
                    {error()}
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
                  Create your first session by entering tasks in the Create Tasks tab
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

                  {/* Progress Bar with aurora glow */}
                  <div
                    style={{
                      'margin-top': '16px',
                      height: '6px',
                      'border-radius': tempoDesign.radius.full,
                      background: `${tempoDesign.colors.muted}`,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, ${statusConfig.color} 0%, ${statusConfig.color}80 100%)`,
                        'border-radius': tempoDesign.radius.full,
                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        'box-shadow': `0 0 12px ${statusConfig.color}60`,
                      }}
                    />
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

                  {/* Open Session Button */}
                  <Button
                    onClick={() => {
                      const dateKey = new Date(session.date).toISOString().split('T')[0];
                      props.onSessionSelect?.(dateKey);
                    }}
                    style={{
                      width: '100%',
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
                </CardContent>
              </Card>
            );
          }}
        </For>
      </div>
    </div>
  );
};
