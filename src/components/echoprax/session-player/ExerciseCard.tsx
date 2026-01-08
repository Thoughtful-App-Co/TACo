/**
 * ExerciseCard - Compact mobile-first exercise display
 *
 * Redesigned for maximum information density without wasted space.
 * Timer/reps are the hero. Form cues are collapsible.
 *
 * Memphis x Retro-Futurism Design
 */

import { Component, Show, For, createSignal, createMemo } from 'solid-js';
import { CaretDown, CaretUp } from 'phosphor-solid';
import type { Exercise, SessionState } from '../../../schemas/echoprax.schema';
import {
  echoprax,
  sessionStateColors,
  memphisColors,
  memphisSurfaces,
  kineticAnimations,
  typography,
  responsiveTypography,
} from '../../../theme/echoprax';

/**
 * Exercise execution modes
 */
type ExerciseMode = 'timed' | 'reps' | 'reps_against_time' | 'amrap';

interface ExerciseCardProps {
  exercise: Exercise;
  state: SessionState;
  timeRemaining: number;
  totalDuration: number;
  nextExercise?: Exercise;
  /** Exercise mode - determines display (countdown vs reps) */
  mode?: ExerciseMode;
  /** Number of reps for rep-based exercises */
  reps?: number;
  /** Whether the current phase is user-controlled (waiting for user input) */
  isUserControlled?: boolean;
  /** Current set number (1-indexed) */
  currentSet?: number;
  /** Total number of sets for this exercise */
  totalSets?: number;
}

/**
 * Format seconds as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get solid Memphis color based on session state
 */
function getStateColor(state: SessionState): string {
  switch (state) {
    case 'countdown':
      return memphisColors.acidYellow;
    case 'active':
      return memphisColors.hotPink;
    case 'rest':
      return memphisColors.electricBlue;
    case 'completed':
      return memphisColors.mintGreen;
    case 'paused':
      return memphisColors.lavender;
    default:
      return sessionStateColors.idle;
  }
}

/**
 * Get state label text
 */
function getStateLabel(state: SessionState): string {
  switch (state) {
    case 'countdown':
      return 'GET READY';
    case 'active':
      return 'GO';
    case 'rest':
      return 'REST';
    case 'completed':
      return 'DONE';
    case 'paused':
      return 'PAUSED';
    default:
      return '';
  }
}

/**
 * Compact Set Indicator - horizontal dots
 */
const SetIndicator: Component<{ currentSet: number; totalSets: number }> = (props) => {
  return (
    <div
      role="group"
      aria-label={`Set ${props.currentSet} of ${props.totalSets}`}
      style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        gap: echoprax.spacing.xs,
      }}
    >
      <For each={Array.from({ length: props.totalSets }, (_, i) => i + 1)}>
        {(setNum) => {
          const isCompleted = () => setNum < props.currentSet;
          const isCurrent = () => setNum === props.currentSet;

          return (
            <div
              class={isCurrent() ? 'echoprax-countdown' : ''}
              style={{
                width: isCurrent() ? '12px' : '8px',
                height: isCurrent() ? '12px' : '8px',
                'border-radius': '50%',
                background: isCompleted()
                  ? memphisColors.mintGreen
                  : isCurrent()
                    ? memphisColors.hotPink
                    : 'rgba(255,255,255,0.2)',
                transition: `all 200ms ${kineticAnimations.bouncy}`,
              }}
            />
          );
        }}
      </For>
      <span
        style={{
          ...typography.caption,
          color: memphisColors.hotPink,
          'margin-left': echoprax.spacing.xs,
          'font-weight': '600',
        }}
      >
        {props.currentSet}/{props.totalSets}
      </span>
    </div>
  );
};

/**
 * Hero Timer Display - the main event
 */
