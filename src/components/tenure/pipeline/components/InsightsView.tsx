/**
 * InsightsView - Analytics and insights section with Flow, Analytics, and Trends tabs
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show, For, createMemo } from 'solid-js';
import { liquidTenure, pipelineAnimations, statusColors } from '../theme/liquid-tenure';
import { SankeyView } from './SankeyView';
import {
  IconTrendingUp,
  IconPipeline,
  IconClock,
  IconBriefcase,
  IconCheck,
  IconSend,
  IconSearch,
  IconMessage,
  IconStar,
  IconChevronRight,
  IconFilter,
} from '../ui/Icons';
import { FluidCard } from '../ui';
import { pipelineStore } from '../store';
import { JobApplication, ApplicationStatus } from '../../../../schemas/pipeline.schema';

interface InsightsViewProps {
  currentTheme: () => Partial<typeof liquidTenure> & typeof liquidTenure;
  onSelectJob: (job: JobApplication) => void;
}

type InsightsTab = 'flow' | 'analytics' | 'trends';

export const InsightsView: Component<InsightsViewProps> = (props) => {
  const theme = () => props.currentTheme();
  const [activeTab, setActiveTab] = createSignal<InsightsTab>('flow');

  const tabs = [
    {
      id: 'flow' as InsightsTab,
      label: 'Flow',
      icon: IconPipeline,
      description: 'Pipeline visualization',
    },
    {
      id: 'analytics' as InsightsTab,
      label: 'Analytics',
      icon: IconTrendingUp,
      description: 'Conversion metrics',
    },
    {
      id: 'trends' as InsightsTab,
      label: 'Trends',
      icon: IconClock,
      description: 'Activity over time',
    },
  ];

  // Handle keyboard navigation for tabs
  const handleTabKeyDown = (e: KeyboardEvent, tabId: InsightsTab, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % tabs.length;
      setActiveTab(tabs[nextIndex].id);
      (document.querySelector(`[data-tab="${tabs[nextIndex].id}"]`) as HTMLElement)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prevIndex].id);
      (document.querySelector(`[data-tab="${tabs[prevIndex].id}"]`) as HTMLElement)?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTab(tabId);
    }
  };

  return (
    <div style={{ padding: '32px', 'max-width': '1400px' }}>
      {/* Enhanced Tab Navigation */}
      <div
        role="tablist"
        aria-label="Insights navigation"
        style={{
          display: 'inline-flex',
          gap: '4px',
          background: 'linear-gradient(135deg, rgba(15, 15, 18, 1), rgba(10, 10, 12, 1))',
          padding: '6px',
          'border-radius': '14px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          'box-shadow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 16px rgba(0, 0, 0, 0.35)',
          'margin-bottom': '28px',
        }}
      >
        <For each={tabs}>
          {(tab, index) => (
            <button
              role="tab"
              aria-selected={activeTab() === tab.id}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              data-tab={tab.id}
              tabIndex={activeTab() === tab.id ? 0 : -1}
              class="pipeline-btn"
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, tab.id, index())}
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '10px',
                padding: '12px 24px',
                background:
                  activeTab() === tab.id
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.12))'
                    : 'transparent',
                color: '#FFFFFF',
                border:
                  activeTab() === tab.id
                    ? '1px solid rgba(255, 255, 255, 0.35)'
                    : '1px solid transparent',
                'border-radius': '10px',
                cursor: 'pointer',
                'font-size': '14px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'font-weight': activeTab() === tab.id ? '600' : '400',
                opacity: activeTab() === tab.id ? 1 : 0.7,
                transition: `all ${pipelineAnimations.normal} cubic-bezier(0.4, 0, 0.2, 1)`,
                'box-shadow':
                  activeTab() === tab.id
                    ? 'inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 2px 8px rgba(0, 0, 0, 0.3)'
                    : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  width: '24px',
                  height: '24px',
                  'border-radius': '6px',
                  background: activeTab() === tab.id ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  transition: `all ${pipelineAnimations.fast}`,
                }}
              >
                <tab.icon size={16} />
              </div>
              <span>{tab.label}</span>
              <Show when={activeTab() === tab.id}>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '40%',
                    height: '2px',
                    background:
                      'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent)',
                    'border-radius': '1px',
                  }}
                />
              </Show>
            </button>
          )}
        </For>
      </div>

      {/* Tab Content with Animation */}
      <div
        style={{
          animation: 'pipeline-fade-up 0.3s ease forwards',
        }}
      >
        <Show when={activeTab() === 'flow'}>
          <div role="tabpanel" id="flow-panel" aria-labelledby="flow-tab">
            <SankeyView currentTheme={theme} onSelectJob={props.onSelectJob} />
          </div>
        </Show>

        <Show when={activeTab() === 'analytics'}>
          <div role="tabpanel" id="analytics-panel" aria-labelledby="analytics-tab">
            <AnalyticsTab theme={theme} />
          </div>
        </Show>

        <Show when={activeTab() === 'trends'}>
          <div role="tabpanel" id="trends-panel" aria-labelledby="trends-tab">
            <TrendsTab theme={theme} />
          </div>
        </Show>
      </div>
    </div>
  );
};

