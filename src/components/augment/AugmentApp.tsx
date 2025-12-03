/**
 * Augment - Career Exploration & Job Matching App
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying, modification,
 * or distribution of this code is strictly prohibited. The frontend logic is local-first
 * and protected intellectual property. No infringement or unauthorized use is permitted.
 */

import {
  Component,
  For,
  createSignal,
  onMount,
  Show,
  createMemo,
  createEffect,
  untrack,
} from 'solid-js';
import { Strength, JobMatch } from '../../schemas/augment.schema';
import {
  searchCareers,
  getInterestProfilerQuestions,
  getInterestProfilerResults,
  getInterestProfilerCareers,
  getCareerDetails,
  OnetQuestion,
  RiasecScoreWithDetails,
  OnetCareerMatch,
  OnetCareerDetails,
} from '../../services/onet';
import { maximalist, maxPalette, maxGradients, maxPatterns } from '../../theme/maximalist';

// Helper to get RGB string from hex
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
};

// Helper to determine contrasting text color (black or white)
const getContrastColor = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 'black';

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  // Calculate brightness (YIQ formula)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
};

// Dynamic Theme State
const [currentTheme, setCurrentTheme] = createSignal({
  colors: {
    primary: '#FFFFFF', // White for default
    secondary: '#A3A3A3', // Neutral 400
    accent: '#FFFFFF',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#F3F4F6',
    textMuted: '#9CA3AF',
    border: '#374151',
    textOnPrimary: 'black', // Default black on white
  },
  gradients: {
    primary: 'linear-gradient(135deg, #FFFFFF, #A3A3A3)',
  },
  shadows: {
    sm: '0 4px 12px rgba(255, 255, 255, 0.1), 0 2px 4px rgba(255, 255, 255, 0.05)',
    md: '0 8px 24px rgba(255, 255, 255, 0.15), 0 4px 8px rgba(255, 255, 255, 0.1)',
    lg: '0 16px 48px rgba(255, 255, 255, 0.2), 0 8px 16px rgba(255, 255, 255, 0.15)',
  },
});

const sampleStrengths: Strength[] = [
  {
    id: '1',
    name: 'Strategic Thinking',
    category: 'strategic-thinking',
    score: 92,
    description: 'Sees patterns others miss',
    relatedRoles: ['Product Manager', 'Consultant'],
  },
  {
    id: '2',
    name: 'Ideation',
    category: 'strategic-thinking',
    score: 88,
    description: 'Generates creative solutions',
    relatedRoles: ['Designer', 'Innovator'],
  },
  {
    id: '3',
    name: 'Achiever',
    category: 'executing',
    score: 85,
    description: 'Driven to accomplish goals',
    relatedRoles: ['Project Lead', 'Entrepreneur'],
  },
  {
    id: '4',
    name: 'Communication',
    category: 'influencing',
    score: 79,
    description: 'Articulates ideas clearly',
    relatedRoles: ['Sales', 'Marketing'],
  },
];

const sampleJobs: JobMatch[] = [
  {
    id: '1',
    userId: '1',
    jobId: 'j1',
    company: 'Innovate Labs',
    role: 'Senior Product Strategist',
    location: 'Remote',
    strengthFitScore: 94,
    cultureFitScore: 88,
    overallScore: 91,
    matchedStrengths: ['Strategic Thinking', 'Ideation'],
    matchedValues: ['innovation', 'autonomy'],
    status: 'discovered',
  },
  {
    id: '2',
    userId: '1',
    jobId: 'j2',
    company: 'GrowthCo',
    role: 'Innovation Lead',
    location: 'NYC',
    salary: { min: 150000, max: 180000, currency: 'USD' },
    strengthFitScore: 87,
    cultureFitScore: 92,
    overallScore: 89,
    matchedStrengths: ['Achiever', 'Communication'],
    matchedValues: ['growth', 'collaboration'],
    status: 'interested',
  },
];

const ARCHETYPES: Record<string, { title: string; description: string }> = {
  // Pure Types (fallback if scores are very skewed)
  realistic: {
    title: 'The Maker',
    description: 'You thrive when building, fixing, and working with your hands.',
  },
  investigative: {
    title: 'The Thinker',
    description: 'You analyze, research, and solve complex problems logically.',
  },
  artistic: {
    title: 'The Creator',
    description: 'You express yourself through innovative design and creative works.',
  },
  social: {
    title: 'The Helper',
    description: 'You empower others through teaching, healing, and guidance.',
  },
  enterprising: {
    title: 'The Persuader',
    description: 'You lead teams and sell ideas with energy and confidence.',
  },
  conventional: {
    title: 'The Organizer',
    description: 'You create order and efficiency through structured systems.',
  },
  // Hybrid Combinations (sorted alphabetically by key for lookup)
  'investigative-realistic': {
    title: 'The Engineer',
    description:
      'You combine practical skills with analytical depth to build functional solutions.',
  },
  'artistic-realistic': {
    title: 'The Artisan',
    description: 'You craft beautiful, tangible objects with skill and creative flair.',
  },
  'realistic-social': {
    title: 'The Service Technician',
    description: 'You use practical skills to directly help others in tangible ways.',
  },
  'enterprising-realistic': {
    title: 'The Contractor',
    description: 'You manage projects and lead teams in hands-on environments.',
  },
  'conventional-realistic': {
    title: 'The Builder',
    description: 'You execute precise, structured work with tangible materials.',
  },
  'artistic-investigative': {
    title: 'The Architect',
    description: 'You merge creative vision with rigorous logic to design complex systems.',
  },
  'investigative-social': {
    title: 'The Diagnostician',
    description: 'You analyze problems to provide deep care and understanding for people.',
  },
  'enterprising-investigative': {
    title: 'The Strategist',
    description: 'You use data and analysis to lead organizations toward success.',
  },
  'conventional-investigative': {
    title: 'The Analyst',
    description: 'You organize data and systems with scientific precision.',
  },
  'artistic-social': {
    title: 'The Teacher',
    description: 'You use creativity to inspire and educate others.',
  },
  'artistic-enterprising': {
    title: 'The Innovator',
    description: 'You turn creative ideas into marketable products and ventures.',
  },
  'artistic-conventional': {
    title: 'The Editor',
    description: 'You bring structure and polish to creative output.',
  },
  'enterprising-social': {
    title: 'The Community Leader',
    description: 'You bring people together to achieve shared goals through influence.',
  },
  'conventional-social': {
    title: 'The Administrator',
    description: 'You support people through efficient, well-managed systems.',
  },
  'conventional-enterprising': {
    title: 'The Executive',
    description: 'You manage business operations with structure and authority.',
  },
};

