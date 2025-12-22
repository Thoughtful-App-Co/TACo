/**
 * DashboardView - Home screen for Prospect with stats overview, recent activity, and quick actions
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createMemo, For, Show } from 'solid-js';
import { pipelineStore } from '../store';
import { liquidAugment, statusColors, pipelineAnimations } from '../theme/liquid-augment';
import { getCurrentDuotone, getStatusDuotone } from '../theme/riasec-colors';
import { FluidCard, StatTooltipContent, Tooltip, AgingIndicator, StatusBadge } from '../ui';
import {
  IconBriefcaseDuotone,
  IconSendDuotone,
  IconMessageDuotone,
  IconStarDuotone,
  IconClockDuotone,
  IconPlus,
  IconUpload,
  IconChevronRight,
} from '../ui/Icons';
import {
  JobApplication,
  ApplicationStatus,
  ACTIVE_STATUSES,
  STATUS_LABELS,
  daysSince,
} from '../../../../schemas/pipeline.schema';
import { exportAndDownload } from '../utils/csv-export';

interface DashboardViewProps {
  currentTheme: () => Partial<typeof liquidAugment> & typeof liquidAugment;
  onSelectJob: (job: JobApplication) => void;
  onAddJob: () => void;
  onImportCSV: () => void;
}

interface ActivityItem {
  id: string;
  type: 'status_change' | 'new_application' | 'deadline';
  application: JobApplication;
  timestamp: Date;
  description: string;
  previousStatus?: ApplicationStatus;
  newStatus?: ApplicationStatus;
}

export const DashboardView: Component<DashboardViewProps> = (props) => {
  const theme = () => props.currentTheme();
  const applications = () => pipelineStore.state.applications;
  const duotoneColors = createMemo(() => getCurrentDuotone());

  // Export CSV handler
  const handleExportCSV = () => {
    exportAndDownload(pipelineStore.state.applications);
  };

  const activeApplications = createMemo(() =>
    applications().filter((app) => ACTIVE_STATUSES.includes(app.status))
  );

  const applicationsByStatus = createMemo(() => {
    const grouped: Record<ApplicationStatus, JobApplication[]> = {
      saved: [],
      applied: [],
      screening: [],
      interviewing: [],
      offered: [],
      accepted: [],
      rejected: [],
      withdrawn: [],
    };

    for (const app of applications()) {
      grouped[app.status].push(app);
    }

    return grouped;
  });

  const followUpsDue = createMemo(() => pipelineStore.getFollowUpsDue());

  // Calculate aggregate stats
  const aggregateStats = createMemo(() => {
    const apps = applications();
    const active = activeApplications();

    // Average score across all analyzed applications
    const analyzedApps = apps.filter((a) => a.analysis?.overallScore);
    const avgScore =
      analyzedApps.length > 0
        ? Math.round(
            analyzedApps.reduce((sum, a) => sum + (a.analysis?.overallScore || 0), 0) /
              analyzedApps.length
          )
        : null;

    // Applications added this week
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const addedThisWeek = apps.filter((a) => new Date(a.createdAt).getTime() > oneWeekAgo).length;

    // Applications needing attention (stale > 14 days)
    const stale = active.filter((a) => daysSince(a.lastActivityAt) >= 14).length;

    return { avgScore, addedThisWeek, stale, total: apps.length, active: active.length };
  });

  // Calculate conversion rates
  const conversionRates = createMemo(() => {
    const apps = applications();
    if (apps.length === 0) return { toApplied: null, toInterview: null, toOffer: null };

    // Count applications that have been in each status at any point
    const everSaved = apps.filter((a) => a.statusHistory?.some((h) => h.status === 'saved')).length;
    const everApplied = apps.filter((a) =>
      a.statusHistory?.some((h) => h.status === 'applied')
    ).length;
    const everInterviewing = apps.filter((a) =>
      a.statusHistory?.some((h) => h.status === 'interviewing')
    ).length;

    // Count applications that progressed FROM one status TO the next
    const savedToApplied = apps.filter(
      (a) =>
        a.statusHistory?.some((h) => h.status === 'saved') &&
        a.statusHistory?.some((h) => h.status === 'applied')
    ).length;

    const appliedToInterviewing = apps.filter(
      (a) =>
        a.statusHistory?.some((h) => h.status === 'applied') &&
        a.statusHistory?.some((h) => h.status === 'interviewing')
    ).length;

    const interviewingToOffered = apps.filter(
      (a) =>
        a.statusHistory?.some((h) => h.status === 'interviewing') &&
        a.statusHistory?.some((h) => h.status === 'offered')
    ).length;

    return {
      toApplied: everSaved > 0 ? Math.round((savedToApplied / everSaved) * 100) : null,
      toInterview: everApplied > 0 ? Math.round((appliedToInterviewing / everApplied) * 100) : null,
      toOffer:
        everInterviewing > 0 ? Math.round((interviewingToOffered / everInterviewing) * 100) : null,
    };
  });

  // Generate recent activity (last 7 items)
  const recentActivity = createMemo(() => {
    const items: ActivityItem[] = [];

    // Collect status changes
    for (const app of applications()) {
      if (app.statusHistory && app.statusHistory.length > 1) {
        // Get the most recent status change
        const latestChange = app.statusHistory[app.statusHistory.length - 1];
        const previousChange = app.statusHistory[app.statusHistory.length - 2];

        items.push({
          id: `${app.id}-status-${app.statusHistory.length}`,
          type: 'status_change',
          application: app,
          timestamp: new Date(latestChange.timestamp),
          description: `${app.companyName} moved to ${STATUS_LABELS[latestChange.status]}`,
          previousStatus: previousChange.status,
          newStatus: latestChange.status,
        });
      }
    }

    // Collect new applications (within last week)
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const app of applications()) {
      if (new Date(app.createdAt).getTime() > oneWeekAgo) {
        items.push({
          id: `${app.id}-created`,
          type: 'new_application',
          application: app,
          timestamp: new Date(app.createdAt),
          description: `Added ${app.companyName} - ${app.roleName}`,
        });
      }
    }

    // Collect upcoming deadlines
    for (const app of followUpsDue()) {
      items.push({
        id: `${app.id}-deadline`,
        type: 'deadline',
        application: app,
        timestamp: new Date(app.followUpDue!),
        description: `Follow-up due for ${app.companyName}`,
      });
    }

    // Sort by timestamp (most recent first) and take 7
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 7);
  });

  const avgDaysInStatus = createMemo(() => {
    const result: Record<ApplicationStatus, number | null> = {
      saved: null,
      applied: null,
      screening: null,
      interviewing: null,
      offered: null,
      accepted: null,
      rejected: null,
      withdrawn: null,
    };

    for (const status of ACTIVE_STATUSES) {
      const apps = applicationsByStatus()[status];
      if (apps.length === 0) continue;

      const totalDays = apps.reduce((sum, app) => {
        return sum + daysSince(app.lastActivityAt);
      }, 0);
      result[status] = Math.round(totalDays / apps.length);
    }

    return result;
  });

  return (
    <div style={{ padding: '32px', 'max-width': '1400px' }}>
      {/* Header */}
      <div style={{ 'margin-bottom': '32px' }}>
        <h1
          style={{
            margin: '0 0 8px',
            'font-size': '32px',
            'font-family': "'Playfair Display', Georgia, serif",
            'font-weight': '700',
            color: theme().colors.text,
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            margin: 0,
            'font-size': '15px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: theme().colors.textMuted,
          }}
        >
          Overview of your job search progress
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          'margin-bottom': '32px',
        }}
      >
        <Tooltip
          content={
            <StatTooltipContent
              title="Active Applications"
              metrics={[
                { label: 'Total tracked', value: aggregateStats().total },
                {
                  label: 'Added this week',
                  value: aggregateStats().addedThisWeek,
                  trend: aggregateStats().addedThisWeek > 0 ? 'up' : 'neutral',
                },
                {
                  label: 'Needing attention',
                  value: aggregateStats().stale,
                  color: aggregateStats().stale > 0 ? '#F59E0B' : undefined,
                },
              ]}
              insight={
                aggregateStats().avgScore
                  ? `Avg match score: ${aggregateStats().avgScore}%`
                  : 'Analyze jobs to see match scores'
              }
            />
          }
          position="bottom"
        >
          <StatCard
            label="Active"
            value={activeApplications().length}
            icon={IconBriefcaseDuotone}
            duotoneColors={duotoneColors()}
          />
        </Tooltip>

        <Tooltip
          content={
            <StatTooltipContent
              title="Applied"
              metrics={[
                { label: 'Avg. days since applied', value: avgDaysInStatus().applied ?? '—' },
                {
                  label: 'Conversion to interview',
                  value: conversionRates().toInterview ? `${conversionRates().toInterview}%` : '—',
                  color:
                    conversionRates().toInterview && conversionRates().toInterview! >= 30
                      ? '#10B981'
                      : undefined,
                },
              ]}
              insight="Applications awaiting response"
            />
          }
          position="bottom"
        >
          <StatCard
            label="Applied"
            value={applicationsByStatus().applied.length}
            icon={IconSendDuotone}
            duotoneColors={getStatusDuotone('applied')}
          />
        </Tooltip>

        <Tooltip
          content={
            <StatTooltipContent
              title="Interviewing"
              metrics={[
                { label: 'Avg. days in stage', value: avgDaysInStatus().interviewing ?? '—' },
                {
                  label: 'Conversion to offer',
                  value: conversionRates().toOffer ? `${conversionRates().toOffer}%` : '—',
                  color:
                    conversionRates().toOffer && conversionRates().toOffer! >= 50
                      ? '#10B981'
                      : '#F59E0B',
                },
              ]}
              insight="Active interview processes"
            />
          }
          position="bottom"
        >
          <StatCard
            label="Interviewing"
            value={applicationsByStatus().interviewing.length}
            icon={IconMessageDuotone}
            duotoneColors={getStatusDuotone('interviewing')}
          />
        </Tooltip>

        <Tooltip
          content={
            <StatTooltipContent
              title="Offers Received"
              metrics={[
                { label: 'Pending decision', value: applicationsByStatus().offered.length },
                {
                  label: 'Total accepted',
                  value: applicationsByStatus().accepted.length,
                  color: '#10B981',
                },
              ]}
              insight={
                applicationsByStatus().offered.length > 0
                  ? 'Review and respond to offers'
                  : 'Keep going!'
              }
            />
          }
          position="bottom"
        >
          <StatCard
            label="Offers"
            value={applicationsByStatus().offered.length}
            icon={IconStarDuotone}
            duotoneColors={getStatusDuotone('offered')}
          />
        </Tooltip>

        <Tooltip
          content={
            <StatTooltipContent
              title="Follow-ups Due"
              metrics={[
                {
                  label: 'Overdue',
                  value: followUpsDue().length,
                  color: followUpsDue().length > 0 ? '#EF4444' : undefined,
                },
                {
                  label: 'Stale (14+ days)',
                  value: aggregateStats().stale,
                  color: aggregateStats().stale > 0 ? '#F59E0B' : undefined,
                },
              ]}
              insight={followUpsDue().length > 0 ? 'Time to reach out!' : 'All caught up'}
            />
          }
          position="bottom"
        >
          <StatCard
            label="Follow-ups"
            value={followUpsDue().length}
            icon={IconClockDuotone}
            color="#F59E0B"
            pulse={followUpsDue().length > 0}
          />
        </Tooltip>
      </div>

      {/* Two Column Layout: Recent Activity + Quick Actions */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': '1fr 380px',
          gap: '24px',
        }}
      >
        {/* Recent Activity */}
        <FluidCard
          variant="elevated"
          style={{
            padding: '24px',
            'min-height': '400px',
          }}
        >
          <h2
            style={{
              margin: '0 0 20px',
              'font-size': '18px',
              'font-family': "'Playfair Display', Georgia, serif",
              'font-weight': '600',
              color: theme().colors.text,
            }}
          >
            Recent Activity
          </h2>

          <Show
            when={recentActivity().length > 0}
            fallback={
              <div
                style={{
                  'text-align': 'center',
                  padding: '60px 20px',
                  color: theme().colors.textMuted,
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    margin: '0 auto 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    'border-radius': '12px',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                  }}
                >
                  <IconClockDuotone size={24} opacity={0.3} />
                </div>
                <p style={{ margin: 0, 'font-size': '14px' }}>No recent activity</p>
              </div>
            }
          >
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '2px' }}>
              <For each={recentActivity()}>
                {(item) => (
                  <ActivityItemCard
                    item={item}
                    theme={theme}
                    onClick={() => props.onSelectJob(item.application)}
                  />
                )}
              </For>
            </div>
          </Show>
        </FluidCard>

        {/* Quick Actions */}
        <FluidCard
          variant="elevated"
          style={{
            padding: '24px',
            display: 'flex',
            'flex-direction': 'column',
            gap: '16px',
          }}
        >
          <h2
            style={{
              margin: '0 0 8px',
              'font-size': '18px',
              'font-family': "'Playfair Display', Georgia, serif",
              'font-weight': '600',
              color: theme().colors.text,
            }}
          >
            Quick Actions
          </h2>

          <button
            class="pipeline-btn"
            onClick={props.onAddJob}
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
              padding: '16px 20px',
              background: `linear-gradient(135deg, ${theme().colors.primary}15, ${theme().colors.primary}05)`,
              border: `1px solid ${theme().colors.primary}30`,
              'border-radius': '12px',
              color: theme().colors.text,
              cursor: 'pointer',
              transition: `all ${pipelineAnimations.fast}`,
              'font-size': '15px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'font-weight': '500',
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  background: `${theme().colors.primary}20`,
                  'border-radius': '10px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  color: theme().colors.primary,
                }}
              >
                <IconPlus size={18} />
              </div>
              <span>Add New Job</span>
            </div>
            <IconChevronRight size={16} color={theme().colors.textMuted} />
          </button>

          <button
            class="pipeline-btn"
            onClick={props.onImportCSV}
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
              padding: '16px 20px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '12px',
              color: theme().colors.text,
              cursor: 'pointer',
              transition: `all ${pipelineAnimations.fast}`,
              'font-size': '15px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'font-weight': '500',
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  'border-radius': '10px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  color: theme().colors.textMuted,
                }}
              >
                <IconUpload size={18} />
              </div>
              <span>Import from CSV</span>
            </div>
            <IconChevronRight size={16} color={theme().colors.textMuted} />
          </button>

          <button
            class="pipeline-btn"
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
              padding: '16px 20px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '12px',
              color: theme().colors.text,
              cursor: 'pointer',
              transition: `all ${pipelineAnimations.fast}`,
              'font-size': '15px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'font-weight': '500',
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  'border-radius': '10px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  color: theme().colors.textMuted,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <span>Export to CSV</span>
            </div>
            <IconChevronRight size={16} color={theme().colors.textMuted} />
          </button>

          {/* Helpful Tips Section */}
          <div
            style={{
              'margin-top': '16px',
              padding: '16px',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              'border-radius': '10px',
            }}
          >
            <div
              style={{
                'font-size': '13px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'font-weight': '500',
                color: '#60A5FA',
                'margin-bottom': '8px',
              }}
            >
              💡 Pro Tip
            </div>
            <p
              style={{
                margin: 0,
                'font-size': '13px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                color: theme().colors.textMuted,
                'line-height': '1.5',
              }}
            >
              <Show
                when={aggregateStats().stale > 0}
                fallback="Keep your pipeline active by following up every 7-14 days."
              >
                You have {aggregateStats().stale} stale application
                {aggregateStats().stale !== 1 ? 's' : ''}. Consider sending follow-ups!
              </Show>
            </p>
          </div>
        </FluidCard>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  label: string;
  value: number;
  icon: Component<{
    size?: number;
    primaryColor?: string;
    secondaryColor?: string;
    opacity?: number;
  }>;
  duotoneColors?: { primary: string; secondary: string };
  color?: string;
  pulse?: boolean;
}

