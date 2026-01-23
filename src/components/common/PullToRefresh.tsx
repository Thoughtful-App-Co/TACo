/**
 * PullToRefresh - Native-style pull-to-refresh component
 *
 * Provides iOS/Android-style pull-to-refresh for data views.
 * Uses touch events and CSS transforms for smooth animation.
 *
 * Usage:
 * ```tsx
 * <PullToRefresh onRefresh={async () => await fetchData()}>
 *   <YourScrollableContent />
 * </PullToRefresh>
 * ```
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX, createSignal, onCleanup, Show } from 'solid-js';
import { mobileTokens } from '../../theme/mobile-tokens';
import { useMobile } from '../tenure/lib/use-mobile';

// ==========================================================================
// TYPES
// ==========================================================================

export interface PullToRefreshProps {
  /** Callback when refresh is triggered - should return a Promise */
  onRefresh: () => Promise<void>;
  /** Content to wrap */
  children: JSX.Element;
  /** Pull distance threshold to trigger refresh (default: 80px) */
  threshold?: number;
  /** Maximum pull distance (default: 120px) */
  maxPull?: number;
  /** Whether pull-to-refresh is disabled */
  disabled?: boolean;
  /** Custom refresh indicator color */
  indicatorColor?: string;
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing';

// ==========================================================================
// REFRESH INDICATOR
// ==========================================================================

const RefreshIndicator: Component<{
  state: RefreshState;
  pullProgress: number;
  color?: string;
}> = (props) => {
  const color = () => props.color ?? mobileTokens.borders.standard;

  return (
    <div
      style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        height: '40px',
        width: '40px',
        'border-radius': '50%',
        background: mobileTokens.surfaces.medium,
        border: `1px solid ${mobileTokens.borders.light}`,
        transition: props.state === 'refreshing' ? 'none' : 'transform 0.2s ease',
        transform:
          props.state === 'refreshing' ? 'rotate(0deg)' : `rotate(${props.pullProgress * 360}deg)`,
        animation: props.state === 'refreshing' ? 'ptr-spin 0.8s linear infinite' : 'none',
      }}
    >
      <Show
        when={props.state === 'refreshing'}
        fallback={
          // Arrow icon when pulling
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color()}
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            style={{
              opacity: Math.min(1, props.pullProgress * 2),
              transform: props.state === 'ready' ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
        }
      >
        {/* Spinner when refreshing */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color()}
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </Show>
    </div>
  );
};

// ==========================================================================
// KEYFRAMES
// ==========================================================================

const PTR_KEYFRAMES = `
@keyframes ptr-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

// Inject keyframes
if (typeof document !== 'undefined') {
  const styleId = 'ptr-keyframes';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = PTR_KEYFRAMES;
    document.head.appendChild(style);
  }
}

// ==========================================================================
// COMPONENT
// ==========================================================================

export const PullToRefresh: Component<PullToRefreshProps> = (props) => {
  const isMobile = useMobile();
  const threshold = () => props.threshold ?? 80;
  const maxPull = () => props.maxPull ?? 120;

  const [state, setState] = createSignal<RefreshState>('idle');
  const [pullDistance, setPullDistance] = createSignal(0);

  let containerRef: HTMLDivElement | undefined;
  let startY = 0;
  let currentY = 0;

  const pullProgress = () => Math.min(1, pullDistance() / threshold());

  const handleTouchStart = (e: TouchEvent) => {
    if (props.disabled || state() === 'refreshing') return;

    // Only start pull if at top of scroll
    if (containerRef && containerRef.scrollTop === 0) {
      startY = e.touches[0].clientY;
      currentY = startY;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (props.disabled || state() === 'refreshing' || startY === 0) return;

    currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    // Only pull down, not up
    if (diff > 0 && containerRef && containerRef.scrollTop === 0) {
      // Apply resistance - gets harder to pull as you go further
      const resistance = 0.5;
      const adjustedDiff = Math.min(maxPull(), diff * resistance);

      setPullDistance(adjustedDiff);
      setState(adjustedDiff >= threshold() ? 'ready' : 'pulling');

      // Prevent default scroll behavior while pulling
      if (adjustedDiff > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (props.disabled || state() === 'refreshing') return;

    if (state() === 'ready') {
      setState('refreshing');
      setPullDistance(60); // Keep indicator visible during refresh

      try {
        await props.onRefresh();
      } finally {
        setState('idle');
        setPullDistance(0);
      }
    } else {
      setState('idle');
      setPullDistance(0);
    }

    startY = 0;
    currentY = 0;
  };

  // Cleanup
  onCleanup(() => {
    startY = 0;
    currentY = 0;
  });

  // Only render pull-to-refresh on mobile
  if (!isMobile()) {
    return <>{props.children}</>;
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        'overflow-y': 'auto',
        '-webkit-overflow-scrolling': 'touch',
        height: '100%',
      }}
    >
      {/* Pull indicator */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          display: 'flex',
          'justify-content': 'center',
          'align-items': 'flex-end',
          height: `${pullDistance()}px`,
          'padding-bottom': '8px',
          overflow: 'hidden',
          transition: state() === 'refreshing' ? 'height 0.2s ease' : 'none',
          'pointer-events': 'none',
          'z-index': 10,
        }}
      >
        <Show when={pullDistance() > 10}>
          <RefreshIndicator
            state={state()}
            pullProgress={pullProgress()}
            color={props.indicatorColor}
          />
        </Show>
      </div>

      {/* Content with transform */}
      <div
        style={{
          transform: `translateY(${pullDistance()}px)`,
          transition: state() === 'idle' ? 'transform 0.2s ease' : 'none',
        }}
      >
        {props.children}
      </div>
    </div>
  );
};

export default PullToRefresh;
