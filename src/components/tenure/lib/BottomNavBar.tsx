/**
 * BottomNavBar - Glassomorphic bottom navigation for mobile
 *
 * Features:
 * - Frosted glass effect with backdrop blur
 * - Safe area handling for home indicator
 * - Animated active states with glow effects
 * - Badge support for notifications
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, Show, Accessor } from 'solid-js';
import { mobileTokens } from '../../../theme/mobile-tokens';
import { useMobile } from './use-mobile';
import { haptics } from '../../../lib/haptics';

// ==========================================================================
// TYPES
// ==========================================================================

export interface BottomNavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon: Component<{ size?: number; color?: string; weight?: string }>;
  /** Accessible label */
  ariaLabel?: string;
  /** Badge count */
  badge?: number;
}

export interface BottomNavBarProps {
  /** Navigation items (max 5 recommended) */
  items: BottomNavItem[];
  /** Currently active item ID */
  activeId: string;
  /** Selection callback */
  onSelect: (id: string) => void;
  /** Theme accessor */
  theme?: Accessor<{
    colors: {
      primary: string;
      text: string;
      textMuted: string;
    };
  }>;
}

// ==========================================================================
// DEFAULT THEME
// ==========================================================================

const defaultTheme = {
  colors: {
    primary: '#60A5FA',
    text: 'rgba(255, 255, 255, 0.95)',
    textMuted: 'rgba(255, 255, 255, 0.45)',
  },
};

// ==========================================================================
// COMPONENT
// ==========================================================================

export const BottomNavBar: Component<BottomNavBarProps> = (props) => {
  const isMobile = useMobile();
  const getTheme = () => props.theme?.() ?? defaultTheme;

  return (
    <Show when={isMobile()}>
      {/* Fixed bottom nav */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          'z-index': mobileTokens.zIndex.sticky,
          // Glassomorphic styling
          background: mobileTokens.glass.presets.header.background,
          'backdrop-filter': mobileTokens.glass.presets.header.backdropFilter,
          '-webkit-backdrop-filter': mobileTokens.glass.presets.header.backdropFilter,
          // Border and shadow
          'border-top': `1px solid ${mobileTokens.glass.border.subtle}`,
          'box-shadow': '0 -4px 20px rgba(0, 0, 0, 0.15), 0 -1px 0 rgba(255, 255, 255, 0.03)',
          // Safe area padding
          'padding-bottom': 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Subtle gradient accent at top */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '1px',
            background: `linear-gradient(90deg, transparent 10%, ${getTheme().colors.primary}30 50%, transparent 90%)`,
          }}
        />

        <div
          style={{
            display: 'flex',
            'align-items': 'stretch',
            'justify-content': 'space-around',
            height: '68px',
            'max-width': '500px',
            margin: '0 auto',
            padding: '0 4px',
          }}
        >
          <For each={props.items}>
            {(item) => {
              const isActive = () => props.activeId === item.id;

              return (
                <button
                  onClick={() => {
                    haptics.selection();
                    props.onSelect(item.id);
                  }}
                  aria-label={item.ariaLabel || item.label}
                  aria-current={isActive() ? 'page' : undefined}
                  style={{
                    display: 'flex',
                    'flex-direction': 'column',
                    'align-items': 'center',
                    'justify-content': 'center',
                    gap: '6px',
                    flex: '1',
                    'min-width': '56px',
                    'max-width': '80px',
                    padding: '10px 4px 8px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: `all ${mobileTokens.duration.normal} ${mobileTokens.easing.flow}`,
                    '-webkit-tap-highlight-color': 'transparent',
                    'touch-action': 'manipulation',
                  }}
                >
                  {/* Active glow indicator */}
                  <Show when={isActive()}>
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '40px',
                        height: '28px',
                        'border-radius': '14px',
                        background: `radial-gradient(ellipse at center, ${getTheme().colors.primary}25 0%, ${getTheme().colors.primary}08 50%, transparent 70%)`,
                        'box-shadow': `0 0 20px ${getTheme().colors.primary}30, 0 0 40px ${getTheme().colors.primary}15`,
                        filter: 'blur(1px)',
                      }}
                    />
                  </Show>

                  {/* Icon container */}
                  <div
                    style={{
                      position: 'relative',
                      'z-index': 1,
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      transition: `transform ${mobileTokens.duration.fast} ${mobileTokens.easing.flow}`,
                      transform: isActive() ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    <item.icon
                      size={24}
                      color={isActive() ? getTheme().colors.primary : getTheme().colors.textMuted}
                      weight={isActive() ? 'fill' : 'regular'}
                    />

                    {/* Badge */}
                    <Show when={item.badge && item.badge > 0}>
                      <div
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-8px',
                          'min-width': '16px',
                          height: '16px',
                          padding: '0 4px',
                          background: '#EF4444',
                          'border-radius': '8px',
                          'font-size': '10px',
                          'font-weight': '700',
                          'font-family': mobileTokens.fonts.body,
                          color: 'white',
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                          'box-shadow': '0 2px 4px rgba(239, 68, 68, 0.4)',
                        }}
                      >
                        {item.badge! > 99 ? '99+' : item.badge}
                      </div>
                    </Show>
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      position: 'relative',
                      'z-index': 1,
                      'font-size': '10px',
                      'font-family': mobileTokens.fonts.body,
                      'font-weight': isActive() ? '600' : '500',
                      color: isActive() ? getTheme().colors.primary : getTheme().colors.textMuted,
                      'letter-spacing': '0.02em',
                      transition: `all ${mobileTokens.duration.fast} ${mobileTokens.easing.flow}`,
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }}
          </For>
        </div>
      </nav>

      {/* Spacer to prevent content overlap */}
      <div
        aria-hidden="true"
        style={{
          height: `calc(68px + env(safe-area-inset-bottom, 0px))`,
          'flex-shrink': '0',
        }}
      />
    </Show>
  );
};

export default BottomNavBar;
