/**
 * Toast Notification System
 *
 * Simple, elegant notifications matching the app's dark theme.
 * Designed to work globally without requiring a container component.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  type: NotificationType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Design tokens matching the app's Toast component
const theme = {
  colors: {
    background: 'rgba(30, 30, 30, 0.95)',
    border: '#374151',
    text: '#F3F4F6',
    textMuted: '#9CA3AF',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  fonts: {
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};

const icons = {
  success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
  error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

export function showNotification(options: NotificationOptions): void {
  const { type, message, duration = 5000, action } = options;
  const typeColor = theme.colors[type];

  // Remove any existing notifications
  document.querySelectorAll('.taco-notification-container').forEach((el) => el.remove());

  const container = document.createElement('div');
  container.className = 'taco-notification-container';
  container.innerHTML = `
    <div class="taco-notification" style="
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      background: ${theme.colors.background};
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid ${typeColor};
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 20px ${typeColor}20;
      min-width: 320px;
      max-width: 420px;
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 100000;
      animation: tacoToastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      font-family: ${theme.fonts.body};
    ">
      <div style="
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        color: ${typeColor};
      ">${icons[type]}</div>
      <div style="flex: 1; min-width: 0;">
        <p style="
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          color: ${theme.colors.text};
          line-height: 1.5;
          word-wrap: break-word;
        ">${message}</p>
      </div>
      ${
        action
          ? `
        <button class="taco-notification-action" style="
          flex-shrink: 0;
          padding: 6px 12px;
          background: transparent;
          border: 1px solid ${typeColor};
          border-radius: 6px;
          color: ${typeColor};
          font-size: 13px;
          font-weight: 600;
          font-family: ${theme.fonts.body};
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        ">${action.label}</button>
      `
          : ''
      }
      <button class="taco-notification-close" style="
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 6px;
        color: ${theme.colors.textMuted};
        cursor: pointer;
        transition: all 0.15s ease;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div style="
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: rgba(255, 255, 255, 0.1);
        overflow: hidden;
        border-radius: 0 0 12px 12px;
      ">
        <div class="taco-notification-progress" style="
          height: 100%;
          background: ${typeColor};
          animation: tacoToastProgress ${duration}ms linear forwards;
        "></div>
      </div>
    </div>
    <style>
      @keyframes tacoToastSlideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes tacoToastSlideOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100%);
        }
      }
      @keyframes tacoToastProgress {
        from { width: 100%; }
        to { width: 0%; }
      }
      .taco-notification-action:hover {
        background: ${typeColor}20 !important;
      }
      .taco-notification-close:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        color: ${theme.colors.text} !important;
      }
    </style>
  `;

  document.body.appendChild(container);

  const removeNotification = () => {
    const notif = container.querySelector('.taco-notification') as HTMLElement;
    if (notif) {
      notif.style.animation = 'tacoToastSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
      setTimeout(() => container.remove(), 300);
    }
  };

  // Handle close button
  const closeBtn = container.querySelector('.taco-notification-close');
  closeBtn?.addEventListener('click', removeNotification);

  // Handle action button click
  if (action) {
    const actionBtn = container.querySelector('.taco-notification-action');
    actionBtn?.addEventListener('click', () => {
      action.onClick();
      removeNotification();
    });
  }

  // Auto-dismiss
  setTimeout(removeNotification, duration);
}
