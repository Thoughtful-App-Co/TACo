/**
 * Your Worth - Salary Tracking & Market Comparison
 *
 * Features:
 * - Per-year salary entries linked to resume positions
 * - Line chart showing salary growth over time
 * - Market comparison overlay (BLS percentile bands)
 * - Growth analytics and percentile positioning
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createMemo, For, Show, onMount, JSX } from 'solid-js';
import { Portal } from 'solid-js/web';
import { prosperStore } from '../store';
import { getRateLimitStatus } from '../services/salary-benchmark.service';
import { salaryColors, prosperTenure } from '../theme/prosper-tenure';
import type { SalaryEntry } from '../../../../schemas/tenure';
import { prepareStore } from '../../prepare';
import { isV2FeatureEnabled } from '../../../../lib/feature-gates';
import {
  ChartBarIcon,
  FileTextIcon,
  CurrencyDollarIcon,
  PencilSimpleIcon,
  WarningIcon,
  CheckIcon,
  LockIcon,
  XIcon,
  ArrowRightIcon,
} from 'solid-phosphor/bold';
import { LineChart, LineChartDataPoint, OverlayLine } from '../../../common/charts';

// ============================================================================
// TYPES
// ============================================================================

type FormMode = 'none' | 'mode-select' | 'add-single' | 'add-range';

interface ExtendedSnapshot {
  year: number;
  userSalary: number;
  company: string;
  title: string;
  entryId?: string; // Added for delete functionality
  marketData?: {
    percentile10: number;
    percentile25: number;
    median: number;
    percentile75: number;
    percentile90: number;
    userPercentile?: number;
  };
}

interface YourWorthViewProps {
  currentTheme: () => typeof prosperTenure;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper to convert hex color to rgba with opacity
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// ============================================================================
// SALARY CHART COMPONENT
// ============================================================================

interface SalaryChartProps {
  theme: () => typeof prosperTenure;
}

const SalaryChart: Component<SalaryChartProps> = (props) => {
  const theme = () => props.theme();
  const snapshots = createMemo(() => prosperStore.getCompensationSnapshots());
  const showComparison = createMemo(
    () => prosperStore.state.salaryHistory?.comparisonEnabled ?? false
  );

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Convert snapshots to chart data
  const chartData = createMemo((): LineChartDataPoint<ExtendedSnapshot>[] =>
    snapshots().map((s) => ({
      x: s.year,
      y: s.userSalary,
      label: String(s.year),
      data: s,
    }))
  );

  // Market comparison overlay lines
  const overlayLines = createMemo((): OverlayLine[] => {
    if (!showComparison()) return [];

    const snapshotsWithMarketData = snapshots().filter((s) => s.marketData);
    if (snapshotsWithMarketData.length === 0) return [];

    return [
      {
        id: 'p25',
        data: snapshotsWithMarketData.map((s) => ({
          x: s.year,
          y: s.marketData!.percentile25,
        })),
        color: salaryColors.percentile25,
        strokeWidth: 1.5,
        strokeDasharray: '4,4',
        label: '25th Percentile',
      },
      {
        id: 'median',
        data: snapshotsWithMarketData.map((s) => ({
          x: s.year,
          y: s.marketData!.median,
        })),
        color: salaryColors.median,
        strokeWidth: 2,
        strokeDasharray: '6,3',
        label: 'Market Median',
      },
      {
        id: 'p75',
        data: snapshotsWithMarketData.map((s) => ({
          x: s.year,
          y: s.marketData!.percentile75,
        })),
        color: salaryColors.percentile75,
        strokeWidth: 1.5,
        strokeDasharray: '4,4',
        label: '75th Percentile',
      },
    ];
  });

  // Custom tooltip renderer
  const renderSalaryTooltip = (point: LineChartDataPoint<ExtendedSnapshot>): JSX.Element => {
    const snapshot = point.data!;
    return (
      <div style={{ 'min-width': '180px' }}>
        <div
          style={{
            'font-size': '11px',
            color: theme().colors.textMuted,
            'margin-bottom': '4px',
          }}
        >
          {snapshot.company || 'Company'} · {snapshot.title || 'Title'}
        </div>
        <div
          style={{
            'font-size': '13px',
            'font-weight': '600',
            color: theme().colors.primary,
            'margin-bottom': '6px',
          }}
        >
          {snapshot.year}
        </div>
        <div
          style={{
            'font-size': '20px',
            'font-weight': '700',
            color: '#FFFFFF',
          }}
        >
          {formatCurrency(snapshot.userSalary)}
        </div>
        <Show when={snapshot.marketData}>
          <div
            style={{
              'font-size': '12px',
              color: salaryColors.median,
              'margin-top': '4px',
            }}
          >
            {Math.round(snapshot.marketData!.userPercentile!)}th percentile
          </div>
        </Show>
      </div>
    );
  };

  return (
    <Show when={snapshots().length > 0} fallback={<EmptyChartState theme={props.theme} />}>
      <div
        style={{
          background: theme().colors.surface,
          padding: '24px',
          'border-radius': '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
            'margin-bottom': '16px',
          }}
        >
          <h3
            style={{
              'font-family': "'Playfair Display', Georgia, serif",
              'font-size': '20px',
              color: theme().colors.text,
              margin: 0,
            }}
          >
            Salary Growth Over Time
          </h3>
          <Show when={isV2FeatureEnabled('MARKET_COMPARISON')}>
            <button
              onClick={() => prosperStore.toggleMarketComparison()}
              style={{
                background: showComparison() ? theme().colors.primary : theme().colors.surface,
                color: showComparison() ? theme().colors.background : theme().colors.text,
                border: `1px solid ${showComparison() ? theme().colors.primary : theme().colors.border}`,
                padding: '8px 16px',
                'border-radius': '8px',
                cursor: 'pointer',
                'font-size': '14px',
                transition: 'all 0.2s',
              }}
            >
              <Show when={showComparison()}>
                <CheckIcon
                  width={14}
                  height={14}
                  style={{
                    display: 'inline-block',
                    'vertical-align': 'middle',
                    'margin-right': '4px',
                  }}
                />
              </Show>
              {showComparison() ? 'Market Comparison' : 'Show Market Comparison'}
            </button>
          </Show>
        </div>

        {/* Reusable LineChart Component */}
        <LineChart<ExtendedSnapshot>
          data={chartData()}
          theme={theme()}
          overlayLines={overlayLines()}
          renderTooltip={renderSalaryTooltip}
          id="prosper-salary-chart"
          config={{
            height: 400,
            margin: { top: 20, right: 20, bottom: 60, left: 80 },
            showArea: true,
            showPoints: true,
            showGrid: true,
            curveSmooth: true,
            formatYTick: formatCurrency,
            formatXTick: (v) => String(v),
            lineColor: theme().colors.primary,
            areaGradientOpacity: [0.4, 0.05],
          }}
        />

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            'justify-content': 'center',
            gap: '24px',
            'margin-top': '16px',
            'flex-wrap': 'wrap',
          }}
        >
          <LegendItem color={theme().colors.primary} label="Your Salary" theme={props.theme} />
          <Show when={showComparison()}>
            <LegendItem
              color={salaryColors.median}
              label="Market Median"
              dashed
              theme={props.theme}
            />
            <LegendItem
              color={salaryColors.percentile75}
              label="75th Percentile"
              dashed
              theme={props.theme}
            />
            <LegendItem
              color={salaryColors.percentile25}
              label="25th Percentile"
              dashed
              theme={props.theme}
            />
          </Show>
        </div>
      </div>
    </Show>
  );
};

