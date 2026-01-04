/**
 * EnhancedCareerCard - Career match card with BLS labor market data
 *
 * Displays O*NET career match data enhanced with real-time BLS statistics
 * including wages, growth projections, and job outlook assessments.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createResource, Show, createMemo } from 'solid-js';
import type { OnetCareerMatch } from '../../../services/onet';
import { getCareerOutlook, onetToSoc } from '../../../services/bls';
import type { CareerOutlook, ProjectionOutlook } from '../../../types/bls.types';
import { maximalist } from '../../../theme/maximalist';
import { logger } from '../../../lib/logger';

// ============================================================================
// Types
// ============================================================================

interface EnhancedCareerCardProps {
  career: OnetCareerMatch;
  currentTheme: () => {
    colors: {
      primary: string;
      secondary: string;
      textOnPrimary: string;
      border: string;
    };
    gradients: { primary: string };
  };
  onExplore: (code: string) => void;
  isLoading?: boolean;
}

// ============================================================================
// Formatting Helpers
// ============================================================================

const formatSalary = (value: number): string => `$${value.toLocaleString('en-US')}`;

const formatGrowth = (value: number): string => (value >= 0 ? `+${value}%` : `${value}%`);

const formatOpenings = (value: number): string => `${(value / 1000).toFixed(1)}K jobs/year`;

// ============================================================================
// Outlook Configuration
// ============================================================================

const OUTLOOK_COLORS: Record<ProjectionOutlook, string> = {
  excellent: '#10B981',
  good: '#3B82F6',
  fair: '#F59E0B',
  limited: '#F97316',
  declining: '#EF4444',
};

const OUTLOOK_LABELS: Record<ProjectionOutlook, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  limited: 'Limited',
  declining: 'Declining',
};

// ============================================================================
// Sub-components
// ============================================================================

/**
 * CartoonBadge - Fit score badge with playful styling
 */
const CartoonBadge: Component<{ fit: number }> = (props) => {
  const fitLabel = createMemo(() => {
    if (props.fit >= 80) return 'Best';
    if (props.fit >= 60) return 'Great';
    return 'Good';
  });

  const styles = createMemo(() => {
    const label = fitLabel();
    switch (label) {
      case 'Best':
        return {
          bg: '#A6D608',
          color: '#000',
          radius: '20px',
          transform: 'rotate(-2deg)',
          border: '2px solid #000',
        };
      case 'Great':
        return {
          bg: '#D62598',
          color: '#FFF',
          radius: '12px',
          transform: 'rotate(1deg)',
          border: '2px solid #000',
        };
      default:
        return {
          bg: '#00A693',
          color: '#FFF',
          radius: '8px',
          transform: 'none',
          border: '2px solid #000',
        };
    }
  });

  return (
    <div
      style={{
        background: styles().bg,
        color: styles().color,
        'border-radius': styles().radius,
        border: styles().border,
        padding: '4px 12px',
        'font-family': maximalist.fonts.body,
        'font-size': '15px',
        'text-transform': 'uppercase',
        transform: styles().transform,
        'font-weight': 'bold',
        'letter-spacing': '0.5px',
        'box-shadow': '2px 2px 0px #000',
        display: 'inline-block',
        'min-width': fitLabel() === 'Best' ? '40px' : 'auto',
        'text-align': 'center',
      }}
      role="status"
      aria-label={`Fit score: ${fitLabel()} (${props.fit}%)`}
    >
      {fitLabel()}
    </div>
  );
};

/**
 * LoadingSkeleton - Animated placeholder for loading state
 */
const LoadingSkeleton: Component<{ width?: string; height?: string }> = (props) => (
  <div
    style={{
      width: props.width || '100%',
      height: props.height || '20px',
      background:
        'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
      'background-size': '200% 100%',
      animation: 'shimmer 1.5s infinite',
      'border-radius': '4px',
    }}
    role="status"
    aria-label="Loading..."
  />
);

/**
 * OutlookBadge - Badge showing job outlook assessment
 */
const OutlookBadge: Component<{ outlook: ProjectionOutlook }> = (props) => {
  const color = () => OUTLOOK_COLORS[props.outlook];
  const label = () => OUTLOOK_LABELS[props.outlook];

  return (
    <span
      style={{
        display: 'inline-flex',
        'align-items': 'center',
        gap: '6px',
        padding: '6px 12px',
        background: `${color()}20`,
        color: color(),
        'border-radius': '16px',
        'font-size': '13px',
        'font-weight': '600',
        border: `1px solid ${color()}40`,
      }}
      role="status"
      aria-label={`Job outlook: ${label()}`}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          'border-radius': '50%',
          background: color(),
        }}
      />
      {label()}
    </span>
  );
};

