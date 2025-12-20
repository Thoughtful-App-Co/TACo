/**
 * FluidCard - Liquid-styled card component with organic animations
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX, createSignal } from 'solid-js';
import { liquidAugment, pipelineAnimations } from '../theme/liquid-augment';

interface FluidCardProps {
  children: JSX.Element;
  onClick?: () => void;
  style?: JSX.CSSProperties;
  class?: string;
  hoverable?: boolean;
  glowColor?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'stat';
  accentColor?: string;
}

export const FluidCard: Component<FluidCardProps> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);

  const baseStyle = (): JSX.CSSProperties => {
    const variant = props.variant || 'default';
    const accentColor = props.glowColor || props.accentColor;

    const variants = {
      default: {
        background: liquidAugment.glass.background,
        border: liquidAugment.glass.border,
        'backdrop-filter': liquidAugment.glass.backdropFilter,
      },
      elevated: {
        background: liquidAugment.colors.surface,
        border: `1px solid ${liquidAugment.colors.border}`,
        'box-shadow': liquidAugment.shadows.card,
      },
      outlined: {
        background: 'transparent',
        border: `1px solid ${liquidAugment.colors.border}`,
      },
      stat: {
        background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.8), rgba(20, 20, 20, 0.95))',
        border: `1px solid ${accentColor ? `${accentColor}25` : 'rgba(255, 255, 255, 0.08)'}`,
        'backdrop-filter': 'blur(16px)',
        'box-shadow': `0 4px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)`,
      },
    };

    const hoverStyles =
      isHovered() && props.hoverable
        ? {
            transform: 'translateY(-3px) scale(1.01)',
            'box-shadow': accentColor
              ? `0 12px 40px ${accentColor}25, 0 4px 12px rgba(0, 0, 0, 0.3)`
              : '0 12px 40px rgba(0, 0, 0, 0.35)',
            'border-color': accentColor ? `${accentColor}40` : 'rgba(255, 255, 255, 0.15)',
          }
        : {};

    return {
      ...variants[variant],
      'border-radius': liquidAugment.radii.card,
      padding: liquidAugment.spacing.lg,
      transition: `all ${pipelineAnimations.normal} cubic-bezier(0.4, 0, 0.2, 1)`,
      cursor: props.onClick ? 'pointer' : 'default',
      position: 'relative',
      overflow: 'hidden',
      ...hoverStyles,
      ...props.style,
    };
  };

  // Determine extra class for variant-specific styles
  const cardClass = () => {
    const classes = ['pipeline-card', props.class || ''];
    if (props.variant === 'stat') classes.push('stat-card');
    if (props.hoverable) classes.push('pipeline-card-hover');
    return classes.filter(Boolean).join(' ');
  };

  return (
    <div
      class={cardClass()}
      style={
        {
          ...baseStyle(),
          '--card-accent': props.glowColor || props.accentColor || 'rgba(255,255,255,0.2)',
        } as JSX.CSSProperties
      }
      onClick={props.onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {props.children}
    </div>
  );
};

export default FluidCard;
