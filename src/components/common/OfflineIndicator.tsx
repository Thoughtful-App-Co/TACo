/**
 * Offline Indicator Component
 *
 * Shows a subtle banner when the user goes offline.
 * Displays "back online" briefly when connectivity is restored.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, createEffect, createSignal } from 'solid-js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: Component = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [show, setShow] = createSignal(false);

  createEffect(() => {
    if (!isOnline()) {
      setShow(true);
    } else if (wasOffline()) {
      // Show "back online" briefly
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    } else {
      setShow(false);
    }
  });

  return (
    <Show when={show()}>
      <div
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          'z-index': '9999',
          display: 'flex',
          'justify-content': 'center',
          padding: '8px 16px',
          'pointer-events': 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '8px',
            padding: '10px 20px',
            'border-radius': '24px',
            background: 'rgba(0, 0, 0, 0.9)',
            'backdrop-filter': 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            'box-shadow': '0 4px 24px rgba(0, 0, 0, 0.3)',
            color: 'white',
            'font-size': '14px',
            'font-weight': '500',
            'font-family': 'system-ui, -apple-system, sans-serif',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <Show
            when={!isOnline()}
            fallback={
              <>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    'border-radius': '50%',
                    background: '#10B981',
                    'box-shadow': '0 0 8px #10B981',
                  }}
                />
                <span>Back online</span>
              </>
            }
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                'border-radius': '50%',
                background: '#F59E0B',
                'box-shadow': '0 0 8px #F59E0B',
                animation: 'pulse 2s infinite',
              }}
            />
            <span>You're offline — changes saved locally</span>
          </Show>
        </div>
      </div>

      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </Show>
  );
};
