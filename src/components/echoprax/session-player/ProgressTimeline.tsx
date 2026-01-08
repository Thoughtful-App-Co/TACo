import { Component, For, createMemo, Show } from 'solid-js';
import type { WorkoutBlock } from '../../../schemas/echoprax.schema';
import {
  echoprax,
  sessionStateColors,
  glassSurfaces,
  typography,
  memphisColors,
} from '../../../theme/echoprax';

interface ProgressTimelineProps {
  blocks: WorkoutBlock[];
  currentBlockIndex: number;
  phase: 'warmup' | 'main' | 'cooldown';
  /** Current set number (1-indexed) for the active exercise */
  currentSet?: number;
  /** Total sets for the active exercise */
  totalSets?: number;
}

export const ProgressTimeline: Component<ProgressTimelineProps> = (props) => {
  const totalBlocks = () => props.blocks.length;

  const getBlockStatus = (index: number) => {
    if (index < props.currentBlockIndex) return 'completed';
    if (index === props.currentBlockIndex) return 'active';
    return 'pending';
  };

  const getBlockColor = (status: string) => {
    switch (status) {
      case 'completed':
        return sessionStateColors.completed;
      case 'active':
        return sessionStateColors.active;
      default:
        return 'rgba(255,255,255,0.2)';
    }
  };

  const phaseLabel = createMemo(() => {
    switch (props.phase) {
      case 'warmup':
        return 'WARM UP';
      case 'cooldown':
        return 'COOL DOWN';
      default:
        return 'WORKOUT';
    }
  });

  return (
    <nav
      aria-label={`${phaseLabel()} progress: ${props.currentBlockIndex + 1} of ${totalBlocks()} exercises`}
      style={{
        ...glassSurfaces.dark,
        'border-radius': echoprax.radii.md,
        padding: echoprax.spacing.md,
        display: 'flex',
        'flex-direction': 'column',
        gap: echoprax.spacing.sm,
      }}
    >
      {/* Phase label and progress */}
      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'center',
          gap: echoprax.spacing.md,
        }}
      >
        <span
          style={{
            'font-family': echoprax.fonts.heading,
            ...typography.label,
            color: echoprax.colors.textMuted,
          }}
        >
          {phaseLabel()}
        </span>
        <span
          style={{
            'font-family': echoprax.fonts.body,
            ...typography.bodySm,
            color: echoprax.colors.text,
            'font-weight': '600',
          }}
        >
          {props.currentBlockIndex + 1} / {totalBlocks()}
        </span>
      </div>

      {/* Timeline blocks - visual progress bar */}
      <div
        role="progressbar"
        aria-valuenow={props.currentBlockIndex + 1}
        aria-valuemin={1}
        aria-valuemax={totalBlocks()}
        aria-label={`Exercise ${props.currentBlockIndex + 1} of ${totalBlocks()}`}
        style={{
          display: 'flex',
          gap: echoprax.spacing.xs,
          'align-items': 'center',
        }}
      >
        <For each={props.blocks}>
          {(block, index) => {
            const status = () => getBlockStatus(index());
            const isActive = () => status() === 'active';
            const blockSets = block.sets ?? 1;
            const currentSet = props.currentSet ?? 1;
            const totalSets = props.totalSets ?? 1;
            // Calculate set progress percentage for active block with multiple sets
            const setProgressPercent = () => {
              if (!isActive() || blockSets <= 1) return 100;
              return ((currentSet - 1) / totalSets) * 100;
            };
            return (
              <div
                class="echoprax-state-change"
                style={{
                  flex: 1,
                  height: '8px',
                  'border-radius': echoprax.spacing.xs,
                  background:
                    status() === 'completed' ? getBlockColor(status()) : 'rgba(255,255,255,0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                  'min-width': '8px',
                }}
                title={
                  blockSets > 1 ? `${block.exercise.name} (${blockSets} sets)` : block.exercise.name
                }
                aria-hidden="true"
              >
                {/* Set progress fill for active block with multiple sets */}
                <Show when={isActive() && blockSets > 1}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${setProgressPercent()}%`,
                      background: memphisColors.mintGreen,
                      transition: 'width 300ms ease-out',
                    }}
                  />
                </Show>
                {/* Active indicator */}
                <Show when={isActive()}>
                  <div
                    style={{
                      position: 'absolute',
                      left: blockSets > 1 ? `${setProgressPercent()}%` : 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      background: getBlockColor(status()),
                    }}
                  />
                  {/* Pulse animation for active block */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`,
                      animation: 'shimmer 1.5s infinite',
                    }}
                  />
                </Show>
              </div>
            );
          }}
        </For>
      </div>

      {/* Current exercise name with set info */}
      <div
        style={{
          'font-family': echoprax.fonts.body,
          ...typography.bodySm,
          color: echoprax.colors.text,
          'text-align': 'center',
          'font-weight': '500',
          display: 'flex',
          'justify-content': 'center',
          'align-items': 'center',
          gap: echoprax.spacing.sm,
        }}
      >
        <span>{props.blocks[props.currentBlockIndex]?.exercise.name || 'Ready'}</span>
        <Show when={(props.totalSets ?? 1) > 1}>
          <span
            style={{
              color: memphisColors.acidYellow,
              'font-size': '0.75rem',
              'font-weight': '600',
            }}
          >
            (Set {props.currentSet ?? 1}/{props.totalSets ?? 1})
          </span>
        </Show>
      </div>

      {/* Shimmer animation keyframes - respects reduced motion */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes shimmer {
            0%, 100% { opacity: 1; }
          }
        }
      `}</style>
    </nav>
  );
};
