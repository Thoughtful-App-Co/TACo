/**
 * StatusBadge - Pipeline status indicator with liquid styling
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX } from 'solid-js';
import { ApplicationStatus, STATUS_LABELS } from '../../../../schemas/pipeline.schema';
import { statusColors, pipelineAnimations } from '../theme/liquid-tenure';
import {
  IconBookmark,
  IconSend,
  IconSearch,
  IconMessage,
  IconStar,
  IconCheck,
  IconX,
  IconChevronRight,
} from './Icons';

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  style?: JSX.CSSProperties;
}

// Map status to icon components
const StatusIcon: Component<{ status: ApplicationStatus; size: number; color: string }> = (
  props
) => {
  const iconProps = { size: props.size, color: props.color };

  switch (props.status) {
    case 'saved':
      return <IconBookmark {...iconProps} />;
    case 'applied':
      return <IconSend {...iconProps} />;
    case 'screening':
      return <IconSearch {...iconProps} />;
    case 'interviewing':
      return <IconMessage {...iconProps} />;
    case 'offered':
      return <IconStar {...iconProps} />;
    case 'accepted':
      return <IconCheck {...iconProps} />;
    case 'rejected':
      return <IconX {...iconProps} />;
    case 'withdrawn':
      return <IconChevronRight {...iconProps} />;
    default:
      return <IconBookmark {...iconProps} />;
  }
};

export const StatusBadge: Component<StatusBadgeProps> = (props) => {
  const size = props.size || 'md';

  const sizeStyles = {
    sm: { padding: '2px 8px', fontSize: '10px', gap: '4px', iconSize: 12 },
    md: { padding: '4px 12px', fontSize: '12px', gap: '6px', iconSize: 14 },
    lg: { padding: '6px 16px', fontSize: '14px', gap: '8px', iconSize: 16 },
  };

  const colors = statusColors[props.status];

  const style = (): JSX.CSSProperties => ({
    display: 'inline-flex',
    'align-items': 'center',
    gap: sizeStyles[size].gap,
    padding: sizeStyles[size].padding,
    'font-size': sizeStyles[size].fontSize,
    'font-weight': '600',
    'font-family': "'Space Grotesk', system-ui, sans-serif",
    'letter-spacing': '0.01em',
    'border-radius': '9999px',
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    transition: `all ${pipelineAnimations.fast} ${pipelineAnimations.flow}`,
    'white-space': 'nowrap',
    ...props.style,
  });

  return (
    <span style={style()}>
      <StatusIcon status={props.status} size={sizeStyles[size].iconSize} color={colors.text} />
      {props.showLabel !== false && <span>{STATUS_LABELS[props.status]}</span>}
    </span>
  );
};

export default StatusBadge;
