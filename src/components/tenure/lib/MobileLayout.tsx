/**
 * MobileLayout - Standardized mobile page layout wrapper
 *
 * Provides consistent structure for all mobile views:
 * - MobileMenuProvider (navigation state)
 * - MobileHeader (sticky header with navigation)
 * - Responsive container padding
 * - MobileDrawer (slide-out navigation)
 *
 * Usage:
 * ```tsx
 * <MobileLayout
 *   title="Dashboard"
 *   theme={theme}
 *   drawerProps={{
 *     appName: "Prospect",
 *     navItems: NAV_ITEMS,
 *     currentSection: "dashboard",
 *     onNavigate: handleNavigate,
 *     currentTenureApp: "prospect"
 *   }}
 * >
 *   <YourContent />
 * </MobileLayout>
 * ```
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX, Show, Accessor } from 'solid-js';
import { useMobile } from './use-mobile';
import { MobileMenuProvider, MobileDrawer, MobileDrawerProps } from './mobile-menu-context';
import { MobileHeader, MOBILE_HEADER_HEIGHT } from './MobileHeader';
import { mobileTokens } from '../../../theme/mobile-tokens';

export interface MobileLayoutProps {
  /** Page title shown in mobile header */
  title: string;

  /** Theme configuration for header and drawer */
  theme?: Accessor<{
    colors: {
      border: string;
      text: string;
      background: string;
      textMuted: string;
      primary: string;
    };
  }>;

  /** Content to render inside the layout */
  children: JSX.Element;

  /** Props for the mobile drawer navigation */
  drawerProps: Omit<MobileDrawerProps, 'theme'>;

  /**
   * Container max-width (defaults to '1200px')
   * Set to 'none' for full-width layouts
   */
  maxWidth?: string;

  /**
   * Minimum height for the content area
   * Useful for ensuring full viewport height
   */
  minHeight?: string;

  /**
   * Additional container styles
   */
  containerStyle?: JSX.CSSProperties;
}

/**
 * MobileLayout Component
 *
 * Enforces consistent mobile page structure across all Tenure views.
 * Eliminates per-page boilerplate and ensures design token usage.
 */
export const MobileLayout: Component<MobileLayoutProps> = (props) => {
  const isMobile = useMobile();

  return (
    <MobileMenuProvider>
      {/* Mobile Header - Only shown on mobile */}
      <Show when={isMobile()}>
        <MobileHeader title={props.title} theme={props.theme} />
      </Show>

      {/* Main Content Container */}
      <div
        style={{
          'padding-top': isMobile()
            ? `calc(${MOBILE_HEADER_HEIGHT} + ${mobileTokens.spacing.containerPadding.mobile})`
            : mobileTokens.spacing.containerPadding.desktop,
          'padding-left': isMobile()
            ? mobileTokens.spacing.containerPadding.mobile
            : mobileTokens.spacing.containerPadding.desktop,
          'padding-right': isMobile()
            ? mobileTokens.spacing.containerPadding.mobile
            : mobileTokens.spacing.containerPadding.desktop,
          'padding-bottom': isMobile()
            ? mobileTokens.spacing.containerPadding.mobile
            : mobileTokens.spacing.containerPadding.desktop,
          'max-width': props.maxWidth ?? '1200px',
          margin: '0 auto',
          'min-height': props.minHeight,
          ...props.containerStyle,
        }}
      >
        {props.children}
      </div>

      {/* Mobile Drawer - Only shown on mobile */}
      <Show when={isMobile()}>
        <MobileDrawer {...props.drawerProps} theme={props.theme} />
      </Show>
    </MobileMenuProvider>
  );
};

export default MobileLayout;
