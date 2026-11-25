"use client"

import { useState, useRef } from "react"
import { SendHorizontal, Square } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatComposerProps {
  disabled?: boolean
  isStreaming: boolean
  placeholder?: string
  onSend: (content: string) => void
  onStop: () => void
}

export function ChatComposer({
  disabled = false,
  isStreaming,
  placeholder = "Ask anything about this codebase...",
  onSend,
  onStop,
}: ChatComposerProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled || isStreaming) return
    onSend(trimmed)
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border/60 bg-card/75 p-3.5 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-4xl items-end gap-2.5 rounded-2xl border border-border/80 bg-background/90 p-2 shadow-xs focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || isStreaming}
          placeholder={placeholder}
          className="max-h-40 min-h-[38px] flex-1 resize-none bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />

        {isStreaming ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={onStop}
            className="h-9 shrink-0 rounded-xl px-3.5 text-xs font-medium"
          >
            <Square className="mr-1.5 h-3.5 w-3.5 fill-current" />
            Stop
          </Button>
        ) : (
          <Button
            type="submit"
            size="sm"
            disabled={disabled || !value.trim()}
            className="h-9 shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 text-xs font-medium text-white hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
          >
            <SendHorizontal className="mr-1.5 h-3.5 w-3.5" />
            Send
          </Button>
        )}
      </div>
      <p className="mx-auto mt-1.5 max-w-4xl px-1 text-[11px] text-muted-foreground">
        Press <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">Enter</kbd> to send,{" "}
        <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">Shift + Enter</kbd> for a new line.
      </p>
    </form>
  )
}