/**
 * Mobile Menu Context
 *
 * SolidJS context provider for mobile menu state management.
 * Provides centralized control for mobile navigation drawer open/close state.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import {
  createContext,
  useContext,
  createSignal,
  ParentComponent,
  Accessor,
  Component,
  Show,
  For,
} from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';
import { A, useNavigate } from '@solidjs/router';

import { haptics } from '../../../lib/haptics';
import { logger } from '../../../lib/logger';
import { mobileTokens } from '../../../theme/mobile-tokens';
import { useMobile } from './use-mobile';

// ============================================================================
// TYPES
// ============================================================================

interface MobileMenuContextValue {
  /** Whether the mobile menu is currently open */
  isOpen: Accessor<boolean>;
  /** Open the mobile menu */
  open: () => void;
  /** Close the mobile menu */
  close: () => void;
  /** Toggle the mobile menu state */
  toggle: () => void;
}

interface MobileMenuButtonProps {
  /** Optional theme accessor for styling customization */
  theme?: Accessor<{
    colors: {
      border: string;
      text: string;
    };
  }>;
  /** Optional additional styles */
  style?: JSX.CSSProperties;
  /** Optional class name */
  class?: string;
}

export interface MobileDrawerNavItem {
  id: string;
  label: string;
  icon: Component<{ size?: number; color?: string }>;
  ariaLabel: string;
}

export interface MobileDrawerProps {
  /** App name to display in header (e.g., 'Prospect' or 'Prosper') */
  appName: string;
  /** Navigation items for the drawer */
  navItems: MobileDrawerNavItem[];
  /** Current active section ID */
  currentSection: string;
  /** Callback when a navigation item is clicked */
  onNavigate: (sectionId: string) => void;
  /** Base path for navigation (e.g., '/tenure/prospect' or '/tenure/prosper') */
  basePath: string;
  /** Current Tenure app (for highlighting in the Tenure apps section) */
  currentTenureApp?: 'discover' | 'prepare' | 'prospect' | 'prosper';
  /** Optional theme accessor for styling customization */
  theme?: Accessor<{
    colors: {
      border: string;
      text: string;
      textMuted: string;
      primary: string;
      background: string;
    };
  }>;
}

// ============================================================================
// DEFAULT THEME
// ============================================================================

const defaultTheme = {
  colors: {
    border: 'rgba(255, 255, 255, 0.12)',
    text: 'rgba(255, 255, 255, 0.9)',
  },
};

const defaultDrawerTheme = {
  colors: {
    border: mobileTokens.glass.border.light,
    text: 'rgba(255, 255, 255, 0.95)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    primary: '#60A5FA',
    background: mobileTokens.glass.presets.header.background,
  },
};

// ============================================================================
// ICONS
// ============================================================================

const IconUser: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconSettings: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconClose: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Tenure App Icons
const IconBinoculars: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M10 10h4" />
    <path d="M4.5 8a2.5 2.5 0 0 1 5 0v8a2.5 2.5 0 0 1-5 0z" />
    <path d="M14.5 8a2.5 2.5 0 0 1 5 0v8a2.5 2.5 0 0 1-5 0z" />
    <path d="M7 8V5a2 2 0 0 1 2-2h1" />
    <path d="M17 8V5a2 2 0 0 0-2-2h-1" />
  </svg>
);

const IconCompass: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const IconHammer: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" />
    <path d="M17.64 15 22 10.64" />
    <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" />
  </svg>
);

const IconLotus: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M12 20c-3.5 0-7-1.5-7-5 0-2.5 2-4.5 4-6 .5-.5 1-1 1.5-2 .5 1 1 1.5 1.5 2 2 1.5 4 3.5 4 6 0 3.5-3.5 5-7 5z" />
    <path d="M12 20c3.5 0 7-1.5 7-5 0-2.5-2-4.5-4-6-.5-.5-1-1-1.5-2-.5 1-1 1.5-1.5 2-2 1.5-4 3.5-4 6 0 3.5 3.5 5 7 5z" />
    <path d="M12 5V3" />
    <path d="M5 12H3" />
    <path d="M21 12h-2" />
  </svg>
);

