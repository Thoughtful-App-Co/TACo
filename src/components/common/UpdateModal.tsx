/**
 * Update Modal Component
 *
 * Shows changelog when a new version is available.
 * Auto-updates with user confirmation.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, For, createSignal, createEffect } from 'solid-js';
import { pwaUpdateAvailable, applyUpdate } from '../../lib/pwa/register';
import { getLatestChangelog } from '../../lib/pwa/changelog';

export const UpdateModal: Component = () => {
  const [show, setShow] = createSignal(false);
  const [updating, setUpdating] = createSignal(false);

  createEffect(() => {
    if (pwaUpdateAvailable()) {
      setTimeout(() => setShow(true), 2000);
    }
  });

  const handleUpdate = () => {
    setUpdating(true);
    applyUpdate();
  };

  const handleLater = () => {
    setShow(false);
  };

  const changelog = getLatestChangelog();

  return (
    <Show when={show() && pwaUpdateAvailable()}>
      <div
        style={{
          position: 'fixed',
          inset: '0',
          'z-index': '10000',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          padding: '24px',
          background: 'rgba(0, 0, 0, 0.6)',
          'backdrop-filter': 'blur(4px)',
        }}
        onClick={(e) => e.target === e.currentTarget && handleLater()}
      >
        <div
          style={{
            width: '100%',
            'max-width': '400px',
            background: 'white',
            'border-radius': '20px',
            'box-shadow': '0 24px 48px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '24px',
              background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
              color: 'white',
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
              <span style={{ 'font-size': '28px' }}>🎉</span>
              <div>
                <h2 style={{ margin: '0', 'font-size': '18px', 'font-weight': '700' }}>
                  Update Available
                </h2>
                <p style={{ margin: '4px 0 0', 'font-size': '14px', opacity: '0.9' }}>
                  Version {changelog?.version} • {changelog?.date}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '20px 24px' }}>
            <h3 style={{ margin: '0 0 12px', 'font-size': '14px', color: '#6B7280' }}>
              What's New
            </h3>
            <ul
              style={{ margin: '0', padding: '0 0 0 20px', 'font-size': '14px', color: '#374151' }}
            >
              <For each={changelog?.highlights}>
                {(item) => <li style={{ 'margin-bottom': '8px' }}>{item}</li>}
              </For>
            </ul>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px 24px', display: 'flex', gap: '12px' }}>
            <button
              onClick={handleLater}
              style={{
                flex: '1',
                padding: '12px',
                background: '#F3F4F6',
                border: 'none',
                'border-radius': '10px',
                'font-size': '14px',
                'font-weight': '500',
                color: '#6B7280',
                cursor: 'pointer',
              }}
            >
              Later
            </button>
            <button
              onClick={handleUpdate}
              disabled={updating()}
              style={{
                flex: '2',
                padding: '12px',
                background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
                border: 'none',
                'border-radius': '10px',
                'font-size': '14px',
                'font-weight': '600',
                color: 'white',
                cursor: updating() ? 'wait' : 'pointer',
                opacity: updating() ? '0.7' : '1',
              }}
            >
              {updating() ? 'Updating...' : 'Update Now'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