const CartoonBadge: Component<{ fit: string }> = (props) => {
  const styles = createMemo(() => {
    switch (props.fit) {
      case 'Best':
        return {
          bg: '#A6D608', // Acid green
          color: '#000',
          radius: '20px',
          transform: 'rotate(-2deg)',
          border: '2px solid #000',
        };
      case 'Great':
        return {
          bg: '#D62598', // Magenta
          color: '#FFF',
          radius: '12px',
          transform: 'rotate(1deg)',
          border: '2px solid #000',
        };
      default:
        return {
          bg: '#00A693', // Teal
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
        'font-size': '12px',
        'text-transform': 'uppercase',
        transform: styles().transform,
        'font-weight': 'bold',
        'letter-spacing': '0.5px',
        'box-shadow': '2px 2px 0px #000',
        display: 'inline-block',
        'min-width': props.fit === 'Best' ? '40px' : 'auto',
        'text-align': 'center',
      }}
    >
      {props.fit}
    </div>
  );
};

const JobDetailModal: Component<{ job: OnetCareerDetails; onClose: () => void }> = (props) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        'backdrop-filter': 'blur(5px)',
        'z-index': 100,
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        padding: '24px',
      }}
      onClick={props.onClose}
    >
      <div
        style={{
          background: '#1a1a1a',
          border: `2px solid ${currentTheme().colors.primary}`,
          'border-radius': '16px',
          padding: '32px',
          'max-width': '800px',
          width: '100%',
          'max-height': '90vh',
          overflow: 'auto',
          color: '#fff',
          position: 'relative',
          'box-shadow': `0 0 30px ${currentTheme().colors.primary}40`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={props.onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: '#fff',
            'font-size': '24px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        <h2
          style={{
            'font-family': maximalist.fonts.heading,
            'font-size': '36px',
            'margin-bottom': '16px',
            color: currentTheme().colors.primary,
          }}
        >
          {props.job.title}
        </h2>

        <div style={{ 'margin-bottom': '24px' }}>
          {props.job.tags.bright_outlook && (
            <span
              style={{
                background: '#F59E0B',
                color: 'black',
                padding: '4px 8px',
                'border-radius': '4px',
                'font-weight': 'bold',
                'font-size': '12px',
                'margin-right': '8px',
              }}
            >
              Bright Outlook
            </span>
          )}
          {props.job.tags.green && (
            <span
              style={{
                background: '#10B981',
                color: 'black',
                padding: '4px 8px',
                'border-radius': '4px',
                'font-weight': 'bold',
                'font-size': '12px',
              }}
            >
              Green Economy
            </span>
          )}
        </div>

        <div style={{ 'margin-bottom': '32px' }}>
          <h3
            style={{
              'font-size': '20px',
              'margin-bottom': '8px',
              color: currentTheme().colors.accent,
            }}
          >
            What they do
          </h3>
          <p style={{ 'line-height': '1.6', 'font-size': '16px', color: '#ccc' }}>
            {props.job.what_they_do}
          </p>
        </div>

        <div style={{ 'margin-bottom': '32px' }}>
          <h3
            style={{
              'font-size': '20px',
              'margin-bottom': '8px',
              color: currentTheme().colors.secondary,
            }}
          >
            On the job
          </h3>
          <ul style={{ 'padding-left': '20px', color: '#ccc' }}>
            <For each={props.job.on_the_job}>
              {(item) => <li style={{ 'margin-bottom': '8px', 'line-height': '1.5' }}>{item}</li>}
            </For>
          </ul>
        </div>

        {props.job.also_called && (
          <div>
            <h3
              style={{
                'font-size': '20px',
                'margin-bottom': '8px',
                color: maximalist.colors.textMuted,
              }}
            >
              Also called
            </h3>
            <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '8px' }}>
              <For each={props.job.also_called}>
                {(item) => (
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      padding: '4px 12px',
                      'border-radius': '16px',
                      'font-size': '12px',
                      color: '#ccc',
                    }}
                  >
                    {item.title}
                  </span>
                )}
              </For>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RadarChart: Component<{ scores: RiasecScoreWithDetails }> = (props) => {
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
              stroke="rgba(255,255,255,0.1)"
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
              stroke="rgba(255,255,255,0.1)"
              stroke-width="1"
            />
          );
        })}

        {/* Data Polygon */}
        <polygon
          points={polygonPoints()}
          fill={currentTheme().colors.primary + '33'}
          stroke={currentTheme().colors.primary}
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
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
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
                font-size="12px"
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
            'font-size': '12px',
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

