import { JSX, Show, splitProps, mergeProps } from 'solid-js';
import { CaretUp, CaretDown } from 'phosphor-solid';
import { tempoDesign } from '../theme/tempo-design';

export interface NeoNumberInputProps {
  /** Current value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Width of the input */
  width?: string;
  /** Suffix text (e.g., "min") */
  suffix?: string;
  /** Accessible label */
  'aria-label'?: string;
  /** Additional container styles */
  style?: JSX.CSSProperties;
}

// Neomorphic constants
const NEO = {
  inset: 'inset 1px 1px 3px rgba(0, 0, 0, 0.4), inset -1px -1px 2px rgba(255, 255, 255, 0.03)',
  softWhite: 'rgba(250, 250, 250, 0.9)',
  muted: 'rgba(160, 160, 176, 0.5)',
};

/**
 * NeoNumberInput - Dark-mode neomorphic number input with custom spinners
 *
 * Replaces native number input spinners (which are bright white)
 * with dark-mode styled increment/decrement buttons
 */
export function NeoNumberInput(props: NeoNumberInputProps) {
  const merged = mergeProps(
    {
      min: 1,
      max: 999,
      step: 1,
      disabled: false,
      width: '80px',
    },
    props
  );
  const [local, _rest] = splitProps(merged, [
    'value',
    'onChange',
    'min',
    'max',
    'step',
    'disabled',
    'width',
    'suffix',
    'aria-label',
    'style',
  ]);

  const increment = () => {
    if (!local.disabled && local.value < local.max) {
      local.onChange(Math.min(local.value + local.step, local.max));
    }
  };

  const decrement = () => {
    if (!local.disabled && local.value > local.min) {
      local.onChange(Math.max(local.value - local.step, local.min));
    }
  };

  const handleInput = (e: { currentTarget: { value: string } }) => {
    const val = parseInt(e.currentTarget.value) || local.min;
    local.onChange(Math.max(local.min, Math.min(local.max, val)));
  };

  const containerStyles = (): JSX.CSSProperties => ({
    display: 'inline-flex',
    'align-items': 'center',
    gap: '2px',
    ...local.style,
  });

  const inputWrapperStyles = (): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'center',
    background: `linear-gradient(145deg, ${tempoDesign.colors.secondary}, #1f1f2e)`,
    border: `1px solid rgba(42, 42, 58, 0.8)`,
    'border-radius': tempoDesign.radius.sm,
    'box-shadow': NEO.inset,
    overflow: 'hidden',
  });

  const inputStyles = (): JSX.CSSProperties => ({
    width: local.width,
    padding: '6px 4px',
    border: 'none',
    background: 'transparent',
    color: local.disabled ? NEO.muted : NEO.softWhite,
    'font-size': tempoDesign.typography.sizes.xs,
    'font-family': tempoDesign.typography.fontFamily,
    'text-align': 'center',
    outline: 'none',
    // Hide native spinners
    '-moz-appearance': 'textfield',
  });

  const spinnerContainerStyles = (): JSX.CSSProperties => ({
    display: 'flex',
    'flex-direction': 'column',
    'border-left': '1px solid rgba(42, 42, 58, 0.6)',
  });

  const spinnerButtonStyles = (isDisabled: boolean): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    width: '20px',
    height: '14px',
    border: 'none',
    background: 'transparent',
    color: isDisabled ? NEO.muted : NEO.softWhite,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: `all ${tempoDesign.transitions.fast}`,
    opacity: isDisabled ? 0.4 : 1,
  });

  const isAtMin = () => local.value <= local.min;
  const isAtMax = () => local.value >= local.max;

  return (
    <div style={containerStyles()}>
      <div style={inputWrapperStyles()}>
        <input
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          value={local.value}
          onInput={handleInput}
          disabled={local.disabled}
          aria-label={local['aria-label']}
          style={inputStyles()}
        />
        <div style={spinnerContainerStyles()}>
          <button
            type="button"
            onClick={increment}
            disabled={local.disabled || isAtMax()}
            aria-label="Increase"
            style={spinnerButtonStyles(local.disabled || isAtMax())}
            onMouseEnter={(e) => {
              if (!local.disabled && !isAtMax()) {
                e.currentTarget.style.background = 'rgba(250, 250, 250, 0.08)';
                e.currentTarget.style.textShadow = '0 0 8px rgba(250, 250, 250, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.textShadow = 'none';
            }}
          >
            <CaretUp size={10} weight="bold" />
          </button>
          <div
            style={{
              width: '60%',
              height: '1px',
              margin: '0 auto',
              background: 'rgba(42, 42, 58, 0.6)',
            }}
          />
          <button
            type="button"
            onClick={decrement}
            disabled={local.disabled || isAtMin()}
            aria-label="Decrease"
            style={spinnerButtonStyles(local.disabled || isAtMin())}
            onMouseEnter={(e) => {
              if (!local.disabled && !isAtMin()) {
                e.currentTarget.style.background = 'rgba(250, 250, 250, 0.08)';
                e.currentTarget.style.textShadow = '0 0 8px rgba(250, 250, 250, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.textShadow = 'none';
            }}
          >
            <CaretDown size={10} weight="bold" />
          </button>
        </div>
      </div>
      <Show when={local.suffix}>
        <span
          style={{
            'font-size': tempoDesign.typography.sizes.xs,
            color: tempoDesign.colors.mutedForeground,
            'margin-left': '4px',
          }}
        >
          {local.suffix}
        </span>
      </Show>
    </div>
  );
}