const IconGrid: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 20}
    height={props.size || 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

// Tenure Apps Configuration
const TENURE_APPS = [
  { id: 'discover' as const, label: 'Discover', icon: IconBinoculars },
  { id: 'prepare' as const, label: 'Prepare', icon: IconCompass },
  { id: 'prospect' as const, label: 'Prospect', icon: IconHammer },
  { id: 'prosper' as const, label: 'Prosper', icon: IconLotus },
];

// TACo Ecosystem Apps
const TACO_APPS = [
  { id: 'tempo', name: 'Tempo', description: 'A.D.H.D Task Master', color: '#5E6AD2' },
  { id: 'tenure', name: 'Tenure', description: 'Career Companion', color: '#9333EA' },
  { id: 'echoprax', name: 'Echoprax', description: 'Boutique Fitness', color: '#FF6B6B' },
  { id: 'nurture', name: 'Nurture', description: 'Relationships', color: '#2D5A45' },
  { id: 'papertrail', name: 'PaperTrail', description: 'News Tracker', color: '#F59E0B' },
] as const;

// ============================================================================
// CONTEXT
// ============================================================================

const MobileMenuContext = createContext<MobileMenuContextValue>();

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * Provider component for mobile menu state management.
 * Wrap your app or layout component with this provider to enable
 * mobile menu state access throughout the component tree.
 *
 * @example
 * ```tsx
 * <MobileMenuProvider>
 *   <Header />
 *   <MobileDrawer />
 *   <MainContent />
 * </MobileMenuProvider>
 * ```
 */
export const MobileMenuProvider: ParentComponent = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);

  const open = () => {
    haptics.light();
    setIsOpen(true);
  };

  const close = () => {
    haptics.light();
    setIsOpen(false);
  };

  const toggle = () => {
    haptics.light();
    setIsOpen((prev) => !prev);
  };

  const value: MobileMenuContextValue = {
    isOpen,
    open,
    close,
    toggle,
  };

  return <MobileMenuContext.Provider value={value}>{props.children}</MobileMenuContext.Provider>;
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access mobile menu state and actions.
 * Must be used within a MobileMenuProvider.
 *
 * @example
 * ```tsx
 * const menu = useMobileMenu();
 *
 * // Check if menu is open
 * if (menu.isOpen()) {
 *   // Render overlay
 * }
 *
 * // Open/close programmatically
 * menu.open();
 * menu.close();
 * menu.toggle();
 * ```
 *
 * @throws Error if used outside of MobileMenuProvider
 */