const TimerDisplay: Component<{
  reps?: number;
  mode?: ExerciseMode;
  state: SessionState;
  timeRemaining: number;
  stateColor: string;
}> = (props) => {
  const isRepBased = () => props.mode === 'reps' || props.mode === 'amrap';

  return (
    <div
      class="echoprax-state-change"
      style={{
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'text-align': 'center',
        gap: echoprax.spacing.xs,
      }}
    >
      {/* Rest state for rep-based: show ready message */}
      <Show when={props.state === 'rest' && isRepBased()}>
        <div
          style={{
            ...typography.headingMd,
            color: memphisColors.electricBlue,
          }}
        >
          Ready?
        </div>
        <div
          style={{
            ...typography.bodySm,
            color: echoprax.colors.textMuted,
          }}
        >
          Tap Next to continue
        </div>
      </Show>

      {/* Timer/Reps Display */}
      <Show when={props.state !== 'rest' || !isRepBased()}>
        {/* TIMED exercises: show countdown */}
        <Show when={!isRepBased() || props.state === 'countdown' || props.state === 'rest'}>
          <div
            role="timer"
            aria-label={`${formatTime(props.timeRemaining)} remaining`}
            style={{
              ...responsiveTypography.timer,
              color: echoprax.colors.text,
              'text-shadow': `0 0 40px ${props.stateColor}30`,
              'font-variant-numeric': 'tabular-nums',
            }}
          >
            {formatTime(props.timeRemaining)}
          </div>
        </Show>

        {/* REP-BASED active: show reps as hero */}
        <Show when={isRepBased() && props.state === 'active'}>
          <div
            role="status"
            aria-label={props.mode === 'amrap' ? 'As many reps as possible' : `${props.reps} reps`}
            style={{
              ...responsiveTypography.timer,
              color: echoprax.colors.text,
              'text-shadow': `0 0 40px ${props.stateColor}30`,
            }}
          >
            <Show when={props.mode === 'amrap'} fallback={`${props.reps}`}>
              MAX
            </Show>
          </div>
          <div
            style={{
              ...typography.label,
              color: props.stateColor,
            }}
          >
            REPS
          </div>
          <div
            style={{
              ...typography.bodySm,
              color: echoprax.colors.textMuted,
              'margin-top': echoprax.spacing.xs,
              'font-variant-numeric': 'tabular-nums',
            }}
          >
            {formatTime(props.timeRemaining)} elapsed
          </div>
        </Show>
      </Show>
    </div>
  );
};

/**
 * Collapsible Form Cues Section
 */
const FormCues: Component<{ instructions: string[]; stateColor: string }> = (props) => {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const visibleCues = createMemo(() =>
    isExpanded() ? props.instructions : props.instructions.slice(0, 2)
  );
  const hasMore = () => props.instructions.length > 2;

  return (
    <div
      style={{
        width: '100%',
        'max-width': '400px',
        margin: '0 auto',
      }}
    >
      {/* Cue Header */}
      <button
        type="button"
        onClick={() => hasMore() && setIsExpanded(!isExpanded())}
        disabled={!hasMore()}
        style={{
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          padding: `${echoprax.spacing.xs} 0`,
          cursor: hasMore() ? 'pointer' : 'default',
          color: echoprax.colors.textMuted,
        }}
      >
        <span
          style={{
            ...typography.caption,
            'text-transform': 'uppercase',
            'letter-spacing': '0.1em',
          }}
        >
          Form Cues
        </span>
        <Show when={hasMore()}>
          <span style={{ display: 'flex', 'align-items': 'center', gap: '4px' }}>
            <span style={{ ...typography.caption }}>
              <Show when={isExpanded()} fallback="More">
                Less
              </Show>
            </span>
            <Show when={isExpanded()} fallback={<CaretDown size={12} />}>
              <CaretUp size={12} />
            </Show>
          </span>
        </Show>
      </button>

      {/* Cue List */}
      <ul
        style={{
          'list-style': 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          'flex-direction': 'column',
          gap: echoprax.spacing.xs,
        }}
      >
        <For each={visibleCues()}>
          {(instruction, index) => (
            <li
              style={{
                ...typography.caption,
                color: echoprax.colors.textMuted,
                'padding-left': echoprax.spacing.md,
                position: 'relative',
                'line-height': '1.4',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  color: [
                    memphisColors.hotPink,
                    memphisColors.electricBlue,
                    memphisColors.acidYellow,
                  ][index() % 3],
                  'font-weight': '700',
                }}
              >
                *
              </span>
              {instruction}
            </li>
          )}
        </For>
      </ul>
    </div>
  );
};

/**
 * Next Exercise Preview - minimal, inline
 */
const NextPreview: Component<{ exercise: Exercise }> = (props) => {
  return (
    <div
      role="status"
      aria-label={`Next exercise: ${props.exercise.name}`}
      style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        gap: echoprax.spacing.sm,
        padding: `${echoprax.spacing.sm} ${echoprax.spacing.md}`,
        background: 'rgba(255,255,255,0.03)',
        'border-radius': echoprax.radii.sm,
        'max-width': '300px',
        margin: '0 auto',
      }}
    >
      <span
        style={{
          ...typography.caption,
          color: echoprax.colors.textMuted,
        }}
      >
        Next:
      </span>
      <span
        style={{
          ...typography.bodySm,
          color: memphisColors.electricBlue,
          'font-weight': '600',
        }}
      >
        {props.exercise.name}
      </span>
    </div>
  );
};

