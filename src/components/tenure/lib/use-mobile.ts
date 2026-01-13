/**
 * Mobile detection hook for Tenure app
 * Provides reactive viewport-based mobile detection
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { createSignal, onMount, onCleanup, Accessor } from 'solid-js';

export const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if viewport is mobile-sized
 * @param breakpoint - Width threshold in pixels (default: 768)
 * @returns Accessor<boolean> - Reactive signal that updates on resize
 */
export function useMobile(breakpoint: number = MOBILE_BREAKPOINT): Accessor<boolean> {
  const [isMobile, setIsMobile] = createSignal(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  onMount(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handleResize);
    onCleanup(() => window.removeEventListener('resize', handleResize));
  });

  return isMobile;
}
