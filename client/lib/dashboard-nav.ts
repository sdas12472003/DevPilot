import type { LucideIcon } from "lucide-react"
import { FolderGit2, LayoutDashboard, Settings } from "lucide-react"

export interface DashboardNavItem {
  title: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

export interface DashboardNavGroup {
  label: string
  items: DashboardNavItem[]
}

export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        title: "Overview",
        href: "/dashboard/overview",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        title: "Repositories",
        href: "/dashboard",
        icon: FolderGit2,
        exact: true,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        exact: true,
      },
    ],
  },
]

export function isDashboardActive(
  pathname: string,
  item: DashboardNavItem
): boolean {
  if (item.exact) {
    return pathname === item.href
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}