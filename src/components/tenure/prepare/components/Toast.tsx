/**
 * Toast - Notification toast component with animations
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show, JSX } from 'solid-js';
import { toastStore, Toast as ToastData, ToastType } from './toast-store';

// ============================================================================
// THEME CONSTANTS
// ============================================================================

const TOAST_THEME = {
  colors: {
    background: 'rgba(30, 30, 30, 0.95)',
    border: '#374151',
    text: '#F3F4F6',
    textMuted: '#9CA3AF',
    success: '#10B981',
    error: '#EF4444',
    info: '#3B82F6',
    loading: '#8B5CF6', // Primary/accent color
  },
  fonts: {
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
} as const;

// ============================================================================
// ANIMATION KEYFRAMES
// ============================================================================

const toastKeyframes = `
  @keyframes toast-slide-in {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes toast-slide-out {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }

  @keyframes toast-progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  @keyframes toast-spinner {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

// ============================================================================
// ICONS
// ============================================================================

const IconSuccess: Component<{ size?: number }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const IconError: Component<{ size?: number }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const IconInfo: Component<{ size?: number }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const IconSpinner: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    style={{
      animation: 'toast-spinner 1s linear infinite',
    }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const IconClose: Component<{ size?: number }> = (props) => (
  <svg
    width={props.size || 16}
    height={props.size || 16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getTypeColor = (type: ToastType): string => {
  switch (type) {
    case 'success':
      return TOAST_THEME.colors.success;
    case 'error':
      return TOAST_THEME.colors.error;
    case 'info':
      return TOAST_THEME.colors.info;
    case 'loading':
      return toastStore.state.primaryColor; // Use dynamic theme color
    default:
      return TOAST_THEME.colors.info;
  }
};

const getTypeIcon = (type: ToastType): JSX.Element => {
  const color = getTypeColor(type);
  switch (type) {
    case 'success':
      return <IconSuccess />;
    case 'error':
      return <IconError />;
    case 'info':
      return <IconInfo />;
    case 'loading':
      return <IconSpinner color={color} />;
    default:
      return <IconInfo />;
  }
};

// ============================================================================
// SINGLE TOAST ITEM
// ============================================================================

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const ToastItem: Component<ToastItemProps> = (props) => {
  const typeColor = () => getTypeColor(props.toast.type);

  const containerStyle = (): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'flex-start',
    gap: '12px',
    padding: '14px 16px',
    background: TOAST_THEME.colors.background,
    'backdrop-filter': 'blur(12px)',
    border: `1px solid ${typeColor()}`,
    'border-radius': '12px',
    'box-shadow': `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 20px ${typeColor()}20`,
    'min-width': '320px',
    'max-width': '420px',
    position: 'relative',
    overflow: 'hidden',
    animation: 'toast-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
    'font-family': TOAST_THEME.fonts.body,
  });

  const iconContainerStyle = (): JSX.CSSProperties => ({
    'flex-shrink': 0,
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    width: '24px',
    height: '24px',
    color: typeColor(),
  });

  const contentStyle = (): JSX.CSSProperties => ({
    flex: 1,
    'min-width': 0,
  });

  const messageStyle = (): JSX.CSSProperties => ({
    margin: 0,
    'font-size': '14px',
    'font-weight': '500',
    color: TOAST_THEME.colors.text,
    'line-height': '1.5',
    'word-wrap': 'break-word',
  });

  const closeButtonStyle = (): JSX.CSSProperties => ({
    'flex-shrink': 0,
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    width: '24px',
    height: '24px',
    padding: 0,
    background: 'transparent',
    border: 'none',
    'border-radius': '6px',
    color: TOAST_THEME.colors.textMuted,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  const progressBarContainerStyle = (): JSX.CSSProperties => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  });

  const progressBarStyle = (): JSX.CSSProperties => ({
    height: '100%',
    background: typeColor(),
    width: `${props.toast.progress ?? 0}%`,
    transition: 'width 0.2s ease',
  });

  const autoDismissProgressStyle = (): JSX.CSSProperties => ({
    height: '100%',
    background: typeColor(),
    animation:
      props.toast.type !== 'loading' && props.toast.duration
        ? `toast-progress ${props.toast.duration}ms linear forwards`
        : 'none',
  });

  return (
    <div style={containerStyle()}>
      {/* Icon */}
      <div style={iconContainerStyle()}>{getTypeIcon(props.toast.type)}</div>

      {/* Content */}
      <div style={contentStyle()}>
        <p style={messageStyle()}>{props.toast.message}</p>
      </div>

      {/* Close button (not shown for loading) */}
      <Show when={props.toast.type !== 'loading'}>
        <button
          onClick={() => props.onDismiss(props.toast.id)}
          style={closeButtonStyle()}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = TOAST_THEME.colors.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = TOAST_THEME.colors.textMuted;
          }}
          aria-label="Dismiss"
        >
          <IconClose />
        </button>
      </Show>

      {/* Progress bar (explicit progress) */}
      <Show when={props.toast.showProgress && props.toast.progress !== undefined}>
        <div style={progressBarContainerStyle()}>
          <div style={progressBarStyle()} />
        </div>
      </Show>

      {/* Auto-dismiss progress (for non-loading toasts with duration) */}
      <Show
        when={
          !props.toast.showProgress &&
          props.toast.type !== 'loading' &&
          props.toast.duration &&
          props.toast.duration > 0
        }
      >
        <div style={progressBarContainerStyle()}>
          <div style={autoDismissProgressStyle()} />
        </div>
      </Show>
    </div>
  );
};

// ============================================================================
// TOAST CONTAINER
// ============================================================================

export const ToastContainer: Component = () => {
  const containerStyle = (): JSX.CSSProperties => ({
    position: 'fixed',
    top: '20px',
    right: '20px',
    'z-index': 100000,
    display: 'flex',
    'flex-direction': 'column',
    gap: '12px',
    'pointer-events': 'none',
  });

  const toastWrapperStyle = (): JSX.CSSProperties => ({
    'pointer-events': 'auto',
  });

  return (
    <>
      <style>{toastKeyframes}</style>
      <div style={containerStyle()}>
        <For each={toastStore.state.toasts}>
          {(toast) => (
            <div style={toastWrapperStyle()}>
              <ToastItem toast={toast} onDismiss={toastStore.dismiss} />
            </div>
          )}
        </For>
      </div>
    </>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export { toastStore } from './toast-store';
export type { Toast, ToastType } from './toast-store';
export default ToastContainer;
