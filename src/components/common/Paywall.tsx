/**
 * Paywall Component
 *
 * Modal shown when users try to access premium features.
 * Prompts upgrade and shows feature benefits.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, Show, For, createSignal, JSX } from 'solid-js';
import { useAuth } from '../../lib/auth-context';
import { logger } from '../../lib/logger';
import { LoginModal } from './LoginModal';
import { DoodleRocket, DoodleShield } from './DoodleIcons';

// ============================================================================
// TYPES
// ============================================================================

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'tenure_extras' | 'tempo_extras' | 'echoprax_extras' | 'sync' | 'backup';
  featureName?: string;
}

interface FeatureConfig {
  title: string;
  description: string;
  benefits: string[];
  price: string;
  priceAnnual?: string;
  priceSubtext?: string;
  priceId: string;
  ctaText: string;
  icon: 'rocket' | 'shield'; // Which Doodle icon to use
}

// ============================================================================
// FEATURE CONFIGS
// ============================================================================

const FEATURE_CONFIGS: Record<string, FeatureConfig> = {
  tenure_extras: {
    title: 'Tenure Extras',
    description: 'Unlock AI-powered resume mutations and career tools.',
    benefits: [
      '10 AI resume mutations per month',
      'Job-specific resume tailoring',
      'Role archetype transformations',
      'ATS optimization analysis',
      'Cover letter generation',
    ],
    price: '$5/mo',
    priceAnnual: '$30/year',
    priceId: 'price_tenure_extras_monthly',
    ctaText: 'Upgrade to Tenure Extras',
    icon: 'rocket', // Rocket for "extras" = launch/boost
  },
  tempo_extras: {
    title: 'Tempo Extras',
    description: 'Supercharge your productivity with AI assistance.',
    benefits: [
      'AI task refinement & suggestions',
      'Smart brain dump processing',
      'Automatic task prioritization',
      'Time estimation assistance',
      'Weekly productivity insights',
    ],
    price: '$12/mo',
    priceId: 'price_tempo_extras_monthly',
    ctaText: 'Upgrade to Tempo Extras',
    icon: 'rocket', // Rocket for productivity boost
  },
  echoprax_extras: {
    title: 'Echoprax Extras',
    description: 'Unlimited AI-powered workout generation.',
    benefits: [
      'Unlimited AI workout generation',
      'Advanced workout scheduling',
      'Workout history sync',
      'Custom exercise library',
      'Priority support',
    ],
    price: '$8/mo',
    priceAnnual: '$80/year',
    priceId: 'price_echoprax_extras_monthly',
    ctaText: 'Upgrade to Echoprax Extras',
    icon: 'rocket', // Rocket for fitness boost
  },
  sync: {
    title: 'Sync & Backup',
    description: 'Keep your data safe across all devices.',
    benefits: [
      'Cloud backup for all your data',
      'Restore on any device',
      'Email backup on cancellation',
      '2-year cold storage retention',
      'Priority support',
    ],
    price: '$3.50/mo',
    priceId: 'price_sync_all_monthly',
    ctaText: 'Enable Sync & Backup',
    icon: 'shield', // Shield for data protection
  },
  backup: {
    title: 'Sync & Backup',
    description: 'Backup your data to the cloud.',
    benefits: [
      'One-click cloud backup',
      'Restore on new devices',
      'Never lose your data',
      'Email backup on cancellation',
      'Works across all TACo apps',
    ],
    price: '$3.50/mo',
    priceId: 'price_sync_all_monthly',
    ctaText: 'Enable Backup',
    icon: 'shield', // Shield for backup security
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Paywall: Component<PaywallProps> = (props) => {
  const auth = useAuth();
  const [showLogin, setShowLogin] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);

  const config = () => FEATURE_CONFIGS[props.feature] || FEATURE_CONFIGS.sync;

  // Debug logging
  logger.billing.debug('Paywall component rendered', {
    isOpen: props.isOpen,
    feature: props.feature,
    featureName: props.featureName,
  });

  const handleUpgrade = async () => {
    // If not logged in, show login first
    if (!auth.isAuthenticated()) {
      setShowLogin(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('taco_session_token')}`,
        },
        body: JSON.stringify({
          priceId: config().priceId,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        logger.billing.error('No checkout URL returned');
      }
    } catch (error) {
      logger.billing.error('Checkout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    // After login, user can try upgrade again
  };

  if (!props.isOpen) {
    logger.billing.debug('Paywall not showing - isOpen is false');
    return null;
  }

  logger.billing.info('Paywall is showing', { feature: props.feature });

  return (
    <>
      {/* Login Modal */}
      <LoginModal
        isOpen={showLogin()}
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Paywall Modal */}
      <Show when={!showLogin()}>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            'z-index': 9998,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            padding: '20px',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={props.onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              'backdrop-filter': 'blur(8px)',
            }}
          />

          {/* Modal */}
          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
              'border-radius': '20px',
              padding: '0',
              width: '100%',
              'max-width': '440px',
              'box-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
            }}
          >
            {/* Header gradient */}
            <div
              style={{
                background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 50%, #6366F1 100%)',
                padding: '32px 32px 40px',
                'text-align': 'center',
                position: 'relative',
              }}
            >
              {/* Close button */}
              <button
                onClick={props.onClose}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  'border-radius': '6px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')
                }
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              {/* Feature Icon - Dynamic Doodle Icon */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  'border-radius': '16px',
                  margin: '0 auto 16px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                }}
              >
                <Show when={config().icon === 'rocket'}>
                  <DoodleRocket size={36} color="white" />
                </Show>
                <Show when={config().icon === 'shield'}>
                  <DoodleShield size={36} color="white" />
                </Show>
              </div>

              <h2
                style={{
                  margin: '0 0 8px',
                  'font-size': '24px',
                  'font-weight': '700',
                  color: 'white',
                }}
              >
                {config().title}
              </h2>

              <p
                style={{
                  margin: 0,
                  'font-size': '15px',
                  color: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                {config().description}
              </p>
            </div>

            {/* Content */}
            <div style={{ padding: '24px 32px 32px' }}>
              {/* Benefits list */}
              <ul
                style={{
                  margin: '0 0 24px',
                  padding: 0,
                  'list-style': 'none',
                }}
              >
                <For each={config().benefits}>
                  {(benefit) => (
                    <li
                      style={{
                        display: 'flex',
                        'align-items': 'center',
                        gap: '12px',
                        padding: '10px 0',
                        'border-bottom': '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          'border-radius': '50%',
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                          'flex-shrink': 0,
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#10B981"
                          stroke-width="3"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      <span style={{ 'font-size': '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                        {benefit}
                      </span>
                    </li>
                  )}
                </For>
              </ul>

              {/* Price */}
              <div
                style={{
                  'text-align': 'center',
                  'margin-bottom': '20px',
                }}
              >
                <span
                  style={{
                    'font-size': '36px',
                    'font-weight': '700',
                    color: 'white',
                  }}
                >
                  {config().price}
                </span>
                <span
                  style={{
                    'font-size': '14px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    'margin-left': '4px',
                  }}
                >
                  /month
                </span>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleUpgrade}
                disabled={isLoading()}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  'font-size': '16px',
                  'font-weight': '600',
                  color: 'white',
                  background: isLoading()
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'linear-gradient(135deg, #9333EA 0%, #6366F1 100%)',
                  border: 'none',
                  'border-radius': '10px',
                  cursor: isLoading() ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  'box-shadow': isLoading() ? 'none' : '0 4px 14px rgba(147, 51, 234, 0.4)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading()) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(147, 51, 234, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(147, 51, 234, 0.4)';
                }}
              >
                {isLoading()
                  ? 'Loading...'
                  : auth.isAuthenticated()
                    ? config().ctaText
                    : 'Sign in to upgrade'}
              </button>

              {/* Secondary action */}
              <button
                onClick={props.onClose}
                style={{
                  width: '100%',
                  padding: '12px',
                  'margin-top': '12px',
                  'font-size': '14px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
};

export default Paywall;
