import { Component, createSignal, createEffect, onCleanup, Show, createMemo } from 'solid-js';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  SpeakerHigh,
  SpeakerSlash,
  Barbell,
  ArrowRight,
  ArrowCounterClockwise,
} from 'phosphor-solid';
import type { WorkoutSession, WorkoutBlock, SessionState } from '../../../schemas/echoprax.schema';
import { ExerciseCard } from './ExerciseCard';
import { ProgressTimeline } from './ProgressTimeline';
import { SessionHeader } from '../common/ViewHeader';
import { speak, cancelSpeech } from '../../../services/tts';
import {
  echoprax,
  memphisColors,
  memphisPatterns,
  memphisSurfaces,
  glassButton,
  kineticAnimations,
  typography,
  touchTargets,
  sessionStateColors,
} from '../../../theme/echoprax';
import { logger } from '../../../lib/logger';

const log = logger.create('SessionPlayer');

// ============================================================================
// EXERCISE MODE DETECTION
// ============================================================================

/**
 * Exercise execution modes derived from block configuration:
 * - 'timed': Platform controls countdown (duration set, no reps)
 * - 'reps': User-controlled sets (reps set, no meaningful duration)
 * - 'reps_against_time': Timed with rep counting (both duration and reps set)
 * - 'amrap': As Many Reps As Possible / exhaustion (reps === 0)
 */
type ExerciseMode = 'timed' | 'reps' | 'reps_against_time' | 'amrap';

/**
 * Derive exercise mode from block's duration and reps fields.
 * This determines whether the platform auto-counts or waits for user input.
 */
function getBlockMode(block: WorkoutBlock): ExerciseMode {
  const hasReps = block.reps !== undefined && block.reps > 0;
  const isAmrap = block.reps === 0;
  const hasMeaningfulDuration = block.duration > 0;

  if (isAmrap) return 'amrap';
  if (hasReps && hasMeaningfulDuration) return 'reps_against_time';
  if (hasReps) return 'reps';
  return 'timed';
}

/**
 * Check if a mode requires user input to complete the active phase
 */
function isUserControlledActive(mode: ExerciseMode): boolean {
  return mode === 'reps' || mode === 'amrap';
}

/**
 * Check if a mode requires user input to complete the rest phase
 */
function isUserControlledRest(mode: ExerciseMode): boolean {
  return mode === 'reps' || mode === 'amrap';
}

// ============================================================================
// DOODLE SVG ICONS
// ============================================================================

const DumbbellIcon: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 32}
    height={props.size || 32}
    viewBox="0 0 32 32"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="4" y="11" width="5" height="10" rx="1" />
    <rect x="23" y="11" width="5" height="10" rx="1" />
    <line x1="9" y1="16" x2="23" y2="16" />
    <rect x="1" y="13" width="3" height="6" rx="0.5" />
    <rect x="28" y="13" width="3" height="6" rx="0.5" />
  </svg>
);

const CelebrationIcon: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 32}
    height={props.size || 32}
    viewBox="0 0 32 32"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    {/* Confetti pieces */}
    <rect x="6" y="4" width="4" height="4" fill={memphisColors.hotPink} stroke="none" />
    <rect
      x="22"
      y="6"
      width="4"
      height="4"
      fill={memphisColors.acidYellow}
      stroke="none"
      transform="rotate(15 24 8)"
    />
    <circle cx="14" cy="8" r="2" fill={memphisColors.electricBlue} stroke="none" />
    <circle cx="26" cy="14" r="2" fill={memphisColors.mintGreen} stroke="none" />
    {/* Star burst */}
    <path d="M16 12 L16 6" stroke={props.color || 'currentColor'} />
    <path d="M16 12 L20 8" stroke={props.color || 'currentColor'} />
    <path d="M16 12 L12 8" stroke={props.color || 'currentColor'} />
    {/* Party popper cone */}
    <path d="M8 28 L16 16 L24 28" />
    <path d="M10 28 L22 28" />
    {/* Streamers */}
    <path d="M12 20 Q8 18, 6 22" stroke={memphisColors.lavender} />
    <path d="M20 20 Q24 18, 26 22" stroke={memphisColors.coral} />
  </svg>
);

interface SessionPlayerProps {
  workout: WorkoutSession;
  onComplete?: (workout: WorkoutSession) => void;
  onExit?: () => void;
  /** Number of partners in this workout (1 = solo, 2+ = partner workout) */
  partnerCount?: number;
}

