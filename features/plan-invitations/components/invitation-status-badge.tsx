import { cn } from "@/lib/utils"
import { describeStatus, type InvitationStatus, type InvitationTone } from "../model/plan-invitation.model"

/**
 * Same shape as `StatusBadge` for subscriptions, so the two never look like
 * different systems on the students screen.
 */
const TONE_CLASSES: Record<InvitationTone, string> = {
  info: "bg-secondary text-muted-foreground border-border",
  success: "bg-success-surface text-success-text border-success/40",
  warning: "bg-warning-surface text-warning-text border-warning",
  danger: "bg-error-surface text-error-text border-error/40",
  neutral: "bg-secondary text-muted-foreground border-border",
}

export function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  const descriptor = describeStatus(status)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-medium",
        TONE_CLASSES[descriptor.tone],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {descriptor.label}
    </span>
  )
}
