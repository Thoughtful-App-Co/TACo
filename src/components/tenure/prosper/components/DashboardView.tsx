/**
 * DashboardView - Prosper overview dashboard with enhanced tooltips and career metrics
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createMemo, For, Show } from 'solid-js';
import { prosperStore } from '../store';
import { prepareStore } from '../../prepare/store';
import { prosperTenure } from '../theme/prosper-tenure';
import { FluidCard } from '../../ui';
import { Tooltip, StatTooltipContent } from '../../pipeline/ui';
import { MobileLayout } from '../../lib/MobileLayout';
import { PageHeader } from '../../lib/PageHeader';
import { MobileDrawerNavItem } from '../../lib/mobile-menu-context';
import type { AccomplishmentType } from '../../../../schemas/tenure';

interface DashboardViewProps {
  currentTheme: () => typeof prosperTenure;
  onNavigate: (section: 'dashboard' | 'your-worth' | 'journal' | 'reviews' | 'export') => void;
}

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================

/**
 * Format salary compactly: "$95k" or "$1.2m"
 */
function formatSalaryCompact(n: number): string {
  if (n >= 1_000_000) {
    const millions = n / 1_000_000;
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}m`;
  }
  const thousands = Math.round(n / 1000);
  return `$${thousands}k`;
}

/**
 * Helper to get current quarter
 */
function getCurrentQuarterString(): string {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const quarterNumber = Math.floor(month / 3) + 1;
  return `Q${quarterNumber} ${year}`;
}

/**
 * Helper to map mood to number
 */
function moodToNumber(mood: string): number {
  const moodMap: Record<string, number> = {
    thriving: 5,
    satisfied: 4,
    neutral: 3,
    struggling: 2,
    'burnt-out': 1,
  };
  return moodMap[mood] || 3;
}

/**
 * Helper to map number back to mood label
 */
function numberToMoodLabel(num: number): string {
  if (num >= 4.5) return 'Thriving';
  if (num >= 3.5) return 'Satisfied';
  if (num >= 2.5) return 'Neutral';
  if (num >= 1.5) return 'Struggling';
  return 'Burnt-out';
}

/**
 * Helper to format relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Helper to format duration
 */
function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) return `${remainingMonths}m`;
  if (remainingMonths === 0) return `${years}y`;
  return `${years}y ${remainingMonths}m`;
}

// ==========================================================================
// STAT CARD COMPONENT
// ==========================================================================

interface StatCardProps {
  label: string;
  value: number | string;
  icon: Component<{ size?: number; color?: string }>;
  color?: string;
  tooltipContent?: {
    title: string;
    metrics: Array<{
      label: string;
      value: string | number;
      color?: string;
      trend?: 'up' | 'down' | 'neutral';
    }>;
    insight?: string;
  };
}

const StatCard: Component<StatCardProps> = (props) => {
  const accentColor = () => props.color || '#8B5CF6';

  const cardContent = (
    <FluidCard
      variant="stat"
      accentColor={accentColor()}
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
          background: `linear-gradient(90deg, transparent, ${accentColor()}60, ${accentColor()}40, transparent)`,
          'border-radius': '0 0 2px 2px',
        }}
      />
      <div
        style={{
          display: 'flex',
          'justify-content': 'center',
          'margin-bottom': '12px',
          opacity: 0.9,
        }}
      >
        <div
          style={{
            padding: '10px',
            'border-radius': '12px',
            background: `linear-gradient(135deg, ${accentColor()}15, ${accentColor()}10)`,
            border: `1px solid ${accentColor()}25`,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
          }}
        >
          <props.icon size={22} color={accentColor()} />
        </div>
      </div>
      <div
        class="stat-value"
        style={{
          'font-size': '32px',
          'font-weight': '700',
          'font-family': "'Playfair Display', Georgia, serif",
          color: accentColor(),
          'line-height': '1',
          'text-shadow': `0 0 20px ${accentColor()}30`,
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

  return (
    <Show when={props.tooltipContent} fallback={cardContent}>
      <Tooltip
        content={
          <StatTooltipContent
            title={props.tooltipContent!.title}
            metrics={props.tooltipContent!.metrics}
            insight={props.tooltipContent!.insight}
          />
        }
        position="auto"
        maxWidth={320}
      >
        {cardContent}
      </Tooltip>
    </Show>
  );
};

// ==========================================================================
// ICON COMPONENTS
// ==========================================================================

const IconHome: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconDollar: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconJournal: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const IconTrophy: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const IconReview: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconMomentum: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const IconPlus: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconChevronRight: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconExport: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

// ==========================================================================
// NAVIGATION CONSTANTS
// ==========================================================================

const PROSPER_NAV_ITEMS: MobileDrawerNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: IconHome, ariaLabel: 'Dashboard' },
  {
    id: 'your-worth',
    label: 'Your Worth',
    icon: IconDollar,
    ariaLabel: 'Your Worth - Compensation tracking',
  },
  { id: 'journal', label: 'Journal', icon: IconJournal, ariaLabel: 'Journal - Career log' },
  { id: 'reviews', label: '360 Reviews', icon: IconReview, ariaLabel: '360 Reviews' },
  { id: 'export', label: 'Export', icon: IconExport, ariaLabel: 'Export data' },
];

// ==========================================================================
// MAIN COMPONENT
// ==========================================================================

export const DashboardView: Component<DashboardViewProps> = (props) => {
  const theme = () => props.currentTheme();

  // ==========================================================================
  // COMPUTED METRICS
  // ==========================================================================

  // 1. Salary Metrics with fixed coverage calculation
  const salaryMetrics = createMemo(() => {
    const snapshots = prosperStore.getCompensationSnapshots();
    const totalDataPoints = snapshots.length;

    // Get unique years from snapshots
    const yearsWithData = [...new Set(snapshots.map((s) => s.year))];

    // Get resume positions for career span calculation
    const experience = prepareStore.state.masterResume?.parsedSections.experience || [];

    // Calculate calendar year span from positions
    let earliestWorkYear = Infinity;
    let latestWorkYear = -Infinity;
    let totalMonthsWorked = 0;
    const currentYear = new Date().getFullYear();

    experience.forEach((pos) => {
      const startDate = pos.startDate ? new Date(pos.startDate) : null;
      const endDate = pos.endDate ? new Date(pos.endDate) : new Date();

      if (startDate) {
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();

        // Track min/max years
        if (startYear < earliestWorkYear) earliestWorkYear = startYear;
        if (endYear > latestWorkYear) latestWorkYear = endYear;

        // Calculate months worked for this position
        const monthsInPosition = Math.round(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        totalMonthsWorked += monthsInPosition;
      }
    });

    // Handle edge case: no positions
    if (earliestWorkYear === Infinity) earliestWorkYear = currentYear;
    if (latestWorkYear === -Infinity) latestWorkYear = currentYear;

    // Calendar year span
    const totalCalendarYears = latestWorkYear - earliestWorkYear + 1;
    const calendarMonthsSpan = totalCalendarYears * 12;

    // Coverage based on calendar year span
    const coveragePercent =
      totalCalendarYears > 0 ? Math.round((yearsWithData.length / totalCalendarYears) * 100) : 0;

    // Work ethic multiplier (overlapping jobs mean more work)
    const workEthicMultiplier =
      calendarMonthsSpan > 0
        ? Math.round((totalMonthsWorked / calendarMonthsSpan) * 100) / 100
        : 1.0;

    // Missing years (from the career span)
    const allYearsInSpan: number[] = [];
    for (let y = earliestWorkYear; y <= latestWorkYear; y++) {
      allYearsInSpan.push(y);
    }
    const missingYears = allYearsInSpan.filter((y) => !yearsWithData.includes(y));

    // Unique companies
    const uniqueCompanies = [...new Set(snapshots.map((s) => s.company))].length;

    // Calculate average YoY growth
    let avgYoYGrowth = 0;
    if (snapshots.length >= 2) {
      const sortedSnapshots = [...snapshots].sort((a, b) => a.year - b.year);
      let totalGrowth = 0;
      let growthCount = 0;
      for (let i = 1; i < sortedSnapshots.length; i++) {
        const prevSalary = sortedSnapshots[i - 1].userSalary;
        const currSalary = sortedSnapshots[i].userSalary;
        if (prevSalary > 0) {
          totalGrowth += ((currSalary - prevSalary) / prevSalary) * 100;
          growthCount++;
        }
      }
      avgYoYGrowth = growthCount > 0 ? totalGrowth / growthCount : 0;
    }

    // Salary range
    const salaries = snapshots.map((s) => s.userSalary).filter((s) => s > 0);
    const highestSalary = salaries.length > 0 ? Math.max(...salaries) : 0;
    const lowestSalary = salaries.length > 0 ? Math.min(...salaries) : 0;

    return {
      totalDataPoints,
      yearsWithData,
      totalCalendarYears,
      coveragePercent,
      missingYears,
      uniqueCompanies,
      avgYoYGrowth: Math.round(avgYoYGrowth * 10) / 10,
      highestSalary,
      lowestSalary,
      earliestYear: earliestWorkYear !== Infinity ? earliestWorkYear : null,
      latestYear: latestWorkYear !== -Infinity ? latestWorkYear : null,
      totalMonthsWorked,
      calendarMonthsSpan,
      workEthicMultiplier,
    };
  });

  // 2. Journal Metrics
  const journalMetrics = createMemo(() => {
    const checkIns = prosperStore.state.checkIns;
    const totalCheckIns = checkIns.length;

    // This quarter count
    const currentQuarter = getCurrentQuarterString();
    const thisQuarter = checkIns.filter((c) => c.quarter === currentQuarter).length;

    // Average mood
    let avgMood = 0;
    if (totalCheckIns > 0) {
      const totalMood = checkIns.reduce((sum, c) => sum + moodToNumber(c.reflection.mood), 0);
      avgMood = totalMood / totalCheckIns;
    }

    // Last entry date
    const sortedCheckIns = [...checkIns].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastEntryDate = sortedCheckIns.length > 0 ? new Date(sortedCheckIns[0].createdAt) : null;

    // Calculate streak (consecutive quarters with check-ins)
    let streak = 0;
    if (checkIns.length > 0) {
      const quarters = [...new Set(checkIns.map((c) => c.quarter))].sort().reverse();
      const now = new Date();
      let expectedQuarter = Math.floor(now.getMonth() / 3) + 1;
      let expectedYear = now.getFullYear();

      for (const q of quarters) {
        const expectedQ = `Q${expectedQuarter} ${expectedYear}`;
        if (q === expectedQ) {
          streak++;
          expectedQuarter--;
          if (expectedQuarter === 0) {
            expectedQuarter = 4;
            expectedYear--;
          }
        } else {
          break;
        }
      }
    }

    // Mood trend (last 3 check-ins)
    let moodTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (sortedCheckIns.length >= 3) {
      const last3Moods = sortedCheckIns.slice(0, 3).map((c) => moodToNumber(c.reflection.mood));
      const avgFirst = last3Moods[2];
      const avgLast = last3Moods[0];
      if (avgLast > avgFirst + 0.5) moodTrend = 'improving';
      else if (avgLast < avgFirst - 0.5) moodTrend = 'declining';
    }

    return {
      totalCheckIns,
      thisQuarter,
      avgMood: Math.round(avgMood * 10) / 10,
      lastEntryDate,
      streak,
      moodTrend,
    };
  });

  // 3. Accomplishment Metrics
  const accomplishmentMetrics = createMemo(() => {
    const accomplishments = prosperStore.state.accomplishments;
    const total = accomplishments.length;

    // This quarter
    const currentQuarter = getCurrentQuarterString();
    const thisQuarter = accomplishments.filter((a) => a.quarter === currentQuarter).length;

    // By type breakdown
    const byType: Record<AccomplishmentType, number> = {
      project: 0,
      metric: 0,
      recognition: 0,
      learning: 0,
      milestone: 0,
      other: 0,
    };
    accomplishments.forEach((a) => {
      byType[a.type] = (byType[a.type] || 0) + 1;
    });

    // Most common type
    let mostCommonType: AccomplishmentType = 'project';
    let maxCount = 0;
    (Object.keys(byType) as AccomplishmentType[]).forEach((type) => {
      if (byType[type] > maxCount) {
        maxCount = byType[type];
        mostCommonType = type;
      }
    });

    // With metrics
    const withMetrics = accomplishments.filter((a) => a.metric).length;

    // Most recent date
    const sortedAccomplishments = [...accomplishments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const mostRecentDate =
      sortedAccomplishments.length > 0 ? new Date(sortedAccomplishments[0].date) : null;

    // Avg per quarter
    const quarters = [...new Set(accomplishments.map((a) => a.quarter))];
    const avgPerQuarter = quarters.length > 0 ? total / quarters.length : 0;

    // Ready for resume (not added yet)
    const readyForResume = accomplishments.filter((a) => !a.addedToResume).length;

    return {
      total,
      thisQuarter,
      byType,
      mostCommonType,
      withMetrics,
      mostRecentDate,
      avgPerQuarter: Math.round(avgPerQuarter * 10) / 10,
      readyForResume,
    };
  });

  // 4. Position Metrics (from prepareStore) with timeline data
  const positionMetrics = createMemo(() => {
    const experience = prepareStore.state.masterResume?.parsedSections.experience || [];
    const snapshots = prosperStore.getCompensationSnapshots();
    const currentYear = new Date().getFullYear();

    // Calculate global timeline bounds
    let earliestYear = Infinity;
    let latestYear = -Infinity;

    const positions = experience.map((pos) => {
      const startDate = pos.startDate ? new Date(pos.startDate) : null;
      const endDate = pos.endDate ? new Date(pos.endDate) : null;

      let durationMonths = 0;
      let startYear = currentYear;
      let endYear = currentYear;

      if (startDate) {
        const end = endDate || new Date();
        durationMonths = Math.round(
          (end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        startYear = startDate.getFullYear();
        endYear = endDate ? endDate.getFullYear() : currentYear;

        if (startYear < earliestYear) earliestYear = startYear;
        if (endYear > latestYear) latestYear = endYear;
      }

      // Calculate average salary for this company
      const companySnapshots = snapshots.filter(
        (s) => s.company.toLowerCase() === pos.company.toLowerCase()
      );
      const avgSalary =
        companySnapshots.length > 0
          ? companySnapshots.reduce((sum, s) => sum + s.userSalary, 0) / companySnapshots.length
          : null;

      return {
        id: pos.id,
        company: pos.company,
        title: pos.title,
        startDate,
        endDate,
        startYear,
        endYear,
        durationMonths,
        avgSalary,
        isCurrent: !pos.endDate,
      };
    });

    // Handle edge case
    if (earliestYear === Infinity) earliestYear = currentYear;
    if (latestYear === -Infinity) latestYear = currentYear;

    // Sort by start date (oldest first for timeline display)
    const sortedPositions = [...positions].sort((a, b) => {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return a.startDate.getTime() - b.startDate.getTime();
    });

    const totalPositions = positions.length;
    const currentPosition = positions.find((p) => p.isCurrent);
    const avgTenure =
      totalPositions > 0
        ? positions.reduce((sum, p) => sum + p.durationMonths, 0) / totalPositions
        : 0;
    const longestTenure =
      positions.length > 0
        ? positions.reduce(
            (max, p) => (p.durationMonths > max.durationMonths ? p : max),
            positions[0]
          )
        : null;

    // Calculate work ethic multiplier
    const totalMonthsWorked = positions.reduce((sum, p) => sum + p.durationMonths, 0);
    const calendarMonthsSpan = (latestYear - earliestYear + 1) * 12;
    const workEthicMultiplier =
      calendarMonthsSpan > 0
        ? Math.round((totalMonthsWorked / calendarMonthsSpan) * 100) / 100
        : 1.0;

    return {
      positions: sortedPositions,
      totalPositions,
      currentPosition,
      avgTenure: Math.round(avgTenure),
      longestTenure,
      earliestYear,
      latestYear,
      workEthicMultiplier,
    };
  });

  // 5. Career Momentum Score
  const careerMomentumScore = createMemo(() => {
    const salary = salaryMetrics();
    const accomplishments = accomplishmentMetrics();
    const journal = journalMetrics();

    // Salary Growth Vector (0-40 points)
    let salaryPoints = 0;
    if (salary.avgYoYGrowth > 5) salaryPoints = 40;
    else if (salary.avgYoYGrowth >= 3) salaryPoints = 30;
    else if (salary.avgYoYGrowth >= 1) salaryPoints = 20;
    else if (salary.avgYoYGrowth >= 0) salaryPoints = 10;
    else salaryPoints = 0;

    // Accomplishment Velocity (0-30 points)
    let accomplishmentPoints = 0;
    if (accomplishments.avgPerQuarter > 3) accomplishmentPoints = 30;
    else if (accomplishments.avgPerQuarter >= 2) accomplishmentPoints = 20;
    else if (accomplishments.avgPerQuarter >= 1) accomplishmentPoints = 15;
    else accomplishmentPoints = 5;

    // Journal Consistency (0-30 points)
    let journalPoints = 0;
    if (journal.streak > 4) journalPoints = 30;
    else if (journal.streak >= 3) journalPoints = 25;
    else if (journal.streak === 2) journalPoints = 15;
    else if (journal.streak === 1) journalPoints = 10;
    else journalPoints = 0;

    const score = salaryPoints + accomplishmentPoints + journalPoints;

    // Generate insight based on lowest scoring area
    let insight = '';
    const lowestArea = Math.min(salaryPoints, accomplishmentPoints, journalPoints);
    if (lowestArea === salaryPoints && salaryPoints < 30) {
      insight = 'Focus on salary negotiations to boost momentum';
    } else if (lowestArea === accomplishmentPoints && accomplishmentPoints < 20) {
      insight = 'Log more accomplishments to strengthen your record';
    } else if (lowestArea === journalPoints && journalPoints < 20) {
      insight = 'Build your check-in streak for better consistency';
    } else {
      insight = 'Great momentum! Keep up the consistent effort';
    }

    return {
      score,
      salaryPoints,
      accomplishmentPoints,
      journalPoints,
      insight,
    };
  });

  // Basic stats for backward compatibility
  const stats = createMemo(() => ({
    salaryDataPoints: salaryMetrics().totalDataPoints,
    journalEntries: journalMetrics().totalCheckIns,
    accomplishments: accomplishmentMetrics().total,
    activeReviews: prosperStore.state.reviewCycles.filter((r) => r.status !== 'completed').length,
  }));

  // ==========================================================================
  // TOOLTIP CONTENT BUILDERS
  // ==========================================================================

  const salaryTooltipContent = createMemo(() => {
    const m = salaryMetrics();
    const coverageColor =
      m.coveragePercent >= 80 ? '#10B981' : m.coveragePercent >= 50 ? '#F59E0B' : '#EF4444';
    const workEthicColor = m.workEthicMultiplier > 1.2 ? '#F59E0B' : theme().colors.text;

    return {
      title: 'Salary Data Points',
      metrics: [
        { label: 'Coverage', value: `${m.coveragePercent}%`, color: coverageColor },
        {
          label: 'Career span',
          value: m.earliestYear && m.latestYear ? `${m.earliestYear} - ${m.latestYear}` : 'N/A',
        },
        {
          label: 'Work ethic',
          value:
            m.workEthicMultiplier === 1.0
              ? '1.0x (focused)'
              : `${m.workEthicMultiplier.toFixed(2)}x`,
          color: workEthicColor,
        },
        {
          label: 'Avg YoY growth',
          value: `${m.avgYoYGrowth}%`,
          trend:
            m.avgYoYGrowth > 0
              ? ('up' as const)
              : m.avgYoYGrowth < 0
                ? ('down' as const)
                : ('neutral' as const),
        },
        {
          label: 'Range',
          value:
            m.lowestSalary > 0
              ? `${formatSalaryCompact(m.lowestSalary)} - ${formatSalaryCompact(m.highestSalary)}`
              : 'No data',
        },
      ],
      insight:
        m.missingYears.length > 0
          ? `Missing data for ${m.missingYears.length} year(s)`
          : 'Complete salary history!',
    };
  });

  const journalTooltipContent = createMemo(() => {
    const m = journalMetrics();
    const thisQuarterColor = m.thisQuarter > 0 ? '#10B981' : '#F59E0B';
    const moodTrendText =
      m.moodTrend === 'improving'
        ? 'Mood trending up'
        : m.moodTrend === 'declining'
          ? 'Mood trending down'
          : 'Mood stable';

    return {
      title: 'Journal Entries',
      metrics: [
        { label: 'Total check-ins', value: m.totalCheckIns },
        { label: 'This quarter', value: m.thisQuarter, color: thisQuarterColor },
        { label: 'Average mood', value: numberToMoodLabel(m.avgMood) },
        {
          label: 'Last entry',
          value: m.lastEntryDate ? formatRelativeTime(m.lastEntryDate) : 'Never',
        },
        { label: 'Streak', value: `${m.streak} consecutive quarters` },
      ],
      insight: moodTrendText,
    };
  });

  const accomplishmentTooltipContent = createMemo(() => {
    const m = accomplishmentMetrics();
    const thisQuarterColor = m.thisQuarter > 0 ? '#10B981' : '#F59E0B';

    return {
      title: 'Accomplishments',
      metrics: [
        { label: 'Total logged', value: m.total },
        { label: 'This quarter', value: m.thisQuarter, color: thisQuarterColor },
        { label: 'With quantified metrics', value: m.withMetrics },
        {
          label: 'Most common type',
          value: m.mostCommonType.charAt(0).toUpperCase() + m.mostCommonType.slice(1),
        },
        { label: 'Avg per quarter', value: m.avgPerQuarter },
      ],
      insight: `${m.readyForResume} accomplishment${m.readyForResume !== 1 ? 's' : ''} ready for your resume!`,
    };
  });

  const momentumTooltipContent = createMemo(() => {
    const m = careerMomentumScore();

    return {
      title: 'Career Momentum',
      metrics: [
        { label: 'Overall score', value: `${m.score}/100` },
        { label: 'Salary growth', value: `${m.salaryPoints}/40 pts` },
        { label: 'Accomplishment velocity', value: `${m.accomplishmentPoints}/30 pts` },
        { label: 'Journal consistency', value: `${m.journalPoints}/30 pts` },
      ],
      insight: m.insight,
    };
  });

  // ==========================================================================
  // COLOR HELPERS
  // ==========================================================================

  const getMomentumColor = () => {
    const score = careerMomentumScore().score;
    if (score >= 70) return '#10B981'; // Green
    if (score >= 40) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  // ==========================================================================
  // TIMELINE HELPERS
  // ==========================================================================

  const getTimelineBarStyle = (
    position: {
      startYear: number;
      endYear: number;
      isCurrent: boolean;
    },
    earliestYear: number,
    latestYear: number
  ) => {
    const totalSpan = latestYear - earliestYear + 1;
    const startOffset = ((position.startYear - earliestYear) / totalSpan) * 100;
    const width = ((position.endYear - position.startYear + 1) / totalSpan) * 100;

    return {
      left: `${startOffset}%`,
      width: `${Math.max(width, 3)}%`, // Minimum 3% width for visibility
    };
  };

  // Generate year markers for timeline (all years for tick marks)
  const getAllYearMarkers = createMemo(() => {
    const { earliestYear, latestYear } = positionMetrics();
    const years: number[] = [];
    for (let y = earliestYear; y <= latestYear; y++) {
      years.push(y);
    }
    return years;
  });

  // Generate visible year labels based on span (adaptive display)
  const getVisibleYearLabels = createMemo(() => {
    const allYears = getAllYearMarkers();
    const span = allYears.length;

    if (span <= 8) {
      // Show all years
      return allYears;
    } else if (span <= 15) {
      // Show every 2nd year, always include first and last
      return allYears.filter((year, index) => index === 0 || index === span - 1 || year % 2 === 0);
    } else {
      // Show every 5th year, always include first and last
      return allYears.filter((year, index) => index === 0 || index === span - 1 || year % 5 === 0);
    }
  });

  // Check if a year should show a label
  const shouldShowYearLabel = (year: number) => {
    return getVisibleYearLabels().includes(year);
  };

  // ==========================================================================
  // POSITION TOOLTIP HELPER
  // ==========================================================================

  type PositionWithMetrics = ReturnType<typeof positionMetrics>['positions'][number];

  const getPositionTooltipContent = (position: PositionWithMetrics) => {
    // Format dates nicely
    const startDate = position.startDate;
    const endDate = position.endDate;

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const dateRange = startDate
      ? `${formatDate(startDate)} - ${endDate ? formatDate(endDate) : 'Present'}`
      : 'Unknown dates';

    const metrics: Array<{
      label: string;
      value: string | number;
      color?: string;
    }> = [
      { label: 'Role', value: position.title },
      { label: 'Period', value: dateRange },
      { label: 'Duration', value: formatDuration(position.durationMonths) },
    ];

    // Add salary if available
    if (position.avgSalary) {
      metrics.push({
        label: 'Avg Salary',
        value: formatSalaryCompact(position.avgSalary),
        color: '#10B981',
      });
    }

    // Add current status if applicable
    if (position.isCurrent) {
      metrics.push({
        label: 'Status',
        value: 'Current Position',
        color: theme().colors.primary,
      });
    }

    return {
      title: position.company,
      metrics,
    };
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <MobileLayout
      title="Dashboard"
      theme={props.currentTheme}
      drawerProps={{
        appName: 'Prosper',
        navItems: PROSPER_NAV_ITEMS,
        currentSection: 'dashboard',
        onNavigate: (section: string) => {
          props.onNavigate(
            section as 'dashboard' | 'your-worth' | 'journal' | 'reviews' | 'export'
          );
        },
        basePath: '/tenure/prosper',
        currentTenureApp: 'prosper',
      }}
    >
      <PageHeader
        subtitle="Overview of your career growth and compensation"
        theme={props.currentTheme}
      />

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          'margin-bottom': '32px',
        }}
      >
        <StatCard
          label="Salary Data Points"
          value={stats().salaryDataPoints}
          icon={IconDollar}
          color="#10B981"
          tooltipContent={salaryTooltipContent()}
        />
        <StatCard
          label="Journal Entries"
          value={stats().journalEntries}
          icon={IconJournal}
          color="#60A5FA"
          tooltipContent={journalTooltipContent()}
        />
        <StatCard
          label="Accomplishments"
          value={stats().accomplishments}
          icon={IconTrophy}
          color="#F59E0B"
          tooltipContent={accomplishmentTooltipContent()}
        />
        <StatCard
          label="Active Reviews"
          value={stats().activeReviews}
          icon={IconReview}
          color="#8B5CF6"
        />
        <StatCard
          label="Career Momentum"
          value={careerMomentumScore().score}
          icon={IconMomentum}
          color={getMomentumColor()}
          tooltipContent={momentumTooltipContent()}
        />
      </div>

      {/* Career Timeline Section - Horizontal Visualization */}
      <Show when={positionMetrics().positions.length > 0}>
        <FluidCard
          variant="elevated"
          style={{
            padding: '24px',
            'margin-bottom': '32px',
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
            Career Timeline
          </h2>

          {/* Year Axis */}
          <div
            style={{
              position: 'relative',
              'margin-bottom': '16px',
              'padding-left': '0',
            }}
          >
            {/* Year markers */}
            <div
              style={{
                display: 'flex',
                'justify-content': 'space-between',
                'margin-bottom': '4px',
              }}
            >
              <For each={getAllYearMarkers()}>
                {(year) => (
                  <span
                    style={{
                      'font-size': '10px',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      color: theme().colors.textMuted,
                      'text-align': 'center',
                      flex: 1,
                      visibility: shouldShowYearLabel(year) ? 'visible' : 'hidden',
                    }}
                  >
                    {year}
                  </span>
                )}
              </For>
            </div>

            {/* Timeline axis line */}
            <div
              style={{
                height: '2px',
                background: `linear-gradient(90deg, ${theme().colors.border}, ${theme().colors.border})`,
                'border-radius': '1px',
                position: 'relative',
              }}
            >
              {/* Year tick marks */}
              <For each={getAllYearMarkers()}>
                {(_, index) => {
                  const totalYears = getAllYearMarkers().length;
                  const position = (index() / (totalYears - 1 || 1)) * 100;
                  return (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${position}%`,
                        top: '-3px',
                        width: '2px',
                        height: '8px',
                        background: theme().colors.textMuted,
                        'border-radius': '1px',
                        transform: 'translateX(-50%)',
                      }}
                    />
                  );
                }}
              </For>
            </div>
          </div>

          {/* Position Bars */}
          <div
            role="list"
            aria-label="Career timeline showing work history"
            style={{
              display: 'flex',
              'flex-direction': 'column',
              gap: '12px',
              'margin-top': '20px',
            }}
          >
            <For each={positionMetrics().positions}>
              {(position) => {
                const barStyle = getTimelineBarStyle(
                  position,
                  positionMetrics().earliestYear,
                  positionMetrics().latestYear
                );
                // Dark text color for light/primary backgrounds (documented semantic token)
                const darkTextOnLight = 'rgba(15, 23, 42, 0.9)';
                // Store original shadow for hover restore
                const originalShadow = position.isCurrent
                  ? `0 0 12px ${theme().colors.primary}40, 0 2px 8px rgba(0,0,0,0.2)`
                  : '0 1px 3px rgba(0,0,0,0.1)';

                const positionTooltip = getPositionTooltipContent(position);

                return (
                  <div
                    style={{
                      position: 'relative',
                      height: '36px',
                    }}
                  >
                    {/* Position bar wrapped in tooltip */}
                    <Tooltip
                      content={
                        <StatTooltipContent
                          title={positionTooltip.title}
                          metrics={positionTooltip.metrics}
                        />
                      }
                      position="top"
                      maxWidth={280}
                    >
                      <div
                        role="listitem"
                        aria-label={`${position.company}, ${position.title}, ${position.startYear} to ${position.isCurrent ? 'present' : position.endYear}, duration ${formatDuration(position.durationMonths)}`}
                        tabIndex={0}
                        style={{
                          position: 'absolute',
                          left: barStyle.left,
                          width: barStyle.width,
                          height: '100%',
                          background: position.isCurrent
                            ? `linear-gradient(135deg, ${theme().colors.primary}, ${theme().colors.primary}CC)`
                            : `${theme().colors.textMuted}60`,
                          'border-radius': '6px',
                          padding: '6px 10px',
                          'box-sizing': 'border-box',
                          overflow: 'hidden',
                          'box-shadow': originalShadow,
                          border: position.isCurrent
                            ? `1px solid ${theme().colors.primary}`
                            : `1px solid ${theme().colors.border}`,
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                          'min-width': '80px',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = position.isCurrent
                            ? `0 0 16px ${theme().colors.primary}60, 0 4px 12px rgba(0,0,0,0.25)`
                            : `0 4px 12px rgba(0,0,0,0.2)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = originalShadow;
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.outline = `2px solid ${theme().colors.primary}`;
                          e.currentTarget.style.outlineOffset = '2px';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.outline = 'none';
                        }}
                      >
                        {/* Simplified content: Company name + current dot indicator */}
                        <div
                          style={{
                            display: 'flex',
                            'align-items': 'center',
                            'justify-content': 'center',
                            gap: '6px',
                            height: '100%',
                          }}
                        >
                          {/* Company name only */}
                          <span
                            style={{
                              'font-size': '13px',
                              'font-weight': '600',
                              'font-family': "'Playfair Display', Georgia, serif",
                              color: position.isCurrent ? darkTextOnLight : theme().colors.text,
                              'white-space': 'nowrap',
                              overflow: 'hidden',
                              'text-overflow': 'ellipsis',
                              'max-width': '100%',
                            }}
                          >
                            {position.company}
                          </span>

                          {/* Current indicator - small dot instead of badge */}
                          <Show when={position.isCurrent}>
                            <div
                              style={{
                                width: '6px',
                                height: '6px',
                                'border-radius': '50%',
                                background: darkTextOnLight,
                                'flex-shrink': 0,
                              }}
                            />
                          </Show>
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                );
              }}
            </For>
          </div>

          {/* Summary Row */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              'flex-wrap': 'wrap',
              gap: '8px',
              'margin-top': '20px',
              'padding-top': '16px',
              'border-top': `1px solid ${theme().colors.border}`,
              'font-size': '13px',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              color: theme().colors.textMuted,
            }}
          >
            <span
              style={{
                'font-weight': '600',
                'font-family': "'Playfair Display', Georgia, serif",
                color: theme().colors.text,
              }}
            >
              {positionMetrics().totalPositions} Positions
            </span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>
              Avg{' '}
              <span style={{ color: theme().colors.text }}>
                {(positionMetrics().avgTenure / 12).toFixed(1)}y
              </span>
            </span>
            <Show when={positionMetrics().workEthicMultiplier > 1.0}>
              <span style={{ opacity: 0.5 }}>·</span>
              <span
                style={{
                  color:
                    positionMetrics().workEthicMultiplier > 1.2
                      ? '#F59E0B'
                      : theme().colors.textMuted,
                }}
              >
                <span
                  style={{
                    'font-weight': positionMetrics().workEthicMultiplier > 1.2 ? '600' : '400',
                    color:
                      positionMetrics().workEthicMultiplier > 1.2 ? '#F59E0B' : theme().colors.text,
                  }}
                >
                  {positionMetrics().workEthicMultiplier.toFixed(1)}x
                </span>{' '}
                parallel work
              </span>
            </Show>
            <span style={{ opacity: 0.5 }}>·</span>
            <Show when={positionMetrics().longestTenure}>
              <span>
                Longest:{' '}
                <span style={{ color: theme().colors.text }}>
                  {formatDuration(positionMetrics().longestTenure!.durationMonths)}
                </span>
              </span>
            </Show>
          </div>
        </FluidCard>
      </Show>

      {/* Empty State for Career Timeline */}
      <Show when={positionMetrics().positions.length === 0}>
        <FluidCard
          variant="elevated"
          style={{
            padding: '24px',
            'margin-bottom': '32px',
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
            Career Timeline
          </h2>
          <div
            style={{
              'text-align': 'center',
              padding: '40px',
              color: theme().colors.textMuted,
            }}
          >
            <p
              style={{
                margin: 0,
                'font-size': '14px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
              }}
            >
              Add work experience in Prepare to see your career timeline
            </p>
          </div>
        </FluidCard>
      </Show>

      {/* Quick Actions */}
      <FluidCard
        variant="elevated"
        style={{
          padding: '24px',
          display: 'flex',
          'flex-direction': 'column',
          gap: '16px',
          'max-width': '480px',
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
          onClick={() => props.onNavigate('your-worth')}
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
            transition: 'all 0.2s ease',
            'font-size': '15px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '500',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(4px)';
            e.currentTarget.style.background = `linear-gradient(135deg, ${theme().colors.primary}25, ${theme().colors.primary}10)`;
            e.currentTarget.style.borderColor = theme().colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.background = `linear-gradient(135deg, ${theme().colors.primary}15, ${theme().colors.primary}05)`;
            e.currentTarget.style.borderColor = `${theme().colors.primary}30`;
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
            <span>Add Salary Entry</span>
          </div>
          <IconChevronRight size={16} color={theme().colors.textMuted} />
        </button>

        <button
          onClick={() => props.onNavigate('journal')}
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
            transition: 'all 0.2s ease',
            'font-size': '15px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '500',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(4px)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = theme().colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.borderColor = theme().colors.border;
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
              <IconJournal size={18} />
            </div>
            <span>Start Journal Entry</span>
          </div>
          <IconChevronRight size={16} color={theme().colors.textMuted} />
        </button>

        <button
          onClick={() => props.onNavigate('journal')}
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
            transition: 'all 0.2s ease',
            'font-size': '15px',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '500',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(4px)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = theme().colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.borderColor = theme().colors.border;
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
              <IconTrophy size={18} />
            </div>
            <span>Log Accomplishment</span>
          </div>
          <IconChevronRight size={16} color={theme().colors.textMuted} />
        </button>
      </FluidCard>
    </MobileLayout>
  );
};

export default DashboardView;
