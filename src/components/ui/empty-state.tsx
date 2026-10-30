import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  text: string
  action?: React.ReactNode
  className?: string
}

// Centered "nothing here yet" message with an optional next-step button.
const EmptyState = ({ icon: Icon, title, text, action, className }: EmptyStateProps) => (
  <div className={cn("space-y-3 rounded-xl border border-border/80 bg-card p-8 text-center shadow-xs", className)}>
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-primary">
      <Icon className="h-6 w-6" aria-hidden="true" />
    </div>
    <div className="space-y-1">
      <h3 className="text-balance text-sm font-bold text-foreground">{title}</h3>
      <p className="mx-auto max-w-xs text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
    {action && <div className="pt-2">{action}</div>}
  </div>
)

export { EmptyState }
