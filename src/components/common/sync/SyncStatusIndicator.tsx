/**
 * SyncStatusIndicator - Shows current sync state
 *
 * Small, unobtrusive indicator for header/toolbar placement.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, createMemo } from 'solid-js';
import type { SyncStatus } from '../../../lib/sync/types';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  lastSyncedAt: string | null;
  onSyncNow?: () => void;
  showLabel?: boolean;
}

// Icons as inline SVGs
const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    style={{ animation: 'spin 1s linear infinite' }}
  >
    <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4m-3.93 7.07l-2.83-2.83M6.76 6.76L3.93 3.93" />
  </svg>
);

const WarningIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
  >
    <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CloudOffIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
  >
    <path d="M2 2l20 20M17 17H8a5 5 0 01-.78-9.94M9.17 4.5A7 7 0 0119 10c1.3.1 2.4.6 3.3 1.3" />
  </svg>
);

const AlertIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
  >
    <path d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
);

const STATUS_CONFIG: Record<
  SyncStatus,
  { icon: Component; color: string; bg: string; label: string }
> = {
  idle: {
    icon: CheckIcon,
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.1)',
    label: 'Synced',
  },
  syncing: {
    icon: SpinnerIcon,
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.1)',
    label: 'Syncing...',
  },
  error: {
    icon: WarningIcon,
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    label: 'Sync Error',
  },
  offline: {
    icon: CloudOffIcon,
    color: '#6B7280',
    bg: 'rgba(107, 114, 128, 0.1)',
    label: 'Offline',
  },
  conflict: {
    icon: AlertIcon,
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.1)',
    label: 'Conflict',
  },
};

function formatLastSynced(timestamp: string | null): string {
  if (!timestamp) return 'Never synced';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export const SyncStatusIndicator: Component<SyncStatusIndicatorProps> = (props) => {
  const config = createMemo(() => STATUS_CONFIG[props.status]);

  return (
    <div
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '8px',
      }}
    >
      {/* Status badge */}
      <div
        title={`${config().label} - Last sync: ${formatLastSynced(props.lastSyncedAt)}`}
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: '6px',
          padding: '4px 8px',
          'border-radius': '6px',
          background: config().bg,
          color: config().color,
          'font-size': '12px',
          'font-weight': '500',
          cursor: 'default',
        }}
      >
        {config().icon({})}
        <Show when={props.showLabel}>
          <span>{config().label}</span>
        </Show>
      </div>

      {/* Sync Now button */}
      <Show when={props.onSyncNow && props.status !== 'syncing'}>
        <button
          onClick={props.onSyncNow}
          title="Sync now"
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            padding: '4px 8px',
            'border-radius': '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.6)',
            'font-size': '11px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          }}
        >
          Sync
        </button>
      </Show>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SyncStatusIndicator;
