/**
 * SkeletonLoader - Loading state placeholder components
 *
 * Provides various skeleton shapes for content loading states.
 * Uses CSS animations for shimmer effect.
 *
 * Usage:
 * ```tsx
 * import { Skeleton, SkeletonText, SkeletonCard } from '@/components/common/SkeletonLoader';
 *
 * // Basic rectangle
 * <Skeleton width="100%" height="48px" />
 *
 * // Text lines
 * <SkeletonText lines={3} />
 *
 * // Card placeholder
 * <SkeletonCard />
 * ```
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For, JSX } from 'solid-js';
import { mobileTokens } from '../../theme/mobile-tokens';

// ==========================================================================
// TYPES
// ==========================================================================

export interface SkeletonProps {
  /** Width of the skeleton (CSS value) */
  width?: string;
  /** Height of the skeleton (CSS value) */
  height?: string;
  /** Border radius (CSS value or token key) */
  borderRadius?: string;
  /** Additional styles */
  style?: JSX.CSSProperties;
  /** Custom class name */
  class?: string;
}

export interface SkeletonTextProps {
  /** Number of text lines to show */
  lines?: number;
  /** Width of the last line (shorter for natural look) */
  lastLineWidth?: string;
  /** Gap between lines */
  gap?: string;
}

export interface SkeletonCardProps {
  /** Show header section */
  showHeader?: boolean;
  /** Show image placeholder */
  showImage?: boolean;
  /** Number of text lines */
  textLines?: number;
  /** Show action buttons */
  showActions?: boolean;
}

// ==========================================================================
// KEYFRAMES (injected once)
// ==========================================================================

const SKELETON_KEYFRAMES = `
@keyframes skeleton-shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}
`;

// Inject keyframes on first import
if (typeof document !== 'undefined') {
  const styleId = 'skeleton-keyframes';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = SKELETON_KEYFRAMES;
    document.head.appendChild(style);
  }
}

// ==========================================================================
// BASE SKELETON
// ==========================================================================

/**
 * Base skeleton component with shimmer animation.
 */
export const Skeleton: Component<SkeletonProps> = (props) => {
  return (
    <div
      class={props.class}
      aria-hidden="true"
      style={{
        width: props.width ?? '100%',
        height: props.height ?? '20px',
        'border-radius': props.borderRadius ?? mobileTokens.radii.sm,
        background: `linear-gradient(
          90deg,
          ${mobileTokens.surfaces.subtle} 0px,
          ${mobileTokens.surfaces.light} 40px,
          ${mobileTokens.surfaces.subtle} 80px
        )`,
        'background-size': '200px 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
        ...props.style,
      }}
    />
  );
};

// ==========================================================================
// SKELETON VARIANTS
// ==========================================================================

/**
 * Circular skeleton (for avatars, icons).
 */
export const SkeletonCircle: Component<{ size?: string }> = (props) => {
  const size = props.size ?? '48px';
  return <Skeleton width={size} height={size} borderRadius="50%" />;
};

/**
 * Text skeleton with multiple lines.
 */
export const SkeletonText: Component<SkeletonTextProps> = (props) => {
  const lines = props.lines ?? 3;
  const gap = props.gap ?? mobileTokens.spacing.sm;
  const lastLineWidth = props.lastLineWidth ?? '60%';

  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        gap,
      }}
    >
      <For each={Array.from({ length: lines })}>
        {(_, index) => (
          <Skeleton height="14px" width={index() === lines - 1 ? lastLineWidth : '100%'} />
        )}
      </For>
    </div>
  );
};

/**
 * Card skeleton with configurable sections.
 */
