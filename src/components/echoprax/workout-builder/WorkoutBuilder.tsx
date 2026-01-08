/**
 * WorkoutBuilder - Create and edit workout sessions
 *
 * Memphis × Retro-Futurism Design
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

import { Component, createSignal, createMemo, For, Show } from 'solid-js';
import type {
  WorkoutSession,
  WorkoutBlock,
  BPMRange,
  WorkoutArea,
} from '../../../schemas/echoprax.schema';
import {
  echoprax,
  memphisColors,
  memphisSurfaces,
  glassButton,
  typography,
} from '../../../theme/echoprax';
import { ViewHeader } from '../common/ViewHeader';
import { ExercisePicker } from './ExercisePicker';
import { ExerciseEditor } from './ExerciseEditor';
import { logger } from '../../../lib/logger';

const log = logger.create('WorkoutBuilder');

type WorkoutSection = 'warmup' | 'main' | 'cooldown';

interface WorkoutBuilderProps {
  onSave: (workout: WorkoutSession) => void;
  onCancel: () => void;
  initialWorkout?: WorkoutSession;
  /** When provided, filters exercises by area equipment and constraints */
  selectedArea?: WorkoutArea;
}

// BPM Presets
const bpmPresets: Array<{ label: string; min: number; max: number }> = [
  { label: 'Low Intensity', min: 100, max: 120 },
  { label: 'Moderate', min: 120, max: 140 },
  { label: 'High Intensity', min: 140, max: 170 },
];

// Section colors
const sectionColors: Record<WorkoutSection, string> = {
  warmup: memphisColors.acidYellow,
  main: memphisColors.hotPink,
  cooldown: memphisColors.electricBlue,
};

/**
 * Format seconds as MM:SS display
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${secs}s`;
}

/**
 * Calculate total workout duration from all blocks
 */
function calculateTotalDuration(
  warmup: WorkoutBlock[],
  main: WorkoutBlock[],
  cooldown: WorkoutBlock[]
): number {
  const sumBlocks = (blocks: WorkoutBlock[]) =>
    blocks.reduce((sum, block) => sum + block.duration + block.restAfter, 0);

  return sumBlocks(warmup) + sumBlocks(main) + sumBlocks(cooldown);
}