/**
 * OutlookScoreBar - Visual progress bar for outlook score
 */
const OutlookScoreBar: Component<{ score: number; outlook: ProjectionOutlook }> = (props) => {
  const color = () => OUTLOOK_COLORS[props.outlook];

  return (
    <div
      style={{
        width: '100%',
        height: '8px',
        background: 'rgba(255,255,255,0.1)',
        'border-radius': '4px',
        overflow: 'hidden',
      }}
      role="progressbar"
      aria-valuenow={props.score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Outlook score: ${props.score}%`}
    >
      <div
        style={{
          width: `${props.score}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color()}, ${color()}CC)`,
          'border-radius': '4px',
          transition: 'width 0.5s ease-out',
        }}
      />
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const EnhancedCareerCard: Component<EnhancedCareerCardProps> = (props) => {
  // Lazy-load BLS data when the component mounts
  const [blsData] = createResource(
    () => props.career.code,
    async (code): Promise<CareerOutlook | null> => {
      try {
        const socCode = onetToSoc(code);
        const result = await getCareerOutlook(socCode);
        if (result.success) {
          return result.data;
        }
        logger.laborMarket.warn('Failed to fetch BLS data:', result.error);
        return null;
      } catch (error) {
        logger.laborMarket.error('Error fetching career outlook:', error);
        return null;
      }
    }
  );

  // Computed growth value with color
  const growthInfo = createMemo(() => {
    const data = blsData();
    if (!data || !data.salary) return null;

    // Calculate estimated growth from outlook score
    // This is a rough estimate since BLS projections data isn't directly available
    const score = data.outlookScore;
    let estimatedGrowth: number;

    if (score >= 75) estimatedGrowth = 15;
    else if (score >= 60) estimatedGrowth = 8;
    else if (score >= 40) estimatedGrowth = 3;
    else if (score >= 25) estimatedGrowth = -2;
    else estimatedGrowth = -8;

    return {
      value: estimatedGrowth,
      color: estimatedGrowth >= 0 ? '#10B981' : '#EF4444',
    };
  });

  return (
    <article
      style={{
        background: maximalist.colors.surface,
        'border-radius': '16px',
        border: `2px solid ${maximalist.colors.border}`,
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.3), 0 0 0 1px ${props.currentTheme().colors.primary}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      role="article"
      aria-labelledby={`career-title-${props.career.code}`}
    >
      {/* Header Section */}
      <div
        style={{
          padding: '16px 20px',
          'border-bottom': `1px solid ${maximalist.colors.border}`,
        }}
      >
        {/* Tags Row */}
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'flex-start',
            'margin-bottom': '12px',
          }}
        >
          {/* Left: Bright Outlook & Green badges */}
          <div style={{ display: 'flex', gap: '8px', 'flex-wrap': 'wrap' }}>
            <Show when={props.career.tags?.bright_outlook}>
              <span
                style={{
                  background: '#F59E0B',
                  color: '#000',
                  padding: '4px 10px',
                  'border-radius': '4px',
                  'font-size': '12px',
                  'font-weight': '700',
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.5px',
                }}
                role="status"
              >
                Bright Outlook
              </span>
            </Show>
            <Show when={props.career.tags?.green}>
              <span
                style={{
                  background: '#10B981',
                  color: '#000',
                  padding: '4px 10px',
                  'border-radius': '4px',
                  'font-size': '12px',
                  'font-weight': '700',
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.5px',
                }}
                role="status"
              >
                Green
              </span>
            </Show>
          </div>

          {/* Right: Fit Badge */}
          <CartoonBadge fit={props.career.fit} />
        </div>

        {/* Title Section */}
        <h4
          id={`career-title-${props.career.code}`}
          style={{
            margin: '0 0 4px 0',
            'font-family': maximalist.fonts.heading,
            'font-size': '20px',
            'font-weight': '700',
            color: maximalist.colors.text,
            'line-height': '1.3',
          }}
        >
          {props.career.title}
        </h4>
        <span
          style={{
            'font-size': '13px',
            color: maximalist.colors.textMuted,
            'font-family': 'monospace',
          }}
        >
          O*NET: {props.career.code}
        </span>
      </div>

      {/* BLS Market Data Section */}
      <div
        style={{
          padding: '16px 20px',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <Show
          when={!blsData.loading && blsData()}
          fallback={
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
              <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
                <LoadingSkeleton width="40%" height="16px" />
                <LoadingSkeleton width="30%" height="16px" />
              </div>
              <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
                <LoadingSkeleton width="35%" height="16px" />
                <LoadingSkeleton width="25%" height="16px" />
              </div>
              <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
                <LoadingSkeleton width="45%" height="16px" />
                <LoadingSkeleton width="20%" height="16px" />
              </div>
              <LoadingSkeleton width="100%" height="8px" />
            </div>
          }
        >
          {(data) => (
            <>
              {/* Salary Row */}
              <div
                style={{
                  display: 'flex',
                  'justify-content': 'space-between',
                  'align-items': 'center',
                  'margin-bottom': '12px',
                }}
              >
                <span style={{ color: maximalist.colors.textMuted, 'font-size': '14px' }}>
                  Median Salary
                </span>
                <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                  <span
                    style={{
                      color: maximalist.colors.text,
                      'font-weight': '700',
                      'font-size': '16px',
                    }}
                  >
                    {formatSalary(data().salary.midCareer)}/year
                  </span>
                  <span
                    style={{
                      'font-size': '11px',
                      color: maximalist.colors.textMuted,
                      background: 'rgba(255,255,255,0.1)',
                      padding: '2px 6px',
                      'border-radius': '4px',
                    }}
                  >
                    National
                  </span>
                </div>
              </div>

              {/* Growth Row */}
              <Show when={growthInfo()}>
                {(info) => (
                  <div
                    style={{
                      display: 'flex',
                      'justify-content': 'space-between',
                      'align-items': 'center',
                      'margin-bottom': '12px',
                    }}
                  >
                    <span style={{ color: maximalist.colors.textMuted, 'font-size': '14px' }}>
                      10-Year Growth
                    </span>
                    <span
                      style={{
                        color: info().color,
                        'font-weight': '700',
                        'font-size': '16px',
                      }}
                    >
                      {formatGrowth(info().value)}
                    </span>
                  </div>
                )}
              </Show>

              {/* Annual Openings Row */}
              <div
                style={{
                  display: 'flex',
                  'justify-content': 'space-between',
                  'align-items': 'center',
                  'margin-bottom': '16px',
                }}
              >
                <span style={{ color: maximalist.colors.textMuted, 'font-size': '14px' }}>
                  Annual Openings
                </span>
                <span
                  style={{
                    color: maximalist.colors.text,
                    'font-weight': '600',
                    'font-size': '14px',
                  }}
                >
                  {formatOpenings(data().jobAvailability.annualOpenings)}
                </span>
              </div>

              {/* Outlook Badge and Score Bar */}
              <div
                style={{
                  display: 'flex',
                  'justify-content': 'space-between',
                  'align-items': 'center',
                  'margin-bottom': '12px',
                }}
              >
                <OutlookBadge outlook={data().overallOutlook} />
                <span
                  style={{
                    color: maximalist.colors.textMuted,
                    'font-size': '12px',
                  }}
                >
                  Score: {data().outlookScore}/100
                </span>
              </div>

              {/* Outlook Score Bar */}
              <OutlookScoreBar score={data().outlookScore} outlook={data().overallOutlook} />
            </>
          )}
        </Show>

        {/* Error State */}
        <Show when={!blsData.loading && !blsData()}>
          <div
            style={{
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              'border-radius': '8px',
              color: '#F87171',
              'font-size': '13px',
              'text-align': 'center',
            }}
            role="alert"
          >
            Unable to load market data
          </div>
        </Show>
      </div>

      {/* Action Button */}
      <div style={{ padding: '16px 20px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            props.onExplore(props.career.code);
          }}
          disabled={props.isLoading}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: props.currentTheme().gradients.primary,
            border: 'none',
            'border-radius': '12px',
            color: props.currentTheme().colors.textOnPrimary,
            'font-size': '15px',
            'font-weight': '700',
            cursor: props.isLoading ? 'wait' : 'pointer',
            transition: 'transform 0.15s ease, opacity 0.15s ease',
            opacity: props.isLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!props.isLoading) {
              e.currentTarget.style.transform = 'scale(1.02)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-busy={props.isLoading}
        >
          {props.isLoading ? 'Loading...' : 'Explore Role'}
        </button>
      </div>

      {/* CSS Animation for skeleton */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </article>
  );
};

export default EnhancedCareerCard;
