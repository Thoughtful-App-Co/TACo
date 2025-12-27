/**
 * Paper Trail - Card Component
 * Sharp-edged newspaper-style card with subtle shadows
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX, createSignal } from 'solid-js';
import { papertrail, motionTokens } from '../../../theme/papertrail';

interface CardProps {
  children: JSX.Element;
  style?: JSX.CSSProperties;
  onClick?: () => void;
  hoverable?: boolean;
  class?: string;
}

export const Card: Component<CardProps> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);

  return (
    <div
      class={props.class}
      onClick={props.onClick}
      onMouseEnter={() => props.hoverable && setIsHovered(true)}
      onMouseLeave={() => props.hoverable && setIsHovered(false)}
      style={{
        background: papertrail.colors.surface,
        border: `1px solid ${papertrail.colors.border}`,
        'border-radius': papertrail.radii.sm, // Sharp corners
        'box-shadow': isHovered() ? papertrail.shadows.md : papertrail.shadows.sm,
        transition: `box-shadow ${motionTokens.duration.fast} ${motionTokens.easing.standard}, transform ${motionTokens.duration.fast} ${motionTokens.easing.standard}`,
        transform: isHovered() ? 'translateY(-2px)' : 'translateY(0)',
        cursor: props.onClick ? 'pointer' : 'default',
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
};

interface CardHeaderProps {
  children: JSX.Element;
  style?: JSX.CSSProperties;
}

export const CardHeader: Component<CardHeaderProps> = (props) => {
  return (
    <div
      style={{
        padding: `${papertrail.spacing.md} ${papertrail.spacing.md} ${papertrail.spacing.sm}`,
        'border-bottom': `1px solid ${papertrail.colors.border}`,
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
};

interface CardContentProps {
  children: JSX.Element;
  style?: JSX.CSSProperties;
}

export const CardContent: Component<CardContentProps> = (props) => {
  return (
    <div
      style={{
        padding: papertrail.spacing.md,
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
};

interface CardTitleProps {
  children: JSX.Element;
  style?: JSX.CSSProperties;
}

export const CardTitle: Component<CardTitleProps> = (props) => {
  return (
    <h3
      style={{
        margin: 0,
        'font-family': papertrail.fonts.heading,
        'font-size': '18px',
        'font-weight': 700,
        'line-height': 1.2,
        color: papertrail.colors.text,
        ...props.style,
      }}
    >
      {props.children}
    </h3>
  );
};

interface CardDescriptionProps {
  children: JSX.Element;
  style?: JSX.CSSProperties;
}

export const CardDescription: Component<CardDescriptionProps> = (props) => {
  return (
    <p
      style={{
        margin: `${papertrail.spacing.xs} 0 0`,
        'font-family': papertrail.fonts.body,
        'font-size': '14px',
        'line-height': 1.5,
        color: papertrail.colors.textMuted,
        ...props.style,
      }}
    >
      {props.children}
    </p>
  );
};
