import { toMediaUrl } from "@/core/http/media"

import type {
  TrainerBankTransferInfoDTO,
  TrainerPaymentDTO,
} from "../dto/bank-transfer.dto"
import type { BankTransferInfo, TrainerPayment } from "../model/bank-transfer.model"

/**
 * `studentImageUrl` goes through `toMediaUrl` like every other URL-bearing
 * field in this codebase: with `storage.provider=local` the backend hands back
 * an authenticated `/api/files/**` URL that an `<img src>` cannot load.
 *
 * The proof image does **not** appear here at all — the backend never sends its
 * URL, by design.
 */
export function toTrainerPayment(dto: TrainerPaymentDTO): TrainerPayment {
  return {
    id: dto.id,
    subscriptionId: dto.subscriptionId,
    studentId: dto.studentId,
    studentName: dto.studentName?.trim() || "Alumno",
    studentImageUrl: toMediaUrl(dto.studentImageUrl),
    planName: dto.planName?.trim() || "Plan",
    amount: dto.amount,
    currency: dto.currency || "ARS",
    status: dto.status,
    provider: dto.provider,
    transferReference: dto.transferReference,
    proofUploaded: dto.proofUploaded,
    proofFileName: dto.proofFileName,
    proofMimeType: dto.proofMimeType,
    proofUploadedAt: dto.proofUploadedAt,
    reviewedAt: dto.reviewedAt,
    rejectionReason: dto.rejectionReason,
    applicationFee: dto.applicationFee,
    netAmount: dto.netAmount,
    paidAt: dto.paidAt,
    createdAt: dto.createdAt,
  }
}

export function toBankTransferInfo(dto: TrainerBankTransferInfoDTO): BankTransferInfo {
  return {
    id: dto.id,
    accountHolder: dto.accountHolder,
    bankName: dto.bankName,
    alias: dto.alias,
    cbu: dto.cbu,
    taxId: dto.taxId,
    instructions: dto.instructions,
    enabled: dto.enabled,
    updatedAt: dto.updatedAt,
  }
}
