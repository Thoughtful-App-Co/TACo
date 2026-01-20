/**
 * Pricing Page - TACo Interactive Pricing & Cart
 *
 * Modular pricing page with checklist-based selection, real-time cart,
 * A24-styled tooltips, and savings calculator.
 *
 * FIXED ISSUES:
 * 1. Gradient text visibility in hero
 * 2. Upgraded tooltips with design.xml standards
 * 3. Added app-specific tooltips for each Extra
 * 4. Refactored into modular components for maintainability
 */

import { Component, createSignal, For, Show, createMemo, createResource, onMount } from 'solid-js';
import { A, useSearchParams } from '@solidjs/router';
import { Footer } from './common/Footer';
import { getStripePrices } from '../lib/stripe-prices';
import { useAuth } from '../lib/auth-context';
import { logger } from '../lib/logger';
import { clearSubscriptionCache } from '../lib/feature-gates';

// Modular component imports
import {
  HeroSection,
  ExtrasSection,
  InfoIcon,
  tokens,
  availableApps,
  allApps,
  tooltipContent,
  faqItems,
  type TacoClubTier,
} from './pricing';

// =============================================================================
// TYPES
// =============================================================================

interface FoundingStats {
  total: number;
  remaining: number;
  limit: number;
  percentFilled: number;
  breakdown: {
    monthly: number;
    lifetime: number;
  };
  nearLimit: boolean;
  atLimit: boolean;
  showWarning: boolean;
  error?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const PricingPage: Component = () => {
  // Cart state
  const [selectedSyncApps, setSelectedSyncApps] = createSignal<string[]>([]);
  const [syncAllApps, setSyncAllApps] = createSignal(false);
  const [syncAnnual, setSyncAnnual] = createSignal(false); // Monthly vs Annual for sync
  const [selectedExtras, setSelectedExtras] = createSignal<string[]>([]);
  const [tempoAnnual, setTempoAnnual] = createSignal(false);
  const [tenureAnnual, setTenureAnnual] = createSignal(false); // Monthly vs Annual for tenure (default to monthly for discoverability)
  const [tacoClubTier, setTacoClubTier] = createSignal<TacoClubTier>('none');

  // Tooltip state
  const [activeTooltip, setActiveTooltip] = createSignal<string | null>(null);

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = createSignal<number | null>(null);

  // Auth context
  const auth = useAuth();

  // Checkout state
  const [isCheckingOut, setIsCheckingOut] = createSignal(false);
  const [checkoutError, setCheckoutError] = createSignal<string | null>(null);

  // URL params for checkout result
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSuccessModal, setShowSuccessModal] = createSignal(false);
  const [showCanceledMessage, setShowCanceledMessage] = createSignal(false);

  // Handle checkout result on mount
  onMount(async () => {
    if (searchParams.success === 'true') {
      setShowSuccessModal(true);
      // Clear the URL param
      setSearchParams({ success: undefined });

      // Poll for subscription to appear (webhook may take a moment)
      let attempts = 0;
      const maxAttempts = 5;
      const pollInterval = 2000; // 2 seconds

      const pollForSubscription = async () => {
        attempts++;
        logger.billing.debug(`Polling for subscription, attempt ${attempts}/${maxAttempts}`);

        // Clear feature-gates cache and force refresh auth/subscription data
        clearSubscriptionCache();
        if (auth.refreshSession) {
          await auth.refreshSession();
        }

        // Keep polling if no subscription yet and haven't maxed out attempts
        if (attempts < maxAttempts) {
          setTimeout(pollForSubscription, pollInterval);
        } else {
          logger.billing.info('Subscription polling complete');
        }
      };

      // Start polling after a brief delay to let webhook process
      setTimeout(pollForSubscription, 1500);
    }

    if (searchParams.canceled === 'true') {
      setShowCanceledMessage(true);
      // Clear the URL param after a delay
      setTimeout(() => {
        setSearchParams({ canceled: undefined });
        setShowCanceledMessage(false);
      }, 5000);
    }
  });

