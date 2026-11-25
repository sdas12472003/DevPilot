"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { api, ApiError } from "@/lib/api"

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  repos: {
    all: ["repos", "all"] as const,
    detail: (id: string) => ["repos", "detail", id] as const,
  },
  chat: {
    sessions: ["chat", "sessions"] as const,
    messages: (sessionId: string) => ["chat", "messages", sessionId] as const,
  },
}

export const AUTH_COOKIE = "devpilot_auth"

export function setAuthCookie(value: boolean) {
  if (typeof document !== "undefined") {
    document.cookie = `${AUTH_COOKIE}=${value ? "1" : "0"}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
  }
}

export function useCurrentuser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      try {
        const user = await api.me()
        setAuthCookie(true)
        return user
      } catch (error) {
        setAuthCookie(false)
        throw error
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: async () => {
      setAuthCookie(false)
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
      router.replace("/login")
    },
  })
}