/**
 * Main ExerciseCard Component
 * Compact, mobile-first layout with no wasted space
 */
export const ExerciseCard: Component<ExerciseCardProps> = (props) => {
  const stateColor = () => getStateColor(props.state);
  const showSetIndicator = () => (props.totalSets ?? 1) > 1;
  const hasGif = () => !!props.exercise.gifUrl;

  // Progress percentage for the top bar
  const progressPercent = () => {
    if (props.totalDuration === 0) return 0;
    const isCountingUp = props.mode === 'reps' || props.mode === 'amrap';
    if (isCountingUp && props.state === 'active') {
      // For rep-based, we don't have a fixed duration, so just pulse
      return 50;
    }
    return ((props.totalDuration - props.timeRemaining) / props.totalDuration) * 100;
  };

  return (
    <article
      class="echoprax-state-change"
      aria-label={`Current exercise: ${props.exercise.name}`}
      aria-live="polite"
      style={{
        ...memphisSurfaces.card,
        overflow: 'hidden',
        display: 'flex',
        'flex-direction': 'column',
      }}
    >
      {/* Progress Bar - always at top */}
      <div
        style={{
          height: '3px',
          background: 'rgba(255,255,255,0.08)',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercent()}%`,
            background: stateColor(),
            transition: 'width 100ms linear',
            'box-shadow': `0 0 8px ${stateColor()}60`,
          }}
        />
      </div>

      {/* Main Content */}
      <div
        style={{
          display: 'flex',
          'flex-direction': 'column',
          padding: echoprax.spacing.lg,
          gap: echoprax.spacing.md,
        }}
      >
        {/* Row 1: Exercise Name + State Label */}
        <div
          style={{
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            gap: echoprax.spacing.xs,
          }}
        >
          {/* State Label */}
          <div
            class={props.state === 'countdown' ? 'echoprax-countdown' : ''}
            role="status"
            aria-live="assertive"
            style={{
              ...typography.label,
              'letter-spacing': '0.2em',
              color: stateColor(),
              'text-shadow': `0 0 12px ${stateColor()}40`,
            }}
          >
            {getStateLabel(props.state)}
          </div>

          {/* Exercise Name */}
          <h2
            style={{
              ...typography.headingMd,
              color: echoprax.colors.text,
              margin: 0,
              'text-align': 'center',
            }}
          >
            {props.exercise.name}
          </h2>

          {/* Target Muscle & Equipment - compact inline */}
          <p
            style={{
              ...typography.caption,
              color: echoprax.colors.textMuted,
              margin: 0,
              'text-align': 'center',
            }}
          >
            <span style={{ color: memphisColors.coral }}>{props.exercise.targetMuscle}</span>
            {' | '}
            {props.exercise.equipment.slice(0, 2).join(', ')}
          </p>
        </div>

        {/* Row 2: Set Indicator (if multiple sets) */}
        <Show when={showSetIndicator()}>
          <SetIndicator currentSet={props.currentSet ?? 1} totalSets={props.totalSets ?? 1} />
        </Show>

        {/* Row 3: GIF + Timer side by side on tablet+, stacked on mobile */}
        <div
          style={{
            display: 'flex',
            'flex-direction': hasGif() ? 'row' : 'column',
            'align-items': 'center',
            'justify-content': 'center',
            gap: echoprax.spacing.lg,
            'flex-wrap': 'wrap',
          }}
        >
          {/* GIF (if available) - constrained size */}
          <Show when={hasGif()}>
            <div
              style={{
                width: 'clamp(120px, 30vw, 200px)',
                'flex-shrink': 0,
                'border-radius': echoprax.radii.md,
                overflow: 'hidden',
                border: `2px solid ${stateColor()}20`,
              }}
            >
              <img
                src={props.exercise.gifUrl}
                alt={`${props.exercise.name} demonstration`}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
                loading="eager"
              />
            </div>
          </Show>

          {/* Timer Display - hero element */}
          <TimerDisplay
            reps={props.reps}
            mode={props.mode}
            state={props.state}
            timeRemaining={props.timeRemaining}
            stateColor={stateColor()}
          />
        </div>

        {/* Row 4: Form Cues (collapsible) */}
        <Show when={props.exercise.instructions.length > 0}>
          <FormCues instructions={props.exercise.instructions} stateColor={stateColor()} />
        </Show>

        {/* Row 5: Next Exercise Preview (during rest) */}
        <Show when={props.state === 'rest' && props.nextExercise}>
          <NextPreview exercise={props.nextExercise!} />
        </Show>
      </div>
    </article>
  );
};
