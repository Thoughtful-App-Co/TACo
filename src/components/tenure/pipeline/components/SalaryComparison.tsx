/**
 * SalaryComparison Component
 *
 * Compares a job offer's salary with BLS wage percentiles for the occupation
 * and optionally the region. Shows where an offer falls compared to national
 * and regional wage data to help users understand their compensation.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createResource, Show, createMemo, For, JSX } from 'solid-js';
import { getOccupationWages, onetToSoc } from '../../../../services/bls';
import type { OesWageData } from '../../../../types/bls.types';
import {
  buildStateAreaCode,
  getMsaByKey,
  buildMsaAreaCode,
} from '../../../../data/geographic-codes';
import { liquidTenure, pipelineAnimations } from '../theme/liquid-tenure';
import { WarningIcon, CheckIcon, StarIcon, ChartBarIcon } from 'solid-phosphor/bold';
import { isV2FeatureEnabled } from '../../../../lib/feature-gates';

// ============================================================================
// TYPES
// ============================================================================

interface SalaryComparisonProps {
  /** The job's offered salary (annual) */
  offeredSalary: number;
  /** O*NET or SOC code for the occupation */
  occupationCode: string;
  /** Optional state abbreviation for regional comparison */
  stateCode?: string;
  /** Optional MSA key for metro area comparison */
  msaKey?: string;
  /** Current theme */
  currentTheme: () => typeof liquidTenure;
  /** Compact mode for inline display */
  compact?: boolean;
}

