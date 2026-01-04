/**
 * Backup & Sync Component
 *
 * Provides backup and restore functionality for user data.
 * Shows different states based on authentication and subscription status.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { useAuth } from '../../lib/auth-context';
import { logger } from '../../lib/logger';
import { LoginModal } from './LoginModal';
import { Paywall } from './Paywall';

// ============================================================================
// TYPES
// ============================================================================

interface BackupSyncProps {
  appId: 'tempo' | 'tenure' | 'nurture';
  appName: string;
  getData: () => any;
  onRestore: (data: any) => void;
  lastBackup?: Date | null;
}

type ToastType = 'success' | 'error';

interface ToastState {
  show: boolean;
  type: ToastType;
  message: string;
}

// ============================================================================
// DESIGN TOKENS - Matching AccountButton
// ============================================================================

const tokens = {
  typography: {
    fontFamily: '"Geist", "Inter", system-ui, sans-serif',
  },
  colors: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: 'rgba(255, 255, 255, 0.08)',
    hover: 'rgba(255, 255, 255, 0.06)',
    text: {
      primary: 'white',
      muted: 'rgba(255, 255, 255, 0.5)',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    success: '#10B981',
    error: '#EF4444',
    accent: '#4ECDC4',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
  },
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format a date for display
 */
function formatLastBackup(date: Date | null | undefined): string {
  if (!date) return 'Never';

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export const BackupSync: Component<BackupSyncProps> = (props) => {
  const auth = useAuth();

  const [showLoginModal, setShowLoginModal] = createSignal(false);
  const [showPaywall, setShowPaywall] = createSignal(false);
  const [isBackingUp, setIsBackingUp] = createSignal(false);
  const [isRestoring, setIsRestoring] = createSignal(false);
  const [toast, setToast] = createSignal<ToastState>({
    show: false,
    type: 'success',
    message: '',
  });

  /**
   * Show a toast notification
   */
  const showToast = (type: ToastType, message: string) => {
    setToast({ show: true, type, message });

    // Auto-hide after 4 seconds
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  /**
   * Handle backup
   */
  const handleBackup = async () => {
    setIsBackingUp(true);

    try {
      const data = props.getData();

      const response = await fetch('/api/backup/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('taco_session_token')}`,
        },
        body: JSON.stringify({
          appId: props.appId,
          data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Backup failed');
      }

      showToast('success', `${props.appName} data backed up successfully`);
    } catch (error) {
      logger.backup.error('Backup error:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to backup data');
    } finally {
      setIsBackingUp(false);
    }
  };

  /**
   * Handle restore
   */
  const handleRestore = async () => {
    setIsRestoring(true);

    try {
      const response = await fetch(`/api/backup/download?appId=${props.appId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('taco_session_token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Restore failed');
      }

      const data = await response.json();

      if (!data || !data.data) {
        throw new Error('No backup data found');
      }

      props.onRestore(data.data);
      showToast('success', `${props.appName} data restored successfully`);
    } catch (error) {
      logger.backup.error('Restore error:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to restore data');
    } finally {
      setIsRestoring(false);
    }
  };

  /**
   * Check if user has sync subscription for this app
   */
  const hasSyncAccess = () => auth.hasAppSync(props.appId);

  return (
    <>
      {/* Card container */}
      <div
        style={{
          background: 'rgba(26, 26, 46, 0.6)',
          'backdrop-filter': 'blur(16px)',
          '-webkit-backdrop-filter': 'blur(16px)',
          border: `1px solid ${tokens.colors.border}`,
          'border-radius': '16px',
          overflow: 'hidden',
          'font-family': tokens.typography.fontFamily,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            'border-bottom': `1px solid ${tokens.colors.border}`,
            display: 'flex',
            'align-items': 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              background: 'rgba(78, 205, 196, 0.15)',
              'border-radius': '10px',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={tokens.colors.accent}
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                'font-size': '16px',
                'font-weight': '600',
                color: tokens.colors.text.primary,
              }}
            >
              Backup & Sync
            </h3>
            <p
              style={{
                margin: '2px 0 0',
                'font-size': '13px',
                color: tokens.colors.text.muted,
              }}
            >
              Keep your {props.appName} data safe
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Loading state */}
          <Show when={auth.isLoading()}>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                padding: '32px',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  'border-top-color': tokens.colors.accent,
                  'border-radius': '50%',
                  animation: 'backupSyncSpin 0.8s linear infinite',
                }}
              />
            </div>
          </Show>

          {/* Not logged in */}
          <Show when={!auth.isLoading() && !auth.isAuthenticated()}>
            <div style={{ 'text-align': 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  'border-radius': '14px',
                  margin: '0 auto 16px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={tokens.colors.text.muted}
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>

              <p
                style={{
                  margin: '0 0 20px',
                  'font-size': '14px',
                  color: tokens.colors.text.secondary,
                  'line-height': '1.5',
                }}
              >
                Sign in to enable cloud backup and sync your data across devices.
              </p>

              <button
                onClick={() => setShowLoginModal(true)}
                style={{
                  padding: '12px 24px',
                  background: tokens.colors.gradient,
                  border: 'none',
                  'border-radius': '10px',
                  color: 'white',
                  'font-family': tokens.typography.fontFamily,
                  'font-size': '14px',
                  'font-weight': '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  'box-shadow': '0 4px 14px rgba(255, 107, 107, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(255, 107, 107, 0.3)';
                }}
              >
                Sign In
              </button>
            </div>
          </Show>

          {/* Logged in but no sync subscription */}
          <Show when={!auth.isLoading() && auth.isAuthenticated() && !hasSyncAccess()}>
            <div style={{ 'text-align': 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background:
                    'linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                  'border-radius': '14px',
                  margin: '0 auto 16px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9333EA"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <h4
                style={{
                  margin: '0 0 8px',
                  'font-size': '15px',
                  'font-weight': '600',
                  color: tokens.colors.text.primary,
                }}
              >
                Unlock Cloud Backup
              </h4>

              <p
                style={{
                  margin: '0 0 8px',
                  'font-size': '13px',
                  color: tokens.colors.text.secondary,
                  'line-height': '1.5',
                }}
              >
                Keep your data safe and synced across all your devices.
              </p>

              <ul
                style={{
                  margin: '0 0 20px',
                  padding: 0,
                  'list-style': 'none',
                  'text-align': 'left',
                }}
              >
                {['Automatic cloud backup', 'Restore on any device', 'Never lose your data'].map(
                  (feature) => (
                    <li
                      style={{
                        display: 'flex',
                        'align-items': 'center',
                        gap: '8px',
                        padding: '6px 0',
                        'font-size': '13px',
                        color: tokens.colors.text.secondary,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={tokens.colors.success}
                        stroke-width="2.5"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {feature}
                    </li>
                  )
                )}
              </ul>

              <button
                onClick={() => setShowPaywall(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #9333EA 0%, #6366F1 100%)',
                  border: 'none',
                  'border-radius': '10px',
                  color: 'white',
                  'font-family': tokens.typography.fontFamily,
                  'font-size': '14px',
                  'font-weight': '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  'box-shadow': '0 4px 14px rgba(147, 51, 234, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(147, 51, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(147, 51, 234, 0.3)';
                }}
              >
                Upgrade
              </button>
            </div>
          </Show>

          {/* Has sync subscription */}
          <Show when={!auth.isLoading() && auth.isAuthenticated() && hasSyncAccess()}>
            <div>
              {/* Last backup info */}
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'space-between',
                  'margin-bottom': '20px',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  'border-radius': '10px',
                  border: `1px solid ${tokens.colors.border}`,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      'font-size': '12px',
                      color: tokens.colors.text.muted,
                      'text-transform': 'uppercase',
                      'letter-spacing': '0.5px',
                    }}
                  >
                    Last backup
                  </p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      'font-size': '14px',
                      color: tokens.colors.text.primary,
                      'font-weight': '500',
                    }}
                  >
                    {formatLastBackup(props.lastBackup)}
                  </p>
                </div>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    background: props.lastBackup ? tokens.colors.success : tokens.colors.text.muted,
                    'border-radius': '50%',
                  }}
                />
              </div>

              {/* Action buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                }}
              >
                {/* Backup button */}
                <button
                  onClick={handleBackup}
                  disabled={isBackingUp() || isRestoring()}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: isBackingUp()
                      ? 'rgba(255, 255, 255, 0.05)'
                      : tokens.colors.gradient,
                    border: 'none',
                    'border-radius': '10px',
                    color: 'white',
                    'font-family': tokens.typography.fontFamily,
                    'font-size': '14px',
                    'font-weight': '600',
                    cursor: isBackingUp() || isRestoring() ? 'not-allowed' : 'pointer',
                    opacity: isRestoring() ? 0.5 : 1,
                    transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
                    'box-shadow': isBackingUp() ? 'none' : '0 4px 14px rgba(255, 107, 107, 0.3)',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isBackingUp() && !isRestoring()) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isBackingUp()
                      ? 'none'
                      : '0 4px 14px rgba(255, 107, 107, 0.3)';
                  }}
                >
                  <Show
                    when={!isBackingUp()}
                    fallback={
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          'border-top-color': 'white',
                          'border-radius': '50%',
                          animation: 'backupSyncSpin 0.8s linear infinite',
                        }}
                      />
                    }
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </Show>
                  {isBackingUp() ? 'Backing up...' : 'Backup'}
                </button>

                {/* Restore button */}
                <button
                  onClick={handleRestore}
                  disabled={isBackingUp() || isRestoring()}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: isRestoring()
                      ? 'rgba(255, 255, 255, 0.05)'
                      : tokens.colors.background,
                    border: `1px solid ${tokens.colors.border}`,
                    'border-radius': '10px',
                    color: tokens.colors.text.primary,
                    'font-family': tokens.typography.fontFamily,
                    'font-size': '14px',
                    'font-weight': '600',
                    cursor: isBackingUp() || isRestoring() ? 'not-allowed' : 'pointer',
                    opacity: isBackingUp() ? 0.5 : 1,
                    transition: 'background 0.2s, border-color 0.2s, opacity 0.2s',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isBackingUp() && !isRestoring()) {
                      e.currentTarget.style.background = tokens.colors.hover;
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isRestoring()
                      ? 'rgba(255, 255, 255, 0.05)'
                      : tokens.colors.background;
                    e.currentTarget.style.borderColor = tokens.colors.border;
                  }}
                >
                  <Show
                    when={!isRestoring()}
                    fallback={
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255, 255, 255, 0.1)',
                          'border-top-color': 'rgba(255, 255, 255, 0.5)',
                          'border-radius': '50%',
                          animation: 'backupSyncSpin 0.8s linear infinite',
                        }}
                      />
                    }
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </Show>
                  {isRestoring() ? 'Restoring...' : 'Restore'}
                </button>
              </div>
            </div>
          </Show>
        </div>
      </div>

      {/* Toast notification */}
      <Show when={toast().show}>
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 20px',
            background:
              toast().type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            'border-radius': '10px',
            'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.3)',
            'z-index': 10000,
            display: 'flex',
            'align-items': 'center',
            gap: '10px',
            animation: 'backupSyncToastIn 0.3s ease',
          }}
        >
          <Show
            when={toast().type === 'success'}
            fallback={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            }
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="2"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </Show>
          <span
            style={{
              'font-family': tokens.typography.fontFamily,
              'font-size': '14px',
              'font-weight': '500',
              color: 'white',
            }}
          >
            {toast().message}
          </span>
        </div>
      </Show>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal()} onClose={() => setShowLoginModal(false)} />

      {/* Paywall */}
      <Paywall isOpen={showPaywall()} onClose={() => setShowPaywall(false)} feature="sync" />

      {/* Keyframe animations */}
      <style>
        {`
          @keyframes backupSyncSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes backupSyncToastIn {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `}
      </style>
    </>
  );
};

export default BackupSync;
