import { createSignal, For, Show } from "solid-js"
import { cn } from "../../lib/utils"
import { 
  Clock, 
  CheckCircle, 
  Play, 
  Coffee, 
  FileText, 
  ArrowRight,
  ArrowCounterClockwise,
  CaretRight
} from "phosphor-solid"
import { Badge } from "../../ui/badge"
import { Progress } from "../../ui/progress"
import { Button } from "../../ui/button"
import { format } from "date-fns"
import type { StoryBlock, TimeBox, TimeBoxTask, TimeBoxStatus } from "../../lib/types"
import { timeboxTypeConfig, statusColorConfig } from "../config/timeline-config"

// Interface for the vertical timeline component
export interface VerticalTimelineProps {
  storyBlocks: StoryBlock[]
  activeTimeBoxId?: string
  activeStoryId?: string
  activeTimeBoxIndex?: number
  startTime?: string
  completedPercentage: number
  onTaskClick?: (storyId: string, timeBoxIndex: number, taskIndex: number, task: TimeBoxTask) => void
  onTimeBoxClick?: (storyId: string, timeBoxIndex: number) => void
  onStartTimeBox?: (storyId: string, timeBoxIndex: number, duration: number) => void
  onCompleteTimeBox?: (storyId: string, timeBoxIndex: number) => void
  onUndoCompleteTimeBox?: (storyId: string, timeBoxIndex: number) => void
  onStartSessionDebrief?: (duration: number) => void
  isCompactView?: boolean
}

export const VerticalTimeline = (props: VerticalTimelineProps) => {
  const [visibleBoxes, setVisibleBoxes] = createSignal<Set<string>>(new Set())
  
  // Helper to get timebox icon
  const getTimeBoxIcon = (type: string, status: TimeBoxStatus) => {
    if (status === 'completed') return <CheckCircle size={20} weight="fill" />
    
    switch (type) {
      case 'work':
        return <Clock size={20} />
      case 'short-break':
      case 'long-break':
        return <Coffee size={20} />
      case 'debrief':
        return <FileText size={20} />
      default:
        return <Clock size={20} />
    }
  }
  
  // Helper to get status colors
  const getStatusColor = (status: TimeBoxStatus) => {
    const config = statusColorConfig[status]
    return config?.bg || ''
  }
  
  // Helper to get timebox type label
  const getTypeLabel = (type: string) => {
    const config = timeboxTypeConfig[type as keyof typeof timeboxTypeConfig]
    return config?.title || type
  }
  
  return (
    <div class="relative">
      {/* Timeline container */}
      <div class="space-y-8">
        <For each={props.storyBlocks}>
          {(story, storyIdx) => (
            <div class="relative">
              {/* Story Header */}
              <div class="mb-4">
                <h3 class="text-lg font-semibold">{story.title}</h3>
              </div>
              
              {/* TimeBoxes for this story */}
              <div class="space-y-4 ml-8">
                <For each={story.timeBoxes}>
                  {(timeBox, boxIdx) => {
                    const isActive = props.activeTimeBoxId === `${story.id}-box-${boxIdx()}`;
                    const boxId = `${story.id}-box-${boxIdx()}`;
                    
                    return (
                      <div 
                        data-id={boxId}
                        class={cn(
                          "relative p-4 rounded-lg border transition-all",
                          isActive && "border-primary ring-2 ring-primary ring-opacity-20",
                          timeBox.status === 'completed' && "bg-muted/50",
                          timeBox.status === 'in-progress' && "border-primary"
                        )}
                      >
                        {/* TimeBox Header */}
                        <div class="flex items-start justify-between mb-3">
                          <div class="flex items-center gap-3">
                            <div class={cn(
                              "p-2 rounded-full",
                              getStatusColor(timeBox.status || 'todo')
                            )}>
                              {getTimeBoxIcon(timeBox.type, timeBox.status || 'todo')}
                            </div>
                            <div>
                              <div class="flex items-center gap-2">
                                <Badge variant="outline">
                                  {getTypeLabel(timeBox.type)}
                                </Badge>
                                <span class="text-sm text-muted-foreground">
                                  {timeBox.duration} min
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div class="flex items-center gap-2">
                            <Show when={timeBox.status === 'todo'}>
                              <Button
                                size="sm"
                                onClick={() => props.onStartTimeBox?.(story.id, boxIdx(), timeBox.duration)}
                                title="Start this timebox"
                              >
                                <Play size={16} class="mr-1" />
                                Start
                              </Button>
                            </Show>
                            
                            <Show when={timeBox.status === 'in-progress'}>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => props.onCompleteTimeBox?.(story.id, boxIdx())}
                                title="Complete this timebox"
                              >
                                <CheckCircle size={16} class="mr-1" />
                                Complete
                              </Button>
                            </Show>
                            
                            <Show when={timeBox.status === 'completed'}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => props.onUndoCompleteTimeBox?.(story.id, boxIdx())}
                                title="Undo completion"
                              >
                                <ArrowCounterClockwise size={16} class="mr-1" />
                                Undo
                              </Button>
                            </Show>
                          </div>
                        </div>
                        
                        {/* Tasks */}
                        <Show when={timeBox.tasks && timeBox.tasks.length > 0}>
                          <div class="space-y-2 mt-3">
                            <For each={timeBox.tasks}>
                              {(task, taskIdx) => (
                                <div 
                                  class={cn(
                                    "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50 transition-colors",
                                    task.status === 'completed' && "opacity-60"
                                  )}
                                  onClick={() => {
                                    const newTask = { ...task, status: task.status === 'completed' ? 'todo' : 'completed' } as TimeBoxTask;
                                    props.onTaskClick?.(story.id, boxIdx(), taskIdx(), newTask);
                                  }}
                                >
                                  <Show 
                                    when={task.status === 'completed'}
                                    fallback={
                                      <div class="w-4 h-4 rounded border border-muted-foreground" />
                                    }
                                  >
                                    <CheckCircle size={16} weight="fill" class="text-green-600" />
                                  </Show>
                                  <span class={cn(
                                    "text-sm flex-1",
                                    task.status === 'completed' && "line-through text-muted-foreground"
                                  )}>
                                    {task.title}
                                  </span>
                                </div>
                              )}
                            </For>
                          </div>
                        </Show>
                        
                        {/* Progress bar for in-progress timeboxes */}
                        <Show when={timeBox.status === 'in-progress'}>
                          <div class="mt-3">
                            <Progress value={50} class="h-2" />
                          </div>
                        </Show>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
      
      {/* Session completion section */}
      <Show when={props.completedPercentage === 100}>
        <div class="mt-8 p-6 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-green-700 dark:text-green-400">
                Session Complete! 🎉
              </h3>
              <p class="text-sm text-green-600 dark:text-green-500 mt-1">
                All tasks have been completed. Time for a debrief!
              </p>
            </div>
            <Button
              onClick={() => props.onStartSessionDebrief?.(10)}
              size="lg"
            >
              <FileText size={20} class="mr-2" />
              Start Debrief
            </Button>
          </div>
        </div>
      </Show>
    </div>
  )
}
