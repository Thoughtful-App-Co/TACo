/**
 * Paper Trail - Select Component
 * Sharp-edged dropdown select with focus states
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX, For, createSignal, Show } from 'solid-js';
import { papertrail, yellowScale, motionTokens } from '../../../theme/papertrail';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value?: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  style?: JSX.CSSProperties;
}

export const Select: Component<SelectProps> = (props) => {
  const [isFocused, setIsFocused] = createSignal(false);

  return (
    <div style={{ position: 'relative', width: '100%', ...props.style }}>
      <select
        value={props.value || ''}
        disabled={props.disabled}
        onChange={(e) => props.onChange?.(e.currentTarget.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: '100%',
          padding: '10px 36px 10px 14px',
          'font-family': papertrail.fonts.body,
          'font-size': '14px',
          'line-height': 1.5,
          color: papertrail.colors.text,
          background: papertrail.colors.surface,
          border: `1px solid ${isFocused() ? yellowScale[500] : papertrail.colors.border}`,
          'border-radius': papertrail.radii.organic,
          outline: 'none',
          appearance: 'none',
          cursor: props.disabled ? 'not-allowed' : 'pointer',
          transition: `border-color ${motionTokens.duration.fast} ${motionTokens.easing.standard}, box-shadow ${motionTokens.duration.fast} ${motionTokens.easing.standard}`,
          'box-shadow': isFocused() ? `0 0 0 3px ${yellowScale[100]}` : 'none',
          opacity: props.disabled ? 0.5 : 1,
        }}
      >
        <Show when={props.placeholder}>
          <option value="" disabled>
            {props.placeholder}
          </option>
        </Show>
        <For each={props.options}>
          {(option) => <option value={option.value}>{option.label}</option>}
        </For>
      </select>

      {/* Dropdown arrow */}
      <div
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          'pointer-events': 'none',
          color: papertrail.colors.textMuted,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 6l4 4 4-4H4z" />
        </svg>
      </div>
    </div>
  );
};