export const SkeletonCard: Component<SkeletonCardProps> = (props) => {
  const showHeader = props.showHeader ?? true;
  const showImage = props.showImage ?? false;
  const textLines = props.textLines ?? 3;
  const showActions = props.showActions ?? true;

  return (
    <div
      style={{
        background: mobileTokens.surfaces.subtle,
        'border-radius': mobileTokens.radii.lg,
        border: `1px solid ${mobileTokens.borders.light}`,
        padding: mobileTokens.spacing.cardPadding.mobile,
        display: 'flex',
        'flex-direction': 'column',
        gap: mobileTokens.spacing.lg,
      }}
    >
      {/* Header section */}
      {showHeader && (
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: mobileTokens.spacing.md,
          }}
        >
          <SkeletonCircle size="40px" />
          <div style={{ flex: '1', display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
            <Skeleton height="16px" width="60%" />
            <Skeleton height="12px" width="40%" />
          </div>
        </div>
      )}

      {/* Image section */}
      {showImage && <Skeleton height="200px" borderRadius={mobileTokens.radii.md} />}

      {/* Text content */}
      <SkeletonText lines={textLines} />

      {/* Action buttons */}
      {showActions && (
        <div
          style={{
            display: 'flex',
            gap: mobileTokens.spacing.md,
            'margin-top': mobileTokens.spacing.sm,
          }}
        >
          <Skeleton height="36px" width="80px" borderRadius={mobileTokens.radii.md} />
          <Skeleton height="36px" width="80px" borderRadius={mobileTokens.radii.md} />
        </div>
      )}
    </div>
  );
};

/**
 * List item skeleton.
 */
export const SkeletonListItem: Component<{ showAvatar?: boolean }> = (props) => {
  const showAvatar = props.showAvatar ?? true;

  return (
    <div
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: mobileTokens.spacing.md,
        padding: `${mobileTokens.spacing.md} 0`,
      }}
    >
      {showAvatar && <SkeletonCircle size="40px" />}
      <div style={{ flex: '1', display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
        <Skeleton height="14px" width="70%" />
        <Skeleton height="12px" width="50%" />
      </div>
      <Skeleton height="24px" width="60px" borderRadius={mobileTokens.radii.sm} />
    </div>
  );
};

/**
 * Stats grid skeleton.
 */
export const SkeletonStats: Component<{ count?: number }> = (props) => {
  const count = props.count ?? 4;

  return (
    <div
      style={{
        display: 'grid',
        'grid-template-columns': 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: mobileTokens.spacing.lg,
      }}
    >
      <For each={Array.from({ length: count })}>
        {() => (
          <div
            style={{
              background: mobileTokens.surfaces.subtle,
              'border-radius': mobileTokens.radii.lg,
              padding: mobileTokens.spacing.lg,
              'text-align': 'center',
            }}
          >
            <Skeleton height="32px" width="60px" style={{ margin: '0 auto 8px' }} />
            <Skeleton height="12px" width="80%" style={{ margin: '0 auto' }} />
          </div>
        )}
      </For>
    </div>
  );
};

// ==========================================================================
// SCREEN-LEVEL SKELETONS
// ==========================================================================

/**
 * Dashboard skeleton for full page loading.
 */
export const SkeletonDashboard: Component = () => {
  return (
    <div
      style={{
        padding: mobileTokens.spacing.containerPadding.mobile,
        display: 'flex',
        'flex-direction': 'column',
        gap: mobileTokens.spacing.sectionGap.mobile,
      }}
    >
      {/* Page header */}
      <div>
        <Skeleton height="32px" width="200px" style={{ 'margin-bottom': '8px' }} />
        <Skeleton height="16px" width="300px" />
      </div>

      {/* Stats grid */}
      <SkeletonStats count={4} />

      {/* Content cards */}
      <SkeletonCard showHeader showImage={false} textLines={4} showActions />
      <SkeletonCard showHeader={false} showImage={false} textLines={3} showActions={false} />
    </div>
  );
};

/**
 * List skeleton for list views.
 */
export const SkeletonList: Component<{ itemCount?: number }> = (props) => {
  const count = props.itemCount ?? 5;

  return (
    <div
      style={{
        padding: mobileTokens.spacing.containerPadding.mobile,
      }}
    >
      <For each={Array.from({ length: count })}>{() => <SkeletonListItem />}</For>
    </div>
  );
};

export default Skeleton;
