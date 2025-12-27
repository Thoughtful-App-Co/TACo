/**
 * Paper Trail - Story Cluster Card
 * Displays a unified story cluster with AI summary, significance, and metadata
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, For } from 'solid-js';
import { StoryCluster } from '../../../schemas/papertrail.schema';
import { papertrail, yellowScale } from '../../../theme/papertrail';

export interface StoryClusterCardProps {
  cluster: StoryCluster;
  articleCount: number;
  onExpand: () => void;
  isExpanded: boolean;
}

const SIGNIFICANCE_STYLES = {
  low: {
    bg: papertrail.colors.background,
    border: papertrail.colors.border,
    text: papertrail.colors.textMuted,
    label: 'LOW',
  },
  medium: {
    bg: yellowScale[50],
    border: yellowScale[400],
    text: yellowScale[900],
    label: 'MEDIUM',
  },
  high: {
    bg: yellowScale[500],
    border: '#000000',
    text: '#000000',
    label: 'HIGH',
  },
} as const;

export const StoryClusterCard: Component<StoryClusterCardProps> = (props) => {
  const sigStyle = () => SIGNIFICANCE_STYLES[props.cluster.significance];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: `3px solid ${props.isExpanded ? yellowScale[500] : '#000000'}`,
        'box-shadow': props.isExpanded ? '6px 6px 0 #000000' : '4px 4px 0 #000000',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onClick={props.onExpand}
      onMouseEnter={(e) => {
        if (!props.isExpanded) {
          e.currentTarget.style.transform = 'translate(-2px, -2px)';
          e.currentTarget.style.boxShadow = '6px 6px 0 #000000';
        }
      }}
      onMouseLeave={(e) => {
        if (!props.isExpanded) {
          e.currentTarget.style.transform = 'translate(0, 0)';
          e.currentTarget.style.boxShadow = '4px 4px 0 #000000';
        }
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          'align-items': 'flex-start',
          gap: '12px',
          'margin-bottom': '12px',
        }}
      >
        {/* Significance Badge */}
        <div
          style={{
            padding: '4px 10px',
            background: sigStyle().bg,
            border: `2px solid ${sigStyle().border}`,
            'font-family': papertrail.fonts.heading,
            'font-size': '10px',
            'font-weight': 800,
            'letter-spacing': '0.1em',
            color: sigStyle().text,
            'flex-shrink': 0,
          }}
        >
          {sigStyle().label}
        </div>

        {/* Metadata */}
        <div style={{ flex: 1, 'min-width': 0 }}>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              'font-size': '12px',
              color: papertrail.colors.textMuted,
              'flex-wrap': 'wrap',
            }}
          >
            <span style={{ 'font-weight': 600 }}>{props.articleCount} articles</span>
            <span>•</span>
            <span>{formatDate(props.cluster.lastUpdatedAt)}</span>
            <Show when={props.cluster.updateCount > 0}>
              <span>•</span>
              <span style={{ color: yellowScale[700], 'font-weight': 600 }}>
                {props.cluster.updateCount} update{props.cluster.updateCount !== 1 ? 's' : ''}
              </span>
            </Show>
          </div>
        </div>
      </div>

      {/* Title */}
      <h3
        style={{
          margin: '0 0 12px 0',
          'font-family': papertrail.fonts.heading,
          'font-size': '22px',
          'font-weight': 800,
          'line-height': 1.3,
          color: '#000000',
          'letter-spacing': '-0.01em',
        }}
      >
        {props.cluster.title}
      </h3>

      {/* Summary */}
      <p
        style={{
          margin: '0 0 12px 0',
          'font-size': '14px',
          'line-height': 1.6,
          color: papertrail.colors.text,
        }}
      >
        {props.cluster.summary}
      </p>

      {/* Topics */}
      <Show when={props.cluster.topics.length > 0}>
        <div style={{ display: 'flex', gap: '8px', 'flex-wrap': 'wrap' }}>
          <For each={props.cluster.topics}>
            {(topic) => (
              <span
                style={{
                  padding: '4px 10px',
                  background: papertrail.colors.background,
                  border: `1px solid ${papertrail.colors.border}`,
                  'font-size': '11px',
                  'font-weight': 600,
                  color: papertrail.colors.textMuted,
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.05em',
                }}
              >
                {topic}
              </span>
            )}
          </For>
        </div>
      </Show>

      {/* Expand Indicator */}
      <Show when={!props.isExpanded}>
        <div
          style={{
            'margin-top': '12px',
            'padding-top': '12px',
            'border-top': `2px solid ${papertrail.colors.border}`,
            'font-size': '12px',
            'font-weight': 600,
            color: yellowScale[700],
            'text-align': 'center',
          }}
        >
          Click to view articles & changelog ↓
        </div>
      </Show>
    </div>
  );
};
