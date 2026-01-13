/**
 * Echoprax - Portable Boutique Fitness
 * Memphis × Retro-Futurism Design
 *
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 *
 * Open source under AGPLv3. See LICENSE for details.
 */

import {
  Component,
  createSignal,
  createResource,
  createMemo,
  createEffect,
  Show,
  For,
  onMount,
  JSX,
} from 'solid-js';
import { useNavigate, useParams, useLocation } from '@solidjs/router';
import { Gear, CaretDown, CaretUp, Play } from 'phosphor-solid';
import { SessionPlayer } from './session-player';
import { WorkoutBuilder } from './workout-builder';
import { WorkoutPersistenceService } from './lib/workout-persistence.service';
import { WorkoutAreaService } from './lib/workout-area.service';
import { AIUsageService } from './lib/ai-usage.service';
import { SessionStateService } from './lib/session-state.service';
import { WorkoutHistoryService } from './lib/workout-history.service';
import { AreaOnboarding } from './onboarding/AreaOnboarding';
import { WorkoutAreaSelector } from './areas/WorkoutAreaSelector';
import { WorkoutAreaEditor } from './areas/WorkoutAreaEditor';
import { WorkoutAreaManager } from './areas/WorkoutAreaManager';
import { WorkoutPromptGenerator } from './workout-generator/WorkoutPromptGenerator';
import { UserSettingsEditor } from './settings/UserSettingsEditor';
import { ViewHeader } from './common/ViewHeader';
import { Paywall } from '../common/Paywall';
import type { WorkoutSession, WorkoutArea } from '../../schemas/echoprax.schema';
import { canUseEchopraxAI } from '../../lib/feature-gates';
import {
  echoprax,
  echopraxCSS,
  memphisColors,
  memphisSurfaces,
  memphisPatterns,
  glassButton,
  typography,
  touchTargets,
} from '../../theme/echoprax';
import { AppMenuTrigger } from '../common/AppMenuTrigger';
import { logger } from '../../lib/logger';

const log = logger.create('Echoprax');

type View =
  | 'home'
  | 'playing'
  | 'builder'
  | 'onboarding'
  | 'area-manager'
  | 'area-editor'
  | 'prompt-generator'
  | 'mode-selection'
  | 'settings';

// ============================================================================
// DOODLE SVG ICONS (Memphis-inspired, thick strokes, geometric)
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

const TargetIcon: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 32}
    height={props.size || 32}
    viewBox="0 0 32 32"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2.5"
    stroke-linecap="round"
  >
    <circle cx="16" cy="16" r="12" />
    <circle cx="16" cy="16" r="7" />
    <circle cx="16" cy="16" r="2" fill={props.color || 'currentColor'} />
  </svg>
);

const SoundWaveIcon: Component<{ size?: number; color?: string }> = (props) => (
  <svg
    width={props.size || 32}
    height={props.size || 32}
    viewBox="0 0 32 32"
    fill="none"
    stroke={props.color || 'currentColor'}
    stroke-width="2.5"
    stroke-linecap="round"
  >
    <line x1="6" y1="12" x2="6" y2="20" />
    <line x1="11" y1="8" x2="11" y2="24" />
    <line x1="16" y1="4" x2="16" y2="28" />
    <line x1="21" y1="8" x2="21" y2="24" />
    <line x1="26" y1="12" x2="26" y2="20" />
  </svg>
);

const MusicNoteIcon: Component<{ size?: number; color?: string }> = (props) => (
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
    <circle cx="9" cy="24" r="4" fill={props.color || 'currentColor'} />
    <line x1="13" y1="24" x2="13" y2="6" />
    <path d="M13 6 C13 6, 20 4, 26 8" />
    <path d="M13 12 C13 12, 20 10, 26 14" />
  </svg>
);

// Memphis decorative geometric shapes
const MemphisTriangle: Component<{ color: string; size: number; style?: JSX.CSSProperties }> = (
  props
) => (
  <div
    style={{
      width: 0,
      height: 0,
      'border-left': `${props.size / 2}px solid transparent`,
      'border-right': `${props.size / 2}px solid transparent`,
      'border-bottom': `${props.size}px solid ${props.color}`,
      opacity: 0.6,
      ...props.style,
    }}
  />
);

const MemphisCircle: Component<{ color: string; size: number; style?: JSX.CSSProperties }> = (
  props
) => (
  <div
    class="echoprax-float"
    style={{
      width: `${props.size}px`,
      height: `${props.size}px`,
      'border-radius': '50%',
      background: props.color,
      opacity: 0.5,
      ...props.style,
    }}
  />
);

const MemphisArc: Component<{ color: string; size: number; style?: JSX.CSSProperties }> = (
  props
) => (
  <div
    style={{
      width: `${props.size}px`,
      height: `${props.size / 2}px`,
      'border-radius': `${props.size}px ${props.size}px 0 0`,
      border: `3px solid ${props.color}`,
      'border-bottom': 'none',
      background: 'transparent',
      opacity: 0.5,
      ...props.style,
    }}
  />
);

