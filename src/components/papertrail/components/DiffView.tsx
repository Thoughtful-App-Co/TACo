/**
 * Paper Trail - DiffView Component
 * Shows all detected article changes
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show, createMemo } from 'solid-js';
import { ChangelogEntry, ChangeType } from '../../../schemas/papertrail.schema';
import { papertrail, yellowScale } from '../../../theme/papertrail';
import { DiffCard } from './DiffCard';

interface DiffViewProps {
  changelog: ChangelogEntry[];
  stats: {
    totalChanges: number;
    changesByType: Record<ChangeType, number>;
  };
}

export const DiffView: Component<DiffViewProps> = (props) => {
  // Group changes by date
  const groupedChanges = createMemo(() => {
    const groups: Record<string, ChangelogEntry[]> = {};

    for (const entry of props.changelog) {
      const date = new Date(entry.detectedAt);
      const key = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    }

    return Object.entries(groups);
  });

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2
          style={{
            margin: '0 0 8px',
            'font-family': papertrail.fonts.heading,
            'font-size': '20px',
            'font-weight': 700,
            color: papertrail.colors.text,
          }}
        >
          Article Changes
        </h2>
        <p
          style={{
            margin: 0,
            'font-size': '14px',
            color: papertrail.colors.textMuted,
          }}
        >
          Track corrections, updates, and retractions across news sources
        </p>
      </div>

      {/* Stats */}
      <Show when={props.stats.totalChanges > 0}>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            'flex-wrap': 'wrap',
          }}
        >
          <StatBox
            label="Total Changes"
            value={props.stats.totalChanges}
            color={papertrail.colors.text}
          />
          <StatBox
            label="Corrections"
            value={props.stats.changesByType.correction}
            color={yellowScale[600]}
          />
          <StatBox
            label="Retractions"
            value={props.stats.changesByType.retraction}
            color="#DC2626"
          />
          <StatBox
            label="Updates"
            value={props.stats.changesByType.update}
            color={papertrail.colors.textMuted}
          />
        </div>
      </Show>

      {/* Empty State */}
      <Show when={props.changelog.length === 0}>
        <div
          style={{
            padding: '48px 24px',
            'text-align': 'center',
            background: papertrail.colors.background,
            border: `1px solid ${papertrail.colors.border}`,
            'border-radius': papertrail.radii.organic,
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              background: yellowScale[50],
              'border-radius': '50%',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill={yellowScale[500]}>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
          <h3
            style={{
              margin: '0 0 8px',
              'font-family': papertrail.fonts.heading,
              'font-size': '18px',
              color: papertrail.colors.text,
            }}
          >
            No Changes Detected
          </h3>
          <p
            style={{
              margin: 0,
              'font-size': '14px',
              color: papertrail.colors.textMuted,
              'max-width': '400px',
              'margin-left': 'auto',
              'margin-right': 'auto',
            }}
          >
            Paper Trail will detect changes when articles are updated after your initial fetch. Keep
            refreshing to track modifications over time.
          </p>
        </div>
      </Show>

      {/* Grouped Changes */}
      <For each={groupedChanges()}>
        {([date, entries]) => (
          <div>
            {/* Date Header */}
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '12px',
                'margin-bottom': '16px',
              }}
            >
              <span
                style={{
                  'font-family': papertrail.fonts.heading,
                  'font-size': '13px',
                  'font-weight': 600,
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.05em',
                  color: papertrail.colors.textMuted,
                }}
              >
                {date}
              </span>
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background: papertrail.colors.border,
                }}
              />
              <span
                style={{
                  'font-size': '12px',
                  color: papertrail.colors.textMuted,
                }}
              >
                {entries.length} change{entries.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Changes List */}
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
              <For each={entries}>{(entry) => <DiffCard entry={entry} />}</For>
            </div>
          </div>
        )}
      </For>
    </div>
  );
};

// Stat Box Component
interface StatBoxProps {
  label: string;
  value: number;
  color: string;
}

const StatBox: Component<StatBoxProps> = (props) => {
  return (
    <div
      style={{
        padding: '12px 20px',
        background: papertrail.colors.surface,
        border: `1px solid ${papertrail.colors.border}`,
        'border-radius': papertrail.radii.organic,
        'text-align': 'center',
      }}
    >
      <div
        style={{
          'font-family': papertrail.fonts.heading,
          'font-size': '24px',
          'font-weight': 700,
          color: props.color,
          'line-height': 1,
        }}
      >
        {props.value}
      </div>
      <div
        style={{
          'margin-top': '4px',
          'font-size': '11px',
          'text-transform': 'uppercase',
          'letter-spacing': '0.05em',
          color: papertrail.colors.textMuted,
        }}
      >
        {props.label}
      </div>
    </div>
  );
};
