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

// Modular component imports
import {
  HeroSection,
  ExtrasSection,
  InfoIcon,
  tokens,
  availableApps,
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
    if (selectedExtras().includes('tenure')) total += 12;
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
                          $12
                        </span>{' '}
                        $3
                      </>
                    ) : (
                      '$12'
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

      {/* Footer - Matching Home Page */}
      {/* Footer - Matching Home Page */}
      <footer
        style={{
          padding: '60px 24px 40px',
          background: 'rgba(0,0,0,0.3)',
          'border-top': '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ 'max-width': '1200px', margin: '0 auto' }}>
          {/* Footer Grid */}
          <div
            style={{
              display: 'grid',
              'grid-template-columns': 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '40px',
              'margin-bottom': '48px',
            }}
          >
            {/* Brand Column */}
            <div>
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '12px',
                  'margin-bottom': '16px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)',
                    'border-radius': '10px',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3C7.5 3 4 6 4 9C4 10.5 4.5 12 6 13.5C7.5 15 9.5 16 12 16C14.5 16 16.5 15 18 13.5C19.5 12 20 10.5 20 9C20 6 16.5 3 12 3Z"
                      fill="white"
                      opacity="0.95"
                    />
                    <path
                      d="M6 13C6 13 7 17 12 17C17 17 18 13 18 13"
                      stroke="white"
                      stroke-width="2"
                      stroke-linecap="round"
                      opacity="0.95"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    'font-size': '18px',
                    'font-weight': '400',
                    'font-family': tokens.fonts.brand,
                    color: 'white',
                  }}
                >
                  Thoughtful App Co.
                </span>
              </div>
              <p
                style={{
                  margin: '0 0 20px 0',
                  'font-size': '14px',
                  'line-height': '1.6',
                  color: 'rgba(255,255,255,0.5)',
                  'max-width': '280px',
                }}
              >
                Building technology that enables, not enslaves. An open contribution venture
                studio.
              </p>
              {/* Social Links */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <a
                  href="https://github.com/Thoughtful-App-Co"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  style={{
                    width: '36px',
                    height: '36px',
                    'border-radius': '8px',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    color: 'rgba(255,255,255,0.6)',
                    transition: 'all 0.2s ease',
                    'text-decoration': 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </a>
                <a
                  href="https://bsky.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Bluesky"
                  style={{
                    width: '36px',
                    height: '36px',
                    'border-radius': '8px',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    color: 'rgba(255,255,255,0.6)',
                    transition: 'all 0.2s ease',
                    'text-decoration': 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                </a>
              </div>

              {/* Podcast Plug */}
              <a
                href="https://humansonly.fm"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  'margin-top': '20px',
                  padding: '12px 16px',
                  background:
                    'linear-gradient(135deg, rgba(255,107,107,0.15) 0%, rgba(78,205,196,0.15) 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  'border-radius': '12px',
                  display: 'flex',
                  'align-items': 'center',
                  gap: '12px',
                  'text-decoration': 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, rgba(255,107,107,0.25) 0%, rgba(78,205,196,0.25) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, rgba(255,107,107,0.15) 0%, rgba(78,205,196,0.15) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    'border-radius': '8px',
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'flex-shrink': 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
                  </svg>
                </div>
                <div>
                  <div
                    style={{
                      'font-size': '13px',
                      'font-weight': '600',
                      color: 'white',
                      'line-height': '1.2',
                    }}
                  >
                    Humans Only Podcast
                  </div>
                  <div style={{ 'font-size': '11px', color: 'rgba(255,255,255,0.5)' }}>
                    humansonly.fm
                  </div>
                </div>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  style={{ 'margin-left': 'auto' }}
                >
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </a>
            </div>

            {/* Apps Column */}
            <div>
              <h4
                style={{
                  margin: '0 0 16px 0',
                  'font-size': '12px',
                  'font-weight': '600',
                  'letter-spacing': '1px',
                  'text-transform': 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                Apps
              </h4>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  'list-style': 'none',
                  display: 'flex',
                  'flex-direction': 'column',
                  gap: '10px',
                }}
              >
                <For each={availableApps}>
                  {(app) => (
                    <li>
                      <A
                        href={`/${app.id}`}
                        style={{
                          'font-size': '14px',
                          color: 'rgba(255,255,255,0.6)',
                          'text-decoration': 'none',
                          transition: 'color 0.2s ease',
                          display: 'inline-flex',
                          'align-items': 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            'border-radius': '50%',
                            background: app.color,
                          }}
                        />
                        {app.name}
                        <span style={{ 'font-size': '11px', color: 'rgba(255,255,255,0.3)' }}>
                          — {app.id === 'tempo' ? 'AI task timer' : app.id === 'tenure' ? 'Career companion' : app.id === 'nurture' ? 'Relationship CRM' : ''}
                        </span>
                      </A>
                    </li>
                  )}
                </For>
              </ul>
            </div>

            {/* Philosophy Column */}
            <div>
              <h4
                style={{
                  margin: '0 0 16px 0',
                  'font-size': '12px',
                  'font-weight': '600',
                  'letter-spacing': '1px',
                  'text-transform': 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                Philosophy
              </h4>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  'list-style': 'none',
                  display: 'flex',
                  'flex-direction': 'column',
                  gap: '10px',
                }}
              >
                <li>
                  <span style={{ 'font-size': '14px', color: 'rgba(255,255,255,0.6)' }}>
                    Design for Human Good
                  </span>
                </li>
                <li>
                  <span style={{ 'font-size': '14px', color: 'rgba(255,255,255,0.6)' }}>
                    Local-First Principles
                  </span>
                </li>
                <li>
                  <span style={{ 'font-size': '14px', color: 'rgba(255,255,255,0.6)' }}>
                    Anti-Dark Patterns
                  </span>
                </li>
                <li>
                  <span style={{ 'font-size': '14px', color: 'rgba(255,255,255,0.6)' }}>
                    Open Contribution
                  </span>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4
                style={{
                  margin: '0 0 16px 0',
                  'font-size': '12px',
                  'font-weight': '600',
                  'letter-spacing': '1px',
                  'text-transform': 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                Resources
              </h4>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  'list-style': 'none',
                  display: 'flex',
                  'flex-direction': 'column',
                  gap: '10px',
                }}
              >
                <li>
                  <a
                    href="https://github.com/Thoughtful-App-Co/TACo"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      'font-size': '14px',
                      color: 'rgba(255,255,255,0.6)',
                      'text-decoration': 'none',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  >
                    Source Code
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Thoughtful-App-Co/TACo/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      'font-size': '14px',
                      color: 'rgba(255,255,255,0.6)',
                      'text-decoration': 'none',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  >
                    Report an Issue
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Thoughtful-App-Co/TACo/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      'font-size': '14px',
                      color: 'rgba(255,255,255,0.6)',
                      'text-decoration': 'none',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  >
                    Discussions
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Thoughtful-App-Co/TACo#contributing"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      'font-size': '14px',
                      color: 'rgba(255,255,255,0.6)',
                      'text-decoration': 'none',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  >
                    Contribute
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              'padding-top': '24px',
              'border-top': '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'center',
              'flex-wrap': 'wrap',
              gap: '16px',
            }}
          >
            <p style={{ margin: 0, 'font-size': '13px', color: 'rgba(255,255,255,0.3)' }}>
              © 2025 Thoughtful App Co. Technology for Human Good.
            </p>
            <div style={{ display: 'flex', gap: '24px' }}>
              <A
                href="/"
                style={{
                  'font-size': '13px',
                  color: 'rgba(255,255,255,0.3)',
                  'text-decoration': 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                Home
              </A>
              <A
                href="/pricing"
                style={{
                  'font-size': '13px',
                  color: 'rgba(255,255,255,0.3)',
                  'text-decoration': 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                Pricing
              </A>
              <a
                href="#"
                style={{
                  'font-size': '13px',
                  color: 'rgba(255,255,255,0.3)',
                  'text-decoration': 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                Privacy
              </a>
              <a
                href="#"
                style={{
                  'font-size': '13px',
                  color: 'rgba(255,255,255,0.3)',
                  'text-decoration': 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
