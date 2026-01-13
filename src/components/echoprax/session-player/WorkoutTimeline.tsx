/**
 * WorkoutTimeline - Horizontal progress through entire workout
 *
 * Shows warmup → main → cooldown phases with visual progress.
 * Compact, always visible at the top of the session player.
 */

import { Component, For, Show, createMemo } from 'solid-js';
import type { WorkoutBlock } from '../../../schemas/echoprax.schema';
import { echoprax, memphisColors, typography } from '../../../theme/echoprax';

interface WorkoutTimelineProps {
  /** All blocks organized by phase */
  warmupBlocks: WorkoutBlock[];
  mainBlocks: WorkoutBlock[];
  cooldownBlocks: WorkoutBlock[];
  /** Current position in the entire workout (0-indexed across all phases) */
  currentGlobalIndex: number;
  /** Total blocks in entire workout */
  totalBlocks: number;
  /** Current phase */
  currentPhase: 'warmup' | 'main' | 'cooldown';
  /** Current exercise name */
  currentExerciseName: string;
  /** Set progress within current exercise */
  currentSet: number;
  totalSets: number;
}

/**
 * Phase segment in the timeline
 */
const PhaseSegment: Component<{
  label: string;
  color: string;
  blocks: WorkoutBlock[];
  startIndex: number;
  currentGlobalIndex: number;
  isActive: boolean;
}> = (props) => {
  const blockCount = () => props.blocks.length;

  // Calculate how many blocks in this phase are completed
  const completedInPhase = createMemo(() => {
    const endIndex = props.startIndex + blockCount();
    if (props.currentGlobalIndex >= endIndex) {
      return blockCount(); // All completed
    }
    if (props.currentGlobalIndex < props.startIndex) {
      return 0; // None completed
    }
    return props.currentGlobalIndex - props.startIndex;
  });

  // Progress percentage for the fill
  const progressPercent = createMemo(() => {
    if (blockCount() === 0) return 0;
    // Add partial progress for current block
    const completed = completedInPhase();
    const isCurrentInPhase =
      props.currentGlobalIndex >= props.startIndex &&
      props.currentGlobalIndex < props.startIndex + blockCount();

    if (isCurrentInPhase) {
      // Show partial progress (at least show we're on this block)
      return ((completed + 0.5) / blockCount()) * 100;
    }
    return (completed / blockCount()) * 100;
  });

  return (
    <Show when={blockCount() > 0}>
      <div
        style={{
          flex: blockCount(),
          display: 'flex',
          'flex-direction': 'column',
          gap: '4px',
          'min-width': '40px',
        }}
      >
        {/* Phase label */}
        <span
          style={{
            ...typography.caption,
            'font-size': '0.625rem',
            color: props.isActive ? props.color : echoprax.colors.textMuted,
            'text-transform': 'uppercase',
            'letter-spacing': '0.1em',
            'font-weight': props.isActive ? '700' : '500',
            'text-align': 'center',
            'white-space': 'nowrap',
          }}
        >
          {props.label}
        </span>

        {/* Progress bar for this phase */}
        <div
          style={{
            height: '6px',
            'border-radius': '3px',
            background: 'rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Filled portion */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${progressPercent()}%`,
              background: props.color,
              'border-radius': '3px',
              transition: 'width 300ms ease-out',
            }}
          />
          {/* Active glow */}
          <Show when={props.isActive}>
            <div
              style={{
                position: 'absolute',
                left: `${Math.max(0, progressPercent() - 10)}%`,
                width: '20%',
                top: 0,
                bottom: 0,
                background: `linear-gradient(90deg, transparent, ${props.color}80, transparent)`,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          </Show>
        </div>
      </div>
    </Show>
  );
};

export const WorkoutTimeline: Component<WorkoutTimelineProps> = (props) => {
  // Calculate start indices for each phase
  const warmupStart = 0;
  const mainStart = () => props.warmupBlocks.length;
  const cooldownStart = () => props.warmupBlocks.length + props.mainBlocks.length;

  return (
    <div
      role="navigation"
      aria-label="Workout progress"
      style={{
        display: 'flex',
        'flex-direction': 'column',
        gap: echoprax.spacing.sm,
        padding: `${echoprax.spacing.sm} ${echoprax.spacing.md}`,
        background: 'rgba(0,0,0,0.3)',
        'border-radius': echoprax.radii.md,
      }}
    >
      {/* Timeline bar with phases */}
      <div
        style={{
          display: 'flex',
          gap: echoprax.spacing.xs,
          'align-items': 'flex-end',
        }}
      >
        <Show when={props.warmupBlocks.length > 0}>
          <PhaseSegment
            label="Warm Up"
            color={memphisColors.acidYellow}
            blocks={props.warmupBlocks}
            startIndex={warmupStart}
            currentGlobalIndex={props.currentGlobalIndex}
            isActive={props.currentPhase === 'warmup'}
          />
        </Show>

        <PhaseSegment
          label="Workout"
          color={memphisColors.hotPink}
          blocks={props.mainBlocks}
          startIndex={mainStart()}
          currentGlobalIndex={props.currentGlobalIndex}
          isActive={props.currentPhase === 'main'}
        />

        <Show when={props.cooldownBlocks.length > 0}>
          <PhaseSegment
            label="Cool Down"
            color={memphisColors.electricBlue}
            blocks={props.cooldownBlocks}
            startIndex={cooldownStart()}
            currentGlobalIndex={props.currentGlobalIndex}
            isActive={props.currentPhase === 'cooldown'}
          />
        </Show>
      </div>

      {/* Current exercise info */}
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
        }}
      >
        <span
          style={{
            ...typography.bodySm,
            color: echoprax.colors.text,
            'font-weight': '600',
          }}
        >
          {props.currentExerciseName}
        </span>
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: echoprax.spacing.sm,
          }}
        >
          {/* Set indicator - larger dots */}
          <Show when={props.totalSets > 1}>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '6px',
              }}
            >
              <For each={Array.from({ length: props.totalSets }, (_, i) => i + 1)}>
                {(setNum) => {
                  const isCompleted = () => setNum < props.currentSet;
                  const isCurrent = () => setNum === props.currentSet;

                  return (
                    <div
                      style={{
                        width: isCurrent() ? '14px' : '10px',
                        height: isCurrent() ? '14px' : '10px',
                        'border-radius': '50%',
                        background: isCompleted()
                          ? memphisColors.mintGreen
                          : isCurrent()
                            ? memphisColors.hotPink
                            : 'rgba(255,255,255,0.25)',
                        border: isCurrent() ? `2px solid ${memphisColors.hotPink}` : 'none',
                        'box-shadow': isCurrent() ? `0 0 8px ${memphisColors.hotPink}60` : 'none',
                        transition: 'all 200ms ease-out',
                      }}
                    />
                  );
                }}
              </For>
              <span
                style={{
                  ...typography.caption,
                  color: memphisColors.hotPink,
                  'font-weight': '600',
                  'margin-left': '4px',
                }}
              >
                Set {props.currentSet}/{props.totalSets}
              </span>
            </div>
          </Show>

          {/* Exercise count */}
          <span
            style={{
              ...typography.caption,
              color: echoprax.colors.textMuted,
            }}
          >
            {props.currentGlobalIndex + 1}/{props.totalBlocks}
          </span>
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
