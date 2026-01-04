/**
 * ActivityTimelineChart - Area chart showing application activity over time
 *
 * THEME STRATEGY:
 * This component uses a dual-source theme approach to balance flexibility and completeness:
 *
 * 1. Base Theme (useTenureTheme): Provides full theme structure from TenureThemeProvider context
 *    - Includes semantic colors (success, warning, error, etc.)
 *    - Includes status colors (applied, screening, etc.)
 *    - Includes trend colors (up/down indicators)
 *    - Includes animations, fonts, spacing, etc.
 *
 * 2. Dynamic Color Override (currentTheme prop): Optional prop for RIASEC-based primary color
 *    - Passed from TenureApp which derives colors from user's personality assessment
 *    - If provided, overrides theme.colors.primary for the chart line/gradient
 *    - Falls back to context theme if not provided
 *
 * This approach was chosen after encountering two issues:
 * - Using only the prop resulted in missing theme.trend/theme.semantic properties (partial theme)
 * - Using only the context resulted in losing dynamic RIASEC colors from TenureApp
 * - Solution: Use context for structure, override primary color from prop
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, For, Show, createMemo } from 'solid-js';
import { Portal } from 'solid-js/web';
import { scaleTime, scaleLinear, max, area, curveMonotoneX, timeFormat } from 'd3';
import { useTenureTheme, TenureTheme } from '../../../TenureThemeProvider';
import { hexToRgba } from '../../../../../theme/semantic-colors';
import { TimeSeriesDataPoint } from '../trends-data';

interface ActivityTimelineChartProps {
  data: TimeSeriesDataPoint[];
  width?: number;
  height?: number;
  onDataPointClick?: (dataPoint: TimeSeriesDataPoint) => void;
  currentTheme?: () => { colors: { primary: string } };
}

export const ActivityTimelineChart: Component<ActivityTimelineChartProps> = (props) => {
  const width = () => props.width || 800;
  const height = () => props.height || 300;

  // THEME MERGING STRATEGY:
  // 1. Get full theme from TenureThemeProvider context (has all semantic/status/trend colors)
  const theme = useTenureTheme();

  // 2. Override primary color with RIASEC-based color from TenureApp if provided
  //    This ensures the chart line reflects the user's personality-based theme
  //    while still having access to the full theme structure for other elements
  const primaryColor = () => props.currentTheme?.().colors.primary || theme.colors.primary;

  const [hoveredPoint, setHoveredPoint] = createSignal<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = createSignal({ x: 0, y: 0, isBelow: false });
  let svgRef: SVGSVGElement | undefined;

  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = () => width() - margin.left - margin.right;
  const chartHeight = () => height() - margin.top - margin.bottom;

  // Scales
  const xScale = createMemo(() => {
    const data = props.data;
    if (data.length === 0)
      return scaleTime().domain([new Date(), new Date()]).range([0, chartWidth()]);

    return scaleTime()
      .domain([data[0].date, data[data.length - 1].date])
      .range([0, chartWidth()]);
  });

  const yScale = createMemo(() => {
    const maxCount = max(props.data, (d) => d.count) || 10;
    return scaleLinear()
      .domain([0, maxCount * 1.1]) // Add 10% padding
      .range([chartHeight(), 0])
      .nice();
  });

  // Area generator
  const areaGenerator = createMemo(() => {
    return area<TimeSeriesDataPoint>()
      .x((d) => xScale()(d.date))
      .y0(chartHeight())
      .y1((d) => yScale()(d.count))
      .curve(curveMonotoneX);
  });

  // Generate path
  const areaPath = createMemo(() => {
    const generator = areaGenerator();
    return generator(props.data) || '';
  });

  // Y-axis ticks
  const yTicks = createMemo(() => {
    const scale = yScale();
    return scale.ticks(5);
  });

  // X-axis ticks (show subset for readability)
  const xTicks = createMemo(() => {
    const data = props.data;
    if (data.length === 0) return [];

    // Show max 8 ticks
    const stride = Math.ceil(data.length / 8);
    return data.filter((_, i) => i % stride === 0 || i === data.length - 1);
  });

  const handlePointClick = (point: TimeSeriesDataPoint, index: number) => {
    setHoveredPoint(index);
    props.onDataPointClick?.(point);
  };

  const handlePointHover = (index: number, event: MouseEvent) => {
    setHoveredPoint(index);

    // Use the mouse position directly - cursor is on the point
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    // Tooltip dimensions
    const tooltipHeight = 80;
    const offset = 12;

    // Check if tooltip would overflow at top
    const spaceTop = mouseY;
    const isBelow = spaceTop < tooltipHeight + offset;

    // Position directly at cursor
    setTooltipPosition({
      x: mouseX,
      y: isBelow ? mouseY + offset : mouseY - offset,
      isBelow,
    });
  };

  const hoveredData = createMemo(() => {
    const idx = hoveredPoint();
    if (idx === null) return null;
    return props.data[idx];
  });

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${width()} ${height()}`}
        style={{ 'max-width': '100%', height: 'auto' }}
        role="img"
        aria-label="Application activity timeline chart"
      >
        <defs>
          {/* Gradient for area fill */}
          <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color={primaryColor()} stop-opacity="0.4" />
            <stop offset="100%" stop-color={primaryColor()} stop-opacity="0.05" />
          </linearGradient>

          {/* Glow filter for hover */}
          <filter id="point-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Y-axis grid lines */}
          <For each={yTicks()}>
            {(tick) => (
              <line
                x1={0}
                y1={yScale()(tick)}
                x2={chartWidth()}
                y2={yScale()(tick)}
                stroke={hexToRgba(theme.colors.border, 0.1)}
                stroke-width="1"
              />
            )}
          </For>

          {/* Y-axis labels */}
          <For each={yTicks()}>
            {(tick) => (
              <text
                x={-10}
                y={yScale()(tick)}
                text-anchor="end"
                dominant-baseline="middle"
                fill={theme.colors.textMuted}
                font-size="11"
                font-family={theme.fonts.body}
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
            stroke={hexToRgba(theme.colors.border, 0.15)}
            stroke-width="1.5"
          />

          {/* X-axis labels */}
          <For each={xTicks()}>
            {(point) => (
              <text
                x={xScale()(point.date)}
                y={chartHeight() + 20}
                text-anchor="middle"
                fill={theme.colors.textMuted}
                font-size="11"
                font-family={theme.fonts.body}
              >
                {point.label}
              </text>
            )}
          </For>

          {/* Area fill */}
          <path
            d={areaPath()}
            fill="url(#area-gradient)"
            style={{
              transition: `d ${theme.animations.normal}`,
            }}
          />

          {/* Line stroke */}
          <path
            d={areaPath().replace(/L.*Z/, 'L' + chartWidth() + ',' + chartHeight())} // Remove bottom line
            fill="none"
            stroke={primaryColor()}
            stroke-width="2.5"
            stroke-linecap="round"
            style={{
              transition: `d ${theme.animations.normal}`,
            }}
          />

          {/* Data points */}
          <For each={props.data}>
            {(point, index) => {
              const isHovered = hoveredPoint() === index();
              const x = xScale()(point.date);
              const y = yScale()(point.count);

              return (
                <g
                  style={{ cursor: point.count > 0 ? 'pointer' : 'default' }}
                  onClick={() => point.count > 0 && handlePointClick(point, index())}
                  onMouseEnter={(e) => point.count > 0 && handlePointHover(index(), e)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Larger invisible hitbox */}
                  <circle cx={x} cy={y} r={12} fill="transparent" stroke="none" />

                  {/* Glow effect when hovered */}
                  <Show when={isHovered}>
                    <circle
                      cx={x}
                      cy={y}
                      r={6}
                      fill={primaryColor()}
                      opacity={0.3}
                      filter="url(#point-glow)"
                    />
                  </Show>

                  {/* Actual point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 5 : 4}
                    fill={point.count > 0 ? primaryColor() : hexToRgba(theme.colors.text, 0.2)}
                    stroke={theme.colors.background}
                    stroke-width="2"
                    style={{
                      transition: `r ${theme.animations.fast}, fill ${theme.animations.fast}`,
                    }}
                  />
                </g>
              );
            }}
          </For>

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
            Applications
          </text>
        </g>
      </svg>

      {/* Tooltip - rendered via Portal to escape any transform containers */}
      <Portal>
        <Show when={hoveredData() !== null}>
          <div
            style={{
              position: 'fixed',
              left: `${tooltipPosition().x}px`,
              top: `${tooltipPosition().y}px`,
              transform: tooltipPosition().isBelow
                ? 'translate(-50%, 0%)'
                : 'translate(-50%, -100%)',
              padding: '8px 12px',
              background: 'rgba(0, 0, 0, 0.9)',
              border: `1px solid ${theme.status.applied.text}40`,
              'border-radius': '6px',
              'pointer-events': 'none',
              'z-index': 10000,
              'white-space': 'nowrap',
            }}
          >
            <div
              style={{
                'font-size': '11px',
                'font-family': theme.fonts.body,
                color: theme.colors.textMuted,
                'margin-bottom': '2px',
              }}
            >
              {hoveredData()!.label}
            </div>
            <div
              style={{
                'font-size': '16px',
                'font-family': theme.fonts.heading,
                'font-weight': '600',
                color: primaryColor(),
              }}
            >
              {hoveredData()!.count} {hoveredData()!.count === 1 ? 'application' : 'applications'}
            </div>
          </div>
        </Show>
      </Portal>
    </div>
  );
};

export default ActivityTimelineChart;
