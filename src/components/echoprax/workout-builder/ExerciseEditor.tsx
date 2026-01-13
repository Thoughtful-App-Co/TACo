/**
 * ExerciseEditor - Modal for editing exercise block duration and rest
 *
 * Memphis × Retro-Futurism Design
 */

import { Component, createSignal, createEffect, Show, For } from 'solid-js';
import type { WorkoutBlock } from '../../../schemas/echoprax.schema';
import {
  echoprax,
  memphisColors,
  memphisSurfaces,
  glassButton,
  typography,
} from '../../../theme/echoprax';
import { logger } from '../../../lib/logger';

const log = logger.create('ExerciseEditor');

interface ExerciseEditorProps {
  block: WorkoutBlock;
  onSave: (updatedBlock: WorkoutBlock) => void;
  onCancel: () => void;
}

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

export const ExerciseEditor: Component<ExerciseEditorProps> = (props) => {
  const [duration, setDuration] = createSignal(props.block.duration);
  const [restAfter, setRestAfter] = createSignal(props.block.restAfter);

  // Update when block changes
  createEffect(() => {
    setDuration(props.block.duration);
    setRestAfter(props.block.restAfter);
  });

  const handleSave = () => {
    const updatedBlock: WorkoutBlock = {
      ...props.block,
      duration: duration(),
      restAfter: restAfter(),
    };
    log.debug('Saving exercise block', {
      id: updatedBlock.id,
      duration: duration(),
      restAfter: restAfter(),
    });
    props.onSave(updatedBlock);
  };

  const durationPresets = [15, 20, 30, 45, 60, 90];
  const restPresets = [0, 10, 15, 20, 30, 45];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-editor-title"
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
          'max-width': '400px',
          padding: echoprax.spacing.xl,
          position: 'relative',
          'z-index': 1,
        }}
      >
        {/* Header */}
        <h2
          id="exercise-editor-title"
          style={{
            ...typography.headingMd,
            color: echoprax.colors.text,
            margin: `0 0 ${echoprax.spacing.xs} 0`,
          }}
        >
          {props.block.exercise.name}
        </h2>
        <p
          style={{
            ...typography.bodySm,
            color: echoprax.colors.textMuted,
            margin: `0 0 ${echoprax.spacing.lg} 0`,
          }}
        >
          Adjust duration and rest time
        </p>

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
        <div style={{ 'margin-bottom': echoprax.spacing.xl }}>
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
                      restAfter() === preset ? memphisColors.electricBlue : echoprax.colors.text,
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

        {/* Action Buttons */}
        <div
          style={{
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
            onClick={handleSave}
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
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
