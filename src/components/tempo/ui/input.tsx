import { type Component, type ComponentProps, splitProps } from "solid-js"
import { tempoComponents, tempoDesign } from "../theme/tempo-design"

export type InputProps = ComponentProps<"input">

export const Input: Component<InputProps> = (props) => {
  const [local, others] = splitProps(props, ["type", "style", "disabled"])
  return (
    <input
      type={local.type || "text"}
      disabled={local.disabled}
      style={{
        ...tempoComponents.input,
        ...(local.disabled && { 
          opacity: 0.5, 
          cursor: 'not-allowed',
          background: tempoDesign.colors.muted,
        }),
        ...(local.style as any),
      }}
      onFocus={(e) => {
        if (!local.disabled) {
          e.currentTarget.style.borderColor = tempoDesign.colors.ring
          e.currentTarget.style.boxShadow = `0 0 0 2px ${tempoDesign.colors.background}, 0 0 0 4px ${tempoDesign.colors.ring}`
        }
      }}
      onBlur={(e) => {
        if (!local.disabled) {
          e.currentTarget.style.borderColor = tempoDesign.colors.input
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
      {...others}
    />
  )
}
