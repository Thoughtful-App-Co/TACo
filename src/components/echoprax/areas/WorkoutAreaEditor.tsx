/**
 * WorkoutAreaEditor - Create/edit workout areas
 *
 * Equipment checklist organized by category + space constraints
 *
 * Memphis x Retro-Futurism Design
 */

import { Component, createSignal, createMemo, For, Show, createResource, onMount } from 'solid-js';
import { WorkoutAreaService } from '../lib/workout-area.service';
import type { WorkoutArea, SpaceConstraints } from '../../../schemas/echoprax.schema';
import {
  echoprax,
  memphisColors,
  memphisSurfaces,
  glassButton,
  typography,
} from '../../../theme/echoprax';
import { ViewHeader } from '../common/ViewHeader';
import { logger } from '../../../lib/logger';

const log = logger.create('WorkoutAreaEditor');

interface EquipmentItem {
  id: string;
  name: string;
  default?: boolean;
  hasWeightRange?: boolean;
  substitutesFor?: string[];
}

interface EquipmentCategory {
  id: string;
  name: string;
  description: string;
  items: EquipmentItem[];
}

interface EquipmentData {
  categories: EquipmentCategory[];
  spaceConstraints: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

interface WorkoutAreaEditorProps {
  area?: WorkoutArea; // If provided, editing existing area
  onSave: (area: WorkoutArea) => void;
  onCancel: () => void;
}

export const WorkoutAreaEditor: Component<WorkoutAreaEditorProps> = (props) => {
  const isEditing = () => !!props.area;

  // Form state
  const [name, setName] = createSignal(props.area?.name ?? '');
  const [selectedEquipment, setSelectedEquipment] = createSignal<Set<string>>(
    new Set(props.area?.equipment ?? ['floor_space'])
  );
  const [constraints, setConstraints] = createSignal<SpaceConstraints>(
    props.area?.constraints ?? {
      noJumping: false,
      noSprinting: false,
      noLyingDown: false,
      lowCeiling: false,
      mustBeQuiet: false,
      outdoorAvailable: false,
    }
  );
  const [errors, setErrors] = createSignal<string[]>([]);
  const [expandedCategories, setExpandedCategories] = createSignal<Set<string>>(new Set());

  // Load equipment data
  const [equipmentData] = createResource(async () => {
    const data = await import('../../../data/equipment.json');
    return data as unknown as EquipmentData;
  });

  // Auto-expand categories with selected items
  onMount(() => {
    if (props.area) {
      const data = equipmentData();
      if (data) {
        const expanded = new Set<string>();
        for (const cat of data.categories) {
          if (cat.items.some((item) => props.area!.equipment.includes(item.id))) {
            expanded.add(cat.id);
          }
        }
        setExpandedCategories(expanded);
      }
    }
  });

  const toggleEquipment = (id: string) => {
    const current = new Set(selectedEquipment());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    setSelectedEquipment(current);
  };

  const toggleCategory = (categoryId: string) => {
    const current = new Set(expandedCategories());
    if (current.has(categoryId)) {
      current.delete(categoryId);
    } else {
      current.add(categoryId);
    }
    setExpandedCategories(current);
  };

  const toggleConstraint = (key: keyof SpaceConstraints) => {
    setConstraints((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectedCount = createMemo(() => selectedEquipment().size);

  const validate = (): boolean => {
    const newErrors: string[] = [];
    if (!name().trim()) {
      newErrors.push('Area name is required');
    }
    if (selectedEquipment().size === 0) {
      newErrors.push('Select at least one piece of equipment');
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      log.warn('Validation failed', { errors: errors() });
      return;
    }

    try {
      const now = new Date();
      const area: WorkoutArea = {
        id: props.area?.id ?? crypto.randomUUID(),
        name: name().trim(),
        equipment: Array.from(selectedEquipment()),
        constraints: constraints(),
        isDefault: props.area?.isDefault ?? WorkoutAreaService.getAreas().length === 0,
        createdAt: props.area?.createdAt ?? now,
        updatedAt: now,
      };

      WorkoutAreaService.saveArea(area);
      log.info('Saved workout area', { id: area.id, name: area.name });
      props.onSave(area);
    } catch (error) {
      log.error('Failed to save area', error);
      setErrors(['Failed to save. Please try again.']);
    }
  };

  const constraintLabels: Record<keyof SpaceConstraints, { label: string; description: string }> = {
    noJumping: { label: "Can't Jump", description: 'Apartment, downstairs neighbors' },
    noSprinting: { label: "Can't Sprint", description: 'No running space available' },
    noLyingDown: { label: "Can't Lie Down", description: 'Limited floor space' },
    lowCeiling: { label: 'Low Ceiling', description: 'Basement, attic, or low clearance' },
    mustBeQuiet: { label: 'Must Be Quiet', description: 'Early morning, shared space' },
    outdoorAvailable: { label: 'Outdoor Space', description: 'Access to yard or park' },
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
        title={isEditing() ? 'Edit Area' : 'New Workout Area'}
        onBack={() => props.onCancel()}
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
        {/* Errors */}
        <Show when={errors().length > 0}>
          <div
            style={{
              background: `${memphisColors.coral}20`,
              border: `1px solid ${memphisColors.coral}`,
              'border-radius': echoprax.radii.md,
              padding: echoprax.spacing.md,
              'margin-bottom': echoprax.spacing.lg,
            }}
          >
            <For each={errors()}>
              {(error) => (
                <p style={{ ...typography.bodySm, color: memphisColors.coral, margin: 0 }}>
                  {error}
                </p>
              )}
            </For>
          </div>
        </Show>

        {/* Name Input */}
        <section
          style={{
            ...memphisSurfaces.card,
            padding: echoprax.spacing.lg,
            'margin-bottom': echoprax.spacing.lg,
          }}
        >
          <label
            for="area-name"
            style={{
              ...typography.label,
              color: memphisColors.hotPink,
              display: 'block',
              'margin-bottom': echoprax.spacing.sm,
            }}
          >
            Area Name *
          </label>
          <input
            id="area-name"
            type="text"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            placeholder="My Home Gym, Planet Fitness, etc."
            style={{
              width: '100%',
              padding: echoprax.spacing.md,
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${echoprax.colors.border}`,
              'border-radius': echoprax.radii.md,
              color: echoprax.colors.text,
              ...typography.body,
              'box-sizing': 'border-box',
            }}
          />
        </section>

        {/* Equipment Section */}
        <section
          style={{
            ...memphisSurfaces.card,
            padding: echoprax.spacing.lg,
            'margin-bottom': echoprax.spacing.lg,
          }}
        >
          <div
            style={{
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'center',
              'margin-bottom': echoprax.spacing.md,
            }}
          >
            <h2
              style={{
                ...typography.label,
                color: memphisColors.electricBlue,
                margin: 0,
              }}
            >
              Equipment Available
            </h2>
            <span
              style={{
                ...typography.caption,
                color: echoprax.colors.textMuted,
              }}
            >
              {selectedCount()} selected
            </span>
          </div>

          <Show
            when={!equipmentData.loading && equipmentData()}
            fallback={<p style={{ color: echoprax.colors.textMuted }}>Loading equipment...</p>}
          >
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: echoprax.spacing.sm }}>
              <For each={equipmentData()?.categories}>
                {(category) => {
                  const categorySelected = createMemo(
                    () => category.items.filter((item) => selectedEquipment().has(item.id)).length
                  );
                  const isExpanded = () => expandedCategories().has(category.id);

                  return (
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        'border-radius': echoprax.radii.md,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Category Header */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        style={{
                          width: '100%',
                          padding: echoprax.spacing.md,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'space-between',
                          color: echoprax.colors.text,
                        }}
                      >
                        <span style={{ ...typography.bodySm, 'font-weight': '600' }}>
                          {category.name}
                        </span>
                        <span
                          style={{
                            display: 'flex',
                            'align-items': 'center',
                            gap: echoprax.spacing.sm,
                          }}
                        >
                          <Show when={categorySelected() > 0}>
                            <span
                              style={{
                                ...typography.caption,
                                color: memphisColors.mintGreen,
                                background: `${memphisColors.mintGreen}20`,
                                padding: `2px ${echoprax.spacing.xs}`,
                                'border-radius': echoprax.radii.sm,
                              }}
                            >
                              {categorySelected()}
                            </span>
                          </Show>
                          <span style={{ color: echoprax.colors.textMuted }}>
                            {isExpanded() ? '-' : '+'}
                          </span>
                        </span>
                      </button>

                      {/* Category Items */}
                      <Show when={isExpanded()}>
                        <div
                          style={{
                            padding: `0 ${echoprax.spacing.md} ${echoprax.spacing.md}`,
                            display: 'flex',
                            'flex-wrap': 'wrap',
                            gap: echoprax.spacing.xs,
                          }}
                        >
                          <For each={category.items}>
                            {(item) => {
                              const isSelected = () => selectedEquipment().has(item.id);
                              return (
                                <button
                                  type="button"
                                  onClick={() => toggleEquipment(item.id)}
                                  style={{
                                    padding: `${echoprax.spacing.xs} ${echoprax.spacing.sm}`,
                                    'border-radius': echoprax.radii.sm,
                                    border: isSelected()
                                      ? `1px solid ${memphisColors.mintGreen}`
                                      : `1px solid ${echoprax.colors.border}`,
                                    background: isSelected()
                                      ? `${memphisColors.mintGreen}20`
                                      : 'transparent',
                                    color: isSelected()
                                      ? memphisColors.mintGreen
                                      : echoprax.colors.textMuted,
                                    cursor: 'pointer',
                                    ...typography.caption,
                                  }}
                                >
                                  {isSelected() ? 'v ' : ''}
                                  {item.name}
                                </button>
                              );
                            }}
                          </For>
                        </div>
                      </Show>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        </section>

        {/* Space Constraints Section */}
        <section
          style={{
            ...memphisSurfaces.card,
            padding: echoprax.spacing.lg,
            'margin-bottom': echoprax.spacing.xl,
          }}
        >
          <h2
            style={{
              ...typography.label,
              color: memphisColors.acidYellow,
              margin: 0,
              'margin-bottom': echoprax.spacing.md,
            }}
          >
            Space Restrictions
          </h2>

          <div style={{ display: 'flex', 'flex-direction': 'column', gap: echoprax.spacing.sm }}>
            <For each={Object.entries(constraintLabels)}>
              {([key, { label, description }]) => {
                const isActive = () => constraints()[key as keyof SpaceConstraints];
                return (
                  <button
                    type="button"
                    onClick={() => toggleConstraint(key as keyof SpaceConstraints)}
                    style={{
                      display: 'flex',
                      'align-items': 'center',
                      gap: echoprax.spacing.md,
                      padding: echoprax.spacing.md,
                      background: isActive() ? `${memphisColors.acidYellow}10` : 'transparent',
                      border: isActive()
                        ? `1px solid ${memphisColors.acidYellow}50`
                        : `1px solid transparent`,
                      'border-radius': echoprax.radii.md,
                      cursor: 'pointer',
                      'text-align': 'left',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        'border-radius': echoprax.radii.sm,
                        border: `2px solid ${isActive() ? memphisColors.acidYellow : echoprax.colors.border}`,
                        background: isActive() ? memphisColors.acidYellow : 'transparent',
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        color: isActive() ? '#000' : 'transparent',
                        'font-size': '14px',
                        'font-weight': 'bold',
                        'flex-shrink': 0,
                      }}
                    >
                      {isActive() ? 'v' : ''}
                    </div>
                    <div>
                      <div
                        style={{
                          ...typography.bodySm,
                          color: isActive() ? memphisColors.acidYellow : echoprax.colors.text,
                          'font-weight': isActive() ? '600' : '400',
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          ...typography.caption,
                          color: echoprax.colors.textMuted,
                        }}
                      >
                        {description}
                      </div>
                    </div>
                  </button>
                );
              }}
            </For>
          </div>
        </section>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          class="echoprax-glass-btn"
          style={{
            ...glassButton.primary,
            width: '100%',
            padding: echoprax.spacing.lg,
            'border-radius': echoprax.radii.md,
            cursor: 'pointer',
            color: memphisColors.hotPink,
            ...typography.body,
            'font-weight': '600',
          }}
        >
          {isEditing() ? 'Save Changes' : 'Create Area'}
        </button>
      </div>
    </div>
  );
};
