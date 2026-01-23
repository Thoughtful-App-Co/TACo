/**
 * MobileHeader - Glassomorphic sticky header for mobile views
 *
 * Features:
 * - Frosted glass effect with backdrop blur
 * - Safe area handling for iPhone notch
 * - Section breadcrumb picker for quick navigation
 * - Smooth transitions and hover states
 *
 * Layout: [Hamburger Menu] [Title] [Section Picker]
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, Accessor, For, createSignal } from 'solid-js';
import { useMobile } from './use-mobile';
import { useMobileMenu } from './mobile-menu-context';
import { mobileTokens } from '../../../theme/mobile-tokens';
import { haptics } from '../../../lib/haptics';

interface MobileHeaderProps {
  title: string;
  theme?: Accessor<{
    colors: {
      primary: string;
      border: string;
      text: string;
      background: string;
      textMuted: string;
    };
  }>;
  /** Optional subtitle shown below title */
  subtitle?: string;
  /** Whether to show a subtle gradient accent */
  showAccent?: boolean;
  /** Breadcrumb items for section navigation */
  breadcrumbItems?: BreadcrumbItem[];
  /** Currently active breadcrumb item ID */
  activeBreadcrumb?: string;
  /** Callback when a breadcrumb item is selected */
  onBreadcrumbSelect?: (id: string) => void;
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  icon?: Component<{ size?: number; color?: string }>;
}

const defaultTheme = {
  colors: {
    primary: '#60A5FA',
    border: mobileTokens.glass.border.subtle,
    text: 'rgba(255, 255, 255, 0.95)',
    background: mobileTokens.glass.presets.header.background,
    textMuted: 'rgba(255, 255, 255, 0.6)',
  },
};