const StrengthCard: Component<{ strength: Strength; index: number }> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);
  // Re-calculate pattern inside component to access currentTheme()
  const dynamicPattern = createMemo(() => {
    const color = currentTheme().colors.primary.replace('#', '%23');
    return `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='${color}' fill-opacity='0.3'/%3E%3C/svg%3E")`;
  });

  const accentColor = currentTheme().colors.primary;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        background: maximalist.colors.surface,
        'border-radius': maximalist.radii.lg,
        padding: '24px',
        'box-shadow': currentTheme().shadows.md,
        border: `2px solid ${maximalist.colors.border}`,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isHovered() ? 'scale(1.05) rotate(1deg)' : 'scale(1) rotate(0deg)',
      }}
    >
      {/* Decorative background pattern */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          'background-image': dynamicPattern(),
          opacity: 0.4,
          'pointer-events': 'none',
        }}
      />

      {/* Accent blob */}
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '100px',
          height: '100px',
          background: accentColor,
          'border-radius': maximalist.radii.organic,
          opacity: 0.3,
          transition: 'transform 0.5s ease',
          transform: isHovered() ? 'scale(1.4) rotate(20deg)' : 'scale(1) rotate(0deg)',
        }}
      />

      <div style={{ position: 'relative', 'z-index': 1 }}>
        {/* Score badge - maximalist style */}
        <div
          style={{
            display: 'inline-flex',
            'align-items': 'center',
            gap: '8px',
            padding: '8px 16px',
            background: currentTheme().gradients.primary,
            'border-radius': '50px',
            'margin-bottom': '16px',
          }}
        >
          <span
            style={{
              'font-family': maximalist.fonts.heading,
              'font-size': '24px',
              'font-weight': '700',
              color: currentTheme().colors.textOnPrimary,
            }}
          >
            {props.strength.score}
          </span>
          <span
            style={{
              'font-size': '12px',
              color:
                currentTheme().colors.textOnPrimary === 'white'
                  ? 'rgba(255,255,255,0.8)'
                  : 'rgba(0,0,0,0.6)',
              'font-weight': '500',
            }}
          >
            / 100
          </span>
        </div>

        <h3
          style={{
            margin: '0 0 8px 0',
            'font-family': maximalist.fonts.heading,
            'font-size': '24px',
            'font-weight': '700',
            color: maximalist.colors.text,
          }}
        >
          {props.strength.name}
        </h3>

        <p
          style={{
            margin: '0 0 16px 0',
            'font-family': maximalist.fonts.body,
            'font-size': '14px',
            color: maximalist.colors.textMuted,
            'line-height': '1.5',
          }}
        >
          {props.strength.description}
        </p>

        {/* Related roles - decorative chips */}
        <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '8px' }}>
          <For each={props.strength.relatedRoles}>
            {(role) => (
              <span
                style={{
                  padding: '6px 12px',
                  background: `${accentColor}25`,
                  'border-radius': '20px',
                  'font-size': '12px',
                  color: maximalist.colors.text,
                  'font-weight': '500',
                  border: `1px solid ${accentColor}40`,
                }}
              >
                {role}
              </span>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};

const JobCard: Component<{ job: JobMatch }> = (props) => {
  return (
    <div
      style={{
        background: maximalist.colors.surface,
        'border-radius': maximalist.radii.lg,
        overflow: 'hidden',
        border: `2px solid ${maximalist.colors.border}`,
        'box-shadow': currentTheme().shadows.md,
      }}
    >
      {/* Gradient header */}
      <div
        style={{
          background: currentTheme().gradients.primary,
          padding: '20px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '20px',
            width: '80px',
            height: '80px',
            background: 'rgba(255,255,255,0.1)',
            'border-radius': '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30px',
            right: '80px',
            width: '60px',
            height: '60px',
            background: 'rgba(255,255,255,0.08)',
            'border-radius': '50%',
          }}
        />

        <div style={{ position: 'relative', 'z-index': 1 }}>
          <div
            style={{
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'flex-start',
            }}
          >
            <div>
              <h3
                style={{
                  margin: '0 0 4px 0',
                  'font-family': maximalist.fonts.heading,
                  'font-size': '22px',
                  'font-weight': '700',
                  color: 'white',
                }}
              >
                {props.job.role}
              </h3>
              <p
                style={{
                  margin: 0,
                  'font-size': '14px',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                {props.job.company} • {props.job.location}
              </p>
            </div>

            {/* Overall score - prominent display */}
            <div
              style={{
                background: 'rgba(255,255,255,0.2)',
                'backdrop-filter': 'blur(10px)',
                'border-radius': '12px',
                padding: '12px 16px',
                'text-align': 'center',
              }}
            >
              <div
                style={{
                  'font-family': maximalist.fonts.heading,
                  'font-size': '32px',
                  'font-weight': '700',
                  color: currentTheme().colors.textOnPrimary,
                  'line-height': '1',
                }}
              >
                {props.job.overallScore}%
              </div>
              <div
                style={{
                  'font-size': '10px',
                  color:
                    currentTheme().colors.textOnPrimary === 'white'
                      ? 'rgba(255,255,255,0.7)'
                      : 'rgba(0,0,0,0.5)',
                  'text-transform': 'uppercase',
                  'letter-spacing': '1px',
                }}
              >
                Match
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Fit scores - dual bars */}
        <div
          style={{
            display: 'grid',
            'grid-template-columns': '1fr 1fr',
            gap: '16px',
            'margin-bottom': '20px',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                'justify-content': 'space-between',
                'margin-bottom': '6px',
                'font-size': '12px',
              }}
            >
              <span style={{ color: maximalist.colors.textMuted }}>Strength Fit</span>
              <span style={{ color: currentTheme().colors.primary, 'font-weight': '600' }}>
                {props.job.strengthFitScore}%
              </span>
            </div>
            <div
              style={{
                height: '8px',
                background: `${currentTheme().colors.primary}25`,
                'border-radius': '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${props.job.strengthFitScore}%`,
                  height: '100%',
                  background: currentTheme().gradients.primary,
                  'border-radius': '4px',
                }}
              />
            </div>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                'justify-content': 'space-between',
                'margin-bottom': '6px',
                'font-size': '12px',
              }}
            >
              <span style={{ color: maximalist.colors.textMuted }}>Culture Fit</span>
              <span style={{ color: currentTheme().colors.secondary, 'font-weight': '600' }}>
                {props.job.cultureFitScore}%
              </span>
            </div>
            <div
              style={{
                height: '8px',
                background: `${currentTheme().colors.secondary}25`,
                'border-radius': '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${props.job.cultureFitScore}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${currentTheme().colors.secondary}, ${currentTheme().colors.accent})`,
                  'border-radius': '4px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Matched values - decorative pills */}
        <div style={{ display: 'flex', gap: '8px', 'flex-wrap': 'wrap', 'margin-bottom': '20px' }}>
          <For each={props.job.matchedStrengths}>
            {(strength) => (
              <span
                style={{
                  padding: '6px 14px',
                  background: currentTheme().gradients.primary,
                  'border-radius': '20px',
                  'font-size': '12px',
                  color: currentTheme().colors.textOnPrimary,
                  'font-weight': '500',
                }}
              >
                {strength}
              </span>
            )}
          </For>
          <For each={props.job.matchedValues}>
            {(value) => (
              <span
                style={{
                  padding: '6px 14px',
                  background: `${maximalist.colors.border}`,
                  'border-radius': '20px',
                  'font-size': '12px',
                  color: maximalist.colors.text,
                  'font-weight': '500',
                }}
              >
                {value}
              </span>
            )}
          </For>
        </div>

        {/* Salary if available */}
        {props.job.salary && (
          <div
            style={{
              padding: '12px 16px',
              background: `${currentTheme().colors.accent}15`,
              'border-radius': maximalist.radii.sm,
              'margin-bottom': '20px',
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={currentTheme().colors.accent}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
            </svg>
            <span
              style={{
                'font-family': maximalist.fonts.body,
                'font-size': '14px',
                color: maximalist.colors.text,
              }}
            >
              ${(props.job.salary.min / 1000).toFixed(0)}k - $
              {(props.job.salary.max / 1000).toFixed(0)}k
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{
              flex: 1,
              padding: '14px 20px',
              background: currentTheme().gradients.primary,
              border: 'none',
              'border-radius': maximalist.radii.md,
              color: currentTheme().colors.textOnPrimary,
              'font-size': '14px',
              'font-weight': '600',
              cursor: 'pointer',
              'box-shadow': currentTheme().shadows.sm,
            }}
          >
            View Details
          </button>
          <button
            style={{
              padding: '14px 20px',
              background: 'transparent',
              border: `2px solid ${maximalist.colors.border}`,
              'border-radius': maximalist.radii.md,
              color: maximalist.colors.text,
              'font-size': '14px',
              'font-weight': '600',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export const AugmentApp: Component = () => {
  const [activeTab, setActiveTab] = createSignal<'RIASEC' | 'Matches'>('RIASEC');
  const [jobs, setJobs] = createSignal<JobMatch[]>([]);

  // Assessment State
  const [assessmentState, setAssessmentState] = createSignal<'intro' | 'questions' | 'results'>(
    'intro'
  );
  const [questions, setQuestions] = createSignal<OnetQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = createSignal(0);
  const [answers, setAnswers] = createSignal<string[]>(new Array(60).fill('?')); // '?' is default for unsure/unanswered
  const [riasecScore, setRiasecScore] = createSignal<RiasecScoreWithDetails | null>(null);
  const [careerMatches, setCareerMatches] = createSignal<OnetCareerMatch[]>([]);
  const [selectedJob, setSelectedJob] = createSignal<OnetCareerDetails | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [isJobLoading, setIsJobLoading] = createSignal(false);

  // Effect to sync Assessment State with Scores
  createEffect(() => {
    if (riasecScore()) {
      setAssessmentState('results');
    }
  });

  // Effect to Update Global Theme based on Score
  createEffect(() => {
    const scores = riasecScore();
    if (scores) {
      const sorted = Object.entries(scores)
        .map(([key, value]) => ({ key, ...value }))
        .sort((a, b) => b.score - a.score);

      const top1 = sorted[0].key;
      const top2 = sorted[1]?.key || sorted[0].key;

      const pColor = (maximalist.riasec as any)[top1];
      const sColor = (maximalist.riasec as any)[top2];

      const pRgb = hexToRgb(pColor);
      const sRgb = hexToRgb(sColor);

      const current = untrack(() => currentTheme());

      setCurrentTheme({
        colors: {
          ...current.colors,
          primary: pColor,
          secondary: sColor,
          accent: sColor,
          textOnPrimary: getContrastColor(pColor),
        },
        gradients: {
          primary: `linear-gradient(135deg, ${pColor}, ${sColor})`,
        },
        shadows: {
          sm: `0 4px 12px rgba(${pRgb}, 0.2), 0 2px 4px rgba(${sRgb}, 0.1)`,
          md: `0 8px 24px rgba(${pRgb}, 0.3), 0 4px 8px rgba(${sRgb}, 0.2)`,
          lg: `0 16px 48px rgba(${pRgb}, 0.4), 0 8px 16px rgba(${sRgb}, 0.3)`,
        },
      });
    }
  });

  // Computed values for Results
  const sortedScores = createMemo(() => {
    const scores = riasecScore();
    if (!scores) return [];
    return Object.entries(scores)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.score - a.score);
  });

  const hybridArchetype = createMemo(() => {
    const sorted = sortedScores();
    if (sorted.length < 2) return null;

    const top1 = sorted[0];
    const top2 = sorted[1];

    // Sort keys alphabetically to match ARCHETYPES map
    const key = [top1.key, top2.key].sort().join('-');
    const archetype = ARCHETYPES[key];

    if (archetype) {
      return {
        title: archetype.title,
        description: archetype.description,
        score: Math.round((top1.score + top2.score) / 2),
        types: [top1.key, top2.key],
      };
    }

    // Fallback to primary if map missing or tie
    return {
      title: `The ${top1.title}`,
      description: top1.description,
      score: top1.score,
      types: [top1.key, top1.key],
    };
  });

  // Enrich careers with details for the Matches tab
  const enrichCareers = async (careers: OnetCareerMatch[]) => {
    const topCareers = careers.slice(0, 10);
    const enriched = await Promise.all(
      topCareers.map(async (c, i) => {
        const details = await getCareerDetails(c.code);
        return {
          id: c.code,
          userId: '1',
          jobId: c.code,
          company: 'O*NET Data', // Placeholder as O*NET doesn't provide specific job listings with companies
          role: c.title,
          location: 'Remote / US',
          salary: details?.salary
            ? {
                min: details.salary.annual_median * 0.8,
                max: details.salary.annual_median * 1.2,
                currency: 'USD',
              }
            : undefined,
          strengthFitScore: 95 - i * 2, // Mock score based on rank
          cultureFitScore: 90 - (i % 5), // Mock score
          overallScore: 95 - i, // Mock score based on rank
          matchedStrengths: details?.skills
            ? details.skills.slice(0, 3)
            : ['Analytical', 'Creative'],
          matchedValues: c.tags.green
            ? ['Green Economy']
            : c.tags.bright_outlook
              ? ['High Growth']
              : ['Stability'],
          status: 'discovered',
        } as JobMatch;
      })
    );
    setJobs(enriched);
  };

  // Load saved state on mount
  onMount(async () => {
    // Load local storage
    const savedAnswers = localStorage.getItem('augment_answers');
    if (savedAnswers) {
      const parsed = JSON.parse(savedAnswers);
      setAnswers(parsed);
      // Determine if we should be in 'questions' or 'results'
      const answeredCount = parsed.filter((a: string) => a !== '?').length;
      if (answeredCount === 60) {
        // Fetch results if complete
        const scores = await getInterestProfilerResults(parsed.join(''));
        if (scores) {
          setRiasecScore(scores);
          // assessmentState is set by effect
          // setActiveTab('assess'); // Removed, let it default or stay on RIASEC

          // Fetch careers
          setIsLoading(true);
          const careers = await getInterestProfilerCareers(scores);
          setCareerMatches(careers);
          enrichCareers(careers); // Pre-fetch details for Matches tab
          setIsLoading(false);
        }
      } else if (answeredCount > 0) {
        setAssessmentState('questions');
        const qs = await getInterestProfilerQuestions(1, 60);
        setQuestions(qs);
        // Find first unanswered question
        const firstUnanswered = parsed.findIndex((a: string) => a === '?');
        setCurrentQuestionIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
        setActiveTab('RIASEC');
      }
    }
  });

  const startAssessment = async () => {
    setIsLoading(true);
    const qs = await getInterestProfilerQuestions(1, 60);
    setQuestions(qs);
    setAssessmentState('questions');
    setIsLoading(false);
  };

  const handleAnswer = async (value: number) => {
    const newAnswers = [...answers()];
    newAnswers[currentQuestionIndex()] = value.toString();
    setAnswers(newAnswers);
    localStorage.setItem('augment_answers', JSON.stringify(newAnswers));

    if (currentQuestionIndex() < 59) {
      setCurrentQuestionIndex(currentQuestionIndex() + 1);
    } else {
      // Finished
      setIsLoading(true);
      const scores = await getInterestProfilerResults(newAnswers.join(''));
      if (scores) {
        setRiasecScore(scores);
        setAssessmentState('results');
        setActiveTab('RIASEC');

        // Fetch careers
        const careers = await getInterestProfilerCareers(scores);
        setCareerMatches(careers);
        enrichCareers(careers);
      }
      setIsLoading(false);
    }
  };

  const handleJobClick = async (code: string) => {
    setIsJobLoading(true);
    const details = await getCareerDetails(code);
    if (details) {
      setSelectedJob(details);
    }
    setIsJobLoading(false);
  };

  // Dynamic SVG Patterns
  const dynamicPatterns = createMemo(() => {
    const color = currentTheme().colors.primary.replace('#', '%23');
    return {
      zigzag: `url("data:image/svg+xml,%3Csvg width='40' height='12' viewBox='0 0 40 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6 L10 0 L20 6 L30 0 L40 6 L40 12 L30 6 L20 12 L10 6 L0 12' fill='${color}' fill-opacity='0.1'/%3E%3C/svg%3E")`,
      dots: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='${color}' fill-opacity='0.3'/%3E%3C/svg%3E")`,
    };
  });

  const resetAssessment = () => {
    setAssessmentState('intro');
    setAnswers(new Array(60).fill('?'));
    setCurrentQuestionIndex(0);
    setRiasecScore(null);
    localStorage.removeItem('augment_answers');
    // Reset theme to default
    setCurrentTheme({
      colors: {
        primary: '#FFFFFF',
        secondary: '#A3A3A3',
        accent: '#FFFFFF',
        background: '#121212',
        surface: '#1E1E1E',
        text: '#F3F4F6',
        textMuted: '#9CA3AF',
        border: '#374151',
        textOnPrimary: 'black',
      },
      gradients: {
        primary: 'linear-gradient(135deg, #FFFFFF, #A3A3A3)',
      },
      shadows: {
        sm: '0 4px 12px rgba(255, 255, 255, 0.1), 0 2px 4px rgba(255, 255, 255, 0.05)',
        md: '0 8px 24px rgba(255, 255, 255, 0.15), 0 4px 8px rgba(255, 255, 255, 0.1)',
        lg: '0 16px 48px rgba(255, 255, 255, 0.2), 0 8px 16px rgba(255, 255, 255, 0.15)',
      },
    });
  };

  return (
    <div
      style={{
        'min-height': '100vh',
        background: maximalist.colors.background,
        'font-family': maximalist.fonts.body,
        color: maximalist.colors.text,
        position: 'relative',
        'overflow-x': 'hidden',
      }}
    >
      {/* Decorative background elements */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          'pointer-events': 'none',
          'background-image': dynamicPatterns().zigzag,
          opacity: 0.5,
        }}
      />

      {/* Gradient orbs */}
      <div
        style={{
          position: 'fixed',
          top: '-200px',
          right: '-100px',
          width: '500px',
          height: '500px',
          background: `radial-gradient(circle, ${currentTheme().colors.primary}40, transparent 70%)`,
          'border-radius': '50%',
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-150px',
          left: '-50px',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${currentTheme().colors.secondary}30, transparent 70%)`,
          'border-radius': '50%',
          filter: 'blur(60px)',
        }}
      />

      <div style={{ position: 'relative', 'z-index': 1 }}>
        {/* Header */}
        <header
          style={{
            padding: '24px 32px',
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
          }}
        >
          <div style={{ display: 'flex', 'align-items': 'center', gap: '16px' }}>
            {/* Logo with dynamic colored border */}
            <div
              style={{
                width: '56px',
                height: '56px',
                'border-radius': '16px',
                background: 'transparent',
                border: `2px solid ${currentTheme().colors.primary}`,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'box-shadow': currentTheme().shadows.md,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill={currentTheme().colors.primary}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  'font-family': maximalist.fonts.heading,
                  'font-size': '32px',
                  'font-weight': '700',
                  'background-image': currentTheme().gradients.primary,
                  '-webkit-background-clip': 'text',
                  'background-clip': 'text',
                  color: 'transparent',
                  display: 'inline-block',
                  '-webkit-text-fill-color': 'transparent',
                }}
              >
                Augment
              </h1>
              <p
                style={{
                  margin: 0,
                  'font-size': '14px',
                  color: maximalist.colors.textMuted,
                }}
              >
                Amplify Your Strengths
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', 'align-items': 'center', gap: '16px' }}>
            <div
              style={{
                padding: '10px 20px',
                background: `${currentTheme().colors.accent}20`,
                'border-radius': '50px',
                'font-size': '14px',
                color: currentTheme().colors.accent,
                'font-weight': '600',
              }}
            >
              4 New Matches
            </div>

            <button
              style={{
                width: '48px',
                height: '48px',
                'border-radius': '50%',
                background: maxGradients.sunset,
                border: 'none',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                cursor: 'pointer',
                'box-shadow': currentTheme().shadows.sm,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Tab navigation - maximalist pills */}
        <nav
          style={{
            padding: '0 32px 32px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: '8px',
              background: maximalist.colors.surface,
              'border-radius': maximalist.radii.lg,
              'box-shadow': currentTheme().shadows.sm,
              border: `1px solid ${maximalist.colors.border}`,
            }}
          >
            <For each={['RIASEC', 'Matches'] as const}>
              {(tab) => (
                <button
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '14px 28px',
                    background:
                      activeTab() === tab ? currentTheme().gradients.primary : 'transparent',
                    border: 'none',
                    'border-radius': maximalist.radii.md,
                    color:
                      activeTab() === tab
                        ? currentTheme().colors.textOnPrimary
                        : maximalist.colors.textMuted,
                    'font-size': '14px',
                    'font-weight': '600',
                    cursor: 'pointer',
                    'text-transform': 'capitalize',
                    transition: 'all 0.3s ease',
                    outline: 'none', // Remove focus ring to prevent "stuck" look
                  }}
                >
                  {tab}
                </button>
              )}
            </For>
          </div>
        </nav>

        {/* Main content */}
        <main style={{ padding: '0 32px 48px', 'max-width': '1400px', margin: '0 auto' }}>
          {activeTab() === 'Matches' && (
            <>
              <div style={{ 'margin-bottom': '32px' }}>
                <h2
                  style={{
                    margin: '0 0 8px 0',
                    'font-family': maximalist.fonts.heading,
                    'font-size': '36px',
                    'font-weight': '700',
                  }}
                >
                  Matched Opportunities
                </h2>
                <p
                  style={{
                    margin: 0,
                    'font-size': '16px',
                    color: maximalist.colors.textMuted,
                  }}
                >
                  Jobs that amplify your natural strengths and align with your values
                </p>
              </div>

              <Show
                when={jobs().length > 0}
                fallback={
                  <div
                    style={{
                      padding: '48px',
                      'text-align': 'center',
                      color: maximalist.colors.textMuted,
                    }}
                  >
                    <p>Complete the RIASEC assessment to see your matched opportunities.</p>
                    <button
                      onClick={() => setActiveTab('RIASEC')}
                      style={{
                        'margin-top': '16px',
                        padding: '12px 24px',
                        background: currentTheme().gradients.primary,
                        color: currentTheme().colors.textOnPrimary,
                        border: 'none',
                        'border-radius': maximalist.radii.md,
                        'font-weight': 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      Go to Assessment
                    </button>
                  </div>
                }
              >
                <div
                  style={{
                    display: 'grid',
                    'grid-template-columns': 'repeat(auto-fill, minmax(400px, 1fr))',
                    gap: '24px',
                  }}
                >
                  <For each={jobs()}>{(job) => <JobCard job={job} />}</For>
                </div>
              </Show>
            </>
          )}

          {activeTab() === 'RIASEC' && (
            <div
              style={{
                'max-width': '800px',
                margin: '0 auto',
                'padding-top': '48px',
              }}
            >
              <Show when={assessmentState() === 'intro'}>
                <div style={{ 'text-align': 'center' }}>
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      'border-radius': '50%',
                      background: maxGradients.aurora,
                      margin: '0 auto 32px',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'box-shadow': currentTheme().shadows.lg,
                    }}
                  >
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
                    </svg>
                  </div>

                  <h2
                    style={{
                      margin: '0 0 16px 0',
                      'font-family': maximalist.fonts.heading,
                      'font-size': '32px',
                      'font-weight': '700',
                    }}
                  >
                    Discover Your Strengths
                  </h2>

                  <p
                    style={{
                      margin: '0 0 32px 0',
                      'font-size': '16px',
                      color: maximalist.colors.textMuted,
                      'line-height': '1.6',
                    }}
                  >
                    Take the O*NET Interest Profiler to uncover your unique strengths profile. This
                    60-question assessment provides personalized insights into your work interests.
                  </p>

                  <button
                    onClick={startAssessment}
                    disabled={isLoading()}
                    style={{
                      padding: '18px 48px',
                      background: currentTheme().gradients.primary,
                      border: 'none',
                      'border-radius': maximalist.radii.md,
                      color: currentTheme().colors.textOnPrimary,
                      'font-size': '16px',
                      'font-weight': '700',
                      cursor: isLoading() ? 'wait' : 'pointer',
                      'box-shadow': currentTheme().shadows.md,
                      display: 'inline-flex',
                      'align-items': 'center',
                      gap: '12px',
                      opacity: isLoading() ? 0.7 : 1,
                    }}
                  >
                    <Show when={!isLoading()} fallback="Loading...">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Start Assessment
                    </Show>
                  </button>
                </div>
              </Show>

              <Show when={assessmentState() === 'questions' && questions().length > 0}>
                <div
                  style={{
                    background: maximalist.colors.surface,
                    padding: '40px',
                    'border-radius': maximalist.radii.lg,
                    border: `2px solid ${maximalist.colors.border}`,
                    'box-shadow': currentTheme().shadows.lg,
                  }}
                >
                  <div
                    style={{
                      'margin-bottom': '24px',
                      display: 'flex',
                      'justify-content': 'space-between',
                      'align-items': 'center',
                    }}
                  >
                    <span style={{ color: maximalist.colors.textMuted, 'font-size': '14px' }}>
                      Question {currentQuestionIndex() + 1} of 60
                    </span>
                    <span style={{ color: maximalist.colors.accent, 'font-weight': '600' }}>
                      {Math.round((currentQuestionIndex() / 60) * 100)}% Complete
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div
                    style={{
                      height: '6px',
                      background: 'rgba(255,255,255,0.1)',
                      'border-radius': '3px',
                      'margin-bottom': '40px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(currentQuestionIndex() / 60) * 100}%`,
                        background: currentTheme().gradients.primary,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  <h3
                    style={{
                      'font-family': maximalist.fonts.heading,
                      'font-size': '28px',
                      'margin-bottom': '48px',
                      'text-align': 'center',
                      'line-height': '1.4',
                    }}
                  >
                    {questions()[currentQuestionIndex()].text}
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      'grid-template-columns': 'repeat(5, 1fr)',
                      gap: '12px',
                      'margin-bottom': '24px',
                    }}
                  >
                    <For
                      each={[
                        { val: 1, label: 'Strongly Dislike', color: '#EF4444' },
                        { val: 2, label: 'Dislike', color: '#F87171' },
                        { val: 3, label: 'Unsure', color: '#9CA3AF' },
                        { val: 4, label: 'Like', color: '#34D399' },
                        { val: 5, label: 'Strongly Like', color: '#10B981' },
                      ]}
                    >
                      {(opt) => (
                        <button
                          onClick={() => handleAnswer(opt.val)}
                          style={{
                            padding: '16px 8px',
                            background: 'rgba(255,255,255,0.05)',
                            border: `2px solid ${opt.color}`,
                            'border-radius': maximalist.radii.md,
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            'flex-direction': 'column',
                            'align-items': 'center',
                            gap: '8px',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = `${opt.color}20`)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')
                          }
                        >
                          <span
                            style={{ 'font-size': '24px', 'font-weight': 'bold', color: opt.color }}
                          >
                            {opt.val === 1
                              ? '😡'
                              : opt.val === 2
                                ? '🙁'
                                : opt.val === 3
                                  ? '😐'
                                  : opt.val === 4
                                    ? '🙂'
                                    : '😍'}
                          </span>
                          <span style={{ 'font-size': '12px', 'text-align': 'center' }}>
                            {opt.label}
                          </span>
                        </button>
                      )}
                    </For>
                  </div>
                </div>
              </Show>

              <Show when={assessmentState() === 'results' && riasecScore()}>
                <div
                  style={{
                    'max-width': '1000px',
                    margin: '0 auto',
                    'text-align': 'left',
                  }}
                >
                  {/* Archetype Hero Section */}
                  <div
                    style={{
                      background: `linear-gradient(180deg, ${maximalist.colors.surface} 0%, rgba(30, 30, 30, 0) 100%)`,
                      'border-radius': maximalist.radii.lg,
                      padding: '48px',
                      'margin-bottom': '40px',
                      position: 'relative',
                      overflow: 'hidden',
                      'box-shadow': currentTheme().shadows.lg,
                      border: `1px solid ${maximalist.colors.border}`,
                      'text-align': 'center',
                    }}
                  >
                    <div style={{ 'margin-bottom': '32px' }}>
                      <RadarChart scores={riasecScore()!} />
                    </div>

                    <h2
                      style={{
                        color: maximalist.colors.accent,
                        'font-size': '14px',
                        'text-transform': 'uppercase',
                        'letter-spacing': '2px',
                        'margin-bottom': '12px',
                        'font-weight': '600',
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        gap: '12px',
                      }}
                    >
                      <span
                        style={{ color: (maximalist.riasec as any)[hybridArchetype()!.types[0]] }}
                      >
                        {hybridArchetype()!.types[0]}
                      </span>
                      <span style={{ color: maximalist.colors.textMuted }}>+</span>
                      <span
                        style={{ color: (maximalist.riasec as any)[hybridArchetype()!.types[1]] }}
                      >
                        {hybridArchetype()!.types[1]}
                      </span>
                    </h2>

                    <h1
                      style={{
                        'font-family': maximalist.fonts.heading,
                        'font-size': '56px',
                        'margin-bottom': '24px',
                        'font-weight': '700',
                        background: currentTheme().gradients.primary,
                        '-webkit-background-clip': 'text',
                        'background-clip': 'text',
                        color: 'transparent',
                        filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))',
                        // Fallback for readability if gradient fails or clip not supported
                        'text-shadow': '0 0 1px rgba(255,255,255,0.5)',
                      }}
                    >
                      {hybridArchetype()?.title}
                    </h1>

                    <p
                      style={{
                        color: maximalist.colors.text,
                        'font-size': '20px',
                        'line-height': '1.6',
                        'max-width': '600px',
                        margin: '0 auto 32px',
                      }}
                    >
                      {hybridArchetype()?.description}
                    </p>
                  </div>

                  {/* Detailed Breakdown */}
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
                      'grid-template-columns': 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '24px',
                      'margin-bottom': '48px',
                    }}
                  >
                    <For each={sortedScores()}>
                      {(item) => {
                        const riasecColor = (maximalist.riasec as any)[item.key];
                        return (
                          <div
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              padding: '24px',
                              'border-radius': maximalist.radii.lg,
                              border: `1px solid ${riasecColor}40`,
                              position: 'relative',
                              overflow: 'hidden',
                              transition: 'transform 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          >
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
                                  color: riasecColor,
                                  margin: 0,
                                  'font-family': maximalist.fonts.heading,
                                  'text-transform': 'uppercase',
                                  'letter-spacing': '1px',
                                }}
                              >
                                {item.title}
                              </h4>
                              <div
                                style={{
                                  'font-size': '24px',
                                  'font-weight': 'bold',
                                  color: 'white',
                                }}
                              >
                                {item.score}
                              </div>
                            </div>

                            {/* Bar */}
                            <div
                              style={{
                                height: '4px',
                                background: 'rgba(255,255,255,0.1)',
                                'border-radius': '2px',
                                'margin-bottom': '16px',
                              }}
                            >
                              <div
                                style={{
                                  width: `${(item.score / 40) * 100}%`,
                                  height: '100%',
                                  background: riasecColor,
                                  'box-shadow': `0 0 10px ${riasecColor}`,
                                }}
                              />
                            </div>

                            <p
                              style={{
                                color: maximalist.colors.textMuted,
                                'font-size': '14px',
                                'line-height': '1.5',
                                margin: 0,
                              }}
                            >
                              {item.description}
                            </p>
                          </div>
                        );
                      }}
                    </For>
                  </div>

                  {/* Career Matches */}
                  <h3
                    style={{
                      'font-family': maximalist.fonts.heading,
                      'font-size': '32px',
                      'margin-bottom': '24px',
                      color: maximalist.colors.text,
                    }}
                  >
                    Recommended Careers
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      'grid-template-columns': 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '24px',
                      'margin-bottom': '48px',
                    }}
                  >
                    <Show
                      when={!isLoading()}
                      fallback={
                        <div style={{ 'grid-column': '1/-1', 'text-align': 'center' }}>
                          Loading recommendations...
                        </div>
                      }
                    >
                      <For each={careerMatches()}>
                        {(career) => (
                          <div
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              'border-radius': maximalist.radii.md,
                              padding: '24px',
                              border: `1px solid ${maximalist.colors.border}`,
                              transition: 'transform 0.2s',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.transform = 'translateY(-4px)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.transform = 'translateY(0)')
                            }
                          >
                            <div
                              style={{
                                display: 'flex',
                                'justify-content': 'space-between',
                                'align-items': 'flex-start',
                                'margin-bottom': '12px',
                              }}
                            >
                              {career.tags.bright_outlook && (
                                <span
                                  style={{
                                    background: `${maxPalette.teal}30`,
                                    color: maxPalette.teal,
                                    'font-size': '10px',
                                    padding: '4px 8px',
                                    'border-radius': '12px',
                                    'font-weight': 'bold',
                                    'text-transform': 'uppercase',
                                  }}
                                >
                                  Bright Outlook
                                </span>
                              )}
                              <CartoonBadge fit={career.fit} />
                            </div>

                            <h4
                              style={{
                                'font-size': '18px',
                                'font-weight': '600',
                                color: 'white',
                                'margin-bottom': '8px',
                              }}
                            >
                              {career.title}
                            </h4>

                            <div
                              style={{
                                color: maximalist.colors.textMuted,
                                'font-size': '12px',
                                'margin-bottom': '16px',
                              }}
                            >
                              Code: {career.code}
                            </div>

                            <button
                              onClick={() => handleJobClick(career.code)}
                              disabled={isJobLoading()}
                              style={{
                                width: '100%',
                                padding: '12px',
                                background: 'transparent',
                                border: `1px solid ${currentTheme().colors.primary}`,
                                color: currentTheme().colors.primary,
                                'border-radius': '8px',
                                cursor: isJobLoading() ? 'wait' : 'pointer',
                                'font-weight': '600',
                                transition: 'all 0.2s',
                                opacity: isJobLoading() ? 0.7 : 1,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = currentTheme().colors.primary;
                                e.currentTarget.style.color = currentTheme().colors.textOnPrimary;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = currentTheme().colors.primary;
                              }}
                            >
                              {isJobLoading() ? 'Loading...' : 'Explore Role'}
                            </button>
                          </div>
                        )}
                      </For>
                    </Show>
                  </div>

                  {/* O*NET Attribution */}
                  <div style={{ 'text-align': 'center', 'margin-top': '48px' }}>
                    <button
                      onClick={resetAssessment}
                      style={{
                        padding: '12px 24px',
                        background: 'transparent',
                        border: `1px solid ${currentTheme().colors.border}`,
                        'border-radius': maximalist.radii.md,
                        color: currentTheme().colors.textMuted,
                        'font-size': '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = currentTheme().colors.primary;
                        e.currentTarget.style.color = currentTheme().colors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = currentTheme().colors.border;
                        e.currentTarget.style.color = currentTheme().colors.textMuted;
                      }}
                    >
                      Retake Assessment
                    </button>
                  </div>

                  <footer
                    style={{
                      'margin-top': '64px',
                      'padding-top': '24px',
                      'border-top': `1px solid ${maximalist.colors.border}`,
                      'text-align': 'center',
                      color: maximalist.colors.textMuted,
                      'font-size': '12px',
                      'line-height': '1.5',
                    }}
                  >
                    <p style={{ 'max-width': '600px', margin: '0 auto' }}>
                      This site incorporates information from O*NET Web Services by the U.S.
                      Department of Labor, Employment and Training Administration (USDOL/ETA).
                      O*NET® is a trademark of USDOL/ETA.
                    </p>
                  </footer>
                </div>
              </Show>
            </div>
          )}
        </main>

        <Show when={selectedJob()}>
          <JobDetailModal job={selectedJob()!} onClose={() => setSelectedJob(null)} />
        </Show>
      </div>
    </div>
  );
};
