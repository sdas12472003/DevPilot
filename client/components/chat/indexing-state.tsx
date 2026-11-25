"use client"

import {
  CheckCircle2,
  Database,
  FileCode2,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react"
import { IndexErrorAlert } from "@/components/dashboard/index-error-alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getRepoProgress, useStartIndexing } from "@/hooks/use-repo"
import type { Repository } from "@/lib/api"
import { cn } from "@/lib/utils"

interface IndexingStateProps {
  repo: Repository
  onReady?: () => void
  className?: string
}

export function IndexingState({
  repo,
  onReady,
  className,
}: IndexingStateProps) {
  const startIndexing = useStartIndexing()

  const progress = getRepoProgress(repo)
  const isIndexing = repo.indexStatus === "INDEXING"
  const isReady = repo.indexStatus === "READY"
  const isFailed = repo.indexStatus === "FAILED"

  const handleTriggerIndex = () => {
    startIndexing.mutate(repo.id)
  }

  return (
    <Card
      className={cn(
        "mx-auto w-full max-w-xl border-border/70 bg-card/85 backdrop-blur-sm",
        className
      )}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold">
            {isIndexing
              ? "Indexing Repository"
              : isReady
                ? "Repository Indexed"
                : isFailed
                  ? "Indexing Failed"
                  : "Repository Not Indexed"}
          </CardTitle>

          {isIndexing && (
            <Badge
              variant="outline"
              className="border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
            >
              <Loader2 className="mr-1 size-3 animate-spin" />
              Indexing
            </Badge>
          )}
          {isReady && (
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            >
              <CheckCircle2 className="mr-1 size-3" />
              Ready
            </Badge>
          )}
          {isFailed && (
            <Badge
              variant="outline"
              className="border-destructive/40 bg-destructive/10 text-destructive"
            >
              <XCircle className="mr-1 size-3" />
              Failed
            </Badge>
          )}
          {!isIndexing && !isReady && !isFailed && (
            <Badge variant="outline" className="text-muted-foreground">
              Not Indexed
            </Badge>
          )}
        </div>

        <CardDescription>
          {repo.fullName} —{" "}
          {isIndexing
            ? "Chunking files and generating vector embeddings in PostgreSQL pgvector..."
            : isReady
              ? "Vector embeddings are ready. You can ask questions about this codebase."
              : isFailed
                ? "An error occurred while indexing this repository."
                : "Index this repository first to build vector embeddings for accurate code chat."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-border/60 bg-background/60 p-3 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <FileCode2 className="size-3.5" />
              <span>Files</span>
            </div>
            <p className="text-sm font-semibold">
              {repo.filesProcessed} / {repo.filesTotal}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Database className="size-3.5" />
              <span>Chunks</span>
            </div>
            <p className="text-sm font-semibold">{repo.chunkCount}</p>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Progress</div>
            <p className="text-sm font-semibold">{progress}%</p>
          </div>
        </div>

        {isIndexing && (
          <div className="space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
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

        <div className="flex items-center justify-end gap-2 pt-1">
          {isReady && onReady ? (
            <Button
              type="button"
              size="sm"
              onClick={onReady}
              className="cursor-pointer bg-gradient-to-r from-primary to-pink-600"
            >
              Start Chatting
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant={isFailed ? "outline" : "default"}
              disabled={isIndexing || startIndexing.isPending}
              onClick={handleTriggerIndex}
              className={cn(
                "cursor-pointer",
                !isFailed &&
                  "bg-gradient-to-r from-primary to-pink-600 shadow-sm hover:brightness-105"
              )}
            >
              {isIndexing || startIndexing.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  {isIndexing ? "Indexing..." : "Starting..."}
                </>
              ) : isFailed ? (
                <>
                  <RefreshCw className="mr-1.5 size-3.5" />
                  Retry Index
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 size-3.5" />
                  Index Repository
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}