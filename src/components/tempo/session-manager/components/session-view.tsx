import { createSignal, createEffect, createMemo, onCleanup, Show, JSX } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Progress } from '../../ui/progress';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  CheckCircle,
  Clock,
  Play,
  Pause,
  CaretRight,
  Calendar,
  XCircle,
  ArrowRight,
  CircleDashed,
  ArrowsClockwise,
  CaretLeft,
  MinusCircle,
  PlusCircle,
  ListDashes,
  Timer,
  Hourglass,
  ChartBar,
} from 'phosphor-solid';
import { useSessionReducer as useSession } from '../hooks/useSessionReducer';
import { SessionStorageService } from '../../services/session-storage.service';
import { format } from 'date-fns';
import { VerticalTimeline } from './vertical-timeline';
import { TimerCompletionModal } from './timer-completion-modal';
import { TaskCompletionModal } from './task-completion-modal';
import { tempoDesign } from '../../theme/tempo-design';
import { browserNotificationService } from '../../services/browser-notification.service';

interface SessionViewProps {
  id?: string;
  date?: string;
  storageService?: SessionStorageService;
}

// Separate timer display component to prevent re-animations
const TimerDisplay = (props: { time: string; showRed: boolean; hideHurryBadge?: boolean }) => {
  // Split the time into digits and separator for individual styling
  const minutes = () => props.time.split(':')[0];
  const seconds = () => props.time.split(':')[1];

  return (
    <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'center' }}>
      <span
        style={{
          'font-family': tempoDesign.typography.fontFamily,
          'font-weight': 'bold',
          'letter-spacing': '-0.025em',
          position: 'relative',
          display: 'flex',
          'align-items': 'center',
          color: props.showRed ? tempoDesign.colors.destructive : tempoDesign.colors.primary,
        }}
      >
        <span style={{ 'font-size': '48px', 'line-height': 1 }}>{minutes()[0]}</span>
        <span style={{ 'font-size': '48px', 'line-height': 1 }}>{minutes()[1]}</span>
        <span style={{ 'font-size': '36px', margin: '0 4px', 'line-height': 1 }}>:</span>
        <span style={{ 'font-size': '48px', 'line-height': 1 }}>{seconds()[0]}</span>
        <span style={{ 'font-size': '48px', 'line-height': 1 }}>{seconds()[1]}</span>
        <Show when={props.showRed && !props.hideHurryBadge}>
          <span
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-24px',
              'font-size': tempoDesign.typography.sizes.xs,
              'font-weight': tempoDesign.typography.weights.medium,
              background: tempoDesign.colors.destructive,
              color: 'white',
              padding: '2px 6px',
              'border-radius': tempoDesign.radius.full,
              animation: 'bounce 1s infinite',
            }}
          >
            Hurry!
          </span>
        </Show>
      </span>
    </div>
  );
};

