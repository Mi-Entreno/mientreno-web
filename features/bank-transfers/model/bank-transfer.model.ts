import type { PaymentProviderDTO, PaymentStatusDTO } from "../dto/bank-transfer.dto"

/** A charge as the trainer sees it, whichever way the money came in. */
export interface TrainerPayment {
  id: number
  subscriptionId: number
  studentId: number | null
  studentName: string
  studentImageUrl: string | null
  planName: string
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
