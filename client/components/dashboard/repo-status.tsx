"use client"

import { CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { IndexStatus } from "@/lib/api"
import { cn } from "@/lib/utils"

interface RepoStatusProps {
  status: IndexStatus
  filesProcessed?: number
  filesTotal?: number
  chunkCount?: number
  showDetails?: boolean
  className?: string
}

const STATUS_CONFIG: Record<
  IndexStatus,
  {
    label: string
    icon: typeof CheckCircle2
    badgeClassName: string
    iconClassName?: string
  }
> = {
  READY: {
    label: "Ready",
    icon: CheckCircle2,
    badgeClassName:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  INDEXING: {
    label: "Indexing",
    icon: Loader2,
    badgeClassName:
      "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    iconClassName: "animate-spin",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    badgeClassName: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  PENDING: {
    label: "Not Indexed",
    icon: CircleDashed,
    badgeClassName: "text-muted-foreground",
  },
}

export function RepoStatus({
  status,
  filesProcessed,
  filesTotal,
  chunkCount,
  showDetails = false,
  className,
}: RepoStatusProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING
  const Icon = config.icon

  let detailText: string | null = null
  if (showDetails) {
    if (status === "INDEXING" && filesTotal && filesTotal > 0) {
      detailText = `${filesProcessed ?? 0}/${filesTotal}`
    } else if (status === "READY" && typeof chunkCount === "number") {
      detailText = `${chunkCount} chunks`
    }
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-xs font-medium",
        config.badgeClassName,
        className
      )}
    >
      <Icon className={cn("size-3 shrink-0", config.iconClassName)} />
      <span>{config.label}</span>
      {detailText && (
        <span className="ml-0.5 opacity-80">({detailText})</span>
      )}
    </Badge>
  )
}