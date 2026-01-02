/**
 * BulkActionsBar - Floating action bar for bulk operations on selected applications
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, createSignal, For } from 'solid-js';
import { Portal } from 'solid-js/web';
import {
  ApplicationStatus,
  STATUS_ORDER,
  STATUS_LABELS,
} from '../../../../schemas/pipeline.schema';
import { liquidTenure, statusColors, pipelineAnimations } from '../theme/liquid-tenure';
import { IconX, IconTrash, IconChevronDown } from '../ui/Icons';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatusChange: (status: ApplicationStatus) => void;
  onBulkDelete: () => void;
  theme: () => typeof liquidTenure;
  isOpen: boolean;
}

export const BulkActionsBar: Component<BulkActionsBarProps> = (props) => {
  const [isDropdownOpen, setIsDropdownOpen] = createSignal(false);

  const theme = () => props.theme?.() || liquidTenure;

  const handleStatusSelect = (status: ApplicationStatus) => {
    props.onBulkStatusChange(status);
    setIsDropdownOpen(false);
  };

  return (
    <Show when={props.isOpen}>
      <Portal>
        {/* Floating bar container */}
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: props.isOpen
              ? 'translateX(-50%) translateY(0)'
              : 'translateX(-50%) translateY(100px)',
            'z-index': '9999',
            animation: props.isOpen
              ? 'bulkBarSlideUp 0.3s ease-out'
              : 'bulkBarSlideDown 0.3s ease-out',
          }}
        >
          {/* Glass background bar */}
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '16px',
              padding: '12px 20px',
              background: 'rgba(20, 20, 20, 0.85)',
              'backdrop-filter': 'blur(16px)',
              '-webkit-backdrop-filter': 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              'border-radius': '16px',
              'box-shadow':
                '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
            }}
          >
            {/* Selection count */}
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
                'font-family': theme().fonts.body,
                'font-size': '14px',
                'font-weight': '500',
                color: theme().colors.text,
                'padding-right': '16px',
                'border-right': '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  'min-width': '24px',
                  height: '24px',
                  padding: '0 8px',
                  background: theme().colors.primary,
                  'border-radius': '12px',
                  'font-size': '13px',
                  'font-weight': '600',
                  color: '#FFFFFF',
                }}
              >
                {props.selectedCount}
              </span>
              <span style={{ color: theme().colors.textMuted }}>
                application{props.selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>

            {/* Clear selection button */}
            <button
              onClick={props.onClearSelection}
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                'border-radius': '10px',
                color: theme().colors.textMuted,
                'font-family': theme().fonts.body,
                'font-size': '13px',
                'font-weight': '500',
                cursor: 'pointer',
                transition: `all ${pipelineAnimations.fast} ease`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.color = theme().colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = theme().colors.textMuted;
              }}
            >
              <IconX size={14} />
              Clear
            </button>

            {/* Move to dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen())}
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  'border-radius': '10px',
                  color: theme().colors.text,
                  'font-family': theme().fonts.body,
                  'font-size': '13px',
                  'font-weight': '500',
                  cursor: 'pointer',
                  transition: `all ${pipelineAnimations.fast} ease`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }}
              >
                Move to...
                <IconChevronDown size={14} class={isDropdownOpen() ? 'rotate-180' : ''} />
              </button>

              {/* Dropdown menu */}
              <Show when={isDropdownOpen()}>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    'min-width': '180px',
                    background: 'rgba(25, 25, 25, 0.95)',
                    'backdrop-filter': 'blur(16px)',
                    '-webkit-backdrop-filter': 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    'border-radius': '12px',
                    'box-shadow': '0 8px 24px rgba(0, 0, 0, 0.4)',
                    padding: '6px',
                    'z-index': '10000',
                    animation: 'dropdownFadeIn 0.15s ease-out',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <For each={STATUS_ORDER}>
                    {(status) => (
                      <button
                        onClick={() => handleStatusSelect(status)}
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          gap: '10px',
                          width: '100%',
                          padding: '10px 12px',
                          background: 'transparent',
                          border: 'none',
                          'border-radius': '8px',
                          color: theme().colors.text,
                          'font-family': theme().fonts.body,
                          'font-size': '13px',
                          'font-weight': '500',
                          cursor: 'pointer',
                          'text-align': 'left',
                          transition: 'all 0.1s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = statusColors[status].bg;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {/* Status color dot */}
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            'border-radius': '50%',
                            background: statusColors[status].gradient,
                            'box-shadow': statusColors[status].glow,
                            'flex-shrink': '0',
                          }}
                        />
                        {STATUS_LABELS[status]}
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            {/* Delete button */}
            <button
              onClick={props.onBulkDelete}
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                'border-radius': '10px',
                color: '#EF4444',
                'font-family': theme().fonts.body,
                'font-size': '13px',
                'font-weight': '500',
                cursor: 'pointer',
                transition: `all ${pipelineAnimations.fast} ease`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <IconTrash size={14} />
              Delete
            </button>
          </div>
        </div>

        {/* Keyframe animations */}
        <style>{`
          @keyframes bulkBarSlideUp {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(100px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }

          @keyframes bulkBarSlideDown {
            from {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
            to {
              opacity: 0;
              transform: translateX(-50%) translateY(100px);
            }
          }

          @keyframes dropdownFadeIn {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }

          .rotate-180 {
            transform: rotate(180deg);
            transition: transform 0.15s ease;
          }
        `}</style>

        {/* Click outside to close dropdown */}
        <Show when={isDropdownOpen()}>
          <div
            style={{
              position: 'fixed',
              inset: '0',
              'z-index': '9998',
            }}
            onClick={() => setIsDropdownOpen(false)}
          />
        </Show>
      </Portal>
    </Show>
  );
};

export default BulkActionsBar;
