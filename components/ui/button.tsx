import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center font-semibold transition-all rounded-full whitespace-nowrap select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
  {
    variants: {
      variant: {
        default:     "bg-accent text-[#163300] hover:bg-accent/85",
        secondary:   "bg-white text-primary shadow-sm hover:bg-white/85",
        inverted:    "bg-primary text-white hover:bg-primary/85",
        outline:     "border-2 border-primary text-primary bg-transparent hover:bg-primary/10",
        tertiary:    "bg-tertiary text-white hover:bg-tertiary/85",
        ghost:       "text-primary bg-transparent hover:bg-primary/10",
        destructive: "bg-danger text-white hover:bg-danger/85",
        link:        "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        sm:        "h-9 px-5 text-sm",
        default:   "h-12 px-8 text-base",
        lg:        "h-14 px-10 text-lg",
        icon:      "size-12",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const sizeInnerClass: Record<string, string> = {
  sm:      "px-5 text-sm",
  default: "px-8 text-base",
  lg:      "px-10 text-lg",
  icon:    "",
  "icon-sm": "",
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

function Button({ className, variant, size, children, ...props }: ButtonProps) {
  const resolvedVariant = variant ?? "default";
  const resolvedSize = size ?? "default";

  if (resolvedVariant === "default") {
    return (
      <button
        data-slot="button"
        className={cn(
          "group relative inline-flex overflow-hidden rounded-full p-[1px]",
          "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(159,232,112,0.3)]",
          "disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
          resolvedSize === "sm" ? "h-9" : resolvedSize === "lg" ? "h-14" : "h-12",
          className
        )}
        {...props}
      >
        {/* Spinning shimmer border */}
        <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#ffffff_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {/* Accent bg overlay that hides shimmer when not hovered */}
        <span className="absolute inset-0 rounded-full bg-accent transition-opacity duration-300 group-hover:opacity-0" />
        {/* Content */}
        <span className={cn(
          "relative flex w-full h-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-[#163300] whitespace-nowrap select-none",
          sizeInnerClass[resolvedSize]
        )}>
          {children}
        </span>
      </button>
    );
  }

  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
