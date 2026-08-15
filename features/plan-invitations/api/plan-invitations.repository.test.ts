import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import type { PlanInvitationResponseDTO } from "../dto/plan-invitation.dto"
import { planInvitationsRepository } from "./plan-invitations.repository"

let lastUrl: URL | null = null
let lastBody: unknown = null

const PLAN = {
  id: 3,
  name: "Plan Premium",
  description: "Seguimiento semanal",
  price: 25000,
  billingPeriod: "MONTHLY" as const,
  maxStudents: null,
  includesNutrition: true,
}

const INVITATION: PlanInvitationResponseDTO = {
  id: 9,
  status: "PENDING",
  message: "  Te dejo el plan del que hablamos.  ",
  rejectionReason: null,
  student: {
    id: 42,
    fullName: "María López",
    email: "m***@gmail.com",
    profileImageUrl: "http://localhost:8080/api/files/avatars/42/photo.jpg",
  },
  trainer: { id: 7, fullName: "Alex Ruiz", profileImageUrl: null },
  plan: PLAN,
  createdAt: "2026-08-07T09:00:00Z",
  expiresAt: "2026-08-14T09:00:00Z",
  respondedAt: null,
  subscriptionId: null,
  subscriptionStatus: null,
  checkoutUrl: null,
}

function springPage<T>(content: T[]) {
  return {
    content,
    number: 0,
    size: 20,
    totalElements: content.length,
    totalPages: 1,
    first: true,
    last: true,
    numberOfElements: content.length,
    empty: content.length === 0,
  }
}

const server = setupServer(
  http.post("*/api/backend/api/plan-invitations", async ({ request }) => {
    lastBody = await request.json()
    return HttpResponse.json(INVITATION, { status: 201 })
  }),

  http.get("*/api/backend/api/plan-invitations/sent", ({ request }) => {
    lastUrl = new URL(request.url)
    return HttpResponse.json(springPage([INVITATION]))
  }),

  http.delete("*/api/backend/api/plan-invitations/:id", () => new HttpResponse(null, { status: 204 })),

  // The student's side never carries a session, so it must not go through the
  // authenticated proxy.
  http.get("*/api/public/api/plan-invitations/token/:token", ({ request }) => {
    lastUrl = new URL(request.url)
    return HttpResponse.json({ ...INVITATION, message: null })
  }),

  http.post("*/api/public/api/plan-invitations/token/:token/accept", ({ request }) => {
    lastUrl = new URL(request.url)
    return HttpResponse.json({
      invitationId: 9,
      subscriptionId: 55,
      subscriptionStatus: "PENDING_PAYMENT",
      checkoutUrl: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=abc",
    })
  }),

  http.post("*/api/public/api/plan-invitations/token/:token/reject", async ({ request }) => {
    lastBody = await request.json()
    return new HttpResponse(null, { status: 204 })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  lastUrl = null
  lastBody = null
})
afterAll(() => server.close())

describe("planInvitationsRepository.create", () => {
  it("sends the ids and trims the note", async () => {
    await planInvitationsRepository.create({ studentId: 42, planId: 3, message: "  Hola  " })

    expect(lastBody).toEqual({ studentId: 42, planId: 3, message: "Hola" })
  })

  it("sends null rather than an empty message", async () => {
    // `@Size` validation aside, an empty string would render as an empty quote
    // block on the student's screen.
    await planInvitationsRepository.create({ studentId: 42, planId: 3, message: "   " })

    expect(lastBody).toMatchObject({ message: null })
  })

  it("maps the response into a domain invitation", async () => {
    const invitation = await planInvitationsRepository.create({
      studentId: 42,
      planId: 3,
      message: "",
    })

    expect(invitation.student.name).toBe("María López")
    expect(invitation.plan.price).toBe(25000)
    // Routed through the authenticated media proxy, or the avatar would 401.
    expect(invitation.student.avatarUrl).toBe("/api/media/avatars/42/photo.jpg")
  })
})

describe("planInvitationsRepository.listSent", () => {
  it("passes the status filter through", async () => {
    await planInvitationsRepository.listSent("PENDING", 0)

    expect(lastUrl?.searchParams.get("status")).toBe("PENDING")
    expect(lastUrl?.searchParams.get("page")).toBe("0")
    expect(lastUrl?.searchParams.get("size")).toBe("20")
  })

  it("omits the filter entirely for the 'all' tab", async () => {
    // Sending `status=` would be an empty-string filter upstream, not "any".
    await planInvitationsRepository.listSent(null, 0)

    expect(lastUrl?.searchParams.has("status")).toBe(false)
  })
})

describe("planInvitationsRepository.cancel", () => {
  it("handles the 204 without a body", async () => {
    await expect(planInvitationsRepository.cancel(9)).resolves.toBeUndefined()
  })
})

describe("the student's side, by token", () => {
  it("reads the invitation through the unauthenticated proxy", async () => {
    const invitation = await planInvitationsRepository.getByToken("abc123def456ghi789")

    expect(lastUrl?.pathname).toBe("/api/public/api/plan-invitations/token/abc123def456ghi789")
    expect(invitation.trainer.name).toBe("Alex Ruiz")
    expect(invitation.message).toBe("")
  })

  it("returns the checkout URL after accepting", async () => {
    const accepted = await planInvitationsRepository.acceptByToken("abc123def456ghi789")

    expect(accepted.subscriptionId).toBe(55)
    expect(accepted.subscriptionStatus).toBe("PENDING_PAYMENT")
    expect(accepted.checkoutUrl).toContain("mercadopago")
  })

  it("sends null when the student declines without a reason", async () => {
    await planInvitationsRepository.rejectByToken("abc123def456ghi789", "   ")

    expect(lastBody).toEqual({ reason: null })
  })

  it("escapes the token so it cannot break out of the path", async () => {
    await planInvitationsRepository.getByToken("abc/../../secret")

    expect(lastUrl?.pathname).toContain("abc%2F..%2F..%2Fsecret")
  })
})