// Analytics Tab Component
interface TabProps {
  theme: () => typeof liquidTenure;
}

// Pipeline stage progression order for calculating conversions
const PIPELINE_STAGES: ApplicationStatus[] = [
  'saved',
  'applied',
  'screening',
  'interviewing',
  'offered',
  'accepted',
];

// Helper to get the highest stage index an app has reached
function getHighestReachedStageIndex(app: JobApplication): number {
  const currentStatus = app.status;
  const currentIndex = PIPELINE_STAGES.indexOf(currentStatus);

  // If app is in a normal pipeline stage, it has reached all stages up to current
  if (currentIndex >= 0) {
    return currentIndex;
  }

  // For rejected/withdrawn apps, determine the last "good" stage they reached
  if (currentStatus === 'rejected' || currentStatus === 'withdrawn') {
    // Use rejectedAtStatus if available
    if (app.rejectedAtStatus) {
      const rejectedIndex = PIPELINE_STAGES.indexOf(app.rejectedAtStatus);
      if (rejectedIndex >= 0) {
        return rejectedIndex;
      }
    }

    // Fallback: check statusHistory for the highest pipeline stage reached
    if (app.statusHistory && app.statusHistory.length > 0) {
      let maxIndex = -1;
      for (const h of app.statusHistory) {
        const idx = PIPELINE_STAGES.indexOf(h.status);
        if (idx > maxIndex) {
          maxIndex = idx;
        }
      }
      if (maxIndex >= 0) {
        return maxIndex;
      }
    }

    // Default fallback: assume at least 'saved' stage was reached
    return 0; // 'saved' is index 0
  }

  return -1; // Unknown status
}

