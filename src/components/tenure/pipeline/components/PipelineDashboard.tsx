/**
 * PipelineDashboard - Kanban-style view of job applications with aging indicators
 * Enhanced with duotone icons, tooltips with analytics, and RIASEC theming
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createMemo, For, Show } from 'solid-js';
import { pipelineStore } from '../store';
import { liquidTenure, statusColors, pipelineAnimations } from '../theme/liquid-tenure';
import { getCurrentDuotone, getStatusDuotone, type DuotoneColors } from '../theme/riasec-colors';
import {
  FluidCard,
  StatusBadge,
  AgingIndicator,
  AgingCardWrapper,
  ScoreBadge,
  Tooltip,
  StatTooltipContent,
  PipelineColumnTooltipContent,
  ApplicationTooltipContent,
  SortMenu,
  Checkbox,
  type SortConfig,
  type SortField,
} from '../ui';
import { AggregationAccordion } from '../ui/AggregationAccordion';
import { BulkActionsBar } from './BulkActionsBar';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import {
  IconGrid,
  IconList,
  IconTrendingUp,
  IconPipeline,
  IconPipelineDuotone,
  IconBriefcase,
  IconBriefcaseDuotone,
  IconSend,
  IconSendDuotone,
  IconMessage,
  IconMessageDuotone,
  IconStar,
  IconStarDuotone,
  IconClock,
  IconClockDuotone,
  IconTrendingUpDuotone,
  IconSearch,
} from '../ui/Icons';
import {
  JobApplication,
  ApplicationStatus,
  ACTIVE_STATUSES,
  STATUS_LABELS,
  daysSince,
} from '../../../../schemas/pipeline.schema';
import { formatSalary } from '../utils/salary';
import { logger } from '../../../../lib/logger';

const log = logger.create('Pipeline');

interface PipelineDashboardProps {
  currentTheme: () => Partial<typeof liquidTenure> & typeof liquidTenure;
  onSelectJob: (job: JobApplication | null) => void;
  selectedJob: JobApplication | null;
}

export const PipelineDashboard: Component<PipelineDashboardProps> = (props) => {
  const [viewMode, setViewMode] = createSignal<'kanban' | 'list'>('kanban');
  const [showArchive, setShowArchive] = createSignal(false);
  const [sortConfig, setSortConfig] = createSignal<SortConfig>({
    field: 'age',
    direction: 'desc',
  });
  const [searchQuery, setSearchQuery] = createSignal('');
  const theme = () => props.currentTheme();

  // Drag and drop state
  const [draggedAppId, setDraggedAppId] = createSignal<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = createSignal<ApplicationStatus | null>(null);

  // Bulk selection state
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

  // Selection helpers
  const selectedCount = () => pipelineStore.state.selectedIds.size;
  const hasSelection = () => selectedCount() > 0;

  // Get RIASEC-based duotone colors
  const duotoneColors = createMemo<DuotoneColors>(() => getCurrentDuotone());

  const applications = () => pipelineStore.state.applications;
  const activeApplications = createMemo(() =>
    applications().filter((app) => ACTIVE_STATUSES.includes(app.status))
  );

  const applicationsByStatus = createMemo(() => {
    const query = searchQuery().toLowerCase().trim();

    // Filter by search query first
    const filteredApps = query
      ? applications().filter((app) => {
          const searchFields = [app.companyName, app.roleName, app.location, app.notes]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return searchFields.includes(query);
        })
      : applications();

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

    for (const app of filteredApps) {
      grouped[app.status].push(app);
    }

    // Sort function based on current config
    const sortFn = (a: JobApplication, b: JobApplication): number => {
      const { field, direction } = sortConfig();
      const multiplier = direction === 'asc' ? 1 : -1;

      switch (field) {
        case 'age':
          return (daysSince(a.lastActivityAt) - daysSince(b.lastActivityAt)) * multiplier;
        case 'company':
          return a.companyName.localeCompare(b.companyName) * multiplier;
        case 'role':
          return a.roleName.localeCompare(b.roleName) * multiplier;
        case 'salary': {
          const aMin = a.salary?.min ?? 0;
          const bMin = b.salary?.min ?? 0;
          return (aMin - bMin) * multiplier;
        }
        default:
          return 0;
      }
    };

    // Sort each group
    for (const status of Object.keys(grouped) as ApplicationStatus[]) {
      grouped[status].sort(sortFn);
    }

    return grouped;
  });

  const followUpsDue = createMemo(() => pipelineStore.getFollowUpsDue());

  // Aggregation data (temporary - keeping for compatibility)
  const aggregationMode = () => pipelineStore.state.aggregationMode;
  const groupedApplications = createMemo(() => {
    const mode = aggregationMode();
    if (mode === 'none') return null;

    if (mode === 'company') {
      return pipelineStore.getApplicationsGroupedByCompany();
    } else if (mode === 'position') {
      return pipelineStore.getApplicationsGroupedByPosition();
    } else if (mode === 'salary') {
      return pipelineStore.getApplicationsGroupedBySalary();
    }
    return null;
  });

  // Columns to display (includes archive when toggled)
  const displayedStatuses = createMemo(() => {
    if (showArchive()) {
      return [
        ...ACTIVE_STATUSES,
        'rejected' as ApplicationStatus,
        'withdrawn' as ApplicationStatus,
      ];
    }
    return ACTIVE_STATUSES;
  });

  // Filtered applications for display (respects archive toggle)
  const displayApplicationsByStatus = createMemo(() => {
    const all = applicationsByStatus();

    if (showArchive()) {
      return all; // Show everything including rejected/withdrawn
    }

    // Hide rejected and withdrawn by default
    return {
      ...all,
      rejected: [],
      withdrawn: [],
    };
  });

  // =========================================================================
  // ANALYTICS CALCULATIONS
  // =========================================================================

  // Calculate average days in each status
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

  // State for collapsible status groups in list view
  const [collapsedStatuses, setCollapsedStatuses] = createSignal<Set<ApplicationStatus>>(new Set());

  const toggleStatusCollapse = (status: ApplicationStatus) => {
    setCollapsedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const isStatusCollapsed = (status: ApplicationStatus) => collapsedStatuses().has(status);

  // Calculate conversion rates between stages
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
    const everOffered = apps.filter((a) =>
      a.statusHistory?.some((h) => h.status === 'offered')
    ).length;

    // Count applications that progressed FROM one status TO the next
    // For saved->applied: apps that have been both saved AND applied
    const savedToApplied = apps.filter(
      (a) =>
        a.statusHistory?.some((h) => h.status === 'saved') &&
        a.statusHistory?.some((h) => h.status === 'applied')
    ).length;

    // For applied->interviewing: apps that have been both applied AND interviewing
    const appliedToInterviewing = apps.filter(
      (a) =>
        a.statusHistory?.some((h) => h.status === 'applied') &&
        a.statusHistory?.some((h) => h.status === 'interviewing')
    ).length;

    // For interviewing->offered: apps that have been both interviewing AND offered
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

  // Get oldest application in each status
  const oldestInStatus = createMemo(() => {
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

      const oldest = Math.max(...apps.map((a) => daysSince(a.lastActivityAt)));
      result[status] = oldest;
    }

    return result;
  });

  // Aggregate stats for tooltip displays
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

  const handleStatusChange = (appId: string, newStatus: ApplicationStatus) => {
    pipelineStore.updateStatus(appId, newStatus);
  };

  const handleBulkStatusChange = (status: ApplicationStatus) => {
    pipelineStore.bulkUpdateStatus(status);
  };

  const handleBulkDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    pipelineStore.bulkDelete();
    setShowDeleteConfirm(false);
  };

  const handleCheckboxChange = (appId: string, checked: boolean) => {
    pipelineStore.toggleSelection(appId);
  };

  const handleSelectAllInStatus = (status: ApplicationStatus) => {
    const appsInStatus = applicationsByStatus()[status];
    const ids = appsInStatus.map((app) => app.id);
    pipelineStore.selectAll(ids);
  };

  return (
    <div>
      {/* View Toggle & Aggregation Filter */}
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          'margin-bottom': '24px',
          gap: '16px',
          'flex-wrap': 'wrap',
        }}
      >
        {/* Left: View Mode Toggle */}
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
        </div>

        {/* Center: Search + Sort */}
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '12px',
            flex: '1',
            'max-width': '500px',
          }}
        >
          {/* Search Input */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              padding: '8px 14px',
              background: 'linear-gradient(135deg, rgba(15, 15, 18, 0.95), rgba(10, 10, 12, 0.98))',
              border: searchQuery()
                ? '1px solid rgba(255, 255, 255, 0.2)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              'border-radius': '10px',
              flex: '1',
              'min-width': '150px',
              transition: 'all 0.2s ease',
            }}
          >
            <IconSearch size={16} color="rgba(255, 255, 255, 0.5)" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: theme().colors.text,
                'font-size': '13px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                width: '100%',
              }}
            />
            <Show when={searchQuery()}>
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  'border-radius': '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  cursor: 'pointer',
                  padding: '0',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </Show>
          </div>

          <SortMenu
            currentSort={sortConfig()}
            onSortChange={setSortConfig}
            currentTheme={props.currentTheme}
          />
        </div>

        {/* Right: Archive Filter Toggle */}
        <button
          class="pipeline-btn"
          onClick={() => setShowArchive(!showArchive())}
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
            padding: '10px 16px',
            background: showArchive() ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
            border: showArchive()
              ? '1px solid rgba(245, 158, 11, 0.3)'
              : `1px solid ${theme().colors.border}`,
            'border-radius': '10px',
            color: showArchive() ? '#F59E0B' : theme().colors.textMuted,
            'font-size': '13px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '500',
            cursor: 'pointer',
            transition: `all ${pipelineAnimations.fast}`,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            style={{
              transform: showArchive() ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: `transform ${pipelineAnimations.fast}`,
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {showArchive() ? 'Hide' : 'Show'} Archive
          <Show
            when={
              !showArchive() &&
              (applicationsByStatus().rejected.length > 0 ||
                applicationsByStatus().withdrawn.length > 0)
            }
          >
            <span
              style={{
                padding: '2px 8px',
                background: 'rgba(245, 158, 11, 0.2)',
                'border-radius': '10px',
                'font-size': '11px',
                'font-weight': '600',
              }}
            >
              {applicationsByStatus().rejected.length + applicationsByStatus().withdrawn.length}
            </span>
          </Show>
        </button>
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
              background: `radial-gradient(circle, ${theme().colors.primary}14, transparent 70%)`,
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
              background: `radial-gradient(circle, ${theme().colors.secondary}10, transparent 70%)`,
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
                background: `linear-gradient(135deg, ${theme().colors.primary}1A, ${theme().colors.secondary}1A)`,
                border: `1px solid ${theme().colors.primary}33`,
              }}
            >
              <IconPipeline size={48} color={theme().colors.primary} />
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
              color: `${theme().colors.primary}B3`,
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
            'grid-template-columns': `repeat(${displayedStatuses().length}, 280px)`,
            gap: '16px',
            'overflow-x': 'auto',
            'overflow-y': 'visible',
            'padding-bottom': '16px',
          }}
        >
          <For each={displayedStatuses()}>
            {(status) => (
              <PipelineColumn
                status={status}
                applications={applicationsByStatus()[status]}
                theme={theme}
                onSelectJob={props.onSelectJob}
                onStatusChange={handleStatusChange}
                avgDays={avgDaysInStatus()[status]}
                conversionRate={
                  status === 'applied'
                    ? conversionRates().toInterview
                    : status === 'interviewing'
                      ? conversionRates().toOffer
                      : null
                }
                oldestDays={oldestInStatus()[status]}
                draggedAppId={draggedAppId()}
                isDragOver={dragOverStatus() === status}
                onDragOver={() => setDragOverStatus(status)}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={(appId) => {
                  handleStatusChange(appId, status);
                  setDraggedAppId(null);
                  setDragOverStatus(null);
                }}
                onCardDragStart={setDraggedAppId}
                onCardDragEnd={() => setDraggedAppId(null)}
                isSelected={(appId) => pipelineStore.isSelected(appId)}
                onCheckboxChange={handleCheckboxChange}
                onSelectAllInColumn={() => {
                  const ids = applicationsByStatus()[status].map((app) => app.id);
                  pipelineStore.toggleAllSelection(ids);
                }}
                areAllSelectedInColumn={pipelineStore.areAllSelected(
                  applicationsByStatus()[status].map((app) => app.id)
                )}
                areSomeSelectedInColumn={pipelineStore.areSomeSelected(
                  applicationsByStatus()[status].map((app) => app.id)
                )}
              />
            )}
          </For>
        </div>
      </Show>

      {/* List View - with or without aggregation */}
      <Show when={applications().length > 0 && viewMode() === 'list'}>
        <Show
          when={aggregationMode() !== 'none' && groupedApplications()}
          fallback={
            /* Grouped by status list view */
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '24px' }}>
              <For each={displayedStatuses()}>
                {(status) => {
                  const colors = statusColors[status];
                  return (
                    <Show when={displayApplicationsByStatus()[status].length > 0}>
                      <div>
                        {/* Status Header - styled like kanban column headers */}
                        <div
                          onClick={() => toggleStatusCollapse(status)}
                          style={{
                            display: 'flex',
                            'align-items': 'center',
                            gap: '10px',
                            padding: '12px 16px',
                            background: `linear-gradient(135deg, ${colors.bg}, ${colors.bg.replace('0.15', '0.08')})`,
                            'border-radius': '12px',
                            border: `1px solid ${colors.border}`,
                            'margin-bottom': '12px',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: `all ${pipelineAnimations.fast}`,
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
                              background: `linear-gradient(90deg, transparent, ${colors.text}30, transparent)`,
                            }}
                          />

                          {/* Select All Checkbox */}
                          <div onClick={(e) => e.stopPropagation()} style={{ 'flex-shrink': '0' }}>
                            <Checkbox
                              checked={pipelineStore.areAllSelected(
                                displayApplicationsByStatus()[status].map((app) => app.id)
                              )}
                              indeterminate={pipelineStore.areSomeSelected(
                                displayApplicationsByStatus()[status].map((app) => app.id)
                              )}
                              onChange={() => {
                                const ids = displayApplicationsByStatus()[status].map(
                                  (app) => app.id
                                );
                                pipelineStore.toggleAllSelection(ids);
                              }}
                              size="sm"
                              accentColor={colors.text}
                            />
                          </div>

                          {/* Status Icon */}
                          <div
                            style={{
                              width: '22px',
                              height: '22px',
                              display: 'flex',
                              'align-items': 'center',
                              'justify-content': 'center',
                              color: colors.text,
                            }}
                          >
                            {status === 'saved' && (
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
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                              </svg>
                            )}
                            {status === 'applied' && (
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
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                            )}
                            {status === 'screening' && (
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
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                              </svg>
                            )}
                            {status === 'interviewing' && (
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
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                              </svg>
                            )}
                            {status === 'offered' && (
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
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            {status === 'accepted' && (
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
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                              </svg>
                            )}
                            {(status === 'rejected' || status === 'withdrawn') && (
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
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                              </svg>
                            )}
                          </div>

                          {/* Status Label */}
                          <span
                            style={{
                              'font-size': '14px',
                              'font-family': "'Space Grotesk', system-ui, sans-serif",
                              'font-weight': '600',
                              'letter-spacing': '0.02em',
                              color: colors.text,
                            }}
                          >
                            {STATUS_LABELS[status]}
                          </span>

                          {/* Chevron Icon */}
                          <div
                            style={{
                              'margin-left': 'auto',
                              display: 'flex',
                              'align-items': 'center',
                              transition: `transform ${pipelineAnimations.fast}`,
                              transform: isStatusCollapsed(status)
                                ? 'rotate(-90deg)'
                                : 'rotate(0deg)',
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
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>

                          {/* Count Badge */}
                          <span
                            style={{
                              padding: '4px 12px',
                              background: `${colors.text}20`,
                              'border-radius': '10px',
                              'font-size': '13px',
                              'font-family': "'Space Grotesk', system-ui, sans-serif",
                              color: colors.text,
                              'font-weight': '700',
                            }}
                          >
                            {displayApplicationsByStatus()[status].length}
                          </span>
                        </div>

                        {/* Application rows under this status */}
                        <Show when={!isStatusCollapsed(status)}>
                          <div
                            style={{
                              display: 'flex',
                              'flex-direction': 'column',
                              gap: '10px',
                              'padding-left': '8px',
                            }}
                          >
                            <For each={displayApplicationsByStatus()[status]}>
                              {(app) => (
                                <ApplicationRow
                                  application={app}
                                  theme={theme}
                                  onClick={() => props.onSelectJob(app)}
                                  hideStatusBadge={true}
                                  isSelected={pipelineStore.isSelected(app.id)}
                                  onCheckboxChange={handleCheckboxChange}
                                />
                              )}
                            </For>
                          </div>
                        </Show>
                      </div>
                    </Show>
                  );
                }}
              </For>
            </div>
          }
        >
          {/* Aggregated List View */}
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
            <For each={Array.from(groupedApplications()!.entries())}>
              {([groupName, apps]) => (
                <AggregationAccordion
                  title={groupName}
                  count={apps.length}
                  currentTheme={props.currentTheme}
                  accentColor={theme().colors.primary}
                >
                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
                    <For each={apps}>
                      {(app) => (
                        <ApplicationRow
                          application={app}
                          theme={theme}
                          onClick={() => props.onSelectJob(app)}
                          isSelected={pipelineStore.isSelected(app.id)}
                          onCheckboxChange={handleCheckboxChange}
                        />
                      )}
                    </For>
                  </div>
                </AggregationAccordion>
              )}
            </For>
          </div>
        </Show>
      </Show>

      <BulkActionsBar
        selectedCount={selectedCount()}
        onClearSelection={() => pipelineStore.clearSelection()}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkDelete={handleBulkDelete}
        theme={props.currentTheme}
        isOpen={hasSelection()}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteConfirm()}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Applications"
        message={`Are you sure you want to delete ${selectedCount()} application${selectedCount() !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete All"
        theme={props.currentTheme}
      />
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface DuotoneIconProps {
  size?: number;
  color?: string;
  primaryColor?: string;
  secondaryColor?: string;
  opacity?: number;
}

interface StatCardProps {
  label: string;
  value: number;
  color?: string;
  duotoneColors?: DuotoneColors;
  icon: Component<DuotoneIconProps>;
  pulse?: boolean;
  useDuotone?: boolean;
}

const StatCard: Component<StatCardProps> = (props) => {
  // Determine colors - prefer duotone, fallback to solid color
  const primaryColor = () =>
    props.useDuotone && props.duotoneColors
      ? props.duotoneColors.primary
      : props.color || '#8B5CF6';
  const secondaryColor = () =>
    props.useDuotone && props.duotoneColors ? props.duotoneColors.secondary : primaryColor();

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
      {/* Subtle top accent line - duotone gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          right: '15%',
          height: '2px',
          background: props.useDuotone
            ? `linear-gradient(90deg, transparent, ${primaryColor()}60, ${secondaryColor()}40, transparent)`
            : `linear-gradient(90deg, transparent, ${primaryColor()}60, transparent)`,
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
            background: props.useDuotone
              ? `linear-gradient(135deg, ${primaryColor()}15, ${secondaryColor()}10)`
              : `${primaryColor()}15`,
            border: `1px solid ${primaryColor()}25`,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
          }}
        >
          <props.icon
            size={22}
            color={primaryColor()}
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

interface PipelineColumnProps {
  status: ApplicationStatus;
  applications: JobApplication[];
  theme: () => typeof liquidTenure;
  onSelectJob: (job: JobApplication) => void;
  onStatusChange: (appId: string, status: ApplicationStatus) => void;
  avgDays: number | null;
  conversionRate: number | null;
  oldestDays: number | null;
  // Drag and drop props
  draggedAppId: string | null;
  isDragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (appId: string) => void;
  onCardDragStart: (appId: string) => void;
  onCardDragEnd: () => void;
  // Selection props
  isSelected: (appId: string) => boolean;
  onCheckboxChange: (appId: string, checked: boolean) => void;
  onSelectAllInColumn: () => void;
  areAllSelectedInColumn: boolean;
  areSomeSelectedInColumn: boolean;
}

const PipelineColumn: Component<PipelineColumnProps> = (props) => {
  const colors = () => statusColors[props.status];

  // Handle drag events
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    props.onDragOver();
  };

  const handleDragLeave = () => {
    props.onDragLeave();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    try {
      const appId = e.dataTransfer?.getData('text/plain');
      if (!appId) {
        log.warn('Drop failed: No application ID in drag data');
        return;
      }
      props.onDrop(appId);
    } catch (error) {
      log.error('Failed to process drop:', error);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        // Grid handles sizing via 1fr
        background: props.isDragOver
          ? `linear-gradient(180deg, ${colors().bg.replace('0.15', '0.25')} 0%, ${colors().bg.replace('0.15', '0.15')} 100%)`
          : 'linear-gradient(180deg, rgba(30, 30, 30, 0.6) 0%, rgba(20, 20, 20, 0.4) 100%)',
        'backdrop-filter': 'blur(12px)',
        'border-radius': '14px',
        padding: '16px',
        'max-height': '600px',
        overflow: 'auto',
        border: props.isDragOver
          ? `2px dashed ${colors().text}60`
          : '1px solid rgba(255, 255, 255, 0.06)',
        'box-shadow': props.isDragOver
          ? `inset 0 0 20px ${colors().text}15, inset 0 1px 0 rgba(255, 255, 255, 0.03)`
          : 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Column Header with Definition Tooltip */}
      <div style={{ 'margin-bottom': '14px' }}>
        <Tooltip
          content={<StageDefinitionTooltip status={props.status} accentColor={colors().text} />}
          position="top"
          maxWidth={280}
        >
          <div
            class="column-header"
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              padding: '10px 12px',
              background: `linear-gradient(135deg, ${colors().bg}, ${colors().bg.replace('0.15', '0.08')})`,
              'border-radius': '10px',
              border: `1px solid ${colors().border}`,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'help',
              width: '100%',
              'box-sizing': 'border-box',
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

            {/* Select All Checkbox - only show when column has items */}
            <Show when={props.applications.length > 0}>
              <Checkbox
                checked={props.areAllSelectedInColumn}
                indeterminate={props.areSomeSelectedInColumn}
                onChange={() => props.onSelectAllInColumn()}
                accentColor={colors().text}
                size="sm"
              />
            </Show>

            {/* Status Icon */}
            <div
              style={{
                width: '20px',
                height: '20px',
                'flex-shrink': '0',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                color: colors().text,
              }}
            >
              {props.status === 'saved' && (
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
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              )}
              {props.status === 'applied' && (
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
              {props.status === 'screening' && (
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
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              )}
              {props.status === 'interviewing' && (
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
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              )}
              {props.status === 'offered' && (
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
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {props.status === 'accepted' && (
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
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              )}
              {(props.status === 'rejected' || props.status === 'withdrawn') && (
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
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
            </div>

            {/* Status Label */}
            <span
              style={{
                'font-size': '13px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'font-weight': '600',
                'letter-spacing': '0.02em',
                color: colors().text,
                flex: '1',
                'min-width': '0',
                overflow: 'hidden',
                'text-overflow': 'ellipsis',
                'white-space': 'nowrap',
              }}
            >
              {STATUS_LABELS[props.status]}
            </span>

            {/* Count Badge */}
            <span
              style={{
                padding: '4px 10px',
                background: `${colors().text}20`,
                'border-radius': '10px',
                'font-size': '12px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                color: colors().text,
                'font-weight': '700',
                'min-width': '24px',
                'text-align': 'center',
                'flex-shrink': '0',
              }}
            >
              {props.applications.length}
            </span>
          </div>
        </Tooltip>
      </div>

      {/* Cards */}
      <div
        style={{ display: 'flex', 'flex-direction': 'column', gap: '10px', 'min-height': '50px' }}
      >
        <For each={props.applications}>
          {(app) => (
            <ApplicationCard
              application={app}
              theme={props.theme}
              onClick={() => props.onSelectJob(app)}
              statusColor={colors().text}
              isDragging={props.draggedAppId === app.id}
              onDragStart={() => props.onCardDragStart(app.id)}
              onDragEnd={props.onCardDragEnd}
              isSelected={props.isSelected(app.id)}
              onCheckboxChange={props.onCheckboxChange}
            />
          )}
        </For>
      </div>
    </div>
  );
};

interface ApplicationCardProps {
  application: JobApplication;
  theme: () => typeof liquidTenure;
  onClick: () => void;
  statusColor?: string;
  // Drag props
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  // Selection props
  isSelected?: boolean;
  onCheckboxChange?: (id: string, checked: boolean) => void;
}

const ApplicationCard: Component<ApplicationCardProps> = (props) => {
  const app = () => props.application;
  const accentColor = () => props.statusColor || props.theme().colors.primary;
  const daysInStatus = () => daysSince(app().lastActivityAt);

  // Determine next action based on status
  const nextAction = () => {
    const status = app().status;
    const days = daysInStatus();

    if (days >= 14) return 'Consider following up';
    if (status === 'saved') return 'Ready to apply';
    if (status === 'applied' && days >= 7) return 'Follow up soon';
    if (status === 'interviewing') return 'Prepare for next round';
    if (status === 'offered') return 'Review and respond';
    return undefined;
  };

  // Handle drag start
  const handleDragStart = (e: DragEvent) => {
    try {
      if (!e.dataTransfer) {
        log.warn('Drag operation failed: dataTransfer not available');
        return;
      }
      e.dataTransfer.setData('text/plain', app().id);
      e.dataTransfer.effectAllowed = 'move';
      props.onDragStart?.();
    } catch (error) {
      log.error('Failed to initiate drag operation:', error);
      // Reset dragging state if drag fails
      props.onDragEnd?.();
    }
  };

  const handleDragEnd = () => {
    props.onDragEnd?.();
  };

  return (
    <Tooltip
      content={
        <ApplicationTooltipContent
          companyName={app().companyName}
          roleName={app().roleName}
          daysInCurrentStatus={daysInStatus()}
          status={STATUS_LABELS[app().status]}
          score={app().analysis?.overallScore}
          nextAction={nextAction()}
          accentColor={accentColor()}
          salary={formatSalary(app().salary)}
          location={app().location}
          locationType={app().locationType}
        />
      }
      position="auto"
      delay={300}
      disabled={props.isDragging}
    >
      <AgingCardWrapper
        lastActivityAt={app().lastActivityAt}
        settings={pipelineStore.state.settings}
        peelSize="medium"
        showTexture={true}
        showCoffeeStain={false}
      >
        <div
          draggable={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          style={{
            opacity: props.isDragging ? 0.5 : 1,
            transform: props.isDragging ? 'scale(0.98)' : 'scale(1)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
        >
          <FluidCard
            onClick={props.onClick}
            hoverable
            glowColor={accentColor()}
            style={{
              padding: '16px',
              cursor: 'grab',
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(35, 35, 40, 0.95), rgba(25, 25, 30, 0.98))',
              border: `1px solid rgba(255, 255, 255, 0.08)`,
            }}
            class="application-card"
          >
            {/* Checkbox - appears on hover or when selected */}
            <Show when={props.onCheckboxChange}>
              <div
                class="card-checkbox"
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  'z-index': '10',
                  opacity: props.isSelected ? '1' : '0',
                  transition: 'opacity 0.15s ease',
                }}
              >
                <Checkbox
                  checked={props.isSelected || false}
                  onChange={(checked) => props.onCheckboxChange?.(app().id, checked)}
                  size="sm"
                  accentColor={accentColor()}
                />
              </div>
            </Show>
            <div
              style={{
                'font-size': '16px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'font-weight': '700',
                color: props.theme().colors.text,
                'margin-bottom': '4px',
                'white-space': 'nowrap',
                overflow: 'hidden',
                'text-overflow': 'ellipsis',
                'line-height': '1.4',
                'padding-left': props.onCheckboxChange ? '28px' : '0',
              }}
            >
              {app().roleName}
            </div>
            <div
              style={{
                'font-size': '14px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                color: props.theme().colors.textMuted,
                'margin-bottom': '8px',
                'white-space': 'nowrap',
                overflow: 'hidden',
                'text-overflow': 'ellipsis',
                'padding-left': props.onCheckboxChange ? '28px' : '0',
              }}
            >
              {app().companyName}
            </div>

            {/* Location icon */}
            <Show when={app().location || app().locationType}>
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '6px',
                  'font-size': '12px',
                  color: props.theme().colors.textMuted,
                  'padding-left': props.onCheckboxChange ? '28px' : '0',
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span
                  style={{
                    'white-space': 'nowrap',
                    overflow: 'hidden',
                    'text-overflow': 'ellipsis',
                  }}
                >
                  {app().location || app().locationType}
                </span>
              </div>
            </Show>
            <style>{`
            .application-card:hover .card-checkbox {
              opacity: 1 !important;
            }
          `}</style>
          </FluidCard>
        </div>
      </AgingCardWrapper>
    </Tooltip>
  );
};

interface ApplicationRowProps {
  application: JobApplication;
  theme: () => typeof liquidTenure;
  onClick: () => void;
  hideStatusBadge?: boolean;
  // Selection props
  isSelected?: boolean;
  onCheckboxChange?: (id: string, checked: boolean) => void;
}

const ApplicationRow: Component<ApplicationRowProps> = (props) => {
  const app = () => props.application;
  const statusColor = () => statusColors[app().status]?.text || '#FFFFFF';
  const daysInStatus = () => daysSince(app().lastActivityAt);

  // Determine next action based on status
  const nextAction = () => {
    const status = app().status;
    const days = daysInStatus();

    if (days >= 14) return 'Consider following up';
    if (status === 'saved') return 'Ready to apply';
    if (status === 'applied' && days >= 7) return 'Follow up soon';
    if (status === 'interviewing') return 'Prepare for next round';
    if (status === 'offered') return 'Review and respond';
    return undefined;
  };

  return (
    <Tooltip
      content={
        <ApplicationTooltipContent
          companyName={app().companyName}
          roleName={app().roleName}
          daysInCurrentStatus={daysInStatus()}
          status={STATUS_LABELS[app().status]}
          score={app().analysis?.overallScore}
          nextAction={nextAction()}
          accentColor={statusColor()}
          salary={formatSalary(app().salary)}
          location={app().location}
          locationType={app().locationType}
        />
      }
      position="auto"
      delay={300}
    >
      <AgingCardWrapper
        lastActivityAt={app().lastActivityAt}
        settings={pipelineStore.state.settings}
        peelSize="small"
        showTexture={true}
        showCoffeeStain={false}
      >
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
          class="application-row"
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

          {/* Checkbox - appears on hover or when selected */}
          <Show when={props.onCheckboxChange}>
            <div
              class="row-checkbox"
              style={{
                'flex-shrink': '0',
                opacity: props.isSelected ? '1' : '0',
                transition: 'opacity 0.15s ease',
                'margin-left': '8px',
              }}
            >
              <Checkbox
                checked={props.isSelected || false}
                onChange={(checked) => props.onCheckboxChange?.(app().id, checked)}
                size="sm"
                accentColor={statusColor()}
              />
            </div>
          </Show>

          {/* Company/Role */}
          <div
            style={{
              flex: '1',
              'min-width': '0',
              'padding-left': props.onCheckboxChange ? '0' : '8px',
            }}
          >
            <div
              style={{
                'font-size': '16px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                'font-weight': '700',
                color: props.theme().colors.text,
                'white-space': 'nowrap',
                overflow: 'hidden',
                'text-overflow': 'ellipsis',
                'line-height': '1.4',
              }}
            >
              {app().roleName}
            </div>
            <div
              style={{
                'font-size': '14px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                color: props.theme().colors.textMuted,
                'margin-top': '2px',
              }}
            >
              {app().companyName}
            </div>
          </div>

          {/* Location icon (if available) */}
          <Show when={app().location || app().locationType}>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '6px',
                padding: '6px 12px',
                'font-size': '13px',
                color: props.theme().colors.textMuted,
                'white-space': 'nowrap',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {app().location || app().locationType}
            </div>
          </Show>

          {/* Aging Indicator */}
          <AgingIndicator lastActivityAt={app().lastActivityAt} size="sm" />

          {/* Status - hidden in grouped list view */}
          <Show when={!props.hideStatusBadge}>
            <StatusBadge status={app().status} size="sm" />
          </Show>

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
          <style>{`
          .application-row:hover .row-checkbox {
            opacity: 1 !important;
          }
        `}</style>
        </FluidCard>
      </AgingCardWrapper>
    </Tooltip>
  );
};

// ============================================================================
// STAGE DEFINITION TOOLTIP - Explains what each stage means
// ============================================================================

interface StageDefinitionTooltipProps {
  status: ApplicationStatus;
  accentColor: string;
}

const StageDefinitionTooltip: Component<StageDefinitionTooltipProps> = (props) => {
  const definitions: Record<ApplicationStatus, { title: string; definition: string }> = {
    saved: {
      title: 'Saved',
      definition: "Jobs you've bookmarked for future consideration. Not yet applied.",
    },
    applied: {
      title: 'Applied',
      definition: 'Application has been submitted. Waiting for initial response from the company.',
    },
    screening: {
      title: 'Screening',
      definition:
        'Initial contact or conversations with recruiter/hiring manager. Not yet a formal interview.',
    },
    interviewing: {
      title: 'Interviewing',
      definition:
        'In the official interview process. May include phone screens, technical assessments, or panel interviews.',
    },
    offered: {
      title: 'Offered',
      definition:
        'Company has extended a formal job offer. Reviewing terms and negotiating if needed.',
    },
    accepted: {
      title: 'Accepted',
      definition: "You've accepted the offer. Congratulations!",
    },
    rejected: {
      title: 'Rejected',
      definition: 'Company declined to move forward. Consider following up for feedback.',
    },
    withdrawn: {
      title: 'Withdrawn',
      definition: 'You chose to withdraw from consideration for this role.',
    },
  };

  const info = () => definitions[props.status];

  return (
    <div
      style={{
        padding: '12px 14px',
        display: 'flex',
        'flex-direction': 'column',
        gap: '8px',
      }}
    >
      <div
        style={{
          'font-size': '13px',
          'font-family': "'Space Grotesk', system-ui, sans-serif",
          'font-weight': '700',
          color: props.accentColor,
          'letter-spacing': '0.02em',
          'text-transform': 'uppercase',
        }}
      >
        {info().title}
      </div>
      <div
        style={{
          'font-size': '13px',
          'font-family': "'Space Grotesk', system-ui, sans-serif",
          'line-height': '1.5',
          color: 'rgba(255, 255, 255, 0.85)',
        }}
      >
        {info().definition}
      </div>
    </div>
  );
};

export default PipelineDashboard;
