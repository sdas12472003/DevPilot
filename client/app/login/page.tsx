"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Code2 as BrandMark, Loader2 } from "lucide-react"
import { getGithubLoginUrl } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { GithubIcon } from "@/components/icons/github-icon"

function LoginLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  )
}

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="flex min-h-svh flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-background to-background dark:from-blue-950/20" />

      <header className="container relative z-10 flex h-16 items-center justify-between py-4">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <BrandMark className="size-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">DevPilot</span>
        </Link>
        <ModeToggle />
      </header>

      <main className="container relative z-10 flex flex-1 flex-col items-center justify-center pb-16">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-2">
              <BrandMark className="size-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground max-w-sm">
              Sign in to start chatting with your codebases
            </p>
          </div>

          <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-background/95">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl">Sign in</CardTitle>
              <CardDescription>
                Connect GitHub to chat with your repositories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="animate-in fade-in zoom-in-95"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Authentication Failed</AlertTitle>
                  <AlertDescription>
                    {error === "oauth2_failed"
                      ? "Failed to authenticate with GitHub. Please try again."
                      : "An error occurred during sign in. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                size="lg"
                className="w-full relative group overflow-hidden"
                onClick={() => window.location.assign(getGithubLoginUrl())}
              >
                <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors" />
                <GithubIcon className="mr-2 size-5" />
                <span className="font-medium">Continue with GitHub</span>
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                By continuing, you agree to our{" "}
                <Link
                  href="/terms"
                  className="underline underline-offset-4 hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-4 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
                .
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  )
}