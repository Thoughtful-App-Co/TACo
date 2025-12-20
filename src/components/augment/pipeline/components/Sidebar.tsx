/**
 * Sidebar - Slide-out panel for Profile and Settings
 * Fitts-optimized: stays in context, large touch targets, minimal travel
 * Resizable with drag handle
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { liquidAugment } from '../theme/liquid-augment';
import { ProfileBuilder } from './ProfileBuilder';
import { SyncSettings } from './SyncSettings';
import { IconX, IconUser, IconSettings } from '../ui/Icons';

export type SidebarView = 'profile' | 'settings' | null;

// Default widths for each view
const DEFAULT_WIDTHS: Record<Exclude<SidebarView, null>, number> = {
  profile: 560,
  settings: 480,
};

const MIN_WIDTH = 360;
const MAX_WIDTH = 800;

// Persist width preferences
const STORAGE_KEY = 'augment_sidebar_widths';

function loadWidths(): Record<string, number> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveWidths(widths: Record<string, number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
}

interface SidebarProps {
  isOpen: boolean;
  view: SidebarView;
  onClose: () => void;
  currentTheme: () => Partial<typeof liquidAugment> & typeof liquidAugment;
}

export const Sidebar: Component<SidebarProps> = (props) => {
  const theme = () => props.currentTheme();

  // Stored widths from localStorage
  const storedWidths = loadWidths();

  // Current width based on view
  const getInitialWidth = () => {
    if (!props.view) return DEFAULT_WIDTHS.settings;
    return storedWidths[props.view] || DEFAULT_WIDTHS[props.view];
  };

  const [width, setWidth] = createSignal(getInitialWidth());
  const [isDragging, setIsDragging] = createSignal(false);
  const [hasAnimated, setHasAnimated] = createSignal(false);

  // Update width when view changes, reset animation flag on new open
  createEffect(() => {
    const view = props.view;
    if (view) {
      const savedWidth = storedWidths[view] || DEFAULT_WIDTHS[view];
      setWidth(savedWidth);
    }
  });

  // Reset animation flag when sidebar closes
  createEffect(() => {
    if (!props.isOpen) {
      setHasAnimated(false);
    }
  });

  // Mark as animated after initial render
  createEffect(() => {
    if (props.isOpen && !hasAnimated()) {
      // Small delay to let animation play, then mark as animated
      const timer = setTimeout(() => setHasAnimated(true), 300);
      onCleanup(() => clearTimeout(timer));
    }
  });

  // Handle drag resize
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startWidth = width();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Save the width preference
      if (props.view) {
        const widths = loadWidths();
        widths[props.view] = width();
        saveWidths(widths);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle escape key to close
  createEffect(() => {
    if (props.isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          props.onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      onCleanup(() => document.removeEventListener('keydown', handleKeyDown));
    }
  });

  // Prevent body scroll when open
  createEffect(() => {
    if (props.isOpen) {
      document.body.style.overflow = 'hidden';
      onCleanup(() => {
        document.body.style.overflow = '';
      });
    }
  });

  const getTitle = () => {
    switch (props.view) {
      case 'profile':
        return 'Profile';
      case 'settings':
        return 'Settings';
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (props.view) {
      case 'profile':
        return <IconUser size={20} />;
      case 'settings':
        return <IconSettings size={20} />;
      default:
        return null;
    }
  };

  return (
    <Show when={props.isOpen}>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          'backdrop-filter': 'blur(4px)',
          'z-index': 999,
          animation: 'sidebar-fade-in 0.2s ease-out',
          cursor: isDragging() ? 'ew-resize' : 'default',
        }}
        onClick={props.onClose}
      />

      {/* Sidebar Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: `${width()}px`,
          'max-width': '100vw',
          background: theme().colors.surface,
          'border-left': `1px solid ${theme().colors.border}`,
          'box-shadow': '-8px 0 32px rgba(0, 0, 0, 0.3)',
          'z-index': 1000,
          display: 'flex',
          'flex-direction': 'column',
          animation: isDragging() || hasAnimated() ? 'none' : 'sidebar-slide-in 0.25s ease-out',
          'user-select': isDragging() ? 'none' : 'auto',
        }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '12px',
            cursor: 'ew-resize',
            'z-index': 10,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
          }}
          onMouseEnter={(e) => {
            const handle = e.currentTarget.querySelector('.resize-handle-bar') as HTMLElement;
            if (handle) {
              handle.style.opacity = '1';
              handle.style.background = theme().colors.primary;
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging()) {
              const handle = e.currentTarget.querySelector('.resize-handle-bar') as HTMLElement;
              if (handle) {
                handle.style.opacity = '0.5';
                handle.style.background = theme().colors.border;
              }
            }
          }}
        >
          {/* Visual handle bar */}
          <div
            class="resize-handle-bar"
            style={{
              width: '4px',
              height: '48px',
              'border-radius': '2px',
              background: isDragging() ? theme().colors.primary : theme().colors.border,
              opacity: isDragging() ? '1' : '0.5',
              transition: 'all 0.15s ease',
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
            padding: '20px 24px 20px 28px',
            'border-bottom': `1px solid ${theme().colors.border}`,
            'flex-shrink': 0,
          }}
        >
          <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                width: '36px',
                height: '36px',
                'border-radius': '10px',
                background: `${theme().colors.primary}20`,
                color: theme().colors.primary,
              }}
            >
              {getIcon()}
            </div>
            <h2
              style={{
                margin: 0,
                'font-size': '20px',
                'font-family': "'Playfair Display', Georgia, serif",
                'font-weight': '600',
                color: theme().colors.text,
              }}
            >
              {getTitle()}
            </h2>
          </div>

          <button
            onClick={props.onClose}
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              width: '40px',
              height: '40px',
              background: 'transparent',
              border: `1px solid ${theme().colors.border}`,
              'border-radius': '10px',
              cursor: 'pointer',
              color: theme().colors.textMuted,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = theme().colors.text;
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = theme().colors.textMuted;
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Close (Esc)"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px 24px 24px 28px',
          }}
        >
          <Show when={props.view === 'profile'}>
            <ProfileBuilder currentTheme={theme} />
          </Show>

          <Show when={props.view === 'settings'}>
            <SyncSettings currentTheme={theme} />
          </Show>
        </div>
      </div>

      {/* Inject keyframes */}
      <style>{`
        @keyframes sidebar-slide-in {
          from {
            transform: translateX(100%);
            opacity: 0.8;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes sidebar-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </Show>
  );
};

export default Sidebar;
