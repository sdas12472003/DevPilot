export type IndexStatus = "PENDING" | "INDEXING" | "READY" | "FAILED"

export type ChatMessageRole = "USER" | "ASSISTANT"

export interface User {
  id: string
  githubId: number
  githubUsername: string
  displayName: string | null
  avatarUrl: string | null
}

export interface Repository {
  id: string
  githubRepoId: number
  owner: string
  name: string
  fullName: string
  isPrivate: boolean
  defaultBranch: string | null
  language: string | null
  htmlUrl: string | null
  description: string | null
  indexStatus: IndexStatus
  indexedAt: string | null
  chunkCount: number
  filesTotal: number
  filesProcessed: number
  errorMessage: string | null
}

export interface IndexStatusResponse {
  repositoryId: string
  indexStatus: IndexStatus
  filesTotal: number
  filesProcessed: number
  chunkCount: number
  indexedAt: string | null
  errorMessage: string | null
}

export interface Citation {
  filePath: string
  startLine: number | null
  endLine: number | null
  language: string | null
}

export interface ChatSession {
  id: string
  repositoryId: string
  title: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
  citations: Citation[]
  createdAt: string
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
}

export function getGithubLoginUrl(): string {
  return `${getApiBaseUrl()}/oauth2/authorization/github`
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data?.message === "string" && data.message.trim().length > 0) {
      return data.message
    }
    if (typeof data?.error === "string" && data.error.trim().length > 0) {
      return data.error
    }
  } catch {
    // Ignore JSON parse failures on non-JSON error responses
  }
  return response.statusText || `Request failed with status ${response.status}`
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const api = {
  // Auth
  me: () => apiFetch<User>("/api/auth/me"),
  logout: () => apiFetch<void>("/api/auth/logout", { method: "POST" }),

  // Repositories
  listRepos: (refresh = false) =>
    apiFetch<Repository[]>(`/api/repos?refresh=${refresh}`),
  getRepo: (id: string) => apiFetch<Repository>(`/api/repos/${id}`),
  startIndex: (id: string) =>
    apiFetch<Repository>(`/api/repos/${id}/index`, { method: "POST" }),
  indexStatus: (id: string) =>
    apiFetch<IndexStatusResponse>(`/api/repos/${id}/status`),

  // Chat
  createSession: (repositoryId: string, title?: string) =>
    apiFetch<ChatSession>("/api/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ repositoryId, title }),
    }),
  listSessions: (repositoryId: string) =>
    apiFetch<ChatSession[]>(
      `/api/chat/sessions?repositoryId=${encodeURIComponent(repositoryId)}`
    ),
  getMessages: (sessionId: string) =>
    apiFetch<ChatMessage[]>(
      `/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`
    ),
}