"use client"

import { Bot, User, FileCode2, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ChatMessage as ChatMessageType, Citation } from "@/lib/api"

interface ChatMessageProps {
  message?: ChatMessageType
  isStreamingDraft?: boolean
  streamingContent?: string
  streamingCitations?: Citation[]
  repoHtmlUrl?: string | null
  defaultBranch?: string | null
}

function formatLineRange(start: number | null, end: number | null): string {
  if (start && end && start !== end) return `L${start}-L${end}`
  if (start) return `L${start}`
  if (end) return `L${end}`
  return ""
}

function buildGithubFileUrl(
  repoHtmlUrl: string | null | undefined,
  branch: string | null | undefined,
  citation: Citation
): string | null {
  if (!repoHtmlUrl || !citation.filePath) return null
  const cleanRepo = repoHtmlUrl.replace(/\/+$/, "")
  const cleanBranch = (branch || "main").replace(/^\/+|\/+$/g, "")
  const cleanPath = citation.filePath.replace(/^\/+/, "")
  const lineAnchor = citation.startLine ? `#L${citation.startLine}` : ""
  return `${cleanRepo}/blob/${cleanBranch}/${cleanPath}${lineAnchor}`
}

export function ChatMessage({
  message,
  isStreamingDraft = false,
  streamingContent = "",
  streamingCitations = [],
  repoHtmlUrl,
  defaultBranch,
}: ChatMessageProps) {
  const isUser = !isStreamingDraft && message?.role === "USER"
  const content = isStreamingDraft ? streamingContent : message?.content ?? ""
  const citations = isStreamingDraft
    ? streamingCitations
    : message?.citations ?? []

  return (
    <div
      className={cn(
        "flex w-full gap-3.5",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/20 text-indigo-600 ring-1 ring-indigo-500/25 dark:text-indigo-400">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs md:max-w-[76%]",
          isUser
            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
            : "border border-border/70 bg-card/85 text-foreground backdrop-blur-sm"
        )}
      >
        <div className="whitespace-pre-wrap break-words font-sans">
          {content}
          {isStreamingDraft && (
            <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-xs bg-indigo-500 align-middle" />
          )}
        </div>

        {!isUser && citations.length > 0 && (
          <div className="mt-3 border-t border-border/50 pt-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sources & Citations
            </p>
            <div className="flex flex-wrap gap-1.5">
              {citations.map((cite, idx) => {
                const lines = formatLineRange(cite.startLine, cite.endLine)
                const href = buildGithubFileUrl(repoHtmlUrl, defaultBranch, cite)
                const label = `${cite.filePath}${lines ? ` (${lines})` : ""}`

                if (href) {
                  return (
                    <a
                      key={`${cite.filePath}-${idx}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-muted/60 px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
                    >
                      <FileCode2 className="h-3 w-3 text-primary" />
                      <span className="max-w-[220px] truncate">{label}</span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                    </a>
                  )
                }

                return (
                  <Badge
                    key={`${cite.filePath}-${idx}`}
                    variant="secondary"
                    className="gap-1 rounded-lg px-2 py-0.5 text-[11px] font-normal"
                  >
                    <FileCode2 className="h-3 w-3 text-primary" />
                    <span className="max-w-[220px] truncate">{label}</span>
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground ring-1 ring-border">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}