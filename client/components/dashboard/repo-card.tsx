"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  Database,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  MessageSquare,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react"
import { IndexErrorAlert } from "@/components/dashboard/index-error-alert"
import { LanguageBadge } from "@/components/dashboard/language-badge"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getRepoProgress, useStartIndexing } from "@/hooks/use-repo"
import type { IndexStatus, Repository } from "@/lib/api"
import { cn } from "@/lib/utils"

interface RepoCardProps {
  repo: Repository
  className?: string
}

function StatusBadge({ status }: { status: IndexStatus }) {
  switch (status) {
    case "READY":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 className="mr-1 size-3" />
          Ready
        </Badge>
      )
    case "INDEXING":
      return (
        <Badge
          variant="outline"
          className="border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
        >
          <Loader2 className="mr-1 size-3 animate-spin" />
          Indexing
        </Badge>
      )
    case "FAILED":
      return (
        <Badge
          variant="outline"
          className="border-destructive/40 bg-destructive/10 text-destructive"
        >
          <XCircle className="mr-1 size-3" />
          Failed
        </Badge>
      )
    case "PENDING":
    default:
      return (
        <Badge
          variant="outline"
          className="bg-background/60 text-muted-foreground"
        >
          Not Indexed
        </Badge>
      )
  }
}

export function RepoCard({ repo, className }: RepoCardProps) {
  const router = useRouter()
  const startIndexing = useStartIndexing()

  const progress = getRepoProgress(repo)
  const isIndexing = repo.indexStatus === "INDEXING"
  const isReady = repo.indexStatus === "READY"
  const isFailed = repo.indexStatus === "FAILED"

  const handleStartIndex = () => {
    startIndexing.mutate(repo.id, {
      onSuccess: () => {
        router.push(`/chat/${repo.id}`)
      },
    })
  }

  return (
    <Card
      className={cn(
        "group flex h-full flex-col justify-between border-border/70 bg-card/85 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        className
      )}
    >
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <CardTitle className="flex items-center gap-1.5 text-base leading-snug">
              <span className="truncate">{repo.name}</span>
              {repo.htmlUrl && (
                <a
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open on GitHub"
                  className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </CardTitle>
            <CardDescription className="truncate text-xs">
              {repo.fullName}
            </CardDescription>
          </div>

          <StatusBadge status={repo.indexStatus} />
        </div>

        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
          {repo.description || "No description provided."}
        </p>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1 bg-background/60 text-xs font-normal"
          >
            {repo.isPrivate ? (
              <>
                <Lock className="size-3" />
                Private
              </>
            ) : (
              <>
                <Globe className="size-3" />
                Public
              </>
            )}
          </Badge>

          <LanguageBadge language={repo.language} />

          {isReady && (
            <Badge variant="secondary" className="gap-1 text-xs font-normal">
              <Database className="size-3" />
              {repo.chunkCount} chunks
            </Badge>
          )}
        </div>

        {isIndexing && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {repo.filesTotal > 0
                  ? `${repo.filesProcessed} / ${repo.filesTotal} files`
                  : "Preparing files..."}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-pink-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {isFailed && repo.errorMessage && (
          <IndexErrorAlert message={repo.errorMessage} />
        )}
      </CardContent>

      <CardFooter className="border-t border-border/60 pt-4">
        <div className="grid w-full grid-cols-2 items-center gap-1.5 rounded-xl border border-border/70 bg-background/75 p-1 shadow-xs backdrop-blur-md">
          {/* Attractive Chat Pill Tab with distinct hover color */}
          <Link
            href={`/chat/${repo.id}`}
            className={cn(
              "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-white transition-all duration-200 active:scale-[0.98]",
              isReady
                ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-sm ring-1 ring-indigo-500/30 hover:-translate-y-0.5 hover:from-cyan-500 hover:via-blue-600 hover:to-indigo-600 hover:shadow-md hover:shadow-cyan-500/25"
                : "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-xs ring-1 ring-indigo-500/25 hover:-translate-y-0.5 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-600 hover:shadow-md hover:shadow-teal-500/25"
            )}
          >
            <MessageSquare className="size-3.5" />
            <span>Chat</span>
          </Link>

          {/* Index / Progress / Re-index Pill Tab */}
          {isIndexing ? (
            <Link
              href={`/chat/${repo.id}`}
              className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-500/15 px-3 text-xs font-medium text-blue-600 ring-1 ring-blue-500/30 transition-all duration-200 hover:bg-blue-500/20 dark:text-blue-400"
            >
              <Loader2 className="size-3.5 animate-spin" />
              <span>Indexing...</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleStartIndex}
              disabled={startIndexing.isPending}
              title={
                isFailed
                  ? "Retry indexing"
                  : isReady
                    ? "Re-index repository"
                    : "Index repository"
              }
              className={cn(
                "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
                isReady
                  ? "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  : isFailed
                    ? "bg-destructive/10 text-destructive ring-1 ring-destructive/30 hover:bg-destructive/20"
                    : "bg-gradient-to-r from-primary to-pink-600 text-primary-foreground shadow-sm ring-1 ring-primary/25 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/25 hover:brightness-105"
              )}
            >
              {startIndexing.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : isReady ? (
                <RefreshCw className="size-3.5" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              <span>
                {isReady ? "Re-index" : isFailed ? "Retry" : "Index"}
              </span>
            </button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}