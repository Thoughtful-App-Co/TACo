/**
 * Paper Trail - Tabs Component
 * Bold, construction paper style tabs with thick borders
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, JSX, For, createSignal, Show } from 'solid-js';
import { papertrail, yellowScale, motionTokens } from '../../../theme/papertrail';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  style?: JSX.CSSProperties;
}

export const Tabs: Component<TabsProps> = (props) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0',
        'border-bottom': '3px solid #000000',
        ...props.style,
      }}
    >
      <For each={props.tabs}>
        {(tab) => (
          <TabButton
            label={tab.label}
            count={tab.count}
            isActive={props.activeTab === tab.id}
            onClick={() => props.onTabChange(tab.id)}
          />
        )}
      </For>
    </div>
  );
};

interface TabButtonProps {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: Component<TabButtonProps> = (props) => {
  const [isHovered, setIsHovered] = createSignal(false);
  const [isFocused, setIsFocused] = createSignal(false);

  return (
    <button
      onClick={props.onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        position: 'relative',
        padding: '14px 24px',
        background: props.isActive ? yellowScale[500] : 'transparent',
        border: 'none',
        'border-bottom': props.isActive ? '3px solid #000000' : '3px solid transparent',
        'margin-bottom': '-3px',
        'font-family': papertrail.fonts.heading,
        'font-size': '13px',
        'font-weight': props.isActive ? 800 : 600,
        'text-transform': 'uppercase',
        'letter-spacing': '0.06em',
        color: props.isActive ? '#000000' : isHovered() ? '#000000' : papertrail.colors.textMuted,
        cursor: 'pointer',
        transition: `all ${motionTokens.duration.fast} ${motionTokens.easing.sharp}`,
        display: 'flex',
        'align-items': 'center',
        gap: '10px',
        outline: isFocused() ? `3px solid ${yellowScale[500]}` : 'none',
        'outline-offset': '-3px',
      }}
    >
      {props.label}
      <Show when={props.count !== undefined && props.count > 0}>
        <span
          style={{
            display: 'inline-flex',
            'align-items': 'center',
            'justify-content': 'center',
            'min-width': '24px',
            height: '22px',
            padding: '0 8px',
            background: props.isActive ? '#000000' : papertrail.colors.background,
            color: props.isActive ? '#FFFFFF' : '#000000',
            border: '2px solid #000000',
            'font-size': '11px',
            'font-weight': 800,
          }}
        >
          {props.count}
        </span>
      </Show>
    </button>
  );
};
