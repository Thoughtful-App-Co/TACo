/**
 * PageHeader - Responsive page title and subtitle component
 *
 * Provides consistent page headers across desktop and mobile:
 * - Desktop: Shows large title + subtitle
 * - Mobile: Hides title (shown in MobileHeader), shows only subtitle
 *
 * Usage:
 * ```tsx
 * <PageHeader
 *   title="Dashboard"
 *   subtitle="Overview of your job search progress"
 *   theme={theme}
 * />
 * ```
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, Accessor, JSX } from 'solid-js';
import { useMobile } from './use-mobile';
import { mobileTokens } from '../../../theme/mobile-tokens';

export interface PageHeaderProps {
  /**
   * Page title - shown on desktop, hidden on mobile
   * (mobile shows title in MobileHeader instead)
   */
  title?: string;

  /**
   * Subtitle/description - shown on both desktop and mobile
   */
  subtitle?: string;

  /**
   * Optional theme accessor for colors
   */
  theme?: Accessor<{
    colors: {
      text: string;
      textMuted: string;
      primary?: string;
    };
    fonts?: {
      heading: string;
      body: string;
    };
  }>;

  /**
   * Optional actions to display on the right side (desktop only)
   * Common use: Add buttons, filters, etc.
   */
  actions?: JSX.Element;

  /**
   * Custom title styles (overrides defaults)
   */
  titleStyle?: JSX.CSSProperties;

  /**
   * Custom subtitle styles (overrides defaults)
   */
  subtitleStyle?: JSX.CSSProperties;

  /**
   * Custom container styles
   */
  containerStyle?: JSX.CSSProperties;

  /**
   * Whether to show title on mobile (default: false)
   * Use this if the page doesn't have MobileHeader
   */
  showTitleOnMobile?: boolean;
}

const defaultTheme = {
  colors: {
    text: 'rgba(255, 255, 255, 0.95)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
  },
  fonts: {
    heading: mobileTokens.fonts.heading,
    body: mobileTokens.fonts.body,
  },
};

/**
 * PageHeader Component
 *
 * Handles responsive page titles with design token integration.
 * Automatically hides title on mobile when MobileHeader is present.
 */
export const PageHeader: Component<PageHeaderProps> = (props) => {
  const isMobile = useMobile();
  const getTheme = () => props.theme?.() ?? defaultTheme;

  const showTitle = () => {
    if (props.showTitleOnMobile) return true;
    return !isMobile();
  };

  // Don't render anything if no title and no subtitle
  if (!props.title && !props.subtitle) {
    return null;
  }

  return (
    <div
      style={{
        'margin-bottom': isMobile()
          ? mobileTokens.spacing.sectionGap.mobile // 24px
          : mobileTokens.spacing.sectionGap.desktop, // 32px
        display: props.actions ? 'flex' : 'block',
        'justify-content': props.actions ? 'space-between' : undefined,
        'align-items': props.actions ? 'flex-start' : undefined,
        gap: props.actions ? mobileTokens.spacing.lg : undefined,
        ...props.containerStyle,
      }}
    >
      {/* Title and Subtitle Group */}
      <div style={{ flex: props.actions ? '1' : undefined }}>
        {/* Title - Desktop only (or always if showTitleOnMobile=true) */}
        <Show when={props.title && showTitle()}>
          <h1
            style={{
              margin: props.subtitle ? `0 0 ${mobileTokens.spacing.sm} 0` : '0',
              'font-size': isMobile()
                ? mobileTokens.fontSize.pageTitle.mobile // 24px
                : mobileTokens.fontSize.pageTitle.desktop, // 48px
              'font-family': getTheme().fonts?.heading ?? mobileTokens.fonts.heading,
              'font-weight': mobileTokens.fontWeight.bold,
              color: getTheme().colors.text,
              'line-height': mobileTokens.lineHeight.tight,
              'letter-spacing': '-0.02em',
              ...props.titleStyle,
            }}
          >
            {props.title}
          </h1>
        </Show>

        {/* Subtitle - Always shown */}
        <Show when={props.subtitle}>
          <p
            style={{
              margin: 0,
              'font-size': mobileTokens.fontSize.md, // 15px
              'font-family': getTheme().fonts?.body ?? mobileTokens.fonts.body,
              'font-weight': mobileTokens.fontWeight.normal,
              color: getTheme().colors.textMuted,
              'line-height': mobileTokens.lineHeight.normal,
              ...props.subtitleStyle,
            }}
          >
            {props.subtitle}
          </p>
        </Show>
      </div>

      {/* Actions - Desktop only */}
      <Show when={props.actions && !isMobile()}>
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: mobileTokens.spacing.md,
            'flex-shrink': 0,
          }}
        >
          {props.actions}
        </div>
      </Show>
    </div>
  );
};

export default PageHeader;