// Floating Timer Content Component separated from animation container
const FloatingTimerContent = (props: {
  title: string;
  formattedTime: string;
  isTimerRunning: boolean;
  timeRemaining: number | null;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  showRed: boolean;
  timeBoxType?: string;
  onAdjustTime?: (minutes: number) => void;
  onGoToTimeline?: () => void;
}) => {
  // Add state for edit mode
  const [showEdit, setShowEdit] = createSignal(false);

  return (
    <div
      style={{
        padding: '20px',
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
      }}
    >
      {/* Task title with drop shadow */}
      <div
        style={{
          width: '100%',
          'margin-bottom': '8px',
          'text-align': 'center',
          position: 'relative',
        }}
      >
        <span
          onClick={props.onGoToTimeline}
          style={{
            'font-size': tempoDesign.typography.sizes.sm,
            'font-weight': tempoDesign.typography.weights.semibold,
            'text-align': 'center',
            display: 'block',
            'white-space': 'nowrap',
            overflow: 'hidden',
            'text-overflow': 'ellipsis',
            cursor: props.onGoToTimeline ? 'pointer' : 'default',
            position: 'relative',
            ...(props.onGoToTimeline ? { color: tempoDesign.colors.primary } : {}),
          }}
        >
          {props.title}
        </span>

        {/* Go to timeline button */}
        <Show when={props.onGoToTimeline}>
          <Button
            variant="ghost"
            size="sm"
            onClick={props.onGoToTimeline}
            style={{
              position: 'absolute',
              right: '-8px',
              top: '50%',
              transform: 'translateY(-50%)',
              height: '24px',
              width: '24px',
              padding: 0,
              'border-radius': tempoDesign.radius.full,
              opacity: 0.7,
            }}
          >
            <CaretRight size={14} />
          </Button>
        </Show>
      </div>

      {/* Timer badge - positioned at the top */}
      <Show when={props.timeBoxType}>
        <Badge
          variant="outline"
          style={{
            'margin-bottom': '10px',
            'font-weight': tempoDesign.typography.weights.normal,
            'font-size': tempoDesign.typography.sizes.xs,
            padding: '2px 10px',
            'box-shadow': tempoDesign.shadows.sm,
            ...(props.timeBoxType === 'work'
              ? {
                  background: `${tempoDesign.colors.primary}10`,
                  color: tempoDesign.colors.primary,
                  'border-color': `${tempoDesign.colors.primary}30`,
                }
              : props.timeBoxType === 'short-break' || props.timeBoxType === 'long-break'
                ? {
                    background: `${tempoDesign.colors.frog}10`,
                    color: tempoDesign.colors.frog,
                    'border-color': `${tempoDesign.colors.frog}30`,
                  }
                : {
                    background: `${tempoDesign.colors.amber[600]}10`,
                    color: tempoDesign.colors.amber[600],
                    'border-color': `${tempoDesign.colors.amber[600]}30`,
                  }),
          }}
        >
          {props.timeBoxType === 'work'
            ? 'Focus'
            : props.timeBoxType === 'short-break'
              ? 'Short Break'
              : props.timeBoxType === 'long-break'
                ? 'Long Break'
                : 'Break'}
        </Badge>
      </Show>

      {/* Enhanced timer display with larger font */}
      <div
        style={{
          position: 'relative',
          margin: '8px 0',
          padding: '6px 8px',
          'border-radius': tempoDesign.radius.xl,
        }}
      >
        <div style={{ position: 'relative' }}>
          <TimerDisplay time={props.formattedTime} showRed={props.showRed} hideHurryBadge={true} />

          {/* Add edit button if adjustment function is provided */}
          <Show when={props.onAdjustTime}>
            <Button
              variant="ghost"
              size="icon"
              style={{
                position: 'absolute',
                right: '-32px',
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.7,
              }}
              onClick={() => setShowEdit((prev) => !prev)}
              title="Edit Timer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </Button>
          </Show>
        </div>
      </div>

      {/* Time Adjustment Controls */}
      <Show when={showEdit() && props.onAdjustTime}>
        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            gap: '8px',
            'margin-top': '4px',
            'margin-bottom': '8px',
            background: `${tempoDesign.colors.primary}10`,
            'border-radius': tempoDesign.radius.md,
            padding: '6px',
          }}
        >
          <Button
            size="icon"
            variant="ghost"
            style={{
              height: '24px',
              width: '24px',
              'border-radius': tempoDesign.radius.full,
              color: tempoDesign.colors.primary,
            }}
            onClick={() => {
              props.onAdjustTime?.(-1);
              setShowEdit(false);
            }}
          >
            <MinusCircle size={16} />
          </Button>
          <span
            style={{
              'font-size': tempoDesign.typography.sizes.xs,
              'font-weight': tempoDesign.typography.weights.medium,
            }}
          >
            Adjust Time
          </span>
          <Button
            size="icon"
            variant="ghost"
            style={{
              height: '24px',
              width: '24px',
              'border-radius': tempoDesign.radius.full,
              color: tempoDesign.colors.primary,
            }}
            onClick={() => {
              props.onAdjustTime?.(1);
              setShowEdit(false);
            }}
          >
            <PlusCircle size={16} />
          </Button>
        </div>
      </Show>

      <div
        style={{
          display: 'flex',
          gap: '20px',
          'margin-top': '12px',
          position: 'relative',
          'z-index': 10,
        }}
      >
        {/* Add Go To Timeline button */}
        <Show when={props.onGoToTimeline}>
          <div style={{ position: 'relative' }}>
            <Button
              variant="outline"
              size="icon"
              onClick={props.onGoToTimeline}
              style={{
                height: '40px',
                width: '40px',
                'border-radius': tempoDesign.radius.full,
                background: `${tempoDesign.colors.primary}10`,
                color: tempoDesign.colors.primary,
                'border-color': `${tempoDesign.colors.primary}30`,
              }}
              title="Go to timeline"
            >
              <ArrowRight size={16} />
            </Button>
          </div>
        </Show>

        <div style={{ position: 'relative' }}>
          <Show
            when={props.isTimerRunning}
            fallback={
              <Button
                variant="outline"
                size="icon"
                onClick={props.onResume}
                style={{
                  height: '40px',
                  width: '40px',
                  'border-radius': tempoDesign.radius.full,
                  background: `${tempoDesign.colors.frog}10`,
                  color: tempoDesign.colors.frog,
                  'border-color': `${tempoDesign.colors.frog}30`,
                  opacity: props.timeRemaining === 0 ? 0.5 : 1,
                  cursor: props.timeRemaining === 0 ? 'not-allowed' : 'pointer',
                }}
                disabled={props.timeRemaining === 0}
                title="Resume"
              >
                <Play size={16} style={{ 'margin-left': '2px' }} />
              </Button>
            }
          >
            <Button
              variant="outline"
              size="icon"
              onClick={props.onPause}
              style={{
                height: '40px',
                width: '40px',
                'border-radius': tempoDesign.radius.full,
                background: `${tempoDesign.colors.primary}10`,
                color: tempoDesign.colors.primary,
                'border-color': `${tempoDesign.colors.primary}30`,
              }}
              title="Pause"
            >
              <Pause size={16} />
            </Button>
          </Show>
        </div>

        <div style={{ position: 'relative' }}>
          <Button
            variant="outline"
            size="icon"
            onClick={props.onComplete}
            style={{
              height: '40px',
              width: '40px',
              'border-radius': tempoDesign.radius.full,
              background: `${tempoDesign.colors.frog}10`,
              color: tempoDesign.colors.frog,
              'border-color': `${tempoDesign.colors.frog}30`,
            }}
            title="Complete"
          >
            <CheckCircle size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Animation container that doesn't re-render with timer ticks
const FloatingTimerContainer = (props: { children: JSX.Element; isVisible: boolean }) => {
  return (
    <Show when={props.isVisible}>
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          'z-index': 100,
          background: tempoDesign.colors.card,
          'border-radius': tempoDesign.radius.xl,
          border: `1px solid ${tempoDesign.colors.primary}`,
          width: 'auto',
          'min-width': '240px',
          'box-shadow': '0 0 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(94, 106, 210, 0.2)',
          transform: 'translateY(0)',
          transition: 'all 0.3s ease-out',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {props.children}
      </div>
    </Show>
  );
};

