/**
 * WhyCard - Explains pricing rationale to non-technical users
 */

import { Component } from 'solid-js';
import { tokens } from './tokens';

interface WhyCardProps {
  text: string;
}

export const WhyCard: Component<WhyCardProps> = (props) => {
  return (
    <div
      style={{
        padding: tokens.spacing.md,
        background: `linear-gradient(135deg, rgba(255, 107, 107, 0.03), rgba(255, 230, 109, 0.03))`,
        border: `1px solid ${tokens.colors.border}`,
        'border-radius': tokens.radius.md,
        'margin-bottom': tokens.spacing.lg,
        'border-left': `3px solid ${tokens.colors.accent.coral}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: tokens.spacing.sm,
          'align-items': 'flex-start',
        }}
      >
        <div
          style={{
            'font-size': '10px',
            'font-weight': '700',
            'letter-spacing': '0.5px',
            'text-transform': 'uppercase',
            color: tokens.colors.accent.coral,
            'flex-shrink': 0,
            'padding-top': '2px',
          }}
        >
          Why?
        </div>
        <p
          style={{
            margin: 0,
            'font-size': '13px',
            color: tokens.colors.textMuted,
            'line-height': '1.6',
            'letter-spacing': '0.005em',
          }}
        >
          {props.text}
        </p>
      </div>
    </div>
  );
};