interface LegendItemProps {
  color: string;
  label: string;
  dashed?: boolean;
  theme: () => typeof prosperTenure;
}

const LegendItem: Component<LegendItemProps> = (props) => (
  <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
    <div
      style={{
        width: '24px',
        height: props.dashed ? '2px' : '3px',
        background: props.dashed ? 'none' : props.color,
        'border-top': props.dashed ? `2px dashed ${props.color}` : 'none',
      }}
    />
    <span style={{ 'font-size': '14px', color: props.theme().colors.textMuted }}>
      {props.label}
    </span>
  </div>
);

interface EmptyChartStateProps {
  theme: () => typeof prosperTenure;
}

const EmptyChartState: Component<EmptyChartStateProps> = (props) => (
  <div
    style={{
      background: props.theme().colors.surface,
      padding: '64px 32px',
      'border-radius': '16px',
      'text-align': 'center',
      border: `2px dashed ${props.theme().colors.border}`,
    }}
  >
    <div style={{ display: 'flex', 'justify-content': 'center', 'margin-bottom': '16px' }}>
      <ChartBarIcon width={48} height={48} color={props.theme().colors.textMuted} />
    </div>
    <h3
      style={{
        'font-family': "'Playfair Display', Georgia, serif",
        'font-size': '24px',
        color: props.theme().colors.text,
        'margin-bottom': '8px',
      }}
    >
      No Salary Data Yet
    </h3>
    <p style={{ color: props.theme().colors.textMuted, 'margin-bottom': '24px' }}>
      Add your first salary entry to start tracking your growth
    </p>
  </div>
);

// ============================================================================
// SALARY ENTRY FORMS
// ============================================================================

interface YearlyEntryFormProps {
  onClose: () => void;
  theme: () => typeof prosperTenure;
}

const YearlyEntryForm: Component<YearlyEntryFormProps> = (props) => {
  const theme = () => props.theme();

  // Form state
  const [selectedPositionId, setSelectedPositionId] = createSignal<string | null>(null);
  const [selectedYear, setSelectedYear] = createSignal(0);
  const [baseSalary, setBaseSalary] = createSignal('');
  const [bonus, setBonus] = createSignal('');
  const [equity, setEquity] = createSignal('');
  const [loading, setLoading] = createSignal(false);

  // Computed: selected position from resume
  const selectedPosition = createMemo(() => {
    const posId = selectedPositionId();
    if (!posId) return null;
    return (
      prepareStore.state.masterResume?.parsedSections.experience.find((e) => e.id === posId) || null
    );
  });

  // Computed: available years for selected position (excluding already used)
  const availableYears = createMemo(() => {
    const pos = selectedPosition();
    if (!pos) return [];

    const startYear = pos.startDate.getFullYear();
    const endYear = pos.endDate?.getFullYear() || new Date().getFullYear();
    const years: number[] = [];

    // Get years already used for this company
    const usedYears = new Set(
      prosperStore.state.salaryHistory?.yearlyEntries
        .filter((e) => e.company === pos.company)
        .map((e) => e.year) || []
    );

    for (let y = startYear; y <= endYear; y++) {
      if (!usedYears.has(y)) {
        years.push(y);
      }
    }

    return years;
  });

  const inputStyle = {
    width: '100%',
    'box-sizing': 'border-box' as const,
    padding: '10px 12px',
    background: theme().colors.background,
    border: `1px solid ${theme().colors.border}`,
    'border-radius': '8px',
    color: theme().colors.text,
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-size': '14px',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const pos = selectedPosition();
    if (!pos || selectedYear() === 0 || !baseSalary()) return;

    setLoading(true);

    const baseNum = parseFloat(baseSalary());
    const bonusNum = bonus() ? parseFloat(bonus()) : undefined;
    const equityNum = equity() ? parseFloat(equity()) : undefined;

    const entry: Omit<SalaryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      year: selectedYear(),
      baseSalary: baseNum,
      bonus: bonusNum,
      equity: equityNum,
      totalCompensation: baseNum + (bonusNum || 0) + (equityNum || 0),
      company: pos.company,
      title: pos.title,
      isEstimated: false,
    };

    prosperStore.addYearlySalaryEntry(entry);
    setLoading(false);
    props.onClose();
  };

  const isFormValid = () => selectedPosition() && selectedYear() > 0 && baseSalary();

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}
    >
      {/* Position Selector */}
      <div>
        <label
          style={{
            display: 'block',
            'font-size': '14px',
            'font-weight': '500',
            color: theme().colors.text,
            'margin-bottom': '6px',
          }}
        >
          Position <span style={{ color: theme().colors.accent }}>*</span>
        </label>
        <Show
          when={prepareStore.state.masterResume}
          fallback={
            <div
              style={{
                padding: '12px',
                background: hexToRgba(theme().colors.accent, 0.1),
                border: `1px solid ${hexToRgba(theme().colors.accent, 0.3)}`,
                'border-radius': '8px',
                'font-size': '13px',
                color: theme().colors.textMuted,
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
              }}
            >
              <WarningIcon width={16} height={16} />
              <span>
                No resume uploaded. Please upload your resume in Prepare to add salary data.
              </span>
            </div>
          }
        >
          <select
            value={selectedPositionId() || ''}
            onChange={(e) => {
              setSelectedPositionId(e.currentTarget.value || null);
              setSelectedYear(0); // Reset year when position changes
            }}
            style={selectStyle}
          >
            <option value="">Select a position...</option>
            <For each={prepareStore.state.masterResume?.parsedSections.experience || []}>
              {(exp) => (
                <option value={exp.id}>
                  {exp.title} @ {exp.company} ({exp.startDate.getFullYear()}-
                  {exp.endDate?.getFullYear() || 'Present'})
                </option>
              )}
            </For>
          </select>
        </Show>
      </div>

      {/* Year Selector - Only shows when position is selected */}
      <Show when={selectedPosition()}>
        <div>
          <label
            style={{
              display: 'block',
              'font-size': '14px',
              'font-weight': '500',
              color: theme().colors.text,
              'margin-bottom': '6px',
            }}
          >
            Year <span style={{ color: theme().colors.accent }}>*</span>
          </label>
          <Show
            when={availableYears().length > 0}
            fallback={
              <div
                style={{
                  padding: '12px',
                  background: hexToRgba(theme().colors.primary, 0.1),
                  border: `1px solid ${hexToRgba(theme().colors.primary, 0.2)}`,
                  'border-radius': '8px',
                  'font-size': '13px',
                  color: theme().colors.textMuted,
                  display: 'flex',
                  'align-items': 'center',
                  gap: '8px',
                }}
              >
                <CheckIcon width={14} height={14} />
                <span>All years for this position already have salary entries.</span>
              </div>
            }
          >
            <select
              value={selectedYear()}
              onChange={(e) => setSelectedYear(parseInt(e.currentTarget.value))}
              style={selectStyle}
            >
              <option value={0}>Select year...</option>
              <For each={availableYears()}>{(year) => <option value={year}>{year}</option>}</For>
            </select>
          </Show>
        </div>

        {/* Locked Position Info */}
        <div
          style={{
            background: hexToRgba(theme().colors.primary, 0.05),
            border: `1px solid ${hexToRgba(theme().colors.primary, 0.15)}`,
            'border-radius': '10px',
            padding: '14px 16px',
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
            <LockIcon width={14} height={14} />
            <span
              style={{
                'font-size': '12px',
                'text-transform': 'uppercase',
                'letter-spacing': '0.05em',
                color: theme().colors.textMuted,
              }}
            >
              Position Details (from Resume)
            </span>
          </div>
          <div
            style={{
              'font-size': '15px',
              'font-weight': '600',
              color: theme().colors.text,
              'margin-bottom': '4px',
            }}
          >
            {selectedPosition()?.title}
          </div>
          <div style={{ 'font-size': '14px', color: theme().colors.textMuted }}>
            {selectedPosition()?.company}
          </div>
        </div>
      </Show>

      {/* Compensation Section - Only shows when year is selected */}
      <Show when={selectedYear() > 0}>
        <div
          style={{
            'border-top': `1px solid ${theme().colors.border}`,
            'padding-top': '16px',
            'margin-top': '8px',
          }}
        >
          <h4
            style={{
              'font-family': "'Playfair Display', Georgia, serif",
              'font-size': '16px',
              color: theme().colors.primary,
              'margin-bottom': '16px',
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
            }}
          >
            <CurrencyDollarIcon width={20} height={20} />
            <span>Compensation for {selectedYear()}</span>
          </h4>

          {/* Base Salary */}
          <div style={{ 'margin-bottom': '12px' }}>
            <label
              style={{
                display: 'block',
                'font-size': '14px',
                'font-weight': '500',
                color: theme().colors.text,
                'margin-bottom': '6px',
              }}
            >
              Base Salary <span style={{ color: theme().colors.accent }}>*</span>
            </label>
            <input
              type="number"
              value={baseSalary()}
              onInput={(e) => setBaseSalary(e.currentTarget.value)}
              min="0"
              step="1000"
              placeholder="e.g., 120000"
              style={inputStyle}
            />
          </div>

          {/* Bonus & Equity side by side */}
          <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  'font-size': '14px',
                  'font-weight': '500',
                  color: theme().colors.text,
                  'margin-bottom': '6px',
                }}
              >
                Bonus
              </label>
              <input
                type="number"
                value={bonus()}
                onInput={(e) => setBonus(e.currentTarget.value)}
                min="0"
                step="1000"
                placeholder="Optional"
                style={inputStyle}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  'font-size': '14px',
                  'font-weight': '500',
                  color: theme().colors.text,
                  'margin-bottom': '6px',
                }}
              >
                Equity/Stock
              </label>
              <input
                type="number"
                value={equity()}
                onInput={(e) => setEquity(e.currentTarget.value)}
                min="0"
                step="1000"
                placeholder="Optional"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      </Show>

      {/* Buttons */}
      <div
        style={{ display: 'flex', gap: '12px', 'justify-content': 'flex-end', 'margin-top': '8px' }}
      >
        <button
          type="button"
          onClick={props.onClose}
          disabled={loading()}
          style={{
            background: 'transparent',
            color: theme().colors.textMuted,
            border: `1px solid ${theme().colors.border}`,
            padding: '10px 20px',
            'border-radius': '8px',
            cursor: 'pointer',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-size': '14px',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading() || !isFormValid()}
          style={{
            background: !isFormValid() ? theme().colors.border : theme().colors.primary,
            color: !isFormValid() ? theme().colors.textMuted : theme().colors.background,
            border: 'none',
            padding: '10px 20px',
            'border-radius': '8px',
            cursor: !isFormValid() ? 'not-allowed' : 'pointer',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '600',
            'font-size': '14px',
          }}
        >
          {loading() ? 'Adding...' : 'Add Entry'}
        </button>
      </div>
    </form>
  );
};

