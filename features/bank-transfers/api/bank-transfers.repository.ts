import { apiFetch } from "@/core/http/client"
import { mapPage, pageQuery, type PageParams, type PageResponse, type SpringPage } from "@/core/http/pagination"

import type {
  SaveBankTransferInfoRequestDTO,
  TrainerBankTransferInfoDTO,
  TrainerPaymentDTO,
} from "../dto/bank-transfer.dto"
import { toBankTransferInfo, toTrainerPayment } from "../mappers/bank-transfer.mapper"
import type { BankTransferInfo, TrainerPayment } from "../model/bank-transfer.model"

const PAYMENTS = "/api/trainer/payments"
const INFO = "/api/trainer/bank-transfer-info"
const REVIEW = "/api/payments/bank-transfer"

export interface PaymentFilters extends PageParams {
  /** `undefined` means every method — the backend expands it server-side. */
  provider?: "mercadopago" | "bank_transfer"
  status?: "PENDING" | "APPROVED" | "REJECTED"
}

export const bankTransfersRepository = {
  /** `GET /api/trainer/payments` — both methods, filtered. */
  async list(filters: PaymentFilters = {}): Promise<PageResponse<TrainerPayment>> {
    const page = await apiFetch<SpringPage<TrainerPaymentDTO>>(PAYMENTS, {
      query: {
        ...pageQuery(filters),
        provider: filters.provider ?? null,
        status: filters.status ?? null,
      },
    })
    return mapPage(page, toTrainerPayment)
  },

  /** `GET /api/trainer/payments/pending-review-count`. */
  async pendingReviewCount(): Promise<number> {
    const body = await apiFetch<{ count: number }>(`${PAYMENTS}/pending-review-count`)
    return body.count ?? 0
  },

  /**
   * `POST /api/payments/bank-transfer/{id}/approve`.
   *
   * Approving is what activates the student's plan, upstream and in one
   * transaction. A 409 here is not a bug: it means someone else already
   * resolved this payment, and the list needs refreshing rather than retrying.
   */
  async approve(paymentId: number): Promise<TrainerPayment> {
    return toTrainerPayment(
      await apiFetch<TrainerPaymentDTO>(`${REVIEW}/${paymentId}/approve`, { method: "POST" }),
    )
  },

  /** `POST /api/payments/bank-transfer/{id}/reject`. The reason is required upstream. */
  async reject(paymentId: number, reason: string): Promise<TrainerPayment> {
    return toTrainerPayment(
      await apiFetch<TrainerPaymentDTO>(`${REVIEW}/${paymentId}/reject`, {
        method: "POST",
        body: { reason },
      }),
    )
  },

  /** `GET /api/trainer/bank-transfer-info` — 404 while the trainer has not filled it in. */
  async getInfo(): Promise<BankTransferInfo> {
    return toBankTransferInfo(await apiFetch<TrainerBankTransferInfoDTO>(INFO))
  },

  /** `PUT /api/trainer/bank-transfer-info` — creates or replaces. */
  async saveInfo(input: SaveBankTransferInfoRequestDTO): Promise<BankTransferInfo> {
    return toBankTransferInfo(
      await apiFetch<TrainerBankTransferInfoDTO>(INFO, { method: "PUT", body: input }),
    )
  },

  /** `DELETE /api/trainer/bank-transfer-info` — 204. Stops offering the method. */
  async deleteInfo(): Promise<void> {
    await apiFetch<void>(INFO, { method: "DELETE" })
  },
}
