/**
 * ProsperSidebar - Left navigation sidebar for Prosper
 * Collapsible to icon-only mode with tooltips
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { A } from '@solidjs/router';
import { prosperTenure } from '../theme/prosper-tenure';
import { liquidTenure, pipelineAnimations } from '../../pipeline/theme/liquid-tenure';
import { Tooltip } from '../../pipeline/ui';

export type ProsperSection = 'dashboard' | 'your-worth' | 'journal' | 'reviews' | 'export';

interface ProsperSidebarProps {
  activeSection: ProsperSection;
  onSectionChange: (section: ProsperSection) => void;
  currentTheme: () => Partial<typeof liquidTenure> & typeof liquidTenure;
}

interface NavItem {
  id: ProsperSection;
  label: string;
  icon: Component<{ size?: number }>;
  ariaLabel: string;
}

const DashboardIcon: Component<{ size?: number }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ChartIcon: Component<{ size?: number }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M3 3v18h18" />
    <path d="M18 9l-5 5-4-4-6 6" />
    <circle cx="18" cy="9" r="2" fill="currentColor" />
  </svg>
);

const JournalIcon: Component<{ size?: number }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="10" y1="8" x2="16" y2="8" />
    <line x1="10" y1="12" x2="16" y2="12" />
    <line x1="10" y1="16" x2="14" y2="16" />
  </svg>
);

const ReviewIcon: Component<{ size?: number }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 1 0-16 0" />
    <path d="M12 11l2 2 4-4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);

const ExportIcon: Component<{ size?: number }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconSidebarOpen: Component<{ size?: number }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

const IconSidebarClose: Component<{ size?: number }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <polyline points="14 9 17 12 14 15" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: DashboardIcon,
    ariaLabel: 'Dashboard - Overview and stats',
  },
  {
    id: 'your-worth',
    label: 'Your Worth',
    icon: ChartIcon,
    ariaLabel: 'Your Worth - Salary tracking',
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: JournalIcon,
    ariaLabel: 'Journal - Quarterly check-ins',
  },
  {
    id: 'reviews',
    label: '360 Reviews',
    icon: ReviewIcon,
    ariaLabel: '360 Reviews - Self and external feedback',
  },
  {
    id: 'export',
    label: 'Export',
    icon: ExportIcon,
    ariaLabel: 'Export - Download your data',
  },
];

const STORAGE_KEY = 'prosper_sidebar_collapsed';

function loadCollapsedState(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

function saveCollapsedState(collapsed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed.toString());
  } catch {
    // Silent fail
  }
}

export const ProsperSidebar: Component<ProsperSidebarProps> = (props) => {
  const theme = () => props.currentTheme();
  const [isCollapsed, setIsCollapsed] = createSignal(loadCollapsedState());

  createEffect(() => {
    saveCollapsedState(isCollapsed());
  });

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed());
  };

  const sidebarWidth = () => (isCollapsed() ? '60px' : '240px');

  return (
    <aside
      style={{
        width: sidebarWidth(),
        height: '100vh',
        background: 'linear-gradient(180deg, rgba(15, 15, 18, 0.98), rgba(10, 10, 12, 0.95))',
        'border-right': `1px solid ${theme().colors.border}`,
        display: 'flex',
        'flex-direction': 'column',
        'flex-shrink': 0,
        transition: `width ${pipelineAnimations.normal} cubic-bezier(0.4, 0, 0.2, 1)`,
        'z-index': 100,
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: isCollapsed() ? '16px 12px' : '16px 20px',
          'border-bottom': `1px solid ${theme().colors.border}`,
          display: 'flex',
          'align-items': 'center',
          'justify-content': isCollapsed() ? 'center' : 'space-between',
          'min-height': '64px',
          transition: `padding ${pipelineAnimations.normal}`,
        }}
      >
        <Show when={!isCollapsed()}>
          <div
            style={{
              'font-size': '18px',
              'font-family': "'Playfair Display', Georgia, serif",
              'font-weight': '700',
              color: theme().colors.text,
              'letter-spacing': '-0.02em',
            }}
          >
            Prosper
          </div>
        </Show>

        {/* Toggle Button */}
        <Tooltip
          content={isCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'}
          position="right"
          delay={200}
        >
          <button
            onClick={toggleCollapse}
            aria-label={isCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              width: '36px',
              height: '36px',
              padding: '8px',
              background: 'transparent',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '8px',
              color: theme().colors.textMuted,
              cursor: 'pointer',
              transition: `all ${pipelineAnimations.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = theme().colors.primary;
              e.currentTarget.style.color = theme().colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = theme().colors.border;
              e.currentTarget.style.color = theme().colors.textMuted;
            }}
          >
            <Show when={isCollapsed()} fallback={<IconSidebarOpen size={18} />}>
              <IconSidebarClose size={18} />
            </Show>
          </button>
        </Tooltip>
      </div>

      {/* Navigation Items */}
      <nav
        style={{
          flex: 1,
          padding: '12px 8px',
          display: 'flex',
          'flex-direction': 'column',
          gap: '4px',
        }}
        aria-label="Prosper navigation"
      >
        <For each={NAV_ITEMS}>
          {(item) => {
            const isActive = () => props.activeSection === item.id;

            const navButton = (
              <A
                href={`/tenure/prosper/${item.id}`}
                aria-label={item.ariaLabel}
                aria-current={isActive() ? 'page' : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  'align-items': 'center',
                  gap: '12px',
                  padding: isCollapsed() ? '12px' : '12px 16px',
                  background: isActive()
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))'
                    : 'transparent',
                  border: 'none',
                  'border-radius': '10px',
                  color: isActive() ? theme().colors.primary : theme().colors.textMuted,
                  'font-size': '14px',
                  'font-family': "'Space Grotesk', system-ui, sans-serif",
                  'font-weight': isActive() ? '600' : '500',
                  'text-align': 'left',
                  'text-decoration': 'none',
                  position: 'relative',
                  overflow: 'visible',
                  transition: `background ${pipelineAnimations.fast}, color ${pipelineAnimations.fast}, padding ${pipelineAnimations.fast}`,
                  'justify-content': isCollapsed() ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => {
                  if (!isActive()) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = theme().colors.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive()) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = theme().colors.textMuted;
                  }
                }}
              >
                {/* Active indicator */}
                <Show when={isActive()}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '20px',
                      background: theme().colors.primary,
                      'border-radius': '0 2px 2px 0',
                      'box-shadow': `0 0 8px ${theme().colors.primary}50`,
                    }}
                  />
                </Show>

                <item.icon size={20} />

                <Show when={!isCollapsed()}>
                  <span style={{ flex: 1 }}>{item.label}</span>
                </Show>
              </A>
            );

            // Always render navButton, don't wrap in Tooltip
            // The tooltip will be disabled when expanded
            return (
              <Tooltip content={item.label} position="right" delay={200} disabled={!isCollapsed()}>
                {navButton}
              </Tooltip>
            );
          }}
        </For>
      </nav>
    </aside>
  );
};

export default ProsperSidebar;
