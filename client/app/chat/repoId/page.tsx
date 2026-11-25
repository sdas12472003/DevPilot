"use client"

import { use } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { RequireAuth } from "@/components/providers/require-auth"
import { ChatView } from "@/components/chat/chat-view"

interface ChatPageProps {
  params: Promise<{ repoId: string }>
}

export default function ChatPage({ params }: ChatPageProps) {
  const { repoId } = use(params)

  return (
    <RequireAuth>
      <AppShell>
        <ChatView repoId={repoId} />
      </AppShell>
    </RequireAuth>
  )
}