export const EchopraxApp: Component = () => {
  // Router hooks for URL-based navigation
  const navigate = useNavigate();
  const params = useParams<{ workoutId?: string; areaId?: string }>();
  const location = useLocation();

  // Derive current view from URL path
  const view = createMemo<View>(() => {
    const path = location.pathname;
    if (path.includes('/workout/')) return 'playing';
    if (path.includes('/builder/') || path === '/echoprax/builder') return 'builder';
    if (path.includes('/generator')) return 'prompt-generator';
    if (path.match(/\/areas\/[^/]+$/)) return 'area-editor'; // /areas/:id
    if (path === '/echoprax/areas') return 'area-manager';
    if (path.includes('/settings')) return 'settings';
    return 'home';
  });

  // Helper to navigate and update view
  const setView = (newView: View) => {
    switch (newView) {
      case 'home':
        navigate('/echoprax');
        break;
      case 'playing':
        // Should use startWorkout() which navigates with workout ID
        break;
      case 'builder':
        navigate('/echoprax/builder');
        break;
      case 'prompt-generator':
        navigate('/echoprax/generator');
        break;
      case 'area-manager':
        navigate('/echoprax/areas');
        break;
      case 'settings':
        navigate('/echoprax/settings');
        break;
      case 'mode-selection':
        // Mode selection stays in-memory (modal-like)
        setShowModeSelection(true);
        break;
      case 'onboarding':
        // Onboarding stays in-memory (first-time flow)
        break;
      case 'area-editor':
        // Area editor navigated via handleEditArea
        break;
    }
  };

  // In-memory state for modal-like views
  const [showModeSelection, setShowModeSelection] = createSignal(false);
  const [showOnboarding, setShowOnboarding] = createSignal(false);
  const [selectedWorkout, setSelectedWorkout] = createSignal<WorkoutSession | null>(null);
  const [editingWorkout, setEditingWorkout] = createSignal<WorkoutSession | undefined>(undefined);
  const [deleteConfirmId, setDeleteConfirmId] = createSignal<string | null>(null);
  const [selectedArea, setSelectedArea] = createSignal<WorkoutArea | null>(null);
  const [editingArea, setEditingArea] = createSignal<WorkoutArea | undefined>(undefined);
  const [showPremiumGate, setShowPremiumGate] = createSignal(false);
  const [howItWorksExpanded, setHowItWorksExpanded] = createSignal(true);

  // Check for resumable session
  const [resumableSession, setResumableSession] = createSignal(
    SessionStateService.getActiveSession()
  );

  // LocalStorage key for "How It Works" section
  const HOW_IT_WORKS_SEEN_KEY = 'echoprax:howItWorksSeen';

  // Check if on desktop (for mode selection)
  const isDesktop = createMemo(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });

  // Check if user is premium
  const isPremiumUser = createMemo(() => {
    const result = canUseEchopraxAI();
    return result.allowed;
  });

  // Load saved workouts
  const [savedWorkouts, { refetch: refetchWorkouts }] = createResource(() =>
    WorkoutPersistenceService.getWorkouts()
  );

  // Load workout from URL params if playing
  createEffect(() => {
    const workoutId = params.workoutId;
    if (workoutId && view() === 'playing') {
      WorkoutPersistenceService.getWorkoutById(workoutId).then((workout) => {
        if (workout) {
          setSelectedWorkout(workout);
          log.info('Loaded workout from URL', { id: workoutId, name: workout.name });
        } else {
          log.warn('Workout not found', { id: workoutId });
          navigate('/echoprax');
        }
      });
    }
  });

  // Load workout for editing from URL params
  createEffect(() => {
    const workoutId = params.workoutId;
    if (workoutId && view() === 'builder') {
      WorkoutPersistenceService.getWorkoutById(workoutId).then((workout) => {
        if (workout) {
          setEditingWorkout(workout);
          log.debug('Loaded workout for editing', { id: workoutId });
        }
      });
    } else if (view() === 'builder' && !workoutId) {
      setEditingWorkout(undefined);
    }
  });

  // Load area for editing from URL params
  createEffect(() => {
    const areaId = params.areaId;
    if (areaId && view() === 'area-editor') {
      if (areaId === 'new') {
        setEditingArea(undefined);
      } else {
        const areas = WorkoutAreaService.getAreas();
        const area = areas.find((a) => a.id === areaId);
        if (area) {
          setEditingArea(area);
          log.debug('Loaded area for editing', { id: areaId });
        } else {
          log.warn('Area not found', { id: areaId });
          navigate('/echoprax/areas');
        }
      }
    }
  });

  // Inject echoprax CSS on mount and check onboarding status
  onMount(() => {
    const styleId = 'echoprax-theme';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = echopraxCSS;
      document.head.appendChild(style);
    }

    // Check onboarding status
    const isComplete = WorkoutAreaService.isOnboardingComplete();

    if (!isComplete) {
      setShowOnboarding(true);
      log.info('Showing onboarding - not complete');
    } else {
      // Load default area
      const defaultArea = WorkoutAreaService.getDefaultArea();
      if (defaultArea) {
        setSelectedArea(defaultArea);
        log.debug('Loaded default area', { name: defaultArea.name });
      }
    }

    // Check if user has seen "How It Works" before - collapse if so
    const hasSeenHowItWorks = localStorage.getItem(HOW_IT_WORKS_SEEN_KEY) === 'true';
    if (hasSeenHowItWorks) {
      setHowItWorksExpanded(false);
    }

    log.info('Echoprax app mounted');
  });

  // Mark "How It Works" as seen when expanded and viewed
  createEffect(() => {
    if (howItWorksExpanded() && view() === 'home') {
      // Small delay to ensure user actually sees it
      const timer = setTimeout(() => {
        if (localStorage.getItem(HOW_IT_WORKS_SEEN_KEY) !== 'true') {
          localStorage.setItem(HOW_IT_WORKS_SEEN_KEY, 'true');
          log.debug('How It Works section marked as seen');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  });

  const startWorkout = (workout: WorkoutSession) => {
    setSelectedWorkout(workout);
    navigate(`/echoprax/workout/${workout.id}`);
    log.info('Starting workout', { name: workout.name });
  };

  // Resume a previously paused workout
  const resumeWorkout = () => {
    const session = resumableSession();
    if (session) {
      setSelectedWorkout(session.workout);
      navigate(`/echoprax/workout/${session.workoutId}`);
      log.info('Resuming workout', { name: session.workout.name });
    }
  };

  const handleWorkoutComplete = (completedWorkout: WorkoutSession) => {
    // Record completion in history
    const session = resumableSession();
    if (session) {
      const totalExercises =
        (completedWorkout.warmup?.length || 0) +
        completedWorkout.main.length +
        (completedWorkout.cooldown?.length || 0);

      WorkoutHistoryService.recordCompletion(
        completedWorkout,
        new Date(session.workout.startedAt || Date.now()),
        session.elapsedTime,
        totalExercises,
        'full'
      );
    }

    // Clear the active session
    SessionStateService.clearSession();
    setResumableSession(null);

    log.info('Workout completed');
    navigate('/echoprax');
  };

  const handleExit = () => {
    // Clear mode selection if open
    setShowModeSelection(false);
    navigate('/echoprax');
  };

  const handleCreateWorkout = () => {
    setEditingWorkout(undefined);
    // On desktop, show mode selection; on mobile, go straight to builder
    if (isDesktop()) {
      setShowModeSelection(true);
    } else {
      navigate('/echoprax/builder');
    }
  };

  const handleSelectPromptMode = () => {
    // Check if premium OR has trial remaining
    const access = canUseEchopraxAI();
    const trialRemaining = AIUsageService.getUsageSummary().remaining;

    if (access.allowed || trialRemaining > 0) {
      setShowModeSelection(false);
      navigate('/echoprax/generator');
    } else {
      setShowPremiumGate(true);
    }
  };

  const handleClosePremiumGate = () => {
    setShowPremiumGate(false);
  };

  const handleSelectConstructMode = () => {
    setShowModeSelection(false);
    navigate('/echoprax/builder');
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Load the newly created default area
    const defaultArea = WorkoutAreaService.getDefaultArea();
    if (defaultArea) {
      setSelectedArea(defaultArea);
    }
    navigate('/echoprax');
    log.info('Onboarding completed');
  };

  const handleManageAreas = () => {
    setEditingArea(undefined);
    navigate('/echoprax/areas');
  };

  const handleAreaSaved = (area: WorkoutArea) => {
    setSelectedArea(area);
    navigate('/echoprax/areas');
    log.info('Area saved', { id: area.id, name: area.name });
  };

  const handleAreaEditorCancel = () => {
    // Go back to area manager if we were editing, otherwise home
    if (editingArea() !== undefined) {
      navigate('/echoprax/areas');
    } else {
      navigate('/echoprax');
    }
  };

  const handleEditArea = (area: WorkoutArea) => {
    setEditingArea(area);
    navigate(`/echoprax/areas/${area.id}`);
    log.debug('Editing area', { id: area.id, name: area.name });
  };

  const handleCreateNewArea = () => {
    setEditingArea(undefined);
    navigate('/echoprax/areas/new');
    log.debug('Creating new area');
  };

  const handleCloseAreaManager = () => {
    // Ensure we have the latest default area
    const defaultArea = WorkoutAreaService.getDefaultArea();
    if (defaultArea) {
      setSelectedArea(defaultArea);
    }
    navigate('/echoprax');
  };

  const handleEditWorkout = (workout: WorkoutSession) => {
    setEditingWorkout(workout);
    navigate(`/echoprax/builder/${workout.id}`);
  };

  const handleSaveWorkout = async (workout: WorkoutSession) => {
    try {
      await WorkoutPersistenceService.saveWorkout(workout);
      log.info('Workout saved', { id: workout.id, name: workout.name });
      await refetchWorkouts();
      navigate('/echoprax');
    } catch (error) {
      log.error('Failed to save workout', error);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      await WorkoutPersistenceService.deleteWorkout(id);
      log.info('Workout deleted', { id });
      setDeleteConfirmId(null);
      await refetchWorkouts();
    } catch (error) {
      log.error('Failed to delete workout', error);
    }
  };

  const handleDuplicateWorkout = async (id: string) => {
    try {
      const duplicated = await WorkoutPersistenceService.duplicateWorkout(id);
      log.info('Workout duplicated', { originalId: id, newId: duplicated.id });
      await refetchWorkouts();
    } catch (error) {
      log.error('Failed to duplicate workout', error);
    }
  };

  /**
   * Format seconds as human-readable duration
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    }
    return `${mins}m`;
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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Memphis shapes (background) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          'pointer-events': 'none',
          'z-index': 0,
          overflow: 'hidden',
        }}
      >
        <MemphisCircle
          color={memphisColors.hotPink}
          size={120}
          style={{ position: 'absolute', top: '10%', right: '5%' }}
        />
        <MemphisTriangle
          color={memphisColors.acidYellow}
          size={60}
          style={{ position: 'absolute', top: '25%', left: '8%' }}
        />
        <MemphisArc
          color={memphisColors.electricBlue}
          size={80}
          style={{ position: 'absolute', bottom: '15%', right: '12%' }}
        />
        <MemphisCircle
          color={memphisColors.mintGreen}
          size={40}
          style={{ position: 'absolute', bottom: '30%', left: '15%' }}
        />
        <MemphisTriangle
          color={memphisColors.lavender}
          size={45}
          style={{ position: 'absolute', top: '60%', right: '25%' }}
        />
      </div>

      {/* Home View */}
      <Show when={view() === 'home'}>
        <div
          style={{
            'max-width': '800px',
            margin: '0 auto',
            padding: `${echoprax.spacing.lg} ${echoprax.spacing.xl}`,
            position: 'relative',
            'z-index': 1,
          }}
        >
          {/* Header - Clean, app-style */}
          <header
            style={{
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'space-between',
              'margin-bottom': echoprax.spacing.xl,
              'padding-bottom': echoprax.spacing.md,
            }}
          >
            <AppMenuTrigger>
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: echoprax.spacing.md,
                  cursor: 'pointer',
                }}
                role="button"
                tabindex="0"
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    'border-radius': echoprax.radii.md,
                    background: memphisColors.hotPink,
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'box-shadow': `0 4px 20px ${memphisColors.hotPink}40`,
                    'flex-shrink': 0,
                  }}
                  aria-hidden="true"
                >
                  <DumbbellIcon size={32} color="#FFFFFF" />
                </div>
                <h1
                  style={{
                    ...typography.brand,
                    'font-size': '2rem',
                    margin: 0,
                    'line-height': '1',
                  }}
                >
                  <span style={{ color: echoprax.colors.text }}>Echo</span>
                  <span style={{ color: memphisColors.hotPink }}>prax</span>
                </h1>
              </div>
            </AppMenuTrigger>

            {/* Settings Button */}
            <button
              type="button"
              onClick={() => navigate('/echoprax/settings')}
              class="echoprax-glass-btn"
              aria-label="Open settings"
              style={{
                ...glassButton.default,
                border: 'none',
                'border-radius': '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                cursor: 'pointer',
                color: echoprax.colors.textMuted,
              }}
            >
              <Gear size={24} />
            </button>
          </header>

          {/* Continue Workout Card - shown when there's a resumable session */}
          <Show when={resumableSession()}>
            <section style={{ 'margin-bottom': echoprax.spacing.lg }}>
              <button
                type="button"
                onClick={resumeWorkout}
                class="echoprax-glass-btn"
                style={{
                  width: '100%',
                  ...glassButton.primary,
                  'border-radius': echoprax.radii.lg,
                  padding: echoprax.spacing.lg,
                  cursor: 'pointer',
                  display: 'flex',
                  'align-items': 'center',
                  gap: echoprax.spacing.md,
                  border: `2px solid ${memphisColors.mintGreen}40`,
                  'box-shadow': `0 4px 20px ${memphisColors.mintGreen}20`,
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    'border-radius': '50%',
                    background: memphisColors.mintGreen,
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'flex-shrink': 0,
                  }}
                >
                  <Play size={24} weight="fill" color="#0D0D0D" />
                </div>
                <div style={{ flex: 1, 'text-align': 'left' }}>
                  <div
                    style={{
                      ...typography.bodySm,
                      'font-weight': '600',
                      color: memphisColors.mintGreen,
                    }}
                  >
                    Continue Workout
                  </div>
                  <div
                    style={{
                      ...typography.caption,
                      color: echoprax.colors.textMuted,
                    }}
                  >
                    {resumableSession()!.workout.name} -{' '}
                    {Math.floor(resumableSession()!.elapsedTime / 60)}m elapsed
                  </div>
                </div>
                <div
                  style={{
                    ...typography.caption,
                    color: echoprax.colors.textMuted,
                  }}
                >
                  {resumableSession()!.currentBlockIndex + 1}/
                  {(resumableSession()!.workout.warmup?.length || 0) +
                    resumableSession()!.workout.main.length +
                    (resumableSession()!.workout.cooldown?.length || 0)}{' '}
                  exercises
                </div>
              </button>
            </section>
          </Show>

          {/* My Workouts Section */}
          <section style={{ 'margin-bottom': echoprax.spacing.xxl }}>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'space-between',
                'margin-bottom': echoprax.spacing.lg,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  'align-items': 'baseline',
                  gap: echoprax.spacing.sm,
                }}
              >
                <h3
                  style={{
                    ...typography.headingSm,
                    color: echoprax.colors.text,
                    margin: 0,
                  }}
                >
                  My Workouts
                </h3>
                <Show when={savedWorkouts() && savedWorkouts()!.length > 0}>
                  <span
                    style={{
                      ...typography.caption,
                      color: echoprax.colors.textMuted,
                    }}
                  >
                    {savedWorkouts()!.length} saved
                  </span>
                </Show>
              </div>
              <button
                type="button"
                onClick={handleCreateWorkout}
                class="echoprax-glass-btn"
                style={{
                  ...glassButton.default,
                  'border-radius': echoprax.radii.md,
                  padding: `${echoprax.spacing.sm} ${echoprax.spacing.md}`,
                  cursor: 'pointer',
                  color: memphisColors.hotPink,
                  ...typography.bodySm,
                  'font-weight': '600',
                  display: 'flex',
                  'align-items': 'center',
                  gap: echoprax.spacing.xs,
                }}
              >
                <span style={{ 'font-size': '1.25rem', 'line-height': '1' }}>+</span>
                Create
              </button>
            </div>

            <Show
              when={savedWorkouts() && savedWorkouts()!.length > 0}
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
                    No saved workouts yet
                  </p>
                  <button
                    type="button"
                    onClick={handleCreateWorkout}
                    class="echoprax-glass-btn"
                    style={{
                      ...glassButton.primary,
                      'border-radius': echoprax.radii.md,
                      padding: `${echoprax.spacing.sm} ${echoprax.spacing.lg}`,
                      cursor: 'pointer',
                      color: memphisColors.hotPink,
                      ...typography.body,
                      'font-weight': '600',
                      'margin-top': echoprax.spacing.md,
                    }}
                  >
                    Create Your First Workout
                  </button>
                </div>
              }
            >
              <div
                style={{
                  display: 'grid',
                  gap: echoprax.spacing.md,
                }}
              >
                <For each={savedWorkouts()}>
                  {(workout) => (
                    <SavedWorkoutCard
                      workout={workout}
                      onStart={() => startWorkout(workout)}
                      onEdit={() => handleEditWorkout(workout)}
                      onDuplicate={() => handleDuplicateWorkout(workout.id)}
                      onDelete={() => setDeleteConfirmId(workout.id)}
                      isDeleting={deleteConfirmId() === workout.id}
                      onConfirmDelete={() => handleDeleteWorkout(workout.id)}
                      onCancelDelete={() => setDeleteConfirmId(null)}
                      formatDuration={formatDuration}
                    />
                  )}
                </For>
              </div>
            </Show>
          </section>

          {/* Features Section - Collapsible */}
          <section
            style={{
              'margin-top': echoprax.spacing.xxl,
              ...memphisSurfaces.card,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setHowItWorksExpanded(!howItWorksExpanded())}
              style={{
                width: '100%',
                padding: echoprax.spacing.lg,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                gap: echoprax.spacing.sm,
              }}
              aria-expanded={howItWorksExpanded()}
              aria-controls="how-it-works-content"
            >
              <h3
                style={{
                  ...typography.headingSm,
                  color: echoprax.colors.text,
                  margin: 0,
                }}
              >
                How It Works
              </h3>
              <span style={{ color: echoprax.colors.textMuted }}>
                <Show when={howItWorksExpanded()} fallback={<CaretDown size={20} />}>
                  <CaretUp size={20} />
                </Show>
              </span>
            </button>
            <Show when={howItWorksExpanded()}>
              <div
                id="how-it-works-content"
                style={{
                  padding: `0 ${echoprax.spacing.xl} ${echoprax.spacing.xl}`,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    'grid-template-columns': 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: echoprax.spacing.lg,
                  }}
                >
                  <FeatureItem
                    icon={<TargetIcon size={32} color={memphisColors.hotPink} />}
                    title="Timer-Driven"
                    description="Automatic transitions between exercises"
                  />
                  <FeatureItem
                    icon={<SoundWaveIcon size={32} color={memphisColors.electricBlue} />}
                    title="Voice Coaching"
                    description="Audio cues so you don't have to watch"
                  />
                  <FeatureItem
                    icon={<MusicNoteIcon size={32} color={memphisColors.acidYellow} />}
                    title="BPM Guided"
                    description="Music tempo recommendations"
                  />
                </div>
              </div>
            </Show>
          </section>

          {/* Footer */}
          <footer
            style={{
              'margin-top': echoprax.spacing.xxl,
              'padding-top': echoprax.spacing.lg,
              'text-align': 'center',
              color: echoprax.colors.textMuted,
              ...typography.caption,
            }}
          >
            <p style={{ margin: 0 }}>Open source under AGPLv3 • No subscriptions • No ads</p>
          </footer>
        </div>
      </Show>

      {/* Playing View */}
      <Show when={view() === 'playing' && selectedWorkout()}>
        <SessionPlayer
          workout={selectedWorkout()!}
          onComplete={() => handleWorkoutComplete(selectedWorkout()!)}
          onExit={handleExit}
        />
      </Show>

      {/* Builder View */}
      <Show when={view() === 'builder'}>
        <WorkoutBuilder
          initialWorkout={editingWorkout()}
          selectedArea={selectedArea() ?? undefined}
          onSave={handleSaveWorkout}
          onCancel={handleExit}
        />
      </Show>

      {/* Onboarding View - shown as overlay when not complete */}
      <Show when={showOnboarding()}>
        <AreaOnboarding onComplete={handleOnboardingComplete} />
      </Show>

      {/* Area Manager View - list of all areas */}
      <Show when={view() === 'area-manager'}>
        <WorkoutAreaManager
          onEditArea={handleEditArea}
          onCreateArea={handleCreateNewArea}
          onClose={handleCloseAreaManager}
        />
      </Show>

      {/* Area Editor View - edit/create single area */}
      <Show when={view() === 'area-editor'}>
        <WorkoutAreaEditor
          area={editingArea()}
          onSave={handleAreaSaved}
          onCancel={handleAreaEditorCancel}
        />
      </Show>

      {/* Prompt Generator View */}
      <Show when={view() === 'prompt-generator'}>
        <Show
          when={selectedArea()}
          fallback={
            <div
              style={{
                'min-height': '100vh',
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                'justify-content': 'center',
                padding: echoprax.spacing.xl,
                'text-align': 'center',
              }}
            >
              <p style={{ ...typography.body, color: echoprax.colors.textMuted }}>
                Please select a workout area first
              </p>
              <button
                type="button"
                onClick={handleExit}
                class="echoprax-glass-btn"
                style={{
                  ...glassButton.default,
                  padding: `${echoprax.spacing.sm} ${echoprax.spacing.lg}`,
                  'border-radius': echoprax.radii.md,
                  cursor: 'pointer',
                  color: echoprax.colors.textMuted,
                  'margin-top': echoprax.spacing.md,
                }}
              >
                Go Back
              </button>
            </div>
          }
        >
          <WorkoutPromptGenerator
            area={selectedArea()!}
            onSave={handleSaveWorkout}
            onCancel={handleExit}
          />
        </Show>
      </Show>

      {/* Mode Selection View - modal overlay */}
      <Show when={showModeSelection()}>
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
          <ViewHeader
            title="Create Workout"
            subtitle="Choose how you want to build"
            onBack={handleExit}
          />

          <div
            style={{
              flex: 1,
              display: 'flex',
              'flex-direction': 'column',
              'align-items': 'center',
              padding: echoprax.spacing.lg,
            }}
          >
            <div style={{ 'max-width': '500px', width: '100%' }}>
              {/* Area Selector */}
              <WorkoutAreaSelector
                selectedArea={selectedArea()}
                onSelectArea={setSelectedArea}
                onManageAreas={handleManageAreas}
              />

              {/* Mode Options */}
              <div
                style={{
                  display: 'flex',
                  'flex-direction': 'column',
                  gap: echoprax.spacing.md,
                }}
              >
                {/* Prompt Mode (AI) */}
                <button
                  type="button"
                  onClick={handleSelectPromptMode}
                  class="echoprax-glass-btn"
                  style={{
                    ...glassButton.primary,
                    width: '100%',
                    padding: echoprax.spacing.lg,
                    'border-radius': echoprax.radii.lg,
                    cursor: 'pointer',
                    display: 'flex',
                    'align-items': 'center',
                    gap: echoprax.spacing.md,
                    'text-align': 'left',
                    border: `2px solid ${memphisColors.hotPink}`,
                    'min-height': touchTargets.hero,
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      'border-radius': echoprax.radii.md,
                      background: memphisColors.hotPink,
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'flex-shrink': 0,
                    }}
                  >
                    <span style={{ 'font-size': '1.25rem', color: '#fff', 'font-weight': '700' }}>
                      AI
                    </span>
                  </div>
                  <div style={{ flex: 1, 'min-width': 0 }}>
                    <h2
                      style={{
                        ...typography.bodySm,
                        'font-weight': '600',
                        color: memphisColors.hotPink,
                        margin: 0,
                      }}
                    >
                      Prompt Mode
                    </h2>
                    <p
                      style={{
                        ...typography.caption,
                        color: echoprax.colors.textMuted,
                        margin: `2px 0 0`,
                      }}
                    >
                      Describe what you want, AI generates it
                    </p>
                  </div>
                </button>

                {/* Construct Mode (Manual) */}
                <button
                  type="button"
                  onClick={handleSelectConstructMode}
                  class="echoprax-glass-btn"
                  style={{
                    ...glassButton.default,
                    width: '100%',
                    padding: echoprax.spacing.lg,
                    'border-radius': echoprax.radii.lg,
                    cursor: 'pointer',
                    display: 'flex',
                    'align-items': 'center',
                    gap: echoprax.spacing.md,
                    'text-align': 'left',
                    'min-height': touchTargets.hero,
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      'border-radius': echoprax.radii.md,
                      background: memphisColors.electricBlue,
                      display: 'flex',
                      'align-items': 'center',
                      'justify-content': 'center',
                      'flex-shrink': 0,
                    }}
                  >
                    <DumbbellIcon size={24} color="#FFFFFF" />
                  </div>
                  <div style={{ flex: 1, 'min-width': 0 }}>
                    <h2
                      style={{
                        ...typography.bodySm,
                        'font-weight': '600',
                        color: memphisColors.electricBlue,
                        margin: 0,
                      }}
                    >
                      Construct Mode
                    </h2>
                    <p
                      style={{
                        ...typography.caption,
                        color: echoprax.colors.textMuted,
                        margin: `2px 0 0`,
                      }}
                    >
                      Build workout manually, exercise by exercise
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Settings View */}
      <Show when={view() === 'settings'}>
        <UserSettingsEditor onClose={handleExit} />
      </Show>

      {/* Premium Gate Modal */}
      <Show when={showPremiumGate()}>
        <Paywall
          isOpen={showPremiumGate()}
          onClose={handleClosePremiumGate}
          feature="echoprax_extras"
        />
      </Show>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface WorkoutCardProps {
  name: string;
  description: string;
  duration: number;
  exercises: number;
  intensity: string;
  accentColor: string;
  onClick: () => void;
}

