/**
 * InsightsView - Analytics and insights section with Flow, Analytics, and Trends tabs
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show, For, createMemo, createEffect } from 'solid-js';
import { useLocation, useNavigate } from '@solidjs/router';
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
  IconX,
  IconSparkles,
} from '../ui/Icons';
import { FluidCard, AggregationAccordion } from '../ui';
import { pipelineStore } from '../store';
import { MobileLayout } from '../../lib/MobileLayout';
import { PageHeader } from '../../lib/PageHeader';
import { PROSPECT_NAV_ITEMS } from './prospect-navigation';
import {
  JobApplication,
  ApplicationStatus,
  STATUS_LABELS,
} from '../../../../schemas/pipeline.schema';
import { canUseMutation } from '../../../../lib/feature-gates';
import { Paywall } from '../../../common/Paywall';

interface InsightsViewProps {
  currentTheme: () => Partial<typeof liquidTenure> & typeof liquidTenure;
  onSelectJob: (job: JobApplication) => void;
}

type InsightsTab = 'flow' | 'analytics' | 'trends';

export const InsightsView: Component<InsightsViewProps> = (props) => {
  const theme = () => props.currentTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Paywall state
  const [showPaywall, setShowPaywall] = createSignal(false);

  // Check subscription access
  const hasAccess = createMemo(() => {
    const access = canUseMutation();
    return access.allowed;
  });

  // Determine active tab from URL path
  const activeTab = createMemo((): InsightsTab => {
    const path = location.pathname;

    // Extract tab from path like /tenure/prospect/insights/flow
    const match = path.match(/\/tenure\/prospect\/insights\/([^/]+)/);
    if (match) {
      const tab = match[1] as InsightsTab;
      // Validate it's a known tab
      if (['flow', 'analytics', 'trends'].includes(tab)) {
        return tab;
      }
    }

    // Default to user's configured default or 'flow'
    const defaultTab = pipelineStore.state.settings.defaultInsightsTab || 'flow';
    return defaultTab;
  });

  // Redirect to default tab if on base /tenure/prospect/insights path
  createEffect(() => {
    const path = location.pathname;
    if (path === '/tenure/prospect/insights' || path === '/tenure/prospect/insights/') {
      const defaultTab = pipelineStore.state.settings.defaultInsightsTab || 'flow';
      navigate(`/tenure/prospect/insights/${defaultTab}`, { replace: true });
    }
  });

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
      navigate(`/tenure/prospect/insights/${tabs[nextIndex].id}`);
      (document.querySelector(`[data-tab="${tabs[nextIndex].id}"]`) as HTMLElement)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + tabs.length) % tabs.length;
      navigate(`/tenure/prospect/insights/${tabs[prevIndex].id}`);
      (document.querySelector(`[data-tab="${tabs[prevIndex].id}"]`) as HTMLElement)?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/tenure/prospect/insights/${tabId}`);
    }
  };

  return (
    <MobileLayout
      title="Insights"
      theme={props.currentTheme}
      maxWidth="1400px"
      drawerProps={{
        appName: 'Prospect',
        navItems: PROSPECT_NAV_ITEMS,
        currentSection: 'insights',
        onNavigate: (section: string) => navigate(`/tenure/prospect/${section}`),
        basePath: '/tenure/prospect',
        currentTenureApp: 'prospect',
      }}
    >
      <PageHeader
        title="Insights"
        subtitle="Analytics and trends for your job search"
        theme={props.currentTheme}
      />

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
              onClick={() => navigate(`/tenure/prospect/insights/${tab.id}`)}
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
      <Show
        when={hasAccess()}
        fallback={
          <div
            style={{
              position: 'relative',
              padding: '64px 24px',
              'text-align': 'center',
              background: 'linear-gradient(135deg, rgba(15, 15, 18, 0.6), rgba(10, 10, 12, 0.8))',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              'border-radius': '20px',
              'backdrop-filter': 'blur(10px)',
              overflow: 'hidden',
            }}
          >
            {/* Lock Icon Background */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80px',
                height: '80px',
                background: `radial-gradient(circle, ${theme().colors.primary}15 0%, transparent 70%)`,
                'border-radius': '50%',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke={`${theme().colors.primary}99`}
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <div
              style={{
                'max-width': '560px',
                margin: '80px auto 0',
                position: 'relative',
                'z-index': 1,
              }}
            >
              {/* Premium Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  'align-items': 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  background: `${theme().colors.primary}15`,
                  border: `1px solid ${theme().colors.primary}30`,
                  'border-radius': '20px',
                  'margin-bottom': '20px',
                  'font-size': '12px',
                  'font-weight': '600',
                  color: theme().colors.primary,
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.5px',
                }}
              >
                <IconSparkles size={14} color={theme().colors.primary} />
                Tenure Extras
              </div>

              <h2
                style={{
                  margin: '0 0 16px',
                  'font-size': '28px',
                  'font-weight': '700',
                  color: theme().colors.text,
                  'font-family': theme().fonts.heading,
                  'line-height': '1.2',
                }}
              >
                Unlock Job Insights & Analytics
              </h2>

              <p
                style={{
                  margin: '0 0 32px',
                  'font-size': '16px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  'line-height': '1.6',
                }}
              >
                Get powerful insights into your job search with pipeline flow visualization,
                conversion analytics, and activity trends. Track your progress and optimize your
                strategy.
              </p>

              {/* Feature List */}
              <div
                style={{
                  display: 'grid',
                  'grid-template-columns': 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  'margin-bottom': '32px',
                  'text-align': 'left',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', 'align-items': 'flex-start' }}>
                  <div
                    style={{
                      'flex-shrink': 0,
                      width: '24px',
                      height: '24px',
                      background: `${theme().colors.secondary}15`,
                      'border-radius': '6px',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                    }}
                  >
                    <IconPipeline size={14} color={theme().colors.secondary} />
                  </div>
                  <div>
                    <div
                      style={{
                        'font-size': '14px',
                        'font-weight': '600',
                        color: theme().colors.text,
                      }}
                    >
                      Pipeline Flow
                    </div>
                    <div style={{ 'font-size': '13px', color: theme().colors.textMuted }}>
                      Sankey visualization
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', 'align-items': 'flex-start' }}>
                  <div
                    style={{
                      'flex-shrink': 0,
                      width: '24px',
                      height: '24px',
                      background: `${theme().colors.secondary}15`,
                      'border-radius': '6px',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                    }}
                  >
                    <IconTrendingUp size={14} color={theme().colors.secondary} />
                  </div>
                  <div>
                    <div
                      style={{
                        'font-size': '14px',
                        'font-weight': '600',
                        color: theme().colors.text,
                      }}
                    >
                      Conversion Analytics
                    </div>
                    <div style={{ 'font-size': '13px', color: theme().colors.textMuted }}>
                      Success metrics
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', 'align-items': 'flex-start' }}>
                  <div
                    style={{
                      'flex-shrink': 0,
                      width: '24px',
                      height: '24px',
                      background: `${theme().colors.secondary}15`,
                      'border-radius': '6px',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                    }}
                  >
                    <IconClock size={14} color={theme().colors.secondary} />
                  </div>
                  <div>
                    <div
                      style={{
                        'font-size': '14px',
                        'font-weight': '600',
                        color: theme().colors.text,
                      }}
                    >
                      Activity Trends
                    </div>
                    <div style={{ 'font-size': '13px', color: theme().colors.textMuted }}>
                      Timeline charts
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPaywall(true)}
                style={{
                  padding: '16px 40px',
                  'font-size': '16px',
                  'font-weight': '600',
                  color: 'white',
                  background: `linear-gradient(135deg, ${theme().colors.primary} 0%, ${theme().colors.secondary} 100%)`,
                  border: 'none',
                  'border-radius': '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  'box-shadow': `0 4px 14px ${theme().colors.primary}40`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${theme().colors.primary}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = `0 4px 14px ${theme().colors.primary}40`;
                }}
              >
                Upgrade to Tenure Extras – $5/mo
              </button>

              <div
                style={{
                  'margin-top': '16px',
                  'font-size': '13px',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                Includes 20 AI credits, resume tools, and more
              </div>
            </div>
          </div>
        }
      >
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
      </Show>

      {/* Paywall Modal */}
      <Paywall
        isOpen={showPaywall()}
        onClose={() => setShowPaywall(false)}
        feature="tenure_extras"
        featureName="Job Insights & Analytics"
      />
    </MobileLayout>
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

      // Also count rejected and withdrawn separately (these are terminal states, not pipeline stages)
      if (app.status === 'rejected') {
        reachedStage.rejected++;
      } else if (app.status === 'withdrawn') {
        reachedStage.withdrawn++;
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

    // Calculate rejection and withdrawal rates
    const totalRejected = statusCounts.rejected;
    const totalWithdrawn = statusCounts.withdrawn;
    const rejectionRate = totalApplied > 0 ? (totalRejected / totalApplied) * 100 : 0;
    const withdrawalRate = totalApplied > 0 ? (totalWithdrawn / totalApplied) * 100 : 0;

    // Track rejections by stage (where rejection occurred)
    const rejectionsByStage: Record<ApplicationStatus, number> = {
      saved: 0,
      applied: 0,
      screening: 0,
      interviewing: 0,
      offered: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };

    const withdrawalsByStage: Record<ApplicationStatus, number> = {
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
      if (app.status === 'rejected' && app.rejectedAtStatus) {
        rejectionsByStage[app.rejectedAtStatus]++;
      } else if (app.status === 'withdrawn' && app.rejectedAtStatus) {
        withdrawalsByStage[app.rejectedAtStatus]++;
      }
    });

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
      totalRejected,
      totalWithdrawn,
      rejectionRate,
      withdrawalRate,
      rejectionsByStage,
      withdrawalsByStage,
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
    {
      status: 'rejected' as ApplicationStatus,
      label: 'Rejected',
      icon: IconX,
      color: statusColors.rejected,
    },
    {
      status: 'withdrawn' as ApplicationStatus,
      label: 'Withdrawn',
      icon: IconX,
      color: statusColors.withdrawn,
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
      <AggregationAccordion
        title="Conversion Funnel"
        count={analytics().total}
        defaultExpanded={true}
        currentTheme={theme}
      >
        <div style={{ padding: '20px' }}>
          {/* Funnel Visualization */}
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
            <For each={funnelStages}>
              {(stage, index) => {
                const reached = () => analytics().reachedStage[stage.status];
                const total = () => analytics().total;
                const percentage = () =>
                  total() > 0 ? Math.round((reached() / total()) * 100) : 0;

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
                  <Show when={reached() > 0}>
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
                  </Show>
                );
              }}
            </For>
          </div>
        </div>
      </AggregationAccordion>

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
        <MetricCard
          title="Rejection Rate"
          description="Applications rejected by company"
          value={formatPercent(analytics().rejectionRate)}
          unit="%"
          icon={IconX}
          color={statusColors.rejected.text}
          theme={theme}
          hasData={analytics().totalApplied > 0}
        />
        <MetricCard
          title="Withdrawal Rate"
          description="Applications withdrawn by candidate"
          value={formatPercent(analytics().withdrawalRate)}
          unit="%"
          icon={IconX}
          color={statusColors.withdrawn.text}
          theme={theme}
          hasData={analytics().totalApplied > 0}
        />
      </div>

      {/* Stage Breakdown */}
      <AggregationAccordion
        title="Stage-by-Stage Breakdown"
        count={analytics().total}
        defaultExpanded={false}
        currentTheme={theme}
      >
        <div style={{ padding: '20px' }}>
          <div
            style={{
              'margin-bottom': '16px',
              display: 'flex',
              'justify-content': 'flex-end',
              'align-items': 'center',
            }}
          >
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

              // For terminal states (rejected/withdrawn), show count instead of dropoff
              const isTerminal = stage.status === 'rejected' || stage.status === 'withdrawn';
              const terminalCount = () =>
                isTerminal ? analytics().statusCounts[stage.status] : null;

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
                      color: (
                        isTerminal
                          ? terminalCount()! > 0
                          : analytics().reachedStage[stage.status] > 0
                      )
                        ? theme().colors.text
                        : theme().colors.textMuted,
                      'text-align': 'center',
                      'font-weight': (
                        isTerminal
                          ? terminalCount()! > 0
                          : analytics().reachedStage[stage.status] > 0
                      )
                        ? '600'
                        : '400',
                    }}
                  >
                    {isTerminal ? terminalCount() : analytics().reachedStage[stage.status]}
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
                    {isTerminal
                      ? '--'
                      : dropoff() !== null
                        ? `${formatPercent(dropoff()!)}%`
                        : '--'}
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </AggregationAccordion>

      {/* Rejection & Withdrawal Breakdown - Show where rejections/withdrawals occurred */}
      <Show when={analytics().totalRejected > 0 || analytics().totalWithdrawn > 0}>
        <AggregationAccordion
          title="Rejection & Withdrawal Analysis"
          count={analytics().totalRejected + analytics().totalWithdrawn}
          defaultExpanded={false}
          accentColor={statusColors.rejected.text}
          currentTheme={theme}
        >
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
              {/* Rejections by Stage */}
              <Show when={analytics().totalRejected > 0}>
                <div>
                  <div
                    style={{
                      'font-size': '13px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: theme().colors.text,
                      'font-weight': '600',
                      'margin-bottom': '12px',
                      display: 'flex',
                      'align-items': 'center',
                      gap: '8px',
                    }}
                  >
                    <IconX size={14} color={statusColors.rejected.text} />
                    <span>Rejections ({analytics().totalRejected} total)</span>
                  </div>
                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
                    <For each={PIPELINE_STAGES.filter((s) => analytics().rejectionsByStage[s] > 0)}>
                      {(stage) => {
                        const count = analytics().rejectionsByStage[stage];
                        const percentage =
                          analytics().totalRejected > 0
                            ? (count / analytics().totalRejected) * 100
                            : 0;
                        const stageColor =
                          statusColors[stage as keyof typeof statusColors] || statusColors.saved;

                        return (
                          <div
                            style={{
                              display: 'flex',
                              'align-items': 'center',
                              gap: '12px',
                              padding: '8px 12px',
                              background: 'rgba(255, 255, 255, 0.02)',
                              'border-radius': '8px',
                            }}
                          >
                            <div
                              style={{
                                width: '6px',
                                height: '6px',
                                'border-radius': '50%',
                                background: stageColor.gradient,
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <span
                                style={{
                                  'font-size': '13px',
                                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                                  color: theme().colors.text,
                                }}
                              >
                                Rejected at {STATUS_LABELS[stage]}
                              </span>
                            </div>
                            <div
                              style={{
                                'font-size': '13px',
                                'font-family': "'Space Grotesk', system-ui, sans-serif",
                                color: theme().colors.textMuted,
                                'font-weight': '600',
                              }}
                            >
                              {count} ({formatPercent(percentage)}%)
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </div>
              </Show>

              {/* Withdrawals by Stage */}
              <Show when={analytics().totalWithdrawn > 0}>
                <div>
                  <div
                    style={{
                      'font-size': '13px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: theme().colors.text,
                      'font-weight': '600',
                      'margin-bottom': '12px',
                      display: 'flex',
                      'align-items': 'center',
                      gap: '8px',
                    }}
                  >
                    <IconX size={14} color={statusColors.withdrawn.text} />
                    <span>Withdrawals ({analytics().totalWithdrawn} total)</span>
                  </div>
                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
                    <For
                      each={PIPELINE_STAGES.filter((s) => analytics().withdrawalsByStage[s] > 0)}
                    >
                      {(stage) => {
                        const count = analytics().withdrawalsByStage[stage];
                        const percentage =
                          analytics().totalWithdrawn > 0
                            ? (count / analytics().totalWithdrawn) * 100
                            : 0;
                        const stageColor =
                          statusColors[stage as keyof typeof statusColors] || statusColors.saved;

                        return (
                          <div
                            style={{
                              display: 'flex',
                              'align-items': 'center',
                              gap: '12px',
                              padding: '8px 12px',
                              background: 'rgba(255, 255, 255, 0.02)',
                              'border-radius': '8px',
                            }}
                          >
                            <div
                              style={{
                                width: '6px',
                                height: '6px',
                                'border-radius': '50%',
                                background: stageColor.gradient,
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <span
                                style={{
                                  'font-size': '13px',
                                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                                  color: theme().colors.text,
                                }}
                              >
                                Withdrawn from {STATUS_LABELS[stage]}
                              </span>
                            </div>
                            <div
                              style={{
                                'font-size': '13px',
                                'font-family': "'Space Grotesk', system-ui, sans-serif",
                                color: theme().colors.textMuted,
                                'font-weight': '600',
                              }}
                            >
                              {count} ({formatPercent(percentage)}%)
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </AggregationAccordion>
      </Show>
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
import { TrendsHeroChart } from '../trends/components/TrendsHeroChart';
import { PredictiveInsights } from '../trends/components/PredictiveInsights';
import { useTrendsData } from '../trends/hooks/useTrendsData';
import type { TimeRange } from '../trends/trends-data';
import { isSeasonalInsightsEnabled } from '../../../../lib/feature-gates';

const TrendsTab: Component<TabProps> = (props) => {
  const theme = () => props.theme();
  const [selectedRange, setSelectedRange] = createSignal<TimeRange>('30d');
  const useV2Layout = isSeasonalInsightsEnabled();

  // Get reactive trends data
  const trendsData = useTrendsData(() => pipelineStore.state.applications, selectedRange);

  const timeRanges = [
    { id: '7d' as const, label: 'Last 7 days' },
    { id: '30d' as const, label: 'Last 30 days' },
    { id: '90d' as const, label: 'Last 90 days' },
    { id: 'all' as const, label: 'All time' },
  ];

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '24px' }}>
      {/* Time Range Selector */}
      <div
        style={{
          display: 'flex',
          'justify-content': 'flex-end',
          'align-items': 'center',
          'flex-wrap': 'wrap',
          gap: '16px',
        }}
      >
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
                    selectedRange() === range.id ? `${theme().colors.primary}30` : 'transparent',
                  border:
                    selectedRange() === range.id
                      ? `1px solid ${theme().colors.primary}60`
                      : '1px solid transparent',
                  'border-radius': '8px',
                  'font-size': '13px',
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  color:
                    selectedRange() === range.id
                      ? theme().colors.primary
                      : theme().colors.textMuted,
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

      {/* Hero Chart with Timeline/Velocity Toggle */}
      <TrendsHeroChart
        timeSeriesData={trendsData().timeSeriesData}
        velocityMetrics={trendsData().velocityMetrics}
        currentTheme={theme}
      />

      {/* Predictive Insights */}
      {/* TODO: When useV2Layout is true, render PredictiveInsightsV2 with 2/3 + 1/3 grid layout */}
      {/* For now, always render v1 layout - v2 layout gated behind seasonalInsights feature flag */}
      <PredictiveInsights
        applications={pipelineStore.state.applications}
        applicationsPerWeek={trendsData().velocityMetrics.applicationsPerWeek}
      />
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
