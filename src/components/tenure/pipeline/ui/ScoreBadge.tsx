/**
 * ScoreBadge - Displays match score with color-coded rating
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX, createMemo } from 'solid-js';
import { getScoreColor, pipelineAnimations } from '../theme/liquid-tenure';

interface ScoreBadgeProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  style?: JSX.CSSProperties;
}

export const ScoreBadge: Component<ScoreBadgeProps> = (props) => {
  const size = props.size || 'md';
  const scoreInfo = createMemo(() => getScoreColor(props.score));

  const sizeStyles = {
    sm: { padding: '2px 8px', fontSize: '10px' },
    md: { padding: '4px 12px', fontSize: '12px' },
    lg: { padding: '6px 16px', fontSize: '14px' },
  };

  const style = (): JSX.CSSProperties => ({
    display: 'inline-flex',
    'align-items': 'center',
    gap: '6px',
    padding: sizeStyles[size].padding,
    'font-size': sizeStyles[size].fontSize,
    'font-weight': '600',
    'border-radius': '9999px',
    background: `${scoreInfo().color}20`,
    border: `1px solid ${scoreInfo().color}40`,
    color: scoreInfo().color,
    transition: `all ${pipelineAnimations.fast}`,
    ...props.style,
  });

  return (
    <span style={style()}>
      <span style={{ 'font-weight': '700' }}>{Math.round(props.score)}%</span>
      {props.showLabel && <span>{scoreInfo().label}</span>}
    </span>
  );
};

export default ScoreBadge;
