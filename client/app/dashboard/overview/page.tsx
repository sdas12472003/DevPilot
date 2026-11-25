"use client"

import { AppShell } from "@/components/layout/app-shell"
import { RequireAuth } from "@/components/providers/require-auth"
import { OverviewDashboard } from "@/components/dashboard/overview-dashboard"

export default function OverviewPage() {
  return (
    <RequireAuth>
      <AppShell>
        <OverviewDashboard />
      </AppShell>
    </RequireAuth>
  )
}