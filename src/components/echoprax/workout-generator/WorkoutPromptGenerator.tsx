/**
 * WorkoutPromptGenerator - AI-powered workout creation
 *
 * Desktop-only premium feature that generates workouts from natural language.
 * Includes user settings for accurate duration estimation.
 *
 * Memphis x Retro-Futurism Design
 */

import { Component, createSignal, createMemo, Show, For, onMount } from 'solid-js';
import { Users } from 'phosphor-solid';
import type {
  WorkoutArea,
  WorkoutSession,
  WorkoutBlock,
  Exercise,
  EchopraxUserSettings,
} from '../../../schemas/echoprax.schema';
import {
  echoprax,
  memphisColors,
  memphisSurfaces,
  glassButton,
  typography,
} from '../../../theme/echoprax';
import { ViewHeader } from '../common/ViewHeader';
import { logger } from '../../../lib/logger';
import { canUseEchopraxAI } from '../../../lib/feature-gates';
import { AIUsageService } from '../lib/ai-usage.service';
import { UserSettingsService } from '../lib/user-settings.service';
import { Paywall } from '../../common/Paywall';
import { TrialBanner } from '../TrialBanner';

const log = logger.create('WorkoutPromptGenerator');

interface GeneratedExercise {
  name: string;
  duration: number;
  reps?: number;
  sets: number;
  restAfter: number;
  notes?: string;
}

interface GeneratedWorkout {
  name: string;
  description: string;
  warmup?: GeneratedExercise[];
  main: GeneratedExercise[];
  cooldown?: GeneratedExercise[];
  totalDuration: number;
  targetBpm: {
    min: number;
    max: number;
    label: string;
  };
}

interface WorkoutPromptGeneratorProps {
  area: WorkoutArea;
  onSave: (workout: WorkoutSession) => void;
  onCancel: () => void;
}

// Example prompts for inspiration
const examplePrompts = [
  '20 minute HIIT workout',
  '30 minute upper body strength',
  'Quick 15 minute core workout',
  'Full body workout for beginners',
  'Leg day with dumbbells',
  '45 minute cardio and strength mix',
];

/**
 * Convert generated exercise to WorkoutBlock format
 */
function toWorkoutBlock(exercise: GeneratedExercise): WorkoutBlock {
  const exerciseData: Exercise = {
    id: exercise.name.toLowerCase().replace(/\s+/g, '_'),
    name: exercise.name,
    bodyPart: 'full_body', // AI-generated, we don't know the exact body part
    targetMuscle: 'multiple',
    equipment: [], // Will be filled based on area
    category: 'strength',
    difficulty: 'intermediate',
    instructions: exercise.notes ? [exercise.notes] : [],
  };

  return {
    id: crypto.randomUUID(),
    exercise: exerciseData,
    duration: exercise.duration,
    reps: exercise.reps,
    sets: exercise.sets,
    restAfter: exercise.restAfter,
    voiceCue: `Get ready for ${exercise.name}`,
    completed: false,
  };
}

/**
 * Convert generated workout to WorkoutSession format
 */
function toWorkoutSession(generated: GeneratedWorkout): WorkoutSession {
  return {
    id: crypto.randomUUID(),
    name: generated.name,
    description: generated.description,
    warmup: generated.warmup?.map(toWorkoutBlock),
    main: generated.main.map(toWorkoutBlock),
    cooldown: generated.cooldown?.map(toWorkoutBlock),
    totalDuration: generated.totalDuration,
    targetBpm: generated.targetBpm,
    createdAt: new Date(),
    status: 'draft',
  };
}

