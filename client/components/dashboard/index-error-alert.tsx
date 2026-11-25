"use client"

import { AlertCircle, RotateCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface IndexErrorAlertProps {
  message?: string | null
  title?: string
  onRetry?: () => void
  isRetrying?: boolean
  className?: string
}

export function IndexErrorAlert({
  message,
  title = "Indexing failed",
  onRetry,
  isRetrying = false,
  className,
}: IndexErrorAlertProps) {
  if (!message) {
    return null
  }

  return (
    <Alert variant="destructive" className={cn("text-left", className)}>
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-1 flex flex-col gap-3">
        <p className="break-words text-xs sm:text-sm">{message}</p>
        {onRetry && (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="h-7 border-destructive/40 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <RotateCw
                className={cn("mr-1.5 size-3.5", isRetrying && "animate-spin")}
              />
              {isRetrying ? "Retrying..." : "Retry indexing"}
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}