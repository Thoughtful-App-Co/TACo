/**
 * StatusTimeline - Visual timeline of application status changes
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show } from 'solid-js';
import { liquidTenure, statusColors } from '../theme/liquid-tenure';
import { StatusChange } from '../../../../schemas/pipeline.schema';
import { formatDistanceToNow } from 'date-fns';

interface StatusTimelineProps {
  statusHistory: StatusChange[];
  currentStatus: string;
  theme?: () => typeof liquidTenure;
}

export const StatusTimeline: Component<StatusTimelineProps> = (props) => {
  const theme = () => props.theme?.() || liquidTenure;

  // Sort by timestamp (newest first)
  const sortedHistory = () =>
    [...props.statusHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        gap: '0',
        position: 'relative',
      }}
    >
      {/* Timeline line */}
      <div
        style={{
          position: 'absolute',
          left: '12px',
          top: '16px',
          bottom: '16px',
          width: '2px',
          background: 'rgba(255, 255, 255, 0.1)',
          'z-index': '0',
        }}
      />

      <For each={sortedHistory()}>
        {(change, index) => {
          // Use reactive getter to ensure CURRENT tag updates when list changes
          const isCurrent = () => index() === 0 && change.status === props.currentStatus;
          const isFirst = () => index() === 0;
          const statusColor = statusColors[change.status] || statusColors.saved;
          const timestamp = new Date(change.timestamp);

          return (
            <div
              style={{
                display: 'flex',
                gap: '16px',
                'align-items': 'flex-start',
                padding: '12px 0',
                position: 'relative',
                'z-index': '1',
              }}
            >
              {/* Status indicator dot */}
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  width: '26px',
                  height: '26px',
                  'border-radius': '50%',
                  background: isFirst() ? statusColor.bg : 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${statusColor.border}`,
                  'box-shadow': isFirst() ? `0 0 12px ${statusColor.text}40` : 'none',
                  'flex-shrink': '0',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    'border-radius': '50%',
                    background: statusColor.text,
                  }}
                />
              </div>

              {/* Content */}
              <div style={{ flex: 1, 'padding-top': '2px' }}>
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'baseline',
                    gap: '8px',
                    'flex-wrap': 'wrap',
                  }}
                >
                  <span
                    style={{
                      'font-size': '14px',
                      'font-family': theme().fonts.body,
                      'font-weight': isFirst() ? '600' : '500',
                      color: isFirst() ? statusColor.text : theme().colors.text,
                    }}
                  >
                    {change.status.charAt(0).toUpperCase() + change.status.slice(1)}
                  </span>
                  <Show when={isCurrent()}>
                    <span
                      style={{
                        'font-size': '11px',
                        'font-family': theme().fonts.body,
                        'font-weight': '600',
                        color: statusColor.text,
                        background: statusColor.bg,
                        padding: '2px 8px',
                        'border-radius': '4px',
                        border: `1px solid ${statusColor.border}`,
                      }}
                    >
                      CURRENT
                    </span>
                  </Show>
                </div>

                <div
                  style={{
                    'font-size': '12px',
                    'font-family': theme().fonts.body,
                    color: theme().colors.textMuted,
                    'margin-top': '4px',
                  }}
                >
                  {timestamp.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  <span style={{ margin: '0 6px', opacity: 0.5 }}>•</span>
                  {formatDistanceToNow(timestamp, { addSuffix: true })}
                </div>

                <Show when={change.note}>
                  <div
                    style={{
                      'font-size': '13px',
                      'font-family': theme().fonts.body,
                      color: theme().colors.textMuted,
                      'margin-top': '6px',
                      'font-style': 'italic',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      'border-radius': '6px',
                      'border-left': `3px solid ${statusColor.border}`,
                    }}
                  >
                    "{change.note}"
                  </div>
                </Show>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
};

export default StatusTimeline;
