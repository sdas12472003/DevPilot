export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  repos: {
    all: ["repos", "all"] as const,
    detail: (id: string) => ["repos", "detail", id] as const,
  },
  chat: {
    sessions: ["chat", "sessions"] as const,
    messages: (sessionId: string) => ["chat", "messages", sessionId] as const,
  },
};