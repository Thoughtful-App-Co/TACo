/**
 * PremiumGate - Upgrade prompt for AI workout generation
 *
 * Shows when free user tries to access AI features.
 * Displays trial remaining count or upgrade CTA.
 *
 * Memphis x Retro-Futurism Design
 */

import { Component, Show, createMemo } from 'solid-js';
import { AIUsageService } from './lib/ai-usage.service';
import {
  echoprax,
  memphisColors,
  memphisSurfaces,
  glassButton,
  typography,
} from '../../theme/echoprax';

interface PremiumGateProps {
  /** Whether user has premium subscription */
  isPremium: boolean;
  /** Called when user chooses to use a trial generation */
  onUseTrial: () => void;
  /** Called when user chooses manual construction instead */
  onUseManual: () => void;
  /** Called when user wants to close/cancel */
  onClose: () => void;
}

export const PremiumGate: Component<PremiumGateProps> = (props) => {
  const usage = createMemo(() => AIUsageService.getUsageSummary());

  // If premium, this component shouldn't show, but handle gracefully
  if (props.isPremium) {
    props.onUseTrial();
    return null;
  }

  const hasTrialRemaining = () => usage().remaining > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13, 13, 13, 0.9)',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        'z-index': 1000,
        padding: echoprax.spacing.xl,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div
        style={{
          ...memphisSurfaces.elevated,
          'max-width': '440px',
          width: '100%',
          padding: echoprax.spacing.xl,
          'text-align': 'center',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            'border-radius': '50%',
            background: hasTrialRemaining()
              ? `${memphisColors.electricBlue}20`
              : `${memphisColors.hotPink}20`,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            margin: '0 auto',
            'margin-bottom': echoprax.spacing.lg,
          }}
        >
          <span style={{ 'font-size': '2.5rem' }}>{hasTrialRemaining() ? '✨' : '🔒'}</span>
        </div>

        {/* Title */}
        <h2
          style={{
            ...typography.headingMd,
            color: echoprax.colors.text,
            margin: `0 0 ${echoprax.spacing.sm}`,
          }}
        >
          <Show when={hasTrialRemaining()} fallback="Upgrade to Premium">
            AI Workout Generation
          </Show>
        </h2>

        {/* Description */}
        <Show
          when={hasTrialRemaining()}
          fallback={
            <>
              <p
                style={{
                  ...typography.body,
                  color: echoprax.colors.textMuted,
                  margin: `0 0 ${echoprax.spacing.md}`,
                }}
              >
                You've used all {usage().limit} free AI generations. Upgrade to Echoprax Extras for
                unlimited workout creation.
              </p>
              <p
                style={{
                  ...typography.caption,
                  color: memphisColors.coral,
                  margin: `0 0 ${echoprax.spacing.lg}`,
                }}
              >
                {usage().used} of {usage().limit} free generations used
              </p>
            </>
          }
        >
          <p
            style={{
              ...typography.body,
              color: echoprax.colors.textMuted,
              margin: `0 0 ${echoprax.spacing.md}`,
            }}
          >
            Create workouts instantly with AI. Just describe what you want and we'll build it for
            you.
          </p>
          <p
            style={{
              ...typography.bodySm,
              color: memphisColors.mintGreen,
              background: `${memphisColors.mintGreen}15`,
              padding: `${echoprax.spacing.sm} ${echoprax.spacing.md}`,
              'border-radius': echoprax.radii.md,
              margin: `0 0 ${echoprax.spacing.lg}`,
            }}
          >
            {usage().remaining} free {usage().remaining === 1 ? 'generation' : 'generations'}{' '}
            remaining
          </p>
        </Show>

        {/* Actions */}
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: echoprax.spacing.sm }}>
          <Show
            when={hasTrialRemaining()}
            fallback={
              <>
                <a
                  href="/pricing#echoprax-extras"
                  class="echoprax-glass-btn"
                  style={{
                    ...glassButton.primary,
                    display: 'block',
                    padding: echoprax.spacing.md,
                    'border-radius': echoprax.radii.md,
                    color: memphisColors.hotPink,
                    'text-decoration': 'none',
                    ...typography.body,
                    'font-weight': '600',
                  }}
                >
                  View Pricing
                </a>
                <button
                  type="button"
                  onClick={() => props.onUseManual()}
                  class="echoprax-glass-btn"
                  style={{
                    ...glassButton.default,
                    padding: echoprax.spacing.md,
                    'border-radius': echoprax.radii.md,
                    cursor: 'pointer',
                    color: echoprax.colors.textMuted,
                    ...typography.body,
                  }}
                >
                  Build Manually Instead
                </button>
              </>
            }
          >
            <button
              type="button"
              onClick={() => props.onUseTrial()}
              class="echoprax-glass-btn"
              style={{
                ...glassButton.primary,
                padding: echoprax.spacing.md,
                'border-radius': echoprax.radii.md,
                cursor: 'pointer',
                color: memphisColors.hotPink,
                ...typography.body,
                'font-weight': '600',
              }}
            >
              Use Free Generation ({usage().remaining} left)
            </button>
            <button
              type="button"
              onClick={() => props.onUseManual()}
              class="echoprax-glass-btn"
              style={{
                ...glassButton.default,
                padding: echoprax.spacing.md,
                'border-radius': echoprax.radii.md,
                cursor: 'pointer',
                color: echoprax.colors.textMuted,
                ...typography.body,
              }}
            >
              Build Manually Instead
            </button>
          </Show>

          <button
            type="button"
            onClick={() => props.onClose()}
            style={{
              background: 'none',
              border: 'none',
              color: echoprax.colors.textMuted,
              cursor: 'pointer',
              ...typography.caption,
              'margin-top': echoprax.spacing.sm,
            }}
          >
            Cancel
          </button>
        </div>

        {/* Premium benefits teaser */}
        <Show when={!hasTrialRemaining()}>
          <div
            style={{
              'margin-top': echoprax.spacing.xl,
              'padding-top': echoprax.spacing.lg,
              'border-top': `1px solid ${echoprax.colors.border}`,
              'text-align': 'left',
            }}
          >
            <h4
              style={{
                ...typography.caption,
                color: echoprax.colors.textMuted,
                'text-transform': 'uppercase',
                'letter-spacing': '0.1em',
                margin: `0 0 ${echoprax.spacing.sm}`,
              }}
            >
              Echoprax Extras includes
            </h4>
            <ul
              style={{
                ...typography.bodySm,
                color: echoprax.colors.text,
                margin: 0,
                'padding-left': echoprax.spacing.lg,
                display: 'flex',
                'flex-direction': 'column',
                gap: echoprax.spacing.xs,
              }}
            >
              <li>Unlimited AI workout generation</li>
              <li>Advanced workout scheduling</li>
              <li>Workout history sync</li>
              <li>Priority support</li>
            </ul>
          </div>
        </Show>
      </div>
    </div>
  );
};