const AnalyticsTab: Component<TabProps> = (props) => {
  const theme = () => props.theme();

  // Compute comprehensive analytics from store
  const analytics = createMemo(() => {
    const apps = pipelineStore.state.applications;

    // Count apps at each current status
    const statusCounts: Record<ApplicationStatus, number> = {
      saved: 0,
      applied: 0,
      screening: 0,
      interviewing: 0,
      offered: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };

    apps.forEach((app) => {
      statusCounts[app.status]++;
    });

    // Count apps that have ever reached each stage (for funnel analysis)
    const reachedStage: Record<ApplicationStatus, number> = {
      saved: 0,
      applied: 0,
      screening: 0,
      interviewing: 0,
      offered: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };

    // For each app, mark all stages up to (and including) their highest reached stage
    apps.forEach((app) => {
      const highestIndex = getHighestReachedStageIndex(app);

      if (highestIndex >= 0) {
        // App reached all stages up to highestIndex
        for (let i = 0; i <= highestIndex; i++) {
          reachedStage[PIPELINE_STAGES[i]]++;
        }
      }
    });

    const total = apps.length;

    // Apps that applied (not just saved)
    const totalApplied = reachedStage.applied;

    // Apps that got any response (screening or beyond)
    const totalResponded = reachedStage.screening;

    // Apps that reached interviewing
    const totalInterviewing = reachedStage.interviewing;

    // Apps that got offers
    const totalOffered = reachedStage.offered;

    // Calculate key rates
    const responseRate = totalApplied > 0 ? (totalResponded / totalApplied) * 100 : 0;
    const interviewRate = totalApplied > 0 ? (totalInterviewing / totalApplied) * 100 : 0;
    const offerRate = totalInterviewing > 0 ? (totalOffered / totalInterviewing) * 100 : 0;

    // Calculate average time to offer from statusHistory
    let avgTimeToOffer: number | null = null;
    const offerTimes: number[] = [];

    const offeredIndex = PIPELINE_STAGES.indexOf('offered');
    const offeredApps = apps.filter((app) => getHighestReachedStageIndex(app) >= offeredIndex);
    offeredApps.forEach((app) => {
      if (app.statusHistory && app.statusHistory.length > 0) {
        const appliedEntry = app.statusHistory.find((h) => h.status === 'applied');
        const offeredEntry = app.statusHistory.find((h) => h.status === 'offered');

        if (appliedEntry && offeredEntry) {
          const appliedDate = new Date(appliedEntry.timestamp);
          const offeredDate = new Date(offeredEntry.timestamp);
          const days = Math.floor(
            (offeredDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (days >= 0) {
            offerTimes.push(days);
          }
        }
      } else if (app.appliedAt) {
        // Fallback: use appliedAt and updatedAt if no history
        const appliedDate = new Date(app.appliedAt);
        const offeredDate = new Date(app.updatedAt);
        const days = Math.floor(
          (offeredDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (days >= 0) {
          offerTimes.push(days);
        }
      }
    });

    if (offerTimes.length > 0) {
      avgTimeToOffer = Math.round(offerTimes.reduce((a, b) => a + b, 0) / offerTimes.length);
    }

    // Stage-to-stage conversion rates
    const conversions = {
      savedToApplied:
        reachedStage.saved > 0 ? (reachedStage.applied / reachedStage.saved) * 100 : 0,
      appliedToScreening:
        reachedStage.applied > 0 ? (reachedStage.screening / reachedStage.applied) * 100 : 0,
      screeningToInterviewing:
        reachedStage.screening > 0 ? (reachedStage.interviewing / reachedStage.screening) * 100 : 0,
      interviewingToOffered:
        reachedStage.interviewing > 0
          ? (reachedStage.offered / reachedStage.interviewing) * 100
          : 0,
      offeredToAccepted:
        reachedStage.offered > 0 ? (reachedStage.accepted / reachedStage.offered) * 100 : 0,
    };

    // Drop-off rates (inverse of conversion)
    const dropoffs = {
      saved: 100 - conversions.savedToApplied,
      applied: 100 - conversions.appliedToScreening,
      screening: 100 - conversions.screeningToInterviewing,
      interviewing: 100 - conversions.interviewingToOffered,
      offered: 100 - conversions.offeredToAccepted,
    };

    // Calculate average duration at each stage
    const stageDurations: Record<string, number | null> = {};
    PIPELINE_STAGES.forEach((stage) => {
      const durations: number[] = [];
      apps.forEach((app) => {
        if (app.statusHistory && app.statusHistory.length > 1) {
          const stageEntry = app.statusHistory.find((h) => h.status === stage);
          if (stageEntry) {
            const stageIndex = app.statusHistory.findIndex((h) => h.status === stage);
            const nextEntry = app.statusHistory[stageIndex + 1];
            if (nextEntry) {
              const stageDate = new Date(stageEntry.timestamp);
              const nextDate = new Date(nextEntry.timestamp);
              const days = Math.floor(
                (nextDate.getTime() - stageDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (days >= 0) {
                durations.push(days);
              }
            }
          }
        }
      });
      stageDurations[stage] =
        durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : null;
    });

    return {
      statusCounts,
      reachedStage,
      total,
      totalApplied,
      responseRate,
      interviewRate,
      offerRate,
      avgTimeToOffer,
      conversions,
      dropoffs,
      stageDurations,
    };
  });

  // Funnel stages for conversion visualization
  const funnelStages = [
    {
      status: 'saved' as ApplicationStatus,
      label: 'Saved',
      icon: IconBriefcase,
      color: statusColors.saved,
    },
    {
      status: 'applied' as ApplicationStatus,
      label: 'Applied',
      icon: IconSend,
      color: statusColors.applied,
    },
    {
      status: 'screening' as ApplicationStatus,
      label: 'Screening',
      icon: IconSearch,
      color: statusColors.screening,
    },
    {
      status: 'interviewing' as ApplicationStatus,
      label: 'Interview',
      icon: IconMessage,
      color: statusColors.interviewing,
    },
    {
      status: 'offered' as ApplicationStatus,
      label: 'Offered',
      icon: IconStar,
      color: statusColors.offered,
    },
    {
      status: 'accepted' as ApplicationStatus,
      label: 'Accepted',
      icon: IconCheck,
      color: statusColors.accepted,
    },
  ];

  // Helper to format percentage
  const formatPercent = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return '0';
    return Math.round(value).toString();
  };

  // Helper to format duration
  const formatDuration = (days: number | null): string => {
    if (days === null) return 'N/A';
    return `${days} days`;
  };

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '24px' }}>
      {/* Conversion Funnel */}
      <FluidCard variant="default">
        <div style={{ 'margin-bottom': '20px' }}>
          <h4
            style={{
              margin: '0 0 4px',
              'font-size': '18px',
              'font-family': "'Playfair Display', Georgia, serif",
              'font-weight': '600',
              color: theme().colors.text,
            }}
          >
            Conversion Funnel
          </h4>
          <p
            style={{
              margin: 0,
              'font-size': '13px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: theme().colors.textMuted,
            }}
          >
            Track how applications progress through each stage
          </p>
        </div>

        {/* Funnel Visualization */}
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
          <For each={funnelStages}>
            {(stage, index) => {
              const reached = () => analytics().reachedStage[stage.status];
              const total = () => analytics().total;
              const percentage = () => (total() > 0 ? Math.round((reached() / total()) * 100) : 0);

              // Get conversion rate from previous stage
              const getConversionRate = (): number => {
                const idx = index();
                if (idx === 0) return 100; // First stage, no conversion
                const conversionData = analytics().conversions;
                switch (idx) {
                  case 1:
                    return conversionData.savedToApplied;
                  case 2:
                    return conversionData.appliedToScreening;
                  case 3:
                    return conversionData.screeningToInterviewing;
                  case 4:
                    return conversionData.interviewingToOffered;
                  case 5:
                    return conversionData.offeredToAccepted;
                  default:
                    return 0;
                }
              };

              return (
                <div style={{ display: 'flex', 'align-items': 'center', gap: '16px' }}>
                  {/* Stage Icon and Label */}
                  <div
                    style={{
                      width: '120px',
                      display: 'flex',
                      'align-items': 'center',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        'border-radius': '8px',
                        background: stage.color.bg,
                        border: `1px solid ${stage.color.border}`,
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                      }}
                    >
                      <stage.icon size={16} color={stage.color.text} />
                    </div>
                    <span
                      style={{
                        'font-size': '13px',
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                        color: theme().colors.text,
                        'font-weight': '500',
                      }}
                    >
                      {stage.label}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ flex: 1, position: 'relative' }}>
                    <div
                      style={{
                        height: '28px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        'border-radius': '8px',
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
                          width: `${percentage()}%`,
                          background: stage.color.gradient,
                          'border-radius': '8px',
                          transition: `width ${pipelineAnimations.slow} ease`,
                          opacity: reached() > 0 ? 1 : 0.3,
                        }}
                      />
                      {/* Count Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          'font-size': '13px',
                          'font-family': "'Space Grotesk', system-ui, sans-serif",
                          'font-weight': '600',
                          color: reached() > 0 ? '#FFFFFF' : theme().colors.textMuted,
                          'text-shadow': reached() > 0 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                        }}
                      >
                        {reached()}
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div
                    style={{
                      width: '100px',
                      display: 'flex',
                      gap: '8px',
                      'justify-content': 'flex-end',
                    }}
                  >
                    <Show when={index() > 0}>
                      <div
                        style={{
                          padding: '4px 8px',
                          background:
                            getConversionRate() > 0
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(255, 255, 255, 0.05)',
                          border:
                            getConversionRate() > 0
                              ? '1px solid rgba(16, 185, 129, 0.3)'
                              : '1px solid rgba(255, 255, 255, 0.1)',
                          'border-radius': '4px',
                          'font-size': '11px',
                          'font-family': "'Space Grotesk', system-ui, sans-serif",
                          color: getConversionRate() > 0 ? '#34D399' : theme().colors.textMuted,
                          'font-weight': '600',
                        }}
                      >
                        {formatPercent(getConversionRate())}%
                      </div>
                    </Show>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </FluidCard>

      {/* Key Metrics */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <MetricCard
          title="Response Rate"
          description="Applications that received any response"
          value={formatPercent(analytics().responseRate)}
          unit="%"
          icon={IconSend}
          color={statusColors.applied.text}
          theme={theme}
          hasData={analytics().totalApplied > 0}
        />
        <MetricCard
          title="Interview Rate"
          description="Applications that reached interview"
          value={formatPercent(analytics().interviewRate)}
          unit="%"
          icon={IconMessage}
          color={statusColors.interviewing.text}
          theme={theme}
          hasData={analytics().totalApplied > 0}
        />
        <MetricCard
          title="Offer Rate"
          description="Interviews that resulted in offer"
          value={formatPercent(analytics().offerRate)}
          unit="%"
          icon={IconStar}
          color={statusColors.offered.text}
          theme={theme}
          hasData={analytics().reachedStage.interviewing > 0}
        />
        <MetricCard
          title="Avg. Time to Offer"
          description="Days from application to offer"
          value={
            analytics().avgTimeToOffer !== null ? analytics().avgTimeToOffer!.toString() : 'N/A'
          }
          unit={analytics().avgTimeToOffer !== null ? ' days' : ''}
          icon={IconClock}
          color={statusColors.screening.text}
          theme={theme}
          hasData={analytics().avgTimeToOffer !== null}
        />
      </div>

      {/* Stage Breakdown */}
      <FluidCard variant="default">
        <div
          style={{
            'margin-bottom': '16px',
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
          }}
        >
          <div>
            <h4
              style={{
                margin: '0 0 4px',
                'font-size': '18px',
                'font-family': "'Playfair Display', Georgia, serif",
                'font-weight': '600',
                color: theme().colors.text,
              }}
            >
              Stage-by-Stage Breakdown
            </h4>
            <p
              style={{
                margin: 0,
                'font-size': '13px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                color: theme().colors.textMuted,
              }}
            >
              Detailed metrics for each pipeline stage
            </p>
          </div>
          <div
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              'border-radius': '6px',
              'font-size': '12px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: theme().colors.textMuted,
              display: 'flex',
              'align-items': 'center',
              gap: '6px',
            }}
          >
            <IconFilter size={14} />
            All Time
          </div>
        </div>

        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            'grid-template-columns': '1fr 80px 100px 100px',
            gap: '16px',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            'border-radius': '8px',
            'margin-bottom': '8px',
          }}
        >
          <div
            style={{
              'font-size': '11px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: theme().colors.textMuted,
              'text-transform': 'uppercase',
              'letter-spacing': '0.5px',
            }}
          >
            Stage
          </div>
          <div
            style={{
              'font-size': '11px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: theme().colors.textMuted,
              'text-transform': 'uppercase',
              'letter-spacing': '0.5px',
              'text-align': 'center',
            }}
          >
            Count
          </div>
          <div
            style={{
              'font-size': '11px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: theme().colors.textMuted,
              'text-transform': 'uppercase',
              'letter-spacing': '0.5px',
              'text-align': 'center',
            }}
          >
            Avg. Duration
          </div>
          <div
            style={{
              'font-size': '11px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: theme().colors.textMuted,
              'text-transform': 'uppercase',
              'letter-spacing': '0.5px',
              'text-align': 'center',
            }}
          >
            Drop-off
          </div>
        </div>

        {/* Table Rows */}
        <For each={funnelStages}>
          {(stage, index) => {
            const dropoffKeys = [
              'saved',
              'applied',
              'screening',
              'interviewing',
              'offered',
            ] as const;
            const dropoffKey = index() < 5 ? dropoffKeys[index()] : undefined;
            const dropoff = () => (dropoffKey ? analytics().dropoffs[dropoffKey] : null);
            const duration = () => analytics().stageDurations[stage.status];

            return (
              <div
                style={{
                  display: 'grid',
                  'grid-template-columns': '1fr 80px 100px 100px',
                  gap: '16px',
                  padding: '14px 16px',
                  'border-bottom': '1px solid rgba(255, 255, 255, 0.05)',
                  transition: `background ${pipelineAnimations.fast}`,
                }}
              >
                <div style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      'border-radius': '50%',
                      background: stage.color.gradient,
                    }}
                  />
                  <span
                    style={{
                      'font-size': '14px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: theme().colors.text,
                    }}
                  >
                    {stage.label}
                  </span>
                </div>
                <div
                  style={{
                    'font-size': '14px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    color:
                      analytics().reachedStage[stage.status] > 0
                        ? theme().colors.text
                        : theme().colors.textMuted,
                    'text-align': 'center',
                    'font-weight': analytics().reachedStage[stage.status] > 0 ? '600' : '400',
                  }}
                >
                  {analytics().reachedStage[stage.status]}
                </div>
                <div
                  style={{
                    'font-size': '14px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    color: theme().colors.textMuted,
                    'text-align': 'center',
                  }}
                >
                  {formatDuration(duration())}
                </div>
                <div
                  style={{
                    'font-size': '14px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    color:
                      dropoff() !== null && dropoff()! > 50
                        ? '#F87171'
                        : dropoff() !== null && dropoff()! > 25
                          ? '#FBBF24'
                          : theme().colors.textMuted,
                    'text-align': 'center',
                  }}
                >
                  {dropoff() !== null ? `${formatPercent(dropoff()!)}%` : '--'}
                </div>
              </div>
            );
          }}
        </For>
      </FluidCard>
    </div>
  );
};

