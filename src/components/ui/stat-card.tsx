import * as React from "react"

import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  // big number; leave out and pass children for a custom body
  value?: React.ReactNode
  unit?: React.ReactNode
  hint?: React.ReactNode
  valueClassName?: string
  hintClassName?: string
  children?: React.ReactNode
  className?: string
}

// Small metric tile used in the dashboard summary strips.
const StatCard = ({ label, value, unit, hint, valueClassName, hintClassName, children, className }: StatCardProps) => (
  <div className={cn("min-w-0 rounded-xl border border-border/80 bg-card p-4 shadow-xs", className)}>
    {/* labels and units wrap rather than truncate: on phones two cards share a row and text would be cut */}
    <span className="block text-2xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
    {value !== undefined && (
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <span className={cn("text-2xl font-extrabold tabular-nums text-foreground", valueClassName)}>{value}</span>
        {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
      </div>
    )}
    {children && <div className="mt-1.5 min-w-0">{children}</div>}
    {hint && <span className={cn("mt-1 block text-xs text-muted-foreground", hintClassName)}>{hint}</span>}
  </div>
)

export { StatCard }