/** Countdown duration before exercise starts */
const COUNTDOWN_DURATION = 5;

export const SessionPlayer: Component<SessionPlayerProps> = (props) => {
  // Flatten all blocks with phase info
  const allBlocks = createMemo(() => {
    const blocks: Array<{ block: WorkoutBlock; phase: 'warmup' | 'main' | 'cooldown' }> = [];

    if (props.workout.warmup) {
      props.workout.warmup.forEach((b) => blocks.push({ block: b, phase: 'warmup' }));
    }
    props.workout.main.forEach((b) => blocks.push({ block: b, phase: 'main' }));
    if (props.workout.cooldown) {
      props.workout.cooldown.forEach((b) => blocks.push({ block: b, phase: 'cooldown' }));
    }

    return blocks;
  });

  // State
  const [state, setState] = createSignal<SessionState>('idle');
  const [currentBlockIndex, setCurrentBlockIndex] = createSignal(0);
  const [timeRemaining, setTimeRemaining] = createSignal(COUNTDOWN_DURATION);
  const [isPaused, setIsPaused] = createSignal(false);
  const [isMuted, setIsMuted] = createSignal(false);
  const [elapsedTime, setElapsedTime] = createSignal(0);
  const [currentSet, setCurrentSet] = createSignal(1);
  const [showExitConfirm, setShowExitConfirm] = createSignal(false);

  // Derived state
  const currentBlockData = () => allBlocks()[currentBlockIndex()];
  const currentBlock = () => currentBlockData()?.block;
  const currentPhase = () => currentBlockData()?.phase || 'main';
  const nextBlock = () => allBlocks()[currentBlockIndex() + 1]?.block;

  // Exercise mode for current block
  const currentMode = createMemo<ExerciseMode>(() => {
    const block = currentBlock();
    return block ? getBlockMode(block) : 'timed';
  });

  // Track elapsed time during user-controlled active phase (for partner workout timing)
  const [userActiveElapsed, setUserActiveElapsed] = createSignal(0);

  const blocksForCurrentPhase = createMemo(() => {
    const phase = currentPhase();
    return allBlocks()
      .filter((b) => b.phase === phase)
      .map((b) => b.block);
  });

  const currentIndexInPhase = createMemo(() => {
    const phase = currentPhase();
    const globalIndex = currentBlockIndex();
    const phaseStartIndex = allBlocks().findIndex((b) => b.phase === phase);
    return globalIndex - phaseStartIndex;
  });

  // TTS speak wrapper (respects mute)
  const speakCue = (text: string, priority = true) => {
    if (!isMuted()) {
      speak(text, { priority });
    }
  };

  // Timer interval ref
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  const clearTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  // Start workout
  const startWorkout = () => {
    log.info('Starting workout', { name: props.workout.name });
    setCurrentBlockIndex(0);
    setCurrentSet(1);
    setState('countdown');
    setTimeRemaining(COUNTDOWN_DURATION);
    setElapsedTime(0);

    const firstBlock = allBlocks()[0]?.block;
    if (firstBlock) {
      speakCue(`Let's go! First up: ${firstBlock.exercise.name}. Get ready!`);
    }
  };

  // Pause/Resume
  const togglePause = () => {
    if (isPaused()) {
      setIsPaused(false);
      setState('active');
      speakCue("Resuming. Let's go!");
    } else {
      setIsPaused(true);
      setState('paused');
      cancelSpeech();
      speakCue('Paused.');
    }
  };

  // Skip to next exercise
  const skipToNext = () => {
    const nextIndex = currentBlockIndex() + 1;
    setCurrentSet(1); // Reset set counter when skipping
    if (nextIndex < allBlocks().length) {
      setCurrentBlockIndex(nextIndex);
      setState('countdown');
      setTimeRemaining(COUNTDOWN_DURATION);
      const next = allBlocks()[nextIndex]?.block;
      if (next) {
        speakCue(`Skipping ahead. Next: ${next.exercise.name}`);
      }
    } else {
      completeWorkout();
    }
  };

  // Go to previous exercise
  const goToPrevious = () => {
    const prevIndex = currentBlockIndex() - 1;
    if (prevIndex >= 0) {
      setCurrentBlockIndex(prevIndex);
      setCurrentSet(1);
      setState('countdown');
      setTimeRemaining(COUNTDOWN_DURATION);
      const prev = allBlocks()[prevIndex]?.block;
      if (prev) {
        speakCue(`Going back. ${prev.exercise.name}`);
      }
      log.info('Going to previous exercise', { index: prevIndex });
    }
  };

  // Redo/restart current exercise
  const redoCurrentExercise = () => {
    const current = currentBlock();
    if (!current) return;

    setCurrentSet(1);
    setState('countdown');
    setTimeRemaining(COUNTDOWN_DURATION);
    speakCue(`Restarting ${current.exercise.name}`);
    log.info('Restarting current exercise', { name: current.exercise.name });
  };

  // Complete workout
  const completeWorkout = () => {
    clearTimer();
    setState('completed');
    speakCue('Great work! Workout complete!');
    log.info('Workout completed', {
      name: props.workout.name,
      elapsedTime: elapsedTime(),
    });

    setTimeout(() => {
      props.onComplete?.(props.workout);
    }, 3000);
  };

  // Stop workout (exit without completing)
  const stopWorkout = () => {
    clearTimer();
    cancelSpeech();
    setState('idle');
    setCurrentBlockIndex(0);
    setCurrentSet(1);
    setTimeRemaining(COUNTDOWN_DURATION);
    setElapsedTime(0);
    setIsPaused(false);
    log.info('Workout stopped early', {
      name: props.workout.name,
      elapsedTime: elapsedTime(),
    });
    props.onExit?.();
  };

  // Transition to next state/exercise
  const transitionToNext = () => {
    const current = currentBlock();
    if (!current) return;

    const mode = currentMode();

    if (state() === 'countdown') {
      // For user-controlled modes, we don't countdown - we count UP to track duration
      if (isUserControlledActive(mode)) {
        setTimeRemaining(0); // Will count up
        setUserActiveElapsed(0);
        setState('active');
        const repsText =
          mode === 'amrap' ? 'As many reps as possible!' : `${current.reps} reps. Go!`;
        speakCue(current.voiceCue || repsText);
      } else {
        // For timed exercises, set the duration BEFORE changing state
        // This ensures the timer effect sees the correct initial value
        const duration = current.duration || 30; // Fallback to 30s if somehow missing
        setTimeRemaining(duration);
        setState('active');
        speakCue(current.voiceCue || 'Go!');
        log.debug('Starting timed exercise', { duration, exercise: current.exercise.name });
      }
    } else if (state() === 'active') {
      if (current.restAfter > 0) {
        setState('rest');
        // For user-controlled modes, rest is also user-controlled (no countdown)
        if (isUserControlledRest(mode)) {
          setTimeRemaining(0); // Display shows "Ready when you are"
        } else {
          setTimeRemaining(current.restAfter);
        }
        const next = nextBlock();
        if (next) {
          speakCue(`Rest. Next up: ${next.exercise.name}`);
        } else {
          speakCue('Rest. Almost done!');
        }
      } else {
        moveToNextExercise();
      }
    } else if (state() === 'rest') {
      moveToNextExercise();
    }
  };

  // Derived: total sets for current block
  const totalSets = () => currentBlock()?.sets ?? 1;

  // User manually completes their set (for reps/amrap modes)
  const completeUserSet = () => {
    const current = currentBlock();
    if (!current) return;

    const setNum = currentSet();
    const total = totalSets();

    log.info('User completed set', {
      exercise: current.exercise.name,
      mode: currentMode(),
      elapsed: userActiveElapsed(),
      set: setNum,
      totalSets: total,
    });

    // Check if more sets remain for this exercise
    if (setNum < total) {
      // More sets remaining - go to rest then come back to same exercise
      setCurrentSet(setNum + 1);
      speakCue(`Set ${setNum} done! ${total - setNum} more to go.`);

      if (current.restAfter > 0) {
        setState('rest');
        if (isUserControlledRest(currentMode())) {
          setTimeRemaining(0);
        } else {
          setTimeRemaining(current.restAfter);
        }
      } else {
        // No rest between sets - go straight to countdown for next set
        setState('countdown');
        setTimeRemaining(COUNTDOWN_DURATION);
        speakCue(`Get ready for set ${setNum + 1}!`);
      }
      return;
    }

    // All sets complete - move to next exercise
    speakCue('Done!');
    setCurrentSet(1); // Reset for next exercise

    // Transition from active to rest (or next exercise if no rest)
    if (current.restAfter > 0) {
      setState('rest');
      if (isUserControlledRest(currentMode())) {
        setTimeRemaining(0);
      } else {
        setTimeRemaining(current.restAfter);
      }
      const next = nextBlock();
      if (next) {
        speakCue(`Rest. Next up: ${next.exercise.name}`);
      } else {
        speakCue('Rest. Almost done!');
      }
    } else {
      moveToNextExercise();
    }
  };

  // User signals ready to start next set or exercise (for reps/amrap rest phase)
  const userReady = () => {
    const setNum = currentSet();
    const total = totalSets();

    // If we're in the middle of sets for current exercise, go to countdown for next set
    if (setNum <= total && state() === 'rest') {
      log.info('User ready for next set', { set: setNum, total });
      speakCue(`Set ${setNum}! Let's go!`);
      setState('countdown');
      setTimeRemaining(COUNTDOWN_DURATION);
      return;
    }

    log.info('User ready for next exercise');
    speakCue("Let's go!");
    moveToNextExercise();
  };

  const moveToNextExercise = () => {
    const nextIndex = currentBlockIndex() + 1;
    setCurrentSet(1); // Reset set counter for new exercise
    if (nextIndex < allBlocks().length) {
      setCurrentBlockIndex(nextIndex);
      setState('countdown');
      setTimeRemaining(COUNTDOWN_DURATION);
      const next = allBlocks()[nextIndex]?.block;
      if (next) {
        speakCue(`Get ready for ${next.exercise.name}`);
      }
    } else {
      completeWorkout();
    }
  };

  // Main timer effect
  createEffect(() => {
    const currentState = state();
    const mode = currentMode();

    if (currentState === 'idle' || currentState === 'completed' || currentState === 'paused') {
      clearTimer();
      return;
    }

    // For user-controlled active/rest phases, don't auto-countdown
    // But we still run a timer to track elapsed time
    const isUserControlledPhase =
      (currentState === 'active' && isUserControlledActive(mode)) ||
      (currentState === 'rest' && isUserControlledRest(mode));

    clearTimer();

    timerInterval = setInterval(() => {
      if (isPaused()) return;

      setElapsedTime((t) => t + 1);

      if (isUserControlledPhase) {
        // Count UP for user-controlled phases (track how long they take)
        if (currentState === 'active') {
          setUserActiveElapsed((t) => t + 1);
          setTimeRemaining((t) => t + 1); // Count up for display
        }
        // For rest phase in user-controlled mode, we just wait - no countdown
        return;
      }

      // Platform-controlled: count DOWN
      setTimeRemaining((t) => {
        const newTime = t - 1;

        if (currentState === 'active') {
          if (newTime === 15) speakCue('15 seconds left');
          if (newTime === 5) speakCue('5 seconds');
          if (newTime === 3) speakCue('3');
          if (newTime === 2) speakCue('2');
          if (newTime === 1) speakCue('1');
        }

        if (currentState === 'countdown') {
          if (newTime === 3) speakCue('3');
          if (newTime === 2) speakCue('2');
          if (newTime === 1) speakCue('1');
        }

        if (currentState === 'rest') {
          if (newTime === 5) speakCue('5 seconds');
          if (newTime === 3) speakCue('3');
          if (newTime === 2) speakCue('2');
          if (newTime === 1) speakCue('1');
        }

        if (newTime <= 0) {
          transitionToNext();
          return 0;
        }

        return newTime;
      });
    }, 1000);
  });

  // Cleanup on unmount
  onCleanup(() => {
    clearTimer();
    cancelSpeech();
  });

  // Format elapsed time
  const formatElapsedTime = () => {
    const mins = Math.floor(elapsedTime() / 60);
    const secs = elapsedTime() % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        'min-height': '100vh',
        background: echoprax.colors.background,
        'background-image': memphisPatterns.terrazzo,
        'background-size': '200px 200px',
        color: echoprax.colors.text,
        'font-family': echoprax.fonts.body,
        padding: echoprax.spacing.lg,
        display: 'flex',
        'flex-direction': 'column',
        gap: echoprax.spacing.lg,
      }}
    >
      {/* Header - uses SessionHeader for consistent back navigation */}
      <Show when={state() !== 'idle' && state() !== 'completed'}>
        <SessionHeader
          title={props.workout.name}
          bpmLabel={`${props.workout.targetBpm.label} | ${props.workout.targetBpm.min}-${props.workout.targetBpm.max} BPM`}
          elapsedTime={formatElapsedTime()}
          onExit={() => {
            setIsPaused(true);
            setShowExitConfirm(true);
          }}
          stateColor={sessionStateColors[state()] || memphisColors.electricBlue}
        />
      </Show>

      {/* Idle State - Start Screen */}
      <Show when={state() === 'idle'}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            'justify-content': 'center',
            gap: echoprax.spacing.xl,
            padding: echoprax.spacing.lg,
          }}
        >
          <div style={{ 'text-align': 'center' }}>
            <div
              style={{
                width: '96px',
                height: '96px',
                'border-radius': '50%',
                background: memphisColors.hotPink,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                margin: '0 auto',
                'margin-bottom': echoprax.spacing.lg,
                'box-shadow': `0 8px 32px ${memphisColors.hotPink}50`,
              }}
              aria-hidden="true"
            >
              <DumbbellIcon size={48} color="#FFFFFF" />
            </div>
            <h2
              style={{
                ...typography.headingLg,
                color: echoprax.colors.text,
                margin: 0,
              }}
            >
              Ready to Work?
            </h2>
            <p
              style={{
                ...typography.body,
                color: echoprax.colors.textMuted,
                'margin-top': echoprax.spacing.sm,
              }}
            >
              {allBlocks().length} exercises •{' '}
              <span style={{ color: memphisColors.acidYellow, 'font-weight': '600' }}>
                ~{Math.ceil(props.workout.totalDuration / 60)} minutes
              </span>
            </p>
          </div>

          <button
            onClick={startWorkout}
            class="echoprax-glass-btn"
            aria-label={`Start workout: ${props.workout.name}`}
            style={{
              ...glassButton.primary,
              'border-radius': echoprax.radii.organic,
              padding: `${echoprax.spacing.md} ${echoprax.spacing.xxl}`,
              ...typography.headingSm,
              color: memphisColors.hotPink,
              cursor: 'pointer',
              'box-shadow': `0 8px 32px ${memphisColors.hotPink}30`,
              transition: `all 250ms ${kineticAnimations.bouncy}`,
              'min-height': '56px', // Ensure touch target
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 12px 40px ${memphisColors.hotPink}50`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = `0 8px 32px ${memphisColors.hotPink}30`;
            }}
          >
            Start Workout
          </button>
        </div>
      </Show>

      {/* Active Workout */}
      <Show when={state() !== 'idle' && state() !== 'completed' && currentBlock()}>
        {/* Progress Timeline */}
        <ProgressTimeline
          blocks={blocksForCurrentPhase()}
          currentBlockIndex={currentIndexInPhase()}
          phase={currentPhase()}
          currentSet={currentSet()}
          totalSets={totalSets()}
        />

        {/* Exercise Card */}
        <ExerciseCard
          exercise={currentBlock()!.exercise}
          state={state()}
          timeRemaining={timeRemaining()}
          totalDuration={
            state() === 'countdown'
              ? COUNTDOWN_DURATION
              : state() === 'rest'
                ? currentBlock()!.restAfter
                : currentBlock()!.duration
          }
          nextExercise={nextBlock()?.exercise}
          mode={currentMode()}
          reps={currentBlock()!.reps}
          isUserControlled={
            (state() === 'active' && isUserControlledActive(currentMode())) ||
            (state() === 'rest' && isUserControlledRest(currentMode()))
          }
          currentSet={currentSet()}
          totalSets={totalSets()}
        />

        {/* Controls */}
        <nav
          aria-label="Workout controls"
          style={{
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            gap: echoprax.spacing.lg,
            'padding-top': echoprax.spacing.lg,
          }}
        >
          {/* Primary Action Button for User-Controlled Modes */}
          <Show
            when={
              (state() === 'active' && isUserControlledActive(currentMode())) ||
              (state() === 'rest' && isUserControlledRest(currentMode()))
            }
          >
            <button
              onClick={() => {
                if (state() === 'active') {
                  completeUserSet();
                } else if (state() === 'rest') {
                  userReady();
                }
              }}
              class="echoprax-glass-btn"
              aria-label={state() === 'active' ? 'Complete set' : 'Start next exercise'}
              style={{
                ...glassButton.primary,
                'border-radius': echoprax.radii.organic,
                padding: `${echoprax.spacing.xl} ${echoprax.spacing.xxl}`,
                ...typography.headingMd,
                'font-size': '1.25rem',
                color: state() === 'active' ? memphisColors.mintGreen : memphisColors.electricBlue,
                cursor: 'pointer',
                'box-shadow': `0 12px 40px ${state() === 'active' ? memphisColors.mintGreen : memphisColors.electricBlue}50`,
                transition: `all 250ms ${kineticAnimations.bouncy}`,
                'min-height': '72px',
                'min-width': '240px',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                gap: echoprax.spacing.md,
                border: `2px solid ${state() === 'active' ? memphisColors.mintGreen : memphisColors.electricBlue}40`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08) translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 16px 48px ${state() === 'active' ? memphisColors.mintGreen : memphisColors.electricBlue}60`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = `0 12px 40px ${state() === 'active' ? memphisColors.mintGreen : memphisColors.electricBlue}50`;
              }}
            >
              <Show
                when={state() === 'active'}
                fallback={
                  <>
                    <ArrowRight size={32} weight="bold" />
                    Next
                  </>
                }
              >
                <Barbell size={32} weight="bold" />
                Complete Set
              </Show>
            </button>
          </Show>

          {/* Secondary Controls Row - mobile-optimized with standard touch targets */}
          <div
            style={{
              display: 'flex',
              'justify-content': 'center',
              'align-items': 'center',
              gap: echoprax.spacing.sm,
              'flex-wrap': 'wrap',
              'max-width': '320px',
              margin: '0 auto',
            }}
          >
            {/* Mute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted())}
              class="echoprax-glass-btn"
              aria-label={isMuted() ? 'Unmute voice coaching' : 'Mute voice coaching'}
              aria-pressed={isMuted()}
              style={{
                ...glassButton.default,
                border: 'none',
                'border-radius': '50%',
                width: touchTargets.minimum,
                height: touchTargets.minimum,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                cursor: 'pointer',
                color: isMuted() ? echoprax.colors.textMuted : memphisColors.electricBlue,
              }}
              title={isMuted() ? 'Unmute' : 'Mute'}
            >
              <Show when={isMuted()} fallback={<SpeakerHigh size={20} />}>
                <SpeakerSlash size={20} />
              </Show>
            </button>

            {/* Previous Exercise */}
            <button
              onClick={goToPrevious}
              class="echoprax-glass-btn"
              aria-label="Go to previous exercise"
              disabled={currentBlockIndex() === 0}
              style={{
                ...glassButton.default,
                border: 'none',
                'border-radius': '50%',
                width: touchTargets.secondary,
                height: touchTargets.secondary,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                cursor: currentBlockIndex() === 0 ? 'not-allowed' : 'pointer',
                color:
                  currentBlockIndex() === 0
                    ? echoprax.colors.textMuted
                    : memphisColors.electricBlue,
                opacity: currentBlockIndex() === 0 ? 0.4 : 1,
              }}
              title="Previous Exercise"
            >
              <SkipBack size={22} weight="fill" />
            </button>

            {/* Play/Pause - Hero button, only for timed exercises or countdown */}
            <Show when={!isUserControlledActive(currentMode()) || state() === 'countdown'}>
              <button
                onClick={togglePause}
                class="echoprax-glass-btn"
                aria-label={isPaused() ? 'Resume workout' : 'Pause workout'}
                aria-pressed={isPaused()}
                style={{
                  ...glassButton.primary,
                  border: 'none',
                  'border-radius': '50%',
                  width: touchTargets.hero,
                  height: touchTargets.hero,
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  cursor: 'pointer',
                  color: memphisColors.hotPink,
                  'box-shadow': `0 4px 20px ${memphisColors.hotPink}40`,
                }}
                title={isPaused() ? 'Resume' : 'Pause'}
              >
                <Show when={isPaused()} fallback={<Pause size={28} weight="fill" />}>
                  <Play size={28} weight="fill" />
                </Show>
              </button>
            </Show>

            {/* Next Exercise (Skip) */}
            <button
              onClick={skipToNext}
              class="echoprax-glass-btn"
              aria-label="Skip to next exercise"
              style={{
                ...glassButton.default,
                border: 'none',
                'border-radius': '50%',
                width: touchTargets.secondary,
                height: touchTargets.secondary,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                cursor: 'pointer',
                color: memphisColors.acidYellow,
              }}
              title="Next Exercise"
            >
              <SkipForward size={22} weight="fill" />
            </button>

            {/* Redo - tertiary action */}
            <button
              onClick={redoCurrentExercise}
              class="echoprax-glass-btn"
              aria-label="Restart current exercise"
              style={{
                ...glassButton.default,
                border: 'none',
                'border-radius': '50%',
                width: touchTargets.minimum,
                height: touchTargets.minimum,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                cursor: 'pointer',
                color: echoprax.colors.textMuted,
              }}
              title="Restart Exercise"
            >
              <ArrowCounterClockwise size={18} />
            </button>
          </div>
        </nav>
      </Show>

      {/* Completed State */}
      <Show when={state() === 'completed'}>
        <div
          role="status"
          aria-live="polite"
          style={{
            flex: 1,
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            'justify-content': 'center',
            gap: echoprax.spacing.xl,
            padding: echoprax.spacing.lg,
          }}
        >
          <div style={{ 'text-align': 'center' }}>
            <div
              style={{
                width: '120px',
                height: '120px',
                'border-radius': '50%',
                background: memphisColors.mintGreen,
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                margin: '0 auto',
                'margin-bottom': echoprax.spacing.lg,
                'box-shadow': `0 8px 40px ${memphisColors.mintGreen}50`,
              }}
              aria-hidden="true"
            >
              <CelebrationIcon size={64} color="#0D0D0D" />
            </div>
            <h2
              style={{
                ...typography.headingXl,
                margin: 0,
                color: memphisColors.electricBlue,
              }}
            >
              Workout Complete!
            </h2>
            <p
              style={{
                ...typography.bodyLg,
                color: echoprax.colors.textMuted,
                'margin-top': echoprax.spacing.md,
              }}
            >
              Great work! You crushed it in{' '}
              <span style={{ color: memphisColors.acidYellow, 'font-weight': '700' }}>
                {formatElapsedTime()}
              </span>
              .
            </p>
          </div>

          <button
            onClick={() => props.onExit?.()}
            class="echoprax-glass-btn"
            aria-label="Return to home screen"
            style={{
              ...glassButton.default,
              'border-radius': echoprax.radii.organic,
              padding: `${echoprax.spacing.md} ${echoprax.spacing.xl}`,
              ...typography.headingSm,
              'font-size': '1rem',
              color: echoprax.colors.text,
              cursor: 'pointer',
              'min-height': '48px',
            }}
          >
            Back to Home
          </button>
        </div>
      </Show>

      {/* Exit Confirmation Modal */}
      <Show when={showExitConfirm()}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            'z-index': 1000,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            background: 'rgba(0, 0, 0, 0.8)',
            'backdrop-filter': 'blur(8px)',
          }}
          onClick={(e) => {
            // Close on overlay click
            if (e.target === e.currentTarget) {
              setShowExitConfirm(false);
              setIsPaused(false);
            }
          }}
          onKeyDown={(e) => {
            // Close on Escape key
            if (e.key === 'Escape') {
              setShowExitConfirm(false);
              setIsPaused(false);
            }
          }}
        >
          <div
            style={{
              ...memphisSurfaces.elevated,
              padding: echoprax.spacing.xl,
              'border-radius': echoprax.radii.lg,
              'max-width': '400px',
              width: '90%',
              'text-align': 'center',
            }}
          >
            <h2
              id="exit-modal-title"
              style={{
                ...typography.headingLg,
                color: echoprax.colors.text,
                'margin-bottom': echoprax.spacing.md,
              }}
            >
              End Workout?
            </h2>
            <p
              style={{
                ...typography.body,
                color: echoprax.colors.textMuted,
                'margin-bottom': echoprax.spacing.xl,
              }}
            >
              Your progress will not be saved.
            </p>
            <div
              style={{
                display: 'flex',
                gap: echoprax.spacing.md,
                'justify-content': 'center',
              }}
            >
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  setIsPaused(false);
                }}
                class="echoprax-glass-btn"
                style={{
                  ...glassButton.default,
                  padding: `${echoprax.spacing.md} ${echoprax.spacing.xl}`,
                  'border-radius': echoprax.radii.md,
                  color: memphisColors.mintGreen,
                  cursor: 'pointer',
                  'font-weight': '600',
                }}
              >
                Keep Going
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  stopWorkout();
                }}
                class="echoprax-glass-btn"
                style={{
                  ...glassButton.default,
                  padding: `${echoprax.spacing.md} ${echoprax.spacing.xl}`,
                  'border-radius': echoprax.radii.md,
                  color: memphisColors.coral,
                  cursor: 'pointer',
                  'font-weight': '600',
                }}
              >
                End Workout
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
