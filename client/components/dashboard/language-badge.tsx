"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Java: "bg-orange-500",
  Python: "bg-sky-500",
  Go: "bg-cyan-500",
  Rust: "bg-amber-600",
  "C++": "bg-pink-500",
  "C#": "bg-emerald-500",
  C: "bg-slate-500",
  PHP: "bg-indigo-500",
  Ruby: "bg-red-500",
  Swift: "bg-orange-400",
  Kotlin: "bg-purple-500",
  HTML: "bg-orange-600",
  CSS: "bg-blue-400",
  SCSS: "bg-pink-400",
  Shell: "bg-green-500",
  Dockerfile: "bg-sky-600",
}

interface LanguageBadgeProps {
  language?: string | null
  className?: string
}

export function LanguageBadge({ language, className }: LanguageBadgeProps) {
  if (!language) {
    return null
  }

  const dotColor = LANGUAGE_COLORS[language] ?? "bg-muted-foreground"

  return (
    <Badge
      variant="secondary"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-normal",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full", dotColor)}
      />
      <span>{language}</span>
    </Badge>
  )
}