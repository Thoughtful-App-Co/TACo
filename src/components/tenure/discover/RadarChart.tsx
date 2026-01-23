/**
 * RadarChart Component
 *
 * Displays RIASEC scores as an interactive hexagonal radar chart.
 * Shows all six dimensions with hover tooltips.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createMemo, createSignal, For, Show } from 'solid-js';
import { RiasecScoreWithDetails } from '../../../services/onet';
import { maximalist } from '../../../theme/maximalist';

interface RadarChartProps {
  scores: RiasecScoreWithDetails;
}

export const RadarChart: Component<RadarChartProps> = (props) => {
  const [hoveredPoint, setHoveredPoint] = createSignal<{
    x: number;
    y: number;
    label: string;
    score: number;
    color: string;
  } | null>(null);

  const dataPoints = createMemo(() => {
    if (!props.scores) return [];
    const order = [
      'realistic',
      'investigative',
      'artistic',
      'social',
      'enterprising',
      'conventional',
    ];
    const max = 40;
    const center = 150;
    const radius = 100;

    return order.map((key, i) => {
      const score = (props.scores as any)[key].score;
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const dist = (score / max) * radius;
      const x = center + Math.cos(angle) * dist;
      const y = center + Math.sin(angle) * dist;
      const color = (maximalist.riasec as any)[key];
      return { x, y, score, label: key, color };
    });
  });

  const polygonPoints = createMemo(() =>
    dataPoints()
      .map((p) => `${p.x},${p.y}`)
      .join(' ')
  );

  const axes = [
    { label: 'Realistic', color: maximalist.riasec!.realistic },
    { label: 'Investigative', color: maximalist.riasec!.investigative },
    { label: 'Artistic', color: maximalist.riasec!.artistic },
    { label: 'Social', color: maximalist.riasec!.social },
    { label: 'Enterprising', color: maximalist.riasec!.enterprising },
    { label: 'Conventional', color: maximalist.riasec!.conventional },
  ];

  return (
    <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto' }}>
      <svg width="300" height="300" viewBox="0 0 300 300">
        {/* Glow Filters */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid Background */}
        <For each={[0.25, 0.5, 0.75, 1]}>
          {(scale) => (
            <polygon
              points={Array.from({ length: 6 })
                .map((_, i) => {
                  const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                  const r = 100 * scale;
                  return `${150 + Math.cos(angle) * r},${150 + Math.sin(angle) * r}`;
                })
                .join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              stroke-width="1"
            />
          )}
        </For>

        {/* Axes Lines */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          return (
            <line
              x1="150"
              y1="150"
              x2={150 + Math.cos(angle) * 100}
              y2={150 + Math.sin(angle) * 100}
              stroke="rgba(255,255,255,0.3)"
              stroke-width="1"
            />
          );
        })}

        {/* Data Polygon */}
        <polygon
          points={polygonPoints()}
          fill="rgba(255,255,255,0.25)"
          stroke="rgba(255,255,255,0.9)"
          stroke-width="3"
          filter="url(#glow)"
        />

        {/* Interactive Points */}
        <For each={dataPoints()}>
          {(p) => (
            <circle
              cx={p.x}
              cy={p.y}
              r={6}
              fill={p.color}
              stroke={maximalist.colors.background}
              stroke-width="2"
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          )}
        </For>

        {/* Axis Labels */}
        {axes.map((axis, i) => {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          const x = 150 + Math.cos(angle) * 125;
          const y = 150 + Math.sin(angle) * 125;
          return (
            <g>
              <text
                x={x}
                y={y}
                fill={axis.color}
                stroke="rgba(0,0,0,0.6)"
                stroke-width="3"
                paint-order="stroke fill"
                text-anchor="middle"
                dominant-baseline="middle"
                font-family={maximalist.fonts.heading}
                font-size="15px"
                font-weight="bold"
                style={{ 'text-transform': 'uppercase', 'letter-spacing': '1px' }}
              >
                {axis.label[0]}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Popover Tooltip */}
      <Show when={hoveredPoint()}>
        <div
          style={{
            position: 'absolute',
            left: `${hoveredPoint()!.x}px`,
            top: `${hoveredPoint()!.y - 40}px`,
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            'backdrop-filter': 'blur(4px)',
            border: `1px solid ${hoveredPoint()!.color}`,
            padding: '8px 12px',
            'border-radius': '8px',
            color: 'white',
            'font-size': '15px',
            'z-index': 10,
            'pointer-events': 'none',
            'box-shadow': `0 0 10px ${hoveredPoint()!.color}40`,
            'white-space': 'nowrap',
          }}
        >
          <span
            style={{
              'font-weight': 'bold',
              'text-transform': 'capitalize',
              color: hoveredPoint()!.color,
            }}
          >
            {hoveredPoint()!.label}
          </span>
          <span style={{ 'margin-left': '8px', 'font-weight': 'bold' }}>
            {hoveredPoint()!.score}
          </span>
        </div>
      </Show>
    </div>
  );
};

export default RadarChart;
