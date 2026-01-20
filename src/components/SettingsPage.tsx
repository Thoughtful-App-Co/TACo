/**
 * Settings Page - TACo Hub
 *
 * Comprehensive account management, billing, subscriptions, and app overview.
 * Shows user profile, active subscriptions, credits balance, feature access matrix,
 * and provides access to Stripe billing portal.
 *
 * Design Philosophy:
 * - LiquidCard aesthetic with animated gradients
 * - Information density balanced with visual hierarchy
 * - Progressive disclosure (expandable sections)
 * - Future-ready for animated GIF feature demos
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, Show, For, onMount, createMemo } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../lib/auth-context';
import { getAuthHeaders } from '../lib/auth';
import { logger } from '../lib/logger';
import { showNotification } from '../lib/notifications';
import { LoginModal } from './common/LoginModal';
import { DoodleShield, DoodleSparkle, DoodleRocket } from './common/DoodleIcons';
import { getSubscriptionsSyncTimestamp, isUsingCachedSubscriptions } from '../lib/feature-gates';

// ============================================================================
// TYPES
// ============================================================================

interface TokenBalance {
  balance: number;
  lastUpdated: number;
}

interface SubscriptionDetails {
  id: string;
  name: string;
  description: string;
  features: string[];
  icon: 'club' | 'tenure' | 'tempo' | 'sync';
  color: string;
  billingInfo?: string;
}

interface AppCard {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'alpha' | 'beta' | 'coming-soon';
  color: string;
  route?: string;
  logo?: string;
}

interface FeatureAccess {
  feature: string;
  apps: Record<string, boolean>;
}

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const tokens = {
  colors: {
    background: '#0A0A0F',
    surface: '#1A1A2E',
    surfaceHover: '#252540',
    border: '#2A2A45',
    text: {
      primary: '#FFFFFF',
      secondary: '#A0A0B8',
      muted: '#6B6B80',
    },
    brand: {
      coral: '#FF6B6B',
      yellow: '#FFE66D',
      teal: '#4ECDC4',
      orange: '#FFA500',
      gold: '#F5A623',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  radius: {
    sm: '6px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  font: {
    family: '"Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    brandFamily: "'Shupp', 'DM Sans', system-ui, sans-serif",
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '20px',
      xl: '24px',
      xxl: '32px',
      xxxl: '40px',
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
// DATA CONFIGURATION
// ============================================================================

const TACO_APPS: AppCard[] = [
  {
    id: 'tenure',
    name: 'Tenure',
    description: 'Eternal Career Companion',
    status: 'active',
    color: '#9333EA',
    route: '/tenure',
    logo: '/tenure/tenure_logo.png',
  },
  {
    id: 'tempo',
    name: 'Tempo',
    description: 'A.D.H.D Task Master',
    status: 'active',
    color: '#5E6AD2',
    route: '/tempo',
    logo: '/tempo/tempo_logo.png',
  },
  {
    id: 'echoprax',
    name: 'Echoprax',
    description: 'Portable Boutique Fitness',
    status: 'alpha',
    color: '#FF6B6B',
    route: '/echoprax',
  },
  {
    id: 'nurture',
    name: 'Nurture',
    description: 'Relationship Management',
    status: 'alpha',
    color: '#2D5A45',
    route: '/nurture',
  },
  {
    id: 'papertrail',
    name: 'Paper Trail',
    description: 'News Changelog',
    status: 'coming-soon',
    color: '#FFE500',
    route: '/papertrail',
  },
  {
    id: 'justincase',
    name: 'JustInCase',
    description: 'Small Claims Helper',
    status: 'coming-soon',
    color: '#64748B',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getInitials(email: string): string {
  if (!email) return '?';
  const localPart = email.split('@')[0];
  if (!localPart) return '?';
  if (localPart.length <= 2) return localPart.toUpperCase();
  return localPart.charAt(0).toUpperCase();
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function maskCustomerId(customerId: string | null): string {
  if (!customerId) return 'N/A';
  const visible = 8;
  if (customerId.length <= visible) return customerId;
  return customerId.substring(0, visible) + '•••';
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;

  // For older timestamps, show the date
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const SectionCard: Component<{
  title: string;
  subtitle?: string;
  children: any;
  icon?: any;
}> = (props) => {
  return (
    <div
      style={{
        background: tokens.colors.surface,
        border: `1px solid ${tokens.colors.border}`,
        'border-radius': tokens.radius.lg,
        padding: tokens.spacing.xl,
        'margin-bottom': tokens.spacing.lg,
      }}
    >
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: tokens.spacing.md,
          'margin-bottom': tokens.spacing.lg,
        }}
      >
        <Show when={props.icon}>{props.icon}</Show>
        <div style={{ flex: '1' }}>
          <h2
            style={{
              margin: '0',
              'font-family': tokens.font.brandFamily,
              'font-size': tokens.font.sizes.xl,
              'font-weight': tokens.font.weights.bold,
              color: tokens.colors.text.primary,
            }}
          >
            {props.title}
          </h2>
          <Show when={props.subtitle}>
            <p
              style={{
                margin: `${tokens.spacing.xs} 0 0`,
                'font-size': tokens.font.sizes.sm,
                color: tokens.colors.text.muted,
              }}
            >
              {props.subtitle}
            </p>
          </Show>
        </div>
      </div>
      {props.children}
    </div>
  );
};

const SubscriptionCard: Component<SubscriptionDetails> = (props) => {
  const iconMap = {
    club: <DoodleSparkle size={32} color={tokens.colors.brand.yellow} />,
    tenure: <DoodleShield size={32} color={tokens.colors.brand.teal} />,
    tempo: <DoodleRocket size={32} color={tokens.colors.brand.coral} />,
    sync: <DoodleShield size={32} color={tokens.colors.brand.teal} />,
  };

  return (
    <div
      style={{
        position: 'relative',
        padding: '3px',
        'border-radius': tokens.radius.md,
        background: `linear-gradient(135deg, ${props.color}, ${tokens.colors.brand.teal})`,
        'background-size': '200% 200%',
        animation: 'settingsGradientFlow 4s ease infinite',
      }}
    >
      <div
        style={{
          background: tokens.colors.surface,
          'border-radius': `calc(${tokens.radius.md} - 3px)`,
          padding: tokens.spacing.lg,
          display: 'flex',
          'flex-direction': 'column',
          gap: tokens.spacing.md,
        }}
      >
        <div style={{ display: 'flex', 'align-items': 'flex-start', gap: tokens.spacing.md }}>
          {iconMap[props.icon]}
          <div style={{ flex: '1' }}>
            <h3
              style={{
                margin: '0',
                'font-size': tokens.font.sizes.lg,
                'font-weight': tokens.font.weights.semibold,
                color: tokens.colors.text.primary,
              }}
            >
              {props.name}
            </h3>
            <p
              style={{
                margin: `${tokens.spacing.xs} 0 0`,
                'font-size': tokens.font.sizes.sm,
                color: tokens.colors.text.secondary,
              }}
            >
              {props.description}
            </p>
          </div>
        </div>

        <div
          style={{
            'border-top': `1px solid ${tokens.colors.border}`,
            'padding-top': tokens.spacing.md,
          }}
        >
          <ul
            style={{
              margin: '0',
              padding: '0',
              'list-style': 'none',
              display: 'flex',
              'flex-direction': 'column',
              gap: tokens.spacing.sm,
            }}
          >
            <For each={props.features}>
              {(feature) => (
                <li
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: tokens.spacing.sm,
                    'font-size': tokens.font.sizes.sm,
                    color: tokens.colors.text.secondary,
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={tokens.colors.status.success}
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </li>
              )}
            </For>
          </ul>
        </div>

        <Show when={props.billingInfo}>
          <div
            style={{
              'margin-top': tokens.spacing.sm,
              padding: tokens.spacing.sm,
              background: 'rgba(255, 255, 255, 0.03)',
              'border-radius': tokens.radius.sm,
              'font-size': tokens.font.sizes.xs,
              color: tokens.colors.text.muted,
              'text-align': 'center',
            }}
          >
            {props.billingInfo}
          </div>
        </Show>
      </div>
    </div>
  );
};

const AppCardComponent: Component<AppCard> = (props) => {
  const navigate = useNavigate();

  const statusConfig = {
    active: { label: 'Active', color: tokens.colors.status.success },
    alpha: { label: 'Alpha', color: tokens.colors.status.warning },
    beta: { label: 'Beta', color: tokens.colors.status.warning },
    'coming-soon': { label: 'Coming Soon', color: tokens.colors.text.muted },
  };

  const config = statusConfig[props.status];

  return (
    <div
      style={{
        background: tokens.colors.surface,
        border: `1px solid ${tokens.colors.border}`,
        'border-radius': tokens.radius.md,
        padding: tokens.spacing.lg,
        display: 'flex',
        'flex-direction': 'column',
        gap: tokens.spacing.md,
        transition: 'all 0.3s ease',
        cursor: props.route ? 'pointer' : 'default',
      }}
      onClick={() => props.route && navigate(props.route)}
      onMouseEnter={(e) => {
        if (props.route) {
          e.currentTarget.style.borderColor = props.color;
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 8px 24px ${props.color}30`;
        }
      }}
      onMouseLeave={(e) => {
        if (props.route) {
          e.currentTarget.style.borderColor = tokens.colors.border;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <Show
        when={props.logo}
        fallback={
          <div
            style={{
              width: '48px',
              height: '48px',
              'border-radius': tokens.radius.sm,
              background: `${props.color}20`,
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'font-size': tokens.font.sizes.xl,
              'font-weight': tokens.font.weights.bold,
              color: props.color,
            }}
          >
            {props.name.charAt(0)}
          </div>
        }
      >
        <img
          src={props.logo}
          alt={props.name}
          style={{
            width: '48px',
            height: '48px',
            'object-fit': 'contain',
          }}
        />
      </Show>

      <div style={{ flex: '1' }}>
        <h4
          style={{
            margin: '0',
            'font-size': tokens.font.sizes.base,
            'font-weight': tokens.font.weights.semibold,
            color: tokens.colors.text.primary,
          }}
        >
          {props.name}
        </h4>
        <p
          style={{
            margin: `${tokens.spacing.xs} 0 0`,
            'font-size': tokens.font.sizes.sm,
            color: tokens.colors.text.secondary,
          }}
        >
          {props.description}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
        }}
      >
        <span
          style={{
            'font-size': tokens.font.sizes.xs,
            'font-weight': tokens.font.weights.medium,
            color: config.color,
            padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
            background: `${config.color}20`,
            'border-radius': tokens.radius.sm,
          }}
        >
          {config.label}
        </span>

        <Show when={props.route}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={tokens.colors.text.muted}
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Show>
      </div>

      {/* Placeholder for future animated GIF demo */}
      <div
        style={{
          width: '100%',
          height: '120px',
          background: `linear-gradient(135deg, ${props.color}10, ${props.color}05)`,
          'border-radius': tokens.radius.sm,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          color: tokens.colors.text.muted,
          'font-size': tokens.font.sizes.xs,
          border: `1px dashed ${tokens.colors.border}`,
        }}
      >
        Feature Demo (Coming Soon)
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SettingsPage: Component = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const [showLoginModal, setShowLoginModal] = createSignal(false);
  const [credits, setCredits] = createSignal<TokenBalance | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = createSignal(false);
  const [isLoadingPortal, setIsLoadingPortal] = createSignal(false);
  const [showCreditsInfo, setShowCreditsInfo] = createSignal(false);

  // Fetch credits balance on mount
  onMount(async () => {
    if (!auth.isAuthenticated()) return;

    setIsLoadingCredits(true);
    try {
      const response = await fetch('/api/billing/token-balance', {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data);
      }
    } catch (error) {
      logger.billing.error('Failed to fetch credits:', error);
    } finally {
      setIsLoadingCredits(false);
    }
  });

  // Build subscription details from user data
  const subscriptionDetails = createMemo((): SubscriptionDetails[] => {
    const user = auth.user();
    if (!user) return [];

    const details: SubscriptionDetails[] = [];

    if (auth.isTacoClubMember()) {
      // Get detailed subscription info if available
      const tacoClubDetails = user.subscriptionDetails?.taco_club;
      const isLifetime = tacoClubDetails?.lifetimeAccess ?? false;
      const totalPayments = tacoClubDetails?.totalPayments ?? 0;
      const maxPayments = tacoClubDetails?.maxPayments ?? 24;
      const totalPaidCents = tacoClubDetails?.totalPaidCents ?? 0;

      // Build billing info based on payment status
      let billingInfo: string;
      if (isLifetime) {
        // Lifetime member - either purchased lifetime or completed 24 payments
        if (totalPayments >= maxPayments) {
          billingInfo = `Lifetime (${totalPayments} payments completed)`;
        } else {
          // Purchased lifetime upfront
          billingInfo = `Lifetime ($${(totalPaidCents / 100).toFixed(0)} paid)`;
        }
      } else if (totalPayments > 0) {
        // Active monthly subscription with progress
        const remaining = maxPayments - totalPayments;
        billingInfo = `${totalPayments}/${maxPayments} payments ($${(totalPaidCents / 100).toFixed(0)} paid) - ${remaining} remaining`;
      } else {
        // No payment data yet (new subscription)
        billingInfo = '$25/mo for 24 months';
      }

      details.push({
        id: 'taco_club',
        name: 'TACo Club',
        description: isLifetime ? 'Lifetime Member' : 'Founding Member',
        features: [
          'All apps, all features',
          'Unlimited AI credits',
          'Priority support',
          isLifetime
            ? 'Lifetime access unlocked'
            : `${maxPayments - totalPayments} payments to lifetime`,
        ],
        icon: 'club',
        color: tokens.colors.brand.yellow,
        billingInfo,
      });
    }

    if (auth.hasAppExtras('tenure') && !auth.isTacoClubMember()) {
      details.push({
        id: 'tenure_extras',
        name: 'Tenure Pro',
        description: 'Career Tools',
        features: [
          'Resume Mutation',
          'Cover Letter Generator',
          'Job Insights AI',
          '10 AI credits/month',
        ],
        icon: 'tenure',
        color: tokens.colors.brand.coral,
        billingInfo: '$5/mo or $30/year',
      });
    }

    if (auth.hasAppExtras('tempo') && !auth.isTacoClubMember()) {
      details.push({
        id: 'tempo_extras',
        name: 'Tempo Pro',
        description: 'ADHD Task Master',
        features: [
          'AI Task Planning',
          'Brain Dump Sessions',
          'Smart Prioritization',
          'Annoy Me Mode',
        ],
        icon: 'tempo',
        color: tokens.colors.brand.teal,
        billingInfo: '$12/mo or $80/year',
      });
    }

    if (auth.hasSyncSubscription() && !auth.isTacoClubMember()) {
      const syncApps = [];
      if (auth.hasAppSync('tenure')) syncApps.push('Tenure');
      if (auth.hasAppSync('tempo')) syncApps.push('Tempo');
      if (auth.hasAppSync('nurture')) syncApps.push('Nurture');

      details.push({
        id: 'sync',
        name: 'Cloud Sync',
        description: syncApps.join(' + '),
        features: [
          'Automatic cloud backup',
          'Cross-device sync',
          'Encrypted storage',
          'Restore anytime',
        ],
        icon: 'sync',
        color: tokens.colors.brand.teal,
        billingInfo: '$2/mo per app or $3.50/mo all apps',
      });
    }

    return details;
  });

  // Feature access matrix data
  const featureMatrix = createMemo((): FeatureAccess[] => {
    const hasClub = auth.isTacoClubMember();
    const hasTenureExtras = auth.hasAppExtras('tenure');
    const hasTempoExtras = auth.hasAppExtras('tempo');
    const hasSync = auth.hasSyncSubscription();

    return [
      {
        feature: 'Cloud Sync & Backup',
        apps: {
          Tenure: hasClub || auth.hasAppSync('tenure'),
          Tempo: hasClub || auth.hasAppSync('tempo'),
          Echoprax: hasClub,
          Nurture: hasClub || auth.hasAppSync('nurture'),
        },
      },
      {
        feature: 'AI Features',
        apps: {
          Tenure: hasClub || hasTenureExtras,
          Tempo: hasClub || hasTempoExtras,
          Echoprax: hasClub,
          Nurture: false,
        },
      },
      {
        feature: 'Resume Mutation',
        apps: {
          Tenure: hasClub || hasTenureExtras,
          Tempo: false,
          Echoprax: false,
          Nurture: false,
        },
      },
      {
        feature: 'Cover Letters',
        apps: {
          Tenure: hasClub || hasTenureExtras,
          Tempo: false,
          Echoprax: false,
          Nurture: false,
        },
      },
      {
        feature: 'Brain Dump Sessions',
        apps: {
          Tenure: false,
          Tempo: hasClub || hasTempoExtras,
          Echoprax: false,
          Nurture: false,
        },
      },
      {
        feature: 'Voice Coaching',
        apps: {
          Tenure: false,
          Tempo: false,
          Echoprax: hasClub,
          Nurture: false,
        },
      },
    ];
  });

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
              onClick: () => navigate('/pricing'),
            },
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
        message: 'Unable to open billing portal. Please try again.',
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleSignOut = () => {
    auth.logout();
    navigate('/');
  };

  // Unauthenticated state
  if (!auth.isAuthenticated()) {
    return (
      <>
        <div
          style={{
            'min-height': '100vh',
            background: tokens.colors.background,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            padding: tokens.spacing.xl,
          }}
        >
          <div
            style={{
              'max-width': '480px',
              'text-align': 'center',
            }}
          >
            <DoodleShield size={64} color={tokens.colors.brand.teal} />
            <h1
              style={{
                margin: `${tokens.spacing.lg} 0 ${tokens.spacing.md}`,
                'font-family': tokens.font.brandFamily,
                'font-size': tokens.font.sizes.xxxl,
                'font-weight': tokens.font.weights.bold,
                color: tokens.colors.text.primary,
              }}
            >
              TACo Settings
            </h1>
            <p
              style={{
                margin: `0 0 ${tokens.spacing.xl}`,
                'font-size': tokens.font.sizes.base,
                color: tokens.colors.text.secondary,
                'line-height': '1.6',
              }}
            >
              Sign in to view your account, manage subscriptions, and access your TACo apps.
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                padding: `${tokens.spacing.md} ${tokens.spacing.xl}`,
                background: `linear-gradient(135deg, ${tokens.colors.brand.coral}, ${tokens.colors.brand.yellow}, ${tokens.colors.brand.teal})`,
                border: 'none',
                'border-radius': tokens.radius.sm,
                color: '#0A0A0F',
                'font-family': tokens.font.family,
                'font-size': tokens.font.sizes.base,
                'font-weight': tokens.font.weights.semibold,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                'box-shadow': `0 4px 16px ${tokens.colors.brand.coral}40`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${tokens.colors.brand.coral}60`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 16px ${tokens.colors.brand.coral}40`;
              }}
            >
              Sign In
            </button>
          </div>
        </div>
        <LoginModal isOpen={showLoginModal()} onClose={() => setShowLoginModal(false)} />
      </>
    );
  }

  const user = auth.user();
  if (!user) return null;

  return (
    <div
      style={{
        'min-height': '100vh',
        background: tokens.colors.background,
        'font-family': tokens.font.family,
      }}
    >
      {/* Header */}
      <div
        style={{
          'border-bottom': `1px solid ${tokens.colors.border}`,
          'backdrop-filter': 'blur(8px)',
          position: 'sticky',
          top: '0',
          'z-index': '100',
          background: 'rgba(10, 10, 15, 0.95)',
        }}
      >
        <div
          style={{
            'max-width': '1200px',
            margin: '0 auto',
            padding: `${tokens.spacing.lg} ${tokens.spacing.xl}`,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
          }}
        >
          <div style={{ display: 'flex', 'align-items': 'center', gap: tokens.spacing.md }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                'align-items': 'center',
              }}
              aria-label="Back to home"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={tokens.colors.text.muted}
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <h1
              style={{
                margin: '0',
                'font-family': tokens.font.brandFamily,
                'font-size': tokens.font.sizes.xl,
                'font-weight': tokens.font.weights.bold,
                color: tokens.colors.text.primary,
              }}
            >
              Settings
            </h1>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
              background: 'transparent',
              border: `1px solid ${tokens.colors.border}`,
              'border-radius': tokens.radius.sm,
              color: tokens.colors.text.secondary,
              'font-family': tokens.font.family,
              'font-size': tokens.font.sizes.sm,
              'font-weight': tokens.font.weights.medium,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = tokens.colors.status.error;
              e.currentTarget.style.color = tokens.colors.status.error;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = tokens.colors.border;
              e.currentTarget.style.color = tokens.colors.text.secondary;
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          'max-width': '1200px',
          margin: '0 auto',
          padding: tokens.spacing.xxl,
        }}
      >
        {/* Profile Section */}
        <SectionCard
          title="Your Profile"
          subtitle="Account information and membership status"
          icon={
            <div
              style={{
                width: '64px',
                height: '64px',
                'border-radius': '50%',
                background: `linear-gradient(135deg, ${tokens.colors.brand.coral}, ${tokens.colors.brand.yellow}, ${tokens.colors.brand.teal})`,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'font-size': tokens.font.sizes.xl,
                'font-weight': tokens.font.weights.bold,
                color: 'white',
              }}
            >
              {getInitials(user.email)}
            </div>
          }
        >
          <div
            style={{
              display: 'grid',
              'grid-template-columns': 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: tokens.spacing.lg,
            }}
          >
            <div>
              <div
                style={{
                  'font-size': tokens.font.sizes.xs,
                  'font-weight': tokens.font.weights.medium,
                  color: tokens.colors.text.muted,
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.5px',
                  'margin-bottom': tokens.spacing.xs,
                }}
              >
                Email
              </div>
              <div
                style={{
                  'font-size': tokens.font.sizes.base,
                  color: tokens.colors.text.primary,
                  'word-break': 'break-all',
                }}
              >
                {user.email}
              </div>
            </div>

            <div>
              <div
                style={{
                  'font-size': tokens.font.sizes.xs,
                  'font-weight': tokens.font.weights.medium,
                  color: tokens.colors.text.muted,
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.5px',
                  'margin-bottom': tokens.spacing.xs,
                }}
              >
                Member Since
              </div>
              <div
                style={{
                  'font-size': tokens.font.sizes.base,
                  color: tokens.colors.text.primary,
                }}
              >
                {formatDate(user.createdAt)}
              </div>
            </div>

            <div>
              <div
                style={{
                  'font-size': tokens.font.sizes.xs,
                  'font-weight': tokens.font.weights.medium,
                  color: tokens.colors.text.muted,
                  'text-transform': 'uppercase',
                  'letter-spacing': '0.5px',
                  'margin-bottom': tokens.spacing.xs,
                }}
              >
                Customer ID
              </div>
              <div
                style={{
                  'font-size': tokens.font.sizes.base,
                  color: tokens.colors.text.primary,
                  'font-family': tokens.font.family,
                }}
              >
                {maskCustomerId(user.stripeCustomerId)}
              </div>
            </div>
          </div>

          <Show when={auth.isTacoClubMember()}>
            <div
              style={{
                'margin-top': tokens.spacing.lg,
                padding: tokens.spacing.md,
                background: `linear-gradient(135deg, ${tokens.colors.brand.yellow}15, ${tokens.colors.brand.coral}15)`,
                border: `1px solid ${tokens.colors.brand.yellow}30`,
                'border-radius': tokens.radius.sm,
                display: 'flex',
                'align-items': 'center',
                gap: tokens.spacing.md,
              }}
            >
              <DoodleSparkle size={24} color={tokens.colors.brand.yellow} />
              <span
                style={{
                  'font-size': tokens.font.sizes.sm,
                  'font-weight': tokens.font.weights.medium,
                  color: tokens.colors.brand.yellow,
                }}
              >
                TACo Club Founding Member
              </span>
            </div>
          </Show>
        </SectionCard>

        {/* Credits Section */}
        <SectionCard
          title="Credits"
          subtitle="AI-powered features use credits"
          icon={
            <div
              style={{
                width: '48px',
                height: '48px',
                'border-radius': '50%',
                background: `${tokens.colors.brand.teal}20`,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
              }}
            >
              <DoodleSparkle size={24} color={tokens.colors.brand.teal} />
            </div>
          }
        >
          <Show
            when={!isLoadingCredits()}
            fallback={
              <div style={{ padding: tokens.spacing.xl, 'text-align': 'center' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    border: `3px solid ${tokens.colors.border}`,
                    'border-top-color': tokens.colors.brand.teal,
                    'border-radius': '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto',
                  }}
                />
              </div>
            }
          >
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: tokens.spacing.lg,
              }}
            >
              <div style={{ flex: '1' }}>
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                    'margin-bottom': tokens.spacing.sm,
                  }}
                >
                  <span
                    style={{
                      'font-size': tokens.font.sizes.sm,
                      color: tokens.colors.text.muted,
                    }}
                  >
                    Available Credits
                  </span>
                  <span
                    style={{
                      'font-size': tokens.font.sizes.xl,
                      'font-weight': tokens.font.weights.bold,
                      color: tokens.colors.text.primary,
                    }}
                  >
                    {credits()?.balance || 0}
                  </span>
                </div>

                <div
                  style={{
                    height: '8px',
                    background: tokens.colors.border,
                    'border-radius': '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min((credits()?.balance || 0) / 100, 1) * 100}%`,
                      background: `linear-gradient(90deg, ${tokens.colors.brand.coral}, ${tokens.colors.brand.yellow}, ${tokens.colors.brand.teal})`,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>

                <div
                  style={{
                    'margin-top': tokens.spacing.md,
                    'font-size': tokens.font.sizes.sm,
                    color: tokens.colors.text.secondary,
                  }}
                >
                  Used for: Resume Mutation, Cover Letters, AI Sessions, Job Insights
                </div>
              </div>

              <button
                onClick={() => setShowCreditsInfo(!showCreditsInfo())}
                style={{
                  width: '32px',
                  height: '32px',
                  'border-radius': '50%',
                  background: 'transparent',
                  border: `1px solid ${tokens.colors.border}`,
                  color: tokens.colors.text.muted,
                  cursor: 'pointer',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = tokens.colors.brand.teal;
                  e.currentTarget.style.color = tokens.colors.brand.teal;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = tokens.colors.border;
                  e.currentTarget.style.color = tokens.colors.text.muted;
                }}
              >
                ?
              </button>
            </div>

            <Show when={showCreditsInfo()}>
              <div
                style={{
                  'margin-top': tokens.spacing.lg,
                  padding: tokens.spacing.md,
                  background: `${tokens.colors.brand.teal}10`,
                  border: `1px solid ${tokens.colors.brand.teal}30`,
                  'border-radius': tokens.radius.sm,
                  'font-size': tokens.font.sizes.sm,
                  color: tokens.colors.text.secondary,
                  'line-height': '1.6',
                }}
              >
                <strong style={{ color: tokens.colors.text.primary }}>How credits work:</strong>
                <br />
                • Resume Mutation: 1 credit per mutation
                <br />
                • Cover Letter Generation: 1 credit per letter
                <br />
                • AI Brain Dump Sessions: 2 credits per session
                <br />
                • Job Insights Analysis: 1 credit per analysis
                <br />
                <br />
                Credits are included with premium subscriptions and refill monthly. You can also
                purchase additional credits as needed.
              </div>
            </Show>

            <Show when={(credits()?.balance || 0) < 5}>
              <div
                style={{
                  'margin-top': tokens.spacing.md,
                  padding: tokens.spacing.md,
                  background: `${tokens.colors.status.warning}10`,
                  border: `1px solid ${tokens.colors.status.warning}30`,
                  'border-radius': tokens.radius.sm,
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'space-between',
                }}
              >
                <span
                  style={{
                    'font-size': tokens.font.sizes.sm,
                    color: tokens.colors.status.warning,
                  }}
                >
                  Running low on credits
                </span>
                <button
                  onClick={() => navigate('/pricing')}
                  style={{
                    padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
                    background: tokens.colors.status.warning,
                    border: 'none',
                    'border-radius': tokens.radius.sm,
                    color: tokens.colors.background,
                    'font-size': tokens.font.sizes.sm,
                    'font-weight': tokens.font.weights.medium,
                    cursor: 'pointer',
                  }}
                >
                  Get More
                </button>
              </div>
            </Show>
          </Show>
        </SectionCard>

        {/* Subscriptions Section */}
        <SectionCard
          title="Your Subscriptions"
          subtitle={
            subscriptionDetails().length > 0
              ? 'Active plans and features'
              : 'No active subscriptions'
          }
        >
          <Show
            when={subscriptionDetails().length > 0}
            fallback={
              <div
                style={{
                  padding: tokens.spacing.xxl,
                  'text-align': 'center',
                }}
              >
                <DoodleRocket size={48} color={tokens.colors.text.muted} />
                <p
                  style={{
                    margin: `${tokens.spacing.lg} 0`,
                    'font-size': tokens.font.sizes.base,
                    color: tokens.colors.text.secondary,
                  }}
                >
                  You're currently on the free plan. Upgrade to unlock premium features across all
                  TACo apps.
                </p>
                <button
                  onClick={() => navigate('/pricing')}
                  style={{
                    padding: `${tokens.spacing.md} ${tokens.spacing.xl}`,
                    background: `linear-gradient(135deg, ${tokens.colors.brand.coral}, ${tokens.colors.brand.yellow}, ${tokens.colors.brand.teal})`,
                    border: 'none',
                    'border-radius': tokens.radius.sm,
                    color: tokens.colors.background,
                    'font-family': tokens.font.family,
                    'font-size': tokens.font.sizes.base,
                    'font-weight': tokens.font.weights.semibold,
                    cursor: 'pointer',
                    'box-shadow': `0 4px 16px ${tokens.colors.brand.coral}40`,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${tokens.colors.brand.coral}60`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 16px ${tokens.colors.brand.coral}40`;
                  }}
                >
                  View Plans
                </button>
              </div>
            }
          >
            <div
              style={{
                display: 'grid',
                'grid-template-columns': 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: tokens.spacing.lg,
              }}
            >
              <For each={subscriptionDetails()}>{(sub) => <SubscriptionCard {...sub} />}</For>
            </div>

            {/* Subtle sync timestamp indicator */}
            <Show when={getSubscriptionsSyncTimestamp()}>
              <div
                style={{
                  'margin-top': tokens.spacing.lg,
                  'padding-top': tokens.spacing.md,
                  'border-top': `1px solid ${tokens.colors.border}`,
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'flex-end',
                  gap: tokens.spacing.xs,
                }}
              >
                <Show
                  when={isUsingCachedSubscriptions()}
                  fallback={
                    <span
                      style={{
                        'font-size': tokens.font.sizes.xs,
                        color: tokens.colors.text.muted,
                      }}
                    >
                      Last synced {formatRelativeTime(getSubscriptionsSyncTimestamp()!)}
                    </span>
                  }
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={tokens.colors.status.warning}
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span
                    style={{
                      'font-size': tokens.font.sizes.xs,
                      color: tokens.colors.status.warning,
                    }}
                    title="Subscription data may be outdated. Connect to the internet to refresh."
                  >
                    Cached ({formatRelativeTime(getSubscriptionsSyncTimestamp()!)})
                  </span>
                </Show>
              </div>
            </Show>
          </Show>
        </SectionCard>

        {/* Feature Access */}
        <SectionCard
          title="Feature Access"
          subtitle="What you can do across TACo apps"
          icon={
            <div
              style={{
                width: '48px',
                height: '48px',
                'border-radius': '50%',
                background: `${tokens.colors.brand.coral}20`,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
              }}
            >
              <DoodleShield size={24} color={tokens.colors.brand.coral} />
            </div>
          }
        >
          <div
            style={{
              display: 'flex',
              'flex-direction': 'column',
              gap: tokens.spacing.lg,
            }}
          >
            {/* Sync & Backup */}
            <Show when={auth.hasSyncSubscription() || auth.isTacoClubMember()}>
              <div
                style={{
                  padding: tokens.spacing.lg,
                  'border-radius': tokens.radius.lg,
                  border: `1px solid ${tokens.colors.border}`,
                  background: tokens.colors.surface,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: tokens.spacing.md,
                    'margin-bottom': tokens.spacing.md,
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      'border-radius': '8px',
                      background: `${tokens.colors.brand.teal}20`,
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={tokens.colors.brand.teal}
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  </div>
                  <h3
                    style={{
                      'font-family': tokens.font.brandFamily,
                      'font-size': tokens.font.sizes.lg,
                      'font-weight': tokens.font.weights.semibold,
                      color: tokens.colors.text.primary,
                      margin: 0,
                    }}
                  >
                    Cloud Sync & Backup
                  </h3>
                </div>
                <div
                  style={{
                    display: 'flex',
                    'flex-wrap': 'wrap',
                    gap: tokens.spacing.sm,
                  }}
                >
                  <Show when={auth.hasAppSync('tempo') || auth.isTacoClubMember()}>
                    <div
                      style={{
                        padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                        'border-radius': tokens.radius.md,
                        background: `${tokens.colors.brand.teal}15`,
                        border: `1px solid ${tokens.colors.brand.teal}30`,
                        'font-size': tokens.font.sizes.sm,
                        color: tokens.colors.text.primary,
                        display: 'flex',
                        'align-items': 'center',
                        gap: tokens.spacing.xs,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={tokens.colors.status.success}
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Tempo
                    </div>
                  </Show>
                  <Show when={auth.hasAppSync('tenure') || auth.isTacoClubMember()}>
                    <div
                      style={{
                        padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                        'border-radius': tokens.radius.md,
                        background: `${tokens.colors.brand.teal}15`,
                        border: `1px solid ${tokens.colors.brand.teal}30`,
                        'font-size': tokens.font.sizes.sm,
                        color: tokens.colors.text.primary,
                        display: 'flex',
                        'align-items': 'center',
                        gap: tokens.spacing.xs,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={tokens.colors.status.success}
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Tenure
                    </div>
                  </Show>
                  <Show when={auth.hasAppSync('nurture') || auth.isTacoClubMember()}>
                    <div
                      style={{
                        padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                        'border-radius': tokens.radius.md,
                        background: `${tokens.colors.brand.teal}15`,
                        border: `1px solid ${tokens.colors.brand.teal}30`,
                        'font-size': tokens.font.sizes.sm,
                        color: tokens.colors.text.primary,
                        display: 'flex',
                        'align-items': 'center',
                        gap: tokens.spacing.xs,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={tokens.colors.status.success}
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Nurture
                    </div>
                  </Show>
                </div>
              </div>
            </Show>

            {/* Tempo Extras */}
            <Show when={auth.hasAppExtras('tempo') || auth.isTacoClubMember()}>
              <div
                style={{
                  padding: tokens.spacing.lg,
                  'border-radius': tokens.radius.lg,
                  border: `1px solid ${tokens.colors.border}`,
                  background: tokens.colors.surface,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: tokens.spacing.md,
                    'margin-bottom': tokens.spacing.md,
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      'border-radius': '8px',
                      background: 'linear-gradient(135deg, #5E6AD2 0%, #8B5CF6 100%)',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <h3
                    style={{
                      'font-family': tokens.font.brandFamily,
                      'font-size': tokens.font.sizes.lg,
                      'font-weight': tokens.font.weights.semibold,
                      color: tokens.colors.text.primary,
                      margin: 0,
                    }}
                  >
                    Tempo Extras
                  </h3>
                </div>
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    'list-style': 'none',
                    display: 'flex',
                    'flex-direction': 'column',
                    gap: tokens.spacing.sm,
                  }}
                >
                  <li
                    style={{
                      'font-size': tokens.font.sizes.sm,
                      color: tokens.colors.text.secondary,
                      display: 'flex',
                      'align-items': 'center',
                      gap: tokens.spacing.sm,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={tokens.colors.status.success}
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      style={{ 'flex-shrink': '0' }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    AI-powered task processing
                  </li>
                  <li
                    style={{
                      'font-size': tokens.font.sizes.sm,
                      color: tokens.colors.text.secondary,
                      display: 'flex',
                      'align-items': 'center',
                      gap: tokens.spacing.sm,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={tokens.colors.status.success}
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      style={{ 'flex-shrink': '0' }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Brain dump sessions
                  </li>
                  <li
                    style={{
                      'font-size': tokens.font.sizes.sm,
                      color: tokens.colors.text.secondary,
                      display: 'flex',
                      'align-items': 'center',
                      gap: tokens.spacing.sm,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={tokens.colors.status.success}
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      style={{ 'flex-shrink': '0' }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Priority support
                  </li>
                </ul>
              </div>
            </Show>

            {/* Tenure Extras */}
            <Show when={auth.hasAppExtras('tenure') || auth.isTacoClubMember()}>
              <div
                style={{
                  padding: tokens.spacing.lg,
                  'border-radius': tokens.radius.lg,
                  border: `1px solid ${tokens.colors.border}`,
                  background: tokens.colors.surface,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    'align-items': 'center',
                    gap: tokens.spacing.md,
                    'margin-bottom': tokens.spacing.md,
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      'border-radius': '8px',
                      background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <h3
                    style={{
                      'font-family': tokens.font.brandFamily,
                      'font-size': tokens.font.sizes.lg,
                      'font-weight': tokens.font.weights.semibold,
                      color: tokens.colors.text.primary,
                      margin: 0,
                    }}
                  >
                    Tenure Extras
                  </h3>
                </div>
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    'list-style': 'none',
                    display: 'flex',
                    'flex-direction': 'column',
                    gap: tokens.spacing.sm,
                  }}
                >
                  <li
                    style={{
                      'font-size': tokens.font.sizes.sm,
                      color: tokens.colors.text.secondary,
                      display: 'flex',
                      'align-items': 'center',
                      gap: tokens.spacing.sm,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={tokens.colors.status.success}
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      style={{ 'flex-shrink': '0' }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    AI resume mutation
                  </li>
                  <li
                    style={{
                      'font-size': tokens.font.sizes.sm,
                      color: tokens.colors.text.secondary,
                      display: 'flex',
                      'align-items': 'center',
                      gap: tokens.spacing.sm,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={tokens.colors.status.success}
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      style={{ 'flex-shrink': '0' }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    AI cover letter generation
                  </li>
                  <li
                    style={{
                      'font-size': tokens.font.sizes.sm,
                      color: tokens.colors.text.secondary,
                      display: 'flex',
                      'align-items': 'center',
                      gap: tokens.spacing.sm,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={tokens.colors.status.success}
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      style={{ 'flex-shrink': '0' }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Labor market insights
                  </li>
                  <li
                    style={{
                      'font-size': tokens.font.sizes.sm,
                      color: tokens.colors.text.secondary,
                      display: 'flex',
                      'align-items': 'center',
                      gap: tokens.spacing.sm,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={tokens.colors.status.success}
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      style={{ 'flex-shrink': '0' }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Priority support
                  </li>
                </ul>
              </div>
            </Show>

            {/* No premium features message */}
            <Show
              when={
                !auth.hasSyncSubscription() &&
                !auth.hasAppExtras('tempo') &&
                !auth.hasAppExtras('tenure') &&
                !auth.isTacoClubMember()
              }
            >
              <div
                style={{
                  padding: tokens.spacing.xl,
                  'border-radius': tokens.radius.lg,
                  border: `1px dashed ${tokens.colors.border}`,
                  background: tokens.colors.surface,
                  'text-align': 'center',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    'font-size': tokens.font.sizes.base,
                    color: tokens.colors.text.secondary,
                  }}
                >
                  You're on the free plan. Upgrade to unlock premium features!
                </p>
                <button
                  onClick={() => navigate('/pricing')}
                  style={{
                    'margin-top': tokens.spacing.md,
                    padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
                    'border-radius': tokens.radius.md,
                    border: 'none',
                    background: `linear-gradient(135deg, ${tokens.colors.brand.coral} 0%, ${tokens.colors.brand.orange} 100%)`,
                    color: 'white',
                    'font-size': tokens.font.sizes.sm,
                    'font-weight': tokens.font.weights.semibold,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 16px ${tokens.colors.brand.coral}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  View Pricing
                </button>
              </div>
            </Show>
          </div>
        </SectionCard>

        {/* Actions Footer */}
        <div
          style={{
            display: 'flex',
            gap: tokens.spacing.md,
            'justify-content': 'center',
            'margin-top': tokens.spacing.xxl,
            'padding-top': tokens.spacing.xxl,
            'border-top': `1px solid ${tokens.colors.border}`,
          }}
        >
          <button
            onClick={handleManageBilling}
            disabled={isLoadingPortal()}
            style={{
              padding: `${tokens.spacing.md} ${tokens.spacing.xl}`,
              background: tokens.colors.surface,
              border: `1px solid ${tokens.colors.border}`,
              'border-radius': tokens.radius.sm,
              color: tokens.colors.text.primary,
              'font-family': tokens.font.family,
              'font-size': tokens.font.sizes.base,
              'font-weight': tokens.font.weights.medium,
              cursor: isLoadingPortal() ? 'not-allowed' : 'pointer',
              opacity: isLoadingPortal() ? 0.6 : 1,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isLoadingPortal()) {
                e.currentTarget.style.borderColor = tokens.colors.brand.teal;
                e.currentTarget.style.background = tokens.colors.surfaceHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoadingPortal()) {
                e.currentTarget.style.borderColor = tokens.colors.border;
                e.currentTarget.style.background = tokens.colors.surface;
              }
            }}
          >
            {isLoadingPortal() ? 'Opening...' : 'Manage Billing'}
          </button>

          <button
            onClick={() => navigate('/pricing')}
            style={{
              padding: `${tokens.spacing.md} ${tokens.spacing.xl}`,
              background: `linear-gradient(135deg, ${tokens.colors.brand.coral}, ${tokens.colors.brand.yellow}, ${tokens.colors.brand.teal})`,
              border: 'none',
              'border-radius': tokens.radius.sm,
              color: tokens.colors.background,
              'font-family': tokens.font.family,
              'font-size': tokens.font.sizes.base,
              'font-weight': tokens.font.weights.semibold,
              cursor: 'pointer',
              'box-shadow': `0 4px 16px ${tokens.colors.brand.coral}40`,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 20px ${tokens.colors.brand.coral}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 16px ${tokens.colors.brand.coral}40`;
            }}
          >
            View Plans
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes settingsGradientFlow {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
        `}
      </style>
    </div>
  );
};

export default SettingsPage;
