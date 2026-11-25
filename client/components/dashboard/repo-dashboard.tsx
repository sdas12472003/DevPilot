"use client"

import { useMemo, useState } from "react"
import { AlertCircle, FolderGit2, RefreshCw, Search, X } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { RepoCard } from "@/components/dashboard/repo-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useRefreshRepos, useRepos } from "@/hooks/use-repo"
import type { IndexStatus } from "@/lib/api"
import { cn } from "@/lib/utils"

type VisibilityFilter = "ALL" | "PUBLIC" | "PRIVATE"
type StatusFilter = "ALL" | IndexStatus

const VISIBILITY_OPTIONS: { value: VisibilityFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PUBLIC", label: "Public" },
  { value: "PRIVATE", label: "Private" },
]

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All Status" },
  { value: "READY", label: "Ready" },
  { value: "INDEXING", label: "Indexing" },
  { value: "PENDING", label: "Not Indexed" },
  { value: "FAILED", label: "Failed" },
]

export function RepoDashboard() {
  const { data: repos = [], isLoading, isError, error, refetch } = useRepos()
  const refreshRepos = useRefreshRepos()

  const [search, setSearch] = useState("")
  const [visibility, setVisibility] = useState<VisibilityFilter>("ALL")
  const [status, setStatus] = useState<StatusFilter>("ALL")

  const filteredRepos = useMemo(() => {
    const query = search.trim().toLowerCase()

    return repos.filter((repo) => {
      if (visibility === "PUBLIC" && repo.isPrivate) return false
      if (visibility === "PRIVATE" && !repo.isPrivate) return false
      if (status !== "ALL" && repo.indexStatus !== status) return false

      if (!query) return true

      return (
        repo.name.toLowerCase().includes(query) ||
        repo.fullName.toLowerCase().includes(query) ||
        (repo.description?.toLowerCase().includes(query) ?? false) ||
        (repo.language?.toLowerCase().includes(query) ?? false)
      )
    })
  }, [repos, search, visibility, status])

  const hasActiveFilters =
    search.trim().length > 0 || visibility !== "ALL" || status !== "ALL"

  const resetFilters = () => {
    setSearch("")
    setVisibility("ALL")
    setStatus("ALL")
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Repositories"
        description="Index any GitHub repository to build vector embeddings and chat with its codebase."
        actions={
          <div className="flex items-center gap-2">
            {!isLoading && (
              <Badge
                variant="secondary"
                className="border border-border/60 bg-background/75 text-xs font-normal backdrop-blur-sm"
              >
                {repos.length} total
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refreshRepos.mutate()}
              disabled={refreshRepos.isPending}
              className="cursor-pointer bg-background/80 backdrop-blur-sm hover:border-primary/40 hover:bg-background"
            >
              <RefreshCw
                className={cn(
                  "mr-2 size-4",
                  refreshRepos.isPending && "animate-spin"
                )}
              />
              {refreshRepos.isPending ? "Syncing..." : "Sync GitHub"}
            </Button>
          </div>
        }
      />

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search repositories by name or language..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-background/80 pl-9 pr-9 backdrop-blur-sm focus-visible:border-primary/50"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Visibility Segmented Tabs */}
          <div className="inline-flex items-center rounded-lg border border-border/70 bg-background/75 p-1 shadow-xs backdrop-blur-md">
            {VISIBILITY_OPTIONS.map((option) => {
              const isActive = visibility === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibility(option.value)}
                  className={cn(
                    "relative cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          {/* Status Segmented Tabs */}
          <div className="inline-flex flex-wrap items-center rounded-lg border border-border/70 bg-background/75 p-1 shadow-xs backdrop-blur-md">
            {STATUS_OPTIONS.map((option) => {
              const isActive = status === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={cn(
                    "relative cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    isActive
                      ? "bg-foreground text-background shadow-sm dark:bg-primary dark:text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content States */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-6 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3.5 w-48" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Failed to load repositories</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {error instanceof Error
                ? error.message
                : "Could not fetch your GitHub repositories."}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="cursor-pointer"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : repos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-background/70 px-6 py-16 text-center backdrop-blur-sm">
          <FolderGit2 className="mb-3 size-10 text-muted-foreground" />
          <h2 className="text-base font-semibold">No repositories found</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Sync your GitHub account to pull in your public and private repositories.
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-4 cursor-pointer bg-gradient-to-r from-primary to-pink-600 shadow-sm hover:brightness-105"
            onClick={() => refreshRepos.mutate()}
            disabled={refreshRepos.isPending}
          >
            <RefreshCw
              className={cn(
                "mr-2 size-4",
                refreshRepos.isPending && "animate-spin"
              )}
            />
            Sync GitHub Repositories
          </Button>
        </div>
      ) : filteredRepos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-background/70 px-6 py-12 text-center backdrop-blur-sm">
          <Search className="mb-3 size-8 text-muted-foreground" />
          <h2 className="text-base font-semibold">No matching repositories</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search query or clearing your active filters.
          </p>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 cursor-pointer"
              onClick={resetFilters}
            >
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRepos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </div>
  )
}