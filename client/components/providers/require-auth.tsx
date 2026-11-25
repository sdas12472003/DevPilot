"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"
import { useCurrentuser } from "@/hooks/use-auth"

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { data: user, isLoading } = useCurrentuser()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [isLoading, router, user])

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  return children
}