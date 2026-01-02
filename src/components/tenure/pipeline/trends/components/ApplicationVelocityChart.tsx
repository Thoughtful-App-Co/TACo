/**
 * ApplicationVelocityChart - Bar chart with velocity trends and benchmark comparison
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, For, Show, createMemo } from 'solid-js';
import * as d3 from 'd3';
import { useTenureTheme } from '../../../TenureThemeProvider';
import { VelocityMetrics } from '../trends-data';
import { APPLICATION_BENCHMARKS, getVelocityStatus } from '../trends-benchmarks';
import { TrendUpIcon, TrendDownIcon } from 'solid-phosphor/bold';

interface ApplicationVelocityChartProps {
  velocityMetrics: VelocityMetrics;
  width?: number;
  height?: number;
}

export const ApplicationVelocityChart: Component<ApplicationVelocityChartProps> = (props) => {
  const width = () => props.width || 900;
  const height = () => props.height || 350;
  const theme = useTenureTheme();

  const [hoveredBar, setHoveredBar] = createSignal<number | null>(null);

  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const chartWidth = () => width() - margin.left - margin.right;
  const chartHeight = () => height() - margin.top - margin.bottom;

  // Optimal range from benchmarks
  const optimalRange = APPLICATION_BENCHMARKS.OPTIMAL_WEEKLY_APPLICATIONS;

  // Scales
  const xScale = createMemo(() => {
    const data = props.velocityMetrics.weeklyData;
    return d3
      .scaleBand()
      .domain(data.map((_, i) => i.toString()))
      .range([0, chartWidth()])
      .padding(0.2);
  });

  const yScale = createMemo(() => {
    const maxCount = d3.max(props.velocityMetrics.weeklyData, (d) => d.count) || 20;
    const maxWithOptimal = Math.max(maxCount, optimalRange.max * 1.2);
    return d3.scaleLinear().domain([0, maxWithOptimal]).range([chartHeight(), 0]).nice();
  });

  // Y-axis ticks
  const yTicks = createMemo(() => yScale().ticks(5));

  // Velocity status
  const velocityStatus = createMemo(() =>
    getVelocityStatus(props.velocityMetrics.applicationsPerWeek)
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Header with velocity status */}
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          'margin-bottom': '12px',
          padding: '0 12px',
        }}
      >
        <div>
          <div
            style={{
              'font-size': '13px',
              'font-family': theme.fonts.body,
              color: theme.colors.textMuted,
              'margin-bottom': '4px',
            }}
          >
            Average Velocity
          </div>
          <div
            style={{
              'font-size': '24px',
              'font-family': theme.fonts.heading,
              'font-weight': '700',
              color: velocityStatus().color,
            }}
          >
            {props.velocityMetrics.applicationsPerWeek.toFixed(1)}
            <span style={{ 'font-size': '14px', 'font-weight': '400' }}> apps/week</span>
          </div>
        </div>
        <div
          style={{
            padding: '6px 12px',
            background: `${velocityStatus().color}15`,
            border: `1px solid ${velocityStatus().color}40`,
            'border-radius': '6px',
            'font-size': '11px',
            'font-family': theme.fonts.body,
            color: velocityStatus().color,
            'font-weight': '600',
          }}
        >
          {velocityStatus().status.toUpperCase()}
        </div>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${width()} ${height()}`}
        style={{ 'max-width': '100%', height: 'auto' }}
        role="img"
        aria-label="Application velocity bar chart"
      >
        <defs>
          {/* Bar gradient */}
          <linearGradient id="bar-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color={theme.status.applied.text} stop-opacity="0.8" />
            <stop offset="100%" stop-color={theme.status.applied.text} stop-opacity="0.4" />
          </linearGradient>

          {/* Optimal zone gradient */}
          <linearGradient id="optimal-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color={theme.semantic.success.base} stop-opacity="0.15" />
            <stop offset="100%" stop-color={theme.semantic.success.base} stop-opacity="0.05" />
          </linearGradient>
        </defs>

        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Optimal range zone */}
          <rect
            x={0}
            y={yScale()(optimalRange.max)}
            width={chartWidth()}
            height={yScale()(optimalRange.min) - yScale()(optimalRange.max)}
            fill="url(#optimal-gradient)"
            stroke={theme.semantic.success.base}
            stroke-width="1"
            stroke-dasharray="4,4"
            opacity={0.6}
          />

          {/* Optimal range labels - left and right sides */}
          <text
            x={5}
            y={yScale()(optimalRange.max) - 8}
            text-anchor="start"
            fill={theme.semantic.success.base}
            font-size="12"
            font-family={theme.fonts.body}
            font-weight="600"
          >
            Optimal
          </text>
          <text
            x={chartWidth() - 5}
            y={yScale()(optimalRange.max) - 8}
            text-anchor="end"
            fill={theme.semantic.success.base}
            font-size="12"
            font-family={theme.fonts.body}
            font-weight="600"
          >
            Optimal
          </text>

          {/* Y-axis grid lines */}
          <For each={yTicks()}>
            {(tick) => (
              <line
                x1={0}
                y1={yScale()(tick)}
                x2={chartWidth()}
                y2={yScale()(tick)}
                stroke="rgba(255, 255, 255, 0.05)"
                stroke-width="1"
              />
            )}
          </For>

          {/* Y-axis labels */}
          <For each={yTicks()}>
            {(tick) => (
              <text
                x={-12}
                y={yScale()(tick)}
                text-anchor="end"
                dominant-baseline="middle"
                fill={theme.colors.textMuted}
                font-size="13"
                font-family={theme.fonts.body}
                font-weight="500"
              >
                {tick}
              </text>
            )}
          </For>

          {/* X-axis line */}
          <line
            x1={0}
            y1={chartHeight()}
            x2={chartWidth()}
            y2={chartHeight()}
            stroke="rgba(255, 255, 255, 0.1)"
            stroke-width="1.5"
          />

          {/* Bars */}
          <For each={props.velocityMetrics.weeklyData}>
            {(week, index) => {
              const isHovered = hoveredBar() === index();
              const x = xScale()(index().toString()) || 0;
              const barWidth = xScale().bandwidth();
              const barHeight = chartHeight() - yScale()(week.count);

              // Determine bar color based on velocity status
              let barColor = theme.status.applied.text;
              if (week.count < optimalRange.min) {
                barColor = theme.semantic.warning.base; // Yellow/orange for low
              } else if (week.count >= optimalRange.min && week.count <= optimalRange.max) {
                barColor = theme.semantic.success.base; // Green for optimal
              } else {
                barColor = theme.semantic.info.base; // Blue for high
              }

              return (
                <g
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredBar(index())}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Bar */}
                  <rect
                    x={x}
                    y={yScale()(week.count)}
                    width={barWidth}
                    height={barHeight}
                    fill={barColor}
                    opacity={isHovered ? 1 : 0.7}
                    rx="3"
                    style={{
                      transition: `opacity ${theme.animations.fast}, fill ${theme.animations.fast}`,
                    }}
                  />

                  {/* Count label on bar */}
                  <Show when={week.count > 0}>
                    <text
                      x={x + barWidth / 2}
                      y={yScale()(week.count) - 8}
                      text-anchor="middle"
                      fill={barColor}
                      font-size="14"
                      font-family={theme.fonts.body}
                      font-weight="700"
                      opacity={isHovered ? 1 : 0.9}
                    >
                      {week.count}
                    </text>
                  </Show>

                  {/* Week label */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight() + 20}
                    text-anchor="middle"
                    fill={theme.colors.textMuted}
                    font-size="12"
                    font-family={theme.fonts.body}
                  >
                    {week.label}
                  </text>
                </g>
              );
            }}
          </For>

          {/* Trend indicator arrow - positioned with more spacing */}
          <Show when={props.velocityMetrics.trend !== 'stable'}>
            <g transform={`translate(${chartWidth() - 60}, -25)`}>
              <rect
                x={0}
                y={0}
                width={55}
                height={22}
                rx="6"
                fill={
                  props.velocityMetrics.trend === 'up' ? theme.trend.up.bg : theme.trend.down.bg
                }
                stroke={
                  props.velocityMetrics.trend === 'up'
                    ? theme.trend.up.color
                    : theme.trend.down.color
                }
                stroke-width="1.5"
              />
              <foreignObject x={0} y={0} width={55} height={22}>
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    gap: '4px',
                    height: '100%',
                    color:
                      props.velocityMetrics.trend === 'up'
                        ? theme.trend.up.color
                        : theme.trend.down.color,
                    'font-size': '13px',
                    'font-family': theme.fonts.body,
                    'font-weight': '700',
                  }}
                >
                  {props.velocityMetrics.trend === 'up' ? (
                    <TrendUpIcon width={14} height={14} />
                  ) : (
                    <TrendDownIcon width={14} height={14} />
                  )}
                  {props.velocityMetrics.trend === 'up' ? 'Up' : 'Down'}
                </div>
              </foreignObject>
            </g>
          </Show>

          {/* Y-axis label */}
          <text
            x={-chartHeight() / 2}
            y={-35}
            text-anchor="middle"
            transform="rotate(-90)"
            fill={theme.colors.textMuted}
            font-size="12"
            font-family={theme.fonts.body}
            font-weight="500"
          >
            Applications per Week
          </text>
        </g>
      </svg>

      {/* Message below chart */}
      <div
        style={{
          'margin-top': '12px',
          padding: '8px 12px',
          background: `${velocityStatus().color}10`,
          border: `1px solid ${velocityStatus().color}30`,
          'border-radius': '6px',
          'font-size': '12px',
          'font-family': theme.fonts.body,
          color: theme.colors.text,
          'line-height': '1.5',
        }}
      >
        {velocityStatus().message}
      </div>
    </div>
  );
};

export default ApplicationVelocityChart;
