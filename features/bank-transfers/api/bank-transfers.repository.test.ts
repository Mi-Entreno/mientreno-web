import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import { ApiError } from "@/core/http/errors"
import { bankTransfersRepository } from "./bank-transfers.repository"

let lastListUrl: URL | null = null
let lastRejectBody: unknown = null

const PAYMENT = {
  id: 55,
  subscriptionId: 101,
  studentId: 10,
  studentName: "Juan Pérez",
  studentImageUrl: null,
  planName: "Plan Mensual",
  amount: 25000,
  currency: "ARS",
  status: "PENDING" as const,
  provider: "bank_transfer" as const,
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

const server = setupServer(
  http.get("*/api/backend/api/trainer/payments/pending-review-count", () =>
    HttpResponse.json({ count: 3 }),
  ),

  http.get("*/api/backend/api/trainer/payments", ({ request }) => {
    lastListUrl = new URL(request.url)

    return HttpResponse.json({
      content: [PAYMENT],
      number: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      numberOfElements: 1,
      empty: false,
    })
  }),

  http.post("*/api/backend/api/payments/bank-transfer/:id/approve", ({ params }) =>
    HttpResponse.json({
      ...PAYMENT,
      id: Number(params.id),
      status: "APPROVED",
      reviewedAt: "2026-09-11T13:00:00Z",
      applicationFee: 2500,
      netAmount: 22500,
      paidAt: "2026-09-11T13:00:00Z",
    }),
  ),

  http.post("*/api/backend/api/payments/bank-transfer/:id/reject", async ({ request, params }) => {
    lastRejectBody = await request.json()

    return HttpResponse.json({
      ...PAYMENT,
      id: Number(params.id),
      status: "REJECTED",
      reviewedAt: "2026-09-11T13:00:00Z",
      rejectionReason: "El importe no coincide con el del plan",
    })
  }),

  http.get("*/api/backend/api/trainer/bank-transfer-info", () =>
    HttpResponse.json({
      id: 1,
      accountHolder: "Ana Gómez",
      bankName: "Banco Galicia",
      alias: "ana.entrena",
      cbu: "0070599800004184413502",
      taxId: null,
      instructions: null,
      enabled: true,
      updatedAt: "2026-09-01T10:00:00",
    }),
  ),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  lastListUrl = null
  lastRejectBody = null
})
afterAll(() => server.close())

describe("list", () => {
  it("maps the Spring page into the shape the screen consumes", async () => {
    const page = await bankTransfersRepository.list({ status: "PENDING" })

    expect(page.items).toHaveLength(1)
    expect(page.items[0].id).toBe(55)
    expect(page.totalItems).toBe(1)
    expect(page.isEmpty).toBe(false)
  })

  it("sends the filters the backend expects", async () => {
    await bankTransfersRepository.list({ provider: "bank_transfer", status: "PENDING", page: 1, size: 20 })

    expect(lastListUrl?.searchParams.get("provider")).toBe("bank_transfer")
    expect(lastListUrl?.searchParams.get("status")).toBe("PENDING")
    expect(lastListUrl?.searchParams.get("page")).toBe("1")
  })

  it("omits a filter that is not set instead of sending an empty one", async () => {
    // "Todos" has to mean no parameter: an empty string would be read upstream
    // as an unknown provider and answered with a 400.
    await bankTransfersRepository.list({})

    expect(lastListUrl?.searchParams.has("provider")).toBe(false)
    expect(lastListUrl?.searchParams.has("status")).toBe(false)
  })
})

describe("approve", () => {
  it("returns the resolved payment with its commission recorded", async () => {
    const payment = await bankTransfersRepository.approve(55)

    expect(payment.status).toBe("APPROVED")
    expect(payment.applicationFee).toBe(2500)
    expect(payment.netAmount).toBe(22500)
  })

  it("surfaces a 409 so the caller can refresh instead of retrying", async () => {
    // 409 means somebody else already resolved it — retrying would never work.
    server.use(
      http.post("*/api/backend/api/payments/bank-transfer/:id/approve", () =>
        HttpResponse.json(
          { message: "Este pago ya fue revisado por otra persona.", status: 409 },
          { status: 409 },
        ),
      ),
    )

    await expect(bankTransfersRepository.approve(55)).rejects.toBeInstanceOf(ApiError)
  })
})

describe("reject", () => {
  it("sends the reason in the body", async () => {
    const payment = await bankTransfersRepository.reject(55, "El importe no coincide con el del plan")

    expect(lastRejectBody).toEqual({ reason: "El importe no coincide con el del plan" })
    expect(payment.status).toBe("REJECTED")
    expect(payment.rejectionReason).toBe("El importe no coincide con el del plan")
  })
})

describe("getInfo", () => {
  it("maps the trainer's own bank details", async () => {
    const info = await bankTransfersRepository.getInfo()

    expect(info.cbu).toBe("0070599800004184413502")
    expect(info.alias).toBe("ana.entrena")
    expect(info.enabled).toBe(true)
  })
})

describe("pendingReviewCount", () => {
  it("reads the count the badge shows", async () => {
    expect(await bankTransfersRepository.pendingReviewCount()).toBe(3)
  })
})
