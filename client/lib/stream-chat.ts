import {
  ApiError,
  getApiBaseUrl,
  type ChatMessage,
  type Citation,
} from "@/lib/api"

export interface StreamChatHandlers {
  sessionId: string
  content: string
  signal?: AbortSignal
  onUserMessage?: (message: ChatMessage) => void
  onToken?: (token: string) => void
  onAssistantMessage?: (message: ChatMessage) => void
  onDone?: () => void
  onError?: (errorMessage: string) => void
}

function parseCitations(raw: unknown): Citation[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.map((item) => {
    const obj = (item ?? {}) as Record<string, unknown>
    return {
      filePath: typeof obj.filePath === "string" ? obj.filePath : "",
      startLine: typeof obj.startLine === "number" ? obj.startLine : null,
      endLine: typeof obj.endLine === "number" ? obj.endLine : null,
      language: typeof obj.language === "string" ? obj.language : null,
    }
  })
}

function parseChatMessage(rawData: string): ChatMessage | null {
  try {
    const parsed = JSON.parse(rawData) as Record<string, unknown>
    if (parsed && typeof parsed.id === "string" && typeof parsed.content === "string") {
      return {
        id: parsed.id,
        role: parsed.role === "USER" ? "USER" : "ASSISTANT",
        content: parsed.content,
        citations: parseCitations(parsed.citations),
        createdAt:
          typeof parsed.createdAt === "string"
            ? parsed.createdAt
            : new Date().toISOString(),
      }
    }
  } catch {
    // Backend may emit a plain message ID string instead of full JSON
  }
  return null
}

function dispatchSseEvent(
  eventName: string,
  data: string,
  handlers: StreamChatHandlers
): boolean {
  switch (eventName) {
    case "user-message":
    case "user_message": {
      const msg = parseChatMessage(data)
      if (msg) {
        handlers.onUserMessage?.(msg)
      }
      return false
    }
    case "token": {
      handlers.onToken?.(data)
      return false
    }
    case "message":
    case "assistant-message":
    case "assistant_message": {
      const msg = parseChatMessage(data)
      if (msg) {
        handlers.onAssistantMessage?.(msg)
      }
      return false
    }
    case "done": {
      handlers.onDone?.()
      return true
    }
    case "error": {
      handlers.onError?.(data || "Stream error occurred")
      return true
    }
    default:
      return false
  }
}

export async function streamChat(handlers: StreamChatHandlers): Promise<void> {
  const url = `${getApiBaseUrl()}/api/chat/sessions/${encodeURIComponent(
    handlers.sessionId
  )}/messages/stream`

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    signal: handlers.signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ content: handlers.content }),
  })

  if (!response.ok) {
    let errorText = response.statusText || `Request failed with status ${response.status}`
    try {
      const errJson = await response.json()
      if (typeof errJson?.message === "string" && errJson.message.trim()) {
        errorText = errJson.message
      }
    } catch {
      // Ignore non-JSON error body
    }
    const err = new ApiError(response.status, errorText)
    handlers.onError?.(err.message)
    throw err
  }

  if (!response.body) {
    handlers.onDone?.()
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let currentEvent = "message"
  let dataLines: string[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (line === "") {
        if (dataLines.length > 0) {
          const payload = dataLines.join("\n")
          const finished = dispatchSseEvent(currentEvent, payload, handlers)
          currentEvent = "message"
          dataLines = []
          if (finished) {
            return
          }
        }
      } else if (line.startsWith("event:")) {
        currentEvent = line.slice("event:".length).trim() || "message"
      } else if (line.startsWith("data:")) {
        const rawLine = line.slice("data:".length)
        dataLines.push(rawLine.startsWith(" ") ? rawLine.slice(1) : rawLine)
      }
    }
  }

  if (dataLines.length > 0) {
    dispatchSseEvent(currentEvent, dataLines.join("\n"), handlers)
  }

  handlers.onDone?.()
}