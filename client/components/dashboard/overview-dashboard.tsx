"use client"

import Link from "next/link"
import {
  FolderGit2,
  CheckCircle2,
  Layers,
  AlertTriangle,
  MessageSquare,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRepos, useRefreshRepos } from "@/hooks/use-repo"

export function OverviewDashboard() {
  const { data: repos = [], isLoading } = useRepos()
  const refreshMutation = useRefreshRepos()

  const totalRepos = repos.length
  const readyRepos = repos.filter((r) => r.indexStatus === "READY")
  const failedRepos = repos.filter((r) => r.indexStatus === "FAILED")
  const totalChunks = repos.reduce((sum, r) => sum + (r.chunkCount || 0), 0)

  const stats = [
    {
      label: "Repositories",
      value: totalRepos,
      sub: "Synced from GitHub",
      icon: FolderGit2,
      accent: "from-indigo-500/15 to-blue-500/15 text-indigo-500",
    },
    {
      label: "Ready to Chat",
      value: readyRepos.length,
      sub: "Indexed in PGVector",
      icon: CheckCircle2,
      accent: "from-emerald-500/15 to-teal-500/15 text-emerald-500",
    },
    {
      label: "Indexed Chunks",
      value: totalChunks.toLocaleString(),
      sub: "Code vectors stored",
      icon: Layers,
      accent: "from-violet-500/15 to-purple-500/15 text-violet-500",
    },
    {
      label: "Failed / Errors",
      value: failedRepos.length,
      sub: "Needs re-indexing",
      icon: AlertTriangle,
      accent: "from-amber-500/15 to-orange-500/15 text-amber-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent p-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Workspace Overview</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Track synced GitHub repositories, RAG vector chunks, and ready chat targets.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="h-9 shrink-0 cursor-pointer rounded-xl px-3.5 text-xs whitespace-nowrap"
          >
            <RefreshCw
              className={`mr-1.5 size-3.5 shrink-0 ${
                refreshMutation.isPending ? "animate-spin" : ""
              }`}
            />
            {refreshMutation.isPending ? "Syncing..." : "Sync Repos"}
          </Button>

          <Link
            href="/dashboard"
            className="group inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-3.5 text-xs font-medium whitespace-nowrap text-white shadow-sm ring-1 ring-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:via-violet-500 hover:to-pink-500 hover:shadow-md hover:shadow-violet-500/25 active:translate-y-0"
          >
            <FolderGit2 className="size-3.5 shrink-0" />
            <span>Manage Repos</span>
            <ArrowUpRight className="size-3.5 shrink-0 opacity-85 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))
          : stats.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-xs backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.label}
                    </span>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-bold tracking-tight">
                    {item.value}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {item.sub}
                  </p>
                </div>
              )
            })}
      </div>

      {/* Ready Repositories Quick Launch */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Ready to Chat Repositories</h2>
            <p className="text-xs text-muted-foreground">
              Jump straight into an indexed codebase session.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : readyRepos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 p-8 text-center">
            <p className="text-xs font-medium">No indexed repositories yet</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Go to Repositories and click Index on any repo to build its embeddings.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {readyRepos.slice(0, 8).map((repo) => (
              <div
                key={repo.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{repo.fullName}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {repo.filesProcessed}/{repo.filesTotal} files ·{" "}
                    {repo.chunkCount} chunks
                  </p>
                </div>

                <Link
                  href={`/chat/${repo.id}`}
                  className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                >
                  <MessageSquare className="size-3.5 shrink-0" />
                  <span>Chat</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}