// Metric Card for Analytics
interface MetricCardProps {
  title: string;
  description: string;
  value: string;
  unit: string;
  icon: Component<{ size?: number; color?: string }>;
  color: string;
  theme: () => typeof liquidTenure;
  hasData: boolean;
}

const MetricCard: Component<MetricCardProps> = (props) => {
  return (
    <FluidCard variant="stat" accentColor={props.color}>
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'flex-start',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              'border-radius': '10px',
              background: `${props.color}15`,
              border: `1px solid ${props.color}30`,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
            }}
          >
            <props.icon size={20} color={props.color} />
          </div>
          <IconChevronRight size={16} color={props.theme().colors.textMuted} />
        </div>
        <div>
          <div
            style={{
              'font-size': '28px',
              'font-weight': '700',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: props.hasData ? props.theme().colors.text : props.theme().colors.textMuted,
              'line-height': '1.2',
            }}
          >
            {props.value}
            <span style={{ 'font-size': '16px', 'font-weight': '400' }}>{props.unit}</span>
          </div>
          <div
            style={{
              'font-size': '13px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: props.theme().colors.text,
              'font-weight': '500',
              'margin-top': '4px',
            }}
          >
            {props.title}
          </div>
          <div
            style={{
              'font-size': '11px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: props.theme().colors.textMuted,
              'margin-top': '2px',
            }}
          >
            {props.description}
          </div>
        </div>
      </div>
    </FluidCard>
  );
};

