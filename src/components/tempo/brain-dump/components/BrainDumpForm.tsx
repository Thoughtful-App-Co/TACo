// /features/brain-dump/components/BrainDumpForm.tsx
// Solid.js component
import { Show } from "solid-js"
import { Button } from "../../ui/button"
import { Textarea } from "../../ui/textarea"
import { Info, CircleDashed, Lock, LockOpen, XCircle, Bug } from "phosphor-solid"
import { ProcessedStories } from "./ProcessedStories"
import { useBrainDump } from "../hooks/useBrainDump"
import type { ProcessedStory } from "../../lib/types"

interface BrainDumpFormProps {
  onTasksProcessed?: (stories: ProcessedStory[]) => void
}

export const BrainDumpForm = (props: BrainDumpFormProps) => {
  const {
    tasks,
    setTasks,
    processedStories,
    editedDurations,
    isInputLocked,
    isProcessing,
    isCreatingSession,
    processingStep,
    processingProgress,
    error,
    processTasks,
    handleCreateSession,
    handleDurationChange,
    handleRetry
  } = useBrainDump(props.onTasksProcessed)

  return (
    <>
      <div class="flex items-start gap-4">
        <div class="flex-1 min-w-0">
          <h2 class="text-lg font-semibold">Brain Dump</h2>
          <p class="text-sm text-muted-foreground">
            Enter your tasks, one per line. Just brain dump everything you need to do...
          </p>
        </div>
        <div class="w-[48px] shrink-0">
          <Show 
            when={isProcessing()}
            fallback={
              <div class="w-[48px] h-[48px] flex items-center justify-center">
                <Show when={isInputLocked()}>
                  <Lock class="h-5 w-5 text-muted-foreground" />
                </Show>
              </div>
            }
          >
            <div class="relative">
              <div class="relative w-12 h-12 bg-background rounded-full shadow-sm flex items-center justify-center">
                <CircleDashed class="h-6 w-6 animate-spin text-primary" />
                <div class="absolute inset-0 rounded-full border-2 border-primary/20" style={`clip-path: polygon(0 0, ${processingProgress()}% 0, ${processingProgress()}% 100%, 0 100%)`} />
              </div>
              <div class="absolute top-full mt-1 right-0 text-xs text-muted-foreground whitespace-nowrap">
                {processingStep()}
              </div>
            </div>
          </Show>
        </div>
      </div>

      <div class="space-y-4">
        <Show when={error()}>
          <div class="rounded-lg border bg-destructive/10 text-destructive p-4 animate-in fade-in-50">
            <div class="flex items-start gap-2">
              <Show 
                when={error()?.code === 'PARSING_ERROR'}
                fallback={<XCircle class="h-4 w-4 mt-1" />}
              >
                <Bug class="h-4 w-4 mt-1" />
              </Show>
              <div class="space-y-2 flex-1">
                <h5 class="font-medium leading-none tracking-tight">
                  {error()?.code === 'PARSING_ERROR' ? 'AI Processing Error' : 'Error Processing Tasks'}
                </h5>
                <div class="text-sm [&_p]:leading-relaxed">
                  <p>{error()?.message}</p>
                  <Show when={error()?.details}>
                    <div class="mt-2">
                      <div class="text-sm font-medium mb-1">Technical Details:</div>
                      <pre class="text-xs bg-destructive/10 p-2 rounded-md overflow-auto max-h-32">
                        {typeof error()?.details === 'string' 
                          ? error()?.details as string
                          : JSON.stringify(error()?.details, null, 2)
                        }
                      </pre>
                    </div>
                  </Show>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    class="mt-4"
                    onClick={handleRetry}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Show>

        <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
          <div class="flex w-full justify-end items-start gap-2">
            <Info class="h-4 w-4" />
            <div class="text-right">
              <h5 class="font-medium leading-none tracking-tight">Input Format Tips</h5>
              <div class="text-sm [&_p]:leading-relaxed">
                <ul class="mt-2 space-y-1 text-sm">
                  <li>• Start with action verbs: "Create", "Review", "Update", etc.</li>
                  <li>• Add time estimates (optional): "2 hours of work on Project X"</li>
                  <li>• Mark priorities: Add <span class="font-medium text-primary">FROG</span> to indicate high-priority tasks</li>
                  <li>• Add deadlines (optional): "Complete by Friday" or "Due: 3pm"</li>
                  <li>• Group related tasks: Use similar prefixes for related items</li>
                  <li>• Be specific: "Review Q1 metrics report" vs "Review report"</li>
                </ul>
                <div class="mt-2 text-sm font-medium">Examples:</div>
                <pre class="mt-1 text-sm bg-muted p-2 rounded-md">
                  Create landing page mockup for client FROG{"\n"}
                  Review Q1 metrics report - 30 mins{"\n"}
                  Update team documentation - flexible{"\n"}
                  Complete project proposal by EOD{"\n"}
                  Daily standup and team sync
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div class="relative">
          <Textarea
            class={`min-h-[200px] font-mono ${isInputLocked() ? 'opacity-50' : ''}`}
            placeholder={`Task 1
Task 2 FROG
Task 3 - flexible
Task 4 - due by 5pm`}
            value={tasks()}
            onChange={(e) => !isInputLocked() && setTasks(e.target.value)}
            disabled={isInputLocked()}
          />
          <Show when={isInputLocked()}>
            <div class="absolute inset-0 bg-background/5 backdrop-blur-[1px] rounded-md flex items-center justify-center">
              <div class="bg-background/90 px-4 py-2 rounded-md shadow-sm flex items-center gap-2">
                <Lock class="h-4 w-4" />
                <span class="text-sm font-medium">Input locked</span>
              </div>
            </div>
          </Show>
        </div>
        
        <div class="flex justify-end gap-2">
          <Show when={processedStories().length > 0}>
            <Button 
              onClick={handleRetry}
              variant="outline"
              size="sm"
              class="flex items-center gap-2"
            >
              <LockOpen class="h-4 w-4" />
              Clear & Unlock
            </Button>
          </Show>
          <Button 
            onClick={() => processTasks(false)}
            disabled={!tasks().trim() || isProcessing() || isInputLocked()}
            class="w-32"
          >
            <Show 
              when={isProcessing()}
              fallback={
                <Show 
                  when={isInputLocked()}
                  fallback="Process Tasks"
                >
                  <>
                    <Lock class="mr-2 h-4 w-4" />
                    Locked
                  </>
                </Show>
              }
            >
              <>
                <CircleDashed class="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            </Show>
          </Button>
        </div>

        <ProcessedStories 
          stories={processedStories()}
          editedDurations={editedDurations()}
          isCreatingSession={isCreatingSession()}
          onDurationChange={handleDurationChange}
          onRetry={handleRetry}
          onCreateSession={handleCreateSession}
        />
      </div>
    </>
  )
}
