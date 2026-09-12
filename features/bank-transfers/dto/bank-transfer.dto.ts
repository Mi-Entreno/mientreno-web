/**
 * Literal mirror of the backend's bank-transfer DTOs.
 *
 * Java sources:
 *   - `payment/dto/TrainerPaymentResponseDTO.java`
 *   - `payment/dto/TrainerBankTransferInfoRequestDTO.java`
 *   - `payment/dto/TrainerBankTransferInfoResponseDTO.java`
 *   - `payment/dto/RejectPaymentRequestDTO.java`
 *
 * Note what is **not** here: the proof's storage URL. The backend deliberately
 * never serialises it — a transfer receipt carries a CBU, a name and amounts,
 * and every storage provider hands out public URLs. The bytes come from
 * `GET /api/payments/bank-transfer/{id}/proof`, which checks who is asking.
 */

/** `PaymentStatus`. The four the transfer flow can produce, plus MP's own. */
export type PaymentStatusDTO =
  | "PENDING"
  | "IN_PROCESS"
  | "APPROVED"
  | "AUTHORIZED"
  | "REJECTED"
  | "REFUNDED"
  | "CANCELLED"
  | "CHARGED_BACK"

/** `payments.provider`. Lowercase because it is a legacy String column, not an enum. */
export type PaymentProviderDTO = "mercadopago" | "bank_transfer"

/** `GET /api/trainer/payments` — one row. */
export interface TrainerPaymentDTO {
  id: number
  subscriptionId: number
  studentId: number | null
  studentName: string | null
  studentImageUrl: string | null
  planName: string | null
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
  /** Registered, not charged — see the Java doc on `Payment.netAmount`. */
  applicationFee: number | null
  netAmount: number | null
  paidAt: string | null
  createdAt: string
}

/** `GET|PUT /api/trainer/bank-transfer-info`. */
export interface TrainerBankTransferInfoDTO {
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

/** `PUT /api/trainer/bank-transfer-info`. */
export interface SaveBankTransferInfoRequestDTO {
  accountHolder: string
  bankName: string
  alias: string | null
  cbu: string
  taxId: string | null
  instructions: string | null
  enabled: boolean
}

/** `POST /api/payments/bank-transfer/{id}/reject`. */
export interface RejectPaymentRequestDTO {
  reason: string
}
