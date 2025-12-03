// /features/brain-dump/components/ProcessedStories.tsx
import { Show, For } from "solid-js"
// import { Alert, AlertDescription, AlertTitle } from "../../ui/alert"
import { Info, CircleDashed } from "phosphor-solid"
import { Button } from "../../ui/button"
import { StoryCard } from "./StoryCard"
import type { ProcessedStory } from "../../lib/types"

interface ProcessedStoriesProps {
  stories: ProcessedStory[]
  editedDurations: Record<string, number>
  onDurationChange: (storyTitle: string, newDuration: number) => void
  isCreatingSession?: boolean
  onRetry?: () => void
  onCreateSession?: () => Promise<any>
}

export const ProcessedStories = (props: ProcessedStoriesProps) => {
  // Check for potential session planning issues
  const hasLongStories = () => props.stories.some(story => story.estimatedDuration > 90)
  const hasLongTasks = () => props.stories.some(story => 
    story.tasks.some(task => task.duration > 60)
  )
  
  // Only render if there are stories
  return (
    <Show when={props.stories.length > 0}>
      <div class="space-y-4">
        <Show when={hasLongStories() || hasLongTasks()}>
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div class="flex gap-2">
              <Info class="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 class="font-medium text-sm text-amber-900">Productivity Optimization</h4>
                <div class="mt-2">
                  <p class="text-sm text-amber-800">Duration adjustments recommended to optimize focus and efficiency:</p>
                  <ul class="mt-2 text-xs space-y-1 text-amber-700">
                    <Show when={hasLongStories()}>
                      <li>• Work blocks exceeding 90 minutes require strategic breaks to maintain cognitive performance</li>
                    </Show>
                    <Show when={hasLongTasks()}>
                      <li>• Tasks over 60 minutes benefit from division into focused, manageable segments</li>
                    </Show>
                    <li>• Consider refining durations or restructuring complex tasks for optimal session planning</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Show>
        
        <Show when={props.onRetry && props.onCreateSession}>
          <div class="flex items-center justify-between">
            <h3 class="font-medium">Focus Block Analysis</h3>
            <div class="flex gap-2">
              <Button onClick={props.onRetry} variant="outline" size="sm">
                Reset Analysis
              </Button>
              <Button 
                onClick={props.onCreateSession} 
                size="sm"
                disabled={props.isCreatingSession ?? false}
              >
                <Show when={props.isCreatingSession} fallback="Schedule Work Session">
                  <>
                    <CircleDashed class="mr-2 h-4 w-4 animate-spin" weight="bold" />
                    Generating...
                  </>
                </Show>
              </Button>
            </div>
          </div>
        </Show>
        
        <div class="space-y-4">
          <For each={props.stories}>
            {(story, index) => (
              <StoryCard 
                story={story}
                editedDuration={props.editedDurations[story.title] || story.estimatedDuration}
                onDurationChange={props.onDurationChange}
              />
            )}
          </For>
        </div>
      </div>
    </Show>
  )
}
