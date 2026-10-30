import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SectionCardProps {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: LucideIcon
  // buttons, search, badges — wraps onto its own line on phones
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

// A card with a tinted header bar (title, description, actions) and an unpadded body,
// so tables and maps can run edge to edge.
const SectionCard = ({ title, description, icon: Icon, actions, children, className }: SectionCardProps) => (
  <section className={cn("overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs", className)}>
    {/* actions sit beside the title when they fit and drop to their own line when they don't */}
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-muted/40 p-4">
      <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {children}
  </section>
)

export { SectionCard }
