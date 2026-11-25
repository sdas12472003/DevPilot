"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Code2, Sparkles, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRepos } from "@/hooks/use-repo"
import {
  useChatMessages,
  useChatSessions,
  useChatStream,
  useCreateChatSession,
} from "@/hooks/use-chat"
import { ChatSidebar } from "./chat-sidebar"
import { ChatMessage } from "./chat-message"
import { ChatComposer } from "./chat-composer"

interface ChatViewProps {
  repoId: string
}

const STARTER_PROMPTS = [
  "Explain the overall architecture and main entry points of this repository.",
  "Where is authentication or request handling implemented?",
  "Summarize the key services, entities, or modules and how they connect.",
]

export function ChatView({ repoId }: ChatViewProps) {
  const { data: repos = [], isLoading: isRepoLoading } = useRepos()
  const repo = repos.find((r) => r.id === repoId)

  const { data: sessions = [], isLoading: isSessionsLoading } =
    useChatSessions(repoId)
  const createSessionMutation = useCreateChatSession()

  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(
    undefined
  )

  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].id)
    }
  }, [sessions, selectedSessionId])

  const activeSessionId =
    selectedSessionId && sessions.some((s) => s.id === selectedSessionId)
      ? selectedSessionId
      : sessions[0]?.id

  const { data: messages = [], isLoading: isMessagesLoading } =
    useChatMessages(activeSessionId)

  const {
    sendMessage,
    stopStream,
    isStreaming,
    streamingContent,
    streamingCitations,
  } = useChatStream(activeSessionId)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, streamingContent])

  const handleCreateSession = (title?: string) => {
    createSessionMutation.mutate(
      { repositoryId: repoId, title },
      {
        onSuccess: (created) => {
          setSelectedSessionId(created.id)
        },
      }
    )
  }

  const isRepoReady = repo?.indexStatus === "READY"

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-indigo-500/5 shadow-sm md:flex-row">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isLoading={isSessionsLoading}
        isCreating={createSessionMutation.isPending}
        onSelectSession={setSelectedSessionId}
        onCreateSession={handleCreateSession}
      />

      <section className="flex min-h-0 flex-1 flex-col">
        {/* Top Repository Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-card/70 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Repos
            </Link>

            {isRepoLoading ? (
              <Skeleton className="h-5 w-48" />
            ) : repo ? (
              <div className="flex items-center gap-2 min-w-0">
                <Code2 className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-sm font-semibold">
                  {repo.fullName}
                </span>
                <Badge
                  variant={isRepoReady ? "secondary" : "outline"}
                  className="shrink-0 text-[11px]"
                >
                  {repo.indexStatus}
                </Badge>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Repository</span>
            )}
          </div>

          {repo && !isRepoReady && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Index this repository to READY before chatting.</span>
            </div>
          )}
        </header>

        {/* Message Feed */}
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 md:px-8">
          {!activeSessionId ? (
            <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/20 text-primary ring-1 ring-primary/25">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold">
                Chat with {repo?.fullName ?? "your repository"}
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Create a chat session on the left to ask grounded questions about files, classes, routes, and logic.
              </p>
              <Button
                type="button"
                onClick={() => handleCreateSession()}
                disabled={createSessionMutation.isPending || !isRepoReady}
                className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-xs font-medium text-white hover:from-indigo-500 hover:to-violet-500"
              >
                {createSessionMutation.isPending
                  ? "Starting session..."
                  : "Start First Chat"}
              </Button>
            </div>
          ) : isMessagesLoading ? (
            <div className="mx-auto max-w-4xl space-y-4">
              <Skeleton className="h-16 w-2/3 rounded-2xl" />
              <Skeleton className="ml-auto h-14 w-1/2 rounded-2xl" />
              <Skeleton className="h-24 w-3/4 rounded-2xl" />
            </div>
          ) : messages.length === 0 && !isStreaming ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
              <h3 className="text-sm font-semibold text-foreground">
                Ask anything about {repo?.name ?? "this codebase"}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Responses are grounded in indexed code chunks with file &amp; line citations.
              </p>
              <div className="mt-5 grid w-full gap-2.5 sm:grid-cols-1">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={!isRepoReady}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-xl border border-border/70 bg-card/80 px-4 py-3 text-left text-xs text-foreground/90 transition-all hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-5">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  repoHtmlUrl={repo?.htmlUrl}
                  defaultBranch={repo?.defaultBranch}
                />
              ))}

              {isStreaming && (
                <ChatMessage
                  isStreamingDraft
                  streamingContent={streamingContent}
                  streamingCitations={streamingCitations}
                  repoHtmlUrl={repo?.htmlUrl}
                  defaultBranch={repo?.defaultBranch}
                />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Composer */}
        <ChatComposer
          disabled={!activeSessionId || !isRepoReady}
          isStreaming={isStreaming}
          placeholder={
            !activeSessionId
              ? "Select or create a session to start chatting..."
              : !isRepoReady
              ? "Repository must be READY before sending messages..."
              : `Ask about ${repo?.name ?? "this repository"}...`
          }
          onSend={sendMessage}
          onStop={stopStream}
        />
      </section>
    </div>
  )
}