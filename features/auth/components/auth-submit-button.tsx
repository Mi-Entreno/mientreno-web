import { ArrowRight, Loader2 } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AuthSubmitButtonProps {
  pending?: boolean
  /** Replaces the label while the request is in flight. */
  pendingLabel?: string
  disabled?: boolean
  className?: string
  children: ReactNode
}

/**
 * The one call to action on each auth screen.
 *
 * Taller than the kit's `lg` button and carrying a green glow, because on these
 * pages it is the primary object rather than one control among many. The arrow
 * only appears at rest: swapping it for the spinner keeps the label from
 * shifting sideways mid-submit.
 */
export function AuthSubmitButton({
  pending,
  pendingLabel,
  disabled,
  className,
  children,
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending || disabled}
      className={cn(
        "mt-1 h-12 w-full gap-2 text-body-lg shadow-[0_10px_24px_-12px_var(--brand-green)] transition-shadow hover:shadow-[0_14px_30px_-12px_var(--brand-green)] disabled:shadow-none",
        className,
      )}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {pendingLabel ?? children}
        </>
      ) : (
        <>
          {children}
          <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
        </>
      )}
    </Button>
  )
}
