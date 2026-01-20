/**
 * Profile Badges Component
 *
 * Renders badge overlays on a profile button indicating user status:
 * - Not Signed In (warning): Red pulsing dot when user not authenticated
 * - Extras (achievement): Purple star for app-specific Pro features
 * - TACo Club (premium): Animated gradient border for club members
 *
 * Similar to Twitter/Facebook verified badges - small indicators overlaid on profile icon.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, JSX, ParentComponent } from 'solid-js';

// ============================================================================
// TYPES
// ============================================================================

export interface ProfileBadgesProps {
  /** User is authenticated with TACo */
  isAuthenticated: boolean;
  /** User has app-specific extras (Pro) */
  hasExtras: boolean;
  /** User is TACo Club member */
  isTacoClub: boolean;
  /** Size of the profile button (for badge positioning) */
  size?: number;
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const tokens = {
  colors: {
    warning: {
      notSignedIn: '#EF4444', // Red - red-500
    },
    achievement: {
      extras: '#9333EA', // Purple - purple-600
    },
    tacoClub: {
      gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)',
    },
  },
  badge: {
    dotSize: '10px',
    iconSize: '14px',
  },
};

// ============================================================================
// ICONS
// ============================================================================

const StarIcon: Component<{ size: number }> = (props) => (
  <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Warning dot badge - for not signed in status
 */
const WarningDot: Component<{
  title: string;
}> = (props) => {
  return (
    <span
      title={props.title}
      style={{
        position: 'absolute',
        top: '0px',
        right: '0px',
        width: tokens.badge.dotSize,
        height: tokens.badge.dotSize,
        'border-radius': '50%',
        background: tokens.colors.warning.notSignedIn,
        border: '2px solid #1A1A2E',
        'box-shadow': `0 0 6px ${tokens.colors.warning.notSignedIn}80`,
        'z-index': 10,
        animation: 'profileBadgePulse 2s ease-in-out infinite',
      }}
    />
  );
};

/**
 * Achievement badge - for extras (Pro)
 */
const AchievementBadge: Component<{
  position: 'bottom-right' | 'bottom-left';
  title: string;
}> = (props) => {
  const positionStyles = (): JSX.CSSProperties => {
    if (props.position === 'bottom-right') {
      return { bottom: '-2px', right: '-2px' };
    }
    return { bottom: '-2px', left: '-2px' };
  };

  return (
    <span
      title={props.title}
      style={{
        position: 'absolute',
        ...positionStyles(),
        width: tokens.badge.iconSize,
        height: tokens.badge.iconSize,
        'border-radius': '50%',
        background: tokens.colors.achievement.extras,
        border: '2px solid #1A1A2E',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        color: 'white',
        'box-shadow': `0 0 8px ${tokens.colors.achievement.extras}60`,
        'z-index': 10,
      }}
    >
      <StarIcon size={8} />
    </span>
  );
};

/**
 * TACo Club animated gradient border wrapper
 */
const TacoClubBorder: ParentComponent<{ size: number }> = (props) => {
  return (
    <div
      style={{
        position: 'relative',
        width: `${props.size + 6}px`,
        height: `${props.size + 6}px`,
        'border-radius': '14px',
        padding: '3px',
        background: tokens.colors.tacoClub.gradient,
        'background-size': '300% 300%',
        animation: 'profileBadgeGradient 4s ease infinite',
        'box-shadow': `0 0 12px rgba(255, 107, 107, 0.4), 0 0 24px rgba(78, 205, 196, 0.2)`,
      }}
      title="TACo Club Member"
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          'border-radius': '11px',
          background: '#1A1A2E',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        }}
      >
        {props.children}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * ProfileBadges - Wrapper component that adds badge overlays to profile buttons
 *
 * @example
 * ```tsx
 * <ProfileBadges
 *   isAuthenticated={auth.isAuthenticated()}
 *   hasExtras={auth.hasAppExtras('tenure')}
 *   isTacoClub={auth.isTacoClubMember()}
 *   size={44}
 * >
 *   <button>Profile Icon</button>
 * </ProfileBadges>
 * ```
 */
export const ProfileBadges: ParentComponent<ProfileBadgesProps> = (props) => {
  const size = () => props.size ?? 44;

  // Determine which badges to show
  const showNotSignedInWarning = () => !props.isAuthenticated;
  const showExtrasBadge = () => props.hasExtras;
  const showTacoClubBorder = () => props.isTacoClub;

  // If TACo Club member, wrap with animated border
  const content = (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      {props.children}

      {/* Warning: Not Signed In */}
      <Show when={showNotSignedInWarning()}>
        <WarningDot title="Sign in to TACo" />
      </Show>

      {/* Achievement: Extras (Pro) */}
      <Show when={showExtrasBadge()}>
        <AchievementBadge position="bottom-right" title="Pro Features Active" />
      </Show>
    </div>
  );

  return (
    <>
      <Show when={showTacoClubBorder()} fallback={content}>
        <TacoClubBorder size={size()}>{content}</TacoClubBorder>
      </Show>

      {/* Keyframe animations */}
      <style>
        {`
          @keyframes profileBadgePulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.8;
            }
          }

          @keyframes profileBadgeGradient {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        `}
      </style>
    </>
  );
};

export default ProfileBadges;
