/**
 * CardAging - Visual aging effects for stale application cards
 * Creates "peeling" and "tattering" effects to indicate age
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX, Show } from 'solid-js';
import { daysSince, getAgingStatus } from '../../../../schemas/pipeline.schema';
import { PipelineSettings } from '../../../../schemas/pipeline.schema';

export type AgingLevel = 'fresh' | 'warning' | 'critical';

export interface AgingStyles {
  filter: string;
  borderStyle: string;
  position: 'relative' | 'static';
}

/**
 * Get CSS filter for aging effect (desaturation + slight sepia)
 */
export function getAgingFilter(level: AgingLevel): string {
  switch (level) {
    case 'fresh':
      return 'none';
    case 'warning':
      return 'saturate(0.9) sepia(0.05)';
    case 'critical':
      return 'saturate(0.75) sepia(0.15)';
  }
}

/**
 * Get border style for aging effect
 */
export function getAgingBorderStyle(level: AgingLevel): string {
  switch (level) {
    case 'fresh':
      return '1px solid rgba(255, 255, 255, 0.08)';
    case 'warning':
      return '1px dashed rgba(255, 255, 255, 0.08)';
    case 'critical':
      return '1px dashed rgba(255, 255, 255, 0.06)';
  }
}

/**
 * Get composite aging styles for a card
 */
export function getAgingStyles(level: AgingLevel): AgingStyles {
  return {
    filter: getAgingFilter(level),
    borderStyle: getAgingBorderStyle(level),
    position: 'relative',
  };
}

/**
 * PeelEffect - Top-right corner peel effect
 */
interface PeelEffectProps {
  level: AgingLevel;
  size?: 'small' | 'medium' | 'large';
}

export const PeelEffect: Component<PeelEffectProps> = (props) => {
  const size = () => {
    switch (props.size || 'medium') {
      case 'small':
        return props.level === 'warning' ? 16 : 0;
      case 'medium':
        return props.level === 'warning' ? 20 : props.level === 'critical' ? 32 : 0;
      case 'large':
        return props.level === 'warning' ? 24 : props.level === 'critical' ? 40 : 0;
    }
  };

  const peelSize = size();
  if (peelSize === 0) return null;

  const shadowIntensity = props.level === 'critical' ? 0.4 : 0.25;
  const curlIntensity = props.level === 'critical' ? 1.5 : 1;

  return (
    <>
      {/* Peeled corner triangle */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          right: '0',
          width: '0',
          height: '0',
          'border-style': 'solid',
          'border-width': `0 ${peelSize}px ${peelSize}px 0`,
          'border-color': `transparent rgba(20, 20, 25, 0.95) transparent transparent`,
          'z-index': 2,
          filter: `drop-shadow(-1px 1px 2px rgba(0, 0, 0, ${shadowIntensity}))`,
        }}
      />

      {/* Curl shadow underneath */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          right: '0',
          width: `${peelSize * curlIntensity}px`,
          height: `${peelSize * curlIntensity}px`,
          background: `radial-gradient(ellipse at top right, rgba(0, 0, 0, ${shadowIntensity * 0.6}), transparent 70%)`,
          'border-radius': '0 0 0 100%',
          'z-index': 1,
          'pointer-events': 'none',
        }}
      />

      {/* Lifted edge highlight */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          right: '0',
          width: `${peelSize}px`,
          height: `${peelSize}px`,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), transparent)',
          'border-radius': '0 0 0 100%',
          'z-index': 3,
          'pointer-events': 'none',
        }}
      />
    </>
  );
};

/**
 * PaperTexture - Subtle paper grain overlay
 */
interface PaperTextureProps {
  level: AgingLevel;
}

export const PaperTexture: Component<PaperTextureProps> = (props) => {
  if (props.level === 'fresh') return null;

  const opacity = props.level === 'warning' ? 0.015 : 0.03;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        'background-image': `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        opacity: opacity,
        'pointer-events': 'none',
        'z-index': 1,
        'mix-blend-mode': 'multiply',
      }}
    />
  );
};

/**
 * CoffeeStain - Optional coffee stain effect for critical aging
 */
interface CoffeeStainProps {
  level: AgingLevel;
  position?: 'bottom-left' | 'bottom-right' | 'top-left';
}

export const CoffeeStain: Component<CoffeeStainProps> = (props) => {
  if (props.level !== 'critical') return null;

  const position = props.position || 'bottom-right';
  const positionStyles: Record<string, JSX.CSSProperties> = {
    'bottom-left': { bottom: '8px', left: '8px' },
    'bottom-right': { bottom: '8px', right: '8px' },
    'top-left': { top: '8px', left: '8px' },
  };

  return (
    <div
      style={{
        position: 'absolute',
        width: '32px',
        height: '32px',
        'border-radius': '50%',
        background: 'radial-gradient(circle, rgba(101, 67, 33, 0.15), transparent 70%)',
        filter: 'blur(2px)',
        'pointer-events': 'none',
        'z-index': 1,
        ...positionStyles[position],
      }}
    />
  );
};

/**
 * AgingCardWrapper - Composite wrapper that applies all aging effects
 */
interface AgingCardWrapperProps {
  lastActivityAt: Date;
  settings: PipelineSettings;
  children: JSX.Element;
  peelSize?: 'small' | 'medium' | 'large';
  showTexture?: boolean;
  showCoffeeStain?: boolean;
}

export const AgingCardWrapper: Component<AgingCardWrapperProps> = (props) => {
  const days = () => daysSince(props.lastActivityAt);
  const level = () => getAgingStatus(days(), props.settings);
  const styles = () => getAgingStyles(level());

  return (
    <div
      style={{
        position: 'relative',
        filter: styles().filter,
      }}
    >
      {/* Paper texture overlay */}
      <Show when={props.showTexture !== false}>
        <PaperTexture level={level()} />
      </Show>

      {/* Peel effect */}
      <PeelEffect level={level()} size={props.peelSize || 'medium'} />

      {/* Coffee stain */}
      <Show when={props.showCoffeeStain}>
        <CoffeeStain level={level()} position="bottom-right" />
      </Show>

      {/* Child content */}
      {props.children}
    </div>
  );
};

export default AgingCardWrapper;
