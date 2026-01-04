/**
 * TrendsHeroChart - Unified hero chart with toggle between Timeline and Velocity views
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, For, Show } from 'solid-js';
import { FluidCard } from '../../ui';
import { ActivityTimelineChart } from './ActivityTimelineChart';
import { ApplicationVelocityChart } from './ApplicationVelocityChart';
import { InfoTooltip } from './InfoTooltip';
import { VelocityMetrics, TimeSeriesDataPoint } from '../trends-data';

type ChartView = 'timeline' | 'velocity';

interface TrendsHeroChartProps {
  timeSeriesData: TimeSeriesDataPoint[];
  velocityMetrics: VelocityMetrics;
  currentTheme: () => any;
}

export const TrendsHeroChart: Component<TrendsHeroChartProps> = (props) => {
  const theme = () => props.currentTheme();
  const [activeView, setActiveView] = createSignal<ChartView>('timeline');

  const views = [
    {
      id: 'timeline' as ChartView,
      label: 'Activity Timeline',
      description: 'Applications over time',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      id: 'velocity' as ChartView,
      label: 'Weekly Velocity',
      description: 'Apps per week trends',
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M3 3v18h18" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
      ),
    },
  ];

  return (
    <FluidCard
      variant="elevated"
      style={{
        padding: '0',
        overflow: 'hidden',
        background: 'linear-gradient(145deg, rgba(15, 15, 22, 0.98), rgba(10, 10, 15, 0.98))',
        position: 'relative',
      }}
    >
      {/* Ambient gradient background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '200px',
          background: `radial-gradient(ellipse at top, ${theme().colors.primary}25, transparent 70%)`,
          'pointer-events': 'none',
        }}
      />

      {/* Header with toggle */}
      <div
        style={{
          padding: '24px 32px',
          'border-bottom': '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          'z-index': 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
            'flex-wrap': 'wrap',
            gap: '16px',
          }}
        >
          {/* Title and description with info tooltip */}
          <div style={{ display: 'flex', 'align-items': 'flex-start', gap: '12px' }}>
            <div>
              <h3
                style={{
                  margin: '0 0 4px',
                  'font-size': '20px',
                  'font-family': theme().fonts.heading,
                  'font-weight': '700',
                  color: theme().colors.text,
                }}
              >
                {views.find((v) => v.id === activeView())?.label}
              </h3>
              <p
                style={{
                  margin: 0,
                  'font-size': '13px',
                  'font-family': theme().fonts.body,
                  color: theme().colors.textMuted,
                }}
              >
                {views.find((v) => v.id === activeView())?.description}
              </p>
            </div>
            <div style={{ 'margin-top': '2px' }}>
              <Show when={activeView() === 'timeline'}>
                <InfoTooltip
                  title="Activity Timeline"
                  description="Shows how many job applications you've submitted over time. Each point represents applications added on that day, week, or month depending on your selected time range."
                  importance="Tracking your application activity helps you spot patterns, maintain consistency, and identify slow periods where you need to increase effort."
                />
              </Show>
              <Show when={activeView() === 'velocity'}>
                <InfoTooltip
                  title="Weekly Velocity"
                  description="Measures your application rate in apps-per-week. The green shaded zone (10-15 apps/week) represents the optimal pace based on industry research. Higher isn't always better—quality matters more than quantity."
                  importance="Industry data shows that 10-15 tailored applications per week is the sweet spot. Below this, your search takes too long. Above this, you risk sacrificing quality for quantity, which reduces your success rate."
                />
              </Show>
            </div>
          </div>

          {/* View toggle buttons */}
          <div
            role="tablist"
            aria-label="Chart view selection"
            style={{
              display: 'inline-flex',
              gap: '6px',
              padding: '6px',
              background: 'rgba(0, 0, 0, 0.3)',
              'border-radius': '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <For each={views}>
              {(view) => (
                <button
                  role="tab"
                  aria-selected={activeView() === view.id}
                  aria-controls={`${view.id}-panel`}
                  onClick={() => setActiveView(view.id)}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    background:
                      activeView() === view.id
                        ? `linear-gradient(135deg, ${theme().colors.primary}dd, ${theme().colors.primary}aa)`
                        : 'transparent',
                    color: activeView() === view.id ? '#FFFFFF' : theme().colors.textMuted,
                    border:
                      activeView() === view.id
                        ? `1px solid ${theme().colors.primary}`
                        : '1px solid transparent',
                    'border-radius': '8px',
                    cursor: 'pointer',
                    'font-size': '14px',
                    'font-family': theme().fonts.body,
                    'font-weight': activeView() === view.id ? '600' : '500',
                    transition: `all ${theme().animations.fast}`,
                    'box-shadow':
                      activeView() === view.id
                        ? `inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 12px ${theme().colors.primary}50`
                        : 'none',
                    outline: 'none',
                    '-webkit-appearance': 'none',
                    '-moz-appearance': 'none',
                    appearance: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (activeView() !== view.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = theme().colors.text;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeView() !== view.id) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = theme().colors.textMuted;
                    }
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      opacity: activeView() === view.id ? 1 : 0.6,
                    }}
                  >
                    {view.icon}
                  </div>
                  <span style={{ color: 'inherit' }}>{view.label}</span>
                </button>
              )}
            </For>
          </div>
        </div>
      </div>

      {/* Chart container with transition */}
      <div
        style={{
          padding: '32px',
          position: 'relative',
          'min-height': '400px',
        }}
      >
        {/* Timeline View */}
        <Show when={activeView() === 'timeline'}>
          <div
            role="tabpanel"
            id="timeline-panel"
            aria-labelledby="timeline-tab"
            style={{
              animation: `fadeIn ${theme().animations.normal}`,
            }}
          >
            <ActivityTimelineChart data={props.timeSeriesData} currentTheme={props.currentTheme} />
          </div>
        </Show>

        {/* Velocity View */}
        <Show when={activeView() === 'velocity'}>
          <div
            role="tabpanel"
            id="velocity-panel"
            aria-labelledby="velocity-tab"
            style={{
              animation: `fadeIn ${theme().animations.normal}`,
            }}
          >
            <ApplicationVelocityChart
              velocityMetrics={props.velocityMetrics}
              currentTheme={props.currentTheme}
            />
          </div>
        </Show>
      </div>

      {/* Bottom accent bar */}
      <div
        style={{
          height: '3px',
          background: `linear-gradient(90deg, transparent, ${theme().colors.primary}99, transparent)`,
          'border-radius': '0 0 12px 12px',
        }}
      />

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* Force color inheritance for trend chart toggle buttons */
          button[role="tab"] * {
            color: inherit !important;
          }
          button[role="tab"] svg {
            stroke: currentColor !important;
          }
          
          /* Remove ALL browser default button styling */
          button[role="tab"] {
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          
          /* Remove autofill/autocomplete styling */
          button[role="tab"]:-webkit-autofill {
            -webkit-box-shadow: none !important;
            -webkit-text-fill-color: inherit !important;
          }
          
          /* Remove default focus outline */
          button[role="tab"]:focus {
            outline: none !important;
            box-shadow: none !important;
          }
          
          /* Only show focus ring when using keyboard navigation */
          button[role="tab"]:focus-visible {
            outline: 2px solid ${theme().colors.primary} !important;
            outline-offset: 2px;
          }
        `}
      </style>
    </FluidCard>
  );
};

export default TrendsHeroChart;
