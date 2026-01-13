/**
 * SeasonalInsightsModal - Detailed seasonal hiring insights and recommendations
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show } from 'solid-js';
import { useTenureTheme } from '../../../TenureThemeProvider';
import { getSeasonalScoreColor } from '../../../../../theme/semantic-colors';
import { FluidCard } from '../../ui';
import { SEASONAL_BENCHMARKS } from '../trends-benchmarks';

interface SeasonalInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const monthData = monthNames.map((name, index) => {
  const key = name.toLowerCase() as keyof typeof SEASONAL_BENCHMARKS.MONTHLY_SCORES;
  const score = SEASONAL_BENCHMARKS.MONTHLY_SCORES[key];

  let status: 'peak' | 'good' | 'moderate' | 'low';
  let advice: string;

  if (score >= 9) {
    status = 'peak';
    advice = 'Peak hiring season - maximize application volume (15-20 apps/week)';
  } else if (score >= 7) {
    status = 'good';
    advice = 'Strong hiring activity - maintain optimal pace (10-15 apps/week)';
  } else if (score >= 5) {
    status = 'moderate';
    advice = 'Moderate activity - focus on quality applications (8-12 apps/week)';
  } else {
    status = 'low';
    advice = 'Slow season - prioritize networking and skill-building (5-8 apps/week)';
  }

  return { name, score, status, advice, month: index };
});

export const SeasonalInsightsModal: Component<SeasonalInsightsModalProps> = (props) => {
  const theme = useTenureTheme();

  if (!props.isOpen) return null;

  const currentMonth = new Date().getMonth();

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          'backdrop-filter': 'blur(4px)',
          'z-index': 9998,
          animation: `fadeIn ${theme.animations.fast}`,
        }}
        onClick={props.onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          'z-index': 9999,
          width: '90%',
          'max-width': '900px',
          'max-height': '85vh',
          overflow: 'auto',
          animation: `slideUp ${theme.animations.normal}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <FluidCard
          variant="elevated"
          style={{
            padding: '32px',
            background: 'linear-gradient(145deg, rgba(15, 15, 22, 0.98), rgba(10, 10, 15, 0.98))',
          }}
        >
          {/* Header */}
          <div style={{ 'margin-bottom': '24px' }}>
            <div
              style={{
                display: 'flex',
                'justify-content': 'space-between',
                'align-items': 'flex-start',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: '0 0 8px',
                    'font-size': '24px',
                    'font-family': theme.fonts.heading,
                    'font-weight': '700',
                    color: theme.colors.text,
                  }}
                >
                  Seasonal Hiring Insights
                </h2>
                <p
                  style={{
                    margin: 0,
                    'font-size': '14px',
                    'font-family': theme.fonts.body,
                    color: theme.colors.textMuted,
                    'line-height': '1.5',
                  }}
                >
                  Industry data shows hiring activity varies significantly by month. Use these
                  insights to optimize your application timing and increase your success rate.
                </p>
              </div>
              <button
                onClick={props.onClose}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  'border-radius': '6px',
                  color: theme.colors.textMuted,
                  cursor: 'pointer',
                  transition: `all ${theme.animations.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Key Insights */}
          <div
            style={{
              display: 'grid',
              'grid-template-columns': 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              'margin-bottom': '32px',
            }}
          >
            <FluidCard variant="stat" style={{ padding: '16px' }}>
              <div style={{ 'margin-bottom': '8px' }}>
                <div
                  style={{
                    'font-size': '11px',
                    'font-family': theme.fonts.body,
                    color: theme.colors.textMuted,
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.5px',
                  }}
                >
                  Best Month
                </div>
                <div
                  style={{
                    'font-size': '20px',
                    'font-family': theme.fonts.heading,
                    'font-weight': '700',
                    color: theme.semantic.success.base,
                    'margin-top': '4px',
                  }}
                >
                  February
                </div>
              </div>
              <div
                style={{
                  'font-size': '12px',
                  'font-family': theme.fonts.body,
                  color: theme.colors.textMuted,
                  'line-height': '1.4',
                }}
              >
                All budgets finalized, high activity, low competition
              </div>
            </FluidCard>

            <FluidCard variant="stat" style={{ padding: '16px' }}>
              <div style={{ 'margin-bottom': '8px' }}>
                <div
                  style={{
                    'font-size': '11px',
                    'font-family': theme.fonts.body,
                    color: theme.colors.textMuted,
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.5px',
                  }}
                >
                  Worst Months
                </div>
                <div
                  style={{
                    'font-size': '20px',
                    'font-family': theme.fonts.heading,
                    'font-weight': '700',
                    color: theme.semantic.error.base,
                    'margin-top': '4px',
                  }}
                >
                  July & August
                </div>
              </div>
              <div
                style={{
                  'font-size': '12px',
                  'font-family': theme.fonts.body,
                  color: theme.colors.textMuted,
                  'line-height': '1.4',
                }}
              >
                40-60% lower activity, key decision-makers on vacation
              </div>
            </FluidCard>

            <FluidCard variant="stat" style={{ padding: '16px' }}>
              <div style={{ 'margin-bottom': '8px' }}>
                <div
                  style={{
                    'font-size': '11px',
                    'font-family': theme.fonts.body,
                    color: theme.colors.textMuted,
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.5px',
                  }}
                >
                  Peak Response Rate
                </div>
                <div
                  style={{
                    'font-size': '20px',
                    'font-family': theme.fonts.heading,
                    'font-weight': '700',
                    color: theme.semantic.info.base,
                    'margin-top': '4px',
                  }}
                >
                  +15-25%
                </div>
              </div>
              <div
                style={{
                  'font-size': '12px',
                  'font-family': theme.fonts.body,
                  color: theme.colors.textMuted,
                  'line-height': '1.4',
                }}
              >
                Higher response rates in Feb & Sep vs summer months
              </div>
            </FluidCard>
          </div>

          {/* Monthly Breakdown */}
          <div>
            <h3
              style={{
                margin: '0 0 16px',
                'font-size': '18px',
                'font-family': theme.fonts.heading,
                'font-weight': '600',
                color: theme.colors.text,
              }}
            >
              Month-by-Month Guide
            </h3>

            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
              <For each={monthData}>
                {(month) => {
                  const isCurrent = month.month === currentMonth;
                  return (
                    <div
                      style={{
                        display: 'flex',
                        'align-items': 'center',
                        gap: '16px',
                        padding: '12px 16px',
                        background: isCurrent
                          ? `${theme.colors.primary}15`
                          : 'rgba(255, 255, 255, 0.02)',
                        border: isCurrent
                          ? `1px solid ${theme.colors.primary}50`
                          : '1px solid rgba(255, 255, 255, 0.05)',
                        'border-radius': '8px',
                        transition: `all ${theme.animations.fast}`,
                      }}
                    >
                      {/* Month name */}
                      <div style={{ width: '100px', 'flex-shrink': 0 }}>
                        <div
                          style={{
                            'font-size': '14px',
                            'font-family': theme.fonts.body,
                            'font-weight': isCurrent ? '600' : '500',
                            color: theme.colors.text,
                          }}
                        >
                          {month.name}
                        </div>
                        <Show when={isCurrent}>
                          <div
                            style={{
                              'font-size': '10px',
                              'font-family': theme.fonts.body,
                              color: theme.colors.primary,
                              'margin-top': '2px',
                            }}
                          >
                            Current month
                          </div>
                        </Show>
                      </div>

                      {/* Score bar */}
                      <div style={{ flex: '0 0 120px' }}>
                        <div
                          style={{
                            height: '8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            'border-radius': '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${(month.score / 10) * 100}%`,
                              background: getSeasonalScoreColor(month.score),
                              'border-radius': '4px',
                              transition: `width ${theme.animations.slow}`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Score */}
                      <div
                        style={{
                          width: '40px',
                          'text-align': 'center',
                          'font-size': '16px',
                          'font-family': theme.fonts.heading,
                          'font-weight': '700',
                          color: getSeasonalScoreColor(month.score),
                        }}
                      >
                        {month.score}/10
                      </div>

                      {/* Advice */}
                      <div
                        style={{
                          flex: 1,
                          'font-size': '13px',
                          'font-family': theme.fonts.body,
                          color: theme.colors.textMuted,
                          'line-height': '1.4',
                        }}
                      >
                        {month.advice}
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>

          {/* Data Source */}
          <div
            style={{
              'margin-top': '24px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              'border-radius': '8px',
            }}
          >
            <div
              style={{
                'font-size': '11px',
                'font-family': theme.fonts.body,
                color: theme.colors.textMuted,
                'line-height': '1.5',
              }}
            >
              <strong>Data Sources:</strong> Bureau of Labor Statistics (BLS), Society for Human
              Resource Management (SHRM), and CareerPlug analysis of 10+ million applications.
              Seasonal patterns based on Fortune 500 hiring data 2019-2024.
            </div>
          </div>
        </FluidCard>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translate(-50%, -45%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        `}
      </style>
    </>
  );
};

export default SeasonalInsightsModal;
