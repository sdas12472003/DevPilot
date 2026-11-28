"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronsUpDown, Layers, LogOut, Settings } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useCurrentuser, useLogout } from "@/hooks/use-auth"
import { DASHBOARD_NAV_GROUPS, isDashboardActive } from "@/lib/dashboard-nav"
import { cn } from "@/lib/utils"

interface BrandMarkProps {
  className?: string
  showText?: boolean
}

export function BrandMark({ className, showText = true }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold", className)}>
      <Layers className="size-5 shrink-0 text-primary" />
      {showText && (
        <span className="truncate text-base tracking-tight">DevPilot</span>
      )}
    </span>
  )
}

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: user } = useCurrentuser()
  const logout = useLogout()

  const displayName = user?.displayName || user?.githubUsername || "Account"
  const initials = displayName.slice(0, 2).toUpperCase()

  const activeItem = DASHBOARD_NAV_GROUPS.flatMap((group) => group.items).find(
    (item) => isDashboardActive(pathname, item)
  )

  return (
    <SidebarProvider>
      <Sidebar
        collapsible="icon"
        className="border-r border-border/70 [&_[data-slot=sidebar-inner]]:relative [&_[data-slot=sidebar-inner]]:overflow-hidden [&_[data-slot=sidebar-inner]]:bg-transparent"
      >
        {/* Sidebar background artwork (light mode) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat dark:opacity-0"
          style={{ backgroundImage: "url('/images/sidebar-light-bg.png')" }}
        />
        {/* Light frosted glass veil for crisp text readability */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-white/35 backdrop-blur-[1px] dark:bg-sidebar"
        />

        <SidebarHeader className="relative z-10 border-b border-border/60 bg-white/40 px-3 py-3 backdrop-blur-sm dark:bg-transparent">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-md px-1 py-0.5 transition-opacity hover:opacity-80"
          >
            <BrandMark />
          </Link>
        </SidebarHeader>

        <SidebarContent className="relative z-10">
          {DASHBOARD_NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="font-semibold text-slate-700/90 dark:text-sidebar-foreground/70">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = isDashboardActive(pathname, item)

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={active}
                          tooltip={item.title}
                          onClick={() => router.push(item.href)}
                          className={cn(
                            "cursor-pointer transition-all duration-200 active:scale-[0.98]",
                            active
                              ? "bg-gradient-to-r from-primary to-pink-600 font-medium text-primary-foreground shadow-sm shadow-primary/25 hover:from-primary hover:to-pink-600 hover:text-primary-foreground"
                              : "text-slate-800 hover:bg-white/75 hover:shadow-2xs dark:text-sidebar-foreground dark:hover:bg-sidebar-accent"
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="relative z-10 border-t border-border/60 bg-white/50 p-2 backdrop-blur-sm dark:bg-transparent">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 text-left text-sm transition-colors hover:bg-white/80 focus:outline-none dark:hover:bg-sidebar-accent">
              <Avatar className="size-8 shrink-0">
                <AvatarImage
                  src={user?.avatarUrl ?? undefined}
                  alt={displayName}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">{displayName}</span>
                {user?.githubUsername && (
                  <span className="truncate text-muted-foreground">
                    @{user.githubUsername}
                  </span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="start" className="w-56">
              <div className="px-2 py-1.5 text-xs">
                <p className="truncate font-medium">{displayName}</p>
                {user?.githubUsername && (
                  <p className="truncate text-muted-foreground">
                    @{user.githubUsername}
                  </p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/settings")}
                className="cursor-pointer"
              >
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 size-4" />
                {logout.isPending ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 cursor-pointer" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-sm font-medium">
              {activeItem?.title ?? "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
                <Avatar className="size-8">
                  <AvatarImage
                    src={user?.avatarUrl ?? undefined}
                    alt={displayName}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/settings")}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="bg-saas-canvas relative z-0 flex-1 overflow-x-hidden p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-55 dark:opacity-0"
            style={{ backgroundImage: "url('/images/dashboard-light-bg.png')" }}
          />
          <div className="relative z-10 mx-auto max-w-7xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}