export const WorkoutPromptGenerator: Component<WorkoutPromptGeneratorProps> = (props) => {
  const [prompt, setPrompt] = createSignal('');
  const [isGenerating, setIsGenerating] = createSignal(false);
  const [generatedWorkout, setGeneratedWorkout] = createSignal<GeneratedWorkout | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [showPaywall, setShowPaywall] = createSignal(false);
  const [userSettings, setUserSettings] = createSignal<EchopraxUserSettings | null>(null);
  const [partnerCount, setPartnerCount] = createSignal(1);

  // Load user settings on mount
  onMount(() => {
    const settings = UserSettingsService.getSettings();
    setUserSettings(settings);
    setPartnerCount(settings.defaultPartnerCount);
  });

  // Check if on desktop (simple check)
  const isDesktop = createMemo(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });

  // Check premium status
  const isPremium = createMemo(() => canUseEchopraxAI().allowed);

  const handleGenerate = async () => {
    if (!prompt().trim()) {
      setError('Please enter a workout description');
      return;
    }

    // Check access: premium OR trial remaining
    const access = canUseEchopraxAI();
    const trialRemaining = AIUsageService.getUsageSummary().remaining;

    if (!access.allowed && trialRemaining <= 0) {
      // Show paywall if no subscription and no trial
      setShowPaywall(true);
      return;
    }

    setError(null);
    setIsGenerating(true);
    setGeneratedWorkout(null);

    // Build settings for API with current partner count override
    const settings = userSettings();
    const apiSettings = settings
      ? {
          partnerCount: partnerCount(),
          fitnessLevel: settings.fitnessLevel,
          preferredDurationMinutes: settings.preferredDurationMinutes,
          timing: settings.timing,
          includeWarmup: settings.includeWarmup,
          includeCooldown: settings.includeCooldown,
          countdownSeconds: settings.countdownSeconds,
        }
      : undefined;

    log.info('Generating workout', {
      prompt: prompt(),
      isPremium: isPremium(),
      partnerCount: partnerCount(),
      fitnessLevel: settings?.fitnessLevel,
    });

    try {
      const response = await fetch('/api/echoprax/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt(),
          equipment: props.area.equipment,
          constraints: props.area.constraints,
          userSettings: apiSettings,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate workout');
      }

      const data = await response.json();
      setGeneratedWorkout(data.workout);
      AIUsageService.recordGeneration(data.workout.name);
      log.info('Workout generated', {
        name: data.workout.name,
        totalDuration: data.workout.totalDuration,
        estimatedMinutes: Math.round(data.workout.totalDuration / 60),
      });
    } catch (err) {
      log.error('Generation failed', err);
      setError(err instanceof Error ? err.message : 'Failed to generate workout');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const generated = generatedWorkout();
    if (!generated) return;

    const session = toWorkoutSession(generated);
    log.info('Saving generated workout', { id: session.id, name: session.name });
    props.onSave(session);
  };

  const handleTryAgain = () => {
    setGeneratedWorkout(null);
    setError(null);
  };

  const useExamplePrompt = (example: string) => {
    setPrompt(example);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  // Mobile notice
  if (!isDesktop()) {
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
        <ViewHeader title="Generate Workout" onBack={props.onCancel} />

        <div
          style={{
            flex: 1,
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            'justify-content': 'center',
            padding: echoprax.spacing.xl,
            'text-align': 'center',
          }}
        >
          <h2
            style={{
              ...typography.headingMd,
              color: memphisColors.hotPink,
              'margin-bottom': echoprax.spacing.md,
            }}
          >
            Desktop Feature
          </h2>
          <p
            style={{
              ...typography.body,
              color: echoprax.colors.textMuted,
              'max-width': '300px',
            }}
          >
            AI workout generation is available on desktop. Use manual construction on mobile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        'min-height': '100vh',
        background: echoprax.colors.background,
        color: echoprax.colors.text,
        'font-family': echoprax.fonts.body,
      }}
    >
      {/* Header */}
      <ViewHeader title="Generate Workout" onBack={props.onCancel} />

      <div
        style={{
          'max-width': '700px',
          margin: '0 auto',
          padding: `0 ${echoprax.spacing.xl} ${echoprax.spacing.xl}`,
        }}
      >
        {/* Trial Banner (only for non-premium users) */}
        <TrialBanner isPremium={isPremium()} />

        {/* Area Info */}
        <div
          style={{
            ...memphisSurfaces.card,
            padding: echoprax.spacing.md,
            'margin-bottom': echoprax.spacing.lg,
            display: 'flex',
            'align-items': 'center',
            gap: echoprax.spacing.md,
          }}
        >
          <span style={{ ...typography.caption, color: echoprax.colors.textMuted }}>Using:</span>
          <span
            style={{ ...typography.bodySm, color: memphisColors.mintGreen, 'font-weight': '600' }}
          >
            {props.area.name}
          </span>
          <span style={{ ...typography.caption, color: echoprax.colors.textMuted }}>
            ({props.area.equipment.length} equipment items)
          </span>
        </div>

        {/* Partner Count Selector */}
        <div
          style={{
            ...memphisSurfaces.card,
            padding: echoprax.spacing.md,
            'margin-bottom': echoprax.spacing.lg,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
            gap: echoprax.spacing.md,
          }}
        >
          <div style={{ display: 'flex', 'align-items': 'center', gap: echoprax.spacing.sm }}>
            <Users size={20} color={memphisColors.electricBlue} />
            <span style={{ ...typography.bodySm, color: echoprax.colors.text }}>
              {partnerCount() === 1 ? 'Solo Workout' : `${partnerCount()} Partners`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: echoprax.spacing.xs }}>
            <For each={[1, 2, 3, 4]}>
              {(count) => (
                <button
                  type="button"
                  onClick={() => setPartnerCount(count)}
                  disabled={isGenerating()}
                  style={{
                    width: '36px',
                    height: '36px',
                    'border-radius': echoprax.radii.sm,
                    border:
                      partnerCount() === count
                        ? `2px solid ${memphisColors.electricBlue}`
                        : `1px solid ${echoprax.colors.border}`,
                    background:
                      partnerCount() === count ? `${memphisColors.electricBlue}20` : 'transparent',
                    color:
                      partnerCount() === count
                        ? memphisColors.electricBlue
                        : echoprax.colors.textMuted,
                    cursor: 'pointer',
                    ...typography.bodySm,
                    'font-weight': partnerCount() === count ? '600' : '400',
                  }}
                >
                  {count}
                </button>
              )}
            </For>
          </div>
        </div>
        <Show when={partnerCount() > 1}>
          <p
            style={{
              ...typography.caption,
              color: echoprax.colors.textMuted,
              'margin-top': `-${echoprax.spacing.sm}`,
              'margin-bottom': echoprax.spacing.lg,
              'padding-left': echoprax.spacing.md,
            }}
          >
            Duration will account for partners alternating exercises
          </p>
        </Show>

        <Show
          when={!generatedWorkout()}
          fallback={
            /* Generated Workout Preview */
            <div>
              <section
                style={{
                  ...memphisSurfaces.card,
                  padding: echoprax.spacing.lg,
                  'margin-bottom': echoprax.spacing.lg,
                }}
              >
                <h2
                  style={{
                    ...typography.headingMd,
                    color: memphisColors.hotPink,
                    margin: `0 0 ${echoprax.spacing.sm}`,
                  }}
                >
                  {generatedWorkout()!.name}
                </h2>
                <p
                  style={{
                    ...typography.body,
                    color: echoprax.colors.textMuted,
                    margin: `0 0 ${echoprax.spacing.md}`,
                  }}
                >
                  {generatedWorkout()!.description}
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: echoprax.spacing.lg,
                    ...typography.caption,
                    color: echoprax.colors.textMuted,
                  }}
                >
                  <span>
                    <strong style={{ color: memphisColors.acidYellow }}>
                      {formatDuration(generatedWorkout()!.totalDuration)}
                    </strong>{' '}
                    total
                  </span>
                  <span>
                    <strong style={{ color: memphisColors.electricBlue }}>
                      {generatedWorkout()!.targetBpm.min}-{generatedWorkout()!.targetBpm.max}
                    </strong>{' '}
                    BPM
                  </span>
                </div>
              </section>

              {/* Warmup */}
              <Show when={generatedWorkout()!.warmup && generatedWorkout()!.warmup!.length > 0}>
                <ExerciseSection
                  title="Warmup"
                  exercises={generatedWorkout()!.warmup!}
                  color={memphisColors.acidYellow}
                />
              </Show>

              {/* Main */}
              <ExerciseSection
                title="Main Workout"
                exercises={generatedWorkout()!.main}
                color={memphisColors.hotPink}
              />

              {/* Cooldown */}
              <Show when={generatedWorkout()!.cooldown && generatedWorkout()!.cooldown!.length > 0}>
                <ExerciseSection
                  title="Cooldown"
                  exercises={generatedWorkout()!.cooldown!}
                  color={memphisColors.electricBlue}
                />
              </Show>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  gap: echoprax.spacing.md,
                  'margin-top': echoprax.spacing.xl,
                }}
              >
                <button
                  type="button"
                  onClick={handleTryAgain}
                  class="echoprax-glass-btn"
                  style={{
                    ...glassButton.default,
                    flex: 1,
                    padding: echoprax.spacing.md,
                    'border-radius': echoprax.radii.md,
                    cursor: 'pointer',
                    color: echoprax.colors.textMuted,
                  }}
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  class="echoprax-glass-btn"
                  style={{
                    ...glassButton.primary,
                    flex: 2,
                    padding: echoprax.spacing.md,
                    'border-radius': echoprax.radii.md,
                    cursor: 'pointer',
                    color: memphisColors.hotPink,
                    'font-weight': '600',
                  }}
                >
                  Save Workout
                </button>
              </div>
            </div>
          }
        >
          {/* Prompt Input */}
          <section
            style={{
              ...memphisSurfaces.card,
              padding: echoprax.spacing.lg,
              'margin-bottom': echoprax.spacing.lg,
            }}
          >
            <label
              for="workout-prompt"
              style={{
                ...typography.label,
                color: memphisColors.hotPink,
                display: 'block',
                'margin-bottom': echoprax.spacing.sm,
              }}
            >
              Describe your workout
            </label>
            <textarea
              id="workout-prompt"
              value={prompt()}
              onInput={(e) => setPrompt(e.currentTarget.value)}
              placeholder="e.g., 30 minute full body HIIT workout for intermediate level"
              rows={3}
              disabled={isGenerating()}
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

            {/* Example Prompts */}
            <div style={{ 'margin-top': echoprax.spacing.md }}>
              <span
                style={{
                  ...typography.caption,
                  color: echoprax.colors.textMuted,
                  'margin-right': echoprax.spacing.sm,
                }}
              >
                Try:
              </span>
              <div
                style={{
                  display: 'flex',
                  'flex-wrap': 'wrap',
                  gap: echoprax.spacing.xs,
                  'margin-top': echoprax.spacing.xs,
                }}
              >
                <For each={examplePrompts.slice(0, 4)}>
                  {(example) => (
                    <button
                      type="button"
                      onClick={() => useExamplePrompt(example)}
                      disabled={isGenerating()}
                      style={{
                        padding: `${echoprax.spacing.xs} ${echoprax.spacing.sm}`,
                        background: 'transparent',
                        border: `1px solid ${echoprax.colors.border}`,
                        'border-radius': echoprax.radii.sm,
                        color: echoprax.colors.textMuted,
                        cursor: 'pointer',
                        ...typography.caption,
                      }}
                    >
                      {example}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </section>

          {/* Error */}
          <Show when={error()}>
            <div
              style={{
                background: `${memphisColors.coral}20`,
                border: `1px solid ${memphisColors.coral}`,
                'border-radius': echoprax.radii.md,
                padding: echoprax.spacing.md,
                'margin-bottom': echoprax.spacing.lg,
              }}
            >
              <p style={{ ...typography.bodySm, color: memphisColors.coral, margin: 0 }}>
                {error()}
              </p>
            </div>
          </Show>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating() || !prompt().trim()}
            class="echoprax-glass-btn"
            style={{
              ...glassButton.primary,
              width: '100%',
              padding: echoprax.spacing.lg,
              'border-radius': echoprax.radii.md,
              cursor: isGenerating() || !prompt().trim() ? 'not-allowed' : 'pointer',
              opacity: isGenerating() || !prompt().trim() ? 0.5 : 1,
              color: memphisColors.hotPink,
              ...typography.body,
              'font-weight': '600',
            }}
          >
            {isGenerating() ? 'Generating...' : 'Generate Workout'}
          </button>

          <Show when={isGenerating()}>
            <p
              style={{
                ...typography.caption,
                color: echoprax.colors.textMuted,
                'text-align': 'center',
                'margin-top': echoprax.spacing.md,
              }}
            >
              This may take a few seconds...
            </p>
          </Show>
        </Show>

        {/* Paywall Modal */}
        <Paywall
          isOpen={showPaywall()}
          onClose={() => setShowPaywall(false)}
          feature="echoprax_extras"
        />
      </div>
    </div>
  );
};

