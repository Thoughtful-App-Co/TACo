import { JSX, splitProps, mergeProps } from 'solid-js';
import { CaretUp, CaretDown } from 'phosphor-solid';
import { tempoDesign } from '../theme/tempo-design';

export interface ReorderButtonsProps {
  /** Callback when up button is clicked */
  onMoveUp: () => void;
  /** Callback when down button is clicked */
  onMoveDown: () => void;
  /** Whether the item is at the top of the list (disables up) */
  isFirst?: boolean;
  /** Whether the item is at the bottom of the list (disables down) */
  isLast?: boolean;
  /** Whether the entire control is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Accessible label prefix (e.g., "focus block", "timebox") */
  itemLabel?: string;
  /** Additional container styles */
  style?: JSX.CSSProperties;
}

// Neomorphic shadow constants
const NEO = {
  // Inset shadow for beveled/pressed appearance
  inset: 'inset 2px 2px 4px rgba(0, 0, 0, 0.4), inset -1px -1px 2px rgba(255, 255, 255, 0.03)',
  // Hover glow
  glow: '0 0 6px rgba(250, 250, 250, 0.15)',
  // Active press
  press: 'inset 3px 3px 6px rgba(0, 0, 0, 0.5), inset -1px -1px 2px rgba(255, 255, 255, 0.02)',
  // Soft white (not pure #FFFFFF)
  softWhite: 'rgba(250, 250, 250, 0.9)',
  // Muted for disabled
  muted: 'rgba(160, 160, 176, 0.5)',
};

/**
 * ReorderButtons - Neomorphic vertical stepper for list reordering
 *
 * Design principles:
 * - Vertical layout (intuitive up/down mental model)
 * - Beveled neomorphic container with inset shadows
 * - Soft white chevron icons with subtle glow on hover
 * - Dark-mode optimized with depth perception
 */
export function ReorderButtons(props: ReorderButtonsProps) {
  const merged = mergeProps(
    {
      isFirst: false,
      isLast: false,
      disabled: false,
      size: 'md' as const,
      itemLabel: 'item',
    },
    props
  );
  const [local, _rest] = splitProps(merged, [
    'onMoveUp',
    'onMoveDown',
    'isFirst',
    'isLast',
    'disabled',
    'size',
    'itemLabel',
    'style',
  ]);

  const isUpDisabled = () => local.disabled || local.isFirst;
  const isDownDisabled = () => local.disabled || local.isLast;

  const sizeConfig = () => {
    if (local.size === 'sm') {
      return {
        containerWidth: '26px',
        buttonHeight: '20px',
        iconSize: 12,
        borderRadius: tempoDesign.radius.sm,
      };
    }
    return {
      containerWidth: '30px',
      buttonHeight: '22px',
      iconSize: 14,
      borderRadius: tempoDesign.radius.md,
    };
  };

  const containerStyles = (): JSX.CSSProperties => ({
    display: 'flex',
    'flex-direction': 'column',
    'align-items': 'center',
    width: sizeConfig().containerWidth,
    background: `linear-gradient(145deg, ${tempoDesign.colors.secondary}, #1f1f2e)`,
    border: `1px solid rgba(42, 42, 58, 0.8)`,
    'border-radius': sizeConfig().borderRadius,
    'box-shadow': NEO.inset,
    overflow: 'hidden',
    'flex-shrink': '0',
    ...local.style,
  });

  const buttonStyles = (isDisabled: boolean): JSX.CSSProperties => ({
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    width: '100%',
    height: sizeConfig().buttonHeight,
    padding: '0',
    border: 'none',
    background: 'transparent',
    color: isDisabled ? NEO.muted : NEO.softWhite,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: `all ${tempoDesign.transitions.fast}`,
    opacity: isDisabled ? 0.4 : 1,
    'text-shadow': isDisabled ? 'none' : '0 0 8px rgba(250, 250, 250, 0.1)',
  });

  return (
    <div style={containerStyles()} role="group" aria-label={`Reorder ${local.itemLabel}`}>
      <button
        type="button"
        onClick={() => !isUpDisabled() && local.onMoveUp()}
        disabled={isUpDisabled()}
        aria-label={`Move ${local.itemLabel} up`}
        style={buttonStyles(isUpDisabled())}
        onMouseEnter={(e) => {
          if (!isUpDisabled()) {
            e.currentTarget.style.background = 'rgba(250, 250, 250, 0.05)';
            e.currentTarget.style.textShadow = '0 0 12px rgba(250, 250, 250, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.textShadow = '0 0 8px rgba(250, 250, 250, 0.1)';
        }}
        onMouseDown={(e) => {
          if (!isUpDisabled()) {
            e.currentTarget.style.background = 'rgba(250, 250, 250, 0.08)';
          }
        }}
        onMouseUp={(e) => {
          if (!isUpDisabled()) {
            e.currentTarget.style.background = 'rgba(250, 250, 250, 0.05)';
          }
        }}
      >
        <CaretUp size={sizeConfig().iconSize} weight="bold" />
      </button>

      <div
        style={{
          width: '50%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(250, 250, 250, 0.1), transparent)',
        }}
      />

      <button
        type="button"
        onClick={() => !isDownDisabled() && local.onMoveDown()}
        disabled={isDownDisabled()}
        aria-label={`Move ${local.itemLabel} down`}
        style={buttonStyles(isDownDisabled())}
        onMouseEnter={(e) => {
          if (!isDownDisabled()) {
            e.currentTarget.style.background = 'rgba(250, 250, 250, 0.05)';
            e.currentTarget.style.textShadow = '0 0 12px rgba(250, 250, 250, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.textShadow = '0 0 8px rgba(250, 250, 250, 0.1)';
        }}
        onMouseDown={(e) => {
          if (!isDownDisabled()) {
            e.currentTarget.style.background = 'rgba(250, 250, 250, 0.08)';
          }
        }}
        onMouseUp={(e) => {
          if (!isDownDisabled()) {
            e.currentTarget.style.background = 'rgba(250, 250, 250, 0.05)';
          }
        }}
      >
        <CaretDown size={sizeConfig().iconSize} weight="bold" />
      </button>
    </div>
  );
}
