import { Component, createSignal, For, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { tempoDesign } from '../theme/tempo-design';

// Add fade-in animation for tooltips
const tooltipStyles = document.createElement('style');
tooltipStyles.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;
document.head.appendChild(tooltipStyles);

export interface TabBadge {
  count?: number;
  dot?: boolean;
  variant?: 'default' | 'warning' | 'urgent';
}

export interface Tab {
  id: string;
  label: string;
  icon?: Component;
  disabled?: boolean;
  tooltip?: string;
  badge?: TabBadge;
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
  const [hoveredTab, setHoveredTab] = createSignal<string | null>(null);

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
        position: 'relative',
        ...(props.style as any),
      }}
      class={props.class}
    >
      <For each={props.tabs}>
        {(tab) => (
          <div style={{ position: 'relative' }}>
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
                  if (tab.tooltip) {
                    setHoveredTab(tab.id);
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (!tab.disabled && activeTab() !== tab.id) {
                  e.currentTarget.style.color = tempoDesign.colors.foreground;
                }
                setHoveredTab(null);
              }}
            >
              <Show when={tab.icon}>
                <Dynamic component={tab.icon} />
              </Show>
              {tab.label}
              {/* Badge rendering */}
              <Show when={tab.badge && (tab.badge.count !== undefined || tab.badge.dot)}>
                <Show
                  when={tab.badge?.count !== undefined && tab.badge.count > 0}
                  fallback={
                    <Show when={tab.badge?.dot}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          'border-radius': '50%',
                          background:
                            tab.badge?.variant === 'urgent'
                              ? '#EF4444'
                              : tab.badge?.variant === 'warning'
                                ? '#F59E0B'
                                : tempoDesign.colors.primary,
                          'flex-shrink': 0,
                        }}
                      />
                    </Show>
                  }
                >
                  <span
                    style={{
                      'min-width': '18px',
                      height: '18px',
                      padding: '0 5px',
                      'border-radius': '9999px',
                      background:
                        tab.badge?.variant === 'urgent'
                          ? '#EF4444'
                          : tab.badge?.variant === 'warning'
                            ? '#F59E0B'
                            : tempoDesign.colors.primary,
                      color: '#FFFFFF',
                      'font-size': '10px',
                      'font-weight': '600',
                      display: 'inline-flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'flex-shrink': 0,
                    }}
                  >
                    {tab.badge!.count! > 99 ? '99+' : tab.badge!.count}
                  </span>
                </Show>
              </Show>
            </button>
            <Show when={tab.tooltip && hoveredTab() === tab.id}>
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  'margin-top': '8px',
                  padding: '8px 12px',
                  background: tempoDesign.colors.card,
                  border: `1px solid ${tempoDesign.colors.border}`,
                  'border-radius': tempoDesign.radius.md,
                  'box-shadow': tempoDesign.shadows.lg,
                  color: tempoDesign.colors.foreground,
                  'font-size': tempoDesign.typography.sizes.sm,
                  'white-space': 'nowrap',
                  'z-index': 50,
                  'pointer-events': 'none',
                  animation: 'fadeIn 0.2s ease-out',
                }}
              >
                {tab.tooltip}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    'border-left': '6px solid transparent',
                    'border-right': '6px solid transparent',
                    'border-bottom': `6px solid ${tempoDesign.colors.border}`,
                  }}
                />
              </div>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
};

export const useTab = (defaultTab?: string) => {
  const [activeTab, setActiveTab] = createSignal(defaultTab || '');
  return { activeTab, setActiveTab };
};
