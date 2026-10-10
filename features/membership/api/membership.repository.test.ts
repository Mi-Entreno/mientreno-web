import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import { ApiError } from "@/core/http/errors"
import { membershipRepository } from "./membership.repository"

let checkoutRequest: { key: string | null; body: unknown } | null = null

const server = setupServer(
  http.post("*/api/backend/api/membership/checkout", async ({ request }) => {
    checkoutRequest = { key: request.headers.get("Idempotency-Key"), body: await request.json() }
    return HttpResponse.json({
      membershipId: 7,
      status: "PENDING",
      checkoutUrl: "https://mp.test/checkout/pre-7",
      trialIncluded: true,
    })
  }),
  http.post("*/api/backend/api/membership/me/cancel", () =>
    HttpResponse.json(
      {
        message: "Alcanzaste el límite de tu plan para alumnos activos (10 alumnos).",
        status: 402,
        code: "PREMIUM_REQUIRED",
        feature: "TRAINER_MAX_ACTIVE_STUDENTS",
        limit: 10,
        current: 10,
        upgradePlanCode: "TRAINER_PRO",
      },
      { status: 402 },
    ),
  ),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  checkoutRequest = null
})
afterAll(() => server.close())

describe("membershipRepository", () => {
  it("sends only the price, with the idempotency key as a header", async () => {
    const checkout = await membershipRepository.checkout(42, "key-1")

    expect(checkoutRequest).toEqual({ key: "key-1", body: { priceId: 42 } })
    expect(checkout.checkoutUrl).toBe("https://mp.test/checkout/pre-7")
  })

  it("surfaces a 402 as the paywall, with its details", async () => {
    // Any endpoint can answer 402; cancel is just a convenient one to stub here.
    const error = await membershipRepository.cancel().catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).premium?.upgradePlanCode).toBe("TRAINER_PRO")
  })
})
