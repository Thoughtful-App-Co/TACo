/**
 * Account Button Component
 *
 * Displays a sign-in button when logged out, or user avatar with dropdown when logged in.
 * Dropdown includes user email, subscription badges, billing management, and sign out.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show, createEffect, onCleanup } from 'solid-js';
import { useAuth } from '../../lib/auth-context';
import { getAuthHeaders } from '../../lib/auth';
import { logger } from '../../lib/logger';
import { LoginModal } from './LoginModal';
import { showNotification } from '../../lib/notifications';

// ============================================================================
// TYPES
// ============================================================================

interface AccountButtonProps {
  variant?: 'menu' | 'header'; // 'menu' for TabNavigation, 'header' for smaller contexts
  prominent?: boolean; // Use filled gradient style for primary CTA
  label?: string; // Custom button label (default: "Sign In")
}

// ============================================================================
// DESIGN TOKENS - Matching App.tsx navTokens
// ============================================================================

const tokens = {
  typography: {
    fontFamily: '"Geist", "Inter", system-ui, sans-serif',
    brandFamily: "'Shupp', 'DM Sans', system-ui, sans-serif",
  },
  colors: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: 'rgba(255, 255, 255, 0.08)',
    hover: 'rgba(255, 255, 255, 0.06)',
    text: {
      primary: 'white',
      muted: 'rgba(255, 255, 255, 0.5)',
    },
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
  },
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extract initials from an email address
 * Returns first letter uppercase, or first two letters if email is short
 */
function getInitials(email: string): string {
  if (!email) return '?';

  const localPart = email.split('@')[0];
  if (!localPart) return '?';

  // Use first two characters for short emails, first character otherwise
  if (localPart.length <= 2) {
    return localPart.toUpperCase();
  }

  return localPart.charAt(0).toUpperCase();
}

/**
 * Get subscription badges for the user
 */
