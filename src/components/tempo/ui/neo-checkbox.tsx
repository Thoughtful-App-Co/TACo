import { JSX, Show, splitProps, mergeProps } from 'solid-js';
import { tempoDesign } from '../theme/tempo-design';

export interface NeoCheckboxProps {
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Callback when checkbox state changes */
  onChange: (checked: boolean) => void;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant for checked state */
  variant?: 'primary' | 'frog' | 'destructive';
  /** Accessible label */
  'aria-label'?: string;
  /** Additional container styles */
  style?: JSX.CSSProperties;
}

/**
 * Custom thick checkmark SVG component
 * Using a thicker stroke for better visibility
 */
function ThickCheck(props: { size: number; color: string }) {
  return (
    <svg
      width={props.size}
      height={props.size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 8.5L6.5 12L13 4"
        stroke={props.color}
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

/**
 * NeoCheckbox - Dark-mode neomorphic checkbox
 *
 * Design principles:
 * - Inset shadows for pressed/depth effect
 * - Soft glow on checked state
 * - Thick white checkmark for visibility
 * - Beveled container appearance
 */
export function NeoCheckbox(props: NeoCheckboxProps) {
  const merged = mergeProps(
    {
      disabled: false,
      size: 'md' as const,
      variant: 'primary' as const,
    },
    props
  );
  const [local, _rest] = splitProps(merged, [
    'checked',
    'onChange',
    'disabled',
    'size',
    'variant',
    'aria-label',
    'style',
  ]);

  const sizeConfig = () => {
    switch (local.size) {
      case 'sm':
        return { box: '16px', icon: 10, radius: '4px' };
      case 'lg':
        return { box: '24px', icon: 16, radius: '6px' };
      default:
        return { box: '20px', icon: 12, radius: '5px' };
    }
  };

  const variantColors = () => {
    switch (local.variant) {
      case 'frog':
        return {
          accent: tempoDesign.colors.frog,
          glow: 'rgba(16, 185, 129, 0.4)',
          glowStrong: 'rgba(16, 185, 129, 0.6)',
        };
      case 'destructive':
        return {
          accent: tempoDesign.colors.destructive,
          glow: 'rgba(220, 38, 38, 0.4)',
          glowStrong: 'rgba(220, 38, 38, 0.6)',
        };
      default:
        return {
          accent: tempoDesign.colors.primary,
          glow: 'rgba(94, 106, 210, 0.4)',
          glowStrong: 'rgba(94, 106, 210, 0.6)',
        };
    }
  };

  // Neomorphic inset shadow for unchecked (pressed in)
  const uncheckedShadow =
    'inset 2px 2px 4px rgba(0, 0, 0, 0.4), inset -1px -1px 2px rgba(255, 255, 255, 0.05)';

  // Raised glow for checked state
  const checkedShadow = () =>
    `0 0 8px ${variantColors().glow}, 0 0 2px ${variantColors().glowStrong}`;

  const containerStyles = (): JSX.CSSProperties => ({
    width: sizeConfig().box,
    height: sizeConfig().box,
    'border-radius': sizeConfig().radius,
    border: `1px solid ${local.checked ? variantColors().accent : tempoDesign.colors.border}`,
    background: local.checked ? variantColors().accent : tempoDesign.colors.secondary,
    'box-shadow': local.checked ? checkedShadow() : uncheckedShadow,
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    cursor: local.disabled ? 'not-allowed' : 'pointer',
    transition: `all ${tempoDesign.transitions.fast}`,
    opacity: local.disabled ? 0.5 : 1,
    'flex-shrink': '0',
    ...local.style,
  });

  // Pure white for maximum contrast against colored background
  const checkColor = '#FFFFFF';

  const handleClick = (e: { stopPropagation: () => void }) => {
    // Stop propagation to prevent parent handlers from double-toggling
    e.stopPropagation();
    if (!local.disabled) {
      local.onChange(!local.checked);
    }
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={local.checked}
      aria-label={local['aria-label']}
      disabled={local.disabled}
      onClick={handleClick}
      style={containerStyles()}
      onMouseEnter={(e) => {
        if (!local.disabled && !local.checked) {
          e.currentTarget.style.borderColor = variantColors().accent;
          e.currentTarget.style.boxShadow = `${uncheckedShadow}, 0 0 4px ${variantColors().glow}`;
        }
      }}
      onMouseLeave={(e) => {
        if (!local.disabled) {
          e.currentTarget.style.borderColor = local.checked
            ? variantColors().accent
            : tempoDesign.colors.border;
          e.currentTarget.style.boxShadow = local.checked ? checkedShadow() : uncheckedShadow;
        }
      }}
    >
      <Show when={local.checked}>
        <ThickCheck size={sizeConfig().icon} color={checkColor} />
      </Show>
    </button>
  );
}
