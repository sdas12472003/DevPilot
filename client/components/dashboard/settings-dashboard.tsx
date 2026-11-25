"use client"

import { LogOut, Palette, ShieldCheck, Github } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { useCurrentUser, useLogout } from "@/hooks/use-auth"

export function SettingsDashboard() {
  const { data: user } = useCurrentUser()
  const logoutMutation = useLogout()

  const initials = (user?.displayName || user?.githubUsername || "DP")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent p-6">
        <h1 className="text-xl font-bold tracking-tight">Account &amp; Preferences</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Manage your connected GitHub profile, appearance theme, and active session.
        </p>
      </div>

      {/* GitHub Account Card */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-xs">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Github className="h-3.5 w-3.5 text-primary" />
          Connected GitHub Account
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            <AvatarImage
              src={user?.avatarUrl ?? undefined}
              alt={user?.githubUsername ?? "GitHub avatar"}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user?.displayName || user?.githubUsername || "GitHub User"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              @{user?.githubUsername ?? "unknown"} · ID #{user?.githubId ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Appearance Card */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Palette className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Theme Appearance</p>
            <p className="text-xs text-muted-foreground">
              Switch between light, dark, or system theme.
            </p>
          </div>
        </div>

        <ModeToggle />
      </div>

      {/* Session & Security Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Sign Out of DevPilot</p>
            <p className="text-xs text-muted-foreground">
              Clears your backend session cookie and returns to the login screen.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="rounded-xl"
        >
          <LogOut className="mr-1.5 h-3.5 w-3.5" />
          {logoutMutation.isPending ? "Signing out..." : "Logout"}
        </Button>
      </div>
    </div>
  )
}