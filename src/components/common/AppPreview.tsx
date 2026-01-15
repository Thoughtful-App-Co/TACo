/**
 * App Preview Modal
 *
 * Xbox/Microsoft Store-style app preview showing app details,
 * screenshots, features, and launch button. Inspired by modern
 * game store interfaces with rich media and clear CTAs.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, For, createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';

// ============================================================================
// TYPES
// ============================================================================

export interface AppPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunch: () => void;
  app: {
    id: string;
    name: string;
    description: string;
    elevatorPitch?: string;
    color: string;
    status: 'active' | 'alpha' | 'beta' | 'coming-soon';
    logo?: string;
    designSystem?: string;
    releaseDate?: string;
    version?: string;
    changelog?: string[];
  };
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const tokens = {
  colors: {
    background: '#0F0F1A',
    surface: '#1A1A2E',
    surfaceHover: '#252540',
    border: '#2A2A45',
    text: {
      primary: '#FFFFFF',
      secondary: '#A0A0B8',
      muted: '#6B6B80',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
};

// ============================================================================
// ICONS
// ============================================================================

const CloseIcon: Component = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PlayIcon: Component = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * AppPreview - Xbox/Microsoft Store-style app details modal
 */
export const AppPreview: Component<AppPreviewProps> = (props) => {
  const [isHoveringLaunch, setIsHoveringLaunch] = createSignal(false);
  const [dontShowAgain, setDontShowAgain] = createSignal(false);

  // Load preference from localStorage on mount
  const loadPreference = () => {
    const key = `taco_skip_preview_${props.app.id}`;
    return localStorage.getItem(key) === 'true';
  };

  // Save preference to localStorage
  const handleDontShowAgainChange = (checked: boolean) => {
    setDontShowAgain(checked);
    const key = `taco_skip_preview_${props.app.id}`;
    if (checked) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.removeItem(key);
    }
  };

  const getStatusBadge = () => {
    switch (props.app.status) {
      case 'alpha':
        return { label: 'ALPHA', color: '#EF4444' };
      case 'beta':
        return { label: 'BETA', color: '#F59E0B' };
      case 'active':
        return { label: 'LIVE', color: '#10B981' };
      case 'coming-soon':
        return { label: 'COMING SOON', color: '#6B7280' };
      default:
        return null;
    }
  };

  const statusBadge = () => getStatusBadge();
  const isAvailable = () =>
    props.app.status === 'active' || props.app.status === 'alpha' || props.app.status === 'beta';

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-preview-title"
          style={{
            position: 'fixed',
            inset: '0',
            'z-index': 99999,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            padding: tokens.spacing.lg,
          }}
          onClick={props.onClose}
        >
          {/* Backdrop */}
          <div
            style={{
              position: 'absolute',
              inset: '0',
              background: 'rgba(0, 0, 0, 0.85)',
              'backdrop-filter': 'blur(12px)',
              '-webkit-backdrop-filter': 'blur(12px)',
            }}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              'max-width': '900px',
              'max-height': '90vh',
              background: tokens.colors.surface,
              'border-radius': tokens.radius.xl,
              border: `1px solid ${tokens.colors.border}`,
              overflow: 'hidden',
              'box-shadow': `0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px ${props.app.color}30`,
              animation: 'appPreviewSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              'flex-direction': 'column',
            }}
          >
            {/* Header with Hero Image/Gradient */}
            <div
              style={{
                position: 'relative',
                height: '280px',
                background: `linear-gradient(135deg, ${props.app.color}40 0%, ${props.app.color}10 100%)`,
                'border-bottom': `2px solid ${props.app.color}40`,
                display: 'flex',
                'align-items': 'flex-end',
                padding: tokens.spacing.xl,
                overflow: 'hidden',
              }}
            >
              {/* Decorative pattern */}
              <div
                style={{
                  position: 'absolute',
                  inset: '0',
                  background: `radial-gradient(circle at 80% 20%, ${props.app.color}20 0%, transparent 50%)`,
                  opacity: '0.3',
                }}
              />

              {/* Close button */}
              <button
                onClick={props.onClose}
                aria-label="Close preview"
                style={{
                  position: 'absolute',
                  top: tokens.spacing.lg,
                  right: tokens.spacing.lg,
                  background: 'rgba(0, 0, 0, 0.5)',
                  'backdrop-filter': 'blur(8px)',
                  '-webkit-backdrop-filter': 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  'border-radius': '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <CloseIcon />
              </button>

              {/* App info */}
              <div style={{ position: 'relative', 'z-index': 1, width: '100%' }}>
                <div style={{ display: 'flex', 'align-items': 'flex-end', gap: tokens.spacing.lg }}>
                  {/* App icon */}
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      'border-radius': '20px',
                      background: props.app.logo
                        ? `${props.app.color} url(${props.app.logo}) center/${props.app.id === 'tenure' ? '95%' : '80%'} no-repeat`
                        : `linear-gradient(135deg, ${props.app.color} 0%, ${props.app.color}CC 100%)`,
                      border: '3px solid rgba(255, 255, 255, 0.2)',
                      'box-shadow': `0 8px 32px ${props.app.color}40`,
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
                      'font-size': '32px',
                      'font-weight': '700',
                      color: '#FFFFFF',
                    }}
                  >
                    <Show when={!props.app.logo}>{props.app.name.charAt(0)}</Show>
                  </div>

                  {/* Title and status */}
                  <div style={{ flex: 1, 'min-width': 0 }}>
                    <h2
                      id="app-preview-title"
                      style={{
                        margin: '0',
                        'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
                        'font-size': '36px',
                        'font-weight': '700',
                        color: '#FFFFFF',
                        'letter-spacing': '-0.5px',
                        'margin-bottom': tokens.spacing.xs,
                      }}
                    >
                      {props.app.name}
                    </h2>
                    <div
                      style={{
                        display: 'flex',
                        gap: tokens.spacing.sm,
                        'align-items': 'center',
                        'flex-wrap': 'wrap',
                      }}
                    >
                      <Show when={statusBadge()}>
                        {(badge) => (
                          <span
                            style={{
                              padding: '4px 12px',
                              background: `${badge().color}20`,
                              border: `1px solid ${badge().color}40`,
                              'border-radius': '6px',
                              'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
                              'font-size': '11px',
                              'font-weight': '700',
                              color: badge().color,
                              'letter-spacing': '0.5px',
                            }}
                          >
                            {badge().label}
                          </span>
                        )}
                      </Show>
                      <span
                        style={{
                          'font-family': '"Geist", "Inter", -apple-system, sans-serif',
                          'font-size': '14px',
                          color: tokens.colors.text.secondary,
                        }}
                      >
                        {props.app.description}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content area - scrollable */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: tokens.spacing.xl,
              }}
            >
              {/* Elevator pitch */}
              <Show when={props.app.elevatorPitch}>
                <div style={{ 'margin-bottom': tokens.spacing.xl }}>
                  <h3
                    style={{
                      margin: `0 0 ${tokens.spacing.md}`,
                      'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
                      'font-size': '18px',
                      'font-weight': '600',
                      color: tokens.colors.text.primary,
                    }}
                  >
                    About
                  </h3>
                  <p
                    style={{
                      margin: '0',
                      'font-family': '"Geist", "Inter", -apple-system, sans-serif',
                      'font-size': '15px',
                      'line-height': '1.7',
                      color: tokens.colors.text.secondary,
                    }}
                  >
                    {props.app.elevatorPitch}
                  </p>
                </div>
              </Show>

              {/* Details grid */}
              <div
                style={{
                  display: 'grid',
                  'grid-template-columns': 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: tokens.spacing.lg,
                  'margin-bottom': tokens.spacing.xl,
                }}
              >
                <Show when={props.app.designSystem}>
                  <div>
                    <div
                      style={{
                        'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
                        'font-size': '12px',
                        'font-weight': '600',
                        color: tokens.colors.text.muted,
                        'text-transform': 'uppercase',
                        'letter-spacing': '0.5px',
                        'margin-bottom': tokens.spacing.xs,
                      }}
                    >
                      Design System
                    </div>
                    <div
                      style={{
                        'font-family': '"Geist", "Inter", -apple-system, sans-serif',
                        'font-size': '15px',
                        color: tokens.colors.text.primary,
                      }}
                    >
                      {props.app.designSystem}
                    </div>
                  </div>
                </Show>

                <Show when={props.app.releaseDate}>
                  <div>
                    <div
                      style={{
                        'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
                        'font-size': '12px',
                        'font-weight': '600',
                        color: tokens.colors.text.muted,
                        'text-transform': 'uppercase',
                        'letter-spacing': '0.5px',
                        'margin-bottom': tokens.spacing.xs,
                      }}
                    >
                      Release Date
                    </div>
                    <div
                      style={{
                        'font-family': '"Geist", "Inter", -apple-system, sans-serif',
                        'font-size': '15px',
                        color: tokens.colors.text.primary,
                      }}
                    >
                      {props.app.releaseDate}
                    </div>
                  </div>
                </Show>

                <Show when={props.app.version}>
                  <div>
                    <div
                      style={{
                        'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
                        'font-size': '12px',
                        'font-weight': '600',
                        color: tokens.colors.text.muted,
                        'text-transform': 'uppercase',
                        'letter-spacing': '0.5px',
                        'margin-bottom': tokens.spacing.xs,
                      }}
                    >
                      Version
                    </div>
                    <div
                      style={{
                        'font-family': '"Geist", "Inter", -apple-system, sans-serif',
                        'font-size': '15px',
                        color: tokens.colors.text.primary,
                      }}
                    >
                      {props.app.version}
                    </div>
                  </div>
                </Show>
              </div>

              {/* Changelog */}
              <Show when={props.app.changelog && props.app.changelog.length > 0}>
                <div style={{ 'margin-bottom': tokens.spacing.xl }}>
                  <h3
                    style={{
                      margin: `0 0 ${tokens.spacing.md}`,
                      'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
                      'font-size': '18px',
                      'font-weight': '600',
                      color: tokens.colors.text.primary,
                    }}
                  >
                    What's New
                  </h3>
                  <ul
                    style={{
                      margin: '0',
                      padding: `0 0 0 ${tokens.spacing.lg}`,
                      'list-style': 'none',
                      display: 'flex',
                      'flex-direction': 'column',
                      gap: tokens.spacing.sm,
                    }}
                  >
                    <For each={props.app.changelog}>
                      {(item) => (
                        <li
                          style={{
                            position: 'relative',
                            'font-family': '"Geist", "Inter", -apple-system, sans-serif',
                            'font-size': '14px',
                            'line-height': '1.6',
                            color: tokens.colors.text.secondary,
                            'padding-left': tokens.spacing.md,
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              left: '0',
                              top: '7px',
                              width: '4px',
                              height: '4px',
                              'border-radius': '50%',
                              background: props.app.color,
                            }}
                          />
                          {item}
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>
            </div>

            {/* Footer with CTA */}
            <div
              style={{
                padding: tokens.spacing.xl,
                'border-top': `1px solid ${tokens.colors.border}`,
                background: tokens.colors.background,
              }}
            >
              {/* Don't show again checkbox */}
              <Show when={isAvailable()}>
                <label
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: tokens.spacing.sm,
                    'margin-bottom': tokens.spacing.md,
                    cursor: 'pointer',
                    'user-select': 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={dontShowAgain()}
                    onChange={(e) => handleDontShowAgainChange(e.currentTarget.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      'accent-color': props.app.color,
                    }}
                  />
                  <span
                    style={{
                      'font-family': '"Geist", "Inter", -apple-system, sans-serif',
                      'font-size': '14px',
                      color: tokens.colors.text.secondary,
                    }}
                  >
                    Don't show this again
                  </span>
                </label>
              </Show>

              <button
                onClick={props.onLaunch}
                disabled={!isAvailable()}
                onMouseEnter={() => setIsHoveringLaunch(true)}
                onMouseLeave={() => setIsHoveringLaunch(false)}
                style={{
                  width: '100%',
                  padding: `${tokens.spacing.md} ${tokens.spacing.xl}`,
                  background: isAvailable()
                    ? `linear-gradient(135deg, ${props.app.color} 0%, ${props.app.color}CC 100%)`
                    : tokens.colors.surface,
                  border: isAvailable() ? 'none' : `1px solid ${tokens.colors.border}`,
                  'border-radius': tokens.radius.md,
                  color: isAvailable() ? '#FFFFFF' : tokens.colors.text.muted,
                  'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
                  'font-size': '16px',
                  'font-weight': '600',
                  cursor: isAvailable() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  gap: tokens.spacing.sm,
                  'box-shadow':
                    isAvailable() && isHoveringLaunch()
                      ? `0 8px 24px ${props.app.color}50`
                      : isAvailable()
                        ? `0 4px 16px ${props.app.color}30`
                        : 'none',
                  transform:
                    isAvailable() && isHoveringLaunch() ? 'translateY(-2px)' : 'translateY(0)',
                }}
              >
                <Show when={isAvailable()}>
                  <PlayIcon />
                </Show>
                {isAvailable() ? 'Launch App' : 'Coming Soon'}
              </button>
            </div>
          </div>

          {/* Keyframes */}
          <style>
            {`
              @keyframes appPreviewSlideUp {
                from {
                  opacity: 0;
                  transform: translateY(40px) scale(0.96);
                }
                to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }
            `}
          </style>
        </div>
      </Portal>
    </Show>
  );
};

export default AppPreview;
