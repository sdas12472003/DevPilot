"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCurrentuser } from "@/hooks/use-auth"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const { data: user, isLoading, isError, error } = useCurrentuser()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard")
    }
  }, [user, isLoading, router])

  if (isError) {
    // Redirect to login page with error
    const errorMessage = error instanceof Error ? error.message : "Authentication failed"
    router.replace(`/login?error=${encodeURIComponent(errorMessage)}`)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">Authentication Error</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Redirecting you back to login...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in duration-500">
        <Spinner className="h-8 w-8" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Finishing GitHub Sign In</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we complete your authentication...
          </p>
        </div>
      </div>
    </div>
  )
}