import { Component, For, Show } from 'solid-js';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { tempoDesign } from '../../theme/tempo-design';
import type { SessionStatus } from '../../lib/types';

interface SessionFilterBarProps {
  activeFilter: SessionStatus | 'all';
  onFilterChange: (filter: SessionStatus | 'all') => void;
  sessionCounts?: {
    all: number;
    planned: number;
    'in-progress': number;
    completed: number;
    incomplete: number;
    archived: number;
  };
}

interface FilterOption {
  value: SessionStatus | 'all';
  label: string;
  color: string;
  activeColor: string;
  activeBg: string;
}

const filterOptions: FilterOption[] = [
  {
    value: 'all',
    label: 'All',
    color: tempoDesign.colors.mutedForeground,
    activeColor: tempoDesign.colors.foreground,
    activeBg: tempoDesign.colors.secondary,
  },
  {
    value: 'planned',
    label: 'Planned',
    color: tempoDesign.colors.amber[600],
    activeColor: tempoDesign.colors.amber[50],
    activeBg: tempoDesign.colors.amber[600],
  },
  {
    value: 'in-progress',
    label: 'In Progress',
    color: tempoDesign.colors.primary,
    activeColor: tempoDesign.colors.primaryForeground,
    activeBg: tempoDesign.colors.primary,
  },
  {
    value: 'incomplete',
    label: 'Incomplete',
    color: '#EF4444',
    activeColor: '#FFFFFF',
    activeBg: '#EF4444',
  },
  {
    value: 'completed',
    label: 'Completed',
    color: tempoDesign.colors.frog,
    activeColor: '#FFFFFF',
    activeBg: tempoDesign.colors.frog,
  },
  {
    value: 'archived',
    label: 'Archived',
    color: tempoDesign.colors.mutedForeground,
    activeColor: tempoDesign.colors.foreground,
    activeBg: tempoDesign.colors.muted,
  },
];

export const SessionFilterBar: Component<SessionFilterBarProps> = (props) => {
  const getCount = (filter: SessionStatus | 'all'): number | undefined => {
    if (!props.sessionCounts) return undefined;
    return props.sessionCounts[filter];
  };

  return (
    <div
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: tempoDesign.spacing.sm,
        padding: `${tempoDesign.spacing.sm} ${tempoDesign.spacing.md}`,
        background: tempoDesign.colors.card,
        'border-radius': tempoDesign.radius.lg,
        border: `1px solid ${tempoDesign.colors.cardBorder}`,
        'overflow-x': 'auto',
        'scrollbar-width': 'none',
        '-ms-overflow-style': 'none',
        '-webkit-overflow-scrolling': 'touch',
      }}
    >
      <For each={filterOptions}>
        {(option) => {
          const isActive = () => props.activeFilter === option.value;
          const count = () => getCount(option.value);

          return (
            <Button
              variant={isActive() ? 'default' : 'ghost'}
              size="sm"
              onClick={() => props.onFilterChange(option.value)}
              style={{
                'flex-shrink': 0,
                display: 'inline-flex',
                'align-items': 'center',
                gap: tempoDesign.spacing.xs,
                padding: `${tempoDesign.spacing.xs} ${tempoDesign.spacing.md}`,
                'border-radius': tempoDesign.radius.md,
                'font-size': tempoDesign.typography.sizes.sm,
                'font-weight': tempoDesign.typography.weights.medium,
                transition: `all ${tempoDesign.transitions.fast}`,
                background: isActive() ? option.activeBg : 'transparent',
                color: isActive() ? option.activeColor : option.color,
                border: isActive() ? 'none' : `1px solid transparent`,
                'box-shadow': isActive() ? `0 0 12px ${option.activeBg}40` : 'none',
              }}
            >
              <span>{option.label}</span>
              <Show when={count() !== undefined}>
                <Badge
                  variant={isActive() ? 'outline' : 'secondary'}
                  style={{
                    'min-width': '20px',
                    height: '20px',
                    padding: '0 6px',
                    'font-size': tempoDesign.typography.sizes.xs,
                    'font-weight': tempoDesign.typography.weights.semibold,
                    'border-radius': tempoDesign.radius.full,
                    background: isActive() ? 'rgba(255, 255, 255, 0.2)' : `${option.color}15`,
                    color: isActive() ? option.activeColor : option.color,
                    border: 'none',
                  }}
                >
                  {count()}
                </Badge>
              </Show>
            </Button>
          );
        }}
      </For>
    </div>
  );
};