export const WorkoutBuilder: Component<WorkoutBuilderProps> = (props) => {
  // Form state
  const [name, setName] = createSignal(props.initialWorkout?.name || '');
  const [description, setDescription] = createSignal(props.initialWorkout?.description || '');
  const [warmupBlocks, setWarmupBlocks] = createSignal<WorkoutBlock[]>(
    props.initialWorkout?.warmup || []
  );
  const [mainBlocks, setMainBlocks] = createSignal<WorkoutBlock[]>(
    props.initialWorkout?.main || []
  );
  const [cooldownBlocks, setCooldownBlocks] = createSignal<WorkoutBlock[]>(
    props.initialWorkout?.cooldown || []
  );
  const [bpmRange, setBpmRange] = createSignal<BPMRange>(
    props.initialWorkout?.targetBpm || { min: 140, max: 170, label: 'High Intensity' }
  );

  // UI state
  const [showExercisePicker, setShowExercisePicker] = createSignal(false);
  const [editingBlock, setEditingBlock] = createSignal<{
    block: WorkoutBlock;
    section: WorkoutSection;
  } | null>(null);
  const [errors, setErrors] = createSignal<string[]>([]);

  // Computed values
  const totalDuration = createMemo(() =>
    calculateTotalDuration(warmupBlocks(), mainBlocks(), cooldownBlocks())
  );

  const totalExercises = createMemo(
    () => warmupBlocks().length + mainBlocks().length + cooldownBlocks().length
  );

  const isEditing = createMemo(() => !!props.initialWorkout);

  // Handlers
  const handleAddExercise = (block: WorkoutBlock, section: WorkoutSection) => {
    switch (section) {
      case 'warmup':
        setWarmupBlocks([...warmupBlocks(), block]);
        break;
      case 'main':
        setMainBlocks([...mainBlocks(), block]);
        break;
      case 'cooldown':
        setCooldownBlocks([...cooldownBlocks(), block]);
        break;
    }
    setShowExercisePicker(false);
    log.debug('Added exercise', { name: block.exercise.name, section });
  };

  const handleUpdateBlock = (updatedBlock: WorkoutBlock) => {
    const edit = editingBlock();
    if (!edit) return;

    const updateArray = (blocks: WorkoutBlock[]) =>
      blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b));

    switch (edit.section) {
      case 'warmup':
        setWarmupBlocks(updateArray(warmupBlocks()));
        break;
      case 'main':
        setMainBlocks(updateArray(mainBlocks()));
        break;
      case 'cooldown':
        setCooldownBlocks(updateArray(cooldownBlocks()));
        break;
    }

    setEditingBlock(null);
    log.debug('Updated exercise', { id: updatedBlock.id, section: edit.section });
  };

  const handleDeleteBlock = (blockId: string, section: WorkoutSection) => {
    const removeFromArray = (blocks: WorkoutBlock[]) => blocks.filter((b) => b.id !== blockId);

    switch (section) {
      case 'warmup':
        setWarmupBlocks(removeFromArray(warmupBlocks()));
        break;
      case 'main':
        setMainBlocks(removeFromArray(mainBlocks()));
        break;
      case 'cooldown':
        setCooldownBlocks(removeFromArray(cooldownBlocks()));
        break;
    }
    log.debug('Deleted exercise', { blockId, section });
  };

  const handleMoveBlock = (blockId: string, section: WorkoutSection, direction: 'up' | 'down') => {
    const moveInArray = (blocks: WorkoutBlock[]) => {
      const index = blocks.findIndex((b) => b.id === blockId);
      if (index === -1) return blocks;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= blocks.length) return blocks;

      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      return newBlocks;
    };

    switch (section) {
      case 'warmup':
        setWarmupBlocks(moveInArray(warmupBlocks()));
        break;
      case 'main':
        setMainBlocks(moveInArray(mainBlocks()));
        break;
      case 'cooldown':
        setCooldownBlocks(moveInArray(cooldownBlocks()));
        break;
    }
  };

  const handleBPMPreset = (preset: (typeof bpmPresets)[0]) => {
    setBpmRange({ min: preset.min, max: preset.max, label: preset.label });
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!name().trim()) {
      newErrors.push('Workout name is required');
    }

    if (mainBlocks().length === 0) {
      newErrors.push('At least one exercise is required in the main section');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      log.warn('Validation failed', { errors: errors() });
      return;
    }

    const workout: WorkoutSession = {
      id: props.initialWorkout?.id || crypto.randomUUID(),
      name: name().trim(),
      description: description().trim() || undefined,
      warmup: warmupBlocks().length > 0 ? warmupBlocks() : undefined,
      main: mainBlocks(),
      cooldown: cooldownBlocks().length > 0 ? cooldownBlocks() : undefined,
      totalDuration: totalDuration(),
      targetBpm: bpmRange(),
      createdAt: props.initialWorkout?.createdAt || new Date(),
      status: props.initialWorkout?.status || 'draft',
    };

    log.info('Saving workout', { id: workout.id, name: workout.name });
    props.onSave(workout);
  };

  // Render block list for a section
  const renderBlockList = (blocks: WorkoutBlock[], section: WorkoutSection) => (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        gap: echoprax.spacing.sm,
      }}
    >
      <For each={blocks}>
        {(block, index) => (
          <div
            style={{
              ...glassButton.default,
              'border-radius': echoprax.radii.md,
              padding: echoprax.spacing.md,
              display: 'flex',
              'align-items': 'center',
              gap: echoprax.spacing.md,
            }}
          >
            {/* Reorder buttons */}
            <div
              style={{
                display: 'flex',
                'flex-direction': 'column',
                gap: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => handleMoveBlock(block.id, section, 'up')}
                disabled={index() === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: index() === 0 ? echoprax.colors.border : echoprax.colors.textMuted,
                  cursor: index() === 0 ? 'default' : 'pointer',
                  padding: '2px',
                  'font-size': '12px',
                  'line-height': 1,
                }}
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => handleMoveBlock(block.id, section, 'down')}
                disabled={index() === blocks.length - 1}
                style={{
                  background: 'none',
                  border: 'none',
                  color:
                    index() === blocks.length - 1
                      ? echoprax.colors.border
                      : echoprax.colors.textMuted,
                  cursor: index() === blocks.length - 1 ? 'default' : 'pointer',
                  padding: '2px',
                  'font-size': '12px',
                  'line-height': 1,
                }}
                aria-label="Move down"
              >
                ▼
              </button>
            </div>

            {/* Exercise Info */}
            <div style={{ flex: 1, 'min-width': 0 }}>
              <div
                style={{
                  ...typography.body,
                  'font-weight': '600',
                  color: echoprax.colors.text,
                }}
              >
                {block.exercise.name}
              </div>
              <div
                style={{
                  ...typography.caption,
                  color: echoprax.colors.textMuted,
                  display: 'flex',
                  gap: echoprax.spacing.sm,
                  'margin-top': '2px',
                }}
              >
                <span style={{ color: memphisColors.hotPink }}>
                  {formatDuration(block.duration)}
                </span>
                <Show when={block.restAfter > 0}>
                  <span>•</span>
                  <span style={{ color: memphisColors.electricBlue }}>
                    {formatDuration(block.restAfter)} rest
                  </span>
                </Show>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: echoprax.spacing.xs }}>
              <button
                type="button"
                onClick={() => setEditingBlock({ block, section })}
                class="echoprax-glass-btn"
                style={{
                  ...glassButton.default,
                  'border-radius': echoprax.radii.sm,
                  padding: echoprax.spacing.xs,
                  cursor: 'pointer',
                  color: echoprax.colors.textMuted,
                  'font-size': '14px',
                }}
                aria-label={`Edit ${block.exercise.name}`}
              >
                ✎
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBlock(block.id, section)}
                class="echoprax-glass-btn"
                style={{
                  ...glassButton.default,
                  'border-radius': echoprax.radii.sm,
                  padding: echoprax.spacing.xs,
                  cursor: 'pointer',
                  color: memphisColors.coral,
                  'font-size': '14px',
                }}
                aria-label={`Delete ${block.exercise.name}`}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </For>
    </div>
  );

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
        title={isEditing() ? 'Edit Workout' : 'Create Workout'}
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
        {/* Error Messages */}
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
                <p
                  style={{
                    ...typography.bodySm,
                    color: memphisColors.coral,
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}
            </For>
          </div>
        </Show>

        {/* Workout Info Section */}
        <section
          style={{
            ...memphisSurfaces.card,
            padding: echoprax.spacing.lg,
            'margin-bottom': echoprax.spacing.lg,
          }}
        >
          <h2
            style={{
              ...typography.label,
              color: memphisColors.acidYellow,
              'margin-bottom': echoprax.spacing.md,
            }}
          >
            Workout Info
          </h2>

          {/* Name Input */}
          <div style={{ 'margin-bottom': echoprax.spacing.md }}>
            <label
              for="workout-name"
              style={{
                ...typography.bodySm,
                color: echoprax.colors.textMuted,
                display: 'block',
                'margin-bottom': echoprax.spacing.xs,
              }}
            >
              Name *
            </label>
            <input
              id="workout-name"
              type="text"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              placeholder="My HIIT Workout"
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
          </div>

          {/* Description Input */}
          <div style={{ 'margin-bottom': echoprax.spacing.md }}>
            <label
              for="workout-description"
              style={{
                ...typography.bodySm,
                color: echoprax.colors.textMuted,
                display: 'block',
                'margin-bottom': echoprax.spacing.xs,
              }}
            >
              Description (optional)
            </label>
            <textarea
              id="workout-description"
              value={description()}
              onInput={(e) => setDescription(e.currentTarget.value)}
              placeholder="A quick high-intensity workout..."
              rows={2}
              style={{
                width: '100%',
                padding: echoprax.spacing.md,
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${echoprax.colors.border}`,
                'border-radius': echoprax.radii.md,
                color: echoprax.colors.text,
                resize: 'vertical',
                'font-family': 'inherit',
                ...typography.body,
                'box-sizing': 'border-box',
              }}
            />
          </div>

          {/* BPM Range */}
          <div>
            <label
              style={{
                ...typography.bodySm,
                color: echoprax.colors.textMuted,
                display: 'block',
                'margin-bottom': echoprax.spacing.xs,
              }}
            >
              Target BPM Range
            </label>
            <div
              style={{
                display: 'flex',
                gap: echoprax.spacing.sm,
                'flex-wrap': 'wrap',
              }}
            >
              <For each={bpmPresets}>
                {(preset) => (
                  <button
                    type="button"
                    onClick={() => handleBPMPreset(preset)}
                    class="echoprax-glass-btn"
                    style={{
                      ...(bpmRange().label === preset.label
                        ? glassButton.active
                        : glassButton.default),
                      'border-radius': echoprax.radii.sm,
                      padding: `${echoprax.spacing.xs} ${echoprax.spacing.md}`,
                      ...typography.bodySm,
                      color:
                        bpmRange().label === preset.label
                          ? memphisColors.mintGreen
                          : echoprax.colors.textMuted,
                      cursor: 'pointer',
                      border:
                        bpmRange().label === preset.label
                          ? `1px solid ${memphisColors.mintGreen}`
                          : glassButton.default.border,
                    }}
                  >
                    {preset.label} ({preset.min}-{preset.max})
                  </button>
                )}
              </For>
            </div>
          </div>
        </section>

        {/* Warmup Section */}
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
              'align-items': 'center',
              'justify-content': 'space-between',
              'margin-bottom': echoprax.spacing.md,
            }}
          >
            <h2
              style={{
                ...typography.label,
                color: sectionColors.warmup,
                margin: 0,
              }}
            >
              Warmup ({warmupBlocks().length})
            </h2>
          </div>

          <Show
            when={warmupBlocks().length > 0}
            fallback={
              <p
                style={{
                  ...typography.bodySm,
                  color: echoprax.colors.textMuted,
                  'text-align': 'center',
                  padding: echoprax.spacing.md,
                }}
              >
                No warmup exercises yet
              </p>
            }
          >
            {renderBlockList(warmupBlocks(), 'warmup')}
          </Show>
        </section>

        {/* Main Section */}
        <section
          style={{
            ...memphisSurfaces.card,
            padding: echoprax.spacing.lg,
            'margin-bottom': echoprax.spacing.lg,
            border: `1px solid ${sectionColors.main}40`,
          }}
        >
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
              'margin-bottom': echoprax.spacing.md,
            }}
          >
            <h2
              style={{
                ...typography.label,
                color: sectionColors.main,
                margin: 0,
              }}
            >
              Main Workout ({mainBlocks().length}) *
            </h2>
          </div>

          <Show
            when={mainBlocks().length > 0}
            fallback={
              <p
                style={{
                  ...typography.bodySm,
                  color: echoprax.colors.textMuted,
                  'text-align': 'center',
                  padding: echoprax.spacing.md,
                }}
              >
                Add at least one exercise
              </p>
            }
          >
            {renderBlockList(mainBlocks(), 'main')}
          </Show>
        </section>

        {/* Cooldown Section */}
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
              'align-items': 'center',
              'justify-content': 'space-between',
              'margin-bottom': echoprax.spacing.md,
            }}
          >
            <h2
              style={{
                ...typography.label,
                color: sectionColors.cooldown,
                margin: 0,
              }}
            >
              Cooldown ({cooldownBlocks().length})
            </h2>
          </div>

          <Show
            when={cooldownBlocks().length > 0}
            fallback={
              <p
                style={{
                  ...typography.bodySm,
                  color: echoprax.colors.textMuted,
                  'text-align': 'center',
                  padding: echoprax.spacing.md,
                }}
              >
                No cooldown exercises yet
              </p>
            }
          >
            {renderBlockList(cooldownBlocks(), 'cooldown')}
          </Show>
        </section>

        {/* Add Exercise Button */}
        <button
          type="button"
          onClick={() => setShowExercisePicker(true)}
          class="echoprax-glass-btn"
          style={{
            ...glassButton.default,
            width: '100%',
            padding: echoprax.spacing.lg,
            'border-radius': echoprax.radii.lg,
            cursor: 'pointer',
            color: memphisColors.hotPink,
            ...typography.body,
            'font-weight': '600',
            'margin-bottom': echoprax.spacing.xl,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            gap: echoprax.spacing.sm,
          }}
        >
          <span style={{ 'font-size': '1.5rem' }}>+</span>
          Add Exercise
        </button>

        {/* Summary & Save */}
        <section
          style={{
            ...memphisSurfaces.elevated,
            padding: echoprax.spacing.lg,
            position: 'sticky',
            bottom: echoprax.spacing.lg,
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
            <div>
              <div
                style={{
                  ...typography.caption,
                  color: echoprax.colors.textMuted,
                }}
              >
                Total Duration
              </div>
              <div
                style={{
                  ...typography.headingMd,
                  color: memphisColors.acidYellow,
                }}
              >
                {formatDuration(totalDuration())}
              </div>
            </div>
            <div style={{ 'text-align': 'right' }}>
              <div
                style={{
                  ...typography.caption,
                  color: echoprax.colors.textMuted,
                }}
              >
                Exercises
              </div>
              <div
                style={{
                  ...typography.headingMd,
                  color: memphisColors.mintGreen,
                }}
              >
                {totalExercises()}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            class="echoprax-glass-btn"
            style={{
              ...glassButton.primary,
              width: '100%',
              padding: echoprax.spacing.md,
              'border-radius': echoprax.radii.md,
              cursor: 'pointer',
              color: memphisColors.hotPink,
              ...typography.body,
              'font-weight': '600',
            }}
          >
            {isEditing() ? 'Save Changes' : 'Create Workout'}
          </button>
        </section>
      </div>

      {/* Exercise Picker Modal */}
      <Show when={showExercisePicker()}>
        <ExercisePicker
          onSelect={handleAddExercise}
          onCancel={() => setShowExercisePicker(false)}
          defaultSection="main"
          selectedArea={props.selectedArea}
        />
      </Show>

      {/* Exercise Editor Modal */}
      <Show when={editingBlock()}>
        {(edit) => (
          <ExerciseEditor
            block={edit().block}
            onSave={handleUpdateBlock}
            onCancel={() => setEditingBlock(null)}
          />
        )}
      </Show>
    </div>
  );
};