// Trends Tab Component
const TrendsTab: Component<TabProps> = (props) => {
  const theme = () => props.theme();
  const [selectedRange, setSelectedRange] = createSignal<'7d' | '30d' | '90d' | 'all'>('30d');

  const timeRanges = [
    { id: '7d' as const, label: 'Last 7 days' },
    { id: '30d' as const, label: 'Last 30 days' },
    { id: '90d' as const, label: 'Last 90 days' },
    { id: 'all' as const, label: 'All time' },
  ];

  // Activity metrics that will be tracked
  const activityMetrics = [
    { label: 'Applications Sent', color: statusColors.applied.text, placeholder: '--' },
    { label: 'Responses Received', color: statusColors.screening.text, placeholder: '--' },
    { label: 'Interviews Scheduled', color: statusColors.interviewing.text, placeholder: '--' },
    { label: 'Offers Received', color: statusColors.offered.text, placeholder: '--' },
  ];

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '24px' }}>
      {/* Coming Soon Banner */}
      <FluidCard variant="outlined" style={{ 'border-color': 'rgba(139, 92, 246, 0.3)' }}>
        <div style={{ display: 'flex', 'align-items': 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              'border-radius': '12px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'flex-shrink': 0,
            }}
          >
            <IconClock size={24} color="#A78BFA" />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: '0 0 4px',
                'font-size': '16px',
                'font-family': "'Playfair Display', Georgia, serif",
                'font-weight': '600',
                color: theme().colors.text,
              }}
            >
              Trends Dashboard Coming Soon
            </h3>
            <p
              style={{
                margin: 0,
                'font-size': '13px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                color: theme().colors.textMuted,
                'line-height': '1.5',
              }}
            >
              Activity timelines, application velocity, and historical performance tracking
            </p>
          </div>
          <div
            style={{
              padding: '6px 12px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              'border-radius': '6px',
              'font-size': '11px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: '#A78BFA',
              'text-transform': 'uppercase',
              'letter-spacing': '0.5px',
              'font-weight': '600',
            }}
          >
            Preview
          </div>
        </div>
      </FluidCard>

      {/* Time Range Selector */}
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          'flex-wrap': 'wrap',
          gap: '16px',
        }}
      >
        <h4
          style={{
            margin: 0,
            'font-size': '18px',
            'font-family': "'Playfair Display', Georgia, serif",
            'font-weight': '600',
            color: theme().colors.text,
          }}
        >
          Activity Timeline
        </h4>
        <div
          role="group"
          aria-label="Time range selection"
          style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            background: 'rgba(255, 255, 255, 0.03)',
            'border-radius': '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <For each={timeRanges}>
            {(range) => (
              <button
                onClick={() => setSelectedRange(range.id)}
                aria-pressed={selectedRange() === range.id}
                style={{
                  padding: '8px 16px',
                  background:
                    selectedRange() === range.id ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  border:
                    selectedRange() === range.id
                      ? '1px solid rgba(139, 92, 246, 0.4)'
                      : '1px solid transparent',
                  'border-radius': '8px',
                  'font-size': '13px',
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  color: selectedRange() === range.id ? '#A78BFA' : theme().colors.textMuted,
                  'font-weight': selectedRange() === range.id ? '600' : '400',
                  cursor: 'pointer',
                  transition: `all ${pipelineAnimations.fast}`,
                }}
              >
                {range.label}
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Mock Chart Area */}
      <FluidCard variant="default">
        <div style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>
          {/* Y-axis labels */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: '40px',
              width: '40px',
              display: 'flex',
              'flex-direction': 'column',
              'justify-content': 'space-between',
              'padding-right': '8px',
            }}
          >
            <For each={[15, 10, 5, 0]}>
              {(val) => (
                <span
                  style={{
                    'font-size': '10px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    color: theme().colors.textMuted,
                    'text-align': 'right',
                  }}
                >
                  {val}
                </span>
              )}
            </For>
          </div>

          {/* Chart grid and bars */}
          <div
            style={{
              position: 'absolute',
              left: '48px',
              right: '16px',
              top: 0,
              bottom: '40px',
            }}
          >
            {/* Grid lines */}
            <For each={[0, 1, 2, 3]}>
              {() => (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                />
              )}
            </For>

            {/* Placeholder bars */}
            <div
              style={{
                display: 'flex',
                'align-items': 'flex-end',
                'justify-content': 'space-between',
                height: '100%',
                gap: '8px',
              }}
            >
              <For each={Array(12).fill(0)}>
                {() => {
                  const height = () => Math.random() * 60 + 20;
                  return (
                    <div
                      style={{
                        flex: 1,
                        height: `${height()}%`,
                        background:
                          'linear-gradient(180deg, rgba(139, 92, 246, 0.4), rgba(139, 92, 246, 0.1))',
                        'border-radius': '4px 4px 0 0',
                        opacity: 0.5,
                        transition: `height ${pipelineAnimations.slow}`,
                      }}
                    />
                  );
                }}
              </For>
            </div>
          </div>

          {/* X-axis labels placeholder */}
          <div
            style={{
              position: 'absolute',
              left: '48px',
              right: '16px',
              bottom: 0,
              height: '32px',
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'flex-start',
              'padding-top': '8px',
              'border-top': '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <For each={['W1', 'W2', 'W3', 'W4']}>
              {(label) => (
                <span
                  style={{
                    'font-size': '10px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    color: theme().colors.textMuted,
                  }}
                >
                  {label}
                </span>
              )}
            </For>
          </div>

          {/* Overlay message */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              'backdrop-filter': 'blur(2px)',
              'border-radius': '12px',
            }}
          >
            <div
              style={{
                padding: '16px 24px',
                background: 'rgba(30, 30, 35, 0.95)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                'border-radius': '12px',
                'text-align': 'center',
              }}
            >
              <IconClock size={24} color="#A78BFA" />
              <p
                style={{
                  margin: '8px 0 0',
                  'font-size': '14px',
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  color: theme().colors.text,
                }}
              >
                Activity chart will appear here
              </p>
            </div>
          </div>
        </div>
      </FluidCard>

      {/* Activity Metrics Summary */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}
      >
        <For each={activityMetrics}>
          {(metric) => (
            <FluidCard variant="stat" accentColor={metric.color}>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    'border-radius': '50%',
                    background: metric.color,
                  }}
                />
                <div
                  style={{
                    'font-size': '24px',
                    'font-weight': '700',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    color: theme().colors.textMuted,
                  }}
                >
                  {metric.placeholder}
                </div>
                <div
                  style={{
                    'font-size': '12px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    color: theme().colors.text,
                  }}
                >
                  {metric.label}
                </div>
              </div>
            </FluidCard>
          )}
        </For>
      </div>

      {/* What We'll Track Section */}
      <FluidCard variant="default">
        <h4
          style={{
            margin: '0 0 16px',
            'font-size': '16px',
            'font-family': "'Playfair Display', Georgia, serif",
            'font-weight': '600',
            color: theme().colors.text,
          }}
        >
          What We'll Track
        </h4>
        <div
          style={{
            display: 'grid',
            'grid-template-columns': 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          <TrendFeatureItem
            icon={IconTrendingUp}
            label="Application velocity"
            description="How many apps per week"
            theme={theme}
          />
          <TrendFeatureItem
            icon={IconClock}
            label="Response times"
            description="Average time to hear back"
            theme={theme}
          />
          <TrendFeatureItem
            icon={IconMessage}
            label="Interview patterns"
            description="Peak interview weeks"
            theme={theme}
          />
          <TrendFeatureItem
            icon={IconStar}
            label="Success streaks"
            description="Track winning patterns"
            theme={theme}
          />
        </div>
      </FluidCard>
    </div>
  );
};

// Trend Feature Item
interface TrendFeatureItemProps {
  icon: Component<{ size?: number; color?: string }>;
  label: string;
  description: string;
  theme: () => typeof liquidTenure;
}

const TrendFeatureItem: Component<TrendFeatureItemProps> = (props) => {
  return (
    <div
      style={{
        display: 'flex',
        'align-items': 'flex-start',
        gap: '12px',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.02)',
        'border-radius': '10px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        transition: `all ${pipelineAnimations.fast}`,
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          'border-radius': '8px',
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'flex-shrink': 0,
        }}
      >
        <props.icon size={16} color="#A78BFA" />
      </div>
      <div>
        <div
          style={{
            'font-size': '13px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: props.theme().colors.text,
            'font-weight': '500',
            'margin-bottom': '2px',
          }}
        >
          {props.label}
        </div>
        <div
          style={{
            'font-size': '11px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            color: props.theme().colors.textMuted,
          }}
        >
          {props.description}
        </div>
      </div>
    </div>
  );
};

export default InsightsView;
