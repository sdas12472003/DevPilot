"use client"

import Link from "next/link"
import { ArrowRight, Code2, Code2 as BrandMark, Terminal, Zap } from "lucide-react"
import { GithubIcon } from "@/components/icons/github-icon"
import { buttonVariants } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { getGithubLoginUrl } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#fafaf9] text-foreground dark:bg-background">
      {/* Light-mode landing background image (.png) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-75 dark:opacity-0"
        style={{ backgroundImage: "url('/images/landing-light-bg.png')" }}
      />

      {/* Soft top/bottom readability veil in light mode */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/60 via-white/25 to-white/85 dark:from-indigo-950/25 dark:via-background dark:to-background"
      />

      <header className="container relative z-10 flex h-16 items-center justify-between py-4">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-85"
        >
          <BrandMark className="h-8 w-8 text-indigo-600 dark:text-primary" />
          <span className="text-xl font-bold tracking-tight">DevPilot</span>
        </Link>

        <div className="flex items-center gap-3">
          <ModeToggle />

          <Link
            href={getGithubLoginUrl()}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden cursor-pointer hover:bg-white/70 md:flex dark:hover:bg-muted/50"
            )}
          >
            Sign In
          </Link>

          <Link
            href={getGithubLoginUrl()}
            className={cn(
              buttonVariants({ variant: "default" }),
              "cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-indigo-500/25 hover:brightness-105"
            )}
          >
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="container relative z-10 flex flex-1 flex-col items-center justify-center py-12 text-center">
        <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center rounded-full border border-indigo-200/80 bg-white/80 px-3.5 py-1 text-sm font-medium text-slate-700 shadow-xs backdrop-blur-md dark:border-border dark:bg-background/60 dark:text-foreground">
            <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Now powered by GPT-4o Mini
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Chat with your{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500 bg-clip-text text-transparent">
              codebases
            </span>
          </h1>

          <p className="mx-auto max-w-[42rem] leading-normal text-slate-600 sm:text-xl sm:leading-8 dark:text-muted-foreground">
            DevPilot uses advanced RAG technology to understand your GitHub repositories.
            Ask questions, get code explanations, and find what you need instantly.
          </p>

          <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
            <Link
              href={getGithubLoginUrl()}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 cursor-pointer bg-gradient-to-r from-indigo-600 to-violet-600 px-8 text-white shadow-md shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 hover:brightness-105"
              )}
            >
              <GithubIcon className="mr-2 h-5 w-5" />
              Connect GitHub
            </Link>

            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-12 cursor-pointer border-slate-300/80 bg-white/80 px-8 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-white dark:border-border dark:bg-background/60"
              )}
            >
              View Demo
            </Link>
          </div>
        </div>

        <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 sm:grid-cols-3">
          <div className="flex flex-col items-center space-y-3 rounded-2xl border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300/80 hover:shadow-md dark:border-border/70 dark:bg-background/60">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Fast Indexing</h3>
            <p className="text-center text-sm text-slate-600 dark:text-muted-foreground">
              We process your repositories quickly using optimized vector embeddings.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-3 rounded-2xl border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300/80 hover:shadow-md dark:border-border/70 dark:bg-background/60">
            <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400">
              <Code2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Smart Context</h3>
            <p className="text-center text-sm text-slate-600 dark:text-muted-foreground">
              Our AI understands the relationships between your files and functions.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-3 rounded-2xl border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-amber-300/80 hover:shadow-md dark:border-border/70 dark:bg-background/60">
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
              <Terminal className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Accurate Answers</h3>
            <p className="text-center text-sm text-slate-600 dark:text-muted-foreground">
              Get exact file paths and code snippets directly from your repository.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}