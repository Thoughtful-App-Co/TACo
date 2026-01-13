/**
 * SankeyTooltip - Minimalist tooltip showing application list on Sankey node hover
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createMemo, For, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { liquidTenure, statusColors } from '../theme/liquid-tenure';
import {
  JobApplication,
  ApplicationStatus,
  STATUS_LABELS,
  daysSince,
} from '../../../../schemas/pipeline.schema';

interface SankeyTooltipProps {
  status: ApplicationStatus;
  applications: JobApplication[];
  theme: () => typeof liquidTenure;
  position: { x: number; y: number; alignRight?: boolean };
}

const DESIGN = {
  fonts: {
    heading: liquidTenure.fonts.heading,
    body: liquidTenure.fonts.body,
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

  // Sort applications reverse chronologically and group by domain
  const appsByDomain = createMemo(() => {
    // Sort reverse chronologically first
    const sorted = [...props.applications].sort((a, b) => {
      const dateA = a.appliedAt || a.createdAt;
      const dateB = b.appliedAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    // Group by domain (extract domain from company email if available, otherwise use company name)
    const grouped = new Map<string, typeof sorted>();

    sorted.forEach((app) => {
      let domain = 'Unknown';

      // Try to extract domain from company name if it looks like an email
      if (app.companyName && app.companyName.includes('@')) {
        const parts = app.companyName.split('@');
        if (parts.length > 1) {
          domain = parts[1];
        }
      } else {
        // Otherwise, use company name as the grouping key
        domain = app.companyName || 'Unknown';
      }

      if (!grouped.has(domain)) {
        grouped.set(domain, []);
      }
      grouped.get(domain)!.push(app);
    });

    return grouped;
  });

  // Calculate total count and average age
  const totalCount = () => {
    let count = 0;
    appsByDomain().forEach((apps) => (count += apps.length));
    return count;
  };

  const averageAge = () => {
    let totalAge = 0;
    let totalApps = 0;
    appsByDomain().forEach((apps) => {
      apps.forEach((app) => {
        totalAge += getApplicationAge(app);
        totalApps++;
      });
    });
    return totalApps > 0 ? Math.round(totalAge / totalApps) : 0;
  };

  return (
    <Portal>
      <div
        style={{
          position: 'fixed',
          top: `${props.position.y}px`,
          left: `${props.position.x}px`,
          transform: props.position.alignRight
            ? 'translate(-100%, -50%)' // Align right edge to position
            : 'translateY(-50%)', // Align left edge to position
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

        {/* Domain Sections */}
        <div
          style={{
            padding: `${DESIGN.spacing.sm}px ${DESIGN.spacing.md}px`,
          }}
        >
          <For each={Array.from(appsByDomain().entries()).slice(0, 3)}>
            {([domain, apps], domainIndex) => (
              <div
                style={{
                  'margin-bottom':
                    domainIndex() < Array.from(appsByDomain().keys()).length - 1
                      ? `${DESIGN.spacing.md}px`
                      : '0',
                }}
              >
                {/* Domain Header */}
                <div
                  style={{
                    'font-size': '11px',
                    'font-family': DESIGN.fonts.body,
                    'font-weight': '600',
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.05em',
                    color: color().text,
                    'margin-bottom': `${DESIGN.spacing.xs}px`,
                    'padding-bottom': `${DESIGN.spacing.xs}px`,
                    'border-bottom': `1px solid ${color().border}`,
                  }}
                >
                  {domain} ({apps.length})
                </div>

                {/* Apps in this domain */}
                <div style={{ 'margin-top': `${DESIGN.spacing.xs}px` }}>
                  <For each={apps.slice(0, 3)}>
                    {(app, index) => (
                      <div
                        style={{
                          display: 'flex',
                          'flex-direction': 'column',
                          gap: '2px',
                          padding: `${DESIGN.spacing.xs}px 0`,
                          'font-size': '11px',
                          'line-height': '1.3',
                        }}
                      >
                        {/* Job Title */}
                        <div
                          style={{
                            'font-weight': '500',
                            color: theme().colors.text,
                            overflow: 'hidden',
                            'text-overflow': 'ellipsis',
                            'white-space': 'nowrap',
                          }}
                        >
                          {app.roleName}
                        </div>

                        {/* Age + Company */}
                        <div
                          style={{
                            color: theme().colors.textMuted,
                            overflow: 'hidden',
                            'text-overflow': 'ellipsis',
                            'white-space': 'nowrap',
                            'font-size': '10px',
                          }}
                        >
                          {getApplicationAge(app)} days • {app.companyName}
                        </div>
                      </div>
                    )}
                  </For>

                  {/* Overflow for this domain */}
                  <Show when={apps.length > 3}>
                    <div
                      style={{
                        'font-size': '10px',
                        'font-family': DESIGN.fonts.body,
                        color: theme().colors.textMuted,
                        'font-style': 'italic',
                        'margin-top': `${DESIGN.spacing.xs}px`,
                      }}
                    >
                      +{apps.length - 3} more
                    </div>
                  </Show>
                </div>
              </div>
            )}
          </For>

          {/* Summary Footer */}
          <div
            style={{
              'margin-top': `${DESIGN.spacing.md}px`,
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
    </Portal>
  );
};

export default SankeyTooltip;
