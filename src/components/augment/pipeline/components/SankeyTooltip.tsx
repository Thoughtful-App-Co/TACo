/**
 * SankeyTooltip - Minimalist tooltip showing application list on Sankey node hover
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createMemo, For } from 'solid-js';
import { liquidAugment, statusColors } from '../theme/liquid-augment';
import {
  JobApplication,
  ApplicationStatus,
  STATUS_LABELS,
  daysSince,
} from '../../../../schemas/pipeline.schema';

interface SankeyTooltipProps {
  status: ApplicationStatus;
  applications: JobApplication[];
  theme: () => typeof liquidAugment;
  position: { x: number; y: number };
}

const DESIGN = {
  fonts: {
    heading: liquidAugment.fonts.heading,
    body: liquidAugment.fonts.body,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
  },
  radii: {
    md: 10,
  },
};

/**
 * Calculate the application age - use appliedAt if available, fallback to createdAt
 */
function getApplicationAge(app: JobApplication): number {
  const referenceDate = app.appliedAt || app.createdAt;
  return daysSince(referenceDate);
}

export const SankeyTooltip: Component<SankeyTooltipProps> = (props) => {
  const theme = () => props.theme();
  const color = () => statusColors[props.status];

  // Sort applications reverse chronologically
  const sortedApps = createMemo(() => {
    return [...props.applications].sort((a, b) => {
      const dateA = a.appliedAt || a.createdAt;
      const dateB = b.appliedAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  });

  // Top 6
  const topSix = () => sortedApps().slice(0, 6);
  const totalCount = () => sortedApps().length;

  // Average age of ALL applications in this status
  const averageAge = () => {
    const apps = sortedApps();
    if (apps.length === 0) return 0;
    return Math.round(apps.reduce((sum, app) => sum + getApplicationAge(app), 0) / apps.length);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: `${props.position.y}px`,
        left: `${props.position.x}px`,
        transform: 'translate(-50%, -50%)',
        'min-width': '280px',
        'max-width': '320px',
        background: 'linear-gradient(135deg, rgba(15, 15, 22, 0.98), rgba(10, 10, 15, 0.98))',
        border: `1px solid ${color().border}`,
        'border-radius': `${DESIGN.radii.md}px`,
        'box-shadow': `0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px ${color().text}15`,
        'z-index': 1000,
        overflow: 'hidden',
        'backdrop-filter': 'blur(12px)',
        'pointer-events': 'none',
      }}
    >
      {/* Tooltip Header */}
      <div
        style={{
          padding: `${DESIGN.spacing.sm}px ${DESIGN.spacing.md}px`,
          background: `linear-gradient(135deg, ${color().bg}, transparent)`,
          'border-bottom': `1px solid ${color().border}`,
        }}
      >
        <div
          style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between' }}
        >
          <h4
            style={{
              margin: 0,
              'font-size': '11px',
              'font-family': DESIGN.fonts.body,
              'font-weight': '600',
              'text-transform': 'uppercase',
              'letter-spacing': '0.05em',
              color: color().text,
            }}
          >
            {STATUS_LABELS[props.status]}
          </h4>
          <div
            style={{
              'font-size': '14px',
              'font-family': DESIGN.fonts.heading,
              'font-weight': '700',
              color: color().text,
            }}
          >
            {totalCount()}
          </div>
        </div>
      </div>

      {/* Application List - Minimalist, no containers */}
      <div
        style={{
          padding: `${DESIGN.spacing.sm}px ${DESIGN.spacing.md}px`,
        }}
      >
        <For each={topSix()}>
          {(app, index) => (
            <div
              style={{
                display: 'flex',
                'flex-direction': 'column',
                gap: '2px',
                padding: `${DESIGN.spacing.xs}px 0`,
                'border-bottom':
                  index() < topSix().length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
              }}
            >
              {/* Job Title */}
              <div
                style={{
                  'font-size': '12px',
                  'font-family': DESIGN.fonts.body,
                  'font-weight': '500',
                  color: theme().colors.text,
                  overflow: 'hidden',
                  'text-overflow': 'ellipsis',
                  'white-space': 'nowrap',
                }}
              >
                {app.roleName}
              </div>

              {/* Age + Company - single line */}
              <div
                style={{
                  'font-size': '10px',
                  'font-family': DESIGN.fonts.body,
                  color: theme().colors.textMuted,
                  overflow: 'hidden',
                  'text-overflow': 'ellipsis',
                  'white-space': 'nowrap',
                }}
              >
                {getApplicationAge(app)} days • {app.companyName}
              </div>
            </div>
          )}
        </For>

        {/* Summary Footer */}
        <div
          style={{
            'margin-top': `${DESIGN.spacing.sm}px`,
            'padding-top': `${DESIGN.spacing.sm}px`,
            'border-top': `1px solid ${color().border}`,
            'font-size': '11px',
            'font-family': DESIGN.fonts.body,
            color: theme().colors.textMuted,
            'text-align': 'center',
          }}
        >
          +{totalCount()} applications, average age {averageAge()} days
        </div>
      </div>
    </div>
  );
};

export default SankeyTooltip;
