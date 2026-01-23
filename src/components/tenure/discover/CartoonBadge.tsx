/**
 * CartoonBadge Component
 *
 * A playful badge component that displays career fit levels (Best/Great/Good)
 * with cartoon-style visual treatment.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createMemo } from 'solid-js';
import { maximalist } from '../../../theme/maximalist';

interface CartoonBadgeProps {
  fit: number;
}

export const CartoonBadge: Component<CartoonBadgeProps> = (props) => {
  const fitLabel = createMemo(() => {
    if (props.fit >= 80) return 'Best';
    if (props.fit >= 60) return 'Great';
    return 'Good';
  });

  const styles = createMemo(() => {
    const label = fitLabel();
    switch (label) {
      case 'Best':
        return {
          bg: '#A6D608', // Acid green
          color: '#000',
          radius: '20px',
          transform: 'rotate(-2deg)',
          border: '2px solid #000',
        };
      case 'Great':
        return {
          bg: '#D62598', // Magenta
          color: '#FFF',
          radius: '12px',
          transform: 'rotate(1deg)',
          border: '2px solid #000',
        };
      default:
        return {
          bg: '#00A693', // Teal
          color: '#FFF',
          radius: '8px',
          transform: 'none',
          border: '2px solid #000',
        };
    }
  });

  return (
    <div
      style={{
        background: styles().bg,
        color: styles().color,
        'border-radius': styles().radius,
        border: styles().border,
        padding: '4px 12px',
        'font-family': maximalist.fonts.body,
        'font-size': '15px',
        'text-transform': 'uppercase',
        transform: styles().transform,
        'font-weight': 'bold',
        'letter-spacing': '0.5px',
        'box-shadow': '2px 2px 0px #000',
        display: 'inline-block',
        'min-width': fitLabel() === 'Best' ? '40px' : 'auto',
        'text-align': 'center',
      }}
    >
      {fitLabel()}
    </div>
  );
};

export default CartoonBadge;
