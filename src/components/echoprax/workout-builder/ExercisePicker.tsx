/**
 * ExercisePicker - Modal for selecting exercises from the library
 *
 * Filters exercises based on the selected workout area's equipment and constraints.
 * Shows available exercises prominently and unavailable ones grayed out with reasons.
 *
 * Memphis x Retro-Futurism Design
 */

import { Component, createSignal, createResource, createMemo, For, Show } from 'solid-js';
import type { Exercise, WorkoutBlock, WorkoutArea } from '../../../schemas/echoprax.schema';
import {
  ExerciseLibraryService,
  type FilteredExercise,
  type BodyPart,
} from '../lib/exercise-library.service';
import {
  echoprax,
  memphisColors,
  memphisSurfaces,
  glassButton,
  typography,
} from '../../../theme/echoprax';
import { logger } from '../../../lib/logger';

const log = logger.create('ExercisePicker');

type WorkoutSection = 'warmup' | 'main' | 'cooldown';

interface ExercisePickerProps {
  onSelect: (block: WorkoutBlock, section: WorkoutSection) => void;
  onCancel: () => void;
  defaultSection?: WorkoutSection;
  /** When provided, filters exercises by area equipment and constraints */
  selectedArea?: WorkoutArea;
}

// Section colors matching the design spec
const sectionColors: Record<WorkoutSection, string> = {
  warmup: memphisColors.acidYellow,
  main: memphisColors.hotPink,
  cooldown: memphisColors.electricBlue,
};

// Body part categories for filtering
const bodyPartCategories: Array<{ id: BodyPart; label: string }> = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'legs', label: 'Legs' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'core', label: 'Core' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'full_body', label: 'Full Body' },
  { id: 'flexibility', label: 'Flexibility' },
];

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

