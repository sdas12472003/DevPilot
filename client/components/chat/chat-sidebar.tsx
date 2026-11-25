"use client"

import { useState } from "react"
import { MessageSquarePlus, MessageSquare, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { ChatSession } from "@/lib/api"

interface ChatSidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | undefined
  isLoading: boolean
  isCreating: boolean
  onSelectSession: (sessionId: string) => void
  onCreateSession: (title?: string) => void
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  isLoading,
  isCreating,
  onSelectSession,
  onCreateSession,
}: ChatSidebarProps) {
  const [title, setTitle] = useState("")

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateSession(title.trim() || undefined)
    setTitle("")
  }

  return (
    <aside className="flex h-full w-full flex-col border-b border-border/60 bg-card/60 backdrop-blur-md md:w-72 md:shrink-0 md:border-b-0 md:border-r">
      <div className="border-b border-border/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Chat Sessions</h2>
            <p className="text-[11px] text-muted-foreground">
              {sessions.length} {sessions.length === 1 ? "thread" : "threads"}
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Session title (optional)..."
            className="h-8 rounded-lg bg-background/80 text-xs"
            disabled={isCreating}
          />
          <Button
            type="submit"
            size="sm"
            disabled={isCreating}
            className="h-8 w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-xs font-medium text-white shadow-sm hover:from-indigo-500 hover:to-violet-500"
          >
            <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />
            {isCreating ? "Creating..." : "New Chat"}
          </Button>
        </form>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2.5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-11 w-full rounded-xl" />
          ))
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 p-5 text-center">
            <MessageSquare className="mx-auto mb-2 h-5 w-5 text-muted-foreground/70" />
            <p className="text-xs font-medium text-foreground/80">No chats yet</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Start a session above to ask questions about this repo.
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  "group flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all",
                  isActive
                    ? "bg-primary/12 text-foreground ring-1 ring-primary/30 shadow-xs"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                <MessageSquare
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{session.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(session.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}