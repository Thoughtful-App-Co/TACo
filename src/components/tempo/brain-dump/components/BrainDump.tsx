// /features/brain-dump/components/BrainDump.tsx
// Solid.js component

import { createSignal, Show } from "solid-js"
import { A } from "@solidjs/router"
import { Card, CardContent } from "../../ui/card"
import { Button } from "../../ui/button"
import { Textarea } from "../../ui/textarea"
import { CircleDashed, Lock, CaretRight, Question } from "phosphor-solid"
import { useBrainDump } from "../hooks/useBrainDump"
import { ProcessedStories } from "./ProcessedStories"
import type { ProcessedStory } from "../../lib/types"

interface BrainDumpProps {
  onTasksProcessed?: (stories: ProcessedStory[]) => void
}

/**
 * BrainDump Component:
 * - Provides an input area for users to enter tasks.
 * - Uses AI to analyze and optimize tasks into work blocks.
 * - Displays real-time feedback, errors, and suggestions.
 * - Allows users to create structured work sessions.
 */
export const BrainDump = (props: BrainDumpProps) => {
  const [showTips, setShowTips] = createSignal(false)
  const {
    tasks,
    setTasks,
    processedStories,
    editedDurations,
    isInputLocked,
    isProcessing,
    isCreatingSession,
    processingStep,
    error,
    processTasks,
    handleCreateSession,
    handleDurationChange,
    handleRetry
  } = useBrainDump(props.onTasksProcessed)

  return (
    <Card class="border bg-card">
      <CardContent class="p-4 space-y-4">
        <div class="relative">
          <Textarea
            placeholder="task .init
Update client dashboard design 🐸
Send weekly progress report - 20m
Research API integration - 1h
Schedule team meeting - by Thursday
Update project docs
Finalize product specs - EOD"
            value={tasks()}
            onChange={(e) => !isInputLocked() && setTasks(e.target.value)}
            disabled={isInputLocked()}
            class="min-h-[150px] font-mono text-base"
          />
          <div class="absolute top-2 right-2">
            {/* Tooltip commented out - using title attribute instead */}
            <Button 
              variant="ghost" 
              size="icon" 
              class="text-muted-foreground hover:text-foreground"
              title="Task entry tips: Use clear verbs, estimate time (30m), prioritize with 🐸 FROG, add deadlines"
            >
              <Question class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div class="flex justify-end items-center gap-2">
          <div class="text-xs text-muted-foreground flex items-center gap-1">
            <CaretRight class="h-3 w-3" />
            <span>Analyze to optimize</span>
          </div>
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
                  fallback="Analyze"
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
                Analyzing
              </>
            </Show>
          </Button>
        </div>

        <Show when={processedStories().length > 0}>
          <div class="space-y-4 pt-4 border-t">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium">Work Blocks</h3>
              <div class="flex gap-2">
                <Button onClick={handleRetry} variant="outline" size="sm">
                  Reset
                </Button>
                <Button 
                  onClick={handleCreateSession} 
                  size="sm"
                  disabled={isCreatingSession()}
                >
                  <Show 
                    when={isCreatingSession()}
                    fallback="Create Session"
                  >
                    <>
                      <CircleDashed class="mr-2 h-4 w-4 animate-spin" />
                      {processingStep() || "Creating"}
                    </>
                  </Show>
                </Button>
              </div>
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
        </Show>
      </CardContent>
    </Card>
  )
}
