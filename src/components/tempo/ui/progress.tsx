import { Progress as KobalteProgress } from "@kobalte/core/progress"
import { splitProps } from "solid-js"
import { cn } from "../lib/utils"

interface ProgressProps {
  value?: number
  max?: number
  class?: string
  indicatorClass?: string
}

export const Progress = (props: ProgressProps) => {
  const [local, others] = splitProps(props, ["value", "max", "class", "indicatorClass"])
  
  return (
    <KobalteProgress
      value={local.value}
      maxValue={local.max ?? 100}
      class={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        local.class
      )}
    >
      <KobalteProgress.Track class="h-full w-full bg-secondary">
        <KobalteProgress.Fill
          class={cn(
            "h-full w-[var(--kb-progress-fill-width)] flex-1 bg-primary transition-all",
            local.indicatorClass
          )}
        />
      </KobalteProgress.Track>
    </KobalteProgress>
  )
}
