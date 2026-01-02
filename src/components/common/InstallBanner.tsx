/**
 * Install Banner Component
 *
 * Shows a slide-up banner prompting users to install the PWA.
 * Only appears after smart trigger conditions are met.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, createSignal, onMount } from 'solid-js';
import {
  canInstall,
  isInstalled,
  promptInstall,
  dismissInstallPrompt,
  shouldShowInstallPrompt,
  trackVisit,
} from '../../lib/pwa/install-prompt';
import { getCurrentAppConfig } from '../../lib/pwa/manifest-switcher';

export const InstallBanner: Component = () => {
  const [show, setShow] = createSignal(false);
  const [installing, setInstalling] = createSignal(false);

  onMount(() => {
    trackVisit();

    // Delay showing banner
    setTimeout(() => {
      if (shouldShowInstallPrompt()) {
        setShow(true);
      }
    }, 5000);
  });

  const handleInstall = async () => {
    setInstalling(true);
    const result = await promptInstall();
    setInstalling(false);

    if (result === 'accepted') {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    setShow(false);
  };

  const appConfig = getCurrentAppConfig();

  return (
    <Show when={show() && canInstall() && !isInstalled()}>
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          'z-index': '9998',
          width: 'calc(100% - 48px)',
          'max-width': '400px',
          animation: 'slideUp 0.4s ease-out',
        }}
      >
        <div
          style={{
            background: 'white',
            'border-radius': '16px',
            'box-shadow': '0 8px 40px rgba(0, 0, 0, 0.2)',
            padding: '20px',
            display: 'flex',
            'align-items': 'center',
            gap: '16px',
          }}
        >
          {/* App Icon */}
          <div
            style={{
              width: '52px',
              height: '52px',
              'border-radius': '12px',
              background: appConfig.themeColor,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'flex-shrink': '0',
              'font-size': '24px',
              color: 'white',
              'font-weight': '700',
            }}
          >
            {appConfig.appleTitle.charAt(0)}
          </div>

          {/* Content */}
          <div style={{ flex: '1', 'min-width': '0' }}>
            <div style={{ 'font-size': '15px', 'font-weight': '600', color: '#1F2937' }}>
              Install {appConfig.appleTitle}
            </div>
            <div style={{ 'font-size': '13px', color: '#6B7280', 'margin-top': '2px' }}>
              Add to home screen for offline access
            </div>
          </div>

          {/* Buttons */}
          <div
            style={{ display: 'flex', 'flex-direction': 'column', gap: '6px', 'flex-shrink': '0' }}
          >
            <button
              onClick={handleInstall}
              disabled={installing()}
              style={{
                padding: '8px 16px',
                background: appConfig.themeColor,
                color: 'white',
                border: 'none',
                'border-radius': '8px',
                'font-size': '13px',
                'font-weight': '600',
                cursor: installing() ? 'wait' : 'pointer',
                opacity: installing() ? '0.7' : '1',
              }}
            >
              {installing() ? '...' : 'Install'}
            </button>
            <button
              onClick={handleDismiss}
              style={{
                padding: '4px 8px',
                background: 'transparent',
                color: '#9CA3AF',
                border: 'none',
                'font-size': '11px',
                cursor: 'pointer',
              }}
            >
              Not now
            </button>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(100%);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `}
      </style>
    </Show>
  );
};
