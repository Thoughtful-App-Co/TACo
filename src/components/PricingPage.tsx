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

import { Component, createSignal, For, Show, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import { Footer } from './common/Footer';

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
// MAIN COMPONENT
// =============================================================================

export const PricingPage: Component = () => {
  // Cart state
  const [selectedSyncApps, setSelectedSyncApps] = createSignal<string[]>([]);
  const [syncAllApps, setSyncAllApps] = createSignal(false);
  const [syncAnnual, setSyncAnnual] = createSignal(false); // Monthly vs Annual for sync
  const [selectedExtras, setSelectedExtras] = createSignal<string[]>([]);
  const [tempoAnnual, setTempoAnnual] = createSignal(false);
  const [tacoClubTier, setTacoClubTier] = createSignal<TacoClubTier>('none');

  // Tooltip state
  const [activeTooltip, setActiveTooltip] = createSignal<string | null>(null);

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = createSignal<number | null>(null);

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
      total += tempoAnnual() ? 120 : 144;
    }
    if (selectedExtras().includes('tenure')) total += 30;
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
                    {tacoClubTier() !== 'none' ? (
                      <>
                        <span
                          style={{
                            'text-decoration': 'line-through',
                            color: tokens.colors.textDim,
                          }}
                        >
                          ${tempoAnnual() ? '120' : '144'}
                        </span>{' '}
                        ${tempoAnnual() ? '30' : '36'}
                      </>
                    ) : (
                      `$${tempoAnnual() ? '120' : '144'}`
                    )}
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
                  <span style={{ color: tokens.colors.textMuted }}>Tenure Extras</span>
                  <span style={{ color: tokens.colors.text, 'font-weight': '600' }}>
                    {tacoClubTier() !== 'none' ? (
                      <>
                        <span
                          style={{
                            'text-decoration': 'line-through',
                            color: tokens.colors.textDim,
                          }}
                        >
                          $30
                        </span>{' '}
                        $7.50
                      </>
                    ) : (
                      '$30'
                    )}
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
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                >
                  Continue to Checkout
                </button>
              </div>
            </Show>
          </div>

          {/* Scarcity Counter */}
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
                    width: '82.47%',
                    height: '100%',
                    background: `linear-gradient(90deg, ${tokens.colors.accent.coral}, ${tokens.colors.accent.teal})`,
                  }}
                />
              </div>
              <div
                style={{
                  'font-size': '12px',
                  color: tokens.colors.textMuted,
                  'text-align': 'center',
                }}
              >
                <span style={{ 'font-weight': '700', color: tokens.colors.text }}>8,247</span> of
                10,000 founding spots left
              </div>
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
