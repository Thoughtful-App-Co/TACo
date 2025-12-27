/**
 * Paper Trail - Button Component
 * Bold, construction paper style buttons with thick borders
 * BAM! energy with hover lift effects
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX, createSignal } from 'solid-js';
import { papertrail, yellowScale, motionTokens } from '../../../theme/papertrail';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps {
  children: JSX.Element;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: JSX.CSSProperties;
  type?: 'button' | 'submit';
  title?: string;
}

// Construction paper style - thick borders, hard shadows
const variantStyles: Record<ButtonVariant, { base: JSX.CSSProperties; hover: JSX.CSSProperties }> =
  {
    primary: {
      base: {
        background: '#000000',
        color: '#FFFFFF',
        border: '3px solid #000000',
        'box-shadow': '3px 3px 0 #000000',
      },
      hover: {
        transform: 'translate(-2px, -2px)',
        'box-shadow': '5px 5px 0 #000000',
      },
    },
    secondary: {
      base: {
        background: '#FFFFFF',
        color: '#000000',
        border: '3px solid #000000',
        'box-shadow': '3px 3px 0 #000000',
      },
      hover: {
        transform: 'translate(-2px, -2px)',
        'box-shadow': '5px 5px 0 #000000',
      },
    },
    outline: {
      base: {
        background: 'transparent',
        color: '#000000',
        border: '2px solid #000000',
      },
      hover: {
        background: '#000000',
        color: '#FFFFFF',
      },
    },
    ghost: {
      base: {
        background: 'transparent',
        color: papertrail.colors.textMuted,
        border: '2px solid transparent',
      },
      hover: {
        background: papertrail.colors.background,
        color: '#000000',
        border: '2px solid #000000',
      },
    },
    accent: {
      base: {
        background: yellowScale[500],
        color: '#000000',
        border: '3px solid #000000',
        'box-shadow': '3px 3px 0 #000000',
      },
      hover: {
        transform: 'translate(-2px, -2px)',
        'box-shadow': '5px 5px 0 #000000',
        background: yellowScale[400],
      },
    },
  };

const sizeStyles: Record<ButtonSize, JSX.CSSProperties> = {
  sm: {
    padding: '8px 16px',
    'font-size': '12px',
  },
  md: {
    padding: '12px 24px',
    'font-size': '14px',
  },
  lg: {
    padding: '16px 32px',
    'font-size': '16px',
  },
  icon: {
    padding: '10px',
    'font-size': '16px',
    width: '44px',
    height: '44px',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
  },
};

export const Button: Component<ButtonProps> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);
  const [isFocused, setIsFocused] = createSignal(false);

  const variant = () => props.variant || 'primary';
  const size = () => props.size || 'md';

  const baseStyles = (): JSX.CSSProperties => ({
    'font-family': papertrail.fonts.heading,
    'font-weight': 700,
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.5 : 1,
    transition: `all ${motionTokens.duration.fast} ${motionTokens.easing.sharp}`,
    'text-transform': 'uppercase' as const,
    'letter-spacing': '0.04em',
    outline: isFocused() ? `3px solid ${yellowScale[500]}` : 'none',
    'outline-offset': '2px',
    ...sizeStyles[size()],
    ...variantStyles[variant()].base,
    ...(isHovered() && !props.disabled ? variantStyles[variant()].hover : {}),
    ...props.style,
  });

  return (
    <button
      type={props.type || 'button'}
      onClick={() => !props.disabled && props.onClick?.()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      disabled={props.disabled}
      title={props.title}
      style={baseStyles()}
    >
      {props.children}
    </button>
  );
};
