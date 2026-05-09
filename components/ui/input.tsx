import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-[52px] w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-2 text-base text-white placeholder:text-muted transition-colors outline-none",
        "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_rgba(255,255,255,0.05)] [&:-webkit-autofill]:[--tw-shadow-color:rgba(255,255,255,0.05)] [&:-webkit-autofill]:[-webkit-text-fill-color:white]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