// Hamburger Icon with animation-ready paths
const HamburgerIcon: Component<{ size?: number }> = (props) => (
  <svg
    width={props.size || 22}
    height={props.size || 22}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const ChevronDownIcon: Component<{ size?: number }> = (props) => (
  <svg
    width={props.size || 16}
    height={props.size || 16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const MobileHeader: Component<MobileHeaderProps> = (props) => {
  const isMobile = useMobile();
  const menu = useMobileMenu();
  const [showPicker, setShowPicker] = createSignal(false);

  const getTheme = () => props.theme?.() ?? defaultTheme;

  // Glassomorphic button style - matching bottom nav aesthetic
  const buttonStyle = (): Record<string, string> => ({
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    width: '52px', // Slightly larger for more presence
    height: '52px',
    'min-width': mobileTokens.touchTargets.minimum,
    'min-height': mobileTokens.touchTargets.minimum,
    padding: '0',
    // Glassomorphic background with depth
    background: `linear-gradient(135deg, 
      rgba(255, 255, 255, 0.12) 0%, 
      rgba(255, 255, 255, 0.05) 100%)`,
    'backdrop-filter': mobileTokens.glass.blur.medium,
    '-webkit-backdrop-filter': mobileTokens.glass.blur.medium,
    // Subtle border for definition
    border: `1px solid rgba(255, 255, 255, 0.12)`,
    'border-radius': mobileTokens.radii.xl, // More rounded for modern feel
    color: getTheme().colors.text,
    cursor: 'pointer',
    transition: `all ${mobileTokens.duration.normal} ${mobileTokens.easing.flow}`,
    // Touch optimization
    '-webkit-tap-highlight-color': 'transparent',
    'touch-action': 'manipulation',
    // 3D depth effect with multiple shadows
    'box-shadow': `
      inset 0 1px 1px rgba(255, 255, 255, 0.1),
      inset 0 -1px 1px rgba(0, 0, 0, 0.1),
      0 2px 8px rgba(0, 0, 0, 0.15),
      0 0 1px rgba(255, 255, 255, 0.1)
    `
      .replace(/\s+/g, ' ')
      .trim(),
  });

  // Enhanced hover state with glow
  const handleButtonHover = (e: MouseEvent | FocusEvent, isHover: boolean) => {
    const btn = e.currentTarget as HTMLElement;
    if (isHover) {
      btn.style.background = `linear-gradient(135deg, 
        rgba(255, 255, 255, 0.18) 0%, 
        rgba(255, 255, 255, 0.08) 100%)`.replace(/\s+/g, ' ');
      btn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      btn.style.transform = 'translateY(-1px) scale(1.02)';
      btn.style.boxShadow = `
        inset 0 1px 1px rgba(255, 255, 255, 0.15),
        inset 0 -1px 1px rgba(0, 0, 0, 0.1),
        0 4px 12px rgba(0, 0, 0, 0.2),
        0 0 20px rgba(${getTheme().colors.primary === '#FFFFFF' ? '255, 255, 255' : '96, 165, 250'}, 0.1)
      `
        .replace(/\s+/g, ' ')
        .trim();
    } else {
      btn.style.background = `linear-gradient(135deg, 
        rgba(255, 255, 255, 0.12) 0%, 
        rgba(255, 255, 255, 0.05) 100%)`.replace(/\s+/g, ' ');
      btn.style.borderColor = 'rgba(255, 255, 255, 0.12)';
      btn.style.transform = 'translateY(0) scale(1)';
      btn.style.boxShadow = `
        inset 0 1px 1px rgba(255, 255, 255, 0.1),
        inset 0 -1px 1px rgba(0, 0, 0, 0.1),
        0 2px 8px rgba(0, 0, 0, 0.15),
        0 0 1px rgba(255, 255, 255, 0.1)
      `
        .replace(/\s+/g, ' ')
        .trim();
    }
  };

  const handleButtonFocus = (e: FocusEvent, isFocus: boolean) => {
    const btn = e.currentTarget as HTMLElement;
    if (isFocus) {
      btn.style.outline = 'none';
      btn.style.boxShadow = `
        inset 0 1px 1px rgba(255, 255, 255, 0.1),
        inset 0 -1px 1px rgba(0, 0, 0, 0.1),
        0 2px 8px rgba(0, 0, 0, 0.15),
        0 0 0 2px rgba(96, 165, 250, 0.5),
        0 0 20px rgba(96, 165, 250, 0.2)
      `
        .replace(/\s+/g, ' ')
        .trim();
    } else {
      btn.style.boxShadow = `
        inset 0 1px 1px rgba(255, 255, 255, 0.1),
        inset 0 -1px 1px rgba(0, 0, 0, 0.1),
        0 2px 8px rgba(0, 0, 0, 0.15),
        0 0 1px rgba(255, 255, 255, 0.1)
      `
        .replace(/\s+/g, ' ')
        .trim();
    }
  };

  return (
    <Show when={isMobile()}>
      <header
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          width: '100%',
          'z-index': mobileTokens.zIndex.sticky,
          // Glassomorphic styling
          background: mobileTokens.glass.presets.header.background,
          'backdrop-filter': mobileTokens.glass.presets.header.backdropFilter,
          '-webkit-backdrop-filter': mobileTokens.glass.presets.header.backdropFilter,
          // Layout
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          // Height with safe area
          height: `calc(64px + env(safe-area-inset-top, 0px))`,
          'padding-top': `calc(6px + env(safe-area-inset-top, 0px))`,
          'padding-left': mobileTokens.spacing.xl,
          'padding-right': mobileTokens.spacing.xl,
          'padding-bottom': '6px',
          // Border and shadow for depth
          'border-bottom': mobileTokens.glass.presets.header.border,
          'box-shadow': '0 1px 0 rgba(255, 255, 255, 0.03), 0 4px 20px rgba(0, 0, 0, 0.15)',
          'box-sizing': 'border-box',
        }}
      >
        {/* Subtle gradient accent line at top */}
        <Show when={props.showAccent !== false}>
          <div
            style={{
              position: 'absolute',
              top: 'env(safe-area-inset-top, 0px)',
              left: '0',
              right: '0',
              height: '1px',
              background: `linear-gradient(90deg, transparent 0%, ${getTheme().colors.primary}40 50%, transparent 100%)`,
              opacity: '0.6',
            }}
          />
        </Show>

        {/* Left: Hamburger Menu Button */}
        <button
          onClick={() => {
            haptics.impact();
            menu.open();
          }}
          aria-label="Open navigation menu"
          style={buttonStyle()}
          onMouseEnter={(e) => handleButtonHover(e, true)}
          onMouseLeave={(e) => handleButtonHover(e, false)}
          onFocus={(e) => handleButtonFocus(e, true)}
          onBlur={(e) => handleButtonFocus(e, false)}
        >
          <HamburgerIcon size={20} />
        </button>

        {/* Center: Title (and optional subtitle) */}
        <div
          style={{
            flex: '1',
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            'justify-content': 'center',
            padding: `0 ${mobileTokens.spacing.md}`,
            overflow: 'hidden',
          }}
        >
          <h1
            style={{
              margin: '0',
              'font-size': mobileTokens.fontSize.lg,
              'font-family': mobileTokens.fonts.heading,
              'font-weight': mobileTokens.fontWeight.semibold,
              color: getTheme().colors.text,
              'text-align': 'center',
              'white-space': 'nowrap',
              overflow: 'hidden',
              'text-overflow': 'ellipsis',
              'max-width': '100%',
              'letter-spacing': '-0.01em',
            }}
          >
            {props.title}
          </h1>
          <Show when={props.subtitle}>
            <span
              style={{
                margin: '2px 0 0 0',
                'font-size': mobileTokens.fontSize.xs,
                'font-family': mobileTokens.fonts.body,
                'font-weight': mobileTokens.fontWeight.normal,
                color: getTheme().colors.textMuted,
                'text-align': 'center',
                'white-space': 'nowrap',
                overflow: 'hidden',
                'text-overflow': 'ellipsis',
                'max-width': '100%',
              }}
            >
              {props.subtitle}
            </span>
          </Show>
        </div>

        {/* Right: Section Breadcrumb Picker */}
        <Show
          when={props.breadcrumbItems && props.breadcrumbItems.length > 0}
          fallback={<div style={{ width: '52px' }} />}
        >
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                haptics.light();
                setShowPicker(!showPicker());
              }}
              aria-label="Select section"
              aria-expanded={showPicker()}
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '6px',
                padding: '8px 12px',
                'min-height': mobileTokens.touchTargets.minimum,
                background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 100%)`,
                'backdrop-filter': mobileTokens.glass.blur.light,
                '-webkit-backdrop-filter': mobileTokens.glass.blur.light,
                border: `1px solid ${mobileTokens.glass.border.light}`,
                'border-radius': mobileTokens.radii.lg,
                color: getTheme().colors.primary,
                cursor: 'pointer',
                transition: `all ${mobileTokens.duration.fast} ${mobileTokens.easing.flow}`,
                '-webkit-tap-highlight-color': 'transparent',
              }}
            >
              <span
                style={{
                  'font-size': '13px',
                  'font-family': mobileTokens.fonts.body,
                  'font-weight': '600',
                  'max-width': '100px',
                  overflow: 'hidden',
                  'text-overflow': 'ellipsis',
                  'white-space': 'nowrap',
                }}
              >
                {props.breadcrumbItems?.find((item) => item.id === props.activeBreadcrumb)?.label ||
                  'Select'}
              </span>
              <ChevronDownIcon size={14} />
            </button>

            {/* Dropdown Picker */}
            <Show when={showPicker()}>
              {/* Backdrop to close */}
              <div
                onClick={() => setShowPicker(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  'z-index': 10,
                }}
              />
              {/* Dropdown menu */}
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  'margin-top': '8px',
                  'min-width': '160px',
                  background: mobileTokens.glass.presets.modal.background,
                  'backdrop-filter': mobileTokens.glass.presets.modal.backdropFilter,
                  '-webkit-backdrop-filter': mobileTokens.glass.presets.modal.backdropFilter,
                  border: mobileTokens.glass.presets.modal.border,
                  'border-radius': mobileTokens.radii.lg,
                  'box-shadow': mobileTokens.glass.shadow.elevated,
                  overflow: 'hidden',
                  'z-index': 20,
                  animation: 'breadcrumb-dropdown-in 0.15s ease-out',
                }}
              >
                <For each={props.breadcrumbItems}>
                  {(item) => {
                    const isActive = () => item.id === props.activeBreadcrumb;
                    return (
                      <button
                        onClick={() => {
                          haptics.selection();
                          props.onBreadcrumbSelect?.(item.id);
                          setShowPicker(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          'align-items': 'center',
                          gap: '10px',
                          padding: '12px 16px',
                          background: isActive() ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                          border: 'none',
                          'border-bottom': `1px solid ${mobileTokens.glass.border.subtle}`,
                          color: isActive() ? getTheme().colors.primary : getTheme().colors.text,
                          'font-size': '14px',
                          'font-family': mobileTokens.fonts.body,
                          'font-weight': isActive() ? '600' : '500',
                          cursor: 'pointer',
                          'text-align': 'left',
                          transition: `all ${mobileTokens.duration.fast} ease`,
                        }}
                      >
                        <Show when={item.icon}>
                          {item.icon && (
                            <item.icon
                              size={18}
                              color={
                                isActive() ? getTheme().colors.primary : getTheme().colors.textMuted
                              }
                            />
                          )}
                        </Show>
                        <span>{item.label}</span>
                        <Show when={isActive()}>
                          <div
                            style={{
                              'margin-left': 'auto',
                              width: '6px',
                              height: '6px',
                              'border-radius': '50%',
                              background: getTheme().colors.primary,
                              'box-shadow': `0 0 6px ${getTheme().colors.primary}`,
                            }}
                          />
                        </Show>
                      </button>
                    );
                  }}
                </For>
              </div>
            </Show>
          </div>
        </Show>

        {/* Breadcrumb dropdown animation */}
        <style>{`
          @keyframes breadcrumb-dropdown-in {
            from {
              opacity: 0;
              transform: translateY(-8px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </header>
    </Show>
  );
};

/** Total header height including safe area - use for content padding-top */
export const MOBILE_HEADER_HEIGHT = `calc(64px + env(safe-area-inset-top, 0px))`;

export default MobileHeader;
