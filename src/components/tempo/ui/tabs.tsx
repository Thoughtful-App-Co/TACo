import { Component, createSignal, For, Show } from 'solid-js';
import { tempoDesign } from '../theme/tempo-design';

export interface Tab {
  id: string;
  label: string;
  icon?: Component;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  class?: string;
  style?: Record<string, string>;
}

export const Tabs: Component<TabsProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal(props.defaultTab || props.tabs[0]?.id || '');

  const handleTabChange = (tabId: string) => {
    if (!props.tabs.find((t) => t.id === tabId)?.disabled) {
      setActiveTab(tabId);
      props.onChange?.(tabId);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        'border-bottom': `2px solid ${tempoDesign.colors.border}`,
        ...(props.style as any),
      }}
      class={props.class}
    >
      <For each={props.tabs}>
        {(tab) => (
          <button
            onClick={() => handleTabChange(tab.id)}
            disabled={tab.disabled}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              'border-bottom': `2px solid ${activeTab() === tab.id ? tempoDesign.colors.primary : 'transparent'}`,
              color:
                activeTab() === tab.id
                  ? tempoDesign.colors.primary
                  : tab.disabled
                    ? tempoDesign.colors.mutedForeground
                    : tempoDesign.colors.foreground,
              cursor: tab.disabled ? 'not-allowed' : 'pointer',
              'font-size': tempoDesign.typography.sizes.sm,
              'font-weight': tempoDesign.typography.weights.medium,
              transition: 'all 0.2s ease-out',
              display: 'flex',
              'align-items': 'center',
              gap: '8px',
              opacity: tab.disabled ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!tab.disabled) {
                e.currentTarget.style.color = tempoDesign.colors.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (!tab.disabled && activeTab() !== tab.id) {
                e.currentTarget.style.color = tempoDesign.colors.foreground;
              }
            }}
          >
            <Show when={tab.icon}>{tab.icon && <tab.icon />}</Show>
            {tab.label}
          </button>
        )}
      </For>
    </div>
  );
};

export const useTab = (defaultTab?: string) => {
  const [activeTab, setActiveTab] = createSignal(defaultTab || '');
  return { activeTab, setActiveTab };
};
