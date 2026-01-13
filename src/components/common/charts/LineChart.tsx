/**
 * LineChart - Reusable D3-based line/area chart
 *
 * Features:
 * - Smooth curves with curveMonotoneX
 * - Gradient area fill
 * - Glow filter on hover
 * - Portal-based tooltips with collision detection
 * - Responsive viewBox
 * - Theme-agnostic (accepts ChartTheme)
 * - Support for overlay lines (market comparison, etc.)
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createMemo, For, Show, JSX } from 'solid-js';
import {
  scaleTime,
  scaleLinear,
  extent,
  max,
  area,
  line,
  curveMonotoneX,
  curveLinear,
  timeFormat,
} from 'd3';
import { ChartTooltip, calculateTooltipPosition } from './ChartTooltip';
import {
  ChartTheme,
  LineChartDataPoint,
  LineChartConfig,
  OverlayLine,
  TooltipPosition,
} from './types';
import { hexToRgba } from '../../../theme/semantic-colors';

interface LineChartProps<T = unknown> {
  data: LineChartDataPoint<T>[];
  theme: ChartTheme;
  config?: LineChartConfig;
  overlayLines?: OverlayLine[];
  onPointClick?: (point: LineChartDataPoint<T>, index: number) => void;
  renderTooltip?: (point: LineChartDataPoint<T>) => JSX.Element;
  id?: string; // Unique ID for gradients/filters
}

const defaultConfig: Required<LineChartConfig> = {
  width: 800,
  height: 300,
  margin: { top: 20, right: 30, bottom: 40, left: 60 },
  showArea: true,
  showPoints: true,
  showGrid: true,
  curveSmooth: true,
  yAxisLabel: '',
  xAxisLabel: '',
  formatXTick: (v) => (v instanceof Date ? timeFormat('%b %d')(v) : String(v)),
  formatYTick: (v) => String(v),
  lineColor: '',
  areaGradientOpacity: [0.4, 0.05],
};

export function LineChart<T = unknown>(props: LineChartProps<T>) {
  const config = () => ({ ...defaultConfig, ...props.config });
  const chartId = () => props.id || 'line-chart-' + Math.random().toString(36).slice(2, 11);

  const [hoveredPoint, setHoveredPoint] = createSignal<number | null>(null);
  const [tooltipPos, setTooltipPos] = createSignal<TooltipPosition>({ x: 0, y: 0, isBelow: false });

  const width = () => config().width;
  const height = () => config().height;
  const margin = () => config().margin;
  const chartWidth = () => width() - margin().left - margin().right;
  const chartHeight = () => height() - margin().top - margin().bottom;
  const lineColor = () => config().lineColor || props.theme.colors.primary;

  // Scales
  const xScale = createMemo(() => {
    const data = props.data;
    if (data.length === 0)
      return scaleTime().domain([new Date(), new Date()]).range([0, chartWidth()]);

    const isDate = data[0].x instanceof Date;
    if (isDate) {
      return scaleTime()
        .domain(extent(data, (d) => d.x as Date) as [Date, Date])
        .range([0, chartWidth()]);
    } else {
      return scaleLinear()
        .domain(extent(data, (d) => d.x as number) as [number, number])
        .range([0, chartWidth()]);
    }
  });

  const yScale = createMemo(() => {
    const maxY = max(props.data, (d) => d.y) || 100;
    return scaleLinear()
      .domain([0, maxY * 1.1])
      .range([chartHeight(), 0])
      .nice();
  });

  // Area generator
  const areaGenerator = createMemo(() => {
    const curve = config().curveSmooth ? curveMonotoneX : curveLinear;
    return area<LineChartDataPoint>()
      .x((d) => xScale()(d.x as any))
      .y0(chartHeight())
      .y1((d) => yScale()(d.y))
      .curve(curve);
  });

  // Line generator (for stroke)
  const lineGenerator = createMemo(() => {
    const curve = config().curveSmooth ? curveMonotoneX : curveLinear;
    return line<LineChartDataPoint>()
      .x((d) => xScale()(d.x as any))
      .y((d) => yScale()(d.y))
      .curve(curve);
  });

  const areaPath = createMemo(() => areaGenerator()(props.data) || '');
  const linePath = createMemo(() => lineGenerator()(props.data) || '');
  const yTicks = createMemo(() => yScale().ticks(5));

  const xTicks = createMemo(() => {
    const data = props.data;
    if (data.length === 0) return [];
    const stride = Math.ceil(data.length / 8);
    return data.filter((_, i) => i % stride === 0 || i === data.length - 1);
  });

  const handlePointHover = (index: number, event: MouseEvent) => {
    setHoveredPoint(index);
    setTooltipPos(calculateTooltipPosition(event));
  };

  const hoveredData = createMemo(() => {
    const idx = hoveredPoint();
    return idx !== null ? props.data[idx] : null;
  });

  // Default tooltip content
  const defaultTooltipContent = (point: LineChartDataPoint) => (
    <>
      <div
        style={{
          'font-size': '11px',
          color: props.theme.colors.textMuted,
          'margin-bottom': '2px',
        }}
      >
        {point.label || config().formatXTick(point.x)}
      </div>
      <div
        style={{
          'font-size': '16px',
          'font-weight': '600',
          color: lineColor(),
        }}
      >
        {config().formatYTick(point.y)}
      </div>
    </>
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${width()} ${height()}`}
        style={{ 'max-width': '100%', height: 'auto' }}
        role="img"
        aria-label="Line chart"
      >
        <defs>
          {/* Gradient for area fill */}
          <linearGradient id={`${chartId()}-gradient`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              stop-color={lineColor()}
              stop-opacity={config().areaGradientOpacity[0]}
            />
            <stop
              offset="100%"
              stop-color={lineColor()}
              stop-opacity={config().areaGradientOpacity[1]}
            />
          </linearGradient>

          {/* Glow filter for hover */}
          <filter id={`${chartId()}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${margin().left}, ${margin().top})`}>
          {/* Y-axis grid lines */}
          <Show when={config().showGrid}>
            <For each={yTicks()}>
              {(tick) => (
                <line
                  x1={0}
                  y1={yScale()(tick)}
                  x2={chartWidth()}
                  y2={yScale()(tick)}
                  stroke={hexToRgba(props.theme.colors.border, 0.1)}
                  stroke-width="1"
                />
              )}
            </For>
          </Show>

          {/* Y-axis labels */}
          <For each={yTicks()}>
            {(tick) => (
              <text
                x={-10}
                y={yScale()(tick)}
                text-anchor="end"
                dominant-baseline="middle"
                fill={props.theme.colors.textMuted}
                font-size="11"
                font-family={props.theme.fonts.body}
              >
                {config().formatYTick(tick)}
              </text>
            )}
          </For>

          {/* X-axis line */}
          <line
            x1={0}
            y1={chartHeight()}
            x2={chartWidth()}
            y2={chartHeight()}
            stroke={hexToRgba(props.theme.colors.border, 0.15)}
            stroke-width="1.5"
          />

          {/* X-axis labels */}
          <For each={xTicks()}>
            {(point) => (
              <text
                x={xScale()(point.x as any)}
                y={chartHeight() + 20}
                text-anchor="middle"
                fill={props.theme.colors.textMuted}
                font-size="11"
                font-family={props.theme.fonts.body}
              >
                {point.label || config().formatXTick(point.x)}
              </text>
            )}
          </For>

          {/* Overlay lines (e.g., market comparison) */}
          <For each={props.overlayLines || []}>
            {(overlay) => {
              const overlayPath = createMemo(() => {
                const gen = line<LineChartDataPoint>()
                  .x((d) => xScale()(d.x as any))
                  .y((d) => yScale()(d.y))
                  .curve(config().curveSmooth ? curveMonotoneX : curveLinear);
                return gen(overlay.data) || '';
              });

              return (
                <path
                  d={overlayPath()}
                  fill="none"
                  stroke={overlay.color}
                  stroke-width={overlay.strokeWidth || 1.5}
                  stroke-dasharray={overlay.strokeDasharray}
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              );
            }}
          </For>

          {/* Area fill */}
          <Show when={config().showArea}>
            <path
              d={areaPath()}
              fill={`url(#${chartId()}-gradient)`}
              style={{ transition: `d ${props.theme.animations.normal}` }}
            />
          </Show>

          {/* Line stroke */}
          <path
            d={linePath()}
            fill="none"
            stroke={lineColor()}
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            style={{ transition: `d ${props.theme.animations.normal}` }}
          />

          {/* Data points */}
          <Show when={config().showPoints}>
            <For each={props.data}>
              {(point, index) => {
                const isHovered = () => hoveredPoint() === index();
                const x = () => xScale()(point.x as any);
                const y = () => yScale()(point.y);

                return (
                  <g
                    style={{ cursor: point.y > 0 ? 'pointer' : 'default' }}
                    onClick={() => point.y > 0 && props.onPointClick?.(point, index())}
                    onMouseEnter={(e) => point.y > 0 && handlePointHover(index(), e)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Larger invisible hitbox */}
                    <circle cx={x()} cy={y()} r={12} fill="transparent" stroke="none" />

                    {/* Glow effect when hovered */}
                    <Show when={isHovered()}>
                      <circle
                        cx={x()}
                        cy={y()}
                        r={6}
                        fill={lineColor()}
                        opacity={0.3}
                        filter={`url(#${chartId()}-glow)`}
                      />
                    </Show>

                    {/* Actual point */}
                    <circle
                      cx={x()}
                      cy={y()}
                      r={isHovered() ? 5 : 4}
                      fill={point.y > 0 ? lineColor() : hexToRgba(props.theme.colors.text, 0.2)}
                      stroke={props.theme.colors.background}
                      stroke-width="2"
                      style={{
                        transition: `r ${props.theme.animations.fast}, fill ${props.theme.animations.fast}`,
                      }}
                    />
                  </g>
                );
              }}
            </For>
          </Show>

          {/* Y-axis label */}
          <Show when={config().yAxisLabel}>
            <text
              x={-chartHeight() / 2}
              y={-35}
              text-anchor="middle"
              transform="rotate(-90)"
              fill={props.theme.colors.textMuted}
              font-size="12"
              font-family={props.theme.fonts.body}
              font-weight="500"
            >
              {config().yAxisLabel}
            </text>
          </Show>
        </g>
      </svg>

      {/* Tooltip */}
      <ChartTooltip
        show={hoveredData() !== null}
        position={tooltipPos()}
        theme={props.theme}
        accentColor={lineColor()}
      >
        {hoveredData() &&
          (props.renderTooltip
            ? props.renderTooltip(hoveredData()!)
            : defaultTooltipContent(hoveredData()!))}
      </ChartTooltip>
    </div>
  );
}

export default LineChart;
