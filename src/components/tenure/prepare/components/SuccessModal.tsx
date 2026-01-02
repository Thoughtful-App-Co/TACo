/**
 * SuccessModal - Affirmative confirmation modal
 *
 * Used to confirm successful actions like saving variants.
 * Features Phosphor-style check icon with success theming.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show } from 'solid-js';
import { IconCheckCircle } from '../../pipeline/ui/Icons';

interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  onClose: () => void;
  currentTheme: () => any;
}

export const SuccessModal: Component<SuccessModalProps> = (props) => {
  const theme = () => props.currentTheme();

  return (
    <Show when={props.isOpen}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'z-index': 1000,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={props.onClose}
      >
        <div
          style={{
            background: theme().colors.background,
            border: `2px solid ${theme().colors.success || '#10b981'}`,
            'border-radius': '20px',
            padding: '40px',
            'max-width': '450px',
            width: '100%',
            'box-shadow': `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${theme().colors.success || '#10b981'}20`,
            'text-align': 'center',
            animation: 'scaleIn 0.2s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success Icon */}
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              background: `${theme().colors.success || '#10b981'}20`,
              'border-radius': '50%',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              animation: 'pulse 0.5s ease-out',
            }}
          >
            <IconCheckCircle size={48} color={theme().colors.success || '#10b981'} />
          </div>

          {/* Title */}
          <h3
            style={{
              margin: '0 0 12px',
              'font-size': '24px',
              color: theme().colors.text,
              'font-family': theme().fonts.heading,
              'font-weight': '700',
            }}
          >
            {props.title}
          </h3>

          {/* Message */}
          <p
            style={{
              margin: '0 0 32px',
              'font-size': '16px',
              color: theme().colors.textMuted,
              'line-height': '1.6',
            }}
          >
            {props.message}
          </p>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              'justify-content': 'center',
            }}
          >
            <Show when={props.secondaryAction}>
              <button
                onClick={props.secondaryAction!.onClick}
                style={{
                  padding: '14px 28px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '12px',
                  color: theme().colors.text,
                  'font-size': '15px',
                  'font-weight': '600',
                  cursor: 'pointer',
                  'font-family': theme().fonts.body,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                {props.secondaryAction!.label}
              </button>
            </Show>

            <Show when={props.primaryAction}>
              <button
                onClick={props.primaryAction!.onClick}
                style={{
                  padding: '14px 28px',
                  background: `linear-gradient(135deg, ${theme().colors.success || '#10b981'}, ${theme().colors.success || '#10b981'}dd)`,
                  border: 'none',
                  'border-radius': '12px',
                  color: '#FFFFFF',
                  'font-size': '15px',
                  'font-weight': '600',
                  cursor: 'pointer',
                  'font-family': theme().fonts.body,
                  transition: 'all 0.2s',
                  'box-shadow': `0 4px 12px ${theme().colors.success || '#10b981'}40`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {props.primaryAction!.label}
              </button>
            </Show>
          </div>
        </div>

        {/* Keyframe animations injected via style tag */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes pulse {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </Show>
  );
};
