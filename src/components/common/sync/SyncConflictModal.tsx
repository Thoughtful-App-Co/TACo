/**
 * SyncConflictModal - Conflict resolution UI
 *
 * Shows when server has newer data than local.
 * User chooses to keep local or use server data.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, createSignal } from 'solid-js';
import type { SyncConflict } from '../../../lib/sync/types';

interface SyncConflictModalProps {
  isOpen: boolean;
  conflict: SyncConflict | null;
  onResolve: (choice: 'local' | 'remote') => void;
  onClose: () => void;
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDeviceId(deviceId: string): string {
  // Show first 8 chars of device ID
  return deviceId.substring(0, 8) + '...';
}

export const SyncConflictModal: Component<SyncConflictModalProps> = (props) => {
  const [isResolving, setIsResolving] = createSignal(false);

  const handleResolve = async (choice: 'local' | 'remote') => {
    setIsResolving(true);
    try {
      props.onResolve(choice);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Show when={props.isOpen && props.conflict}>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          'z-index': 9999,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          padding: '20px',
        }}
      >
        {/* Backdrop */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            'backdrop-filter': 'blur(4px)',
          }}
        />

        {/* Modal */}
        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
            'border-radius': '16px',
            width: '100%',
            'max-width': '480px',
            'box-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              padding: '24px',
              'text-align': 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                background: 'rgba(255, 255, 255, 0.2)',
                'border-radius': '12px',
                margin: '0 auto 12px',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="2"
              >
                <path d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2
              style={{
                margin: 0,
                'font-size': '20px',
                'font-weight': '700',
                color: 'white',
              }}
            >
              Sync Conflict
            </h2>
            <p
              style={{
                margin: '8px 0 0',
                'font-size': '14px',
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              Your data has been modified on another device
            </p>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {/* Comparison cards */}
            <div
              style={{
                display: 'grid',
                'grid-template-columns': '1fr 1fr',
                gap: '12px',
                'margin-bottom': '20px',
              }}
            >
              {/* Local data card */}
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  'border-radius': '10px',
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    'font-size': '12px',
                    'font-weight': '600',
                    color: '#3B82F6',
                    'margin-bottom': '8px',
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.5px',
                  }}
                >
                  Your Device
                </div>
                <div
                  style={{
                    'font-size': '24px',
                    'font-weight': '700',
                    color: 'white',
                    'margin-bottom': '4px',
                  }}
                >
                  v{props.conflict?.localVersion}
                </div>
                <div
                  style={{
                    'font-size': '12px',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {props.conflict?.localModified
                    ? formatDate(props.conflict.localModified)
                    : 'Unknown'}
                </div>
              </div>

              {/* Server data card */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  'border-radius': '10px',
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    'font-size': '12px',
                    'font-weight': '600',
                    color: '#10B981',
                    'margin-bottom': '8px',
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.5px',
                  }}
                >
                  Server
                </div>
                <div
                  style={{
                    'font-size': '24px',
                    'font-weight': '700',
                    color: 'white',
                    'margin-bottom': '4px',
                  }}
                >
                  v{props.conflict?.serverVersion}
                </div>
                <div
                  style={{
                    'font-size': '12px',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {props.conflict?.serverModified
                    ? formatDate(props.conflict.serverModified)
                    : 'Unknown'}
                </div>
                <Show when={props.conflict?.serverDeviceId}>
                  <div
                    style={{
                      'font-size': '11px',
                      color: 'rgba(255, 255, 255, 0.4)',
                      'margin-top': '4px',
                    }}
                  >
                    Device: {formatDeviceId(props.conflict!.serverDeviceId)}
                  </div>
                </Show>
              </div>
            </div>

            {/* Warning */}
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                'border-radius': '8px',
                padding: '12px',
                'margin-bottom': '20px',
              }}
            >
              <p
                style={{
                  margin: 0,
                  'font-size': '13px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  'line-height': '1.5',
                }}
              >
                Choosing one option will discard the other. This cannot be undone.
              </p>
            </div>

            {/* Action buttons */}
            <div
              style={{
                display: 'grid',
                'grid-template-columns': '1fr 1fr',
                gap: '12px',
              }}
            >
              <button
                onClick={() => handleResolve('local')}
                disabled={isResolving()}
                style={{
                  padding: '14px 16px',
                  'font-size': '14px',
                  'font-weight': '600',
                  color: 'white',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  'border-radius': '10px',
                  cursor: isResolving() ? 'not-allowed' : 'pointer',
                  opacity: isResolving() ? '0.5' : '1',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isResolving()) {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                }}
              >
                Keep My Changes
              </button>

              <button
                onClick={() => handleResolve('remote')}
                disabled={isResolving()}
                style={{
                  padding: '14px 16px',
                  'font-size': '14px',
                  'font-weight': '600',
                  color: 'white',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  border: 'none',
                  'border-radius': '10px',
                  cursor: isResolving() ? 'not-allowed' : 'pointer',
                  opacity: isResolving() ? '0.5' : '1',
                  transition: 'all 0.2s',
                  'box-shadow': '0 4px 14px rgba(16, 185, 129, 0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!isResolving()) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Use Server Data
              </button>
            </div>

            {/* Cancel link */}
            <button
              onClick={props.onClose}
              style={{
                width: '100%',
                padding: '12px',
                'margin-top': '12px',
                'font-size': '13px',
                color: 'rgba(255, 255, 255, 0.5)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
            >
              Decide Later
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default SyncConflictModal;
