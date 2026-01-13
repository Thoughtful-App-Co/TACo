/**
 * SortMenu - Dropdown menu for sorting applications
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show, onCleanup, createEffect, For } from 'solid-js';
import { liquidTenure, pipelineAnimations } from '../theme/liquid-tenure';
import { IconSortAsc, IconSortDesc } from './Icons';

export type SortField = 'age' | 'company' | 'role' | 'salary';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface SortMenuProps {
  currentSort: SortConfig;
  onSortChange: (sort: SortConfig) => void;
  currentTheme: () => Partial<typeof liquidTenure> & typeof liquidTenure;
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'age', label: 'Age (Days)' },
  { field: 'company', label: 'Company' },
  { field: 'role', label: 'Role' },
  { field: 'salary', label: 'Salary' },
];

export const SortMenu: Component<SortMenuProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  let menuRef: HTMLDivElement | undefined;

  const theme = () => props.currentTheme();

  // Close on outside click
  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef && !menuRef.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  createEffect(() => {
    if (isOpen()) {
      document.addEventListener('mousedown', handleClickOutside);
      onCleanup(() => document.removeEventListener('mousedown', handleClickOutside));
    }
  });

  const handleSortSelect = (field: SortField) => {
    if (props.currentSort.field === field) {
      // Toggle direction if same field
      props.onSortChange({
        field,
        direction: props.currentSort.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      // New field, default to descending (most recent first for dates, Z-A for text)
      props.onSortChange({ field, direction: 'desc' });
    }
  };

  const toggleDirection = (e: MouseEvent) => {
    e.stopPropagation();
    props.onSortChange({
      field: props.currentSort.field,
      direction: props.currentSort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const currentLabel = () =>
    SORT_OPTIONS.find((o) => o.field === props.currentSort.field)?.label || 'Sort';

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Sort Button */}
      <div
        onClick={() => setIsOpen(!isOpen())}
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: '8px',
          padding: '10px 16px',
          background: isOpen()
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))'
            : 'linear-gradient(135deg, rgba(15, 15, 18, 0.95), rgba(10, 10, 12, 0.98))',
          border: isOpen()
            ? '1px solid rgba(255, 255, 255, 0.2)'
            : '1px solid rgba(255, 255, 255, 0.1)',
          'border-radius': '10px',
          color: theme().colors.text,
          'font-size': '13px',
          'font-family': "'Space Grotesk', system-ui, sans-serif",
          'font-weight': '500',
          cursor: 'pointer',
          transition: `all ${pipelineAnimations.fast}`,
          'box-shadow': 'inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 4px 12px rgba(0, 0, 0, 0.2)',
        }}
      >
        <span style={{ color: theme().colors.textMuted, 'font-size': '12px' }}>Sort:</span>
        <span>{currentLabel()}</span>

        {/* Direction toggle icon (changed from button to div) */}
        <div
          onClick={toggleDirection}
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            padding: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            'border-radius': '4px',
            cursor: 'pointer',
            color: theme().colors.primary,
            transition: `all ${pipelineAnimations.fast}`,
          }}
          title={props.currentSort.direction === 'asc' ? 'Ascending' : 'Descending'}
        >
          <Show when={props.currentSort.direction === 'asc'} fallback={<IconSortDesc size={14} />}>
            <IconSortAsc size={14} />
          </Show>
        </div>
      </div>

      {/* Dropdown Menu */}
      <Show when={isOpen()}>
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '0',
            'min-width': '180px',
            background: 'linear-gradient(135deg, rgba(25, 25, 30, 0.98), rgba(15, 15, 18, 0.99))',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            'border-radius': '12px',
            'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            'backdrop-filter': 'blur(16px)',
            overflow: 'hidden',
            'z-index': 100,
            animation: 'dropdown-fade-in 0.15s ease-out',
          }}
        >
          <For each={SORT_OPTIONS}>
            {(option) => {
              const isActive = props.currentSort.field === option.field;
              return (
                <div
                  onClick={() => handleSortSelect(option.field)}
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                    width: '100%',
                    padding: '12px 16px',
                    background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    color: isActive ? theme().colors.primary : theme().colors.text,
                    'font-size': '13px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    'font-weight': isActive ? '600' : '400',
                    cursor: 'pointer',
                    transition: `all ${pipelineAnimations.fast}`,
                    'text-align': 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span>{option.label}</span>
                  <Show when={isActive}>
                    <div style={{ display: 'flex', 'align-items': 'center', gap: '6px' }}>
                      <Show
                        when={props.currentSort.direction === 'asc'}
                        fallback={<IconSortDesc size={14} color={theme().colors.primary} />}
                      >
                        <IconSortAsc size={14} color={theme().colors.primary} />
                      </Show>
                    </div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      {/* Inject animation keyframes */}
      <style>{`
        @keyframes dropdown-fade-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SortMenu;
