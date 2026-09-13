import { cn } from "@/lib/utils"

import {
  PAYMENT_STATUS_LABELS,
  paymentTone,
  type PaymentTone,
} from "../model/bank-transfer.model"
import type { PaymentStatusDTO } from "../dto/bank-transfer.dto"

/**
 * Same shape and token set as `components/dashboard/status-badge.tsx`, which
 * reads a `SubscriptionStatus`. Two badges rather than one generic component:
 * they happen to look alike, but a payment and a subscription move through
 * different states, and collapsing them would mean a props union that neither
 * caller reads well.
 */
const TONE_STYLES: Record<PaymentTone, string> = {
  success: "bg-success-surface text-success-text border-success/40",
  warning: "bg-warning-surface text-warning-text border-warning",
  danger: "bg-error-surface text-error-text border-error/40",
  neutral: "bg-secondary text-muted-foreground border-border",
}

export function PaymentStatusBadge({ status }: { status: PaymentStatusDTO }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-medium",
        TONE_STYLES[paymentTone(status)],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  )
}
