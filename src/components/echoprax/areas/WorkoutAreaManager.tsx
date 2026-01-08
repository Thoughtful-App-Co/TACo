/**
 * WorkoutAreaManager - List, edit, delete, and duplicate workout areas
 *
 * Full-screen management view for workout areas.
 *
 * Memphis x Retro-Futurism Design
 */

import { Component, createSignal, createResource, For, Show } from 'solid-js';
import { WorkoutAreaService } from '../lib/workout-area.service';
import type { WorkoutArea } from '../../../schemas/echoprax.schema';
import {
  echoprax,
  memphisColors,
  memphisSurfaces,
  glassButton,
  typography,
} from '../../../theme/echoprax';
import { ViewHeader } from '../common/ViewHeader';
import { logger } from '../../../lib/logger';

const log = logger.create('WorkoutAreaManager');

interface WorkoutAreaManagerProps {
  onEditArea: (area: WorkoutArea) => void;
  onCreateArea: () => void;
  onClose: () => void;
}

export const WorkoutAreaManager: Component<WorkoutAreaManagerProps> = (props) => {
  const [deleteConfirmId, setDeleteConfirmId] = createSignal<string | null>(null);

  // Load all areas
  const [areas, { refetch }] = createResource(() => WorkoutAreaService.getAreas());

  const handleSetDefault = (id: string) => {
    try {
      WorkoutAreaService.setDefaultArea(id);
      log.info('Set default area', { id });
      refetch();
    } catch (error) {
      log.error('Failed to set default area', error);
    }
  };

  const handleDuplicate = (id: string) => {
    try {
      const duplicated = WorkoutAreaService.duplicateArea(id);
      log.info('Duplicated area', { originalId: id, newId: duplicated.id });
      refetch();
    } catch (error) {
      log.error('Failed to duplicate area', error);
    }
  };

  const handleDelete = (id: string) => {
    try {
      WorkoutAreaService.deleteArea(id);
      log.info('Deleted area', { id });
      setDeleteConfirmId(null);
      refetch();
    } catch (error) {
      log.error('Failed to delete area', error);
    }
  };

  const equipmentPreview = (area: WorkoutArea) => {
    const count = area.equipment.length;
    if (count <= 3) {
      return area.equipment.join(', ').replace(/_/g, ' ');
    }
    return `${area.equipment.slice(0, 2).join(', ').replace(/_/g, ' ')} +${count - 2} more`;
  };

  const constraintsSummary = (area: WorkoutArea): string[] => {
    const summary: string[] = [];
    if (area.constraints.noJumping) summary.push('No jumping');
    if (area.constraints.noSprinting) summary.push('No sprinting');
    if (area.constraints.noLyingDown) summary.push('No lying down');
    if (area.constraints.lowCeiling) summary.push('Low ceiling');
    if (area.constraints.mustBeQuiet) summary.push('Quiet');
    if (area.constraints.outdoorAvailable) summary.push('Outdoor');
    return summary;
  };

  return (
    <div
      style={{
        'min-height': '100vh',
        background: echoprax.colors.background,
        color: echoprax.colors.text,
        'font-family': echoprax.fonts.body,
        display: 'flex',
        'flex-direction': 'column',
      }}
    >
      {/* Header with back navigation */}
      <ViewHeader
        title="Workout Areas"
        subtitle="Manage your workout locations"
        onBack={() => props.onClose()}
      />

      <div
        style={{
          flex: 1,
          'max-width': '600px',
          width: '100%',
          margin: '0 auto',
          padding: `${echoprax.spacing.md} ${echoprax.spacing.lg}`,
        }}
      >
        {/* Areas List */}
        <Show
          when={!areas.loading}
          fallback={
            <div style={{ 'text-align': 'center', padding: echoprax.spacing.xl }}>
              <p style={{ color: echoprax.colors.textMuted }}>Loading areas...</p>
            </div>
          }
        >
          <Show
            when={areas() && areas()!.length > 0}
            fallback={
              <div
                style={{
                  ...memphisSurfaces.card,
                  padding: echoprax.spacing.xl,
                  'text-align': 'center',
                }}
              >
                <p
                  style={{
                    ...typography.body,
                    color: echoprax.colors.textMuted,
                    margin: 0,
                  }}
                >
                  No workout areas yet
                </p>
                <p
                  style={{
                    ...typography.caption,
                    color: echoprax.colors.textMuted,
                    'margin-top': echoprax.spacing.sm,
                  }}
                >
                  Create your first area to get started
                </p>
              </div>
            }
          >
            <div
              style={{
                display: 'flex',
                'flex-direction': 'column',
                gap: echoprax.spacing.md,
              }}
            >
              <For each={areas()}>
                {(area) => (
                  <AreaCard
                    area={area}
                    isDeleting={deleteConfirmId() === area.id}
                    constraints={constraintsSummary(area)}
                    equipmentPreview={equipmentPreview(area)}
                    onEdit={() => props.onEditArea(area)}
                    onSetDefault={() => handleSetDefault(area.id)}
                    onDuplicate={() => handleDuplicate(area.id)}
                    onDelete={() => setDeleteConfirmId(area.id)}
                    onConfirmDelete={() => handleDelete(area.id)}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                  />
                )}
              </For>
            </div>
          </Show>
        </Show>

        {/* Create New Button */}
        <button
          type="button"
          onClick={() => props.onCreateArea()}
          class="echoprax-glass-btn"
          style={{
            ...glassButton.primary,
            width: '100%',
            padding: echoprax.spacing.lg,
            'border-radius': echoprax.radii.lg,
            cursor: 'pointer',
            color: memphisColors.hotPink,
            ...typography.body,
            'font-weight': '600',
            'margin-top': echoprax.spacing.xl,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            gap: echoprax.spacing.sm,
          }}
        >
          <span style={{ 'font-size': '1.5rem' }}>+</span>
          Create New Area
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface AreaCardProps {
  area: WorkoutArea;
  isDeleting: boolean;
  constraints: string[];
  equipmentPreview: string;
  onEdit: () => void;
  onSetDefault: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

const AreaCard: Component<AreaCardProps> = (props) => {
  return (
    <div
      style={{
        ...memphisSurfaces.card,
        padding: echoprax.spacing.lg,
        border: props.area.isDefault ? `1px solid ${memphisColors.mintGreen}40` : undefined,
      }}
    >
      {/* Area Header */}
      <div
        style={{
          display: 'flex',
          'align-items': 'flex-start',
          'justify-content': 'space-between',
          'margin-bottom': echoprax.spacing.md,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', 'align-items': 'center', gap: echoprax.spacing.sm }}>
            <h3
              style={{
                ...typography.headingSm,
                color: echoprax.colors.text,
                margin: 0,
              }}
            >
              {props.area.name}
            </h3>
            <Show when={props.area.isDefault}>
              <span
                style={{
                  ...typography.caption,
                  color: memphisColors.mintGreen,
                  background: `${memphisColors.mintGreen}20`,
                  padding: `2px ${echoprax.spacing.xs}`,
                  'border-radius': echoprax.radii.sm,
                }}
              >
                Default
              </span>
            </Show>
          </div>

          {/* Equipment Preview */}
          <p
            style={{
              ...typography.caption,
              color: echoprax.colors.textMuted,
              margin: `${echoprax.spacing.xs} 0 0`,
            }}
          >
            {props.area.equipment.length} items: {props.equipmentPreview}
          </p>

          {/* Constraints */}
          <Show when={props.constraints.length > 0}>
            <div
              style={{
                display: 'flex',
                'flex-wrap': 'wrap',
                gap: echoprax.spacing.xs,
                'margin-top': echoprax.spacing.sm,
              }}
            >
              <For each={props.constraints}>
                {(constraint) => (
                  <span
                    style={{
                      ...typography.caption,
                      color: memphisColors.acidYellow,
                      background: `${memphisColors.acidYellow}15`,
                      padding: `2px ${echoprax.spacing.xs}`,
                      'border-radius': echoprax.radii.sm,
                    }}
                  >
                    {constraint}
                  </span>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>

      {/* Action Buttons */}
      <Show
        when={!props.isDeleting}
        fallback={
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              gap: echoprax.spacing.sm,
              padding: `${echoprax.spacing.sm} 0`,
            }}
          >
            <span
              style={{
                ...typography.bodySm,
                color: memphisColors.coral,
                flex: 1,
              }}
            >
              Delete "{props.area.name}"?
            </span>
            <button
              type="button"
              onClick={() => props.onCancelDelete()}
              class="echoprax-glass-btn"
              style={{
                ...glassButton.default,
                'border-radius': echoprax.radii.sm,
                padding: `${echoprax.spacing.xs} ${echoprax.spacing.md}`,
                cursor: 'pointer',
                color: echoprax.colors.textMuted,
                ...typography.bodySm,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => props.onConfirmDelete()}
              style={{
                background: memphisColors.coral,
                border: 'none',
                'border-radius': echoprax.radii.sm,
                padding: `${echoprax.spacing.xs} ${echoprax.spacing.md}`,
                cursor: 'pointer',
                color: '#FFFFFF',
                ...typography.bodySm,
                'font-weight': '600',
              }}
            >
              Delete
            </button>
          </div>
        }
      >
        <div
          style={{
            display: 'flex',
            gap: echoprax.spacing.sm,
            'flex-wrap': 'wrap',
          }}
        >
          {/* Edit Button */}
          <button
            type="button"
            onClick={() => props.onEdit()}
            class="echoprax-glass-btn"
            style={{
              ...glassButton.default,
              flex: 1,
              'min-width': '80px',
              'border-radius': echoprax.radii.md,
              padding: echoprax.spacing.sm,
              cursor: 'pointer',
              color: memphisColors.electricBlue,
              ...typography.bodySm,
              'font-weight': '500',
            }}
          >
            Edit
          </button>

          {/* Set Default Button (only show if not already default) */}
          <Show when={!props.area.isDefault}>
            <button
              type="button"
              onClick={() => props.onSetDefault()}
              class="echoprax-glass-btn"
              style={{
                ...glassButton.default,
                flex: 1,
                'min-width': '80px',
                'border-radius': echoprax.radii.md,
                padding: echoprax.spacing.sm,
                cursor: 'pointer',
                color: memphisColors.mintGreen,
                ...typography.bodySm,
                'font-weight': '500',
              }}
            >
              Set Default
            </button>
          </Show>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => props.onDuplicate()}
            class="echoprax-glass-btn"
            style={{
              ...glassButton.default,
              'border-radius': echoprax.radii.md,
              padding: echoprax.spacing.sm,
              cursor: 'pointer',
              color: echoprax.colors.textMuted,
              ...typography.bodySm,
            }}
            aria-label="Duplicate area"
          >
            Duplicate
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => props.onDelete()}
            class="echoprax-glass-btn"
            style={{
              ...glassButton.default,
              'border-radius': echoprax.radii.md,
              padding: echoprax.spacing.sm,
              cursor: 'pointer',
              color: memphisColors.coral,
              ...typography.bodySm,
            }}
            aria-label="Delete area"
          >
            Delete
          </button>
        </div>
      </Show>
    </div>
  );
};
