/**
 * AgingIndicator - Shows time since last activity with color-coded urgency
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX, createMemo } from 'solid-js';
import { daysSince, getAgingStatus } from '../../../../schemas/pipeline.schema';
import { agingColors, pipelineAnimations } from '../theme/liquid-augment';
import { pipelineStore } from '../store';

interface AgingIndicatorProps {
  lastActivityAt: Date;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  style?: JSX.CSSProperties;
}

export const AgingIndicator: Component<AgingIndicatorProps> = (props) => {
  const size = props.size || 'md';
  const settings = pipelineStore.state.settings;

  const days = createMemo(() => daysSince(props.lastActivityAt));
  const aging = createMemo(() => getAgingStatus(days(), settings));
  const colors = createMemo(() => agingColors[aging()]);

  const sizeStyles = {
    sm: { padding: '2px 8px', fontSize: '10px', dotSize: '6px' },
    md: { padding: '4px 10px', fontSize: '11px', dotSize: '8px' },
    lg: { padding: '6px 14px', fontSize: '13px', dotSize: '10px' },
  };

  const formatDays = (d: number): string => {
    if (d === 0) return 'Today';
    if (d === 1) return '1 day';
    if (d < 7) return `${d} days`;
    if (d < 14) return '1 week';
    if (d < 30) return `${Math.floor(d / 7)} weeks`;
    if (d < 60) return '1 month';
    return `${Math.floor(d / 30)} months`;
  };

  const style = (): JSX.CSSProperties => ({
    display: 'inline-flex',
    'align-items': 'center',
    gap: '6px',
    padding: sizeStyles[size].padding,
    'font-size': sizeStyles[size].fontSize,
    'font-weight': '500',
    'border-radius': '9999px',
    background: colors().bg,
    border: `1px solid ${colors().border}`,
    color: colors().color,
    transition: `all ${pipelineAnimations.fast}`,
    animation: colors().pulse ? 'aging-pulse 2s ease-in-out infinite' : 'none',
    ...props.style,
  });

  const dotStyle = (): JSX.CSSProperties => ({
    width: sizeStyles[size].dotSize,
    height: sizeStyles[size].dotSize,
    'border-radius': '50%',
    background: colors().color,
    'flex-shrink': '0',
  });

  return (
    <span class={`aging-indicator ${aging()}`} style={style()}>
      <span style={dotStyle()} />
      {props.showLabel !== false && <span>{formatDays(days())}</span>}
    </span>
  );
};

export default AgingIndicator;