const StatCard: Component<StatCardProps> = (props) => {
  const primaryColor = () => props.duotoneColors?.primary || props.color || '#8B5CF6';
  const secondaryColor = () => props.duotoneColors?.secondary || primaryColor();

  return (
    <FluidCard
      variant="stat"
      accentColor={primaryColor()}
      hoverable
      style={{
        padding: '20px 16px',
        'text-align': 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          right: '15%',
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${primaryColor()}60, ${secondaryColor()}40, transparent)`,
          'border-radius': '0 0 2px 2px',
        }}
      />
      <div
        style={{
          display: 'flex',
          'justify-content': 'center',
          'margin-bottom': '12px',
          animation: props.pulse ? 'aging-pulse 2s ease-in-out infinite' : 'none',
          opacity: 0.9,
        }}
      >
        <div
          style={{
            padding: '10px',
            'border-radius': '12px',
            background: `linear-gradient(135deg, ${primaryColor()}15, ${secondaryColor()}10)`,
            border: `1px solid ${primaryColor()}25`,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
          }}
        >
          <props.icon
            size={22}
            primaryColor={primaryColor()}
            secondaryColor={secondaryColor()}
            opacity={0.4}
          />
        </div>
      </div>
      <div
        class="stat-value"
        style={{
          'font-size': '32px',
          'font-weight': '700',
          'font-family': "'Playfair Display', Georgia, serif",
          color: primaryColor(),
          'line-height': '1',
          'text-shadow': `0 0 20px ${primaryColor()}30`,
        }}
      >
        {props.value}
      </div>
      <div
        style={{
          'font-size': '11px',
          'font-family': "'Space Grotesk', system-ui, sans-serif",
          color: 'rgba(255,255,255,0.55)',
          'margin-top': '8px',
          'text-transform': 'uppercase',
          'letter-spacing': '0.1em',
          'font-weight': '500',
        }}
      >
        {props.label}
      </div>
    </FluidCard>
  );
};

// Activity Item Card Component
interface ActivityItemCardProps {
  item: ActivityItem;
  theme: () => typeof liquidAugment;
  onClick: () => void;
}

const ActivityItemCard: Component<ActivityItemCardProps> = (props) => {
  const item = () => props.item;
  const theme = () => props.theme();

  const getIcon = () => {
    switch (item().type) {
      case 'status_change':
        return item().newStatus ? statusColors[item().newStatus!] : null;
      case 'new_application':
        return { text: '#60A5FA' };
      case 'deadline':
        return { text: '#F59E0B' };
      default:
        return null;
    }
  };

  const iconColor = () => getIcon()?.text || theme().colors.textMuted;

  const timeAgo = () => {
    const now = Date.now();
    const timestamp = item().timestamp.getTime();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div
      onClick={props.onClick}
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '12px',
        padding: '12px 16px',
        'border-radius': '10px',
        cursor: 'pointer',
        transition: `all ${pipelineAnimations.fast}`,
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Icon/Status indicator */}
      <div
        style={{
          width: '8px',
          height: '8px',
          'border-radius': '50%',
          background: iconColor(),
          'box-shadow': `0 0 8px ${iconColor()}50`,
          'flex-shrink': 0,
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, 'min-width': 0 }}>
        <div
          style={{
            'font-size': '14px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: theme().colors.text,
            'margin-bottom': '2px',
            'white-space': 'nowrap',
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
          }}
        >
          {item().description}
        </div>
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
            'font-size': '12px',
            color: theme().colors.textMuted,
          }}
        >
          <span>{timeAgo()}</span>
          <Show when={item().type === 'status_change' && item().newStatus}>
            <StatusBadge status={item().newStatus!} size="sm" />
          </Show>
        </div>
      </div>

      {/* Aging indicator for applications */}
      <Show when={item().type === 'status_change' || item().type === 'deadline'}>
        <AgingIndicator lastActivityAt={item().application.lastActivityAt} size="sm" />
      </Show>
    </div>
  );
};

export default DashboardView;
