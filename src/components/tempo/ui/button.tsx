import { splitProps, type JSX, type ValidComponent } from "solid-js"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"
import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic"

/**
 * Button Variants:
 * - Tempo-inspired minimal design
 * - Supports different styling options via `variant` and `size` props
 * - Includes refined transitions and focus styles
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-secondary hover:text-secondary-foreground",
        ghost: "hover:bg-secondary text-foreground hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        neutral: "bg-secondary/30 text-foreground hover:bg-secondary/50",
      },
      size: {
        default: "h-9 px-3 py-2",
        sm: "h-8 rounded-md px-2.5 text-xs",
        lg: "h-10 rounded-md px-4",
        icon: "h-9 w-9 p-0",
        pill: "h-8 rounded-full px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  VariantProps<typeof buttonVariants>
>

/**
 * Button Component:
 * - A clean, minimal button for Tempo
 * - Polymorphic: can render as any component via `as` prop
 */
export function Button<T extends ValidComponent = "button">(
  props: ButtonProps<T>
) {
  const [local, others] = splitProps(props as ButtonProps<"button">, [
    "class",
    "variant",
    "size",
  ])

  return (
    <Polymorphic
      as="button"
      class={cn(buttonVariants({ variant: local.variant, size: local.size }), local.class)}
      {...others}
    />
  )
}
