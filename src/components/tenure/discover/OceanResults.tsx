/**
 * OceanResults Component
 *
 * Displays Big Five (OCEAN) personality assessment results.
 * Shows archetype + radar chart in two-column layout (matches RIASEC style).
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show, createSignal, createMemo } from 'solid-js';
import { maximalist } from '../../../theme/maximalist';
import { OceanProfile, OceanTrait } from '../../../schemas/ocean.schema';
import { getSortedTraits, clearOceanData, loadOceanArchetype } from '../services/ocean';
import { OCEAN_TRAIT_ORDER, oceanColors } from '../../tenure/pipeline/theme/ocean-colors';

export interface OceanResultsProps {
  profile: OceanProfile;
  onRetake: () => void;
  currentThemeGradient?: string;
  currentThemePrimary?: string;
}

// OCEAN Radar Chart Component (matches RIASEC style)
const OceanRadarChart: Component<{ profile: OceanProfile }> = (props) => {
  const [hoveredPoint, setHoveredPoint] = createSignal<{
    x: number;
    y: number;
    label: string;
    score: number;
    color: string;
  } | null>(null);

  const dataPoints = createMemo(() => {
    const order: OceanTrait[] = [
      'openness',
      'conscientiousness',
      'extraversion',
      'agreeableness',
      'neuroticism',
    ];
    const max = 100; // OCEAN uses percentage (0-100)
    const center = 150;
    const radius = 100;

    return order.map((trait, i) => {
      const score = props.profile[trait].percentage;
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const dist = (score / max) * radius;
      const x = center + Math.cos(angle) * dist;
      const y = center + Math.sin(angle) * dist;
      const color = oceanColors[trait];
      return { x, y, score, label: props.profile[trait].title, color };
    });
  });

  const polygonPoints = createMemo(() =>
    dataPoints()
      .map((p) => `${p.x},${p.y}`)
      .join(' ')
  );

  const axes = [
    { label: 'Openness', shortLabel: 'O', color: oceanColors.openness },
    { label: 'Conscientiousness', shortLabel: 'C', color: oceanColors.conscientiousness },
    { label: 'Extraversion', shortLabel: 'E', color: oceanColors.extraversion },
    { label: 'Agreeableness', shortLabel: 'A', color: oceanColors.agreeableness },
    { label: 'Neuroticism', shortLabel: 'N', color: oceanColors.neuroticism },
  ];

  return (
    <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto' }}>
      <svg width="300" height="300" viewBox="0 0 300 300">
        {/* Glow Filters */}
        <defs>
          <filter id="ocean-glow" x="-50%" y="-50%" width="200%" height="200%">
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
              points={Array.from({ length: 5 })
                .map((_, i) => {
                  const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                  const r = 100 * scale;
                  return `${150 + Math.cos(angle) * r},${150 + Math.sin(angle) * r}`;
                })
                .join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              stroke-width="1"
            />
          )}
        </For>

        {/* Axes Lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          return (
            <line
              x1="150"
              y1="150"
              x2={150 + Math.cos(angle) * 100}
              y2={150 + Math.sin(angle) * 100}
              stroke="rgba(255,255,255,0.1)"
              stroke-width="1"
            />
          );
        })}

        {/* Data Polygon - Purple/Vapor gradient fill */}
        <polygon
          points={polygonPoints()}
          fill="rgba(139, 92, 246, 0.2)"
          stroke="rgba(139, 92, 246, 1)"
          stroke-width="3"
          filter="url(#ocean-glow)"
        />

        {/* Interactive Points */}
        <For each={dataPoints()}>
          {(p) => (
            <circle
              cx={p.x}
              cy={p.y}
              r={6}
              fill={maximalist.colors.background}
              stroke={p.color}
              stroke-width="2"
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          )}
        </For>

        {/* Axis Labels */}
        {axes.map((axis, i) => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const x = 150 + Math.cos(angle) * 125;
          const y = 150 + Math.sin(angle) * 125;
          return (
            <g>
              <text
                x={x}
                y={y}
                fill={axis.color}
                text-anchor="middle"
                dominant-baseline="middle"
                font-family={maximalist.fonts.heading}
                font-size="15px"
                font-weight="bold"
                style={{ 'text-transform': 'uppercase', 'letter-spacing': '1px' }}
              >
                {axis.shortLabel}
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
            top: `${hoveredPoint()!.y - 50}px`,
            left: `${hoveredPoint()!.x}px`,
            transform: 'translateX(-50%)',
            background: maximalist.colors.surface,
            padding: '12px 16px',
            'border-radius': maximalist.radii.md,
            border: `2px solid ${hoveredPoint()!.color}`,
            'box-shadow': '0 8px 24px rgba(0,0,0,0.4)',
            'pointer-events': 'none',
            'z-index': 1000,
          }}
        >
          <div
            style={{
              'font-weight': '700',
              'font-size': '14px',
              color: hoveredPoint()!.color,
              'margin-bottom': '4px',
              'text-transform': 'capitalize',
            }}
          >
            {hoveredPoint()!.label}
          </div>
          <div
            style={{
              'font-size': '20px',
              'font-weight': 'bold',
              color: maximalist.colors.text,
            }}
          >
            {Math.round(hoveredPoint()!.score)}%
          </div>
        </div>
      </Show>
    </div>
  );
};

