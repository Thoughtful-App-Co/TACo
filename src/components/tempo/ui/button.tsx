import { JSX, splitProps, mergeProps } from "solid-js"
import { tempoDesign, tempoComponents } from "../theme/tempo-design"

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'icon'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

/**
 * Button Component - Bespoke inline styles
 */
export function Button(props: ButtonProps) {
  const merged = mergeProps({ variant: 'default', size: 'default' }, props)
  const [local, others] = splitProps(merged, ['variant', 'size', 'style', 'disabled'])

  const getVariantStyles = () => {
    switch (local.variant) {
      case 'outline':
        return tempoComponents.buttonOutline
      case 'ghost':
        return tempoComponents.buttonGhost
      case 'secondary':
        return tempoComponents.buttonSecondary
      case 'icon':
        return tempoComponents.buttonIcon
      default:
        return tempoComponents.buttonPrimary
    }
  }

  const getSizeStyles = () => {
    switch (local.size) {
      case 'sm':
        return { height: '32px', padding: '6px 10px', 'font-size': tempoDesign.typography.sizes.xs }
      case 'lg':
        return { height: '40px', padding: '10px 16px' }
      case 'icon':
        return { width: '36px', height: '36px', padding: '8px' }
      default:
        return {}
    }
  }

  return (
    <button
      {...others}
      disabled={local.disabled}
      style={{
        ...tempoComponents.button,
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...(local.disabled && { opacity: 0.5, cursor: 'not-allowed', 'pointer-events': 'none' }),
        ...(local.style as any),
      }}
      onMouseEnter={(e) => {
        if (!local.disabled) {
          if (local.variant === 'default') {
            e.currentTarget.style.background = tempoDesign.colors.primaryHover
          } else if (local.variant === 'secondary') {
            e.currentTarget.style.background = tempoDesign.colors.secondaryHover
          } else if (local.variant === 'outline' || local.variant === 'ghost') {
            e.currentTarget.style.background = tempoDesign.colors.secondary
          } else if (local.variant === 'icon') {
            e.currentTarget.style.background = tempoDesign.colors.secondary
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!local.disabled) {
          if (local.variant === 'default') {
            e.currentTarget.style.background = tempoDesign.colors.primary
          } else if (local.variant === 'secondary') {
            e.currentTarget.style.background = tempoDesign.colors.secondary
          } else if (local.variant === 'outline' || local.variant === 'ghost' || local.variant === 'icon') {
            e.currentTarget.style.background = 'transparent'
          }
        }
      }}
    />
  )
}
