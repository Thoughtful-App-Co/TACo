/**
 * WorkoutAreaSelector - Select workout area before creating workout
 *
 * Compact selector showing current area with option to change.
 * Used in workout creation flow.
 *
 * Memphis x Retro-Futurism Design
 */

import { Component, createSignal, For, Show, createResource } from 'solid-js';
import { WorkoutAreaService } from '../lib/workout-area.service';
import type { WorkoutArea } from '../../../schemas/echoprax.schema';
import {
  echoprax,
  memphisColors,
  memphisSurfaces,
  glassButton,
  typography,
} from '../../../theme/echoprax';
import { logger } from '../../../lib/logger';

const log = logger.create('WorkoutAreaSelector');

interface WorkoutAreaSelectorProps {
  selectedArea: WorkoutArea | null;
  onSelectArea: (area: WorkoutArea) => void;
  onManageAreas?: () => void;
}

export const WorkoutAreaSelector: Component<WorkoutAreaSelectorProps> = (props) => {
  const [isExpanded, setIsExpanded] = createSignal(false);

  // Load all areas
  const [areas, { refetch }] = createResource(() => WorkoutAreaService.getAreas());

  const handleSelectArea = (area: WorkoutArea) => {
    log.debug('Selected area', { id: area.id, name: area.name });
    props.onSelectArea(area);
    setIsExpanded(false);
  };

  const equipmentPreview = (area: WorkoutArea) => {
    const count = area.equipment.length;
    if (count <= 3) {
      return area.equipment.join(', ').replace(/_/g, ' ');
    }
    return `${area.equipment.slice(0, 2).join(', ').replace(/_/g, ' ')} +${count - 2} more`;
  };

  return (
    <div style={{ 'margin-bottom': echoprax.spacing.lg }}>
      {/* Current Selection / Trigger */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded())}
        class="echoprax-glass-btn"
        style={{
          ...glassButton.default,
          width: '100%',
          padding: echoprax.spacing.md,
          'border-radius': echoprax.radii.md,
          cursor: 'pointer',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          gap: echoprax.spacing.md,
        }}
      >
        <div style={{ 'text-align': 'left' }}>
          <div
            style={{
              ...typography.caption,
              color: echoprax.colors.textMuted,
              'margin-bottom': '2px',
            }}
          >
            Workout Area
          </div>
          <Show
            when={props.selectedArea}
            fallback={
              <span style={{ ...typography.body, color: memphisColors.coral }}>Select an area</span>
            }
          >
            <div style={{ display: 'flex', 'align-items': 'center', gap: echoprax.spacing.sm }}>
              <span
                style={{ ...typography.body, color: echoprax.colors.text, 'font-weight': '600' }}
              >
                {props.selectedArea!.name}
              </span>
              <Show when={props.selectedArea!.isDefault}>
                <span
                  style={{
                    ...typography.caption,
                    color: memphisColors.mintGreen,
                    background: `${memphisColors.mintGreen}20`,
                    padding: `1px ${echoprax.spacing.xs}`,
                    'border-radius': echoprax.radii.sm,
                  }}
                >
                  Default
                </span>
              </Show>
            </div>
          </Show>
        </div>
        <span style={{ color: echoprax.colors.textMuted, 'font-size': '0.875rem' }}>
          {isExpanded() ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded Area List */}
      <Show when={isExpanded()}>
        <div
          style={{
            ...memphisSurfaces.card,
            'margin-top': echoprax.spacing.xs,
            padding: echoprax.spacing.sm,
            'max-height': '300px',
            'overflow-y': 'auto',
          }}
        >
          <Show
            when={!areas.loading && areas() && areas()!.length > 0}
            fallback={
              <p
                style={{
                  ...typography.bodySm,
                  color: echoprax.colors.textMuted,
                  padding: echoprax.spacing.md,
                  'text-align': 'center',
                  margin: 0,
                }}
              >
                {areas.loading ? 'Loading...' : 'No workout areas yet'}
              </p>
            }
          >
            <For each={areas()}>
              {(area) => {
                const isSelected = () => props.selectedArea?.id === area.id;
                return (
                  <button
                    type="button"
                    onClick={() => handleSelectArea(area)}
                    style={{
                      width: '100%',
                      padding: echoprax.spacing.md,
                      background: isSelected() ? `${memphisColors.hotPink}15` : 'transparent',
                      border: isSelected()
                        ? `1px solid ${memphisColors.hotPink}40`
                        : '1px solid transparent',
                      'border-radius': echoprax.radii.md,
                      cursor: 'pointer',
                      'text-align': 'left',
                      display: 'flex',
                      'flex-direction': 'column',
                      gap: '2px',
                      'margin-bottom': echoprax.spacing.xs,
                    }}
                  >
                    <div
                      style={{ display: 'flex', 'align-items': 'center', gap: echoprax.spacing.sm }}
                    >
                      <span
                        style={{
                          ...typography.bodySm,
                          color: isSelected() ? memphisColors.hotPink : echoprax.colors.text,
                          'font-weight': isSelected() ? '600' : '400',
                        }}
                      >
                        {area.name}
                      </span>
                      <Show when={area.isDefault}>
                        <span
                          style={{
                            ...typography.caption,
                            'font-size': '0.65rem',
                            color: memphisColors.mintGreen,
                          }}
                        >
                          (default)
                        </span>
                      </Show>
                    </div>
                    <span
                      style={{
                        ...typography.caption,
                        color: echoprax.colors.textMuted,
                      }}
                    >
                      {equipmentPreview(area)}
                    </span>
                  </button>
                );
              }}
            </For>
          </Show>

          {/* Manage Areas Link */}
          <Show when={props.onManageAreas}>
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                props.onManageAreas?.();
              }}
              style={{
                width: '100%',
                padding: echoprax.spacing.sm,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: memphisColors.electricBlue,
                ...typography.caption,
                'text-align': 'center',
                'margin-top': echoprax.spacing.sm,
                'border-top': `1px solid ${echoprax.colors.border}`,
                'padding-top': echoprax.spacing.md,
              }}
            >
              + Manage Workout Areas
            </button>
          </Show>
        </div>
      </Show>
    </div>
  );
};