const WorkoutCard: Component<WorkoutCardProps> = (props) => {
  return (
    <button
      onClick={() => props.onClick()}
      class="echoprax-glass-btn"
      aria-label={`Start ${props.name} workout: ${props.duration} minutes, ${props.exercises} exercises, ${props.intensity} intensity`}
      style={{
        ...glassButton.default,
        'border-radius': echoprax.radii.lg,
        padding: echoprax.spacing.lg,
        'text-align': 'left',
        cursor: 'pointer',
        width: '100%',
        display: 'flex',
        'align-items': 'center',
        gap: echoprax.spacing.lg,
        color: echoprax.colors.text,
        'min-height': '88px', // Ensure touch target
      }}
    >
      {/* Colored accent square (Memphis geometric) */}
      <div
        style={{
          width: '64px',
          height: '64px',
          'border-radius': echoprax.radii.md,
          background: props.accentColor,
          'flex-shrink': 0,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'box-shadow': `0 4px 20px ${props.accentColor}40`,
        }}
        aria-hidden="true"
      >
        <DumbbellIcon size={32} color="#FFFFFF" />
      </div>

      {/* Content */}
      <div style={{ flex: 1, 'min-width': 0 }}>
        <h4
          style={{
            ...typography.headingSm,
            'font-size': '0.875rem',
            color: echoprax.colors.text,
            margin: 0,
          }}
        >
          {props.name}
        </h4>
        <p
          style={{
            ...typography.bodySm,
            color: echoprax.colors.textMuted,
            margin: `${echoprax.spacing.xs} 0 0`,
          }}
        >
          {props.description}
        </p>
        <div
          style={{
            display: 'flex',
            'flex-wrap': 'wrap',
            gap: echoprax.spacing.sm,
            'margin-top': echoprax.spacing.sm,
            ...typography.caption,
            color: echoprax.colors.textMuted,
          }}
        >
          <span style={{ color: memphisColors.acidYellow, 'font-weight': '600' }}>
            {props.duration} min
          </span>
          <span aria-hidden="true">•</span>
          <span>{props.exercises} exercises</span>
          <span aria-hidden="true">•</span>
          <span style={{ color: memphisColors.coral, 'font-weight': '600' }}>
            {props.intensity}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <div
        style={{
          color: props.accentColor,
          ...typography.headingMd,
          'flex-shrink': 0,
        }}
        aria-hidden="true"
      >
        →
      </div>
    </button>
  );
};

