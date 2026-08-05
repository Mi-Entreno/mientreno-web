import { STATUS_LABELS, type SubscriptionStatus } from "@/features/students/model/student.model"
import { cn } from "@/lib/utils"

/**
 * `SubscriptionStatus` upstream has five values, not the three the pre-API
 * types assumed: PENDING_PAYMENT and CANCELLED were missing entirely.
 */
const styles: Record<SubscriptionStatus, string> = {
  PENDING_PAYMENT: "bg-warning-surface text-warning-text border-warning",
  ACTIVE: "bg-success-surface text-success-text border-success/40",
  PAUSED: "bg-warning-surface text-warning-text border-warning",
  CANCELLED: "bg-secondary text-muted-foreground border-border",
  EXPIRED: "bg-error-surface text-error-text border-error/40",
}

export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-medium",
        styles[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  )
}
