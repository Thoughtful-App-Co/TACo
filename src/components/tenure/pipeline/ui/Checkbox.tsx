/**
 * Checkbox - Custom checkbox component for multi-select scenarios
 * Supports checked, indeterminate, and disabled states with smooth transitions
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX } from 'solid-js';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  indeterminate?: boolean;
  accentColor?: string;
}

export const Checkbox: Component<CheckboxProps> = (props) => {
  const size = () => props.size || 'md';
  const accentColor = () => props.accentColor || '#3b82f6';

  const sizeStyles = {
    sm: { box: 20, icon: 14, strokeWidth: 2.5 },
    md: { box: 18, icon: 12, strokeWidth: 2 },
  };

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!props.disabled) {
      props.onChange(!props.checked);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.stopPropagation();
      e.preventDefault();
      if (!props.disabled) {
        props.onChange(!props.checked);
      }
    }
  };

  const containerStyle = (): JSX.CSSProperties => {
    const s = sizeStyles[size()];
    const minHitTarget = 32;
    const padding = Math.max(0, (minHitTarget - s.box) / 2);

    return {
      display: 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      cursor: props.disabled ? 'not-allowed' : 'pointer',
      opacity: props.disabled ? '0.5' : '1',
      padding: `${padding}px`,
      'min-width': `${minHitTarget}px`,
      'min-height': `${minHitTarget}px`,
    };
  };

  const boxStyle = (): JSX.CSSProperties => {
    const s = sizeStyles[size()];
    const isActive = props.checked || props.indeterminate;

    return {
      width: `${s.box}px`,
      height: `${s.box}px`,
      'border-radius': '4px',
      border: isActive ? `1.5px solid ${accentColor()}` : '1.5px solid rgba(255, 255, 255, 0.25)',
      background: isActive ? accentColor() : 'rgba(255, 255, 255, 0.05)',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      transition: 'all 0.15s ease-out',
      'box-shadow': isActive
        ? `0 0 0 2px ${accentColor()}20, 0 2px 4px rgba(0, 0, 0, 0.2)`
        : '0 1px 2px rgba(0, 0, 0, 0.1)',
    };
  };

  const CheckIcon = () => {
    const s = sizeStyles[size()];
    return (
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        stroke-width={s.strokeWidth}
        stroke-linecap="round"
        stroke-linejoin="round"
        style={{
          opacity: props.checked && !props.indeterminate ? '1' : '0',
          transform: props.checked && !props.indeterminate ? 'scale(1)' : 'scale(0.5)',
          transition: 'all 0.15s ease-out',
        }}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  };

  const MinusIcon = () => {
    const s = sizeStyles[size()];
    return (
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        stroke-width={s.strokeWidth}
        stroke-linecap="round"
        stroke-linejoin="round"
        style={{
          opacity: props.indeterminate ? '1' : '0',
          transform: props.indeterminate ? 'scale(1)' : 'scale(0.5)',
          transition: 'all 0.15s ease-out',
          position: 'absolute',
        }}
      >
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    );
  };

  return (
    <div
      role="checkbox"
      aria-checked={props.indeterminate ? 'mixed' : props.checked}
      aria-disabled={props.disabled}
      tabIndex={props.disabled ? -1 : 0}
      style={containerStyle()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div style={boxStyle()} class="checkbox-box">
        <div
          style={{
            position: 'relative',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
          }}
        >
          <MinusIcon />
          <CheckIcon />
        </div>
      </div>
      <style>{`
        .checkbox-box:hover {
          border-color: ${props.disabled ? '' : props.checked || props.indeterminate ? accentColor() : 'rgba(255, 255, 255, 0.4)'} !important;
          background: ${props.disabled ? '' : props.checked || props.indeterminate ? accentColor() : 'rgba(255, 255, 255, 0.08)'} !important;
        }
        .checkbox-box:focus-visible {
          outline: 2px solid ${accentColor()};
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default Checkbox;
