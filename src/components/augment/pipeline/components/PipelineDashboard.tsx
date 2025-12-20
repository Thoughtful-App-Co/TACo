/**
 * PipelineDashboard - Kanban-style view of job applications with aging indicators
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createMemo, For, Show } from 'solid-js';
import { pipelineStore } from '../store';
import { liquidAugment, statusColors, pipelineAnimations } from '../theme/liquid-augment';
import { FluidCard, StatusBadge, AgingIndicator, ScoreBadge } from '../ui';
import {
  IconGrid,
  IconList,
  IconSend,
  IconMessage,
  IconStar,
  IconClock,
  IconPipeline,
  IconBriefcase,
  IconTrendingUp,
} from '../ui/Icons';
import { SankeyView } from './SankeyView';
import {
  JobApplication,
  ApplicationStatus,
  ACTIVE_STATUSES,
  STATUS_LABELS,
} from '../../../../schemas/pipeline.schema';

interface PipelineDashboardProps {
  currentTheme: () => Partial<typeof liquidAugment> & typeof liquidAugment;
  onSelectJob: (job: JobApplication | null) => void;
  selectedJob: JobApplication | null;
}

export const PipelineDashboard: Component<PipelineDashboardProps> = (props) => {
  const [viewMode, setViewMode] = createSignal<'kanban' | 'list' | 'sankey'>('kanban');
  const theme = () => props.currentTheme();

  const applications = () => pipelineStore.state.applications;
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

    // Sort each group by lastActivityAt (most recent first)
    for (const status of Object.keys(grouped) as ApplicationStatus[]) {
      grouped[status].sort(
        (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
      );
    }

    return grouped;
  });

  const followUpsDue = createMemo(() => pipelineStore.getFollowUpsDue());

  const handleStatusChange = (appId: string, newStatus: ApplicationStatus) => {
    pipelineStore.updateStatus(appId, newStatus);
  };

  return (
    <div>
      {/* Stats Overview */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          'margin-bottom': '24px',
        }}
      >
        <StatCard
          label="Active"
          value={activeApplications().length}
          color={theme().colors.primary}
          icon={IconBriefcase}
        />
        <StatCard
          label="Applied"
          value={applicationsByStatus().applied.length}
          color={statusColors.applied.text}
          icon={IconSend}
        />
        <StatCard
          label="Interviewing"
          value={applicationsByStatus().interviewing.length}
          color={statusColors.interviewing.text}
          icon={IconMessage}
        />
        <StatCard
          label="Offers"
          value={applicationsByStatus().offered.length}
          color={statusColors.offered.text}
          icon={IconStar}
        />
        <StatCard
          label="Follow-ups"
          value={followUpsDue().length}
          color="#F59E0B"
          icon={IconClock}
          pulse={followUpsDue().length > 0}
        />
      </div>

      {/* View Toggle */}
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          'margin-bottom': '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '4px',
            background: 'linear-gradient(135deg, rgba(15, 15, 18, 0.95), rgba(10, 10, 12, 0.98))',
            padding: '5px',
            'border-radius': '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            'box-shadow': 'inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 4px 12px rgba(0, 0, 0, 0.2)',
          }}
        >
          <button
            class="pipeline-btn"
            onClick={() => setViewMode('kanban')}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              padding: '10px 16px',
              background:
                viewMode() === 'kanban'
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))'
                  : 'transparent',
              color: '#FFFFFF',
              border:
                viewMode() === 'kanban'
                  ? '1px solid rgba(255, 255, 255, 0.2)'
                  : '1px solid transparent',
              'border-radius': '8px',
              cursor: 'pointer',
              'font-size': '13px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'font-weight': viewMode() === 'kanban' ? '600' : '400',
              opacity: viewMode() === 'kanban' ? 1 : 0.6,
              transition: `all ${pipelineAnimations.fast}`,
              'box-shadow':
                viewMode() === 'kanban' ? 'inset 0 1px 0 rgba(255, 255, 255, 0.1)' : 'none',
            }}
          >
            <IconGrid size={15} />
            Board
          </button>
          <button
            class="pipeline-btn"
            onClick={() => setViewMode('list')}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              padding: '10px 16px',
              background:
                viewMode() === 'list'
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))'
                  : 'transparent',
              color: '#FFFFFF',
              border:
                viewMode() === 'list'
                  ? '1px solid rgba(255, 255, 255, 0.2)'
                  : '1px solid transparent',
              'border-radius': '8px',
              cursor: 'pointer',
              'font-size': '13px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'font-weight': viewMode() === 'list' ? '600' : '400',
              opacity: viewMode() === 'list' ? 1 : 0.6,
              transition: `all ${pipelineAnimations.fast}`,
              'box-shadow':
                viewMode() === 'list' ? 'inset 0 1px 0 rgba(255, 255, 255, 0.1)' : 'none',
            }}
          >
            <IconList size={15} />
            List
          </button>
          <button
            class="pipeline-btn"
            onClick={() => setViewMode('sankey')}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              padding: '10px 16px',
              background:
                viewMode() === 'sankey'
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))'
                  : 'transparent',
              color: '#FFFFFF',
              border:
                viewMode() === 'sankey'
                  ? '1px solid rgba(255, 255, 255, 0.2)'
                  : '1px solid transparent',
              'border-radius': '8px',
              cursor: 'pointer',
              'font-size': '13px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'font-weight': viewMode() === 'sankey' ? '600' : '400',
              opacity: viewMode() === 'sankey' ? 1 : 0.6,
              transition: `all ${pipelineAnimations.fast}`,
              'box-shadow':
                viewMode() === 'sankey' ? 'inset 0 1px 0 rgba(255, 255, 255, 0.1)' : 'none',
            }}
          >
            <IconTrendingUp size={15} />
            Flow
          </button>
        </div>
      </div>

      {/* Empty State */}
      <Show when={applications().length === 0}>
        <FluidCard
          variant="elevated"
          style={{
            'text-align': 'center',
            padding: '80px 48px',
            background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.9), rgba(20, 20, 25, 0.95))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative gradient orbs */}
          <div
            style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08), transparent 70%)',
              'border-radius': '50%',
              'pointer-events': 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-30px',
              left: '-30px',
              width: '150px',
              height: '150px',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06), transparent 70%)',
              'border-radius': '50%',
              'pointer-events': 'none',
            }}
          />
          <div
            style={{
              display: 'flex',
              'justify-content': 'center',
              'margin-bottom': '20px',
              position: 'relative',
            }}
          >
            <div
              style={{
                padding: '20px',
                'border-radius': '20px',
                background:
                  'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <IconPipeline size={48} color="#60A5FA" />
            </div>
          </div>
          <h3
            style={{
              margin: '0 0 12px',
              'font-size': '24px',
              'font-family': "'Playfair Display', Georgia, serif",
              'font-weight': '600',
              color: theme().colors.text,
            }}
          >
            No applications yet
          </h3>
          <p
            style={{
              margin: '0 0 24px',
              color: theme().colors.textMuted,
              'font-size': '15px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'max-width': '320px',
              'line-height': '1.5',
              display: 'inline-block',
            }}
          >
            Add your first job to start tracking your prospecting pipeline
          </p>
          {/* Subtle CTA hint */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              gap: '8px',
              color: 'rgba(96, 165, 250, 0.7)',
              'font-size': '13px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Click the + button to add a job
          </div>
        </FluidCard>
      </Show>

      {/* Kanban View */}
      <Show when={applications().length > 0 && viewMode() === 'kanban'}>
        <div
          style={{
            display: 'grid',
            'grid-template-columns': 'repeat(5, 1fr)',
            gap: '16px',
            'overflow-x': 'auto',
            'padding-bottom': '16px',
          }}
        >
          <For each={ACTIVE_STATUSES}>
            {(status) => (
              <PipelineColumn
                status={status}
                applications={applicationsByStatus()[status]}
                theme={theme}
                onSelectJob={props.onSelectJob}
                onStatusChange={handleStatusChange}
              />
            )}
          </For>
        </div>
      </Show>

      {/* List View */}
      <Show when={applications().length > 0 && viewMode() === 'list'}>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <For each={applications()}>
            {(app) => (
              <ApplicationRow
                application={app}
                theme={theme}
                onClick={() => props.onSelectJob(app)}
              />
            )}
          </For>
        </div>
      </Show>

      {/* Sankey / Flow View */}
      <Show when={viewMode() === 'sankey'}>
        <SankeyView currentTheme={theme} onSelectJob={props.onSelectJob} />
      </Show>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  icon: Component<{ size?: number; color?: string }>;
  pulse?: boolean;
}

const StatCard: Component<StatCardProps> = (props) => (
  <FluidCard
    variant="stat"
    accentColor={props.color}
    hoverable
    style={{
      padding: '20px 16px',
      'text-align': 'center',
    }}
  >
    {/* Subtle top accent line */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '20%',
        right: '20%',
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${props.color}60, transparent)`,
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
          background: `${props.color}15`,
          border: `1px solid ${props.color}25`,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        }}
      >
        <props.icon size={22} color={props.color} />
      </div>
    </div>
    <div
      class="stat-value"
      style={{
        'font-size': '32px',
        'font-weight': '700',
        'font-family': "'Playfair Display', Georgia, serif",
        color: props.color,
        'line-height': '1',
        'text-shadow': `0 0 20px ${props.color}30`,
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

interface PipelineColumnProps {
  status: ApplicationStatus;
  applications: JobApplication[];
  theme: () => typeof liquidAugment;
  onSelectJob: (job: JobApplication) => void;
  onStatusChange: (appId: string, status: ApplicationStatus) => void;
}

const PipelineColumn: Component<PipelineColumnProps> = (props) => {
  const colors = () => statusColors[props.status];

  return (
    <div
      style={{
        'min-width': '260px',
        background: 'linear-gradient(180deg, rgba(30, 30, 30, 0.6) 0%, rgba(20, 20, 20, 0.4) 100%)',
        'backdrop-filter': 'blur(12px)',
        'border-radius': '14px',
        padding: '14px',
        'max-height': '600px',
        overflow: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        'box-shadow': 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      }}
    >
      {/* Column Header */}
      <div
        class="column-header"
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          'margin-bottom': '14px',
          padding: '12px 14px',
          background: `linear-gradient(135deg, ${colors().bg}, ${colors().bg.replace('0.15', '0.08')})`,
          'border-radius': '10px',
          border: `1px solid ${colors().border}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle shine effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${colors().text}30, transparent)`,
          }}
        />
        <span
          style={{
            'font-size': '13px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '600',
            'letter-spacing': '0.02em',
            color: colors().text,
          }}
        >
          {STATUS_LABELS[props.status]}
        </span>
        <span
          style={{
            padding: '4px 10px',
            background: `${colors().text}20`,
            'border-radius': '12px',
            'font-size': '12px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: colors().text,
            'font-weight': '700',
            'min-width': '24px',
            'text-align': 'center',
          }}
        >
          {props.applications.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '10px' }}>
        <For each={props.applications}>
          {(app) => (
            <ApplicationCard
              application={app}
              theme={props.theme}
              onClick={() => props.onSelectJob(app)}
              statusColor={colors().text}
            />
          )}
        </For>
      </div>
    </div>
  );
};

interface ApplicationCardProps {
  application: JobApplication;
  theme: () => typeof liquidAugment;
  onClick: () => void;
  statusColor?: string;
}

const ApplicationCard: Component<ApplicationCardProps> = (props) => {
  const app = () => props.application;
  const accentColor = () => props.statusColor || props.theme().colors.primary;

  return (
    <FluidCard
      onClick={props.onClick}
      hoverable
      glowColor={accentColor()}
      style={{
        padding: '14px',
        cursor: 'pointer',
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(35, 35, 40, 0.95), rgba(25, 25, 30, 0.98))',
        border: `1px solid rgba(255, 255, 255, 0.08)`,
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '8px',
          bottom: '8px',
          width: '3px',
          background: `linear-gradient(180deg, ${accentColor()}, ${accentColor()}60)`,
          'border-radius': '0 3px 3px 0',
          opacity: 0.8,
        }}
      />
      <div style={{ 'padding-left': '8px' }}>
        <div
          style={{
            'font-size': '14px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '600',
            color: props.theme().colors.text,
            'margin-bottom': '4px',
            'white-space': 'nowrap',
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
            'line-height': '1.3',
          }}
        >
          {app().roleName}
        </div>
        <div
          style={{
            'font-size': '12px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: props.theme().colors.textMuted,
            'margin-bottom': '12px',
            'white-space': 'nowrap',
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
          }}
        >
          {app().companyName}
        </div>

        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
            gap: '8px',
          }}
        >
          <AgingIndicator lastActivityAt={app().lastActivityAt} size="sm" />
          <Show when={app().analysis?.overallScore}>
            <ScoreBadge score={app().analysis!.overallScore} size="sm" />
          </Show>
        </div>
      </div>
    </FluidCard>
  );
};

interface ApplicationRowProps {
  application: JobApplication;
  theme: () => typeof liquidAugment;
  onClick: () => void;
}

const ApplicationRow: Component<ApplicationRowProps> = (props) => {
  const app = () => props.application;
  const statusColor = () => statusColors[app().status]?.text || '#FFFFFF';

  return (
    <FluidCard
      onClick={props.onClick}
      hoverable
      glowColor={statusColor()}
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '20px',
        padding: '18px 20px',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, rgba(35, 35, 40, 0.9), rgba(25, 25, 30, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Status indicator dot */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '4px',
          height: '40%',
          'min-height': '24px',
          background: statusColor(),
          'border-radius': '0 4px 4px 0',
          'box-shadow': `0 0 8px ${statusColor()}50`,
        }}
      />
      {/* Company/Role */}
      <div style={{ flex: '1', 'min-width': '0', 'padding-left': '8px' }}>
        <div
          style={{
            'font-size': '15px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '600',
            color: props.theme().colors.text,
            'white-space': 'nowrap',
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
            'line-height': '1.3',
          }}
        >
          {app().roleName}
        </div>
        <div
          style={{
            'font-size': '13px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: props.theme().colors.textMuted,
            'margin-top': '2px',
          }}
        >
          {app().companyName}
        </div>
      </div>

      {/* Status */}
      <StatusBadge status={app().status} size="sm" />

      {/* Score */}
      <Show when={app().analysis?.overallScore}>
        <ScoreBadge score={app().analysis!.overallScore} size="sm" />
      </Show>

      {/* Aging */}
      <AgingIndicator lastActivityAt={app().lastActivityAt} size="sm" />

      {/* Hover arrow indicator */}
      <div
        style={{
          width: '24px',
          height: '24px',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          color: 'rgba(255, 255, 255, 0.3)',
          transition: 'all 0.2s ease',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </FluidCard>
  );
};

export default PipelineDashboard;
