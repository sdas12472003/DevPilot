"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

export function DashboardHeader({
  title,
  description,
  actions,
  children,
  className,
}: DashboardHeaderProps) {
  const rightSlot = actions ?? children

  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>

      {rightSlot && (
        <div className="flex shrink-0 items-center gap-2">{rightSlot}</div>
      )}
    </div>
  )
}