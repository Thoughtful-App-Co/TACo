import { createSignal, createEffect, createMemo, onCleanup, Show, For, JSX } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { cn } from '../../lib/utils'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card'
import { Progress } from '../../ui/progress'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
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
  ChartBar
} from 'phosphor-solid'
import { useSession } from '../hooks/useSession'
import { SessionStorageService } from '../../services/session-storage.service'
import { format } from 'date-fns'
import { VerticalTimeline } from './vertical-timeline'
// TODO: Replace with Phosphor icon or inline SVG
// import { LiaFrogSolid } from 'react-icons/lia'

interface SessionViewProps {
  id?: string;
  date?: string;
  storageService?: SessionStorageService;
}

// Separate timer display component to prevent re-animations
const TimerDisplay = (props: { 
  time: string, 
  showRed: boolean,
  hideHurryBadge?: boolean
}) => {
  // Split the time into digits and separator for individual styling
  const minutes = () => props.time.split(':')[0];
  const seconds = () => props.time.split(':')[1];
  
  return (
    <div class="flex items-center justify-center">
      <span 
        class={cn(
          "font-display font-bold tracking-tight relative",
          props.showRed 
            ? "text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500" 
            : "text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-blue-500 dark:from-indigo-400 dark:to-blue-300"
        )}
      >
        <span class={cn(
          "timer-digit text-5xl", 
          props.showRed && "timer-urgent"
        )} style={{ "animation-delay": "0ms" }}>
          {minutes()[0]}
        </span>
        <span class={cn(
          "timer-digit text-5xl", 
          props.showRed && "timer-urgent"
        )} style={{ "animation-delay": "150ms" }}>
          {minutes()[1]}
        </span>
        <span class="timer-colon text-4xl mx-1">:</span>
        <span class={cn(
          "timer-digit text-5xl", 
          props.showRed && "timer-urgent"
        )} style={{ "animation-delay": "300ms" }}>
          {seconds()[0]}
        </span>
        <span class={cn(
          "timer-digit text-5xl", 
          props.showRed && "timer-urgent"
        )} style={{ "animation-delay": "450ms" }}>
          {seconds()[1]}
        </span>
        <Show when={props.showRed && !props.hideHurryBadge}>
          <span class="absolute -top-2 -right-6 text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full animate-bounce">
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
    <div class="p-5 flex flex-col items-center">
      {/* Task title with drop shadow */}
      <div class="w-full mb-2 text-center relative">
        <span 
          onClick={props.onGoToTimeline} 
          class={cn(
            "text-sm font-semibold text-center drop-shadow-sm line-clamp-1 cursor-pointer relative",
            props.onGoToTimeline && "hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline underline-offset-2"
          )}
        >
          {props.title}
          <Show when={props.onGoToTimeline}>
            <span class="absolute -right-4 top-1/2 -translate-y-1/2 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight size={12} />
            </span>
          </Show>
        </span>
        
        {/* Go to timeline button */}
        <Show when={props.onGoToTimeline}>
          <Button
            variant="ghost"
            size="sm"
            onClick={props.onGoToTimeline}
            class="absolute -right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 rounded-full opacity-70 hover:opacity-100 transition-opacity hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            <CaretRight size={14} />
          </Button>
        </Show>
      </div>
      
      {/* Timer badge - positioned at the top */}
      <Show when={props.timeBoxType}>
        <Badge variant="outline" class={cn(
          "mb-2.5 font-normal text-xs px-2.5 py-0.5 shadow-sm",
          props.timeBoxType === 'work' 
            ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-400"
            : props.timeBoxType === 'short-break' || props.timeBoxType === 'long-break'
              ? "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/30 dark:border-teal-800 dark:text-teal-400"
              : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
        )}>
          {props.timeBoxType === 'work' ? 'Focus' : props.timeBoxType === 'short-break' ? 'Short Break' : props.timeBoxType === 'long-break' ? 'Long Break' : 'Break'}
        </Badge>
      </Show>
      
      {/* Enhanced timer display with larger font */}
      <div class="relative -mx-2 my-2 px-2 py-1.5 rounded-xl">
        <div class="absolute inset-0 bg-gradient-to-b from-indigo-50/20 to-transparent dark:from-orange-900/10 dark:to-transparent rounded-xl"></div>
        <div class="relative">
          <TimerDisplay 
            time={props.formattedTime} 
            showRed={props.showRed}
            hideHurryBadge={true} 
          />
          
          {/* Add edit button if adjustment function is provided */}
          <Show when={props.onAdjustTime}>
            <Button 
              variant="ghost" 
              size="icon" 
              class="absolute -right-8 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
              onClick={() => setShowEdit(prev => !prev)}
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
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </Button>
          </Show>
        </div>
      </div>
      
      {/* Time Adjustment Controls */}
      <Show when={showEdit() && props.onAdjustTime}>
        <div class="flex items-center justify-center gap-2 mt-1 mb-2 bg-indigo-50/50 dark:bg-gray-800/30 rounded-lg p-1.5">
          <Button 
            size="icon" 
            variant="ghost" 
            class="h-6 w-6 rounded-full text-indigo-700 dark:text-indigo-400"
            onClick={() => {
              props.onAdjustTime?.(-1);
              setShowEdit(false);
            }}
          >
            <MinusCircle size={16} />
          </Button>
          <span class="text-xs font-medium">Adjust Time</span>
          <Button 
            size="icon" 
            variant="ghost" 
            class="h-6 w-6 rounded-full text-indigo-700 dark:text-indigo-400"
            onClick={() => {
              props.onAdjustTime?.(1);
              setShowEdit(false);
            }}
          >
            <PlusCircle size={16} />
          </Button>
        </div>
      </Show>
      
      <div class="flex gap-5 mt-3 relative z-10">
        {/* Add Go To Timeline button */}
        <Show when={props.onGoToTimeline}>
          <div class="relative group">
            <Button
              variant="outline"
              size="icon"
              onClick={props.onGoToTimeline}
              class="h-10 w-10 rounded-full bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800/50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 transition-all duration-200 hover:scale-105"
              title="Go to timeline"
            >
              <ArrowRight size={16} />
            </Button>
          </div>
        </Show>
        
        <div class="relative group">
          <Show 
            when={props.isTimerRunning}
            fallback={
              <Button 
                variant="outline" 
                size="icon" 
                onClick={props.onResume}
                class="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-400 dark:hover:bg-emerald-950/50 transition-all duration-200 hover:scale-105"
                disabled={props.timeRemaining === 0}
                title="Resume"
              >
                <Play size={16} class="ml-0.5" />
              </Button>
            }
          >
            <Button 
              variant="outline" 
              size="icon" 
              onClick={props.onPause}
              class="h-10 w-10 rounded-full bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-800/50 dark:text-blue-400 dark:hover:bg-blue-950/50 transition-all duration-200 hover:scale-105"
              title="Pause"
            >
              <Pause size={16} />
            </Button>
          </Show>
        </div>
        
        <div class="relative group">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={props.onComplete}
            class="h-10 w-10 rounded-full bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-950/40 dark:border-green-800/50 dark:text-green-400 dark:hover:bg-green-950/50 transition-all duration-200 hover:scale-105"
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
// Note: Framer Motion animations converted to CSS transitions
const FloatingTimerContainer = (props: { 
  children: JSX.Element,
  isVisible: boolean
}) => {
  return (
    <Show when={props.isVisible}>
      <div 
        class="fixed bottom-6 right-6 z-[100] shadow-xl timer-card-container floating transform-gpu bg-white dark:bg-gray-900 group transition-all duration-300 ease-out animate-slide-up"
        style={{
          "border-color": "var(--timer-border-color)",
          background: "var(--timer-background)",
          width: "auto",
          "min-width": "240px",
          "box-shadow": "0 0 25px rgba(0, 0, 0, 0.15), 0 0 15px rgba(99, 102, 241, 0.2)"
        }}
      >
        {/* Pulsing indicator to draw attention to the go-to feature */}
        <div class="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-indigo-500 dark:bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:animate-ping"></div>
        
        {/* Sparkle decoration elements */}
        <div class="sparkle-decoration">
          <div class="sparkle-dot"></div>
          <div class="sparkle-dot"></div>
          <div class="sparkle-dot"></div>
          <div class="sparkle-dot"></div>
          <div class="sparkle-dot"></div>
        </div>
        <div class="shine-line"></div>
        
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
  // Use date as id if provided (for backward compatibility)
  const sessionId = props.id || props.date;
  
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
    updateTimeRemaining
  } = useSession({ id: sessionId, storageService: props.storageService });

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
      setCurrentFormattedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
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
    
    const storyIndex = session()!.storyBlocks.findIndex(story => story.id === activeTimeBox()!.storyId);
    if (storyIndex === -1) return null;
    
    const timeBox = session()!.storyBlocks[storyIndex].timeBoxes[activeTimeBox()!.timeBoxIndex];
    const storyTitle = session()!.storyBlocks[storyIndex].title;
    
    return {
      title: storyTitle,
      timeBox,
      totalDuration: timeBox.duration * 60,
      type: timeBox.type,
      progress: timeRemaining() !== null ? 100 - Math.round((timeRemaining()! / (timeBox.duration * 60)) * 100) : 0
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
      const shouldBeVisible = rect.bottom > viewportHeight() * 0.3 && rect.top < viewportHeight() * 0.6;
      
      if (shouldBeVisible !== isTimerVisible() && Math.abs(rect.top - viewportHeight() * 0.5) > 50) {
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
        rootMargin: "-10% 0px" 
      }
    );
    
    observer.observe(timerCardRef);
    
    onCleanup(() => observer.disconnect());
  });

  // Get badge styles based on session status
  const getSessionStatusBadge = () => {
    if (!session()) return null;
    
    if (isSessionComplete()) {
      return <Badge variant="outline" class="bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/60">
        <CheckCircle size={16} class="mr-1" />
        Completed
      </Badge>;
    }
    
    if (activeTimeBox()) {
      return <Badge variant="outline" class="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/60">
        <Clock size={16} class="mr-1" />
        In Progress
      </Badge>;
    }
    
    return <Badge variant="outline" class="bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/60">
      <Calendar size={16} class="mr-1" />
      Planned
    </Badge>;
  };

  // Calculate work and break durations
  const workDuration = createMemo(() => session() ? session()!.storyBlocks.reduce(
    (total, story) => total + story.timeBoxes.filter(box => box.type === 'work').reduce(
      (sum, box) => sum + box.duration, 0
    ), 0
  ) : 0);

  const breakDuration = createMemo(() => session() ? session()!.storyBlocks.reduce(
    (total, story) => total + story.timeBoxes.filter(box => box.type !== 'work').reduce(
      (sum, box) => sum + box.duration, 0
    ), 0
  ) : 0);

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

  // Debug log
  createEffect(() => {
    console.log('Timer state:', { 
      activeTimeBox: activeTimeBox(), 
      timeRemaining: timeRemaining(), 
      isTimerRunning: isTimerRunning(),
      stableFloatingVisible: stableFloatingVisible(),
      isTimerVisible: isTimerVisible()
    });
  });

  const navigate = useNavigate();

  // Time adjustment drawer state
  const [showTimeAdjust, setShowTimeAdjust] = createSignal(false);
  
  // Function to adjust timer
  const adjustTimer = (minutes: number) => {
    if (timeRemaining() !== null && activeTimeBox()) {
      // Ensure we don't go below zero
      const newTime = Math.max(0, timeRemaining()! + (minutes * 60));
      // Use the updateTimeRemaining function from the useSession hook
      updateTimeRemaining(newTime);
    }
  };

  return (
    <Show 
      when={!loading()}
      fallback={
        <div class="flex h-48 items-center justify-center">
          <CircleDashed size={32} class="animate-spin text-muted-foreground" />
          <span class="ml-2 text-lg text-muted-foreground">Loading session...</span>
        </div>
      }
    >
      <Show 
        when={!error()}
        fallback={
          <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <div class="flex items-center">
              <XCircle size={20} class="text-red-600" />
              <h3 class="ml-2 text-lg font-medium">Error loading session</h3>
            </div>
            <p class="mt-2 text-sm">{error()!.message}</p>
            <Button class="mt-4" variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        }
      >
        <Show 
          when={session()}
          fallback={
            <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
              <div class="flex items-center">
                <Calendar size={16} class="mr-2" />
                <h3 class="ml-2 text-lg font-medium">No session found</h3>
              </div>
              <p class="mt-2 text-sm">There is no session scheduled for this date.</p>
            </div>
          }
        >
          <div class="space-y-6" ref={containerRef}>
            {/* Floating Timer - Separated into stable container and content */}
            <FloatingTimerContainer 
              isVisible={stableFloatingVisible()}
            >
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
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card class="border-2 xl:col-span-2">
                <CardHeader class="pb-3">
                  <CardTitle class="text-2xl font-bold">
                    Session for {format(new Date(session()!.date), 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                  <div class="flex flex-wrap items-center gap-3 mt-2">
                    <Badge variant="outline" class="px-3 py-1 flex items-center gap-1.5 bg-white dark:bg-gray-900/80 border-gray-200 dark:border-gray-700/60 text-gray-700 dark:text-gray-300">
                      <Clock size={16} />
                      <span>Total: {Math.floor(session()!.totalDuration / 60)}h {session()!.totalDuration % 60}m</span>
                    </Badge>
                    
                    <Badge variant="outline" class="px-3 py-1 flex items-center gap-1.5 bg-secondary/20 border-secondary/30">
                      <CheckCircle size={16} />
                      <span>Work: {Math.floor(workDuration() / 60)}h {workDuration() % 60}m</span>
                    </Badge>
                    
                    <Badge variant="outline" class="px-3 py-1 flex items-center gap-1.5 bg-secondary/20 border-secondary/30">
                      <Pause size={16} />
                      <span>Breaks: {Math.floor(breakDuration() / 60)}h {breakDuration() % 60}m</span>
                    </Badge>
                    
                    {getSessionStatusBadge()}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Replace the simple progress bar with detailed metric cards */}
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-1 mt-1">
                    {/* Card 1: Completed Frogs (Stories) */}
                    <div class="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 rounded-lg p-3 flex flex-col items-center">
                      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 mb-1">
                        {/* TODO: Replace with proper frog icon */}
                        <svg class="h-5 w-5 text-violet-600 dark:text-violet-400" viewBox="0 0 24 24" fill="currentColor">
                          <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="20">🐸</text>
                        </svg>
                      </div>
                      <span class="text-xs font-medium text-violet-600 dark:text-violet-400 mb-1">Frogs Completed</span>
                      <span class="text-lg font-bold">
                        {session()!.storyBlocks.filter(story => 
                          story.timeBoxes.every(box => box.type === 'work' ? box.status === 'completed' : true)
                        ).length}
                        <span class="text-sm font-medium text-violet-500/70 dark:text-violet-400/70"> / {session()!.storyBlocks.length}</span>
                      </span>
                    </div>
                    
                    {/* Card 2: Completed Tasks */}
                    <div class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg p-3 flex flex-col items-center">
                      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 mb-1">
                        <ListDashes size={16} class="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span class="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Tasks Completed</span>
                      <span class="text-lg font-bold">
                        {session()!.storyBlocks.reduce(
                          (sum, story) => sum + story.timeBoxes.reduce(
                            (boxSum, box) => boxSum + (box.tasks?.filter(t => t.status === 'completed').length || 0), 0
                          ), 0
                        )}
                        <span class="text-sm font-medium text-emerald-500/70 dark:text-emerald-400/70"> / {
                          session()!.storyBlocks.reduce(
                            (sum, story) => sum + story.timeBoxes.reduce(
                              (boxSum, box) => boxSum + (box.tasks?.length || 0), 0
                            ), 0
                          )
                        }</span>
                      </span>
                    </div>
                    
                    {/* Card 3: Time Worked */}
                    <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 flex flex-col items-center">
                      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-1">
                        <Timer size={16} class="text-blue-600 dark:text-blue-400" />
                      </div>
                      <span class="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Time Worked</span>
                      <span class="text-lg font-bold">
                        {(() => {
                          const completedMinutes = session()!.storyBlocks.reduce(
                            (total, story) => total + story.timeBoxes.filter(box => box.status === 'completed').reduce(
                              (sum, box) => sum + box.duration, 0
                            ), 0
                          );
                          const hours = Math.floor(completedMinutes / 60);
                          const minutes = completedMinutes % 60;
                          return `${hours}h ${minutes}m`;
                        })()}
                      </span>
                    </div>
                    
                    {/* Card 4: Time Remaining */}
                    <div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3 flex flex-col items-center">
                      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 mb-1">
                        <Hourglass size={16} class="text-amber-600 dark:text-amber-400" />
                      </div>
                      <span class="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Time Remaining</span>
                      <span class="text-lg font-bold">
                        {(() => {
                          const totalMinutes = session()!.totalDuration;
                          const completedMinutes = session()!.storyBlocks.reduce(
                            (total, story) => total + story.timeBoxes.filter(box => box.status === 'completed').reduce(
                              (sum, box) => sum + box.duration, 0
                            ), 0
                          );
                          const remainingMinutes = totalMinutes - completedMinutes;
                          const hours = Math.floor(remainingMinutes / 60);
                          const minutes = remainingMinutes % 60;
                          return `${hours}h ${minutes}m`;
                        })()}
                      </span>
                    </div>
                    
                    {/* Card 5: Completion Rate */}
                    <div class="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-lg p-3 flex flex-col items-center">
                      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 mb-1">
                        <ChartBar size={16} class="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span class="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">Progress Rate</span>
                      <span class="text-lg font-bold">
                        {completedPercentage()}%
                        <span class="text-sm font-medium text-indigo-500/70 dark:text-indigo-400/70"> completed</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Timer Card - Responsive position */}
              <Show when={activeTimeBox() !== null}>
                <Card 
                  ref={timerCardRef}
                  class="timer-card-container transform-gpu"
                  style={{
                    "border-color": "var(--timer-border-color)",
                    background: "var(--timer-background)"
                  }}
                >
                  {/* Sparkle decoration elements */}
                  <div class="sparkle-decoration">
                    <div class="sparkle-dot"></div>
                    <div class="sparkle-dot"></div>
                    <div class="sparkle-dot"></div>
                    <div class="sparkle-dot"></div>
                    <div class="sparkle-dot"></div>
                  </div>
                  <div class="shine-line"></div>
                  
                  <CardHeader class="pb-2 text-center">
                    <CardTitle class="text-center">Active Timer</CardTitle>
                    <div class="mt-2 relative">
                      <TimerDisplay 
                        time={currentFormattedTime()} 
                        showRed={timeRemaining() !== null && timeRemaining()! < 60} 
                      />
                      {/* Add edit button for timer adjustment */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowTimeAdjust(!showTimeAdjust())}
                        class="absolute -right-6 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity pr-4"
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
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </Button>
                    </div>
                    <CardDescription class="mt-3 flex flex-col items-center gap-2">
                      <span class="font-medium text-sm">{activeTimeBoxDetails()?.title || 'Loading...'}</span>
                      <Badge variant="outline" class={cn(
                        "font-normal",
                        activeTimeBoxDetails()?.timeBox.type === 'work' 
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-400"
                          : activeTimeBoxDetails()?.timeBox.type === 'short-break' || activeTimeBoxDetails()?.timeBox.type === 'long-break'
                            ? "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/30 dark:border-teal-800 dark:text-teal-400"
                            : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
                      )}>
                        {activeTimeBoxDetails()?.timeBox.type === 'work' ? 'Focus' : activeTimeBoxDetails()?.timeBox.type === 'short-break' ? 'Short Break' : activeTimeBoxDetails()?.timeBox.type === 'long-break' ? 'Long Break' : 'Break'}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  
                  {/* Time Adjustment Drawer */}
                  <Show when={showTimeAdjust()}>
                    <div class="px-4 pb-3 transition-all duration-300">
                      <div class="border border-transparent rounded-lg p-3 bg-transparent">
                        <h4 class="text-xs font-medium text-center mb-2 text-muted-foreground">Add/Remove Time</h4>
                        <div class="flex justify-center items-center gap-2 mx-auto">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            class="h-7 px-1.5 text-xs bg-white dark:bg-gray-900 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/30 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                            onClick={() => adjustTimer(-5)}
                          >
                            <CaretLeft size={12} class="mr-0.5" />
                            <CaretLeft size={12} class="-ml-1.5" />
                            <span class="ml-0.5 text-[10px] font-bold">-5m</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            class="h-7 px-1.5 text-xs bg-white dark:bg-gray-900 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/30 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                            onClick={() => adjustTimer(-1)}
                          >
                            <CaretLeft size={12} class="mr-0.5" />
                            <span class="ml-0.5 text-[10px] font-bold">-1m</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            class="h-7 px-1.5 text-xs bg-white dark:bg-gray-900 border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:hover:bg-green-950/30 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                            onClick={() => adjustTimer(1)}
                          >
                            <span class="mr-0.5 text-[10px] font-bold">+1m</span>
                            <CaretRight size={12} class="ml-0.5" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            class="h-7 px-1.5 text-xs bg-white dark:bg-gray-900 border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:hover:bg-green-950/30 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                            onClick={() => adjustTimer(5)}
                          >
                            <span class="mr-0.5 text-[10px] font-bold">+5m</span>
                            <CaretRight size={12} class="ml-0.5" />
                            <CaretRight size={12} class="-ml-1.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Show>
                  
                  <CardContent class="pb-2">
                    <Progress 
                      value={100 - (activeTimeBoxDetails()?.progress || 0)} 
                      class="h-2 mb-1 bg-gray-100 dark:bg-gray-800" 
                      indicatorClass="timebox-progress-gradient"
                    />
                  </CardContent>
                  <CardFooter class="pt-0 pb-4 flex justify-center">
                    <div class="flex justify-center gap-6 w-full max-w-xs">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={resetTimer}
                        disabled={!activeTimeBox()}
                        class="h-10 w-10 rounded-full"
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
                            class="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
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
                          class="h-10 w-10 rounded-full bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/50"
                          title="Pause timer"
                        >
                          <Pause size={16} />
                        </Button>
                      </Show>
                      
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => activeTimeBox() && completeTimeBox(activeTimeBox()!.storyId, activeTimeBox()!.timeBoxIndex)}
                        class="h-10 w-10 rounded-full bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/50"
                        title="Complete this timebox"
                      >
                        <CheckCircle size={16} />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </Show>
            </div>

            {/* Add vertical timeline view - this shows a React-Chrono inspired visual progress timeline */}
            <div class="mt-8" ref={timelineRef}>
              <Card class="border">
                <CardHeader class="pb-2">
                  <CardTitle class="text-xl">Session Progress</CardTitle>
                  <CardDescription>
                    Track your progress through the session with this interactive timeline
                  </CardDescription>
                </CardHeader>
                <CardContent class="pt-6">
                  <VerticalTimeline 
                    storyBlocks={session()!.storyBlocks}
                    activeTimeBoxId={activeTimeBox() ? `${activeTimeBox()!.storyId}-box-${activeTimeBox()!.timeBoxIndex}` : undefined}
                    activeStoryId={activeTimeBox()?.storyId}
                    activeTimeBoxIndex={activeTimeBox()?.timeBoxIndex}
                    startTime={session()!.lastUpdated || new Date().toISOString()}
                    completedPercentage={completedPercentage()}
                    onTaskClick={handleTaskClick}
                    onTimeBoxClick={(storyId: string, timeBoxIndex: number) => {
                      const story = session()!.storyBlocks.find(s => s.id === storyId);
                      if (!story) return;
                      
                      const timeBox = story.timeBoxes[timeBoxIndex];
                      if (!timeBox) return;
                      
                      if (isCurrentTimeBox(timeBox)) {
                        // If already current, show details instead
                        console.log("Show details for current timebox:", timeBox);
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
                      const debriefId = "session-debrief";
                      
                      // Set up a special timer for the debrief
                      // In a real implementation, we could add this to the storyBlocks,
                      // but for simplicity we'll just run the timer
                      startTimeBox(debriefId, 0, duration);
                      
                      // TODO: Add toast notification
                      console.log(`Debrief started: ${duration} minutes`);
                    }}
                    isCompactView={false}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </Show>
      </Show>
    </Show>
  );
}
