/**
 * DeleteConfirmationModal - Reusable confirmation dialog for destructive actions
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { liquidTenure } from '../theme/liquid-tenure';
import { IconAlert } from '../ui/Icons';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  theme?: () => typeof liquidTenure;
}

export const DeleteConfirmationModal: Component<DeleteConfirmationModalProps> = (props) => {
  const theme = () => props.theme?.() || liquidTenure;

  return (
    <Show when={props.isOpen}>
      <Portal>
        {/* Backdrop */}
        <div
          style={{
            position: 'fixed',
            inset: '0',
            background: 'rgba(0, 0, 0, 0.7)',
            'backdrop-filter': 'blur(4px)',
            'z-index': '10000',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            padding: '20px',
          }}
          onClick={props.onClose}
        >
          {/* Modal */}
          <div
            style={{
              background: theme().colors.surface,
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '16px',
              'max-width': '480px',
              width: '100%',
              padding: '32px',
              'box-shadow': '0 20px 60px rgba(0, 0, 0, 0.5)',
              animation: 'fadeInScale 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                width: '56px',
                height: '56px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid rgba(239, 68, 68, 0.3)',
                'border-radius': '12px',
                margin: '0 auto 20px',
              }}
            >
              <IconAlert size={28} color="#EF4444" />
            </div>

            {/* Title */}
            <h2
              style={{
                margin: '0 0 12px',
                'font-size': '22px',
                'font-family': theme().fonts.heading,
                'font-weight': '700',
                color: theme().colors.text,
                'text-align': 'center',
              }}
            >
              {props.title}
            </h2>

            {/* Message */}
            <p
              style={{
                margin: '0 0 28px',
                'font-size': '15px',
                'font-family': theme().fonts.body,
                color: theme().colors.textMuted,
                'line-height': '1.6',
                'text-align': 'center',
              }}
            >
              {props.message}
            </p>

            {/* Actions */}
            <div
              style={{
                display: 'grid',
                'grid-template-columns': '1fr 1fr',
                gap: '12px',
              }}
            >
              <button
                onClick={props.onClose}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  border: `1px solid ${theme().colors.border}`,
                  'border-radius': '10px',
                  color: theme().colors.text,
                  'font-size': '15px',
                  'font-family': theme().fonts.body,
                  'font-weight': '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  props.onConfirm();
                  props.onClose();
                }}
                style={{
                  padding: '12px 24px',
                  background: '#EF4444',
                  border: '1px solid #DC2626',
                  'border-radius': '10px',
                  color: '#FFFFFF',
                  'font-size': '15px',
                  'font-family': theme().fonts.body,
                  'font-weight': '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#DC2626';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#EF4444';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {props.confirmText || 'Delete'}
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </Portal>
    </Show>
  );
};

export default DeleteConfirmationModal;
