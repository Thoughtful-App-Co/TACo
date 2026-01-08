/**
 * TrialBanner - Shows free AI generation trial status
 *
 * Displays trial count for non-premium users.
 * Used in prompt generator UI.
 *
 * Memphis x Retro-Futurism Design
 */

import { Component, Show, createMemo } from 'solid-js';
import { AIUsageService } from './lib/ai-usage.service';
import { echoprax, memphisColors, typography } from '../../theme/echoprax';

interface TrialBannerProps {
  /** Whether user has premium subscription */
  isPremium: boolean;
}

export const TrialBanner: Component<TrialBannerProps> = (props) => {
  const usage = createMemo(() => AIUsageService.getUsageSummary());

  // Don't show for premium users
  if (props.isPremium) {
    return null;
  }

  const hasTrialRemaining = () => usage().remaining > 0;

  return (
    <div
      style={{
        padding: echoprax.spacing.md,
        'border-radius': echoprax.radii.md,
        background: hasTrialRemaining()
          ? `${memphisColors.mintGreen}15`
          : `${memphisColors.coral}15`,
        border: hasTrialRemaining()
          ? `1px solid ${memphisColors.mintGreen}40`
          : `1px solid ${memphisColors.coral}40`,
        'margin-bottom': echoprax.spacing.lg,
      }}
    >
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: echoprax.spacing.sm,
        }}
      >
        <span style={{ 'font-size': '1.25rem' }}>{hasTrialRemaining() ? '✨' : '🔒'}</span>
        <div style={{ flex: 1 }}>
          <Show
            when={hasTrialRemaining()}
            fallback={
              <>
                <div
                  style={{
                    ...typography.bodySm,
                    color: memphisColors.coral,
                    'font-weight': '600',
                  }}
                >
                  Free trials used ({usage().used}/{usage().limit})
                </div>
                <div
                  style={{
                    ...typography.caption,
                    color: echoprax.colors.textMuted,
                    'margin-top': '2px',
                  }}
                >
                  Upgrade for unlimited AI generation
                </div>
              </>
            }
          >
            <div
              style={{
                ...typography.bodySm,
                color: memphisColors.mintGreen,
                'font-weight': '600',
              }}
            >
              {usage().remaining} free {usage().remaining === 1 ? 'generation' : 'generations'}{' '}
              remaining
            </div>
            <div
              style={{
                ...typography.caption,
                color: echoprax.colors.textMuted,
                'margin-top': '2px',
              }}
            >
              Try AI workout generation for free
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};
