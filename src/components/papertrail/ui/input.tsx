/**
 * Paper Trail - Input Component
 * Sharp-edged text input with focus states
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX, createSignal } from 'solid-js';
import { papertrail, yellowScale, motionTokens } from '../../../theme/papertrail';

interface InputProps {
  value?: string;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'url';
  disabled?: boolean;
  onInput?: (e: InputEvent & { currentTarget: HTMLInputElement }) => void;
  onChange?: (e: Event & { currentTarget: HTMLInputElement }) => void;
  style?: JSX.CSSProperties;
}

export const Input: Component<InputProps> = (props) => {
  const [isFocused, setIsFocused] = createSignal(false);

  return (
    <input
      type={props.type || 'text'}
      value={props.value || ''}
      placeholder={props.placeholder}
      disabled={props.disabled}
      onInput={props.onInput}
      onChange={props.onChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        width: '100%',
        padding: '10px 14px',
        'font-family': papertrail.fonts.body,
        'font-size': '14px',
        'line-height': 1.5,
        color: papertrail.colors.text,
        background: papertrail.colors.surface,
        border: `1px solid ${isFocused() ? yellowScale[500] : papertrail.colors.border}`,
        'border-radius': papertrail.radii.organic,
        outline: 'none',
        transition: `border-color ${motionTokens.duration.fast} ${motionTokens.easing.standard}, box-shadow ${motionTokens.duration.fast} ${motionTokens.easing.standard}`,
        'box-shadow': isFocused() ? `0 0 0 3px ${yellowScale[100]}` : 'none',
        opacity: props.disabled ? 0.5 : 1,
        cursor: props.disabled ? 'not-allowed' : 'text',
        ...props.style,
      }}
    />
  );
};

interface TextareaProps {
  value?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  onInput?: (e: InputEvent & { currentTarget: HTMLTextAreaElement }) => void;
  style?: JSX.CSSProperties;
}

export const Textarea: Component<TextareaProps> = (props) => {
  const [isFocused, setIsFocused] = createSignal(false);

  return (
    <textarea
      value={props.value || ''}
      placeholder={props.placeholder}
      rows={props.rows || 4}
      disabled={props.disabled}
      onInput={props.onInput}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        width: '100%',
        padding: '10px 14px',
        'font-family': papertrail.fonts.body,
        'font-size': '14px',
        'line-height': 1.5,
        color: papertrail.colors.text,
        background: papertrail.colors.surface,
        border: `1px solid ${isFocused() ? yellowScale[500] : papertrail.colors.border}`,
        'border-radius': papertrail.radii.organic,
        outline: 'none',
        resize: 'vertical',
        transition: `border-color ${motionTokens.duration.fast} ${motionTokens.easing.standard}, box-shadow ${motionTokens.duration.fast} ${motionTokens.easing.standard}`,
        'box-shadow': isFocused() ? `0 0 0 3px ${yellowScale[100]}` : 'none',
        opacity: props.disabled ? 0.5 : 1,
        ...props.style,
      }}
    />
  );
};
