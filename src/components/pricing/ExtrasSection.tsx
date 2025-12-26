/**
 * App Extras Section
 * Individual app extras with app-specific tooltips
 */

import { Component, Show } from 'solid-js';
import { InfoIcon } from './Tooltip';
import { WhyCard } from './WhyCard';
import { tokens } from './tokens';
import { tooltipContent } from './data';

interface ExtrasSectionProps {
  selectedExtras: () => string[];
  toggleExtra: (appId: string) => void;
  tempoAnnual: () => boolean;
  setTempoAnnual: (val: boolean) => void;
  activeTooltip: () => string | null;
  setActiveTooltip: (val: string | null) => void;
}

export const ExtrasSection: Component<ExtrasSectionProps> = (props) => {
  return (
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
          App Extras
        </h2>
        <InfoIcon
          content={tooltipContent.extras}
          activeTooltip={props.activeTooltip}
          setActiveTooltip={props.setActiveTooltip}
          tooltipKey="extras"
        />
      </div>

      {/* Why extras cost money */}
      <WhyCard text="Developer time to build and maintain features, plus inference costs for AI processing. You can BYOK (free) or pay us to manage it for you." />

      <div style={{ display: 'flex', 'flex-direction': 'column', gap: tokens.spacing.md }}>
        {/* Tempo Extras - WITH APP-SPECIFIC TOOLTIP */}
        <div
          style={{
            padding: tokens.spacing.lg,
            background: props.selectedExtras().includes('tempo')
              ? tokens.colors.surfaceHover
              : tokens.colors.surface,
            border: `2px solid ${props.selectedExtras().includes('tempo') ? '#5E6AD2' : tokens.colors.border}`,
            'border-radius': tokens.radius.lg,
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', 'align-items': 'center', gap: tokens.spacing.md }}>
            <div
              onClick={() => props.toggleExtra('tempo')}
              style={{
                width: '24px',
                height: '24px',
                'border-radius': '6px',
                border: `2px solid ${props.selectedExtras().includes('tempo') ? '#5E6AD2' : tokens.colors.border}`,
                background: props.selectedExtras().includes('tempo') ? '#5E6AD2' : 'transparent',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                'flex-shrink': 0,
                cursor: 'pointer',
              }}
            >
              <Show when={props.selectedExtras().includes('tempo')}>
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

            <div
              onClick={() => props.toggleExtra('tempo')}
              style={{
                width: '48px',
                height: '48px',
                'border-radius': tokens.radius.md,
                background: '#5E6AD2',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                cursor: 'pointer',
              }}
            >
              <img
                src="/tempo/tempo_logo.png"
                alt="Tempo"
                style={{ width: '36px', height: '36px' }}
              />
            </div>

            <div onClick={() => props.toggleExtra('tempo')} style={{ flex: 1, cursor: 'pointer' }}>
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
                Tempo Extras
                {/* APP-SPECIFIC TOOLTIP */}
                <InfoIcon
                  content={tooltipContent.tempoExtras}
                  activeTooltip={props.activeTooltip}
                  setActiveTooltip={props.setActiveTooltip}
                  tooltipKey="tempoExtras"
                />
              </div>
              <div
                style={{
                  'font-size': '13px',
                  color: tokens.colors.textMuted,
                  'margin-top': '4px',
                }}
              >
                Managed AI • Brain dump processing • Task refinement • Analytics
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
                    props.setTempoAnnual(!props.tempoAnnual());
                  }}
                  aria-label="Toggle annual billing"
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
                      background: props.tempoAnnual()
                        ? tokens.colors.success
                        : tokens.colors.textDim,
                      position: 'absolute',
                      left: props.tempoAnnual() ? '21px' : '2px',
                      transition: 'left 0.2s ease, background 0.2s ease',
                    }}
                  />
                </button>
                <span
                  style={{
                    'font-size': '11px',
                    color: props.tempoAnnual() ? tokens.colors.success : tokens.colors.textDim,
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
                {props.tempoAnnual() ? '$120' : '$12'}
                <span
                  style={{
                    'font-size': '14px',
                    'font-weight': '500',
                    color: tokens.colors.textMuted,
                  }}
                >
                  /{props.tempoAnnual() ? 'year' : 'mo'}
                </span>
              </div>
              <Show when={props.tempoAnnual()}>
                <div style={{ 'font-size': '11px', color: tokens.colors.success }}>
                  Save $24/year
                </div>
              </Show>
            </div>
          </div>
        </div>

        {/* Tenure Extras - WITH APP-SPECIFIC TOOLTIP */}
        <div
          onClick={() => props.toggleExtra('tenure')}
          style={{
            padding: tokens.spacing.lg,
            background: props.selectedExtras().includes('tenure')
              ? tokens.colors.surfaceHover
              : tokens.colors.surface,
            border: `2px solid ${props.selectedExtras().includes('tenure') ? '#9333EA' : tokens.colors.border}`,
            'border-radius': tokens.radius.lg,
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
              border: `2px solid ${props.selectedExtras().includes('tenure') ? '#9333EA' : tokens.colors.border}`,
              background: props.selectedExtras().includes('tenure') ? '#9333EA' : 'transparent',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'flex-shrink': 0,
            }}
          >
            <Show when={props.selectedExtras().includes('tenure')}>
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

          <div
            style={{
              width: '48px',
              height: '48px',
              'border-radius': tokens.radius.md,
              background: '#9333EA',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
            }}
          >
            <img
              src="/tenure/tenure_logo.png"
              alt="Tenure"
              style={{ width: '36px', height: '36px' }}
            />
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
              Tenure Extras
              {/* APP-SPECIFIC TOOLTIP */}
              <div onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex' }}>
                <InfoIcon
                  content={tooltipContent.tenureExtras}
                  activeTooltip={props.activeTooltip}
                  setActiveTooltip={props.setActiveTooltip}
                  tooltipKey="tenureExtras"
                />
              </div>
            </div>
            <div
              style={{
                'font-size': '13px',
                color: tokens.colors.textMuted,
                'margin-top': '4px',
              }}
            >
              "For the cost of a small lunch" • 5 resume mutations • AI job matching
            </div>
          </div>

          <div style={{ 'text-align': 'right' }}>
            <div style={{ 'font-size': '20px', 'font-weight': '700', color: tokens.colors.text }}>
              $12
              <span
                style={{
                  'font-size': '14px',
                  'font-weight': '500',
                  color: tokens.colors.textMuted,
                }}
              >
                /year
              </span>
            </div>
            <div style={{ 'font-size': '11px', color: tokens.colors.textDim }}>
              +$1/mutation after 5
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