// Sub-component for exercise sections
const ExerciseSection: Component<{
  title: string;
  exercises: GeneratedExercise[];
  color: string;
}> = (props) => (
  <section
    style={{
      ...memphisSurfaces.card,
      padding: echoprax.spacing.lg,
      'margin-bottom': echoprax.spacing.md,
    }}
  >
    <h3
      style={{
        ...typography.label,
        color: props.color,
        margin: `0 0 ${echoprax.spacing.md}`,
      }}
    >
      {props.title} ({props.exercises.length})
    </h3>
    <div style={{ display: 'flex', 'flex-direction': 'column', gap: echoprax.spacing.sm }}>
      <For each={props.exercises}>
        {(exercise) => (
          <div
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
              padding: echoprax.spacing.sm,
              background: 'rgba(255, 255, 255, 0.02)',
              'border-radius': echoprax.radii.sm,
            }}
          >
            <div>
              <div style={{ ...typography.bodySm, color: echoprax.colors.text }}>
                {exercise.name}
              </div>
              <Show when={exercise.notes}>
                <div style={{ ...typography.caption, color: echoprax.colors.textMuted }}>
                  {exercise.notes}
                </div>
              </Show>
            </div>
            <div style={{ ...typography.caption, color: props.color, 'text-align': 'right' }}>
              <Show when={exercise.reps} fallback={<span>{exercise.duration}s</span>}>
                <span>{exercise.reps} reps</span>
              </Show>
              <Show when={exercise.sets > 1}>
                <span> x {exercise.sets}</span>
              </Show>
            </div>
          </div>
        )}
      </For>
    </div>
  </section>
);