// Dynamic content that updates without affecting the animation container
const FloatingTimerWrapper = (props: {
  title: string;
  formattedTime: string;
  isTimerRunning: boolean;
  timeRemaining: number | null;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  showRed: boolean;
  timeBoxType?: string;
  onAdjustTime?: (minutes: number) => void;
  onGoToTimeline?: () => void;
}) => {
  // Use local state for the formatted time that updates independently
  const [localFormattedTime, setLocalFormattedTime] = createSignal(props.formattedTime);

  // Format the time directly from timeRemaining to ensure it's always up to date
  createEffect(() => {
    const formatTime = () => {
      if (props.timeRemaining === null) return '00:00';
      const minutes = Math.floor(props.timeRemaining / 60);
      const seconds = props.timeRemaining % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Initial update
    setLocalFormattedTime(formatTime());

    // Only set up interval if timer is running
    if (props.isTimerRunning && props.timeRemaining !== null) {
      const interval = setInterval(() => {
        setLocalFormattedTime(formatTime());
      }, 1000);

      onCleanup(() => clearInterval(interval));
    }
  });

  // When the parent formattedTime changes, update our local copy
  createEffect(() => {
    setLocalFormattedTime(props.formattedTime);
  });

  return (
    <FloatingTimerContent
      title={props.title}
      formattedTime={localFormattedTime()}
      isTimerRunning={props.isTimerRunning}
      timeRemaining={props.timeRemaining}
      onPause={props.onPause}
      onResume={props.onResume}
      onComplete={props.onComplete}
      showRed={props.showRed}
      timeBoxType={props.timeBoxType}
      onAdjustTime={props.onAdjustTime}
      onGoToTimeline={props.onGoToTimeline}
    />
  );
};

export const SessionView = (props: SessionViewProps) => {
  const params = useParams<{ date?: string }>();

  // Use route param first, then fall back to props for backward compatibility
  const sessionId = params.date || props.id || props.date;

  // Refs for timer section to detect when it's out of viewport
  let timerCardRef: HTMLDivElement | undefined;
  let containerRef: HTMLDivElement | undefined;
  let timelineRef: HTMLDivElement | undefined;

  // Track intersection ratio for smooth animation
  const [isTimerVisible, setIsTimerVisible] = createSignal(true);
  const [viewportHeight, setViewportHeight] = createSignal(0);

  const {
    session,
    loading,
    error,
    activeTimeBox,
    timeRemaining,
    isTimerRunning,
    completedPercentage,
    isSessionComplete,
    handleTaskClick,
    startTimeBox,
    pauseTimer,
    resumeTimer,
    resetTimer,
    completeTimeBox,
    undoCompleteTimeBox,
    isCurrentTimeBox,
    updateTimeRemaining,
    completionModal,
    hideCompletionModal,
    taskCompletionModal,
    hideTaskCompletionModal,
    confirmTaskCompletion,
  } = useSession({ id: sessionId, storageService: props.storageService });

  // Request notification permission on first visit
  createEffect(() => {
    if (
      session() &&
      !browserNotificationService.isEnabled() &&
      !browserNotificationService.isDenied()
    ) {
      // Request permission after a short delay to not overwhelm the user
      setTimeout(() => {
        browserNotificationService.requestPermission();
      }, 2000);
    }
  });

  // Show warning if notifications are denied
  const [notificationWarning, setNotificationWarning] = createSignal<string | null>(null);

  createEffect(() => {
    const warning = browserNotificationService.getPermissionWarning();
    if (warning && session()) {
      setNotificationWarning(warning);
    }
  });

  // State for active time update
  const [currentFormattedTime, setCurrentFormattedTime] = createSignal('00:00');

  // Stable visibility state for floating timer
  const [stableFloatingVisible, setStableFloatingVisible] = createSignal(false);

  // Function to scroll to the active timeBox in the timeline
  const scrollToActiveTimeBox = () => {
    if (!activeTimeBox()) return;

    const timeBoxId = `${activeTimeBox()!.storyId}-box-${activeTimeBox()!.timeBoxIndex}`;

    // Find the timeline item
    const timelineItem = document.querySelector(`[data-id="${timeBoxId}"]`);

    if (timelineItem) {
      // Add a visual highlight effect to the element temporarily
      timelineItem.classList.add('timeline-highlight-pulse');

      // Scroll to the timeline first if needed
      if (timelineRef) {
        timelineRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Then after a short delay, scroll to the specific item
      setTimeout(() => {
        timelineItem.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Remove the highlight effect after animation
        setTimeout(() => {
          timelineItem.classList.remove('timeline-highlight-pulse');
        }, 2000);
      }, 500);

      // Hide the floating timer
      setStableFloatingVisible(false);
    }
  };

  // Ensure time display is updated regularly
  createEffect(() => {
    // Format the time for display
    const updateFormattedTime = () => {
      if (timeRemaining() === null) {
        setCurrentFormattedTime('00:00');
        return;
      }

      const minutes = Math.floor(timeRemaining()! / 60);
      const seconds = timeRemaining()! % 60;
      setCurrentFormattedTime(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    // Initial update
    updateFormattedTime();

    // Only update if timer is running
    if (isTimerRunning() && timeRemaining() !== null) {
      const interval = setInterval(updateFormattedTime, 1000);
      onCleanup(() => clearInterval(interval));
    }
  });

  // Calculate the active timebox type and details
  const getActiveTimeBoxDetails = () => {
    if (!session() || !activeTimeBox()) return null;

    const storyIndex = session()!.storyBlocks.findIndex(
      (story) => story.id === activeTimeBox()!.storyId
    );
    if (storyIndex === -1) return null;

    const timeBox = session()!.storyBlocks[storyIndex].timeBoxes[activeTimeBox()!.timeBoxIndex];
    const storyTitle = session()!.storyBlocks[storyIndex].title;

    return {
      title: storyTitle,
      timeBox,
      totalDuration: timeBox.duration * 60,
      type: timeBox.type,
      progress:
        timeRemaining() !== null
          ? 100 - Math.round((timeRemaining()! / (timeBox.duration * 60)) * 100)
          : 0,
    };
  };

  const activeTimeBoxDetails = createMemo(() => getActiveTimeBoxDetails());

  // Update viewport measurements
  createEffect(() => {
    if (!activeTimeBox()) return;

    const updateMeasurements = () => {
      setViewportHeight(window.innerHeight);
    };

    // Initial measurement
    updateMeasurements();

    // Throttle resize events
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateMeasurements, 100);
    };

    // Update on resize with throttling
    window.addEventListener('resize', handleResize);
    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    });
  });

  // Scroll detection for floating timer visibility
  createEffect(() => {
    if (!activeTimeBox() || !timerCardRef) return;

    const handleScroll = () => {
      if (!timerCardRef || !viewportHeight()) return;

      const rect = timerCardRef.getBoundingClientRect();

      // Calculate visibility
      const shouldBeVisible =
        rect.bottom > viewportHeight() * 0.3 && rect.top < viewportHeight() * 0.6;

      if (
        shouldBeVisible !== isTimerVisible() &&
        Math.abs(rect.top - viewportHeight() * 0.5) > 50
      ) {
        setIsTimerVisible(shouldBeVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    onCleanup(() => window.removeEventListener('scroll', handleScroll));
  });

  // Set up intersection observer as a backup and for initial detection
  createEffect(() => {
    if (!activeTimeBox() || !timerCardRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Trigger visibility update based on intersection
        if (entry.intersectionRatio < 0.5) {
          setIsTimerVisible(false);
        } else {
          setIsTimerVisible(true);
        }
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        rootMargin: '-10% 0px',
      }
    );

    observer.observe(timerCardRef);

    onCleanup(() => observer.disconnect());
  });

  // Get badge styles based on session status
  const getSessionStatusBadge = () => {
    if (!session()) return null;

    if (isSessionComplete()) {
      return (
        <Badge
          variant="outline"
          style={{
            background: `${tempoDesign.colors.frog}10`,
            color: tempoDesign.colors.frog,
            'border-color': `${tempoDesign.colors.frog}30`,
            display: 'flex',
            'align-items': 'center',
            gap: '6px',
          }}
        >
          <CheckCircle size={16} />
          Completed
        </Badge>
      );
    }

    if (activeTimeBox()) {
      return (
        <Badge
          variant="outline"
          style={{
            background: `${tempoDesign.colors.primary}10`,
            color: tempoDesign.colors.primary,
            'border-color': `${tempoDesign.colors.primary}30`,
            display: 'flex',
            'align-items': 'center',
            gap: '6px',
          }}
        >
          <Clock size={16} />
          In Progress
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        style={{
          background: `${tempoDesign.colors.amber[600]}10`,
          color: tempoDesign.colors.amber[600],
          'border-color': `${tempoDesign.colors.amber[600]}30`,
          display: 'flex',
          'align-items': 'center',
          gap: '6px',
        }}
      >
        <Calendar size={16} />
        Planned
      </Badge>
    );
  };

  // Calculate work and break durations
  const workDuration = createMemo(() =>
    session()
      ? session()!.storyBlocks.reduce(
          (total, story) =>
            total +
            story.timeBoxes
              .filter((box) => box.type === 'work')
              .reduce((sum, box) => sum + box.duration, 0),
          0
        )
      : 0
  );

  const breakDuration = createMemo(() =>
    session()
      ? session()!.storyBlocks.reduce(
          (total, story) =>
            total +
            story.timeBoxes
              .filter((box) => box.type !== 'work')
              .reduce((sum, box) => sum + box.duration, 0),
          0
        )
      : 0
  );

  // Handle complete action for floating timer
  const handleFloatingComplete = () => {
    if (activeTimeBox()) {
      completeTimeBox(activeTimeBox()!.storyId, activeTimeBox()!.timeBoxIndex);
    }
  };

  // Initialize the floating timer visibility when a timebox is active
  createEffect(() => {
    if (activeTimeBox() !== null && timeRemaining() !== null) {
      if (!isTimerVisible()) {
        setStableFloatingVisible(true);
      }
    }
  });

  // Debounce the visibility changes to prevent flickering
  createEffect(() => {
    const shouldShow = !isTimerVisible() && activeTimeBox() !== null && timeRemaining() !== null;
    const debounceTime = 200; // ms

    const timer = setTimeout(() => {
      setStableFloatingVisible(shouldShow);
    }, debounceTime);

    onCleanup(() => clearTimeout(timer));
  });

  const navigate = useNavigate();

  // Time adjustment drawer state
  const [showTimeAdjust, setShowTimeAdjust] = createSignal(false);

  // Function to adjust timer
  const adjustTimer = (minutes: number) => {
    if (timeRemaining() !== null && activeTimeBox()) {
      // Ensure we don't go below zero
      const newTime = Math.max(0, timeRemaining()! + minutes * 60);
      // Use the updateTimeRemaining function from the useSession hook
      updateTimeRemaining(newTime);
    }
  };

  return (
    <Show
      when={!loading()}
      fallback={
        <div
          style={{
            display: 'flex',
            height: '192px',
            'align-items': 'center',
            'justify-content': 'center',
          }}
        >
          <CircleDashed
            size={32}
            style={{
              animation: 'spin 1s linear infinite',
              color: tempoDesign.colors.mutedForeground,
            }}
          />
          <span
            style={{
              'margin-left': '8px',
              'font-size': tempoDesign.typography.sizes.lg,
              color: tempoDesign.colors.mutedForeground,
            }}
          >
            Loading session...
          </span>
        </div>
      }
    >
      <Show
        when={!error()}
        fallback={
          <div
            style={{
              'border-radius': tempoDesign.radius.lg,
              border: `1px solid ${tempoDesign.colors.destructive}40`,
              background: `${tempoDesign.colors.destructive}10`,
              padding: '16px',
              color: tempoDesign.colors.destructive,
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center' }}>
              <XCircle size={20} style={{ color: tempoDesign.colors.destructive }} />
              <h3
                style={{
                  'margin-left': '8px',
                  'font-size': tempoDesign.typography.sizes.lg,
                  'font-weight': tempoDesign.typography.weights.medium,
                }}
              >
                Error loading session
              </h3>
            </div>
            <p style={{ 'margin-top': '8px', 'font-size': tempoDesign.typography.sizes.sm }}>
              {error()!.message}
            </p>
            <Button
              style={{ 'margin-top': '16px' }}
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        }
      >
        <Show
          when={session()}
          fallback={
            <div
              style={{
                'border-radius': tempoDesign.radius.lg,
                border: `1px solid ${tempoDesign.colors.amber[600]}40`,
                background: `${tempoDesign.colors.amber[600]}10`,
                padding: '16px',
                color: tempoDesign.colors.amber[700],
              }}
            >
              <div style={{ display: 'flex', 'align-items': 'center' }}>
                <Calendar size={16} style={{ 'margin-right': '8px' }} />
                <h3
                  style={{
                    'margin-left': '8px',
                    'font-size': tempoDesign.typography.sizes.lg,
                    'font-weight': tempoDesign.typography.weights.medium,
                  }}
                >
                  No session found
                </h3>
              </div>
              <p style={{ 'margin-top': '8px', 'font-size': tempoDesign.typography.sizes.sm }}>
                There is no session scheduled for this date.
              </p>
            </div>
          }
        >
          <div
            style={{ display: 'flex', 'flex-direction': 'column', gap: '24px' }}
            ref={containerRef}
          >
            {/* Back to Sessions Button */}
            <Button
              variant="ghost"
              onClick={() => navigate('/tempo/sessions')}
              style={{
                'align-self': 'flex-start',
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
                'margin-bottom': '8px',
              }}
            >
              <CaretLeft size={16} />
              Back to Sessions
            </Button>

            {/* Notification Permission Warning */}
            <Show when={notificationWarning()}>
              <div
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  'border-radius': tempoDesign.radius.md,
                  background: `${tempoDesign.colors.amber[600]}15`,
                  border: `1px solid ${tempoDesign.colors.amber[600]}30`,
                  'margin-bottom': '16px',
                }}
              >
                <span
                  style={{
                    'font-size': tempoDesign.typography.sizes.sm,
                    color: tempoDesign.colors.amber[600],
                  }}
                >
                  {notificationWarning()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotificationWarning(null)}
                  style={{ 'margin-left': 'auto', color: tempoDesign.colors.amber[600] }}
                >
                  Dismiss
                </Button>
              </div>
            </Show>

            {/* Floating Timer - Separated into stable container and content */}
            <FloatingTimerContainer isVisible={stableFloatingVisible()}>
              <FloatingTimerWrapper
                title={activeTimeBoxDetails()?.title || 'Current Timebox'}
                formattedTime={currentFormattedTime()}
                isTimerRunning={isTimerRunning()}
                timeRemaining={timeRemaining()}
                onPause={pauseTimer}
                onResume={resumeTimer}
                onComplete={handleFloatingComplete}
                showRed={timeRemaining() !== null && timeRemaining()! < 60}
                timeBoxType={activeTimeBoxDetails()?.timeBox.type}
                onAdjustTime={adjustTimer}
                onGoToTimeline={scrollToActiveTimeBox}
              />
            </FloatingTimerContainer>

            {/* Session Header with Card Design */}
            <div style={{ display: 'grid', 'grid-template-columns': '1fr', gap: '24px' }}>
              <Card style={{ border: `2px solid ${tempoDesign.colors.border}` }}>
                <CardHeader style={{ 'padding-bottom': '12px' }}>
                  <CardTitle
                    style={{
                      'font-size': tempoDesign.typography.sizes['2xl'],
                      'font-weight': tempoDesign.typography.weights.bold,
                    }}
                  >
                    Session for {format(new Date(session()!.date), 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                  <div
                    style={{
                      display: 'flex',
                      'flex-wrap': 'wrap',
                      'align-items': 'center',
                      gap: '12px',
                      'margin-top': '8px',
                    }}
                  >
                    <Badge
                      variant="outline"
                      style={{
                        padding: '4px 12px',
                        display: 'flex',
                        'align-items': 'center',
                        gap: '6px',
                        background: tempoDesign.colors.card,
                        color: tempoDesign.colors.foreground,
                      }}
                    >
                      <Clock size={16} />
                      <span>
                        Total: {Math.floor(session()!.totalDuration / 60)}h{' '}
                        {session()!.totalDuration % 60}m
                      </span>
                    </Badge>

                    <Badge
                      variant="outline"
                      style={{
                        padding: '4px 12px',
                        display: 'flex',
                        'align-items': 'center',
                        gap: '6px',
                        background: tempoDesign.colors.secondary,
                      }}
                    >
                      <CheckCircle size={16} />
                      <span>
                        Work: {Math.floor(workDuration() / 60)}h {workDuration() % 60}m
                      </span>
                    </Badge>

                    <Badge
                      variant="outline"
                      style={{
                        padding: '4px 12px',
                        display: 'flex',
                        'align-items': 'center',
                        gap: '6px',
                        background: tempoDesign.colors.secondary,
                      }}
                    >
                      <Pause size={16} />
                      <span>
                        Breaks: {Math.floor(breakDuration() / 60)}h {breakDuration() % 60}m
                      </span>
                    </Badge>

                    {getSessionStatusBadge()}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Metric Cards Grid */}
                  <div
                    style={{
                      display: 'grid',
                      'grid-template-columns': 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                      'margin-top': '4px',
                      'margin-bottom': '4px',
                    }}
                  >
                    {/* Card 1: Completed Frogs (Stories) */}
                    <div
                      style={{
                        background: `${tempoDesign.colors.primary}10`,
                        border: `1px solid ${tempoDesign.colors.primary}30`,
                        'border-radius': tempoDesign.radius.lg,
                        padding: '12px',
                        display: 'flex',
                        'flex-direction': 'column',
                        'align-items': 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                          width: '32px',
                          height: '32px',
                          'border-radius': tempoDesign.radius.full,
                          background: `${tempoDesign.colors.primary}20`,
                          'margin-bottom': '4px',
                        }}
                      >
                        <span
                          style={{
                            'font-size': '12px',
                            'font-weight': tempoDesign.typography.weights.bold,
                            color: tempoDesign.colors.primary,
                          }}
                        >
                          FROG
                        </span>
                      </div>
                      <span
                        style={{
                          'font-size': tempoDesign.typography.sizes.xs,
                          'font-weight': tempoDesign.typography.weights.medium,
                          color: tempoDesign.colors.primary,
                          'margin-bottom': '4px',
                        }}
                      >
                        Frogs Completed
                      </span>
                      <span
                        style={{
                          'font-size': tempoDesign.typography.sizes.lg,
                          'font-weight': tempoDesign.typography.weights.bold,
                        }}
                      >
                        {
                          session()!.storyBlocks.filter((story) =>
                            story.timeBoxes.every((box) =>
                              box.type === 'work' ? box.status === 'completed' : true
                            )
                          ).length
                        }
                        <span
                          style={{
                            'font-size': tempoDesign.typography.sizes.sm,
                            'font-weight': tempoDesign.typography.weights.medium,
                            opacity: 0.7,
                          }}
                        >
                          {' '}
                          / {session()!.storyBlocks.length}
                        </span>
                      </span>
                    </div>

                    {/* Card 2: Completed Tasks */}
                    <div
                      style={{
                        background: `${tempoDesign.colors.frog}10`,
                        border: `1px solid ${tempoDesign.colors.frog}30`,
                        'border-radius': tempoDesign.radius.lg,
                        padding: '12px',
                        display: 'flex',
                        'flex-direction': 'column',
                        'align-items': 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                          width: '32px',
                          height: '32px',
                          'border-radius': tempoDesign.radius.full,
                          background: `${tempoDesign.colors.frog}20`,
                          'margin-bottom': '4px',
                        }}
                      >
                        <ListDashes size={16} style={{ color: tempoDesign.colors.frog }} />
                      </div>
                      <span
                        style={{
                          'font-size': tempoDesign.typography.sizes.xs,
                          'font-weight': tempoDesign.typography.weights.medium,
                          color: tempoDesign.colors.frog,
                          'margin-bottom': '4px',
                        }}
                      >
                        Tasks Completed
                      </span>
                      <span
                        style={{
                          'font-size': tempoDesign.typography.sizes.lg,
                          'font-weight': tempoDesign.typography.weights.bold,
                        }}
                      >
                        {session()!.storyBlocks.reduce(
                          (sum, story) =>
                            sum +
                            story.timeBoxes.reduce(
                              (boxSum, box) =>
                                boxSum +
                                (box.tasks?.filter((t) => t.status === 'completed').length || 0),
                              0
                            ),
                          0
                        )}
                        <span
                          style={{
                            'font-size': tempoDesign.typography.sizes.sm,
                            'font-weight': tempoDesign.typography.weights.medium,
                            opacity: 0.7,
                          }}
                        >
                          {' '}
                          /{' '}
                          {session()!.storyBlocks.reduce(
                            (sum, story) =>
                              sum +
                              story.timeBoxes.reduce(
                                (boxSum, box) => boxSum + (box.tasks?.length || 0),
                                0
                              ),
                            0
                          )}
                        </span>
                      </span>
                    </div>

                    {/* Card 3: Time Worked */}
                    <div
                      style={{
                        background: `${tempoDesign.colors.primary}10`,
                        border: `1px solid ${tempoDesign.colors.primary}30`,
                        'border-radius': tempoDesign.radius.lg,
                        padding: '12px',
                        display: 'flex',
                        'flex-direction': 'column',
                        'align-items': 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                          width: '32px',
                          height: '32px',
                          'border-radius': tempoDesign.radius.full,
                          background: `${tempoDesign.colors.primary}20`,
                          'margin-bottom': '4px',
                        }}
                      >
                        <Timer size={16} style={{ color: tempoDesign.colors.primary }} />
                      </div>
                      <span
                        style={{
                          'font-size': tempoDesign.typography.sizes.xs,
                          'font-weight': tempoDesign.typography.weights.medium,
                          color: tempoDesign.colors.primary,
                          'margin-bottom': '4px',
                        }}
                      >
                        Time Worked
                      </span>
                      <span
                        style={{
                          'font-size': tempoDesign.typography.sizes.lg,
                          'font-weight': tempoDesign.typography.weights.bold,
                        }}
                      >
                        {(() => {
                          const completedMinutes = session()!.storyBlocks.reduce(
                            (total, story) =>
                              total +
                              story.timeBoxes
                                .filter((box) => box.status === 'completed')
                                .reduce((sum, box) => sum + box.duration, 0),
                            0
                          );
                          const hours = Math.floor(completedMinutes / 60);
                          const minutes = completedMinutes % 60;
                          return `${hours}h ${minutes}m`;
                        })()}
                      </span>
                    </div>

                    {/* Card 4: Time Remaining */}
                    <div
                      style={{
                        background: `${tempoDesign.colors.amber[600]}10`,
                        border: `1px solid ${tempoDesign.colors.amber[600]}30`,
                        'border-radius': tempoDesign.radius.lg,
                        padding: '12px',
                        display: 'flex',
                        'flex-direction': 'column',
                        'align-items': 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                          width: '32px',
                          height: '32px',
                          'border-radius': tempoDesign.radius.full,
                          background: `${tempoDesign.colors.amber[600]}20`,
                          'margin-bottom': '4px',
                        }}
                      >
                        <Hourglass size={16} style={{ color: tempoDesign.colors.amber[600] }} />
                      </div>
                      <span
                        style={{
                          'font-size': tempoDesign.typography.sizes.xs,
                          'font-weight': tempoDesign.typography.weights.medium,
                          color: tempoDesign.colors.amber[600],
                          'margin-bottom': '4px',
                        }}
                      >
                        Time Remaining
                      </span>
                      <span
                        style={{
                          'font-size': tempoDesign.typography.sizes.lg,
                          'font-weight': tempoDesign.typography.weights.bold,
                        }}
                      >
                        {(() => {
                          const totalMinutes = session()!.totalDuration;
                          const completedMinutes = session()!.storyBlocks.reduce(
                            (total, story) =>
                              total +
                              story.timeBoxes
                                .filter((box) => box.status === 'completed')
                                .reduce((sum, box) => sum + box.duration, 0),
                            0
                          );
                          const remainingMinutes = totalMinutes - completedMinutes;
                          const hours = Math.floor(remainingMinutes / 60);
                          const minutes = remainingMinutes % 60;
                          return `${hours}h ${minutes}m`;
                        })()}
                      </span>
                    </div>

                    {/* Card 5: Completion Rate */}
                    <div
                      style={{
                        background: `${tempoDesign.colors.primary}10`,
                        border: `1px solid ${tempoDesign.colors.primary}30`,
                        'border-radius': tempoDesign.radius.lg,
                        padding: '12px',
                        display: 'flex',
                        'flex-direction': 'column',
                        'align-items': 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                          width: '32px',
                          height: '32px',
                          'border-radius': tempoDesign.radius.full,
                          background: `${tempoDesign.colors.primary}20`,
                          'margin-bottom': '4px',
                        }}
                      >
                        <ChartBar size={16} style={{ color: tempoDesign.colors.primary }} />
                      </div>
                      <span
                        style={{
                          'font-size': tempoDesign.typography.sizes.xs,
                          'font-weight': tempoDesign.typography.weights.medium,
                          color: tempoDesign.colors.primary,
                          'margin-bottom': '4px',
                        }}
                      >
                        Progress Rate
                      </span>
                      <span
                        style={{
                          'font-size': tempoDesign.typography.sizes.lg,
                          'font-weight': tempoDesign.typography.weights.bold,
                        }}
                      >
                        {completedPercentage()}%
                        <span
                          style={{
                            'font-size': tempoDesign.typography.sizes.sm,
                            'font-weight': tempoDesign.typography.weights.medium,
                            opacity: 0.7,
                          }}
                        >
                          {' '}
                          completed
                        </span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Timer Card - Responsive position */}
              <Show when={activeTimeBox() !== null}>
                <Card
                  ref={timerCardRef}
                  style={{
                    'border-color': tempoDesign.colors.primary,
                    background: tempoDesign.colors.card,
                    'box-shadow': tempoDesign.shadows.md,
                  }}
                >
                  <CardHeader class="pb-2 text-center">
                    <CardTitle class="text-center">Active Timer</CardTitle>
                    <div style={{ 'margin-top': '8px', position: 'relative' }}>
                      <TimerDisplay
                        time={currentFormattedTime()}
                        showRed={timeRemaining() !== null && timeRemaining()! < 60}
                      />
                      {/* Add edit button for timer adjustment */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowTimeAdjust(!showTimeAdjust())}
                        style={{
                          position: 'absolute',
                          right: '-24px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          opacity: 0.6,
                          'padding-right': '16px',
                        }}
                        title="Edit Timer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </Button>
                    </div>
                    <CardDescription
                      style={{
                        'margin-top': '12px',
                        display: 'flex',
                        'flex-direction': 'column',
                        'align-items': 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          'font-weight': tempoDesign.typography.weights.medium,
                          'font-size': tempoDesign.typography.sizes.sm,
                        }}
                      >
                        {activeTimeBoxDetails()?.title || 'Loading...'}
                      </span>
                      <Badge
                        variant="outline"
                        style={{
                          'font-weight': tempoDesign.typography.weights.normal,
                          ...(activeTimeBoxDetails()?.timeBox.type === 'work'
                            ? {
                                background: `${tempoDesign.colors.primary}10`,
                                color: tempoDesign.colors.primary,
                                'border-color': `${tempoDesign.colors.primary}30`,
                              }
                            : activeTimeBoxDetails()?.timeBox.type === 'short-break' ||
                                activeTimeBoxDetails()?.timeBox.type === 'long-break'
                              ? {
                                  background: `${tempoDesign.colors.frog}10`,
                                  color: tempoDesign.colors.frog,
                                  'border-color': `${tempoDesign.colors.frog}30`,
                                }
                              : {
                                  background: `${tempoDesign.colors.amber[600]}10`,
                                  color: tempoDesign.colors.amber[600],
                                  'border-color': `${tempoDesign.colors.amber[600]}30`,
                                }),
                        }}
                      >
                        {activeTimeBoxDetails()?.timeBox.type === 'work'
                          ? 'Focus'
                          : activeTimeBoxDetails()?.timeBox.type === 'short-break'
                            ? 'Short Break'
                            : activeTimeBoxDetails()?.timeBox.type === 'long-break'
                              ? 'Long Break'
                              : 'Break'}
                      </Badge>
                    </CardDescription>
                  </CardHeader>

                  {/* Time Adjustment Drawer */}
                  <Show when={showTimeAdjust()}>
                    <div style={{ padding: '0 16px 12px', transition: 'all 0.3s' }}>
                      <div
                        style={{
                          'border-radius': tempoDesign.radius.lg,
                          padding: '12px',
                          background: 'transparent',
                        }}
                      >
                        <h4
                          style={{
                            'font-size': tempoDesign.typography.sizes.xs,
                            'font-weight': tempoDesign.typography.weights.medium,
                            'text-align': 'center',
                            'margin-bottom': '8px',
                            color: tempoDesign.colors.mutedForeground,
                          }}
                        >
                          Add/Remove Time
                        </h4>
                        <div
                          style={{
                            display: 'flex',
                            'justify-content': 'center',
                            'align-items': 'center',
                            gap: '8px',
                            margin: '0 auto',
                          }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            style={{
                              height: '28px',
                              padding: '0 6px',
                              'font-size': tempoDesign.typography.sizes.xs,
                              'border-color': tempoDesign.colors.destructive,
                            }}
                            onClick={() => adjustTimer(-5)}
                          >
                            <CaretLeft size={12} style={{ 'margin-right': '2px' }} />
                            <CaretLeft size={12} style={{ 'margin-left': '-6px' }} />
                            <span
                              style={{
                                'margin-left': '2px',
                                'font-size': '10px',
                                'font-weight': 'bold',
                              }}
                            >
                              -5m
                            </span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            style={{
                              height: '28px',
                              padding: '0 6px',
                              'font-size': tempoDesign.typography.sizes.xs,
                              'border-color': tempoDesign.colors.destructive,
                            }}
                            onClick={() => adjustTimer(-1)}
                          >
                            <CaretLeft size={12} style={{ 'margin-right': '2px' }} />
                            <span
                              style={{
                                'margin-left': '2px',
                                'font-size': '10px',
                                'font-weight': 'bold',
                              }}
                            >
                              -1m
                            </span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            style={{
                              height: '28px',
                              padding: '0 6px',
                              'font-size': tempoDesign.typography.sizes.xs,
                              'border-color': tempoDesign.colors.frog,
                            }}
                            onClick={() => adjustTimer(1)}
                          >
                            <span
                              style={{
                                'margin-right': '2px',
                                'font-size': '10px',
                                'font-weight': 'bold',
                              }}
                            >
                              +1m
                            </span>
                            <CaretRight size={12} style={{ 'margin-left': '2px' }} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            style={{
                              height: '28px',
                              padding: '0 6px',
                              'font-size': tempoDesign.typography.sizes.xs,
                              'border-color': tempoDesign.colors.frog,
                            }}
                            onClick={() => adjustTimer(5)}
                          >
                            <span
                              style={{
                                'margin-right': '2px',
                                'font-size': '10px',
                                'font-weight': 'bold',
                              }}
                            >
                              +5m
                            </span>
                            <CaretRight size={12} style={{ 'margin-left': '2px' }} />
                            <CaretRight size={12} style={{ 'margin-left': '-6px' }} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Show>

                  <CardContent class="pb-2">
                    <Progress
                      value={100 - (activeTimeBoxDetails()?.progress || 0)}
                      style={{
                        height: '8px',
                        'margin-bottom': '4px',
                        background: tempoDesign.colors.secondary,
                      }}
                      indicatorStyle={{
                        background: `linear-gradient(to right, ${tempoDesign.colors.primary}, ${tempoDesign.colors.primaryHover})`,
                      }}
                    />
                  </CardContent>
                  <CardFooter
                    style={{
                      'padding-top': 0,
                      'padding-bottom': '16px',
                      display: 'flex',
                      'justify-content': 'center',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        'justify-content': 'center',
                        gap: '24px',
                        width: '100%',
                        'max-width': '320px',
                      }}
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={resetTimer}
                        disabled={!activeTimeBox()}
                        style={{
                          height: '40px',
                          width: '40px',
                          'border-radius': tempoDesign.radius.full,
                        }}
                        title="Reset timer"
                      >
                        <ArrowsClockwise size={16} />
                      </Button>

                      <Show
                        when={isTimerRunning()}
                        fallback={
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={resumeTimer}
                            style={{
                              height: '40px',
                              width: '40px',
                              'border-radius': tempoDesign.radius.full,
                              background: `${tempoDesign.colors.frog}10`,
                              color: tempoDesign.colors.frog,
                              'border-color': `${tempoDesign.colors.frog}30`,
                            }}
                            disabled={!activeTimeBox() || timeRemaining() === 0}
                            title="Resume timer"
                          >
                            <Play size={16} />
                          </Button>
                        }
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={pauseTimer}
                          style={{
                            height: '40px',
                            width: '40px',
                            'border-radius': tempoDesign.radius.full,
                            background: `${tempoDesign.colors.primary}10`,
                            color: tempoDesign.colors.primary,
                            'border-color': `${tempoDesign.colors.primary}30`,
                          }}
                          title="Pause timer"
                        >
                          <Pause size={16} />
                        </Button>
                      </Show>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          activeTimeBox() &&
                          completeTimeBox(activeTimeBox()!.storyId, activeTimeBox()!.timeBoxIndex)
                        }
                        style={{
                          height: '40px',
                          width: '40px',
                          'border-radius': tempoDesign.radius.full,
                          background: `${tempoDesign.colors.frog}10`,
                          color: tempoDesign.colors.frog,
                          'border-color': `${tempoDesign.colors.frog}30`,
                        }}
                        title="Complete this timebox"
                      >
                        <CheckCircle size={16} />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </Show>
            </div>

            {/* Add vertical timeline view */}
            <div style={{ 'margin-top': '32px' }} ref={timelineRef}>
              <Card style={{ border: `1px solid ${tempoDesign.colors.border}` }}>
                <CardHeader class="pb-2">
                  <CardTitle style={{ 'font-size': tempoDesign.typography.sizes.xl }}>
                    Session Progress
                  </CardTitle>
                  <CardDescription>
                    Track your progress through the session with this interactive timeline
                  </CardDescription>
                </CardHeader>
                <CardContent style={{ 'padding-top': '24px' }}>
                  <VerticalTimeline
                    storyBlocks={session()!.storyBlocks}
                    activeTimeBoxId={
                      activeTimeBox()
                        ? `${activeTimeBox()!.storyId}-box-${activeTimeBox()!.timeBoxIndex}`
                        : undefined
                    }
                    activeStoryId={activeTimeBox()?.storyId}
                    activeTimeBoxIndex={activeTimeBox()?.timeBoxIndex}
                    startTime={session()!.lastUpdated || new Date().toISOString()}
                    completedPercentage={completedPercentage()}
                    timerProgress={activeTimeBoxDetails()?.progress}
                    onTaskClick={handleTaskClick}
                    onTimeBoxClick={(storyId: string, timeBoxIndex: number) => {
                      const story = session()!.storyBlocks.find((s) => s.id === storyId);
                      if (!story) return;

                      const timeBox = story.timeBoxes[timeBoxIndex];
                      if (!timeBox) return;

                      if (isCurrentTimeBox(timeBox)) {
                        // Current timebox clicked - no action needed
                      }
                    }}
                    onStartTimeBox={startTimeBox}
                    onCompleteTimeBox={(storyId: string, timeBoxIndex: number) => {
                      completeTimeBox(storyId, timeBoxIndex);
                    }}
                    onUndoCompleteTimeBox={(storyId: string, timeBoxIndex: number) => {
                      undoCompleteTimeBox(storyId, timeBoxIndex);
                    }}
                    onStartSessionDebrief={(duration: number) => {
                      // Create a synthetic timebox for the debrief
                      const debriefId = 'session-debrief';

                      // Set up a special timer for the debrief
                      // In a real implementation, we could add this to the storyBlocks,
                      // but for simplicity we'll just run the timer
                      startTimeBox(debriefId, 0, duration);
                    }}
                    isCompactView={false}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Timer Completion Modal */}
            <TimerCompletionModal
              isOpen={completionModal().isOpen}
              title={completionModal().title}
              description={completionModal().description}
              actionLabel={completionModal().actionLabel}
              onAction={completionModal().onAction}
              onClose={hideCompletionModal}
              variant={completionModal().variant}
            />

            {/* Task Completion Modal */}
            <TaskCompletionModal
              isOpen={taskCompletionModal().isOpen}
              taskName={taskCompletionModal().taskName}
              onConfirm={confirmTaskCompletion}
            />
          </div>
        </Show>
      </Show>
    </Show>
  );
};
