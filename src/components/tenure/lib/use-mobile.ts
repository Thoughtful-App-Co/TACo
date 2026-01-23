/**
 * Mobile and tablet detection hooks for Tenure app
 * Provides reactive viewport-based device detection
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createSignal, onMount, onCleanup, Accessor } from 'solid-js';

export const MOBILE_BREAKPOINT = 768;
export const TABLET_BREAKPOINT = 1024;

/**
 * Detect if device has touch capability (mobile/tablet)
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Detect if this appears to be a mobile device (phone)
 * Uses combination of touch capability and screen dimensions
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const hasTouch = isTouchDevice();
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const smallerDimension = Math.min(screenWidth, screenHeight);

  // Mobile device: has touch AND smaller screen dimension is <= 768px (typical phone)
  return hasTouch && smallerDimension <= MOBILE_BREAKPOINT;
}

/**
 * Check if current viewport should be treated as mobile
 * Considers both viewport size AND device type for landscape handling
 */
function checkIsMobile(): boolean {
  if (typeof window === 'undefined') return false;

  const width = window.innerWidth;
  const height = window.innerHeight;

  // Portrait mobile: width <= 768
  if (width <= MOBILE_BREAKPOINT) return true;

  // Landscape mobile: touch device, width <= 1024, height <= 768
  // This catches phones in landscape mode
  if (isTouchDevice() && width <= TABLET_BREAKPOINT && height <= MOBILE_BREAKPOINT) {
    return true;
  }

  return false;
}

/**
 * Hook to detect if viewport is mobile-sized
 * Handles both portrait and landscape mobile devices
 * @returns Accessor<boolean> - Reactive signal that updates on resize
 */
export function useMobile(): Accessor<boolean> {
  const [isMobile, setIsMobile] = createSignal(checkIsMobile());

  onMount(() => {
    const handleResize = () => setIsMobile(checkIsMobile());
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    });
  });

  return isMobile;
}

/**
 * Hook to detect if viewport is tablet-sized (between mobile and tablet breakpoints)
 * @returns Accessor<boolean> - Reactive signal that updates on resize (true for 769px to 1024px on non-touch, or larger touch devices)
 */
export function useTablet(): Accessor<boolean> {
  const [isTablet, setIsTablet] = createSignal(
    typeof window !== 'undefined'
      ? !checkIsMobile() && window.innerWidth <= TABLET_BREAKPOINT
      : false
  );

  onMount(() => {
    const handleResize = () => {
      setIsTablet(!checkIsMobile() && window.innerWidth <= TABLET_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    });
  });

  return isTablet;
}

/**
 * Hook to detect if user is on a mobile device (regardless of current viewport)
 * Useful for determining device capabilities rather than layout
 * @returns Accessor<boolean> - Reactive signal (doesn't change on resize, only on mount)
 */
export function useIsMobileDevice(): Accessor<boolean> {
  const [isMobileDeviceState, setIsMobileDeviceState] = createSignal(false);

  onMount(() => {
    setIsMobileDeviceState(isMobileDevice());
  });

  return isMobileDeviceState;
}
