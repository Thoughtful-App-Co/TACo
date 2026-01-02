/**
 * JungianResults Component
 *
 * Display results from OEJTS Jungian Type assessment with 4-letter type,
 * dichotomy scores, cognitive functions, and temperament.
 *
 * Note: This uses Jungian typology terminology. The 4-letter type codes
 * originate from Carl Jung's work and are used in open-source implementations
 * like OEJTS. MBTI® is a registered trademark of The Myers-Briggs Company.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show, createSignal, createMemo } from 'solid-js';
import { maximalist } from '../../../theme/maximalist';
import { JungianProfile, DICHOTOMY_METADATA, JungianType } from '../../../schemas/jungian.schema';
import { getCognitiveFunctionDescription, getTemperamentDescription } from '../services/jungian';

// Jungian archetype names (avoiding MBTI® trademark terminology)
const JUNGIAN_ARCHETYPES: Record<JungianType, { name: string; motto: string }> = {
  INTJ: { name: 'The Mastermind', motto: 'Strategic visionary with unwavering determination' },
  INTP: { name: 'The Architect', motto: 'Analytical thinker building frameworks of understanding' },
  ENTJ: { name: 'The Commander', motto: 'Natural leader driven to organize and achieve' },
  ENTP: { name: 'The Inventor', motto: 'Innovative challenger exploring possibilities' },
  INFJ: { name: 'The Counselor', motto: 'Insightful guide with profound understanding' },
  INFP: { name: 'The Healer', motto: 'Idealistic dreamer seeking authenticity and meaning' },
  ENFJ: { name: 'The Teacher', motto: 'Charismatic mentor inspiring growth in others' },
  ENFP: { name: 'The Champion', motto: 'Enthusiastic catalyst sparking potential everywhere' },
  ISTJ: { name: 'The Inspector', motto: 'Reliable guardian of tradition and duty' },
  ISFJ: { name: 'The Protector', motto: 'Devoted caretaker preserving what matters' },
  ESTJ: { name: 'The Supervisor', motto: 'Organized administrator ensuring order and efficiency' },
  ESFJ: { name: 'The Provider', motto: 'Harmonious host nurturing community and connection' },
  ISTP: { name: 'The Craftsman', motto: 'Practical problem-solver with quiet confidence' },
  ISFP: { name: 'The Composer', motto: 'Gentle artist living in the moment' },
  ESTP: { name: 'The Dynamo', motto: 'Action-oriented realist thriving on excitement' },
  ESFP: { name: 'The Performer', motto: 'Spontaneous entertainer bringing joy to life' },
};

// Jungian Radar Chart Component (4-axis diamond shape)
const JungianRadarChart: Component<{
  profile: JungianProfile;
  themePrimary?: string;
}> = (props) => {
  const [hoveredPoint, setHoveredPoint] = createSignal<{
    x: number;
    y: number;
    label: string;
    score: number;
    color: string;
  } | null>(null);

  // Define the 4 axes - using preference percentages
  const dataPoints = createMemo(() => {
    const dichotomies = [
      {
        key: 'EI',
        label: 'E/I',
        preference: props.profile.dichotomies.EI.preference,
        percentage: props.profile.dichotomies.EI.percentage,
      },
      {
        key: 'SN',
        label: 'S/N',
        preference: props.profile.dichotomies.SN.preference,
        percentage: props.profile.dichotomies.SN.percentage,
      },
      {
        key: 'TF',
        label: 'T/F',
        preference: props.profile.dichotomies.TF.preference,
        percentage: props.profile.dichotomies.TF.percentage,
      },
      {
        key: 'JP',
        label: 'J/P',
        preference: props.profile.dichotomies.JP.preference,
        percentage: props.profile.dichotomies.JP.percentage,
      },
    ];

    const center = 150;
    const radius = 100;
    const max = 100;

    return dichotomies.map((d, i) => {
      // 4 points forming a diamond
      const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
      const dist = (d.percentage / max) * radius;
      const x = center + Math.cos(angle) * dist;
      const y = center + Math.sin(angle) * dist;
      return {
        x,
        y,
        score: d.percentage,
        label: `${d.preference} (${d.label})`,
        color: props.themePrimary || '#A78BFA',
      };
    });
  });

  const polygonPoints = createMemo(() =>
    dataPoints()
      .map((p) => `${p.x},${p.y}`)
      .join(' ')
  );

  const axes = [
    { label: 'E/I', fullLabel: 'Extraversion / Introversion' },
    { label: 'S/N', fullLabel: 'Sensing / Intuition' },
    { label: 'T/F', fullLabel: 'Thinking / Feeling' },
    { label: 'J/P', fullLabel: 'Judging / Perceiving' },
  ];

  return (
    <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto' }}>
      <svg width="300" height="300" viewBox="0 0 300 300">
        {/* Glow Filter */}
        <defs>
          <filter id="jungian-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid Background - Diamond shape */}
        <For each={[0.25, 0.5, 0.75, 1]}>
          {(scale) => (
            <polygon
              points={Array.from({ length: 4 })
                .map((_, i) => {
                  const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
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
        {Array.from({ length: 4 }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
          return (
            <line
              x1="150"
              y1="150"
              x2={150 + Math.cos(angle) * 100}
              y2={150 + Math.sin(angle) * 100}
              stroke="rgba(255,255,255,0.15)"
              stroke-width="1"
            />
          );
        })}

        {/* Data Polygon */}
        <polygon
          points={polygonPoints()}
          fill={`${props.themePrimary || '#A78BFA'}33`}
          stroke={props.themePrimary || '#A78BFA'}
          stroke-width="3"
          filter="url(#jungian-glow)"
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
          const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
          const x = 150 + Math.cos(angle) * 125;
          const y = 150 + Math.sin(angle) * 125;
          return (
            <text
              x={x}
              y={y}
              fill={props.themePrimary || '#A78BFA'}
              text-anchor="middle"
              dominant-baseline="middle"
              font-family={maximalist.fonts.heading}
              font-size="14px"
              font-weight="bold"
            >
              {axis.label}
            </text>
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

export interface JungianResultsProps {
  profile: JungianProfile;
  onRetake: () => void;
  currentThemeGradient?: string;
  currentThemePrimary?: string;
}

export const JungianResults: Component<JungianResultsProps> = (props) => {
  // Get descriptions
  const dominantFnDesc = () => getCognitiveFunctionDescription(props.profile.dominantFunction);
  const auxiliaryFnDesc = () => getCognitiveFunctionDescription(props.profile.auxiliaryFunction);
  const temperamentDesc = () => getTemperamentDescription(props.profile.temperament);
  const archetype = () => JUNGIAN_ARCHETYPES[props.profile.type];

  const dichotomyList = createMemo(() => [
    { key: 'EI', ...props.profile.dichotomies.EI },
    { key: 'SN', ...props.profile.dichotomies.SN },
    { key: 'TF', ...props.profile.dichotomies.TF },
    { key: 'JP', ...props.profile.dichotomies.JP },
  ]);

  return (
    <div
      style={{
        'max-width': '1000px',
        margin: '0 auto',
        padding: '48px 24px',
      }}
    >
      {/* Hero Section - Two Column Layout with Radar Chart */}
      <div
        class="archetype-hero-section"
        style={{
          background: `linear-gradient(180deg, ${maximalist.colors.surface} 0%, rgba(30, 30, 30, 0) 100%)`,
          'border-radius': maximalist.radii.lg,
          padding: '40px',
          'margin-bottom': '48px',
          position: 'relative',
          overflow: 'hidden',
          'box-shadow': `0 16px 48px ${props.currentThemePrimary || '#A78BFA'}4D`,
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
            <JungianRadarChart profile={props.profile} themePrimary={props.currentThemePrimary} />
          </div>

          {/* Right Column: Type Info */}
          <div class="archetype-info-column" style={{ 'text-align': 'left' }}>
            <p
              style={{
                color: props.currentThemePrimary || '#A78BFA',
                'font-size': '14px',
                'text-transform': 'uppercase',
                'letter-spacing': '2px',
                'margin-bottom': '8px',
                'font-weight': '600',
              }}
            >
              Your Jungian Type
            </p>

            <h1
              style={{
                'font-family': maximalist.fonts.heading,
                'font-size': '64px',
                'font-weight': '800',
                'letter-spacing': '6px',
                margin: '0 0 8px 0',
                color: 'white',
              }}
            >
              {props.profile.type}
            </h1>

            <h2
              style={{
                'font-family': maximalist.fonts.heading,
                'font-size': '28px',
                'margin-bottom': '12px',
                'font-weight': '700',
                color: props.currentThemePrimary || '#A78BFA',
              }}
            >
              {archetype().name}
            </h2>

            <p
              style={{
                'font-size': '16px',
                color: maximalist.colors.textMuted,
                'font-style': 'italic',
                'margin-bottom': '16px',
              }}
            >
              {archetype().motto}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                'flex-wrap': 'wrap',
                'margin-bottom': '16px',
              }}
            >
              <span
                style={{
                  background: `${props.currentThemePrimary || '#A78BFA'}33`,
                  color: props.currentThemePrimary || '#A78BFA',
                  padding: '6px 12px',
                  'border-radius': maximalist.radii.sm,
                  'font-size': '13px',
                  'font-weight': '600',
                }}
              >
                {temperamentDesc().name} Temperament
              </span>
              <span
                style={{
                  background: 'rgba(244, 114, 182, 0.2)',
                  color: '#F472B6',
                  padding: '6px 12px',
                  'border-radius': maximalist.radii.sm,
                  'font-size': '13px',
                  'font-weight': '600',
                }}
              >
                {props.profile.dominantFunction} Dominant
              </span>
            </div>

            <p
              style={{
                color: maximalist.colors.text,
                'font-size': '16px',
                'line-height': '1.6',
                margin: 0,
              }}
            >
              {temperamentDesc().description}
            </p>
          </div>
        </div>
      </div>

      {/* Dichotomy Breakdown */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(2, 1fr)',
          gap: '24px',
          'margin-bottom': '48px',
        }}
      >
        <For each={dichotomyList()}>
          {(dichotomy) => {
            const metadata = DICHOTOMY_METADATA[dichotomy.key as keyof typeof DICHOTOMY_METADATA];
            // Type assertion for poles - we know preference is a valid key
            const preferredPole = (metadata.poles as any)[dichotomy.preference];

            return (
              <div
                style={{
                  background: maximalist.colors.surface,
                  padding: '32px',
                  'border-radius': maximalist.radii.lg,
                  border: `2px solid ${maximalist.colors.border}`,
                }}
              >
                <div style={{ 'margin-bottom': '20px' }}>
                  <h3
                    style={{
                      'font-size': '14px',
                      'text-transform': 'uppercase',
                      'letter-spacing': '1px',
                      color: maximalist.colors.textMuted,
                      margin: '0 0 8px 0',
                    }}
                  >
                    {metadata.title}
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      'align-items': 'baseline',
                      gap: '12px',
                    }}
                  >
                    <span
                      style={{
                        'font-family': maximalist.fonts.heading,
                        'font-size': '36px',
                        'font-weight': '700',
                        color: 'white',
                      }}
                    >
                      {dichotomy.preference}
                    </span>
                    <span
                      style={{
                        'font-size': '20px',
                        color: maximalist.colors.textMuted,
                      }}
                    >
                      {preferredPole.label}
                    </span>
                  </div>
                </div>

                <p
                  style={{
                    'font-size': '15px',
                    color: maximalist.colors.text,
                    'line-height': '1.5',
                    'margin-bottom': '16px',
                  }}
                >
                  {preferredPole.description}
                </p>

                <div style={{ 'margin-bottom': '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      'justify-content': 'space-between',
                      'margin-bottom': '8px',
                    }}
                  >
                    <span style={{ 'font-size': '14px', color: maximalist.colors.textMuted }}>
                      Preference Strength
                    </span>
                    <span style={{ 'font-size': '14px', 'font-weight': '700', color: 'white' }}>
                      {dichotomy.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      'border-radius': '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${dichotomy.percentage}%`,
                        background: 'rgba(255,255,255,0.15)',
                        'border-radius': '4px',
                      }}
                    />
                  </div>
                </div>

                <span
                  style={{
                    'font-size': '13px',
                    color: maximalist.colors.textMuted,
                    'text-transform': 'capitalize',
                  }}
                >
                  {dichotomy.strength} preference
                </span>
              </div>
            );
          }}
        </For>
      </div>

      {/* Cognitive Functions */}
      <div
        style={{
          background: maximalist.colors.surface,
          padding: '40px',
          'border-radius': maximalist.radii.lg,
          border: `2px solid ${maximalist.colors.border}`,
          'margin-bottom': '48px',
        }}
      >
        <h2
          style={{
            'font-family': maximalist.fonts.heading,
            'font-size': '28px',
            'margin-bottom': '24px',
            color: 'white',
          }}
        >
          Cognitive Function Stack
        </h2>

        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Dominant */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '20px 24px',
              'border-radius': maximalist.radii.md,
              border: `1px solid ${maximalist.colors.border}`,
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
              <span
                style={{
                  'font-size': '13px',
                  'text-transform': 'uppercase',
                  'letter-spacing': '1px',
                  color: maximalist.colors.accent,
                  'font-weight': '700',
                }}
              >
                Dominant
              </span>
              <span
                style={{
                  'font-family': maximalist.fonts.heading,
                  'font-size': '24px',
                  'font-weight': '700',
                  color: 'white',
                }}
              >
                {props.profile.dominantFunction}
              </span>
              <span style={{ 'font-size': '16px', color: maximalist.colors.text }}>
                {dominantFnDesc().name}
              </span>
            </div>
            <p
              style={{
                'font-size': '14px',
                color: maximalist.colors.textMuted,
                margin: '8px 0 0 0',
                'line-height': '1.5',
              }}
            >
              {dominantFnDesc().description}
            </p>
          </div>

          {/* Auxiliary */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '20px 24px',
              'border-radius': maximalist.radii.md,
              border: `1px solid ${maximalist.colors.border}`,
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
              <span
                style={{
                  'font-size': '13px',
                  'text-transform': 'uppercase',
                  'letter-spacing': '1px',
                  color: maximalist.colors.textMuted,
                  'font-weight': '700',
                }}
              >
                Auxiliary
              </span>
              <span
                style={{
                  'font-family': maximalist.fonts.heading,
                  'font-size': '20px',
                  'font-weight': '700',
                  color: 'white',
                }}
              >
                {props.profile.auxiliaryFunction}
              </span>
              <span style={{ 'font-size': '15px', color: maximalist.colors.text }}>
                {auxiliaryFnDesc().name}
              </span>
            </div>
            <p
              style={{
                'font-size': '14px',
                color: maximalist.colors.textMuted,
                margin: '8px 0 0 0',
                'line-height': '1.5',
              }}
            >
              {auxiliaryFnDesc().description}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', 'justify-content': 'center', gap: '16px' }}>
        <button
          onClick={props.onRetake}
          style={{
            padding: '16px 32px',
            background: 'transparent',
            border: `2px solid ${maximalist.colors.border}`,
            'border-radius': maximalist.radii.md,
            color: maximalist.colors.text,
            'font-size': '16px',
            'font-weight': '600',
            cursor: 'pointer',
          }}
        >
          Retake Assessment
        </button>
      </div>
    </div>
  );
};