  // Handle checkout
  const handleCheckout = async () => {
    setCheckoutError(null);

    // Must be logged in
    if (!auth.isAuthenticated()) {
      logger.billing.warn('User not authenticated, cannot checkout');
      setCheckoutError('Please sign in to continue');
      return;
    }

    // Must have something in cart
    if (
      tacoClubTier() === 'none' &&
      selectedExtras().length === 0 &&
      !syncAllApps() &&
      selectedSyncApps().length === 0
    ) {
      setCheckoutError('Please select at least one item');
      return;
    }

    // Check for mixed payment modes (lifetime is one-time, everything else is subscription)
    // Stripe cannot mix one-time and subscription items in a single checkout
    const hasLifetime = tacoClubTier() === 'lifetime';
    const hasSubscriptionItems =
      tacoClubTier() === 'monthly' ||
      selectedExtras().length > 0 ||
      (!hasLifetime && (syncAllApps() || selectedSyncApps().length > 0));

    if (hasLifetime && hasSubscriptionItems) {
      setCheckoutError(
        'TACo Club Lifetime cannot be combined with subscriptions in one checkout. ' +
          'Please purchase Lifetime first, then add extras from your account.'
      );
      return;
    }

    setIsCheckingOut(true);
    const prices = getStripePrices();

    try {
      // Build cart items array - collect ALL selected items
      interface CartItem {
        priceId: string;
        quantity: number;
      }

      const items: CartItem[] = [];
      const hasTacoClub = tacoClubTier() !== 'none';

      // 1. TACo Club (if selected)
      if (tacoClubTier() === 'lifetime') {
        items.push({ priceId: prices.TACO_CLUB_LIFETIME, quantity: 1 });
      } else if (tacoClubTier() === 'monthly') {
        items.push({ priceId: prices.TACO_CLUB_MONTHLY, quantity: 1 });
      }

      // 2. Sync & Backup (only if NO TACo Club - sync is FREE with club membership)
      if (!hasTacoClub) {
        if (syncAllApps()) {
          const priceId = syncAnnual() ? prices.SYNC_ALL_YEARLY : prices.SYNC_ALL_MONTHLY;
          items.push({ priceId, quantity: 1 });
        } else if (selectedSyncApps().length > 0) {
          // Per-app sync: charge per app selected
          const priceId = syncAnnual() ? prices.SYNC_APP_YEARLY : prices.SYNC_APP_MONTHLY;
          items.push({ priceId, quantity: selectedSyncApps().length });
        }
      }

      // 3. App Extras (use discounted club prices if TACo Club member)
      if (selectedExtras().includes('tempo')) {
        let priceId: string;
        if (hasTacoClub) {
          // 75% discount for TACo Club members
          priceId = tempoAnnual()
            ? prices.TEMPO_EXTRAS_YEARLY_CLUB
            : prices.TEMPO_EXTRAS_MONTHLY_CLUB;
        } else {
          priceId = tempoAnnual() ? prices.TEMPO_EXTRAS_YEARLY : prices.TEMPO_EXTRAS_MONTHLY;
        }
        items.push({ priceId, quantity: 1 });
      }
      if (selectedExtras().includes('tenure')) {
        let priceId: string;
        if (hasTacoClub) {
          // 75% discount for TACo Club members
          priceId = tenureAnnual()
            ? prices.TENURE_EXTRAS_YEARLY_CLUB
            : prices.TENURE_EXTRAS_MONTHLY_CLUB;
        } else {
          priceId = tenureAnnual() ? prices.TENURE_EXTRAS_YEARLY : prices.TENURE_EXTRAS_MONTHLY;
        }
        items.push({ priceId, quantity: 1 });
      }

      logger.billing.info('Building checkout with items', { itemCount: items.length, items });

      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('taco_session_token')}`,
        },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        logger.billing.error('No checkout URL returned', data);
        setCheckoutError(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      logger.billing.error('Checkout error:', error);
      setCheckoutError('Something went wrong. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Fetch founding member stats
  const [foundingStats] = createResource<FoundingStats>(async () => {
    try {
      const response = await globalThis.fetch('/api/billing/founding-stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } catch {
      // Return fallback data on error
      return {
        total: 0,
        remaining: 10000,
        limit: 10000,
        percentFilled: 0,
        breakdown: { monthly: 0, lifetime: 0 },
        nearLimit: false,
        atLimit: false,
        showWarning: false,
        error: 'Unable to load stats',
      };
    }
  });

  // Toggle functions
  const toggleSyncApp = (appId: string) => {
    if (syncAllApps()) return;
    setSelectedSyncApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const toggleSyncAll = () => {
    if (!syncAllApps()) {
      setSyncAllApps(true);
      setSelectedSyncApps([]);
    } else {
      setSyncAllApps(false);
    }
  };

  const toggleExtra = (appId: string) => {
    setSelectedExtras((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  // Pricing calculations
  const syncCost = createMemo(() => {
    // Monthly: $2/mo per app OR $3.50/mo all apps
    // Annual: $20/year per app OR $35/year all apps
    if (syncAnnual()) {
      // Annual pricing
      if (syncAllApps()) return 35;
      return selectedSyncApps().length * 20;
    } else {
      // Monthly pricing
      if (syncAllApps()) return 42; // $3.50/mo × 12 months
      return selectedSyncApps().length * 24; // $2/mo × 12 months
    }
  });

  const extrasCost = createMemo(() => {
    let total = 0;
    if (selectedExtras().includes('tempo')) {
      total += tempoAnnual() ? 120 : 12;
    }
    if (selectedExtras().includes('tenure')) {
      // $30/year (annual) or $5/mo × 12 = $60/year (monthly)
      total += tenureAnnual() ? 30 : 60;
    }
    return total;
  });

  const tacoClubCost = createMemo(() => {
    if (tacoClubTier() === 'monthly') return 25; // First month
    if (tacoClubTier() === 'lifetime') return 500;
    return 0;
  });

  // Calculate what's due today vs recurring
  const dueToday = createMemo(() => {
    let today = 0;

    // Sync is always annual, due today
    if (tacoClubTier() !== 'none') {
      // TACo Club includes free sync, so don't charge for sync
      today += 0;
    } else {
      today += syncCost();
    }

    // Extras - apply TACo Club discount if applicable
    if (tacoClubTier() !== 'none') {
      // 75% off extras
      today += Math.round(extrasCost() * 0.25);
    } else {
      today += extrasCost();
    }

    // TACo Club - first payment or lifetime
    today += tacoClubCost();

    return today;
  });

  const monthlyRecurring = createMemo(() => {
    let monthly = 0;

    // TACo Club monthly
    if (tacoClubTier() === 'monthly') {
      monthly += 25;
    }

    // Tempo monthly (if not annual)
    if (selectedExtras().includes('tempo') && !tempoAnnual()) {
      const tempoMonthly = tacoClubTier() !== 'none' ? 3 : 12; // 75% off with TACo
      monthly += tempoMonthly;
    }

    return monthly;
  });

  const savingsWithClub = createMemo(() => {
    if (tacoClubTier() === 'none') return 0;
    // Sync is free, 75% off extras
    const savedOnSync = syncCost();
    const savedOnExtras = Math.round(extrasCost() * 0.75);
    return savedOnSync + savedOnExtras;
  });

  return (
    <div
      style={{
        'min-height': '100vh',
        background: `linear-gradient(180deg, ${tokens.colors.background} 0%, ${tokens.colors.backgroundLight} 100%)`,
        color: tokens.colors.text,
        'font-family': tokens.fonts.body,
      }}
    >
      {/* Success Modal */}
      <Show when={showSuccessModal()}>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            'z-index': 9999,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            padding: '20px',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setShowSuccessModal(false)}
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
              background: tokens.colors.surface,
              'border-radius': tokens.radius.lg,
              padding: tokens.spacing.xl,
              'max-width': '400px',
              width: '100%',
              'text-align': 'center',
              border: `1px solid ${tokens.colors.border}`,
            }}
          >
            {/* Success Icon */}
            <div
              style={{
                width: '64px',
                height: '64px',
                background: 'rgba(16, 185, 129, 0.2)',
                'border-radius': '50%',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                margin: '0 auto 16px',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10B981"
                stroke-width="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>

            <h2
              style={{
                margin: '0 0 8px',
                'font-size': '24px',
                'font-weight': '700',
                color: tokens.colors.text,
              }}
            >
              Welcome to TACo!
            </h2>

            <p
              style={{
                margin: '0 0 24px',
                color: tokens.colors.textMuted,
                'font-size': '15px',
                'line-height': '1.5',
              }}
            >
              Your subscription is now active. You have full access to all your selected features.
            </p>

            <button
              onClick={() => setShowSuccessModal(false)}
              style={{
                width: '100%',
                padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
                background: `linear-gradient(135deg, ${tokens.colors.accent.coral}, ${tokens.colors.accent.yellow})`,
                'border-radius': tokens.radius.md,
                border: 'none',
                'font-size': '16px',
                'font-weight': '600',
                color: tokens.colors.background,
                cursor: 'pointer',
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </Show>

      {/* Canceled Message */}
      <Show when={showCanceledMessage()}>
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: tokens.colors.surface,
            padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
            'border-radius': tokens.radius.md,
            border: `1px solid ${tokens.colors.border}`,
            'z-index': 9998,
            display: 'flex',
            'align-items': 'center',
            gap: tokens.spacing.sm,
          }}
        >
          <span style={{ color: tokens.colors.textMuted }}>
            Checkout canceled. Your cart is still saved.
          </span>
          <button
            onClick={() => setShowCanceledMessage(false)}
            style={{
              background: 'none',
              border: 'none',
              color: tokens.colors.textDim,
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            x
          </button>
        </div>
      </Show>

      {/* Breadcrumb Navigation */}
      <div
        style={{
          padding: `${tokens.spacing.lg} ${tokens.spacing.lg} 0`,
          'max-width': '1300px',
          margin: '0 auto',
        }}
      >
        <A
          href="/"
          style={{
            display: 'inline-flex',
            'align-items': 'center',
            gap: tokens.spacing.sm,
            'font-size': '14px',
            color: tokens.colors.textMuted,
            'text-decoration': 'none',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = tokens.colors.text)}
          onMouseLeave={(e) => (e.currentTarget.style.color = tokens.colors.textMuted)}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Home
        </A>
      </div>

      {/* Hero Section - FIXED GRADIENT TEXT */}
      <HeroSection />

      {/* Main Grid: Checklist + Cart */}
      <div
        style={{
          display: 'grid',
          'grid-template-columns': '1fr 380px',
          gap: tokens.spacing.xl,
          padding: `0 ${tokens.spacing.lg} ${tokens.spacing['3xl']}`,
          'max-width': '1300px',
          margin: '0 auto',
        }}
      >
        {/* Left: Checklist */}
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: tokens.spacing.xl }}>
          {/* Section: Sync & Backup */}
          <section>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: tokens.spacing.sm,
                'margin-bottom': tokens.spacing.lg,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  'font-size': '24px',
                  'font-weight': '600',
                  color: tokens.colors.text,
                }}
              >
                Sync & Backup
              </h2>
              <InfoIcon
                content={tooltipContent.sync}
                tooltipKey="sync"
                activeTooltip={activeTooltip}
                setActiveTooltip={setActiveTooltip}
              />
            </div>

            {/* All Apps Option */}
            <div
              onClick={toggleSyncAll}
              style={{
                padding: tokens.spacing.lg,
                background: syncAllApps() ? tokens.colors.surfaceHover : tokens.colors.surface,
                border: `2px solid ${syncAllApps() ? tokens.colors.success : tokens.colors.border}`,
                'border-radius': tokens.radius.lg,
                'margin-bottom': tokens.spacing.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                'align-items': 'center',
                gap: tokens.spacing.md,
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  'border-radius': '6px',
                  border: `2px solid ${syncAllApps() ? tokens.colors.success : tokens.colors.border}`,
                  background: syncAllApps() ? tokens.colors.success : 'transparent',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  'flex-shrink': 0,
                  transition: 'all 0.2s ease',
                }}
              >
                <Show when={syncAllApps()}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    stroke-width="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </Show>
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    'font-size': '18px',
                    'font-weight': '600',
                    color: tokens.colors.text,
                    display: 'flex',
                    'align-items': 'center',
                    gap: tokens.spacing.sm,
                  }}
                >
                  All Apps Sync & Backup
                  <div onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex' }}>
                    <InfoIcon
                      content={tooltipContent.allAppsSync}
                      tooltipKey="allAppsSync"
                      activeTooltip={activeTooltip}
                      setActiveTooltip={setActiveTooltip}
                    />
                  </div>
                  <span
                    style={{
                      padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                      background: `linear-gradient(135deg, ${tokens.colors.accent.coral}, ${tokens.colors.accent.yellow})`,
                      'border-radius': tokens.radius.sm,
                      'font-size': '10px',
                      'font-weight': '700',
                      color: tokens.colors.background,
                      'text-transform': 'uppercase',
                      'letter-spacing': '0.5px',
                    }}
                  >
                    Best Value
                  </span>
                </div>
                <div
                  style={{
                    'font-size': '13px',
                    color: tokens.colors.textMuted,
                    'margin-top': '4px',
                  }}
                >
                  All current + future apps • Cloud backup • Cross-device sync
                </div>
              </div>

              <div
                style={{
                  'text-align': 'right',
                  display: 'flex',
                  'flex-direction': 'column',
                  'align-items': 'flex-end',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                  <span style={{ 'font-size': '11px', color: tokens.colors.textDim }}>Monthly</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSyncAnnual(!syncAnnual());
                    }}
                    style={{
                      padding: '2px',
                      background: tokens.colors.surface,
                      border: `1px solid ${tokens.colors.border}`,
                      'border-radius': '12px',
                      display: 'flex',
                      'align-items': 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      width: '40px',
                      height: '20px',
                    }}
                  >
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        'border-radius': '50%',
                        background: syncAnnual() ? tokens.colors.success : tokens.colors.textDim,
                        position: 'absolute',
                        left: syncAnnual() ? '21px' : '2px',
                        transition: 'left 0.2s ease, background 0.2s ease',
                      }}
                    />
                  </button>
                  <span
                    style={{
                      'font-size': '11px',
                      color: syncAnnual() ? tokens.colors.success : tokens.colors.textDim,
                    }}
                  >
                    Annual
                  </span>
                </div>
                <div
                  style={{
                    'font-size': '20px',
                    'font-weight': '700',
                    color: tokens.colors.text,
                  }}
                >
                  {syncAnnual() ? '$35' : '$3.50'}
                  <span
                    style={{
                      'font-size': '14px',
                      'font-weight': '500',
                      color: tokens.colors.textMuted,
                    }}
                  >
                    /{syncAnnual() ? 'year' : 'mo'}
                  </span>
                </div>
                <Show when={syncAnnual()}>
                  <div style={{ 'font-size': '11px', color: tokens.colors.success }}>
                    Save $7/year
                  </div>
                </Show>
              </div>
            </div>

            {/* Per-App Options */}
            <div
              style={{
                padding: tokens.spacing.md,
                background: tokens.colors.surface,
                'border-radius': tokens.radius.md,
                opacity: syncAllApps() ? 0.5 : 1,
                'pointer-events': syncAllApps() ? 'none' : 'auto',
                transition: 'opacity 0.2s ease',
              }}
            >
              <div
                style={{
                  'font-size': '13px',
                  'font-weight': '600',
                  color: tokens.colors.textMuted,
                  'margin-bottom': tokens.spacing.md,
                }}
              >
                Or choose individual apps:
              </div>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: tokens.spacing.sm }}>
                <For each={availableApps}>
                  {(app) => (
                    <div
                      onClick={() => toggleSyncApp(app.id)}
                      style={{
                        padding: tokens.spacing.md,
                        background: selectedSyncApps().includes(app.id)
                          ? tokens.colors.surfaceHover
                          : 'transparent',
                        border: `1px solid ${selectedSyncApps().includes(app.id) ? app.color : tokens.colors.border}`,
                        'border-radius': tokens.radius.md,
                        cursor: 'pointer',
                        display: 'flex',
                        'align-items': 'center',
                        gap: tokens.spacing.md,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          'border-radius': '4px',
                          border: `2px solid ${selectedSyncApps().includes(app.id) ? app.color : tokens.colors.border}`,
                          background: selectedSyncApps().includes(app.id)
                            ? app.color
                            : 'transparent',
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                          'flex-shrink': 0,
                        }}
                      >
                        <Show when={selectedSyncApps().includes(app.id)}>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            stroke-width="3"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </Show>
                      </div>

                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          'border-radius': tokens.radius.sm,
                          background: app.color,
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                          'flex-shrink': 0,
                        }}
                      >
                        <Show
                          when={app.logo}
                          fallback={
                            <span
                              style={{ color: 'white', 'font-weight': '700', 'font-size': '14px' }}
                            >
                              {app.name[0]}
                            </span>
                          }
                        >
                          <img
                            src={app.logo}
                            alt={app.name}
                            style={{ width: '24px', height: '24px' }}
                          />
                        </Show>
                      </div>

                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          'align-items': 'center',
                          gap: tokens.spacing.sm,
                        }}
                      >
                        <span
                          style={{
                            'font-size': '15px',
                            'font-weight': '600',
                            color: tokens.colors.text,
                          }}
                        >
                          {app.name}
                        </span>
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: 'inline-flex' }}
                        >
                          <InfoIcon
                            content={tooltipContent[`${app.id}Sync` as keyof typeof tooltipContent]}
                            tooltipKey={`${app.id}Sync`}
                            activeTooltip={activeTooltip}
                            setActiveTooltip={setActiveTooltip}
                            position="right"
                          />
                        </div>
                      </div>

                      <div style={{ 'text-align': 'right' }}>
                        <div
                          style={{
                            'font-size': '15px',
                            'font-weight': '600',
                            color: tokens.colors.text,
                          }}
                        >
                          {syncAnnual() ? '$20/year' : '$2/mo'}
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </section>

          {/* Section: App Extras - MODULAR COMPONENT WITH APP-SPECIFIC TOOLTIPS */}
          <ExtrasSection
            selectedExtras={selectedExtras}
            toggleExtra={toggleExtra}
            tempoAnnual={tempoAnnual}
            setTempoAnnual={setTempoAnnual}
            tenureAnnual={tenureAnnual}
            setTenureAnnual={setTenureAnnual}
            activeTooltip={activeTooltip}
            setActiveTooltip={setActiveTooltip}
          />

          {/* Section: Loco TACo Club */}
          <section>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: tokens.spacing.sm,
                'margin-bottom': tokens.spacing.lg,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  'font-size': '24px',
                  'font-weight': '600',
                  color: tokens.colors.text,
                }}
              >
                🌮 Loco TACo Club
              </h2>
              <InfoIcon
                content={tooltipContent.tacoClub}
                tooltipKey="tacoClub"
                activeTooltip={activeTooltip}
                setActiveTooltip={setActiveTooltip}
              />
            </div>

            <div
              style={{
                display: 'grid',
                'grid-template-columns': '1fr 1fr',
                gap: tokens.spacing.md,
              }}
            >
              {/* Monthly Option */}
              <div
                onClick={() => setTacoClubTier(tacoClubTier() === 'monthly' ? 'none' : 'monthly')}
                style={{
                  padding: tokens.spacing.lg,
                  background:
                    tacoClubTier() === 'monthly'
                      ? 'rgba(255, 107, 107, 0.1)'
                      : tokens.colors.surface,
                  border: `2px solid ${tacoClubTier() === 'monthly' ? tokens.colors.accent.coral : tokens.colors.border}`,
                  'border-radius': tokens.radius.lg,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  'text-align': 'center',
                  position: 'relative',
                }}
              >
                <Show when={tacoClubTier() === 'monthly'}>
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      'font-size': '10px',
                      color: tokens.colors.textDim,
                    }}
                  >
                    click to remove
                  </div>
                </Show>

                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    'border-radius': '50%',
                    border: `2px solid ${tacoClubTier() === 'monthly' ? tokens.colors.accent.coral : tokens.colors.border}`,
                    background:
                      tacoClubTier() === 'monthly' ? tokens.colors.accent.coral : 'transparent',
                    margin: '0 auto 12px',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                  }}
                >
                  <Show when={tacoClubTier() === 'monthly'}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      stroke-width="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </Show>
                </div>

                <div
                  style={{ 'font-size': '28px', 'font-weight': '700', color: tokens.colors.text }}
                >
                  $25
                </div>
                <div style={{ 'font-size': '14px', color: tokens.colors.textMuted }}>/month</div>
                <div
                  style={{ 'font-size': '12px', color: tokens.colors.textDim, 'margin-top': '8px' }}
                >
                  × 24 months to lifetime
                </div>
              </div>

              {/* Lifetime Option */}
              <div
                onClick={() => setTacoClubTier(tacoClubTier() === 'lifetime' ? 'none' : 'lifetime')}
                style={{
                  padding: tokens.spacing.lg,
                  background:
                    tacoClubTier() === 'lifetime'
                      ? 'rgba(78, 205, 196, 0.1)'
                      : tokens.colors.surface,
                  border: `2px solid ${tacoClubTier() === 'lifetime' ? tokens.colors.accent.teal : tokens.colors.border}`,
                  'border-radius': tokens.radius.lg,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  'text-align': 'center',
                  position: 'relative',
                }}
              >
                <Show when={tacoClubTier() === 'lifetime'}>
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      'font-size': '10px',
                      color: tokens.colors.textDim,
                    }}
                  >
                    click to remove
                  </div>
                </Show>

                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    'border-radius': '50%',
                    border: `2px solid ${tacoClubTier() === 'lifetime' ? tokens.colors.accent.teal : tokens.colors.border}`,
                    background:
                      tacoClubTier() === 'lifetime' ? tokens.colors.accent.teal : 'transparent',
                    margin: '0 auto 12px',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                  }}
                >
                  <Show when={tacoClubTier() === 'lifetime'}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      stroke-width="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </Show>
                </div>

                <div
                  style={{ 'font-size': '28px', 'font-weight': '700', color: tokens.colors.text }}
                >
                  $500
                </div>
                <div style={{ 'font-size': '14px', color: tokens.colors.textMuted }}>one-time</div>
                <div
                  style={{
                    'font-size': '12px',
                    color: tokens.colors.success,
                    'margin-top': '8px',
                    'font-weight': '600',
                  }}
                >
                  Instant lifetime access
                </div>
              </div>
            </div>

            {/* Benefits */}
            <Show when={tacoClubTier() !== 'none'}>
              <div
                style={{
                  'margin-top': tokens.spacing.md,
                  padding: tokens.spacing.lg,
                  background: `linear-gradient(135deg, rgba(255, 107, 107, 0.05), rgba(78, 205, 196, 0.05))`,
                  'border-radius': tokens.radius.md,
                  border: `1px solid ${tokens.colors.border}`,
                }}
              >
                <div
                  style={{
                    'font-size': '13px',
                    'font-weight': '600',
                    color: tokens.colors.text,
                    'margin-bottom': tokens.spacing.sm,
                  }}
                >
                  Your TACo Club benefits:
                </div>
                <div
                  style={{
                    display: 'grid',
                    'grid-template-columns': '1fr 1fr',
                    gap: tokens.spacing.sm,
                  }}
                >
                  <For
                    each={[
                      '75% off ALL Extras',
                      'Free Sync for all apps',
                      'Premium Discord access',
                      'Priority support',
                      'Roadmap voting rights',
                      'Founding member shirt',
                    ]}
                  >
                    {(benefit) => (
                      <div
                        style={{
                          'font-size': '12px',
                          color: tokens.colors.textMuted,
                          display: 'flex',
                          gap: '6px',
                        }}
                      >
                        <span style={{ color: tokens.colors.success }}>✓</span>
                        <span>{benefit}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </section>
        </div>

        {/* Right: Cart/Summary (Sticky) */}
        <div style={{ position: 'sticky', top: tokens.spacing.lg, height: 'fit-content' }}>
          <div
            style={{
              padding: tokens.spacing.xl,
              background: tokens.colors.surface,
              border: `1px solid ${tokens.colors.border}`,
              'border-radius': tokens.radius.lg,
            }}
          >
            <h3
              style={{
                margin: `0 0 ${tokens.spacing.lg} 0`,
                'font-size': '18px',
                'font-weight': '600',
                'font-family': tokens.fonts.brand,
              }}
            >
              Your Plan
            </h3>

            <div
              style={{
                display: 'flex',
                'flex-direction': 'column',
                gap: tokens.spacing.sm,
                'margin-bottom': tokens.spacing.lg,
              }}
            >
              {/* Sync items */}
              <Show when={syncAllApps() && tacoClubTier() === 'none'}>
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'font-size': '14px',
                  }}
                >
                  <span style={{ color: tokens.colors.textMuted }}>All Apps Sync & Backup</span>
                  <span style={{ color: tokens.colors.text, 'font-weight': '600' }}>$35</span>
                </div>
              </Show>
              <Show when={syncAllApps() && tacoClubTier() !== 'none'}>
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'font-size': '14px',
                  }}
                >
                  <span style={{ color: tokens.colors.textMuted }}>All Apps Sync & Backup</span>
                  <span style={{ color: tokens.colors.success, 'font-weight': '600' }}>FREE</span>
                </div>
              </Show>
              <Show when={!syncAllApps() && selectedSyncApps().length > 0}>
                <For each={selectedSyncApps()}>
                  {(appId) => {
                    const app = availableApps.find((a) => a.id === appId);
                    return (
                      <div
                        style={{
                          display: 'flex',
                          'justify-content': 'space-between',
                          'font-size': '14px',
                        }}
                      >
                        <span style={{ color: tokens.colors.textMuted }}>{app?.name} Sync</span>
                        <span
                          style={{
                            color:
                              tacoClubTier() !== 'none'
                                ? tokens.colors.success
                                : tokens.colors.text,
                            'font-weight': '600',
                          }}
                        >
                          {tacoClubTier() !== 'none' ? 'FREE' : '$20'}
                        </span>
                      </div>
                    );
                  }}
                </For>
              </Show>

              {/* Extras items */}
              <Show when={selectedExtras().includes('tempo')}>
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'font-size': '14px',
                  }}
                >
                  <span style={{ color: tokens.colors.textMuted }}>
                    Tempo Extras {tempoAnnual() ? '(annual)' : '(monthly)'}
                  </span>
                  <span style={{ color: tokens.colors.text, 'font-weight': '600' }}>
                    <Show
                      when={tacoClubTier() !== 'none'}
                      fallback={`$${tempoAnnual() ? '120' : '12'}`}
                    >
                      <>
                        <span
                          style={{
                            'text-decoration': 'line-through',
                            color: tokens.colors.textDim,
                          }}
                        >
                          ${tempoAnnual() ? '120' : '12'}
                        </span>{' '}
                        ${tempoAnnual() ? '30' : '3'}
                      </>
                    </Show>
                  </span>
                </div>
              </Show>
              <Show when={selectedExtras().includes('tenure')}>
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'font-size': '14px',
                  }}
                >
                  <span style={{ color: tokens.colors.textMuted }}>
                    Tenure Extras {tenureAnnual() ? '(annual)' : '(monthly)'}
                  </span>
                  <span style={{ color: tokens.colors.text, 'font-weight': '600' }}>
                    <Show
                      when={tacoClubTier() !== 'none'}
                      fallback={`$${tenureAnnual() ? '30' : '60'}`}
                    >
                      <>
                        <span
                          style={{
                            'text-decoration': 'line-through',
                            color: tokens.colors.textDim,
                          }}
                        >
                          ${tenureAnnual() ? '30' : '60'}
                        </span>{' '}
                        ${tenureAnnual() ? '7.50' : '15'}
                      </>
                    </Show>
                  </span>
                </div>
              </Show>

              {/* TACo Club */}
              <Show when={tacoClubTier() === 'monthly'}>
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'font-size': '14px',
                  }}
                >
                  <span style={{ color: tokens.colors.textMuted }}>Loco TACo Club</span>
                  <span style={{ color: tokens.colors.text, 'font-weight': '600' }}>$25</span>
                </div>
              </Show>
              <Show when={tacoClubTier() === 'lifetime'}>
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'font-size': '14px',
                  }}
                >
                  <span style={{ color: tokens.colors.textMuted }}>Loco TACo Club (lifetime)</span>
                  <span style={{ color: tokens.colors.text, 'font-weight': '600' }}>$500</span>
                </div>
              </Show>

              {/* Empty state */}
              <Show when={dueToday() === 0}>
                <div
                  style={{
                    'text-align': 'center',
                    padding: tokens.spacing.xl,
                    color: tokens.colors.textDim,
                    'font-size': '14px',
                  }}
                >
                  Select items to build your plan
                </div>
              </Show>
            </div>

            <Show when={dueToday() > 0}>
              <div
                style={{
                  'border-top': `1px solid ${tokens.colors.border}`,
                  'padding-top': tokens.spacing.md,
                }}
              >
                {/* Savings callout */}
                <Show when={savingsWithClub() > 0}>
                  <div
                    style={{
                      padding: tokens.spacing.sm,
                      background: 'rgba(16, 185, 129, 0.1)',
                      'border-radius': tokens.radius.sm,
                      'margin-bottom': tokens.spacing.md,
                      'text-align': 'center',
                    }}
                  >
                    <span
                      style={{
                        'font-size': '13px',
                        color: tokens.colors.success,
                        'font-weight': '600',
                      }}
                    >
                      Saving ${savingsWithClub()}/year with TACo Club
                    </span>
                  </div>
                </Show>

                {/* Due Today */}
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'align-items': 'baseline',
                    'margin-bottom': tokens.spacing.xs,
                  }}
                >
                  <span style={{ 'font-size': '14px', color: tokens.colors.textMuted }}>
                    Due today
                  </span>
                  <span
                    style={{ 'font-size': '28px', 'font-weight': '700', color: tokens.colors.text }}
                  >
                    ${dueToday()}
                  </span>
                </div>

                {/* Monthly recurring */}
                <Show when={monthlyRecurring() > 0}>
                  <div
                    style={{
                      'font-size': '13px',
                      color: tokens.colors.textMuted,
                      'text-align': 'right',
                      'margin-bottom': tokens.spacing.lg,
                    }}
                  >
                    Then ${monthlyRecurring()}/month
                  </div>
                </Show>
                <Show when={monthlyRecurring() === 0 && tacoClubTier() !== 'lifetime'}>
                  <div
                    style={{
                      'font-size': '13px',
                      color: tokens.colors.textMuted,
                      'text-align': 'right',
                      'margin-bottom': tokens.spacing.lg,
                    }}
                  >
                    Billed annually
                  </div>
                </Show>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut()}
                  style={{
                    width: '100%',
                    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
                    background: isCheckingOut()
                      ? tokens.colors.textMuted
                      : `linear-gradient(135deg, ${tokens.colors.accent.coral}, ${tokens.colors.accent.yellow})`,
                    'border-radius': tokens.radius.md,
                    border: 'none',
                    'font-size': '16px',
                    'font-weight': '600',
                    color: tokens.colors.background,
                    cursor: isCheckingOut() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) =>
                    !isCheckingOut() && (e.currentTarget.style.filter = 'brightness(1.1)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                >
                  {isCheckingOut() ? 'Processing...' : 'Continue to Checkout'}
                </button>
                <Show when={checkoutError()}>
                  <div
                    style={{
                      color: '#ef4444',
                      'font-size': '13px',
                      'margin-top': tokens.spacing.sm,
                      'text-align': 'center',
                    }}
                  >
                    {checkoutError()}
                  </div>
                </Show>
              </div>
            </Show>
          </div>

          {/* Scarcity Counter - Dynamic */}
          <Show when={tacoClubTier() !== 'none'}>
            <div
              style={{
                'margin-top': tokens.spacing.md,
                padding: tokens.spacing.md,
                background: tokens.colors.surface,
                'border-radius': tokens.radius.md,
                border: `1px solid ${tokens.colors.border}`,
              }}
            >
              {/* Progress Bar */}
              <div
                style={{
                  height: '6px',
                  background: tokens.colors.border,
                  'border-radius': '3px',
                  overflow: 'hidden',
                  'margin-bottom': tokens.spacing.xs,
                }}
              >
                <div
                  style={{
                    width: `${foundingStats()?.percentFilled || 0}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${tokens.colors.accent.coral}, ${tokens.colors.accent.teal})`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              {/* Stats Text */}
              <Show
                when={!foundingStats.loading && foundingStats()}
                fallback={
                  <div
                    style={{
                      'font-size': '12px',
                      color: tokens.colors.textMuted,
                      'text-align': 'center',
                    }}
                  >
                    Loading availability...
                  </div>
                }
              >
                <div
                  style={{
                    'font-size': '12px',
                    color: tokens.colors.textMuted,
                    'text-align': 'center',
                  }}
                >
                  <Show
                    when={!foundingStats()?.error}
                    fallback={
                      <span>
                        <span style={{ 'font-weight': '700', color: tokens.colors.text }}>
                          Limited
                        </span>{' '}
                        founding spots available
                      </span>
                    }
                  >
                    <Show
                      when={(foundingStats()?.remaining ?? 0) > 0}
                      fallback={
                        <span style={{ 'font-weight': '700', color: tokens.colors.accent.coral }}>
                          Founding member spots are full
                        </span>
                      }
                    >
                      <span style={{ 'font-weight': '700', color: tokens.colors.text }}>
                        {foundingStats()?.remaining.toLocaleString()}
                      </span>{' '}
                      of {foundingStats()?.limit.toLocaleString()} founding spots left
                      <Show when={foundingStats()?.showWarning}>
                        <span style={{ color: tokens.colors.accent.coral, 'font-weight': '600' }}>
                          {' '}
                          - Hurry!
                        </span>
                      </Show>
                    </Show>
                  </Show>
                </div>
              </Show>
            </div>
          </Show>
        </div>
      </div>

      {/* FAQ */}
      <section
        style={{
          padding: `${tokens.spacing['3xl']} ${tokens.spacing.lg}`,
          'max-width': '800px',
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            margin: `0 0 ${tokens.spacing.xl} 0`,
            'font-size': '24px',
            'font-weight': '600',
            'text-align': 'center',
            color: tokens.colors.text,
            'font-family': tokens.fonts.brand,
          }}
        >
          Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', 'flex-direction': 'column' }}>
          <For each={faqItems}>
            {(item, index) => (
              <div style={{ 'border-bottom': `1px solid ${tokens.colors.border}` }}>
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex() === index() ? null : index())}
                  style={{
                    width: '100%',
                    padding: `${tokens.spacing.md} 0`,
                    background: 'none',
                    border: 'none',
                    'text-align': 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    'justify-content': 'space-between',
                    'align-items': 'center',
                    gap: tokens.spacing.md,
                  }}
                >
                  <span
                    style={{ 'font-size': '15px', 'font-weight': '600', color: tokens.colors.text }}
                  >
                    {item.question}
                  </span>
                  <span
                    style={{
                      'font-size': '18px',
                      color: tokens.colors.textDim,
                      transition: 'transform 0.2s ease',
                      transform: openFaqIndex() === index() ? 'rotate(45deg)' : 'rotate(0deg)',
                    }}
                  >
                    +
                  </span>
                </button>
                <Show when={openFaqIndex() === index()}>
                  <div
                    style={{
                      padding: `0 0 ${tokens.spacing.md} 0`,
                      'font-size': '14px',
                      color: tokens.colors.textMuted,
                      'line-height': '1.6',
                    }}
                  >
                    {item.answer}
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </section>

      {/* Footer */}
      <Footer apps={allApps} navTokens={{ typography: { brandFamily: tokens.fonts.brand } }} />
    </div>
  );
};
