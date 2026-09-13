import { describe, expect, it } from "vitest"

import type { TrainerPaymentDTO } from "../dto/bank-transfer.dto"
import { toTrainerPayment } from "../mappers/bank-transfer.mapper"
import { isValidCbu } from "./cbu"
import {
  formatCbu,
  isAwaitingProof,
  isReviewable,
  paymentTone,
  proofUrl,
} from "./bank-transfer.model"

const DTO: TrainerPaymentDTO = {
  id: 55,
  subscriptionId: 101,
  studentId: 10,
  studentName: "Juan Pérez",
  studentImageUrl: "http://localhost:8080/api/files/avatars/10/me.png",
  planName: "Plan Mensual",
  amount: 25000,
  currency: "ARS",
  status: "PENDING",
  provider: "bank_transfer",
  transferReference: "OP-123",
  proofUploaded: true,
  proofFileName: "captura.jpg",
  proofMimeType: "image/jpeg",
  proofUploadedAt: "2026-09-11T12:00:00Z",
  reviewedAt: null,
  rejectionReason: null,
  applicationFee: null,
  netAmount: null,
  paidAt: null,
  createdAt: "2026-09-11T11:00:00Z",
}

describe("toTrainerPayment", () => {
  it("routes the student photo through the media proxy", () => {
    // A plain <img src> sends no Authorization, and /api/files/** is
    // authenticated upstream.
    expect(toTrainerPayment(DTO).studentImageUrl).toBe("/api/media/avatars/10/me.png")
  })

  it("falls back rather than rendering an empty cell", () => {
    const payment = toTrainerPayment({ ...DTO, studentName: "  ", planName: null })

    expect(payment.studentName).toBe("Alumno")
    expect(payment.planName).toBe("Plan")
  })

  it("never carries a storage URL for the proof", () => {
    // The backend does not send one: the receipt is read through an endpoint
    // that checks who is asking.
    expect(Object.keys(toTrainerPayment(DTO))).not.toContain("proofUrl")
  })
})

describe("isReviewable", () => {
  it("is true for a pending transfer that already has a receipt", () => {
    expect(isReviewable(toTrainerPayment(DTO))).toBe(true)
  })

  it("is false while the student has not uploaded anything", () => {
    const payment = toTrainerPayment({ ...DTO, proofUploaded: false })

    expect(isReviewable(payment)).toBe(false)
    expect(isAwaitingProof(payment)).toBe(true)
  })

  it("is false for Mercado Pago, whatever its status", () => {
    // Its state is moved by the webhook. An approve button there would promise
    // something this panel cannot do.
    expect(isReviewable(toTrainerPayment({ ...DTO, provider: "mercadopago" }))).toBe(false)
  })

  it("is false once the payment was resolved", () => {
    expect(isReviewable(toTrainerPayment({ ...DTO, status: "APPROVED" }))).toBe(false)
    expect(isReviewable(toTrainerPayment({ ...DTO, status: "REJECTED" }))).toBe(false)
  })
})

describe("paymentTone", () => {
  it("maps each status to the tone the badge paints", () => {
    expect(paymentTone("APPROVED")).toBe("success")
    expect(paymentTone("PENDING")).toBe("warning")
    expect(paymentTone("REJECTED")).toBe("danger")
    expect(paymentTone("REFUNDED")).toBe("neutral")
  })
})

describe("proofUrl", () => {
  it("points at our own authenticated route", () => {
    expect(proofUrl(55)).toBe("/api/proofs/55")
  })
})

describe("formatCbu", () => {
  it("splits the two blocks the way a bank prints them", () => {
    expect(formatCbu("0070599800004184413502")).toBe("00705998 00004184413502")
  })

  it("leaves anything else untouched", () => {
    expect(formatCbu("123")).toBe("123")
  })
})

describe("isValidCbu", () => {
  it("accepts a CBU whose two check digits hold", () => {
    expect(isValidCbu("0070599800004184413502")).toBe(true)
  })

  it("rejects a single mistyped digit in either block", () => {
    // This is the whole point of validating in the browser: a wrong CBU sends
    // the student's money somewhere nobody can get it back from.
    expect(isValidCbu("0070599900004184413502")).toBe(false)
    expect(isValidCbu("0070599800004184413503")).toBe(false)
  })

  it("rejects anything that is not 22 digits", () => {
    expect(isValidCbu("007059980000418441350")).toBe(false)
    expect(isValidCbu("00705998000041844135O2")).toBe(false)
    expect(isValidCbu("")).toBe(false)
  })
})