export const ExercisePicker: Component<ExercisePickerProps> = (props) => {
  const [step, setStep] = createSignal<'select' | 'configure'>('select');
  const [selectedExercise, setSelectedExercise] = createSignal<Exercise | null>(null);
  const [selectedSection, setSelectedSection] = createSignal<WorkoutSection>(
    props.defaultSection || 'main'
  );
  const [duration, setDuration] = createSignal(30);
  const [restAfter, setRestAfter] = createSignal(15);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedBodyPart, setSelectedBodyPart] = createSignal<BodyPart | 'all'>('all');
  const [showUnavailable, setShowUnavailable] = createSignal(true);

  // Load exercises based on area (or all if no area)
  const [exercises, { refetch }] = createResource(
    () => ({
      area: props.selectedArea,
      bodyPart: selectedBodyPart(),
      query: searchQuery(),
    }),
    async (params) => {
      const { area, bodyPart, query } = params;

      if (area) {
        // Filter by area equipment and constraints
        const filtered = await ExerciseLibraryService.getExercisesForArea(area, {
          bodyParts: bodyPart !== 'all' ? [bodyPart] : undefined,
          searchQuery: query || undefined,
        });
        log.debug('Loaded filtered exercises', {
          total: filtered.length,
          available: filtered.filter((e) => e.isAvailable).length,
        });
        return filtered;
      } else {
        // No area - load all exercises (for backward compat or demo)
        const all = await ExerciseLibraryService.getExercisesForArea(
          {
            id: 'temp',
            name: 'Temp',
            equipment: [], // Empty equipment = nothing available
            constraints: {
              noJumping: false,
              noSprinting: false,
              noLyingDown: false,
              lowCeiling: false,
              mustBeQuiet: false,
              outdoorAvailable: false,
            },
            isDefault: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            bodyParts: bodyPart !== 'all' ? [bodyPart] : undefined,
            searchQuery: query || undefined,
          }
        );

        // Mark all as available when no area is selected (demo mode)
        return all.map((e) => ({
          ...e,
          isAvailable: true,
          missingEquipment: [],
          constraintViolations: [],
        }));
      }
    }
  );

  // Split exercises into available and unavailable
  const availableExercises = createMemo(() => {
    const list = exercises();
    if (!list) return [];
    return list.filter((e) => e.isAvailable);
  });

  const unavailableExercises = createMemo(() => {
    const list = exercises();
    if (!list) return [];
    return list.filter((e) => !e.isAvailable);
  });

  const handleExerciseSelect = (exercise: FilteredExercise) => {
    if (!exercise.isAvailable) {
      log.debug('Attempted to select unavailable exercise', {
        name: exercise.name,
        missing: exercise.missingEquipment,
        violations: exercise.constraintViolations,
      });
      return;
    }

    // Convert FilteredExercise back to Exercise for the workout block
    const baseExercise: Exercise = {
      id: exercise.id,
      name: exercise.name,
      bodyPart: exercise.bodyPart,
      targetMuscle: exercise.targetMuscle,
      equipment: exercise.equipment,
      instructions: exercise.instructions,
      difficulty: exercise.difficulty,
      category: exercise.category,
      tags: exercise.tags,
      constraints: exercise.constraints,
      cues: exercise.cues,
      substitutions: exercise.substitutions,
    };

    setSelectedExercise(baseExercise);
    setStep('configure');
    log.debug('Selected exercise', { name: exercise.name });
  };

  const handleConfirm = () => {
    const exercise = selectedExercise();
    if (!exercise) return;

    const block: WorkoutBlock = {
      id: crypto.randomUUID(),
      exercise,
      duration: duration(),
      sets: 1,
      restAfter: restAfter(),
      voiceCue: `${exercise.name}. ${exercise.instructions[0]}`,
      completed: false,
    };

    log.info('Adding exercise block', {
      name: exercise.name,
      section: selectedSection(),
      duration: duration(),
      restAfter: restAfter(),
    });
    props.onSelect(block, selectedSection());
  };

  const handleBack = () => {
    setStep('select');
    setSelectedExercise(null);
  };

  const durationPresets = [15, 20, 30, 45, 60, 90];
  const restPresets = [0, 10, 15, 20, 30];

  /**
   * Get unavailability reason as a short string
   */
  const getUnavailabilityReason = (exercise: FilteredExercise): string => {
    if (exercise.missingEquipment.length > 0) {
      const missing = exercise.missingEquipment.slice(0, 2).join(', ').replace(/_/g, ' ');
      if (exercise.missingEquipment.length > 2) {
        return `Needs ${missing} +${exercise.missingEquipment.length - 2} more`;
      }
      return `Needs ${missing}`;
    }
    if (exercise.constraintViolations.length > 0) {
      return exercise.constraintViolations[0];
    }
    return 'Unavailable';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-picker-title"
      style={{
        position: 'fixed',
        inset: 0,
        'z-index': 1000,
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        padding: echoprax.spacing.lg,
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          'backdrop-filter': 'blur(8px)',
        }}
        onClick={() => props.onCancel()}
      />

      {/* Modal content */}
      <div
        style={{
          ...memphisSurfaces.elevated,
          width: '100%',
          'max-width': '500px',
          'max-height': '85vh',
          overflow: 'hidden',
          display: 'flex',
          'flex-direction': 'column',
          position: 'relative',
          'z-index': 1,
        }}
      >
        {/* Step 1: Exercise Selection */}
        <Show when={step() === 'select'}>
          {/* Header */}
          <div
            style={{
              padding: echoprax.spacing.xl,
              'border-bottom': `1px solid ${echoprax.colors.border}`,
            }}
          >
            <h2
              id="exercise-picker-title"
              style={{
                ...typography.headingMd,
                color: echoprax.colors.text,
                margin: 0,
              }}
            >
              Add Exercise
            </h2>
            <p
              style={{
                ...typography.bodySm,
                color: echoprax.colors.textMuted,
                margin: `${echoprax.spacing.xs} 0 0 0`,
              }}
            >
              {props.selectedArea
                ? `Filtered for "${props.selectedArea.name}"`
                : 'Select an exercise from the library'}
            </p>

            {/* Section selector */}
            <div
              style={{
                display: 'flex',
                gap: echoprax.spacing.sm,
                'margin-top': echoprax.spacing.md,
              }}
            >
              <For each={['warmup', 'main', 'cooldown'] as WorkoutSection[]}>
                {(section) => (
                  <button
                    type="button"
                    onClick={() => setSelectedSection(section)}
                    class="echoprax-glass-btn"
                    style={{
                      ...(selectedSection() === section ? glassButton.active : glassButton.default),
                      'border-radius': echoprax.radii.sm,
                      padding: `${echoprax.spacing.xs} ${echoprax.spacing.md}`,
                      ...typography.label,
                      color:
                        selectedSection() === section
                          ? sectionColors[section]
                          : echoprax.colors.textMuted,
                      cursor: 'pointer',
                      border:
                        selectedSection() === section
                          ? `1px solid ${sectionColors[section]}`
                          : glassButton.default.border,
                      'text-transform': 'uppercase',
                    }}
                  >
                    {section}
                  </button>
                )}
              </For>
            </div>

            {/* Search and filters */}
            <div
              style={{
                'margin-top': echoprax.spacing.md,
                display: 'flex',
                'flex-direction': 'column',
                gap: echoprax.spacing.sm,
              }}
            >
              {/* Search Input */}
              <input
                type="text"
                value={searchQuery()}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
                placeholder="Search exercises..."
                style={{
                  width: '100%',
                  padding: echoprax.spacing.sm,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${echoprax.colors.border}`,
                  'border-radius': echoprax.radii.sm,
                  color: echoprax.colors.text,
                  ...typography.bodySm,
                  'box-sizing': 'border-box',
                }}
              />

              {/* Body Part Filter */}
              <div
                style={{
                  display: 'flex',
                  gap: echoprax.spacing.xs,
                  'flex-wrap': 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedBodyPart('all')}
                  class="echoprax-glass-btn"
                  style={{
                    ...(selectedBodyPart() === 'all' ? glassButton.active : glassButton.default),
                    'border-radius': echoprax.radii.sm,
                    padding: `${echoprax.spacing.xs} ${echoprax.spacing.sm}`,
                    ...typography.caption,
                    color:
                      selectedBodyPart() === 'all'
                        ? memphisColors.mintGreen
                        : echoprax.colors.textMuted,
                    cursor: 'pointer',
                    border:
                      selectedBodyPart() === 'all'
                        ? `1px solid ${memphisColors.mintGreen}`
                        : glassButton.default.border,
                  }}
                >
                  All
                </button>
                <For each={bodyPartCategories}>
                  {(cat) => (
                    <button
                      type="button"
                      onClick={() => setSelectedBodyPart(cat.id)}
                      class="echoprax-glass-btn"
                      style={{
                        ...(selectedBodyPart() === cat.id
                          ? glassButton.active
                          : glassButton.default),
                        'border-radius': echoprax.radii.sm,
                        padding: `${echoprax.spacing.xs} ${echoprax.spacing.sm}`,
                        ...typography.caption,
                        color:
                          selectedBodyPart() === cat.id
                            ? memphisColors.mintGreen
                            : echoprax.colors.textMuted,
                        cursor: 'pointer',
                        border:
                          selectedBodyPart() === cat.id
                            ? `1px solid ${memphisColors.mintGreen}`
                            : glassButton.default.border,
                      }}
                    >
                      {cat.label}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>

          {/* Exercise List */}
          <div
            style={{
              flex: 1,
              'overflow-y': 'auto',
              padding: echoprax.spacing.lg,
            }}
          >
            <Show
              when={!exercises.loading}
              fallback={
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'center',
                    padding: echoprax.spacing.xl,
                  }}
                >
                  <p style={{ ...typography.body, color: echoprax.colors.textMuted }}>
                    Loading exercises...
                  </p>
                </div>
              }
            >
              {/* Available exercises count */}
              <Show when={props.selectedArea}>
                <div
                  style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'align-items': 'center',
                    'margin-bottom': echoprax.spacing.md,
                  }}
                >
                  <span style={{ ...typography.caption, color: echoprax.colors.textMuted }}>
                    {availableExercises().length} available
                    {unavailableExercises().length > 0 &&
                      ` / ${unavailableExercises().length} unavailable`}
                  </span>
                  <Show when={unavailableExercises().length > 0}>
                    <button
                      type="button"
                      onClick={() => setShowUnavailable(!showUnavailable())}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: echoprax.colors.textMuted,
                        cursor: 'pointer',
                        ...typography.caption,
                        'text-decoration': 'underline',
                      }}
                    >
                      {showUnavailable() ? 'Hide' : 'Show'} unavailable
                    </button>
                  </Show>
                </div>
              </Show>

              {/* Available Exercises */}
              <div
                style={{
                  display: 'flex',
                  'flex-direction': 'column',
                  gap: echoprax.spacing.sm,
                }}
              >
                <For each={availableExercises()}>
                  {(exercise) => (
                    <ExerciseListItem
                      exercise={exercise}
                      sectionColor={sectionColors[selectedSection()]}
                      onSelect={() => handleExerciseSelect(exercise)}
                    />
                  )}
                </For>

                {/* Unavailable Exercises */}
                <Show when={showUnavailable() && unavailableExercises().length > 0}>
                  <div
                    style={{
                      'margin-top': echoprax.spacing.md,
                      'padding-top': echoprax.spacing.md,
                      'border-top': `1px solid ${echoprax.colors.border}`,
                    }}
                  >
                    <p
                      style={{
                        ...typography.caption,
                        color: echoprax.colors.textMuted,
                        'margin-bottom': echoprax.spacing.sm,
                      }}
                    >
                      Unavailable (missing equipment or constraints)
                    </p>
                    <For each={unavailableExercises()}>
                      {(exercise) => (
                        <UnavailableExerciseItem
                          exercise={exercise}
                          reason={getUnavailabilityReason(exercise)}
                        />
                      )}
                    </For>
                  </div>
                </Show>

                {/* Empty state */}
                <Show when={availableExercises().length === 0 && !exercises.loading}>
                  <div
                    style={{
                      'text-align': 'center',
                      padding: echoprax.spacing.xl,
                    }}
                  >
                    <p style={{ ...typography.body, color: echoprax.colors.textMuted }}>
                      {searchQuery()
                        ? 'No exercises match your search'
                        : 'No available exercises for this area'}
                    </p>
                    <Show when={props.selectedArea}>
                      <p
                        style={{
                          ...typography.caption,
                          color: echoprax.colors.textMuted,
                          'margin-top': echoprax.spacing.sm,
                        }}
                      >
                        Try adding more equipment to your workout area
                      </p>
                    </Show>
                  </div>
                </Show>
              </div>
            </Show>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: echoprax.spacing.lg,
              'border-top': `1px solid ${echoprax.colors.border}`,
              display: 'flex',
              'justify-content': 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={() => props.onCancel()}
              class="echoprax-glass-btn"
              style={{
                ...glassButton.default,
                'border-radius': echoprax.radii.md,
                padding: `${echoprax.spacing.sm} ${echoprax.spacing.lg}`,
                ...typography.body,
                color: echoprax.colors.textMuted,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </Show>

        {/* Step 2: Configure Duration/Rest */}
        <Show when={step() === 'configure' && selectedExercise()}>
          {/* Header */}
          <div
            style={{
              padding: echoprax.spacing.xl,
              'border-bottom': `1px solid ${echoprax.colors.border}`,
            }}
          >
            <button
              type="button"
              onClick={handleBack}
              style={{
                background: 'none',
                border: 'none',
                color: echoprax.colors.textMuted,
                cursor: 'pointer',
                padding: 0,
                ...typography.bodySm,
                display: 'flex',
                'align-items': 'center',
                gap: echoprax.spacing.xs,
                'margin-bottom': echoprax.spacing.sm,
              }}
            >
              ← Back
            </button>
            <h2
              style={{
                ...typography.headingMd,
                color: echoprax.colors.text,
                margin: 0,
              }}
            >
              {selectedExercise()!.name}
            </h2>
            <p
              style={{
                ...typography.bodySm,
                color: echoprax.colors.textMuted,
                margin: `${echoprax.spacing.xs} 0 0 0`,
              }}
            >
              Configure timing for{' '}
              <span
                style={{ color: sectionColors[selectedSection()], 'text-transform': 'uppercase' }}
              >
                {selectedSection()}
              </span>
            </p>
          </div>

          {/* Configuration Content */}
          <div
            style={{
              padding: echoprax.spacing.xl,
            }}
          >
            {/* Duration Section */}
            <div style={{ 'margin-bottom': echoprax.spacing.lg }}>
              <label
                style={{
                  ...typography.label,
                  color: memphisColors.hotPink,
                  display: 'block',
                  'margin-bottom': echoprax.spacing.sm,
                }}
              >
                Duration: {formatDuration(duration())}
              </label>

              {/* Duration Slider */}
              <input
                type="range"
                min="10"
                max="180"
                step="5"
                value={duration()}
                onInput={(e) => setDuration(parseInt(e.currentTarget.value))}
                style={{
                  width: '100%',
                  height: '8px',
                  'border-radius': '4px',
                  background: `linear-gradient(to right, ${memphisColors.hotPink} 0%, ${memphisColors.hotPink} ${((duration() - 10) / 170) * 100}%, rgba(255,255,255,0.1) ${((duration() - 10) / 170) * 100}%)`,
                  '-webkit-appearance': 'none',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              />

              {/* Duration Presets */}
              <div
                style={{
                  display: 'flex',
                  'flex-wrap': 'wrap',
                  gap: echoprax.spacing.xs,
                  'margin-top': echoprax.spacing.sm,
                }}
              >
                <For each={durationPresets}>
                  {(preset) => (
                    <button
                      type="button"
                      onClick={() => setDuration(preset)}
                      class="echoprax-glass-btn"
                      style={{
                        ...(duration() === preset ? glassButton.active : glassButton.default),
                        'border-radius': echoprax.radii.sm,
                        padding: `${echoprax.spacing.xs} ${echoprax.spacing.sm}`,
                        ...typography.caption,
                        color: duration() === preset ? memphisColors.hotPink : echoprax.colors.text,
                        cursor: 'pointer',
                        border:
                          duration() === preset
                            ? `1px solid ${memphisColors.hotPink}`
                            : glassButton.default.border,
                      }}
                    >
                      {formatDuration(preset)}
                    </button>
                  )}
                </For>
              </div>
            </div>

            {/* Rest Section */}
            <div style={{ 'margin-bottom': echoprax.spacing.lg }}>
              <label
                style={{
                  ...typography.label,
                  color: memphisColors.electricBlue,
                  display: 'block',
                  'margin-bottom': echoprax.spacing.sm,
                }}
              >
                Rest After: {formatDuration(restAfter())}
              </label>

              {/* Rest Slider */}
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={restAfter()}
                onInput={(e) => setRestAfter(parseInt(e.currentTarget.value))}
                style={{
                  width: '100%',
                  height: '8px',
                  'border-radius': '4px',
                  background: `linear-gradient(to right, ${memphisColors.electricBlue} 0%, ${memphisColors.electricBlue} ${(restAfter() / 60) * 100}%, rgba(255,255,255,0.1) ${(restAfter() / 60) * 100}%)`,
                  '-webkit-appearance': 'none',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              />

              {/* Rest Presets */}
              <div
                style={{
                  display: 'flex',
                  'flex-wrap': 'wrap',
                  gap: echoprax.spacing.xs,
                  'margin-top': echoprax.spacing.sm,
                }}
              >
                <For each={restPresets}>
                  {(preset) => (
                    <button
                      type="button"
                      onClick={() => setRestAfter(preset)}
                      class="echoprax-glass-btn"
                      style={{
                        ...(restAfter() === preset ? glassButton.active : glassButton.default),
                        'border-radius': echoprax.radii.sm,
                        padding: `${echoprax.spacing.xs} ${echoprax.spacing.sm}`,
                        ...typography.caption,
                        color:
                          restAfter() === preset
                            ? memphisColors.electricBlue
                            : echoprax.colors.text,
                        cursor: 'pointer',
                        border:
                          restAfter() === preset
                            ? `1px solid ${memphisColors.electricBlue}`
                            : glassButton.default.border,
                      }}
                    >
                      {preset === 0 ? 'None' : formatDuration(preset)}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: echoprax.spacing.lg,
              'border-top': `1px solid ${echoprax.colors.border}`,
              display: 'flex',
              gap: echoprax.spacing.md,
              'justify-content': 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={() => props.onCancel()}
              class="echoprax-glass-btn"
              style={{
                ...glassButton.default,
                'border-radius': echoprax.radii.md,
                padding: `${echoprax.spacing.sm} ${echoprax.spacing.lg}`,
                ...typography.body,
                color: echoprax.colors.textMuted,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              class="echoprax-glass-btn"
              style={{
                ...glassButton.primary,
                'border-radius': echoprax.radii.md,
                padding: `${echoprax.spacing.sm} ${echoprax.spacing.lg}`,
                ...typography.body,
                'font-weight': '600',
                color: memphisColors.hotPink,
                cursor: 'pointer',
              }}
            >
              Add Exercise
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ExerciseListItemProps {
  exercise: FilteredExercise;
  sectionColor: string;
  onSelect: () => void;
}

const ExerciseListItem: Component<ExerciseListItemProps> = (props) => {
  return (
    <button
      type="button"
      onClick={() => props.onSelect()}
      class="echoprax-glass-btn"
      style={{
        ...glassButton.default,
        'border-radius': echoprax.radii.md,
        padding: echoprax.spacing.md,
        'text-align': 'left',
        cursor: 'pointer',
        display: 'flex',
        'align-items': 'center',
        gap: echoprax.spacing.md,
        width: '100%',
      }}
    >
      {/* Exercise Icon */}
      <div
        style={{
          width: '40px',
          height: '40px',
          'border-radius': echoprax.radii.sm,
          background: props.sectionColor,
          opacity: 0.2,
          'flex-shrink': 0,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        }}
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            'border-radius': '50%',
            background: props.sectionColor,
          }}
        />
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
          {props.exercise.name}
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
          <span style={{ color: memphisColors.coral, 'text-transform': 'capitalize' }}>
            {props.exercise.targetMuscle}
          </span>
          <span>•</span>
          <span style={{ 'text-transform': 'capitalize' }}>
            {props.exercise.equipment.length > 0
              ? props.exercise.equipment.slice(0, 2).join(', ').replace(/_/g, ' ')
              : 'No equipment'}
            {props.exercise.equipment.length > 2 && ` +${props.exercise.equipment.length - 2}`}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <div
        style={{
          color: echoprax.colors.textMuted,
          ...typography.body,
        }}
      >
        →
      </div>
    </button>
  );
};

interface UnavailableExerciseItemProps {
  exercise: FilteredExercise;
  reason: string;
}

const UnavailableExerciseItem: Component<UnavailableExerciseItemProps> = (props) => {
  return (
    <div
      style={{
        ...glassButton.default,
        'border-radius': echoprax.radii.md,
        padding: echoprax.spacing.md,
        'text-align': 'left',
        display: 'flex',
        'align-items': 'center',
        gap: echoprax.spacing.md,
        width: '100%',
        opacity: 0.5,
        cursor: 'not-allowed',
        'margin-bottom': echoprax.spacing.xs,
      }}
    >
      {/* Exercise Icon (grayed) */}
      <div
        style={{
          width: '40px',
          height: '40px',
          'border-radius': echoprax.radii.sm,
          background: echoprax.colors.border,
          'flex-shrink': 0,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        }}
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            'border-radius': '50%',
            background: echoprax.colors.textMuted,
          }}
        />
      </div>

      {/* Exercise Info */}
      <div style={{ flex: 1, 'min-width': 0 }}>
        <div
          style={{
            ...typography.body,
            'font-weight': '600',
            color: echoprax.colors.textMuted,
          }}
        >
          {props.exercise.name}
        </div>
        <div
          style={{
            ...typography.caption,
            color: memphisColors.coral,
            'margin-top': '2px',
          }}
        >
          {props.reason}
        </div>
      </div>
    </div>
  );
};
