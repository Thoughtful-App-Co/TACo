/**
 * Premium Indicator Component
 *
 * Displays a prominent badge/banner showing the user's premium status
 * on app pages (Tempo, Tenure). Shows when user has Extras subscription.
 *
 * Design: Subtle, elegant indicator that doesn't obstruct content but
 * clearly communicates premium status.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show } from 'solid-js';

// ============================================================================
// TYPES
// ============================================================================

export interface PremiumIndicatorProps {
  /** User has app-specific extras (Pro) */
  hasExtras: boolean;
  /** App name for labeling */
  appName: 'Tempo' | 'Tenure';
  /** Color theme matching the app */
  color?: string;
}

// ============================================================================
// ICONS
// ============================================================================

const SparkleIcon: Component<{ size: number }> = (props) => (
  <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0L14.472 9.528L24 12L14.472 14.472L12 24L9.528 14.472L0 12L9.528 9.528L12 0Z" />
    <path
      d="M18 3L19.236 7.764L24 9L19.236 10.236L18 15L16.764 10.236L12 9L16.764 7.764L18 3Z"
      opacity="0.6"
    />
  </svg>
);

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Premium Indicator - Shows premium status badge on app pages
 *
 * @example
 * ```tsx
 * <PremiumIndicator
 *   hasExtras={auth.hasAppExtras('tempo')}
 *   appName="Tempo"
 *   color="#5E6AD2"
 * />
 * ```
 */
export const PremiumIndicator: Component<PremiumIndicatorProps> = (props) => {
  const accentColor = () => props.color || '#9333EA';

  return (
    <Show when={props.hasExtras}>
      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          'z-index': '50',
          display: 'flex',
          'align-items': 'center',
          gap: '8px',
          padding: '8px 16px',
          background: `linear-gradient(135deg, ${accentColor()}20 0%, ${accentColor()}10 100%)`,
          border: `1px solid ${accentColor()}40`,
          'border-radius': '24px',
          'backdrop-filter': 'blur(8px)',
          '-webkit-backdrop-filter': 'blur(8px)',
          'box-shadow': `0 4px 12px ${accentColor()}15, inset 0 1px 0 ${accentColor()}30`,
          animation: 'premiumIndicatorSlideIn 0.5s ease-out',
          'font-family': '"Shupp", "DM Sans", system-ui, sans-serif',
        }}
        title={`${props.appName} Extras Active - You have access to premium features`}
      >
        {/* Sparkle icon */}
        <div
          style={{
            color: accentColor(),
            display: 'flex',
            'align-items': 'center',
            animation: 'premiumIndicatorSparkle 3s ease-in-out infinite',
          }}
        >
          <SparkleIcon size={16} />
        </div>

        {/* Text */}
        <span
          style={{
            'font-size': '13px',
            'font-weight': '600',
            color: '#FFFFFF',
            'letter-spacing': '0.3px',
          }}
        >
          {props.appName} Extras
        </span>

        {/* Shine effect overlay */}
        <div
          style={{
            position: 'absolute',
            inset: '0',
            'border-radius': '24px',
            background:
              'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 50%)',
            opacity: '0.5',
            'pointer-events': 'none',
          }}
        />
      </div>

      {/* Keyframe animations */}
      <style>
        {`
          @keyframes premiumIndicatorSlideIn {
            from {
              transform: translateX(300px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes premiumIndicatorSparkle {
            0%, 100% {
              transform: rotate(0deg) scale(1);
            }
            25% {
              transform: rotate(10deg) scale(1.1);
            }
            50% {
              transform: rotate(-10deg) scale(1);
            }
            75% {
              transform: rotate(5deg) scale(1.1);
            }
          }
        `}
      </style>
    </Show>
  );
};

export default PremiumIndicator;