// ============================================================================
// RANGE ENTRY FORM (Quick entry for full position tenure)
// ============================================================================

interface RangeEntryFormProps {
  onClose: () => void;
  theme: () => typeof prosperTenure;
}

const RangeEntryForm: Component<RangeEntryFormProps> = (props) => {
  const theme = () => props.theme();

  // Form state
  const [selectedPositionId, setSelectedPositionId] = createSignal<string | null>(null);
  const [startSalary, setStartSalary] = createSignal('');
  const [endSalary, setEndSalary] = createSignal('');
  const [loading, setLoading] = createSignal(false);

  // Computed: selected position from resume
  const selectedPosition = createMemo(() => {
    const posId = selectedPositionId();
    if (!posId) return null;
    return (
      prepareStore.state.masterResume?.parsedSections.experience.find((e) => e.id === posId) || null
    );
  });

  // Computed: position start and end years
  const positionYears = createMemo(() => {
    const pos = selectedPosition();
    if (!pos) return null;
    return {
      start: pos.startDate.getFullYear(),
      end: pos.endDate?.getFullYear() || new Date().getFullYear(),
    };
  });

  // Computed: check which years already have entries for this SPECIFIC position (company)
  const existingYearsForPosition = createMemo(() => {
    const pos = selectedPosition();
    if (!pos) return new Set<number>();
    return new Set(
      prosperStore.state.salaryHistory?.yearlyEntries
        .filter((e) => e.company === pos.company)
        .map((e) => e.year) || []
    );
  });

  // Computed: years that will be created (not already existing for this position)
  const yearsToCreate = createMemo(() => {
    const years = positionYears();
    const existing = existingYearsForPosition();
    if (!years) return [];

    const result: number[] = [];
    for (let y = years.start; y <= years.end; y++) {
      if (!existing.has(y)) {
        result.push(y);
      }
    }
    return result;
  });

  const inputStyle = {
    width: '100%',
    'box-sizing': 'border-box' as const,
    padding: '10px 12px',
    background: theme().colors.background,
    border: `1px solid ${theme().colors.border}`,
    'border-radius': '8px',
    color: theme().colors.text,
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-size': '14px',
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const pos = selectedPosition();
    const years = positionYears();
    const toCreate = yearsToCreate();

    if (!pos || !years || !startSalary() || !endSalary() || toCreate.length === 0) return;

    setLoading(true);

    const startNum = parseFloat(startSalary());
    const endNum = parseFloat(endSalary());
    const totalYears = years.end - years.start;

    // Create entries for each year with linear interpolation
    toCreate.forEach((year) => {
      let salary: number;
      let isEstimated = false;

      if (year === years.start) {
        salary = startNum;
      } else if (year === years.end) {
        salary = endNum;
      } else {
        // Linear interpolation for years in between
        const progress = (year - years.start) / totalYears;
        salary = Math.round(startNum + (endNum - startNum) * progress);
        isEstimated = true;
      }

      prosperStore.addYearlySalaryEntry({
        year,
        baseSalary: salary,
        totalCompensation: salary,
        company: pos.company,
        title: pos.title,
        isEstimated,
      });
    });

    setLoading(false);
    props.onClose();
  };

  const isFormValid = () => {
    const pos = selectedPosition();
    const toCreate = yearsToCreate();
    if (!pos || toCreate.length === 0) return false;

    return startSalary() && endSalary();
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}
    >
      {/* Position Selector */}
      <div>
        <label
          style={{
            display: 'block',
            'font-size': '14px',
            'font-weight': '500',
            color: theme().colors.text,
            'margin-bottom': '6px',
          }}
        >
          Position <span style={{ color: theme().colors.accent }}>*</span>
        </label>
        <Show
          when={prepareStore.state.masterResume}
          fallback={
            <div
              style={{
                padding: '12px',
                background: hexToRgba(theme().colors.accent, 0.1),
                border: `1px solid ${hexToRgba(theme().colors.accent, 0.3)}`,
                'border-radius': '8px',
                'font-size': '13px',
                color: theme().colors.textMuted,
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
              }}
            >
              <WarningIcon width={16} height={16} />
              <span>
                No resume uploaded. Please upload your resume in Prepare to add salary data.
              </span>
            </div>
          }
        >
          <select
            value={selectedPositionId() || ''}
            onChange={(e) => setSelectedPositionId(e.currentTarget.value || null)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">Select a position...</option>
            <For each={prepareStore.state.masterResume?.parsedSections.experience || []}>
              {(exp) => (
                <option value={exp.id}>
                  {exp.title} @ {exp.company} ({exp.startDate.getFullYear()}-
                  {exp.endDate?.getFullYear() || 'Present'})
                </option>
              )}
            </For>
          </select>
        </Show>
      </div>

      {/* Position Info & Salary Inputs - Only show when position is selected */}
      <Show when={selectedPosition() && positionYears()}>
        {/* Locked Position Info */}
        <div
          style={{
            background: hexToRgba(theme().colors.primary, 0.05),
            border: `1px solid ${hexToRgba(theme().colors.primary, 0.15)}`,
            'border-radius': '10px',
            padding: '14px 16px',
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
            <LockIcon width={14} height={14} />
            <span
              style={{
                'font-size': '12px',
                'text-transform': 'uppercase',
                'letter-spacing': '0.05em',
                color: theme().colors.textMuted,
              }}
            >
              Position Details (from Resume)
            </span>
          </div>
          <div
            style={{
              'font-size': '15px',
              'font-weight': '600',
              color: theme().colors.text,
              'margin-bottom': '4px',
            }}
          >
            {selectedPosition()?.title}
          </div>
          <div style={{ 'font-size': '14px', color: theme().colors.textMuted }}>
            {selectedPosition()?.company} · {positionYears()?.start} - {positionYears()?.end}
          </div>
        </div>

        {/* Salary Range Inputs */}
        <div
          style={{
            'border-top': `1px solid ${theme().colors.border}`,
            'padding-top': '16px',
          }}
        >
          <h4
            style={{
              'font-family': "'Playfair Display', Georgia, serif",
              'font-size': '16px',
              color: theme().colors.primary,
              'margin-bottom': '16px',
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
            }}
          >
            <CurrencyDollarIcon width={20} height={20} />
            <span>Salary Progression</span>
          </h4>

          <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
            {/* Start Salary */}
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  'font-size': '13px',
                  'font-weight': '500',
                  color: theme().colors.text,
                  'margin-bottom': '6px',
                }}
              >
                {positionYears()?.start} Salary
              </label>
              <input
                type="number"
                value={startSalary()}
                onInput={(e) => setStartSalary(e.currentTarget.value)}
                min="0"
                step="1000"
                placeholder="e.g., 95000"
                style={inputStyle}
              />
            </div>

            {/* Arrow */}
            <div
              style={{
                'font-size': '20px',
                color: theme().colors.primary,
                'padding-top': '24px',
                display: 'flex',
                'align-items': 'center',
              }}
            >
              <ArrowRightIcon width={20} height={20} />
            </div>

            {/* End Salary */}
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  'font-size': '13px',
                  'font-weight': '500',
                  color: theme().colors.text,
                  'margin-bottom': '6px',
                }}
              >
                {positionYears()?.end} Salary
              </label>
              <input
                type="number"
                value={endSalary()}
                onInput={(e) => setEndSalary(e.currentTarget.value)}
                min="0"
                step="1000"
                placeholder="e.g., 125000"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Preview of entries to be created */}
          <Show when={startSalary() && endSalary() && yearsToCreate().length > 0}>
            <div
              style={{
                'margin-top': '12px',
                padding: '12px',
                background: hexToRgba(theme().colors.primary, 0.08),
                border: `1px solid ${hexToRgba(theme().colors.primary, 0.2)}`,
                'border-radius': '8px',
              }}
            >
              <div
                style={{
                  'font-size': '13px',
                  'font-weight': '600',
                  color: theme().colors.text,
                  'margin-bottom': '8px',
                }}
              >
                Preview: {yearsToCreate().length}{' '}
                {yearsToCreate().length === 1 ? 'entry' : 'entries'} will be created
              </div>
              <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '6px' }}>
                <For each={yearsToCreate()}>
                  {(year) => {
                    const years = positionYears()!;
                    const startNum = parseFloat(startSalary());
                    const endNum = parseFloat(endSalary());
                    const totalYears = years.end - years.start;

                    let salary: number;
                    let isEstimated = false;

                    if (year === years.start) {
                      salary = startNum;
                    } else if (year === years.end) {
                      salary = endNum;
                    } else {
                      const progress = (year - years.start) / totalYears;
                      salary = Math.round(startNum + (endNum - startNum) * progress);
                      isEstimated = true;
                    }

                    return (
                      <div
                        style={{
                          padding: '4px 8px',
                          background: isEstimated
                            ? hexToRgba(theme().colors.secondary, 0.15)
                            : hexToRgba(theme().colors.primary, 0.15),
                          'border-radius': '4px',
                          'font-size': '12px',
                          color: theme().colors.text,
                        }}
                      >
                        {year}: ${Math.round(salary / 1000)}k
                        {isEstimated && <span style={{ color: theme().colors.textMuted }}> ~</span>}
                      </div>
                    );
                  }}
                </For>
              </div>
              <div
                style={{
                  'margin-top': '8px',
                  'font-size': '11px',
                  color: theme().colors.textMuted,
                }}
              >
                <span style={{ color: theme().colors.secondary }}>~</span> = estimated
                (interpolated)
              </div>
            </div>
          </Show>

          <Show when={yearsToCreate().length === 0 && selectedPosition()}>
            <div
              style={{
                'margin-top': '12px',
                padding: '12px',
                background: hexToRgba(theme().colors.accent, 0.1),
                border: `1px solid ${hexToRgba(theme().colors.accent, 0.2)}`,
                'border-radius': '8px',
                'font-size': '13px',
                color: theme().colors.textMuted,
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
              }}
            >
              <CheckIcon width={16} height={16} />
              <span>All years for this position already have salary entries.</span>
            </div>
          </Show>
        </div>
      </Show>

      {/* Buttons */}
      <div
        style={{ display: 'flex', gap: '12px', 'justify-content': 'flex-end', 'margin-top': '8px' }}
      >
        <button
          type="button"
          onClick={props.onClose}
          disabled={loading()}
          style={{
            background: 'transparent',
            color: theme().colors.textMuted,
            border: `1px solid ${theme().colors.border}`,
            padding: '10px 20px',
            'border-radius': '8px',
            cursor: 'pointer',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-size': '14px',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading() || !isFormValid()}
          style={{
            background: !isFormValid() ? theme().colors.border : theme().colors.primary,
            color: !isFormValid() ? theme().colors.textMuted : theme().colors.background,
            border: 'none',
            padding: '10px 20px',
            'border-radius': '8px',
            cursor: !isFormValid() ? 'not-allowed' : 'pointer',
            'font-family': "'Space Grotesk', system-ui, sans-serif",
            'font-weight': '600',
            'font-size': '14px',
          }}
        >
          {loading() ? 'Adding...' : 'Add Entries'}
        </button>
      </div>
    </form>
  );
};

