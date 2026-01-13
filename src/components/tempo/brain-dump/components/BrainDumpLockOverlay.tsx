/**
 * Brain Dump Lock Overlay
 *
 * Displays when user hasn't configured API access (no API key AND no Tempo Extras subscription).
 * Prompts user to either:
 * 1. Configure their own Claude API key
 * 2. Subscribe to Tempo Extras ($12/mo)
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component } from 'solid-js';
import { Lock, Key, Star } from 'phosphor-solid';
import { Button } from '../../ui/button';
import { tempoDesign } from '../../theme/tempo-design';

interface BrainDumpLockOverlayProps {
  onOpenSettings: () => void;
}

export const BrainDumpLockOverlay: Component<BrainDumpLockOverlayProps> = (props) => {
  const handleGetExtras = () => {
    window.location.href = '/pricing#tempo-extras';
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        'z-index': 10,
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        'background-color': 'rgba(0, 0, 0, 0.4)',
        'border-radius': tempoDesign.radius.lg,
        'backdrop-filter': 'blur(2px)',
      }}
    >
      <div
        style={{
          background: tempoDesign.colors.background,
          'border-radius': tempoDesign.radius.lg,
          padding: '32px',
          'max-width': '380px',
          width: '90%',
          'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.3)',
          'text-align': 'center',
        }}
      >
        {/* Lock Icon */}
        <div
          style={{
            display: 'flex',
            'justify-content': 'center',
            'margin-bottom': '16px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              'border-radius': tempoDesign.radius.full,
              background: `${tempoDesign.colors.primary}15`,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
            }}
          >
            <Lock size={28} weight="fill" style={{ color: tempoDesign.colors.primary }} />
          </div>
        </div>

        {/* Heading */}
        <h3
          style={{
            margin: '0 0 8px 0',
            'font-size': tempoDesign.typography.sizes.xl,
            'font-weight': tempoDesign.typography.weights.semibold,
            color: tempoDesign.colors.foreground,
          }}
        >
          Brain Dump Locked
        </h3>

        {/* Subtext */}
        <p
          style={{
            margin: '0 0 24px 0',
            'font-size': tempoDesign.typography.sizes.sm,
            color: tempoDesign.colors.mutedForeground,
            'line-height': '1.5',
          }}
        >
          To use AI-powered task processing, choose one of these options:
        </p>

        {/* Option Buttons */}
        <div
          style={{
            display: 'flex',
            'flex-direction': 'column',
            gap: '12px',
          }}
        >
          {/* Option 1: Use Your Own API Key */}
          <button
            type="button"
            onClick={() => props.onOpenSettings()}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '12px',
              padding: '14px 16px',
              background: tempoDesign.colors.card,
              border: `1px solid ${tempoDesign.colors.border}`,
              'border-radius': tempoDesign.radius.lg,
              cursor: 'pointer',
              'text-align': 'left',
              transition: 'all 0.2s ease-out',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = tempoDesign.colors.primary;
              e.currentTarget.style.background = `${tempoDesign.colors.primary}08`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = tempoDesign.colors.border;
              e.currentTarget.style.background = tempoDesign.colors.card;
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                'border-radius': tempoDesign.radius.md,
                background: `${tempoDesign.colors.mutedForeground}15`,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'flex-shrink': 0,
              }}
            >
              <Key size={20} style={{ color: tempoDesign.colors.foreground }} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  'font-size': tempoDesign.typography.sizes.sm,
                  'font-weight': tempoDesign.typography.weights.medium,
                  color: tempoDesign.colors.foreground,
                  'margin-bottom': '2px',
                }}
              >
                Use Your Own API Key
              </div>
              <div
                style={{
                  'font-size': tempoDesign.typography.sizes.xs,
                  color: tempoDesign.colors.mutedForeground,
                }}
              >
                Free - you manage costs
              </div>
            </div>
          </button>

          {/* Option 2: Get Tempo Extras */}
          <button
            type="button"
            onClick={handleGetExtras}
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '12px',
              padding: '14px 16px',
              background: `${tempoDesign.colors.primary}10`,
              border: `1px solid ${tempoDesign.colors.primary}30`,
              'border-radius': tempoDesign.radius.lg,
              cursor: 'pointer',
              'text-align': 'left',
              transition: 'all 0.2s ease-out',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = tempoDesign.colors.primary;
              e.currentTarget.style.background = `${tempoDesign.colors.primary}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `${tempoDesign.colors.primary}30`;
              e.currentTarget.style.background = `${tempoDesign.colors.primary}10`;
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                'border-radius': tempoDesign.radius.md,
                background: `${tempoDesign.colors.primary}20`,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'flex-shrink': 0,
              }}
            >
              <Star size={20} weight="fill" style={{ color: tempoDesign.colors.primary }} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  'font-size': tempoDesign.typography.sizes.sm,
                  'font-weight': tempoDesign.typography.weights.medium,
                  color: tempoDesign.colors.foreground,
                  'margin-bottom': '2px',
                }}
              >
                Get Tempo Extras
              </div>
              <div
                style={{
                  'font-size': tempoDesign.typography.sizes.xs,
                  color: tempoDesign.colors.mutedForeground,
                }}
              >
                $12/mo - Unlimited AI features
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
