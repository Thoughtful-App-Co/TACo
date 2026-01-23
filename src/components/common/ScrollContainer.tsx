/**
 * ScrollContainer - Optimized scrolling container for mobile
 *
 * Provides smooth, native-like scrolling with:
 * - Momentum scrolling on iOS
 * - Overscroll behavior control
 * - Touch-action optimization
 * - Safe area handling
 *
 * Usage:
 * ```tsx
 * <ScrollContainer>
 *   <YourContent />
 * </ScrollContainer>
 * ```
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX } from 'solid-js';
import { mobileTokens } from '../../theme/mobile-tokens';

// ==========================================================================
// TYPES
// ==========================================================================

export interface ScrollContainerProps {
  /** Content to render inside the scroll container */
  children: JSX.Element;

  /**
   * Scroll direction
   * - 'vertical' (default): Vertical scrolling only
   * - 'horizontal': Horizontal scrolling only
   * - 'both': Both directions
   */
  direction?: 'vertical' | 'horizontal' | 'both';

  /**
   * Overscroll behavior
   * - 'auto': Browser default (may trigger pull-to-refresh)
   * - 'contain': Prevent scroll chaining to parent
   * - 'none': Disable overscroll effects
   */
  overscroll?: 'auto' | 'contain' | 'none';

  /**
   * Whether to add bottom safe area padding
   * Useful when content needs to clear bottom nav or home indicator
   */
  safeAreaBottom?: boolean;

  /**
   * Whether to add top safe area padding
   * Useful when there's no sticky header
   */
  safeAreaTop?: boolean;

  /** Custom padding (overrides default) */
  padding?: string;

  /** Custom styles */
  style?: JSX.CSSProperties;

  /** Custom class name */
  class?: string;

  /** Maximum height (useful for bounded scroll areas) */
  maxHeight?: string;

  /** Whether to use flex layout */
  flex?: boolean;
}

// ==========================================================================
// COMPONENT
// ==========================================================================

/**
 * ScrollContainer Component
 *
 * Optimized scrolling container with native-like behavior.
 */
export const ScrollContainer: Component<ScrollContainerProps> = (props) => {
  const direction = () => props.direction ?? 'vertical';
  const overscroll = () => props.overscroll ?? 'contain';

  const getOverflowX = () => {
    const dir = direction();
    return dir === 'horizontal' || dir === 'both' ? 'auto' : 'hidden';
  };

  const getOverflowY = () => {
    const dir = direction();
    return dir === 'vertical' || dir === 'both' ? 'auto' : 'hidden';
  };

  const getTouchAction = () => {
    switch (direction()) {
      case 'horizontal':
        return 'pan-x';
      case 'both':
        return 'pan-x pan-y';
      default:
        return 'pan-y';
    }
  };

  const getPaddingTop = () => {
    if (props.padding) return undefined;
    return props.safeAreaTop ? mobileTokens.safeArea.padding.top : '0';
  };

  const getPaddingBottom = () => {
    if (props.padding) return undefined;
    return props.safeAreaBottom ? mobileTokens.safeArea.padding.bottom : '0';
  };

  return (
    <div
      class={props.class}
      style={{
        // Overflow handling
        'overflow-x': getOverflowX(),
        'overflow-y': getOverflowY(),

        // Native-like scrolling
        '-webkit-overflow-scrolling': 'touch',
        'scroll-behavior': 'smooth',

        // Overscroll behavior
        'overscroll-behavior': overscroll(),
        'overscroll-behavior-y': direction() !== 'horizontal' ? overscroll() : 'auto',
        'overscroll-behavior-x': direction() !== 'vertical' ? overscroll() : 'auto',

        // Touch optimization
        'touch-action': getTouchAction(),
        '-webkit-tap-highlight-color': 'transparent',

        // Layout
        display: props.flex ? 'flex' : 'block',
        'flex-direction': props.flex ? 'column' : undefined,

        // Sizing
        height: '100%',
        'max-height': props.maxHeight,

        // Padding - either custom or safe area based
        padding: props.padding,
        'padding-top': getPaddingTop(),
        'padding-bottom': getPaddingBottom(),

        // Scrollbar styling
        'scrollbar-width': 'thin',
        'scrollbar-color': `${mobileTokens.borders.light} transparent`,

        // Custom styles merged at the end
        ...(props.style || {}),
      }}
    >
      {props.children}
    </div>
  );
};

/**
 * HorizontalScroll - Convenience wrapper for horizontal scrolling
 */
export const HorizontalScroll: Component<Omit<ScrollContainerProps, 'direction'>> = (props) => (
  <ScrollContainer {...props} direction="horizontal" />
);

/**
 * ScrollArea - Full-height scroll area with safe area handling
 */
export const ScrollArea: Component<Omit<ScrollContainerProps, 'safeAreaBottom'>> = (props) => (
  <ScrollContainer {...props} safeAreaBottom />
);

export default ScrollContainer;