function getSubscriptionBadges(auth: ReturnType<typeof useAuth>): string[] {
  const badges: string[] = [];

  if (auth.isTacoClubMember()) {
    badges.push('TACo Club');
  }
  if (auth.hasAppExtras('tenure')) {
    badges.push('Tenure Pro');
  }
  if (auth.hasAppExtras('tempo')) {
    badges.push('Tempo Pro');
  }
  if (auth.hasAppSync('tenure')) {
    badges.push('Tenure Sync');
  }
  if (auth.hasAppSync('tempo')) {
    badges.push('Tempo Sync');
  }
  if (auth.hasAppSync('nurture')) {
    badges.push('Nurture Sync');
  }

  return badges;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AccountButton: Component<AccountButtonProps> = (props) => {
  const auth = useAuth();
  const variant = () => props.variant || 'menu';

  const [showLoginModal, setShowLoginModal] = createSignal(false);
  const [showDropdown, setShowDropdown] = createSignal(false);
  const [isLoadingPortal, setIsLoadingPortal] = createSignal(false);

  let dropdownRef: HTMLDivElement | undefined;
  let buttonRef: HTMLButtonElement | undefined;

  // Close dropdown when clicking outside
  createEffect(() => {
    if (!showDropdown()) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef &&
        !dropdownRef.contains(e.target as Node) &&
        buttonRef &&
        !buttonRef.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    onCleanup(() => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    });
  });

  /**
   * Handle opening the Stripe billing portal
   */
  const handleManageBilling = async () => {
    setIsLoadingPortal(true);

    try {
      const authHeaders = getAuthHeaders();

      if (!authHeaders.Authorization) {
        showNotification({
          type: 'error',
          message: 'Please sign in to manage billing',
        });
        return;
      }

      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'NO_CUSTOMER') {
          showNotification({
            type: 'warning',
            message: 'No billing history yet',
            action: {
              label: 'View Plans',
              onClick: () => {
                window.location.href = '/pricing';
              },
            },
          });
        } else if (data.code === 'UNAUTHORIZED' || data.code === 'INVALID_SESSION') {
          showNotification({
            type: 'error',
            message: 'Session expired. Please sign in again.',
          });
        } else {
          throw new Error(data.error || 'Failed to open billing portal');
        }
        return;
      }

      if (data.url) {
        showNotification({
          type: 'info',
          message: 'Opening billing portal...',
          duration: 2000,
        });

        setTimeout(() => {
          window.location.href = data.url;
        }, 500);
      }
    } catch (error) {
      logger.billing.error('Error opening billing portal:', error);

      showNotification({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to open billing portal. Please try again.',
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  /**
   * Handle sign out
   */
  const handleSignOut = () => {
    setShowDropdown(false);
    auth.logout();
  };

  // Size variants
  const buttonSize = () => (variant() === 'menu' ? '40px' : '36px');
  const fontSize = () => {
    if (props.prominent) return '16px'; // Larger for prominent Sign Up
    return variant() === 'menu' ? '14px' : '12px';
  };
  const avatarFontSize = () => (variant() === 'menu' ? '14px' : '12px');

  const subscriptionBadges = () => (auth.isAuthenticated() ? getSubscriptionBadges(auth) : []);

  return (
    <>
      <div style={{ position: 'relative' }}>
        {/* Loading state */}
        <Show when={auth.isLoading()}>
          <div
            style={{
              width: buttonSize(),
              height: buttonSize(),
              'border-radius': '50%',
              background: tokens.colors.background,
              border: `1px solid ${tokens.colors.border}`,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                'border-top-color': 'rgba(255, 255, 255, 0.5)',
                'border-radius': '50%',
                animation: 'accountButtonSpin 0.8s linear infinite',
              }}
            />
          </div>
        </Show>

        {/* Logged out - Sign In button */}
        <Show when={!auth.isLoading() && !auth.isAuthenticated()}>
          <button
            onClick={() => setShowLoginModal(true)}
            style={{
              height: buttonSize(),
              padding: variant() === 'menu' ? '0 16px' : '0 20px',
              background: props.prominent
                ? 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)'
                : tokens.colors.background,
              border: props.prominent ? 'none' : `1px solid ${tokens.colors.border}`,
              'border-radius': '20px',
              color: props.prominent ? '#0F0F1A' : tokens.colors.text.primary,
              'font-family': tokens.typography.fontFamily,
              'font-size': fontSize(),
              'font-weight': props.prominent ? '700' : '500',
              'letter-spacing': props.prominent ? '-0.5px' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              'backdrop-filter': props.prominent ? 'none' : 'blur(8px)',
              '-webkit-backdrop-filter': props.prominent ? 'none' : 'blur(8px)',
              'box-shadow': props.prominent ? '0 4px 16px rgba(255, 107, 107, 0.35)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (props.prominent) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.45)';
              } else {
                e.currentTarget.style.background = tokens.colors.hover;
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (props.prominent) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 107, 107, 0.35)';
              } else {
                e.currentTarget.style.background = tokens.colors.background;
                e.currentTarget.style.borderColor = tokens.colors.border;
              }
            }}
          >
            <svg
              width={variant() === 'menu' ? '16' : '14'}
              height={variant() === 'menu' ? '16' : '14'}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            {props.label || 'Sign In'}
          </button>
        </Show>

        {/* Logged in - Avatar with dropdown */}
        <Show when={!auth.isLoading() && auth.isAuthenticated()}>
          <button
            ref={buttonRef}
            onClick={() => setShowDropdown(!showDropdown())}
            aria-expanded={showDropdown()}
            aria-haspopup="true"
            style={{
              width: buttonSize(),
              height: buttonSize(),
              'border-radius': '50%',
              background: tokens.colors.gradient,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              color: 'white',
              'font-family': tokens.typography.fontFamily,
              'font-size': avatarFontSize(),
              'font-weight': '600',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              'box-shadow': showDropdown()
                ? '0 0 0 3px rgba(78, 205, 196, 0.3)'
                : '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {getInitials(auth.user()?.email || '')}
          </button>

          {/* Dropdown menu */}
          <Show when={showDropdown()}>
            <div
              ref={dropdownRef}
              role="menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: '0',
                width: '260px',
                background: 'rgba(26, 26, 46, 0.98)',
                'backdrop-filter': 'blur(16px)',
                '-webkit-backdrop-filter': 'blur(16px)',
                border: `1px solid ${tokens.colors.border}`,
                'border-radius': '12px',
                'box-shadow': '0 12px 40px rgba(0, 0, 0, 0.4)',
                overflow: 'hidden',
                'z-index': 1000,
                animation: 'accountDropdownFadeIn 0.15s ease',
              }}
            >
              {/* User info section */}
              <div
                style={{
                  padding: '16px',
                  'border-bottom': `1px solid ${tokens.colors.border}`,
                }}
              >
                {/* Email */}
                <div
                  style={{
                    'font-family': tokens.typography.fontFamily,
                    'font-size': '14px',
                    'font-weight': '500',
                    color: tokens.colors.text.primary,
                    'margin-bottom': '4px',
                    'word-break': 'break-all',
                  }}
                >
                  {auth.user()?.email}
                </div>

                {/* Subscription badges */}
                <Show when={subscriptionBadges().length > 0}>
                  <div
                    style={{
                      display: 'flex',
                      'flex-wrap': 'wrap',
                      gap: '6px',
                      'margin-top': '10px',
                    }}
                  >
                    {subscriptionBadges().map((badge) => (
                      <span
                        style={{
                          padding: '3px 8px',
                          background: 'rgba(78, 205, 196, 0.15)',
                          border: '1px solid rgba(78, 205, 196, 0.3)',
                          'border-radius': '4px',
                          'font-family': tokens.typography.fontFamily,
                          'font-size': '11px',
                          'font-weight': '500',
                          color: '#4ECDC4',
                        }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </Show>

                <Show when={subscriptionBadges().length === 0}>
                  <div
                    style={{
                      'font-family': tokens.typography.fontFamily,
                      'font-size': '12px',
                      color: tokens.colors.text.muted,
                      'margin-top': '4px',
                    }}
                  >
                    Free plan
                  </div>
                </Show>
              </div>

              {/* Actions section */}
              <div style={{ padding: '8px' }}>
                {/* Manage Billing */}
                <button
                  onClick={handleManageBilling}
                  disabled={isLoadingPortal()}
                  role="menuitem"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    'border-radius': '8px',
                    color: tokens.colors.text.primary,
                    'font-family': tokens.typography.fontFamily,
                    'font-size': '13px',
                    'font-weight': '500',
                    cursor: isLoadingPortal() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    'align-items': 'center',
                    gap: '10px',
                    transition: 'background 0.15s ease',
                    opacity: isLoadingPortal() ? 0.6 : 1,
                    'text-align': 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoadingPortal()) {
                      e.currentTarget.style.background = tokens.colors.hover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Show
                    when={!isLoadingPortal()}
                    fallback={
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          border: '2px solid rgba(255, 255, 255, 0.1)',
                          'border-top-color': 'rgba(255, 255, 255, 0.5)',
                          'border-radius': '50%',
                          animation: 'accountButtonSpin 0.8s linear infinite',
                        }}
                      />
                    }
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  </Show>
                  Manage Billing
                </button>

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  role="menuitem"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    'border-radius': '8px',
                    color: '#EF4444',
                    'font-family': tokens.typography.fontFamily,
                    'font-size': '13px',
                    'font-weight': '500',
                    cursor: 'pointer',
                    display: 'flex',
                    'align-items': 'center',
                    gap: '10px',
                    transition: 'background 0.15s ease',
                    'text-align': 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </Show>
        </Show>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal()} onClose={() => setShowLoginModal(false)} />

      {/* Keyframe animations */}
      <style>
        {`
          @keyframes accountButtonSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes accountDropdownFadeIn {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>
  );
};

export default AccountButton;