export function useMobileMenu(): MobileMenuContextValue {
  const context = useContext(MobileMenuContext);

  if (!context) {
    const error = new Error('useMobileMenu must be used within a MobileMenuProvider');
    logger.features.error('Mobile menu context error:', error);
    throw error;
  }

  return context;
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Hamburger menu button component.
 * Only renders on mobile viewports (width <= 768px).
 * Uses the mobile menu context to trigger open state.
 *
 * @example
 * ```tsx
 * // Basic usage (uses default dark theme)
 * <MobileMenuButton />
 *
 * // With custom theme
 * <MobileMenuButton theme={myTheme} />
 *
 * // With additional styles
 * <MobileMenuButton style={{ 'margin-left': '8px' }} />
 * ```
 */
export const MobileMenuButton: Component<MobileMenuButtonProps> = (props) => {
  const isMobile = useMobile();
  const menu = useMobileMenu();

  const getTheme = () => props.theme?.() ?? defaultTheme;

  return (
    <Show when={isMobile()}>
      <button
        onClick={() => menu.open()}
        aria-label="Open navigation menu"
        class={props.class}
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          width: '44px',
          height: '44px',
          padding: '0',
          background: 'rgba(255, 255, 255, 0.08)',
          border: `1px solid ${getTheme().colors.border}`,
          'border-radius': '10px',
          color: getTheme().colors.text,
          cursor: 'pointer',
          'flex-shrink': '0',
          ...props.style,
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </Show>
  );
};

/**
 * Mobile navigation drawer component.
 * Slides in from the right side when opened via MobileMenuButton.
 * Includes app navigation items and additional Profile/Settings links.
 *
 * @example
 * ```tsx
 * const navItems = [
 *   { id: 'dashboard', label: 'Dashboard', icon: IconDashboard, ariaLabel: 'Dashboard view' },
 *   { id: 'pipeline', label: 'Pipeline', icon: IconPipeline, ariaLabel: 'Pipeline view' },
 * ];
 *
 * <MobileDrawer
 *   appName="Prospect"
 *   navItems={navItems}
 *   currentSection={activeSection()}
 *   onNavigate={(id) => setActiveSection(id)}
 *   basePath="/tenure/prospect"
 *   currentTenureApp="prospect"
 *   theme={myTheme}
 * />
 * ```
 */
export const MobileDrawer: Component<MobileDrawerProps> = (props) => {
  const menu = useMobileMenu();
  const navigate = useNavigate();

  const getTheme = () => props.theme?.() ?? defaultDrawerTheme;

  // Swipe gesture state
  let touchStartX = 0;
  let touchCurrentX = 0;
  let isDragging = false;
  const SWIPE_THRESHOLD = 100; // Minimum distance to trigger close
  const SWIPE_VELOCITY_THRESHOLD = 0.5; // Minimum velocity (px/ms)
  let touchStartTime = 0;

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchCurrentX = touchStartX;
    touchStartTime = Date.now();
    isDragging = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    touchCurrentX = e.touches[0].clientX;

    // Calculate drag distance (positive = dragging right/towards edge)
    const dragDistance = touchCurrentX - touchStartX;

    // Only allow dragging to the right (closing direction)
    if (dragDistance > 0) {
      // Apply transform for visual feedback (optional - can be enhanced later)
      const drawer = e.currentTarget as HTMLElement;
      drawer.style.transform = `translateX(${Math.min(dragDistance, 280)}px)`;
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!isDragging) return;
    isDragging = false;

    const drawer = e.currentTarget as HTMLElement;
    const dragDistance = touchCurrentX - touchStartX;
    const touchDuration = Date.now() - touchStartTime;
    const velocity = Math.abs(dragDistance) / touchDuration;

    // Close if swiped far enough or fast enough
    if (
      dragDistance > SWIPE_THRESHOLD ||
      (dragDistance > 50 && velocity > SWIPE_VELOCITY_THRESHOLD)
    ) {
      menu.close();
    }

    // Reset transform
    drawer.style.transform = '';
  };

  const handleNavItemClick = (sectionId: string) => {
    haptics.light();
    props.onNavigate(sectionId);
    menu.close();
  };

  const handleTenureAppClick = (appId: string) => {
    haptics.selection();
    navigate(`/tenure/${appId}`);
    menu.close();
  };

  const handleProfileClick = () => {
    haptics.light();
    navigate('/tenure/profile');
    menu.close();
  };

  const handleSettingsClick = () => {
    haptics.light();
    navigate('/tenure/settings');
    menu.close();
  };

  const handleTacoAppClick = (appId: string) => {
    haptics.selection();
    navigate(`/${appId}`);
    menu.close();
  };

  return (
    <Show when={menu.isOpen()}>
      {/* Backdrop */}
      <div
        onClick={menu.close}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          'backdrop-filter': 'blur(8px)',
          '-webkit-backdrop-filter': 'blur(8px)',
          'z-index': mobileTokens.zIndex.backdrop,
          animation: 'mobile-drawer-fade-in 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Slide-out Panel from Right */}
      <aside
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '280px',
          'max-width': '85vw',
          // Glassomorphic background
          background: mobileTokens.glass.presets.header.background,
          'backdrop-filter': `${mobileTokens.glass.blur.heavy} saturate(180%)`,
          '-webkit-backdrop-filter': `${mobileTokens.glass.blur.heavy} saturate(180%)`,
          // Border with subtle highlight
          'border-left': `1px solid ${mobileTokens.glass.border.light}`,
          // Shadow for depth
          'box-shadow': `-4px 0 24px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.05)`,
          display: 'flex',
          'flex-direction': 'column',
          'z-index': mobileTokens.zIndex.modal,
          animation: 'mobile-drawer-slide-in 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          'will-change': 'transform',
        }}
      >
        {/* Header with App Name and Close Button */}
        <div
          style={{
            padding: `calc(16px + env(safe-area-inset-top, 0px)) 20px 16px`,
            'border-bottom': `1px solid ${mobileTokens.glass.border.subtle}`,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
            'min-height': '64px',
            position: 'relative',
          }}
        >
          {/* Gradient accent line */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '20px',
              right: '20px',
              height: '1px',
              background: `linear-gradient(90deg, transparent 0%, ${getTheme().colors.primary}40 50%, transparent 100%)`,
            }}
          />
          <div
            style={{
              'font-size': '18px',
              'font-family': "'Playfair Display', Georgia, serif",
              'font-weight': '700',
              color: getTheme().colors.text,
              'letter-spacing': '-0.02em',
            }}
          >
            {props.appName}
          </div>
          <button
            onClick={() => {
              haptics.light();
              menu.close();
            }}
            aria-label="Close menu"
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              width: mobileTokens.touchTargets.comfortable,
              height: mobileTokens.touchTargets.comfortable,
              'min-width': mobileTokens.touchTargets.minimum,
              'min-height': mobileTokens.touchTargets.minimum,
              padding: '0',
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 100%)`,
              'backdrop-filter': mobileTokens.glass.blur.medium,
              '-webkit-backdrop-filter': mobileTokens.glass.blur.medium,
              border: `1px solid ${mobileTokens.glass.border.light}`,
              'border-radius': mobileTokens.radii.xl,
              color: getTheme().colors.textMuted,
              cursor: 'pointer',
              transition: `all ${mobileTokens.duration.fast} ${mobileTokens.easing.flow}`,
              '-webkit-tap-highlight-color': 'transparent',
              'box-shadow': `inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 2px 8px rgba(0, 0, 0, 0.15)`,
            }}
          >
            <IconClose size={20} />
          </button>
        </div>

        {/* Tenure Apps Section */}
        <div
          style={{
            padding: mobileTokens.spacing.md,
            'border-bottom': `1px solid ${mobileTokens.glass.border.subtle}`,
          }}
        >
          <div
            style={{
              'font-size': '11px',
              'text-transform': 'uppercase',
              'letter-spacing': '0.5px',
              color: getTheme().colors.textMuted,
              'margin-bottom': '8px',
              'padding-left': '8px',
            }}
          >
            Tenure
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <For each={TENURE_APPS}>
              {(app) => {
                const isActive = () => props.currentTenureApp === app.id;
                return (
                  <button
                    onClick={() => handleTenureAppClick(app.id)}
                    aria-label={`Go to ${app.label}`}
                    aria-current={isActive() ? 'page' : undefined}
                    style={{
                      flex: 1,
                      display: 'flex',
                      'flex-direction': 'column',
                      'align-items': 'center',
                      gap: '4px',
                      padding: '10px 4px',
                      background: isActive()
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: isActive()
                        ? `1px solid ${getTheme().colors.primary}40`
                        : `1px solid ${getTheme().colors.border}`,
                      'border-radius': '10px',
                      color: isActive() ? getTheme().colors.primary : getTheme().colors.textMuted,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <app.icon size={20} />
                    <span
                      style={{
                        'font-size': '10px',
                        'font-family': "'Space Grotesk', system-ui, sans-serif",
                        'font-weight': isActive() ? '600' : '500',
                        'letter-spacing': '0.02em',
                      }}
                    >
                      {app.label}
                    </span>
                  </button>
                );
              }}
            </For>
          </div>
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: '16px 12px',
            display: 'flex',
            'flex-direction': 'column',
            gap: '8px',
            'overflow-y': 'auto',
          }}
          aria-label={`${props.appName} navigation`}
        >
          <For each={props.navItems}>
            {(item) => {
              const isActive = () => props.currentSection === item.id;
              return (
                <A
                  href={`${props.basePath}/${item.id}`}
                  onClick={() => handleNavItemClick(item.id)}
                  aria-label={item.ariaLabel}
                  aria-current={isActive() ? 'page' : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    'align-items': 'center',
                    gap: '14px',
                    padding: '14px 18px',
                    'min-height': '52px',
                    background: isActive()
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))'
                      : 'transparent',
                    border: 'none',
                    'border-radius': '12px',
                    color: isActive() ? getTheme().colors.primary : getTheme().colors.textMuted,
                    'font-size': '15px',
                    'font-family': "'Space Grotesk', system-ui, sans-serif",
                    'font-weight': isActive() ? '600' : '500',
                    'text-align': 'left',
                    'text-decoration': 'none',
                    position: 'relative',
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
                        width: '4px',
                        height: '24px',
                        background: getTheme().colors.primary,
                        'border-radius': '0 3px 3px 0',
                        'box-shadow': `0 0 8px ${getTheme().colors.primary}50`,
                      }}
                    />
                  </Show>
                  <item.icon size={22} />
                  <span>{item.label}</span>
                </A>
              );
            }}
          </For>
        </nav>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            background: mobileTokens.glass.border.subtle,
            margin: '0 16px',
          }}
        />

        {/* Profile & Settings */}
        <div
          style={{
            padding: '12px',
            display: 'flex',
            gap: '8px',
          }}
        >
          {/* Profile Link */}
          <button
            onClick={handleProfileClick}
            aria-label="Go to Profile"
            style={{
              flex: 1,
              display: 'flex',
              'flex-direction': 'column',
              'align-items': 'center',
              gap: '4px',
              padding: '10px 4px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${mobileTokens.glass.border.subtle}`,
              'border-radius': '10px',
              color: getTheme().colors.textMuted,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <IconUser size={20} />
            <span
              style={{
                'font-size': '10px',
                'font-family': mobileTokens.fonts.body,
                'font-weight': '500',
                'letter-spacing': '0.02em',
              }}
            >
              Profile
            </span>
          </button>

          {/* Settings Link */}
          <button
            onClick={handleSettingsClick}
            aria-label="Go to Settings"
            style={{
              flex: 1,
              display: 'flex',
              'flex-direction': 'column',
              'align-items': 'center',
              gap: '4px',
              padding: '10px 4px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${mobileTokens.glass.border.subtle}`,
              'border-radius': '10px',
              color: getTheme().colors.textMuted,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <IconSettings size={20} />
            <span
              style={{
                'font-size': '10px',
                'font-family': mobileTokens.fonts.body,
                'font-weight': '500',
                'letter-spacing': '0.02em',
              }}
            >
              Settings
            </span>
          </button>
        </div>

        {/* TACo Apps Section */}
        <div
          style={{
            padding: '12px',
            'padding-bottom': 'calc(16px + env(safe-area-inset-bottom, 0px))',
            'border-top': `1px solid ${mobileTokens.glass.border.subtle}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              'margin-bottom': '10px',
              'padding-left': '4px',
            }}
          >
            <IconGrid size={14} color="rgba(255, 255, 255, 0.4)" />
            <span
              style={{
                'font-size': '11px',
                'text-transform': 'uppercase',
                'letter-spacing': '0.5px',
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              TACo Apps
            </span>
          </div>
          <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '6px' }}>
            <For each={TACO_APPS}>
              {(app) => {
                const isCurrentApp = () => window.location.pathname.startsWith(`/${app.id}`);
                return (
                  <button
                    onClick={() => handleTacoAppClick(app.id)}
                    aria-label={`Go to ${app.name}`}
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: isCurrentApp()
                        ? `linear-gradient(135deg, ${app.color}20, ${app.color}10)`
                        : 'rgba(255, 255, 255, 0.04)',
                      border: isCurrentApp()
                        ? `1px solid ${app.color}40`
                        : `1px solid ${mobileTokens.glass.border.subtle}`,
                      'border-radius': '8px',
                      color: isCurrentApp() ? app.color : 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        'border-radius': '50%',
                        background: app.color,
                        'box-shadow': isCurrentApp() ? `0 0 6px ${app.color}` : 'none',
                      }}
                    />
                    <span
                      style={{
                        'font-size': '12px',
                        'font-family': mobileTokens.fonts.body,
                        'font-weight': isCurrentApp() ? '600' : '500',
                      }}
                    >
                      {app.name}
                    </span>
                  </button>
                );
              }}
            </For>
          </div>
        </div>
      </aside>

      {/* CSS Animations */}
      <style>{`
        @keyframes mobile-drawer-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes mobile-drawer-slide-in {
          from { 
            transform: translateX(100%);
            opacity: 0.8;
          }
          to { 
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </Show>
  );
};