// ============================================================================
// MODE SELECTOR & POSITION PICKER COMPONENTS
// ============================================================================

interface EntryModeSelectorProps {
  theme: () => typeof prosperTenure;
  onSelectImport: () => void;
  onSelectManual: () => void;
  hasResume: boolean;
  positionCount: number;
}

const EntryModeSelector: Component<EntryModeSelectorProps> = (props) => {
  const theme = () => props.theme();

  return (
    <div
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '12px',
        'margin-bottom': '16px',
        'flex-wrap': 'wrap',
      }}
    >
      <span
        style={{
          'font-size': '14px',
          color: theme().colors.textMuted,
          'font-family': "'Space Grotesk', system-ui, sans-serif",
        }}
      >
        Data source:
      </span>

      <button
        onClick={props.onSelectImport}
        disabled={!props.hasResume}
        style={{
          padding: '8px 16px',
          background: 'transparent',
          border: `1px solid ${theme().colors.border}`,
          'border-radius': '8px',
          color: props.hasResume ? theme().colors.text : theme().colors.textMuted,
          cursor: props.hasResume ? 'pointer' : 'not-allowed',
          'font-family': "'Space Grotesk', system-ui, sans-serif",
          'font-size': '13px',
          transition: 'all 0.2s ease',
          opacity: props.hasResume ? 1 : 0.5,
        }}
        onMouseEnter={(e) => {
          if (props.hasResume) {
            e.currentTarget.style.borderColor = theme().colors.primary;
            e.currentTarget.style.color = theme().colors.primary;
          }
        }}
        onMouseLeave={(e) => {
          if (props.hasResume) {
            e.currentTarget.style.borderColor = theme().colors.border;
            e.currentTarget.style.color = theme().colors.text;
          }
        }}
      >
        <FileTextIcon
          width={16}
          height={16}
          style={{ display: 'inline-block', 'vertical-align': 'middle', 'margin-right': '6px' }}
        />
        Import from Resume {props.hasResume ? `(${props.positionCount})` : '(none)'}
      </button>

      <button
        onClick={props.onSelectManual}
        style={{
          padding: '8px 16px',
          background: 'transparent',
          border: `1px solid ${theme().colors.border}`,
          'border-radius': '8px',
          color: theme().colors.text,
          cursor: 'pointer',
          'font-family': "'Space Grotesk', system-ui, sans-serif",
          'font-size': '13px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme().colors.primary;
          e.currentTarget.style.color = theme().colors.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme().colors.border;
          e.currentTarget.style.color = theme().colors.text;
        }}
      >
        <PencilSimpleIcon
          width={16}
          height={16}
          style={{ display: 'inline-block', 'vertical-align': 'middle', 'margin-right': '6px' }}
        />
        Manual Entry
      </button>
    </div>
  );
};

