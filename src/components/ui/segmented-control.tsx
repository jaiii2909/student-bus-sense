import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SegmentedOption<T extends string> {
  value: T
  label: React.ReactNode
  icon?: LucideIcon
}

// T comes from `value` only, so literal unions like "map" | "list" aren't widened to string
interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<NoInfer<T>>[]
  value: T
  onChange: (value: NoInfer<T>) => void
  "aria-label": string
  size?: "sm" | "md"
  className?: string
}

// Pill-style toggle group (map/list, status filters). Each option is a pressed/unpressed button.
const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
  size = "md",
  className,
}: SegmentedControlProps<T>) => (
  <div role="group" aria-label={ariaLabel} className={cn("flex items-center gap-1 rounded-lg bg-muted p-1", className)}>
    {options.map(({ value: optionValue, label, icon: Icon }) => {
      const active = optionValue === value
      return (
        <button
          key={optionValue}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(optionValue)}
          className={cn(
            "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10",
            size === "md" ? "py-2 text-xs" : "py-1.5 text-2xs",
            active ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          <span className="truncate">{label}</span>
        </button>
      )
    })}
  </div>
)

export { SegmentedControl }
export type { SegmentedOption }