interface Percentiles {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

interface OfferAssessment {
  label: string;
  color: string;
  icon: 'warning' | 'check' | 'star';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate percentile rank using linear interpolation between BLS percentiles.
 * @param value - The salary value to rank
 * @param percentiles - BLS wage percentiles
 * @returns Estimated percentile rank (0-99)
 */
function calculatePercentileRank(value: number, percentiles: Percentiles): number {
  if (value <= percentiles.p10) {
    return Math.max(1, 10 * (value / percentiles.p10));
  }
  if (value <= percentiles.p25) {
    return 10 + 15 * ((value - percentiles.p10) / (percentiles.p25 - percentiles.p10));
  }
  if (value <= percentiles.p50) {
    return 25 + 25 * ((value - percentiles.p25) / (percentiles.p50 - percentiles.p25));
  }
  if (value <= percentiles.p75) {
    return 50 + 25 * ((value - percentiles.p50) / (percentiles.p75 - percentiles.p50));
  }
  if (value <= percentiles.p90) {
    return 75 + 15 * ((value - percentiles.p75) / (percentiles.p90 - percentiles.p75));
  }
  // Above 90th percentile - extrapolate conservatively
  return Math.min(99, 90 + 10 * ((value - percentiles.p90) / (percentiles.p90 * 0.2)));
}

/**
 * Get assessment label, color, and icon based on percentile rank.
 * @param percentile - Calculated percentile rank
 * @returns Assessment object with label, color, and icon
 */
function getOfferAssessment(percentile: number): OfferAssessment {
  if (percentile < 25) {
    return { label: 'Below Market', color: '#EF4444', icon: 'warning' };
  }
  if (percentile < 50) {
    return { label: 'Competitive', color: '#F59E0B', icon: 'check' };
  }
  if (percentile < 75) {
    return { label: 'Above Average', color: '#10B981', icon: 'check' };
  }
  return { label: 'Excellent', color: '#3B82F6', icon: 'star' };
}

/**
 * Format currency for display.
 * @param value - Dollar amount
 * @param compact - Whether to use compact format (e.g., $95K)
 * @returns Formatted currency string
 */
function formatCurrency(value: number, compact: boolean = false): string {
  if (compact && value >= 1000) {
    return `$${Math.round(value / 1000)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage for display.
 * @param value - Percentage value
 * @returns Formatted percentage string with + or - prefix
 */
function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Calculate position on gauge (0-100) for a salary value.
 * @param value - Salary value
 * @param percentiles - BLS wage percentiles
 * @returns Position percentage on the gauge
 */
function calculateGaugePosition(value: number, percentiles: Percentiles): number {
  // Map percentiles to gauge positions: 10th=0%, 25th=25%, 50th=50%, 75th=75%, 90th=100%
  if (value <= percentiles.p10) {
    return Math.max(0, (value / percentiles.p10) * 0);
  }
  if (value <= percentiles.p25) {
    return 0 + ((value - percentiles.p10) / (percentiles.p25 - percentiles.p10)) * 25;
  }
  if (value <= percentiles.p50) {
    return 25 + ((value - percentiles.p25) / (percentiles.p50 - percentiles.p25)) * 25;
  }
  if (value <= percentiles.p75) {
    return 50 + ((value - percentiles.p50) / (percentiles.p75 - percentiles.p50)) * 25;
  }
  if (value <= percentiles.p90) {
    return 75 + ((value - percentiles.p75) / (percentiles.p90 - percentiles.p75)) * 25;
  }
  // Above 90th percentile
  return Math.min(100, 100 + ((value - percentiles.p90) / (percentiles.p90 * 0.2)) * 5);
}

/**
 * Extract percentiles from OES wage data.
 * @param wageData - BLS wage data
 * @returns Percentiles object or null if data incomplete
 */
function extractPercentiles(wageData: OesWageData): Percentiles | null {
  const { annual } = wageData;
  if (
    annual.percentile10 === null ||
    annual.percentile25 === null ||
    annual.median === null ||
    annual.percentile75 === null ||
    annual.percentile90 === null
  ) {
    return null;
  }
  return {
    p10: annual.percentile10,
    p25: annual.percentile25,
    p50: annual.median,
    p75: annual.percentile75,
    p90: annual.percentile90,
  };
}

// ============================================================================
// COMPONENT STYLES
// ============================================================================

const styles = {
  container: (theme: typeof liquidTenure): JSX.CSSProperties => ({
    background: theme.glass.background,
    border: theme.glass.border,
    'backdrop-filter': theme.glass.backdropFilter,
    'border-radius': theme.radii.card,
    padding: '20px',
    transition: `all ${pipelineAnimations.normal} ${pipelineAnimations.flow}`,
  }),

  compactContainer: (_theme: typeof liquidTenure): JSX.CSSProperties => ({
    background: 'transparent',
    border: 'none',
    padding: '12px 0',
  }),

  header: (): JSX.CSSProperties => ({
    display: 'flex',
    'justify-content': 'space-between',
    'align-items': 'flex-start',
    'margin-bottom': '16px',
  }),

  title: (): JSX.CSSProperties => ({
    'font-size': '14px',
    'font-weight': '600',
    color: '#FFFFFF',
    margin: '0 0 4px 0',
  }),

  subtitle: (): JSX.CSSProperties => ({
    'font-size': '12px',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: '0',
  }),

  offerAmount: (): JSX.CSSProperties => ({
    'font-size': '20px',
    'font-weight': '700',
    color: '#FFFFFF',
    'text-align': 'right',
  }),

  offerLabel: (): JSX.CSSProperties => ({
    'font-size': '11px',
    color: 'rgba(255, 255, 255, 0.5)',
    'text-align': 'right',
    'margin-top': '2px',
  }),

  gauge: (): JSX.CSSProperties => ({
    position: 'relative',
    height: '48px',
    'margin-bottom': '16px',
  }),

  gaugeTrack: (): JSX.CSSProperties => ({
    position: 'absolute',
    top: '20px',
    left: '0',
    right: '0',
    height: '8px',
    'border-radius': '4px',
    background: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  }),

  gaugeSegment: (start: number, end: number, segmentColor: string): JSX.CSSProperties => ({
    position: 'absolute',
    left: `${start}%`,
    width: `${end - start}%`,
    height: '100%',
    background: segmentColor,
    opacity: '0.3',
  }),

  gaugeMarker: (position: number, _color: string): JSX.CSSProperties => ({
    position: 'absolute',
    left: `${Math.min(98, Math.max(2, position))}%`,
    top: '8px',
    transform: 'translateX(-50%)',
    'z-index': '10',
  }),

  markerArrow: (color: string): JSX.CSSProperties => ({
    width: '0',
    height: '0',
    'border-left': '8px solid transparent',
    'border-right': '8px solid transparent',
    'border-top': `10px solid ${color}`,
    margin: '0 auto',
  }),

  markerDot: (color: string): JSX.CSSProperties => ({
    width: '12px',
    height: '12px',
    'border-radius': '50%',
    background: color,
    border: '2px solid #FFFFFF',
    'box-shadow': `0 0 8px ${color}`,
    margin: '2px auto 0',
  }),

  percentileLabels: (): JSX.CSSProperties => ({
    display: 'flex',
    'justify-content': 'space-between',
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
  }),

  percentileLabel: (): JSX.CSSProperties => ({
    'font-size': '10px',
    color: 'rgba(255, 255, 255, 0.5)',
    'text-align': 'center',
    flex: '1',
  }),

  badge: (color: string): JSX.CSSProperties => ({
    display: 'inline-flex',
    'align-items': 'center',
    gap: '6px',
    padding: '6px 12px',
    'border-radius': '9999px',
    background: `${color}20`,
    border: `1px solid ${color}40`,
    color: color,
    'font-size': '13px',
    'font-weight': '600',
    'margin-bottom': '16px',
  }),

  detailSection: (): JSX.CSSProperties => ({
    'border-top': '1px solid rgba(255, 255, 255, 0.1)',
    'padding-top': '16px',
  }),

  detailGrid: (): JSX.CSSProperties => ({
    display: 'grid',
    'grid-template-columns': 'repeat(5, 1fr)',
    gap: '8px',
    'margin-bottom': '16px',
  }),

  detailItem: (isActive: boolean): JSX.CSSProperties => ({
    'text-align': 'center',
    padding: '8px 4px',
    'border-radius': '8px',
    background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
  }),

  detailLabel: (): JSX.CSSProperties => ({
    'font-size': '10px',
    color: 'rgba(255, 255, 255, 0.5)',
    'margin-bottom': '4px',
  }),

  detailValue: (isActive: boolean): JSX.CSSProperties => ({
    'font-size': '13px',
    'font-weight': '600',
    color: isActive ? '#60A5FA' : 'rgba(255, 255, 255, 0.8)',
  }),

  comparison: (): JSX.CSSProperties => ({
    display: 'flex',
    'flex-direction': 'column',
    gap: '8px',
  }),

  comparisonRow: (): JSX.CSSProperties => ({
    display: 'flex',
    'justify-content': 'space-between',
    'align-items': 'center',
    padding: '8px 12px',
    'border-radius': '8px',
    background: 'rgba(255, 255, 255, 0.03)',
  }),

  comparisonLabel: (): JSX.CSSProperties => ({
    'font-size': '13px',
    color: 'rgba(255, 255, 255, 0.7)',
  }),

  comparisonValue: (): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'center',
    gap: '8px',
  }),

  comparisonMedian: (): JSX.CSSProperties => ({
    'font-size': '13px',
    'font-weight': '600',
    color: '#FFFFFF',
  }),

  comparisonDiff: (positive: boolean): JSX.CSSProperties => ({
    'font-size': '12px',
    'font-weight': '500',
    color: positive ? '#10B981' : '#EF4444',
  }),

  skeleton: (): JSX.CSSProperties => ({
    height: '200px',
    display: 'flex',
    'flex-direction': 'column',
    'justify-content': 'center',
    'align-items': 'center',
    gap: '12px',
  }),

  skeletonBar: (): JSX.CSSProperties => ({
    width: '100%',
    height: '8px',
    'border-radius': '4px',
    background:
      'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
    'background-size': '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }),

  error: (): JSX.CSSProperties => ({
    padding: '20px',
    'text-align': 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    'font-size': '13px',
  }),

  errorIcon: (): JSX.CSSProperties => ({
    'font-size': '24px',
    'margin-bottom': '8px',
  }),
};

// ============================================================================
// COMPONENT
// ============================================================================

const SalaryComparison: Component<SalaryComparisonProps> = (props) => {
  // Feature gate: BLS integration is deferred to v2
  if (!isV2FeatureEnabled('BLS_INTEGRATION')) {
    return null;
  }

  // Convert O*NET code to SOC if necessary
  const socCode = createMemo(() => {
    const code = props.occupationCode;
    if (code.includes('.')) {
      return onetToSoc(code);
    }
    return code;
  });

  // Build area codes for regional comparison
  const stateAreaCode = createMemo(() => {
    if (!props.stateCode) return null;
    try {
      return buildStateAreaCode(props.stateCode);
    } catch {
      return null;
    }
  });

  const msaAreaCode = createMemo(() => {
    if (!props.msaKey) return null;
    const msa = getMsaByKey(props.msaKey);
    if (!msa) return null;
    return buildMsaAreaCode(msa.code);
  });

  // Fetch national wage data
  const [nationalWages] = createResource(socCode, async (code) => {
    const result = await getOccupationWages(code);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  });

  // Fetch state wage data if state provided
  const [stateWages] = createResource(
    () => ({ soc: socCode(), area: stateAreaCode() }),
    async ({ soc, area }) => {
      if (!area) return null;
      const result = await getOccupationWages(soc, area);
      if (!result.success) return null;
      return result.data;
    }
  );

  // Fetch MSA wage data if MSA provided
  const [msaWages] = createResource(
    () => ({ soc: socCode(), area: msaAreaCode() }),
    async ({ soc, area }) => {
      if (!area) return null;
      const result = await getOccupationWages(soc, area);
      if (!result.success) return null;
      return result.data;
    }
  );

  // Calculate percentiles and assessment from national data
  const percentiles = createMemo(() => {
    const data = nationalWages();
    if (!data) return null;
    return extractPercentiles(data);
  });

  const percentileRank = createMemo(() => {
    const p = percentiles();
    if (!p) return null;
    return Math.round(calculatePercentileRank(props.offeredSalary, p));
  });

  const assessment = createMemo(() => {
    const rank = percentileRank();
    if (rank === null) return null;
    return getOfferAssessment(rank);
  });

  const gaugePosition = createMemo(() => {
    const p = percentiles();
    if (!p) return 50;
    return calculateGaugePosition(props.offeredSalary, p);
  });

  const medianDiff = createMemo(() => {
    const p = percentiles();
    if (!p) return null;
    return props.offeredSalary - p.p50;
  });

  const medianDiffPercent = createMemo(() => {
    const p = percentiles();
    const diff = medianDiff();
    if (!p || diff === null) return null;
    return (diff / p.p50) * 100;
  });

  // Regional comparison calculations
  const regionalComparison = createMemo(() => {
    const national = nationalWages();
    const state = stateWages();
    const msa = msaWages();

    if (!national?.annual.median) return null;

    const comparisons: Array<{
      label: string;
      median: number;
      diff: number;
      diffPercent: number;
    }> = [];

    comparisons.push({
      label: 'National Median',
      median: national.annual.median,
      diff: props.offeredSalary - national.annual.median,
      diffPercent: ((props.offeredSalary - national.annual.median) / national.annual.median) * 100,
    });

    if (state?.annual.median) {
      comparisons.push({
        label: `${state.areaName} Median`,
        median: state.annual.median,
        diff: props.offeredSalary - state.annual.median,
        diffPercent: ((props.offeredSalary - state.annual.median) / state.annual.median) * 100,
      });
    }

    if (msa?.annual.median) {
      // Shorten MSA name for display
      const shortName = msa.areaName.split('-')[0] || msa.areaName;
      comparisons.push({
        label: `${shortName} Median`,
        median: msa.annual.median,
        diff: props.offeredSalary - msa.annual.median,
        diffPercent: ((props.offeredSalary - msa.annual.median) / msa.annual.median) * 100,
      });
    }

    return comparisons;
  });

  // Determine which percentile range the offer falls in
  const activeRange = createMemo(() => {
    const p = percentiles();
    if (!p) return null;
    const salary = props.offeredSalary;
    if (salary < p.p10) return null;
    if (salary < p.p25) return 'p10';
    if (salary < p.p50) return 'p25';
    if (salary < p.p75) return 'p50';
    if (salary < p.p90) return 'p75';
    return 'p90';
  });

  return (
    <div
      style={
        props.compact
          ? {
              ...styles.container(props.currentTheme()),
              ...styles.compactContainer(props.currentTheme()),
            }
          : styles.container(props.currentTheme())
      }
      role="region"
      aria-label="Salary comparison with market data"
    >
      {/* Loading State */}
      <Show when={nationalWages.loading}>
        <div style={styles.skeleton()}>
          <div style={styles.skeletonBar()} />
          <div style={{ ...styles.skeletonBar(), width: '80%' }} />
          <div style={{ ...styles.skeletonBar(), width: '60%' }} />
        </div>
      </Show>

      {/* Error State */}
      <Show when={nationalWages.error}>
        <div style={styles.error()}>
          <div style={styles.errorIcon()}>
            <ChartBarIcon width={32} height={32} />
          </div>
          <p>Unable to load salary comparison data.</p>
          <p style={{ 'font-size': '11px', 'margin-top': '4px' }}>
            Market data unavailable for this occupation.
          </p>
        </div>
      </Show>

      {/* Main Content */}
      <Show when={nationalWages() && percentiles() && assessment()}>
        {/* Header with offer amount */}
        <div style={styles.header()}>
          <div>
            <h4 style={styles.title()}>Salary Market Analysis</h4>
            <p style={styles.subtitle()}>{nationalWages()!.occupationTitle}</p>
          </div>
          <div>
            <div style={styles.offerAmount()}>{formatCurrency(props.offeredSalary)}</div>
            <div style={styles.offerLabel()}>Your Offer</div>
          </div>
        </div>

        {/* Percentile Gauge */}
        <div
          style={styles.gauge()}
          role="img"
          aria-label={`Your offer is at the ${percentileRank()}th percentile`}
        >
          {/* Track with colored segments */}
          <div style={styles.gaugeTrack()}>
            <div style={styles.gaugeSegment(0, 25, '#EF4444')} />
            <div style={styles.gaugeSegment(25, 50, '#F59E0B')} />
            <div style={styles.gaugeSegment(50, 75, '#10B981')} />
            <div style={styles.gaugeSegment(75, 100, '#3B82F6')} />
          </div>

          {/* Marker showing offer position */}
          <div style={styles.gaugeMarker(gaugePosition(), assessment()!.color)}>
            <div style={styles.markerArrow(assessment()!.color)} />
            <div style={styles.markerDot(assessment()!.color)} />
          </div>

          {/* Percentile labels */}
          <div style={styles.percentileLabels()}>
            <div style={styles.percentileLabel()}>
              <div>10th</div>
              <div>{formatCurrency(percentiles()!.p10, true)}</div>
            </div>
            <div style={styles.percentileLabel()}>
              <div>25th</div>
              <div>{formatCurrency(percentiles()!.p25, true)}</div>
            </div>
            <div style={styles.percentileLabel()}>
              <div>Median</div>
              <div>{formatCurrency(percentiles()!.p50, true)}</div>
            </div>
            <div style={styles.percentileLabel()}>
              <div>75th</div>
              <div>{formatCurrency(percentiles()!.p75, true)}</div>
            </div>
            <div style={styles.percentileLabel()}>
              <div>90th</div>
              <div>{formatCurrency(percentiles()!.p90, true)}</div>
            </div>
          </div>
        </div>

        {/* Assessment Badge */}
        <div style={styles.badge(assessment()!.color)}>
          <Show when={assessment()!.icon === 'warning'}>
            <WarningIcon width={16} height={16} />
          </Show>
          <Show when={assessment()!.icon === 'check'}>
            <CheckIcon width={16} height={16} />
          </Show>
          <Show when={assessment()!.icon === 'star'}>
            <StarIcon width={16} height={16} />
          </Show>
          <span>{assessment()!.label}</span>
          <span style={{ opacity: 0.8 }}>({percentileRank()}th percentile)</span>
        </div>

        {/* Detailed Breakdown (not in compact mode) */}
        <Show when={!props.compact}>
          <div style={styles.detailSection()}>
            {/* Percentile Grid */}
            <div style={styles.detailGrid()}>
              <For each={['p10', 'p25', 'p50', 'p75', 'p90'] as const}>
                {(key) => {
                  const p = percentiles()!;
                  const labels: Record<string, string> = {
                    p10: '10th',
                    p25: '25th',
                    p50: 'Median',
                    p75: '75th',
                    p90: '90th',
                  };
                  const isActive = activeRange() === key;
                  return (
                    <div style={styles.detailItem(isActive)}>
                      <div style={styles.detailLabel()}>{labels[key]}</div>
                      <div style={styles.detailValue(isActive)}>{formatCurrency(p[key], true)}</div>
                    </div>
                  );
                }}
              </For>
            </div>

            {/* Median Difference */}
            <Show when={medianDiff() !== null && medianDiffPercent() !== null}>
              <div
                style={{
                  'text-align': 'center',
                  padding: '12px',
                  'border-radius': '8px',
                  background:
                    medianDiff()! >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  'margin-bottom': '16px',
                }}
              >
                <span
                  style={{
                    'font-size': '13px',
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  {medianDiff()! >= 0
                    ? `${formatCurrency(Math.abs(medianDiff()!))} above median`
                    : `${formatCurrency(Math.abs(medianDiff()!))} below median`}
                </span>
                <span
                  style={{
                    'font-size': '13px',
                    'font-weight': '600',
                    color: medianDiff()! >= 0 ? '#10B981' : '#EF4444',
                    'margin-left': '8px',
                  }}
                >
                  ({formatPercentage(medianDiffPercent()!)})
                </span>
              </div>
            </Show>

            {/* Regional Comparison */}
            <Show when={regionalComparison() && regionalComparison()!.length > 1}>
              <div style={styles.comparison()}>
                <For each={regionalComparison()}>
                  {(comp) => (
                    <div style={styles.comparisonRow()}>
                      <span style={styles.comparisonLabel()}>{comp.label}</span>
                      <div style={styles.comparisonValue()}>
                        <span style={styles.comparisonMedian()}>{formatCurrency(comp.median)}</span>
                        <span style={styles.comparisonDiff(comp.diff >= 0)}>
                          {formatPercentage(comp.diffPercent)}
                        </span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Show>
      </Show>
    </div>
  );
};

export default SalaryComparison;