// ============================================================================
// SALARY DATA TABLE
// ============================================================================

interface SalaryDataTableProps {
  theme: () => typeof prosperTenure;
}

const SalaryDataTable: Component<SalaryDataTableProps> = (props) => {
  const theme = () => props.theme();
  const snapshots = createMemo(() =>
    prosperStore.getCompensationSnapshots().sort((a, b) => b.year - a.year)
  );

  const [showDeleteModal, setShowDeleteModal] = createSignal<{
    year: number;
    company: string;
    title: string;
    salary: number;
  } | null>(null);

  const [showEditModal, setShowEditModal] = createSignal<{
    entryId: string;
    year: number;
    company: string;
    title: string;
    baseSalary: number;
    bonus?: number;
    equity?: number;
  } | null>(null);

  // Edit form state
  const [editPositionId, setEditPositionId] = createSignal<string | null>(null);
  const [editYear, setEditYear] = createSignal(0);
  const [editBaseSalary, setEditBaseSalary] = createSignal('');
  const [editBonus, setEditBonus] = createSignal('');
  const [editEquity, setEditEquity] = createSignal('');

  // Computed: selected position from resume
  const editSelectedPosition = createMemo(() => {
    const posId = editPositionId();
    if (!posId) return null;
    return (
      prepareStore.state.masterResume?.parsedSections.experience.find((e) => e.id === posId) || null
    );
  });

  // Computed: available years for selected position (excluding already used)
  const editAvailableYears = createMemo(() => {
    const pos = editSelectedPosition();
    if (!pos) return [];

    const startYear = pos.startDate.getFullYear();
    const endYear = pos.endDate?.getFullYear() || new Date().getFullYear();
    const years: number[] = [];

    // Get years already used for this company
    const usedYears = new Set(
      prosperStore.state.salaryHistory?.yearlyEntries
        .filter((e) => e.company === pos.company)
        .map((e) => e.year) || []
    );

    // Current edit year should still be available
    const currentEditYear = showEditModal()?.year;

    for (let y = startYear; y <= endYear; y++) {
      if (!usedYears.has(y) || y === currentEditYear) {
        years.push(y);
      }
    }

    return years;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);

  const handleDelete = (snapshot: typeof snapshots extends () => (infer T)[] ? T : never) => {
    setShowDeleteModal({
      year: snapshot.year,
      company: snapshot.company || '',
      title: snapshot.title || '',
      salary: snapshot.userSalary,
    });
  };

  const confirmDelete = () => {
    const modal = showDeleteModal();
    if (!modal) return;

    const entry = prosperStore.state.salaryHistory?.yearlyEntries.find(
      (e) => e.year === modal.year
    );
    if (entry) {
      prosperStore.deleteYearlySalaryEntry(entry.id);
    }
    setShowDeleteModal(null);
  };

  const handleEdit = (snapshot: typeof snapshots extends () => (infer T)[] ? T : never) => {
    const entry = prosperStore.state.salaryHistory?.yearlyEntries.find(
      (e) => e.year === snapshot.year && e.company === snapshot.company
    );
    if (!entry) return;

    // Find matching position in resume
    const matchingPosition = prepareStore.state.masterResume?.parsedSections.experience.find(
      (exp) => exp.company === entry.company
    );

    setEditPositionId(matchingPosition?.id || null);
    setEditYear(entry.year);
    setEditBaseSalary(entry.baseSalary.toString());
    setEditBonus(entry.bonus?.toString() || '');
    setEditEquity(entry.equity?.toString() || '');

    setShowEditModal({
      entryId: entry.id,
      year: entry.year,
      company: entry.company,
      title: entry.title,
      baseSalary: entry.baseSalary,
      bonus: entry.bonus,
      equity: entry.equity,
    });
  };

  const saveEdit = () => {
    const modal = showEditModal();
    const pos = editSelectedPosition();
    if (!modal) return;

    const baseSalaryNum = parseFloat(editBaseSalary());
    const bonusNum = editBonus() ? parseFloat(editBonus()) : undefined;
    const equityNum = editEquity() ? parseFloat(editEquity()) : undefined;

    prosperStore.updateYearlySalaryEntry(modal.entryId, {
      year: editYear(),
      company: pos?.company || modal.company,
      title: pos?.title || modal.title,
      baseSalary: baseSalaryNum,
      bonus: bonusNum,
      equity: equityNum,
      totalCompensation: baseSalaryNum + (bonusNum || 0) + (equityNum || 0),
    });

    setShowEditModal(null);
  };

  return (
    <Show
      when={snapshots().length > 0}
      fallback={
        <div
          style={{
            background: theme().colors.surface,
            padding: '64px 32px',
            'border-radius': '16px',
            'text-align': 'center',
            border: `2px dashed ${theme().colors.border}`,
          }}
        >
          <div style={{ 'font-size': '48px', 'margin-bottom': '16px' }}>+</div>
          <h3
            style={{
              'font-family': "'Playfair Display', Georgia, serif",
              'font-size': '24px',
              color: theme().colors.text,
              'margin-bottom': '8px',
            }}
          >
            No Salary History Yet
          </h3>
          <p style={{ color: theme().colors.textMuted }}>
            Click "+ Add Salary Entry" above to start tracking your compensation
          </p>
        </div>
      }
    >
      <div>
        <div
          style={{
            background: theme().colors.surface,
            border: `1px solid ${theme().colors.border}`,
            'border-radius': '12px',
            overflow: 'hidden',
          }}
        >
          {/* Timeline-style rows */}
          <div style={{ display: 'flex', 'flex-direction': 'column' }}>
            <For each={snapshots()}>
              {(snapshot) => (
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '12px',
                    padding: '14px 20px',
                    'border-bottom': `1px solid ${theme().colors.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = hexToRgba(theme().colors.primary, 0.03);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Timeline dot */}
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      'border-radius': '50%',
                      background: theme().colors.primary,
                      'box-shadow': `0 0 8px ${hexToRgba(theme().colors.primary, 0.5)}`,
                      'flex-shrink': 0,
                    }}
                  />

                  {/* Year */}
                  <div
                    style={{
                      width: '60px',
                      'font-size': '15px',
                      'font-weight': '600',
                      color: theme().colors.text,
                      'font-family': "'Playfair Display', Georgia, serif",
                    }}
                  >
                    {snapshot.year}
                  </div>

                  {/* Company & Title */}
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
                      {snapshot.company || '—'}
                    </div>
                    <div
                      style={{
                        'font-size': '12px',
                        color: theme().colors.textMuted,
                        'white-space': 'nowrap',
                        overflow: 'hidden',
                        'text-overflow': 'ellipsis',
                      }}
                    >
                      {snapshot.title || '—'}
                    </div>
                  </div>

                  {/* Compensation */}
                  <div
                    style={{
                      'font-size': '16px',
                      'font-weight': '700',
                      color: theme().colors.primary,
                      'font-family': "'Playfair Display', Georgia, serif",
                      'text-align': 'right',
                      'min-width': '110px',
                    }}
                  >
                    {formatCurrency(snapshot.userSalary)}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '4px', 'flex-shrink': 0 }}>
                    {/* Edit button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(snapshot);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: theme().colors.textMuted,
                        cursor: 'pointer',
                        'font-size': '14px',
                        padding: '6px 10px',
                        'border-radius': '6px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme().colors.primary;
                        e.currentTarget.style.background = hexToRgba(theme().colors.primary, 0.1);
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme().colors.textMuted;
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <PencilSimpleIcon width={18} height={18} />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(snapshot);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: theme().colors.textMuted,
                        cursor: 'pointer',
                        'font-size': '14px',
                        padding: '6px 10px',
                        'border-radius': '6px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#EF4444';
                        e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme().colors.textMuted;
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <XIcon width={18} height={18} />
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Show when={showDeleteModal()}>
          <Portal>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'z-index': 10000,
              }}
              onClick={() => setShowDeleteModal(null)}
            >
              <div
                style={{
                  background: theme().colors.surface,
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '16px',
                  padding: '24px',
                  'max-width': '400px',
                  width: '90%',
                  'box-shadow': '0 20px 60px rgba(0,0,0,0.4)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3
                  style={{
                    'font-family': "'Playfair Display', Georgia, serif",
                    'font-size': '20px',
                    color: theme().colors.text,
                    'margin-bottom': '12px',
                  }}
                >
                  Delete Salary Entry?
                </h3>
                <p
                  style={{
                    'font-size': '14px',
                    color: theme().colors.textMuted,
                    'margin-bottom': '8px',
                    'line-height': '1.5',
                  }}
                >
                  Are you sure you want to delete this entry?
                </p>
                <div
                  style={{
                    background: hexToRgba(theme().colors.primary, 0.1),
                    border: `1px solid ${hexToRgba(theme().colors.primary, 0.2)}`,
                    'border-radius': '8px',
                    padding: '12px 16px',
                    'margin-bottom': '20px',
                  }}
                >
                  <div style={{ 'font-size': '14px', color: theme().colors.text }}>
                    <strong>{showDeleteModal()!.year}</strong> · {showDeleteModal()!.company}
                  </div>
                  <div style={{ 'font-size': '13px', color: theme().colors.textMuted }}>
                    {showDeleteModal()!.title}
                  </div>
                  <div
                    style={{
                      'font-size': '18px',
                      'font-weight': '700',
                      color: theme().colors.primary,
                      'margin-top': '8px',
                      'font-family': "'Playfair Display', Georgia, serif",
                    }}
                  >
                    {formatCurrency(showDeleteModal()!.salary)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', 'justify-content': 'flex-end' }}>
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    style={{
                      background: 'transparent',
                      color: theme().colors.textMuted,
                      border: `1px solid ${theme().colors.border}`,
                      padding: '10px 20px',
                      'border-radius': '8px',
                      cursor: 'pointer',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      'font-size': '14px',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    style={{
                      background: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 20px',
                      'border-radius': '8px',
                      cursor: 'pointer',
                      'font-family': "'Space Grotesk', system-ui, sans-serif",
                      'font-weight': '600',
                      'font-size': '14px',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </Portal>
        </Show>

        {/* Edit Modal */}
        <Show when={showEditModal()}>
          <Portal>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'z-index': 10000,
                overflow: 'auto',
                padding: '20px',
              }}
              onClick={() => setShowEditModal(null)}
            >
              <div
                style={{
                  background: theme().colors.surface,
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '16px',
                  padding: '24px',
                  'max-width': '480px',
                  width: '100%',
                  'box-shadow': '0 20px 60px rgba(0,0,0,0.4)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3
                  style={{
                    'font-family': "'Playfair Display', Georgia, serif",
                    'font-size': '20px',
                    color: theme().colors.text,
                    'margin-bottom': '20px',
                  }}
                >
                  Edit Salary Entry
                </h3>

                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
                  {/* Position Selector */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        'font-size': '14px',
                        'font-weight': '500',
                        color: theme().colors.text,
                        'margin-bottom': '6px',
                      }}
                    >
                      Position <span style={{ color: theme().colors.accent }}>*</span>
                    </label>
                    <Show
                      when={prepareStore.state.masterResume}
                      fallback={
                        <div
                          style={{
                            padding: '12px',
                            background: hexToRgba(theme().colors.accent, 0.1),
                            border: `1px solid ${hexToRgba(theme().colors.accent, 0.3)}`,
                            'border-radius': '8px',
                            'font-size': '13px',
                            color: theme().colors.textMuted,
                          }}
                        >
                          No resume uploaded. Please upload your resume in Prepare to link salary
                          data to positions.
                        </div>
                      }
                    >
                      <select
                        value={editPositionId() || ''}
                        onChange={(e) => {
                          setEditPositionId(e.currentTarget.value || null);
                          setEditYear(0); // Reset year when position changes
                        }}
                        style={{
                          width: '100%',
                          'box-sizing': 'border-box',
                          padding: '10px 12px',
                          background: theme().colors.background,
                          border: `1px solid ${theme().colors.border}`,
                          'border-radius': '8px',
                          color: theme().colors.text,
                          'font-family': "'Space Grotesk', system-ui, sans-serif",
                          'font-size': '14px',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">Select a position...</option>
                        <For
                          each={prepareStore.state.masterResume?.parsedSections.experience || []}
                        >
                          {(exp) => (
                            <option value={exp.id}>
                              {exp.title} @ {exp.company} ({exp.startDate.getFullYear()}-
                              {exp.endDate?.getFullYear() || 'Present'})
                            </option>
                          )}
                        </For>
                      </select>
                    </Show>
                  </div>

                  {/* Year Selector - Only shows when position is selected */}
                  <Show when={editSelectedPosition()}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          'font-size': '14px',
                          'font-weight': '500',
                          color: theme().colors.text,
                          'margin-bottom': '6px',
                        }}
                      >
                        Year <span style={{ color: theme().colors.accent }}>*</span>
                      </label>
                      <Show
                        when={editAvailableYears().length > 0}
                        fallback={
                          <div
                            style={{
                              padding: '12px',
                              background: hexToRgba(theme().colors.primary, 0.1),
                              border: `1px solid ${hexToRgba(theme().colors.primary, 0.2)}`,
                              'border-radius': '8px',
                              'font-size': '13px',
                              color: theme().colors.textMuted,
                            }}
                          >
                            All years for this position already have salary entries.
                          </div>
                        }
                      >
                        <select
                          value={editYear()}
                          onChange={(e) => setEditYear(parseInt(e.currentTarget.value))}
                          style={{
                            width: '100%',
                            'box-sizing': 'border-box',
                            padding: '10px 12px',
                            background: theme().colors.background,
                            border: `1px solid ${theme().colors.border}`,
                            'border-radius': '8px',
                            color: theme().colors.text,
                            'font-family': "'Space Grotesk', system-ui, sans-serif",
                            'font-size': '14px',
                            cursor: 'pointer',
                          }}
                        >
                          <option value={0}>Select year...</option>
                          <For each={editAvailableYears()}>
                            {(year) => <option value={year}>{year}</option>}
                          </For>
                        </select>
                      </Show>
                    </div>

                    {/* Locked Position Info */}
                    <div
                      style={{
                        background: hexToRgba(theme().colors.primary, 0.05),
                        border: `1px solid ${hexToRgba(theme().colors.primary, 0.15)}`,
                        'border-radius': '10px',
                        padding: '14px 16px',
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
                        <LockIcon width={14} height={14} />
                        <span
                          style={{
                            'font-size': '12px',
                            'text-transform': 'uppercase',
                            'letter-spacing': '0.05em',
                            color: theme().colors.textMuted,
                          }}
                        >
                          Position Details (from Resume)
                        </span>
                      </div>
                      <div
                        style={{
                          'font-size': '15px',
                          'font-weight': '600',
                          color: theme().colors.text,
                          'margin-bottom': '4px',
                        }}
                      >
                        {editSelectedPosition()?.title}
                      </div>
                      <div style={{ 'font-size': '14px', color: theme().colors.textMuted }}>
                        {editSelectedPosition()?.company}
                      </div>
                    </div>
                  </Show>

                  {/* Compensation Section - Only shows when year is selected */}
                  <Show when={editYear() > 0}>
                    <div
                      style={{
                        'border-top': `1px solid ${theme().colors.border}`,
                        'padding-top': '16px',
                        'margin-top': '8px',
                      }}
                    >
                      <h4
                        style={{
                          'font-family': "'Playfair Display', Georgia, serif",
                          'font-size': '16px',
                          color: theme().colors.primary,
                          'margin-bottom': '16px',
                          display: 'flex',
                          'align-items': 'center',
                          gap: '8px',
                        }}
                      >
                        <CurrencyDollarIcon width={20} height={20} />
                        <span>Compensation for {editYear()}</span>
                      </h4>

                      {/* Base Salary */}
                      <div style={{ 'margin-bottom': '12px' }}>
                        <label
                          style={{
                            display: 'block',
                            'font-size': '14px',
                            'font-weight': '500',
                            color: theme().colors.text,
                            'margin-bottom': '6px',
                          }}
                        >
                          Base Salary <span style={{ color: theme().colors.accent }}>*</span>
                        </label>
                        <input
                          type="number"
                          value={editBaseSalary()}
                          onInput={(e) => setEditBaseSalary(e.currentTarget.value)}
                          min="0"
                          step="1000"
                          placeholder="e.g., 120000"
                          style={{
                            width: '100%',
                            'box-sizing': 'border-box',
                            padding: '10px 12px',
                            background: theme().colors.background,
                            border: `1px solid ${theme().colors.border}`,
                            'border-radius': '8px',
                            color: theme().colors.text,
                            'font-family': "'Space Grotesk', system-ui, sans-serif",
                            'font-size': '14px',
                          }}
                        />
                      </div>

                      {/* Bonus & Equity side by side */}
                      <div
                        style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '12px' }}
                      >
                        <div>
                          <label
                            style={{
                              display: 'block',
                              'font-size': '14px',
                              'font-weight': '500',
                              color: theme().colors.text,
                              'margin-bottom': '6px',
                            }}
                          >
                            Bonus
                          </label>
                          <input
                            type="number"
                            value={editBonus()}
                            onInput={(e) => setEditBonus(e.currentTarget.value)}
                            min="0"
                            step="1000"
                            placeholder="Optional"
                            style={{
                              width: '100%',
                              'box-sizing': 'border-box',
                              padding: '10px 12px',
                              background: theme().colors.background,
                              border: `1px solid ${theme().colors.border}`,
                              'border-radius': '8px',
                              color: theme().colors.text,
                              'font-family': "'Space Grotesk', system-ui, sans-serif",
                              'font-size': '14px',
                            }}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              'font-size': '14px',
                              'font-weight': '500',
                              color: theme().colors.text,
                              'margin-bottom': '6px',
                            }}
                          >
                            Equity/Stock
                          </label>
                          <input
                            type="number"
                            value={editEquity()}
                            onInput={(e) => setEditEquity(e.currentTarget.value)}
                            min="0"
                            step="1000"
                            placeholder="Optional"
                            style={{
                              width: '100%',
                              'box-sizing': 'border-box',
                              padding: '10px 12px',
                              background: theme().colors.background,
                              border: `1px solid ${theme().colors.border}`,
                              'border-radius': '8px',
                              color: theme().colors.text,
                              'font-family': "'Space Grotesk', system-ui, sans-serif",
                              'font-size': '14px',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Show>

                  {/* Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      'justify-content': 'flex-end',
                      'margin-top': '8px',
                    }}
                  >
                    <button
                      onClick={() => setShowEditModal(null)}
                      style={{
                        background: 'transparent',
                        color: theme().colors.textMuted,
                        border: `1px solid ${theme().colors.border}`,
                        padding: '10px 20px',
                        'border-radius': '8px',
                        cursor: 'pointer',
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                        'font-size': '14px',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={!editSelectedPosition() || editYear() === 0 || !editBaseSalary()}
                      style={{
                        background:
                          !editSelectedPosition() || editYear() === 0 || !editBaseSalary()
                            ? theme().colors.border
                            : theme().colors.primary,
                        color:
                          !editSelectedPosition() || editYear() === 0 || !editBaseSalary()
                            ? theme().colors.textMuted
                            : theme().colors.background,
                        border: 'none',
                        padding: '10px 20px',
                        'border-radius': '8px',
                        cursor:
                          !editSelectedPosition() || editYear() === 0 || !editBaseSalary()
                            ? 'not-allowed'
                            : 'pointer',
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                        'font-weight': '600',
                        'font-size': '14px',
                      }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Portal>
        </Show>
      </div>
    </Show>
  );
};

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: any;
  theme: () => typeof prosperTenure;
}

const FormField: Component<FormFieldProps> = (props) => (
  <div>
    <label
      style={{
        display: 'block',
        'font-size': '14px',
        'font-weight': '500',
        color: props.theme().colors.text,
        'margin-bottom': '6px',
      }}
    >
      {props.label}
      {props.required && <span style={{ color: props.theme().colors.accent }}>*</span>}
    </label>
    {props.children}
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const YourWorthView: Component<YourWorthViewProps> = (props) => {
  const theme = () => props.currentTheme();

  // View state
  type ViewTab = 'chart' | 'history';
  const [activeTab, setActiveTab] = createSignal<ViewTab>('chart');

  // Form state
  const [formMode, setFormMode] = createSignal<FormMode>('none');

  onMount(() => {
    // Initialize salary history if it doesn't exist
    if (!prosperStore.state.salaryHistory) {
      prosperStore.initializeSalaryHistory('per-year');
    }
  });

  const rateLimitStatus = getRateLimitStatus();

  const tabStyle = (isActive: boolean) => ({
    padding: '12px 24px',
    background: isActive ? theme().colors.primary : 'transparent',
    color: isActive ? theme().colors.background : theme().colors.textMuted,
    border: 'none',
    'border-radius': '8px',
    cursor: 'pointer',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-size': '14px',
    'font-weight': isActive ? '600' : '500',
    transition: 'all 0.15s ease',
  });

  const primaryButtonStyle = {
    background: theme().colors.primary,
    color: theme().colors.background,
    border: 'none',
    padding: '10px 20px',
    'border-radius': '8px',
    cursor: 'pointer',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'font-weight': '600',
    'font-size': '14px',
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ 'margin-bottom': '24px' }}>
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'flex-start',
            'margin-bottom': '16px',
          }}
        >
          <div>
            <h1
              style={{
                margin: '0 0 8px',
                'font-size': '32px',
                'font-family': "'Playfair Display', Georgia, serif",
                'font-weight': '700',
                color: theme().colors.text,
              }}
            >
              Your Worth
            </h1>
            <p
              style={{
                margin: 0,
                'font-size': '15px',
                'font-family': "'Space Grotesk', system-ui, sans-serif",
                color: theme().colors.textMuted,
              }}
            >
              Track your compensation growth and compare to market data
            </p>
          </div>

          {/* Add Entry Button */}
          <button onClick={() => setFormMode('mode-select')} style={primaryButtonStyle}>
            + Add Salary Entry
          </button>
        </div>

        {/* Rate limit info - smaller, inline */}
        <div
          style={{
            'font-size': '12px',
            color: theme().colors.textMuted,
          }}
        >
          Market data lookups:{' '}
          <strong style={{ color: theme().colors.secondary }}>{rateLimitStatus.remaining}</strong> /{' '}
          {rateLimitStatus.total} remaining today
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          'margin-bottom': '24px',
          padding: '4px',
          background: theme().colors.surface,
          'border-radius': '12px',
          width: 'fit-content',
        }}
      >
        <button onClick={() => setActiveTab('chart')} style={tabStyle(activeTab() === 'chart')}>
          Chart
        </button>
        <button onClick={() => setActiveTab('history')} style={tabStyle(activeTab() === 'history')}>
          History
        </button>
      </div>

      {/* Entry Type Selection Modal */}
      <Show when={formMode() === 'mode-select'}>
        <Portal>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'z-index': 10000,
            }}
            onClick={() => setFormMode('none')}
          >
            <div
              style={{
                background: theme().colors.surface,
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '16px',
                padding: '24px',
                'max-width': '400px',
                width: '90%',
                'box-shadow': '0 20px 60px rgba(0,0,0,0.4)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  'font-family': "'Playfair Display', Georgia, serif",
                  'font-size': '20px',
                  color: theme().colors.text,
                  'margin-bottom': '16px',
                }}
              >
                Add Salary Entry
              </h3>

              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
                {/* Single Year Option */}
                <button
                  onClick={() => setFormMode('add-single')}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    background: hexToRgba(theme().colors.primary, 0.05),
                    border: `1px solid ${theme().colors.border}`,
                    'border-radius': '10px',
                    cursor: 'pointer',
                    'text-align': 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme().colors.primary;
                    e.currentTarget.style.background = hexToRgba(theme().colors.primary, 0.1);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme().colors.border;
                    e.currentTarget.style.background = hexToRgba(theme().colors.primary, 0.05);
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      'border-radius': '10px',
                      background: hexToRgba(theme().colors.primary, 0.15),
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'font-size': '18px',
                      color: theme().colors.primary,
                    }}
                  >
                    <CurrencyDollarIcon width={20} height={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        'font-size': '14px',
                        'font-weight': '600',
                        color: theme().colors.text,
                        'margin-bottom': '2px',
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                      }}
                    >
                      Single Year
                    </div>
                    <div
                      style={{
                        'font-size': '12px',
                        color: theme().colors.textMuted,
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                      }}
                    >
                      Add salary for one specific year
                    </div>
                  </div>
                </button>

                {/* Date Range Option */}
                <button
                  onClick={() => setFormMode('add-range')}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    background: hexToRgba(theme().colors.secondary, 0.05),
                    border: `1px solid ${theme().colors.border}`,
                    'border-radius': '10px',
                    cursor: 'pointer',
                    'text-align': 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme().colors.secondary;
                    e.currentTarget.style.background = hexToRgba(theme().colors.secondary, 0.1);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme().colors.border;
                    e.currentTarget.style.background = hexToRgba(theme().colors.secondary, 0.05);
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      'border-radius': '10px',
                      background: hexToRgba(theme().colors.secondary, 0.15),
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'font-size': '18px',
                      color: theme().colors.secondary,
                    }}
                  >
                    <ChartBarIcon width={20} height={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        'font-size': '14px',
                        'font-weight': '600',
                        color: theme().colors.text,
                        'margin-bottom': '2px',
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                      }}
                    >
                      Full Position Range
                    </div>
                    <div
                      style={{
                        'font-size': '12px',
                        color: theme().colors.textMuted,
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                      }}
                    >
                      Quick entry: start & end salary for entire tenure
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setFormMode('none')}
                style={{
                  'margin-top': '16px',
                  width: '100%',
                  padding: '10px',
                  background: 'transparent',
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '8px',
                  color: theme().colors.textMuted,
                  cursor: 'pointer',
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  'font-size': '14px',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Portal>
      </Show>

      {/* Salary Entry Form Modal */}
      <Show when={formMode() === 'add-single'}>
        <Portal>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'z-index': 10000,
              overflow: 'auto',
              padding: '20px',
            }}
            onClick={() => {
              setFormMode('none');
            }}
          >
            <div
              style={{
                background: theme().colors.surface,
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '16px',
                padding: '24px',
                'max-width': '500px',
                width: '100%',
                'box-shadow': '0 20px 60px rgba(0,0,0,0.4)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  'font-family': "'Playfair Display', Georgia, serif",
                  'font-size': '20px',
                  color: theme().colors.text,
                  'margin-bottom': '16px',
                }}
              >
                Add Salary Entry
              </h3>
              <YearlyEntryForm
                onClose={() => {
                  setFormMode('none');
                }}
                theme={theme}
              />
            </div>
          </div>
        </Portal>
      </Show>

      {/* Range Entry Form Modal */}
      <Show when={formMode() === 'add-range'}>
        <Portal>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'z-index': 10000,
              overflow: 'auto',
              padding: '20px',
            }}
            onClick={() => setFormMode('none')}
          >
            <div
              style={{
                background: theme().colors.surface,
                border: `1px solid ${theme().colors.border}`,
                'border-radius': '16px',
                padding: '24px',
                'max-width': '500px',
                width: '100%',
                'box-shadow': '0 20px 60px rgba(0,0,0,0.4)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  'font-family': "'Playfair Display', Georgia, serif",
                  'font-size': '20px',
                  color: theme().colors.text,
                  'margin-bottom': '16px',
                }}
              >
                Add Salary Range
              </h3>
              <RangeEntryForm onClose={() => setFormMode('none')} theme={theme} />
            </div>
          </div>
        </Portal>
      </Show>

      {/* Tab Content */}
      <Show when={activeTab() === 'chart'}>
        <SalaryChart theme={theme} />
      </Show>

      <Show when={activeTab() === 'history'}>
        <SalaryDataTable theme={theme} />
      </Show>
    </div>
  );
};

export default YourWorthView;
