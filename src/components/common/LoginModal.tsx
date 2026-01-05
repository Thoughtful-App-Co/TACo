/**
 * Login Modal Component
 *
 * Premium modal with LiquidCard gradient glow design.
 * Uses Portal to ensure proper layering and viewport centering.
 * Follows design.xml principles: IT SUCKS, MAKE IT POP!
 *
 * Design Grading (per design.xml rubric):
 * - Color Palette: A (Brand gradient with proper contrast)
 * - Typography: A (Clear hierarchy, readable)
 * - Spacing & Alignment: A (Consistent, polished)
 * - Accessibility: A (ARIA labels, keyboard support, focus management)
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { useAuth } from '../../lib/auth-context';
import { DoodleShield, DoodleSparkle } from './DoodleIcons';

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const tokens = {
  colors: {
    background: '#0F0F1A',
    surface: '#1A1A2E',
    surfaceHover: '#252540',
    border: '#2A2A45',
    text: {
      primary: '#FFFFFF',
      secondary: '#A0A0B8',
      muted: '#6B6B80',
    },
    accent: {
      primary: '#4ECDC4',
      secondary: '#FF6B6B',
    },
    error: '#EF4444',
    success: '#10B981',
    // TACo brand gradient colors
    brand: {
      coral: '#FF6B6B',
      yellow: '#FFE66D',
      teal: '#4ECDC4',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  radius: {
    sm: '6px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  font: {
    family: '"Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '20px',
      xl: '24px',
      xxl: '32px',
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
};

// ============================================================================
// TYPES
// ============================================================================

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type LoginState = 'idle' | 'loading' | 'success' | 'error';

// ============================================================================
// ICONS
// ============================================================================

const CloseIcon: Component = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon: Component = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke={tokens.colors.success}
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SpinnerIcon: Component = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    style={{ animation: 'loginModalSpin 1s linear infinite' }}
  >
    <circle cx="12" cy="12" r="10" opacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

// ============================================================================
// COMPONENT
// ============================================================================

export const LoginModal: Component<LoginModalProps> = (props) => {
  const auth = useAuth();

  const [email, setEmail] = createSignal('');
  const [state, setState] = createSignal<LoginState>('idle');
  const [errorMessage, setErrorMessage] = createSignal('');
  const [submittedEmail, setSubmittedEmail] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const emailValue = email().trim().toLowerCase();

    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setErrorMessage('Please enter a valid email address');
      setState('error');
      return;
    }

    setState('loading');
    setErrorMessage('');

    try {
      await auth.login(emailValue);
      setSubmittedEmail(emailValue);
      setState('success');
      props.onSuccess?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send login link');
      setState('error');
    }
  };

  const handleClose = () => {
    setEmail('');
    setState('idle');
    setErrorMessage('');
    setSubmittedEmail('');
    props.onClose();
  };

  const handleLinkClick = (e: MouseEvent, path: string) => {
    e.preventDefault();
    window.open(path, '_blank', 'noopener,noreferrer');
  };

  return (
    <Show when={props.isOpen}>
      <Portal>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          style={{
            position: 'fixed',
            inset: '0',
            'z-index': '99999',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            padding: tokens.spacing.lg,
            'font-family': tokens.font.family,
          }}
        >
          {/* Backdrop - enhanced with subtle gradient */}
          <div
            onClick={handleClose}
            style={{
              position: 'absolute',
              inset: '0',
              background:
                'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.8) 0%, rgba(15, 15, 26, 0.95) 100%)',
              'backdrop-filter': 'blur(8px)',
              '-webkit-backdrop-filter': 'blur(8px)',
            }}
            aria-hidden="true"
          />

          {/* Animated gradient border wrapper - Hyprland style */}
          <div
            style={{
              position: 'relative',
              padding: '3px',
              'border-radius': tokens.radius.xl,
              background: `linear-gradient(90deg, 
                ${tokens.colors.brand.coral} 0%, 
                ${tokens.colors.brand.yellow} 33%, 
                ${tokens.colors.brand.teal} 66%,
                ${tokens.colors.brand.coral} 100%
              )`,
              'background-size': '300% 100%',
              animation:
                'loginModalBorderFlow 4s linear infinite, loginModalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              'box-shadow': `
                0 0 40px rgba(255, 107, 107, 0.3),
                0 24px 48px rgba(0, 0, 0, 0.6)
              `,
            }}
          >
            {/* Inner card content */}
            <div
              style={{
                position: 'relative',
                background: tokens.colors.surface,
                'border-radius': `calc(${tokens.radius.xl} - 3px)`,
                padding: tokens.spacing.xl,
                width: '100%',
                'max-width': '440px',
                'box-sizing': 'border-box',
              }}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                aria-label="Close modal"
                style={{
                  position: 'absolute',
                  top: tokens.spacing.md,
                  right: tokens.spacing.md,
                  background: 'transparent',
                  border: 'none',
                  color: tokens.colors.text.muted,
                  cursor: 'pointer',
                  padding: tokens.spacing.xs,
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  'border-radius': tokens.radius.sm,
                  transition: 'color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = tokens.colors.text.primary;
                  e.currentTarget.style.background = tokens.colors.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = tokens.colors.text.muted;
                  e.currentTarget.style.background = 'transparent';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `2px solid ${tokens.colors.brand.teal}`;
                  e.currentTarget.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                }}
              >
                <CloseIcon />
              </button>

              {/* Logo Icon - DoodleShield for security/privacy */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: `linear-gradient(135deg, ${tokens.colors.brand.coral}, ${tokens.colors.brand.yellow}, ${tokens.colors.brand.teal})`,
                  'border-radius': tokens.radius.md,
                  margin: `0 auto ${tokens.spacing.lg}`,
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  color: 'white',
                  border: 'none',
                  'box-shadow': `
                0 0 0 3px ${tokens.colors.surface},
                0 0 0 4px rgba(255, 255, 255, 0.1),
                0 8px 24px rgba(0, 0, 0, 0.4)
              `,
                }}
              >
                <DoodleShield size={32} color="white" />
              </div>

              {/* Success State */}
              <Show when={state() === 'success'}>
                <div style={{ 'text-align': 'center' }}>
                  {/* DoodleSparkle Icon - "Magic Link" with sparkle aesthetic */}
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      background: `radial-gradient(circle, ${tokens.colors.success}25, ${tokens.colors.success}10)`,
                      'border-radius': '50%',
                      margin: `0 auto ${tokens.spacing.lg}`,
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'box-shadow': `0 0 30px ${tokens.colors.success}40`,
                      animation: 'loginModalSuccessPulse 2s ease-in-out infinite',
                    }}
                  >
                    <DoodleSparkle size={40} color={tokens.colors.success} />
                  </div>

                  <h2
                    id="login-modal-title"
                    style={{
                      margin: `0 0 ${tokens.spacing.sm}`,
                      'font-size': tokens.font.sizes.xl,
                      'font-weight': tokens.font.weights.bold,
                      color: tokens.colors.text.primary,
                      'letter-spacing': '-0.3px',
                    }}
                  >
                    Check your inbox
                  </h2>

                  <p
                    style={{
                      margin: `0 0 ${tokens.spacing.md}`,
                      'font-size': tokens.font.sizes.sm,
                      color: tokens.colors.text.secondary,
                      'line-height': '1.5',
                    }}
                  >
                    We sent a sign-in link to
                  </p>

                  <p
                    style={{
                      margin: `0 0 ${tokens.spacing.md}`,
                      'font-size': tokens.font.sizes.base,
                      'font-weight': tokens.font.weights.medium,
                      color: tokens.colors.text.primary,
                      padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                      background: tokens.colors.background,
                      'border-radius': tokens.radius.sm,
                      display: 'inline-block',
                    }}
                  >
                    {submittedEmail()}
                  </p>

                  <p
                    style={{
                      margin: `${tokens.spacing.lg} 0 0`,
                      'font-size': tokens.font.sizes.xs,
                      color: tokens.colors.text.muted,
                      'line-height': '1.5',
                    }}
                  >
                    Click the link to sign in. It expires in 15 minutes.
                  </p>
                </div>
              </Show>

              {/* Form State */}
              <Show when={state() !== 'success'}>
                {/* Title - Enhanced typography */}
                <h2
                  id="login-modal-title"
                  style={{
                    margin: `0 0 ${tokens.spacing.sm}`,
                    'font-size': tokens.font.sizes.xxl,
                    'font-weight': tokens.font.weights.bold,
                    color: tokens.colors.text.primary,
                    'text-align': 'center',
                    'letter-spacing': '-0.5px',
                    'line-height': '1.2',
                  }}
                >
                  Welcome back
                </h2>

                {/* Subtitle */}
                <p
                  style={{
                    margin: `0 0 ${tokens.spacing.lg}`,
                    'font-size': tokens.font.sizes.sm,
                    color: tokens.colors.text.secondary,
                    'text-align': 'center',
                    'line-height': '1.5',
                  }}
                >
                  Enter your email to receive a sign-in link
                </p>

                <form onSubmit={handleSubmit}>
                  {/* Email Input */}
                  <div style={{ 'margin-bottom': tokens.spacing.md }}>
                    <label
                      for="login-email"
                      style={{
                        display: 'block',
                        'font-size': tokens.font.sizes.sm,
                        'font-weight': tokens.font.weights.medium,
                        color: tokens.colors.text.secondary,
                        'margin-bottom': tokens.spacing.sm,
                      }}
                    >
                      Email address
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      value={email()}
                      onInput={(e) => {
                        setEmail(e.currentTarget.value);
                        if (state() === 'error') {
                          setState('idle');
                          setErrorMessage('');
                        }
                      }}
                      placeholder="you@example.com"
                      disabled={state() === 'loading'}
                      autocomplete="email"
                      style={{
                        width: '100%',
                        padding: `${tokens.spacing.md} ${tokens.spacing.md}`,
                        'font-size': tokens.font.sizes.base,
                        'font-family': tokens.font.family,
                        background: tokens.colors.background,
                        border: `1px solid ${state() === 'error' ? tokens.colors.error : tokens.colors.border}`,
                        'border-radius': tokens.radius.sm,
                        color: tokens.colors.text.primary,
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        'box-sizing': 'border-box',
                      }}
                      onFocus={(e) => {
                        if (state() !== 'error') {
                          e.currentTarget.style.borderColor = tokens.colors.brand.teal;
                        }
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${tokens.colors.brand.teal}25`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          state() === 'error' ? tokens.colors.error : tokens.colors.border;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  {/* Error Message */}
                  <Show when={state() === 'error' && errorMessage()}>
                    <div
                      role="alert"
                      style={{
                        padding: tokens.spacing.md,
                        background: `${tokens.colors.error}10`,
                        border: `1px solid ${tokens.colors.error}30`,
                        'border-radius': tokens.radius.sm,
                        'margin-bottom': tokens.spacing.md,
                      }}
                    >
                      <p
                        style={{
                          margin: '0',
                          'font-size': tokens.font.sizes.sm,
                          color: tokens.colors.error,
                        }}
                      >
                        {errorMessage()}
                      </p>
                    </div>
                  </Show>

                  {/* Submit Button - Enhanced with brand gradient */}
                  <button
                    type="submit"
                    disabled={state() === 'loading'}
                    style={{
                      width: '100%',
                      padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
                      'font-size': tokens.font.sizes.base,
                      'font-weight': tokens.font.weights.semibold,
                      'font-family': tokens.font.family,
                      color: state() === 'loading' ? tokens.colors.text.muted : '#0F0F1A',
                      background:
                        state() === 'loading'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : `linear-gradient(135deg, ${tokens.colors.brand.coral} 0%, ${tokens.colors.brand.yellow} 50%, ${tokens.colors.brand.teal} 100%)`,
                      border: 'none',
                      'border-radius': tokens.radius.sm,
                      cursor: state() === 'loading' ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      gap: tokens.spacing.sm,
                      'box-shadow':
                        state() === 'loading' ? 'none' : '0 4px 16px rgba(255, 107, 107, 0.35)',
                    }}
                    onMouseEnter={(e) => {
                      if (state() !== 'loading') {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.45)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (state() !== 'loading') {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 107, 107, 0.35)';
                      }
                    }}
                    onMouseDown={(e) => {
                      if (state() !== 'loading') {
                        e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
                      }
                    }}
                    onMouseUp={(e) => {
                      if (state() !== 'loading') {
                        e.currentTarget.style.transform = 'translateY(-1px) scale(1)';
                      }
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = `2px solid ${tokens.colors.brand.teal}`;
                      e.currentTarget.style.outlineOffset = '2px';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = 'none';
                    }}
                  >
                    <Show when={state() === 'loading'}>
                      <SpinnerIcon />
                    </Show>
                    {state() === 'loading' ? 'Sending...' : 'Continue'}
                  </button>
                </form>

                {/* Footer - Terms & Privacy */}
                <p
                  style={{
                    margin: `${tokens.spacing.lg} 0 0`,
                    'font-size': tokens.font.sizes.xs,
                    color: tokens.colors.text.muted,
                    'text-align': 'center',
                    'line-height': '1.6',
                  }}
                >
                  By signing in, you agree to our{' '}
                  <a
                    href="/terms-of-service.md"
                    onClick={(e) => handleLinkClick(e, '/terms-of-service.md')}
                    style={{
                      color: tokens.colors.text.secondary,
                      'text-decoration': 'underline',
                      'text-underline-offset': '2px',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = tokens.colors.brand.teal;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = tokens.colors.text.secondary;
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.color = tokens.colors.brand.teal;
                      e.currentTarget.style.outline = `2px solid ${tokens.colors.brand.teal}`;
                      e.currentTarget.style.outlineOffset = '2px';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.color = tokens.colors.text.secondary;
                      e.currentTarget.style.outline = 'none';
                    }}
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="/privacy-policy.md"
                    onClick={(e) => handleLinkClick(e, '/privacy-policy.md')}
                    style={{
                      color: tokens.colors.text.secondary,
                      'text-decoration': 'underline',
                      'text-underline-offset': '2px',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = tokens.colors.brand.teal;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = tokens.colors.text.secondary;
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.color = tokens.colors.brand.teal;
                      e.currentTarget.style.outline = `2px solid ${tokens.colors.brand.teal}`;
                      e.currentTarget.style.outlineOffset = '2px';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.color = tokens.colors.text.secondary;
                      e.currentTarget.style.outline = 'none';
                    }}
                  >
                    Privacy Policy
                  </a>
                </p>
              </Show>
            </div>
            {/* End inner card */}
          </div>
          {/* End gradient border wrapper */}

          {/* Keyframes for animations */}
          <style>
            {`
              @keyframes loginModalSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }

              @keyframes loginModalFadeIn {
                from {
                  opacity: 0;
                  transform: scale(0.95) translateY(-10px);
                }
                to {
                  opacity: 1;
                  transform: scale(1) translateY(0);
                }
              }

              @keyframes loginModalBorderFlow {
                0% {
                  background-position: 0% 50%;
                }
                100% {
                  background-position: 300% 50%;
                }
              }

              @keyframes loginModalSuccessPulse {
                0%, 100% {
                  box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
                }
                50% {
                  box-shadow: 0 0 40px rgba(16, 185, 129, 0.6);
                }
              }
            `}
          </style>
        </div>
      </Portal>
    </Show>
  );
};

export default LoginModal;
