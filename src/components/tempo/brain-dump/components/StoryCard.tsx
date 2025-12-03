// /features/brain-dump/components/StoryCard.tsx
// Solid.js component
import { Show, For } from "solid-js"
import { Badge } from "../../ui/badge"
import { Clock, Info } from "phosphor-solid"
import { Input } from "../../ui/input"
import type { ProcessedStory, ProcessedTask } from "../types"
import { DifficultyBadge } from "./DifficultyBadge"


interface StoryCardProps {
  story: ProcessedStory
  editedDuration: number
  onDurationChange: (storyTitle: string, newDuration: number) => void
}

export const StoryCard = (props: StoryCardProps) => {
  const renderTaskBreaks = (task: ProcessedTask) => {
    if (!task.suggestedBreaks?.length) return null

    return (
      <div class="ml-6 mt-1 text-xs text-muted-foreground space-y-1">
        <For each={task.suggestedBreaks}>
          {(breakInfo) => (
            <div class="flex items-center gap-2">
              <Info class="h-3 w-3 flex-shrink-0" />
              <span class="text-xs">
                Break recommended at {breakInfo.after}m: {breakInfo.duration}m duration
                {breakInfo.reason && ` - ${breakInfo.reason}`}
              </span>
            </div>
          )}
        </For>
      </div>
    )
  }

  return (
    <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
      <div class="flex items-start gap-2">
        <span class="text-2xl">{props.story.icon}</span>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h5 class="font-medium leading-none tracking-tight">{props.story.title}</h5>
            <Badge variant={props.story.type === "flexible" ? "outline" : "default"}>
              {props.story.type}
            </Badge>
            <Show when={props.story.projectType}>
              <Badge variant="secondary" class="text-xs">
                {props.story.projectType}
              </Badge>
            </Show>
          </div>
          <div class="text-sm [&_p]:leading-relaxed">
            <p class="mt-1 text-muted-foreground">{props.story.summary}</p>
            <ul class="mt-2 space-y-2">
              <For each={props.story.tasks}>
                {(task) => (
                  <li class="mb-1">
                    <div class="flex">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-sm">•</span>
                          <span class={`text-sm ${task.isFrog ? "font-medium text-primary" : ""}`}>
                            {task.title}
                          </span>
                          <Show when={task.isFrog}>
                            <Badge variant="secondary" class="bg-primary/10 text-primary text-xs px-2 py-0 h-5">
                              <span class="mr-1">🐸</span>
                              HIGH PRIORITY
                            </Badge>
                          </Show>
                          <Badge variant="outline" class="text-xs capitalize">
                            {task.taskCategory}
                          </Badge>
                          <Show when={task.projectType && task.projectType !== props.story.projectType}>
                            <Badge variant="secondary" class="text-xs">
                              {task.projectType}
                            </Badge>
                          </Show>
                          <Show 
                            when={task.isFlexible}
                            fallback={
                              <Show when={task.duration > 0}>
                                <span class="text-xs text-muted-foreground">
                                  ({task.duration} min estimate)
                                </span>
                              </Show>
                            }
                          >
                            <Badge variant="outline" class="text-xs">time flexible</Badge>
                          </Show>
                        </div>
                        
                        {renderTaskBreaks(task)}
                      </div>
                      
                      <Show when={task.difficulty}>
                        <div class="flex-shrink-0 ml-2 self-start mt-1">
                          <DifficultyBadge 
                            difficulty={task.difficulty!} 
                            duration={task.duration}
                          />
                        </div>
                      </Show>
                    </div>
                  </li>
                )}
              </For>
            </ul>
            <Show when={props.story.type !== "milestone"}>
              <div class="mt-3 flex items-center gap-2">
                <Clock class="h-4 w-4 text-muted-foreground" />
                <div class="flex items-center gap-2">
                  <Input
                    type="number"
                    value={props.editedDuration || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const duration = parseInt(value, 10);
                      if (!isNaN(duration) && duration > 0) {
                        props.onDurationChange(props.story.title, duration);
                      }
                    }}
                    class="w-20 h-7 text-sm"
                    min="1"
                  />
                  <span class="text-sm text-muted-foreground">min estimated duration</span>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  )
}