interface FeatureItemProps {
  icon: JSX.Element;
  title: string;
  description: string;
}

const FeatureItem: Component<FeatureItemProps> = (props) => {
  return (
    <div style={{ 'text-align': 'center', padding: echoprax.spacing.sm }}>
      <div
        style={{
          'margin-bottom': echoprax.spacing.sm,
          display: 'flex',
          'justify-content': 'center',
        }}
        aria-hidden="true"
      >
        {props.icon}
      </div>
      <h4
        style={{
          ...typography.headingSm,
          'font-size': '0.875rem',
          color: echoprax.colors.text,
          margin: 0,
        }}
      >
        {props.title}
      </h4>
      <p
        style={{
          ...typography.caption,
          color: echoprax.colors.textMuted,
          margin: `${echoprax.spacing.xs} 0 0`,
        }}
      >
        {props.description}
      </p>
    </div>
  );
};

// Saved workout card with edit/delete actions
interface SavedWorkoutCardProps {
  workout: WorkoutSession;
  onStart: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  formatDuration: (seconds: number) => string;
}

const SavedWorkoutCard: Component<SavedWorkoutCardProps> = (props) => {
  const exerciseCount = () =>
    (props.workout.warmup?.length || 0) +
    props.workout.main.length +
    (props.workout.cooldown?.length || 0);

  return (
    <div
      style={{
        ...memphisSurfaces.card,
        padding: echoprax.spacing.lg,
        display: 'flex',
        'flex-direction': 'column',
        gap: echoprax.spacing.md,
      }}
    >
      {/* Workout Info Row */}
      <div
        style={{
          display: 'flex',
          'align-items': 'flex-start',
          gap: echoprax.spacing.md,
        }}
      >
        {/* Accent Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            'border-radius': echoprax.radii.md,
            background: memphisColors.mintGreen,
            'flex-shrink': 0,
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'box-shadow': `0 4px 20px ${memphisColors.mintGreen}40`,
          }}
          aria-hidden="true"
        >
          <DumbbellIcon size={24} color="#0D0D0D" />
        </div>

        {/* Content */}
        <div style={{ flex: 1, 'min-width': 0 }}>
          <h4
            style={{
              ...typography.headingSm,
              'font-size': '1rem',
              color: echoprax.colors.text,
              margin: 0,
            }}
          >
            {props.workout.name}
          </h4>
          <Show when={props.workout.description}>
            <p
              style={{
                ...typography.bodySm,
                color: echoprax.colors.textMuted,
                margin: `${echoprax.spacing.xs} 0 0`,
                overflow: 'hidden',
                'text-overflow': 'ellipsis',
                'white-space': 'nowrap',
              }}
            >
              {props.workout.description}
            </p>
          </Show>
          <div
            style={{
              display: 'flex',
              'flex-wrap': 'wrap',
              gap: echoprax.spacing.sm,
              'margin-top': echoprax.spacing.sm,
              ...typography.caption,
              color: echoprax.colors.textMuted,
            }}
          >
            <span style={{ color: memphisColors.acidYellow, 'font-weight': '600' }}>
              {props.formatDuration(props.workout.totalDuration)}
            </span>
            <span aria-hidden="true">•</span>
            <span>{exerciseCount()} exercises</span>
            <span aria-hidden="true">•</span>
            <span style={{ color: memphisColors.coral, 'font-weight': '600' }}>
              {props.workout.targetBpm.label}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
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
              Delete this workout?
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
          }}
        >
          {/* Start Button */}
          <button
            type="button"
            onClick={() => props.onStart()}
            class="echoprax-glass-btn"
            style={{
              ...glassButton.primary,
              flex: 1,
              'border-radius': echoprax.radii.md,
              padding: echoprax.spacing.sm,
              cursor: 'pointer',
              color: memphisColors.hotPink,
              ...typography.body,
              'font-weight': '600',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              gap: echoprax.spacing.xs,
            }}
          >
            <span>▶</span> Start
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => props.onEdit()}
            class="echoprax-glass-btn"
            style={{
              ...glassButton.default,
              'border-radius': echoprax.radii.md,
              padding: echoprax.spacing.sm,
              cursor: 'pointer',
              color: echoprax.colors.textMuted,
              ...typography.bodySm,
            }}
            aria-label="Edit workout"
          >
            ✎
          </button>

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
            aria-label="Duplicate workout"
          >
            ⧉
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
            aria-label="Delete workout"
          >
            ✕
          </button>
        </div>
      </Show>
    </div>
  );
};
