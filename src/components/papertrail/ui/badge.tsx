/**
 * Paper Trail - Badge Component
 * Change type indicators and source badges
 * Bold, high-contrast, construction paper style
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX } from 'solid-js';
import { papertrail, yellowScale, inkScale, diffColors } from '../../../theme/papertrail';
import { ChangeType, CHANGE_TYPES, EntityType } from '../../../schemas/papertrail.schema';

// =============================================================================
// CHANGE TYPE BADGE - Bold with thick borders
// =============================================================================

interface ChangeBadgeProps {
  type: ChangeType;
  size?: 'sm' | 'md';
  style?: JSX.CSSProperties;
}

const changeColors: Record<ChangeType, { bg: string; text: string; border: string }> = {
  update: {
    bg: inkScale.light,
    text: inkScale.black,
    border: inkScale.black,
  },
  correction: {
    bg: yellowScale[500],
    text: '#000000',
    border: '#000000',
  },
  retraction: {
    bg: diffColors.removed.bg,
    text: diffColors.removed.text,
    border: '#000000',
  },
  clarification: {
    bg: '#DBEAFE',
    text: '#1E40AF',
    border: '#000000',
  },
};

export const ChangeBadge: Component<ChangeBadgeProps> = (props) => {
  const size = () => props.size || 'md';
  const colors = () => changeColors[props.type];
  const label = () => CHANGE_TYPES[props.type].label;

  return (
    <span
      style={{
        display: 'inline-flex',
        'align-items': 'center',
        gap: '4px',
        padding: size() === 'sm' ? '2px 8px' : '4px 12px',
        background: colors().bg,
        color: colors().text,
        border: `2px solid ${colors().border}`,
        'font-family': papertrail.fonts.heading,
        'font-size': size() === 'sm' ? '10px' : '12px',
        'font-weight': 700,
        'text-transform': 'uppercase',
        'letter-spacing': '0.05em',
        'white-space': 'nowrap',
        ...props.style,
      }}
    >
      {label()}
    </span>
  );
};

// =============================================================================
// SOURCE BADGE - Construction paper style
// =============================================================================

interface SourceBadgeProps {
  name: string;
  style?: JSX.CSSProperties;
}

export const SourceBadge: Component<SourceBadgeProps> = (props) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        'align-items': 'center',
        padding: '3px 10px',
        background: '#FFFFFF',
        color: '#000000',
        border: '2px solid #000000',
        'font-family': papertrail.fonts.heading,
        'font-size': '11px',
        'font-weight': 700,
        'text-transform': 'uppercase',
        'letter-spacing': '0.04em',
        'white-space': 'nowrap',
        ...props.style,
      }}
    >
      {props.name}
    </span>
  );
};

// =============================================================================
// ENTITY TYPE BADGE (for graph) - Bold with black borders
// =============================================================================

interface EntityBadgeProps {
  type: EntityType;
  style?: JSX.CSSProperties;
}

const entityColors: Record<EntityType, { bg: string; text: string }> = {
  person: { bg: yellowScale[500], text: '#000000' },
  organization: { bg: '#A78BFA', text: '#000000' },
  topic: { bg: '#FFFFFF', text: '#000000' },
  location: { bg: '#6EE7B7', text: '#000000' },
  source: { bg: inkScale.light, text: '#000000' },
};

export const EntityBadge: Component<EntityBadgeProps> = (props) => {
  const colors = () => entityColors[props.type];

  return (
    <span
      style={{
        display: 'inline-flex',
        'align-items': 'center',
        padding: '3px 10px',
        background: colors().bg,
        color: colors().text,
        border: '2px solid #000000',
        'font-family': papertrail.fonts.heading,
        'font-size': '10px',
        'font-weight': 700,
        'text-transform': 'uppercase',
        'letter-spacing': '0.05em',
        ...props.style,
      }}
    >
      {props.type}
    </span>
  );
};

// =============================================================================
// COUNT BADGE - Yellow pop!
// =============================================================================

interface CountBadgeProps {
  count: number;
  style?: JSX.CSSProperties;
}

export const CountBadge: Component<CountBadgeProps> = (props) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        'align-items': 'center',
        'justify-content': 'center',
        'min-width': '24px',
        height: '24px',
        padding: '0 8px',
        background: yellowScale[500],
        color: '#000000',
        border: '2px solid #000000',
        'font-family': papertrail.fonts.heading,
        'font-size': '12px',
        'font-weight': 800,
        ...props.style,
      }}
    >
      {props.count}
    </span>
  );
};