export const OceanResults: Component<OceanResultsProps> = (props) => {
  const archetype = () => loadOceanArchetype();

  // Get dominant trait for dynamic coloring
  const dominantTrait = () => {
    const traits = OCEAN_TRAIT_ORDER;
    let highest: OceanTrait = 'openness';
    let highestScore = 0;

    traits.forEach((trait) => {
      if (props.profile[trait].percentage > highestScore) {
        highestScore = props.profile[trait].percentage;
        highest = trait;
      }
    });

    return highest;
  };

  const dominantColor = () => oceanColors[dominantTrait()];

  const handleRetake = () => {
    if (
      confirm(
        'Are you sure you want to retake the Big Five assessment? Your current results will be cleared.'
      )
    ) {
      clearOceanData();
      props.onRetake();
    }
  };

  return (
    <div
      style={{
        'max-width': '1000px',
        margin: '0 auto',
        'text-align': 'left',
      }}
    >
      {/* Archetype Hero Section - Two Column Layout (matches RIASEC) */}
      <Show when={archetype()}>
        <div
          class="archetype-hero-section"
          style={{
            background: `linear-gradient(180deg, ${maximalist.colors.surface} 0%, rgba(30, 30, 30, 0) 100%)`,
            'border-radius': maximalist.radii.lg,
            padding: '40px',
            'margin-bottom': '40px',
            position: 'relative',
            overflow: 'hidden',
            'box-shadow': '0 16px 48px rgba(139, 92, 246, 0.3)',
            border: `1px solid ${maximalist.colors.border}`,
          }}
        >
          <div
            class="archetype-hero-grid"
            style={{
              display: 'grid',
              'grid-template-columns': '300px 1fr',
              gap: '40px',
              'align-items': 'center',
            }}
          >
            {/* Left Column: Radar Chart */}
            <div class="radar-column" style={{ 'flex-shrink': 0 }}>
              <OceanRadarChart profile={props.profile} />
            </div>

            {/* Right Column: Archetype Info */}
            <div class="archetype-info-column" style={{ 'text-align': 'left' }}>
              <h2
                style={{
                  color: dominantColor(),
                  'font-size': '15px',
                  'text-transform': 'uppercase',
                  'letter-spacing': '2px',
                  'margin-bottom': '8px',
                  'font-weight': '600',
                }}
              >
                Personality Profile
              </h2>

              <h1
                style={{
                  'font-family': maximalist.fonts.heading,
                  'font-size': '48px',
                  'margin-bottom': '16px',
                  'font-weight': '700',
                  color: 'white',
                  'line-height': '1.1',
                }}
              >
                {archetype()!.title}
              </h1>

              <p
                style={{
                  color: maximalist.colors.text,
                  'font-size': '18px',
                  'line-height': '1.6',
                  margin: 0,
                }}
              >
                {archetype()!.description}
              </p>
            </div>
          </div>
        </div>
      </Show>

      {/* Trait Breakdown */}
      <h3
        style={{
          'font-family': maximalist.fonts.heading,
          'font-size': '32px',
          'margin-bottom': '24px',
          color: maximalist.colors.text,
        }}
      >
        Full Profile Breakdown
      </h3>

      <div
        style={{
          display: 'grid',
          gap: '24px',
          'margin-bottom': '48px',
        }}
      >
        <For each={OCEAN_TRAIT_ORDER}>
          {(trait) => {
            const traitScore = props.profile[trait];
            const color = oceanColors[trait];

            return (
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  padding: '24px',
                  'border-radius': maximalist.radii.lg,
                  border: `1px solid ${color}40`,
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.transform = 'translateX(0)';
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'align-items': 'center',
                    'margin-bottom': '16px',
                  }}
                >
                  <h4
                    style={{
                      'font-size': '20px',
                      'font-weight': '700',
                      color: color,
                      margin: 0,
                      'font-family': maximalist.fonts.heading,
                      'text-transform': 'uppercase',
                      'letter-spacing': '1px',
                    }}
                  >
                    {traitScore.title}
                  </h4>
                  <div
                    style={{
                      'font-size': '24px',
                      'font-weight': 'bold',
                      color: 'white',
                    }}
                  >
                    {Math.round(traitScore.percentage)}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    height: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    'border-radius': '4px',
                    'margin-bottom': '12px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${traitScore.percentage}%`,
                      height: '100%',
                      background: color,
                      'box-shadow': `0 0 10px ${color}`,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>

                {/* Level Badge */}
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    'border-radius': maximalist.radii.sm,
                    background: `${color}20`,
                    color: color,
                    'font-size': '13px',
                    'font-weight': '600',
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.5px',
                    'margin-bottom': '12px',
                  }}
                >
                  {traitScore.level} Level
                </div>

                {/* Description */}
                <p
                  style={{
                    color: maximalist.colors.textMuted,
                    'font-size': '15px',
                    'line-height': '1.6',
                    margin: 0,
                  }}
                >
                  {traitScore.description}
                </p>
              </div>
            );
          }}
        </For>
      </div>

      {/* Retake Button */}
      <div style={{ 'text-align': 'center', 'margin-top': '48px' }}>
        <button
          onClick={handleRetake}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: `1px solid ${maximalist.colors.border}`,
            'border-radius': maximalist.radii.md,
            color: maximalist.colors.textMuted,
            'font-size': '17px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            'font-family': maximalist.fonts.body,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 1)';
            e.currentTarget.style.color = 'rgba(139, 92, 246, 1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = maximalist.colors.border;
            e.currentTarget.style.color = maximalist.colors.textMuted;
          }}
        >
          Retake Assessment
        </button>
      </div>
    </div>
  );
};
