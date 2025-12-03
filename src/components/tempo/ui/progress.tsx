import { Progress as KobalteProgress } from "@kobalte/core/progress"
import { splitProps } from "solid-js"
import { tempoDesign } from "../theme/tempo-design"

interface ProgressProps {
  value?: number
  max?: number
  style?: any
  indicatorStyle?: any
}

export const Progress = (props: ProgressProps) => {
  const [local, others] = splitProps(props, ["value", "max", "style", "indicatorStyle"])
  
  return (
    <KobalteProgress
      value={local.value}
      maxValue={local.max ?? 100}
      style={{
        position: 'relative',
        height: '16px',
        width: '100%',
        overflow: 'hidden',
        'border-radius': tempoDesign.radius.full,
        background: tempoDesign.colors.secondary,
        ...(local.style as any)
      }}
      {...others}
    >
      <KobalteProgress.Track 
        style={{
          height: '100%',
          width: '100%',
          background: tempoDesign.colors.secondary,
        }}
      >
        <KobalteProgress.Fill
          style={{
            height: '100%',
            width: 'var(--kb-progress-fill-width)',
            flex: 1,
            background: tempoDesign.colors.primary,
            transition: 'all 0.2s linear',
            ...(local.indicatorStyle as any)
          }}
        />
      </KobalteProgress.Track>
    </KobalteProgress>
  )
}
