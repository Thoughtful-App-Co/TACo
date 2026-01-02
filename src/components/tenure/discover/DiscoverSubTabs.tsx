/**
 * DiscoverSubTabs Component
 *
 * Sub-navigation for the Discover panel.
 * Shows Overview | Interests | Personality | Cognitive Style tabs.
 * Matches the style from Prepare tabs.
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, For } from 'solid-js';
import { maximalist } from '../../../theme/maximalist';
import { IconChartBar, IconTarget, IconBrain, IconMindmap } from '../pipeline/ui/Icons';

export type DiscoverSubTab = 'overview' | 'interests' | 'personality' | 'cognitive-style';

export interface DiscoverSubTabsProps {
  activeTab: DiscoverSubTab;
  onTabChange: (tab: DiscoverSubTab) => void;
  showInterests: boolean; // Show when RIASEC is complete
  showPersonality: boolean; // Show when OCEAN is complete
  showCognitiveStyle: boolean; // Show when Jungian is complete
  currentThemeGradient: string;
}

export const DiscoverSubTabs: Component<DiscoverSubTabsProps> = (props) => {
  const tabs = () => {
    const result: Array<{ id: DiscoverSubTab; label: string; icon: any; disabled: boolean }> = [];

    // Overview is always available
    result.push({ id: 'overview', label: 'Overview', icon: IconChartBar, disabled: false });

    // Interests tab (RIASEC)
    result.push({
      id: 'interests',
      label: 'Interests',
      icon: IconTarget,
      disabled: !props.showInterests,
    });

    // Personality tab (OCEAN)
    result.push({
      id: 'personality',
      label: 'Personality',
      icon: IconBrain,
      disabled: !props.showPersonality,
    });

    // Cognitive Style tab (Jungian)
    result.push({
      id: 'cognitive-style',
      label: 'Cognitive Style',
      icon: IconMindmap,
      disabled: !props.showCognitiveStyle,
    });

    return result;
  };

  return (
    <div
      style={{
        display: 'flex',
        'justify-content': 'space-between',
        'align-items': 'center',
        'margin-bottom': '32px',
        gap: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '4px',
          background: 'rgba(255, 255, 255, 0.03)',
          'border-radius': '12px',
          border: `1px solid ${maximalist.colors.border}`,
          width: 'fit-content',
        }}
      >
        <For each={tabs()}>
          {(tab) => {
            const Icon = tab.icon;
            return (
              <button
                onClick={() => !tab.disabled && props.onTabChange(tab.id)}
                disabled={tab.disabled}
                style={{
                  padding: '12px 20px',
                  background:
                    props.activeTab === tab.id ? props.currentThemeGradient : 'transparent',
                  border: 'none',
                  'border-radius': '8px',
                  color:
                    props.activeTab === tab.id
                      ? 'black'
                      : tab.disabled
                        ? 'rgba(255, 255, 255, 0.3)'
                        : maximalist.colors.textMuted,
                  cursor: tab.disabled ? 'not-allowed' : 'pointer',
                  'font-size': '14px',
                  'font-weight': '600',
                  'font-family': maximalist.fonts.body,
                  transition: 'all 0.2s',
                  display: 'flex',
                  'align-items': 'center',
                  gap: '8px',
                  opacity: tab.disabled ? 0.5 : 1,
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          }}
        </For>
      </div>
    </div>
  );
};
