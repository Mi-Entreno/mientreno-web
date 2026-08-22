"use client"

import { CloudOff, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { isRetryable, userMessage, type FailureContext } from "@/core/http/user-message"

interface ErrorStateProps {
  error: unknown
  /** Shapes the fallback wording when the error carries nothing displayable. */
  context?: FailureContext
  /** Wired to the query's `refetch`. Omitted when there is nothing to retry. */
  onRetry?: () => void
  /** Compact variant, for a panel or a sheet rather than a whole screen. */
  inline?: boolean
}

/**
 * What a failed screen shows.
 *
 * Replaces a dozen bare `<p className="text-error-text">` lines that told the
 * trainer something had broken and then left them with no way forward. Every
 * failure now ends in either a retry button or an explanation of why retrying
 * would not help.
 */
export function ErrorState({ error, context = "load", onRetry, inline }: ErrorStateProps) {
  const message = userMessage(error, context)
  const canRetry = Boolean(onRetry) && isRetryable(error)

  if (inline) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3">
        <p className="text-body text-muted-foreground text-pretty">{message}</p>
        {canRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="ml-auto shrink-0">
            <RotateCcw className="size-4" />
            Reintentar
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <CloudOff className="size-6" />
      </div>
      <p className="max-w-sm text-body text-muted-foreground text-pretty">{message}</p>
      {canRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-1">
          <RotateCcw className="size-4" />
          Reintentar
        </Button>
      )}
    </div>
  )
}
