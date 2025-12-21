/**
 * ProspectSidebar - Left navigation sidebar for Prospect tool
 * Collapsible to icon-only mode with tooltips
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import { liquidAugment, pipelineAnimations } from '../theme/liquid-augment';
import {
  IconGrid,
  IconTrendingUp,
  IconSettings,
  IconChevronLeft,
  IconChevronRight,
} from '../ui/Icons';
import { Tooltip } from '../ui';

export type ProspectSection = 'dashboard' | 'pipeline' | 'insights' | 'settings';

interface ProspectSidebarProps {
  activeSection: ProspectSection;
  onSectionChange: (section: ProspectSection) => void;
  currentTheme: () => Partial<typeof liquidAugment> & typeof liquidAugment;
}

interface NavItem {
  id: ProspectSection;
  label: string;
  icon: Component<{ size?: number; color?: string }>;
  ariaLabel: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (props) => (
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
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    ariaLabel: 'Dashboard - Stats and recent activity',
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: IconGrid,
    ariaLabel: 'Pipeline - Kanban board and list view',
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: IconTrendingUp,
    ariaLabel: 'Insights - Flow diagram and analytics',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: IconSettings,
    ariaLabel: 'Settings - Criteria and preferences',
  },
];

const STORAGE_KEY = 'prospect_sidebar_collapsed';

function loadCollapsedState(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Default to collapsed (true) if no preference stored
    return stored === null ? true : stored === 'true';
  } catch {
    return true; // Default to collapsed for more visual real-estate
  }
}

function saveCollapsedState(collapsed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed.toString());
  } catch {
    // Silent fail
  }
}

export const ProspectSidebar: Component<ProspectSidebarProps> = (props) => {
  const theme = () => props.currentTheme();
  const [isCollapsed, setIsCollapsed] = createSignal(loadCollapsedState());

  // Persist collapse state
  createEffect(() => {
    saveCollapsedState(isCollapsed());
  });

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed());
  };

  const handleNavClick = (section: ProspectSection) => {
    props.onSectionChange(section);
  };

  const sidebarWidth = () => (isCollapsed() ? '60px' : '240px');

  return (
    <>
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
        {/* Logo / Header */}
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
              Prospect
            </div>
          </Show>

          <Show when={isCollapsed()}>
            <div
              style={{
                'font-size': '20px',
                'font-family': "'Playfair Display', Georgia, serif",
                'font-weight': '700',
                color: theme().colors.primary,
              }}
            >
              P
            </div>
          </Show>
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
          aria-label="Prospect navigation"
        >
          <For each={NAV_ITEMS}>
            {(item) => {
              const isActive = () => props.activeSection === item.id;

              const navButton = (
                <button
                  onClick={() => handleNavClick(item.id)}
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
                    cursor: 'pointer',
                    'font-size': '14px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    'font-weight': isActive() ? '600' : '500',
                    'text-align': 'left',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: `all ${pipelineAnimations.fast}`,
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
                </button>
              );

              // Wrap in tooltip when collapsed
              return (
                <Show when={isCollapsed()} fallback={navButton}>
                  <Tooltip content={item.label} position="right" delay={200}>
                    {navButton}
                  </Tooltip>
                </Show>
              );
            }}
          </For>
        </nav>

        {/* Collapse Toggle */}
        <div
          style={{
            padding: '12px 8px',
            'border-top': `1px solid ${theme().colors.border}`,
          }}
        >
          <Tooltip
            content={isCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'}
            position="right"
            delay={200}
          >
            <button
              onClick={toggleCollapse}
              aria-label={isCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                width: '100%',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                padding: '10px',
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
              <Show when={isCollapsed()} fallback={<IconChevronLeft size={18} />}>
                <IconChevronRight size={18} />
              </Show>
            </button>
          </Tooltip>
        </div>
      </aside>
    </>
  );
};

export default ProspectSidebar;
