import type {
  PaymentProviderDTO,
  PaymentStatusDTO,
  SubscriptionStatusDTO,
} from "../dto/bank-transfer.dto"

/** A charge as the trainer sees it, whichever way the money came in. */
export interface TrainerPayment {
  id: number
  subscriptionId: number
  studentId: number | null
  studentName: string
  studentImageUrl: string | null
  planName: string
  subscriptionStatus: SubscriptionStatusDTO | null
  amount: number
  currency: string
  status: PaymentStatusDTO
  provider: PaymentProviderDTO
  transferReference: string | null
  proofUploaded: boolean
  proofFileName: string | null
  proofMimeType: string | null
  proofUploadedAt: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  applicationFee: number | null
  netAmount: number | null
  paidAt: string | null
  createdAt: string
}

export interface BankTransferInfo {
  id: number
  accountHolder: string
  bankName: string
  alias: string | null
  cbu: string
  taxId: string | null
  instructions: string | null
  enabled: boolean
  updatedAt: string | null
}

export const PROVIDER_LABELS: Record<PaymentProviderDTO, string> = {
  mercadopago: "Mercado Pago",
  bank_transfer: "Transferencia",
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatusDTO, string> = {
  PENDING: "Pendiente",
  IN_PROCESS: "En proceso",
  APPROVED: "Aprobado",
  AUTHORIZED: "Autorizado",
  REJECTED: "Rechazado",
  REFUNDED: "Reintegrado",
  CANCELLED: "Cancelado",
  CHARGED_BACK: "Contracargo",
}

export type PaymentTone = "success" | "warning" | "danger" | "neutral"

export const paymentTone = (status: PaymentStatusDTO): PaymentTone => {
  if (status === "APPROVED" || status === "AUTHORIZED") return "success"
  if (status === "PENDING" || status === "IN_PROCESS") return "warning"
  if (status === "REJECTED" || status === "CANCELLED" || status === "CHARGED_BACK") return "danger"
  return "neutral"
}

/**
 * Whether this row is something the trainer can act on.
 *
 * Only transfers, and only while they still carry a proof nobody has judged.
 * Mercado Pago rows are read-only here on purpose: their state is moved by the
 * webhook, and an "Aprobar" button next to one would be a lie — nothing in this
 * panel can make Mercado Pago release money.
 */
export const isReviewable = (payment: TrainerPayment): boolean =>
  payment.provider === "bank_transfer" && payment.status === "PENDING" && payment.proofUploaded

/**
 * A transfer the student started but never backed with a receipt.
 *
 * Worth distinguishing from a reviewable one: there is nothing to look at yet,
 * and the trainer should not be waiting on themself.
 */
export const isAwaitingProof = (payment: TrainerPayment): boolean =>
  payment.provider === "bank_transfer" && payment.status === "PENDING" && !payment.proofUploaded

/**
 * Whether the trainer can give up on this charge from the row.
 *
 * A receipt waiting for review is excluded on purpose, and the backend answers
 * 409 for it too: that student has probably already sent the money, so the
 * trainer rejects it first — with a reason the student sees — and cancels from
 * the rejection itself. Cancelling acts on the subscription, so every pending
 * charge of it goes at once.
 *
 * And only while the subscription is still waiting for a payment. A student
 * who opened the Mercado Pago checkout and then paid by transfer leaves a
 * PENDING row behind on an already active subscription; offering "Cancelar
 * cobro" there ended in a 409, because that student has nothing left to pay.
 */
export const canCancelPending = (payment: TrainerPayment): boolean =>
  (payment.status === "PENDING" || payment.status === "IN_PROCESS") &&
  !isReviewable(payment) &&
  isAwaitingPayment(payment)

/**
 * Whether the subscription behind this row still waits for a payment. An
 * unknown state (older backend) keeps the previous behaviour: the server
 * still answers 409 if it is not.
 */
export const isAwaitingPayment = (payment: TrainerPayment): boolean =>
  payment.subscriptionStatus === null || payment.subscriptionStatus === "PENDING_PAYMENT"

/** Where the proof bytes come from. Never a storage URL. */
export const proofUrl = (paymentId: number): string => `/api/proofs/${paymentId}`

/**
 * The canned reasons, in the order they actually come up.
 *
 * "Otro" is last and is the only one that opens a free-text field: offering the
 * box first invites a one-word rejection ("no"), which is exactly the message
 * the student cannot act on.
 */
export const REJECTION_REASONS = [
  "El importe no coincide con el del plan",
  "El comprobante es ilegible",
  "No encuentro la transferencia en mi cuenta",
  "Los datos de la transferencia no coinciden",
] as const

export const OTHER_REASON = "Otro" as const

/** CBU shown in groups, the way a bank prints it. Never altered for storage. */
export const formatCbu = (cbu: string): string =>
  cbu.length === 22 ? `${cbu.slice(0, 8)} ${cbu.slice(8)}` : cbu
