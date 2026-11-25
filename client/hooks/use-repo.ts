"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, type IndexStatusResponse, type Repository } from "@/lib/api"
import { queryKeys } from "@/hooks/use-auth"

const INDEXING_POLL_INTERVAL = 3000

export function useRepos() {
  return useQuery({
    queryKey: queryKeys.repos.all,
    queryFn: async () => {
      const repos = await api.listRepos(false)
      if (repos.length === 0) {
        return api.listRepos(true)
      }
      return repos
    },
    refetchInterval: (query) => {
      const repos = query.state.data
      const hasIndexing = repos?.some((repo) => repo.indexStatus === "INDEXING")
      return hasIndexing ? INDEXING_POLL_INTERVAL : false
    },
  })
}

export function useRepository(id: string) {
  return useQuery({
    queryKey: queryKeys.repos.detail(id),
    queryFn: () => api.getRepo(id),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      query.state.data?.indexStatus === "INDEXING" ? INDEXING_POLL_INTERVAL : false,
  })
}

export function useIndexStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.repos.detail(id), "status"] as const,
    queryFn: () => api.indexStatus(id),
    enabled: Boolean(id) && enabled,
    refetchInterval: (query) =>
      query.state.data?.indexStatus === "INDEXING" ? INDEXING_POLL_INTERVAL : false,
  })
}

export function useStartIndexing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (repoId: string) => api.startIndex(repoId),
    onMutate: async (repoId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.repos.all })
      await queryClient.cancelQueries({ queryKey: queryKeys.repos.detail(repoId) })

      const previousRepos = queryClient.getQueryData<Repository[]>(queryKeys.repos.all)
      const previousRepo = queryClient.getQueryData<Repository>(queryKeys.repos.detail(repoId))

      const markIndexing = (repo: Repository): Repository => ({
        ...repo,
        indexStatus: "INDEXING",
        filesProcessed: 0,
        errorMessage: null,
      })

      if (previousRepos) {
        queryClient.setQueryData<Repository[]>(
          queryKeys.repos.all,
          previousRepos.map((repo) => (repo.id === repoId ? markIndexing(repo) : repo))
        )
      }

      if (previousRepo) {
        queryClient.setQueryData<Repository>(
          queryKeys.repos.detail(repoId),
          markIndexing(previousRepo)
        )
      }

      return { previousRepos, previousRepo }
    },
    onError: (error, repoId, context) => {
      if (context?.previousRepos) {
        queryClient.setQueryData(queryKeys.repos.all, context.previousRepos)
      }
      if (context?.previousRepo) {
        queryClient.setQueryData(queryKeys.repos.detail(repoId), context.previousRepo)
      }
      toast.error(error instanceof Error ? error.message : "Failed to start indexing")
    },
    onSuccess: (updatedRepo) => {
      queryClient.setQueryData<Repository>(queryKeys.repos.detail(updatedRepo.id), updatedRepo)
      queryClient.setQueryData<Repository[]>(queryKeys.repos.all, (old) =>
        old?.map((repo) => (repo.id === updatedRepo.id ? updatedRepo : repo))
      )
      toast.success(`Indexing started for ${updatedRepo.name}`)
    },
    onSettled: (_data, _error, repoId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.repos.detail(repoId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.repos.all })
    },
  })
}

export function useRefreshRepos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.listRepos(true),
    onMutate: () => {
      const toastId = toast.loading("Syncing repositories from GitHub...")
      return { toastId }
    },
    onSuccess: (repos, _vars, context) => {
      queryClient.setQueryData(queryKeys.repos.all, repos)
      toast.success(`Synced ${repos.length} repositories`, { id: context?.toastId })
    },
    onError: (error, _vars, context) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to sync repositories",
        { id: context?.toastId }
      )
    },
  })
}

export function getRepoProgress(
  repo?: Pick<Repository | IndexStatusResponse, "filesTotal" | "filesProcessed"> | null
): number {
  if (!repo || !repo.filesTotal || repo.filesTotal <= 0) {
    return 0
  }
  return Math.min(100, Math.round((repo.filesProcessed / repo.filesTotal) * 100))
}