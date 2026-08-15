import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"

import type {
  AcceptInvitationResponseDTO,
  PlanInvitationResponseDTO,
} from "../dto/plan-invitation.dto"
import { InvitationResponseScreen } from "./invitation-response-screen"

/**
 * The student's side of the flow, and the screen where "aceptó" is easiest to
 * confuse with "es alumno".
 *
 * These tests drive the real hooks through MSW because the thing worth
 * protecting is not the copy but where it comes from: the headline has to
 * follow the `subscriptionStatus` the backend returned, so a paid plan that is
 * still awaiting payment can never announce a new student.
 */

const PLAN = {
  id: 3,
  name: "Plan Premium",
  description: "Seguimiento semanal",
  price: 25000,
  billingPeriod: "MONTHLY" as const,
  maxStudents: null,
  includesNutrition: true,
}

const PENDING: PlanInvitationResponseDTO = {
  id: 9,
  status: "PENDING",
  message: null,
  rejectionReason: null,
  student: { id: 42, fullName: "María López", email: "m***@gmail.com", profileImageUrl: null },
  trainer: { id: 7, fullName: "Alex Ruiz", profileImageUrl: null },
  plan: PLAN,
  createdAt: "2026-08-07T09:00:00Z",
  expiresAt: "2026-08-14T09:00:00Z",
  respondedAt: null,
  subscriptionId: null,
  subscriptionStatus: null,
  checkoutUrl: null,
}

let invitation: PlanInvitationResponseDTO = PENDING
let acceptResponse: AcceptInvitationResponseDTO = {
  invitationId: 9,
  subscriptionId: 55,
  subscriptionStatus: "PENDING_PAYMENT",
  checkoutUrl: "https://mp/checkout",
}

const server = setupServer(
  http.get("*/api/public/api/plan-invitations/token/tok-1", () => HttpResponse.json(invitation)),
  http.post("*/api/public/api/plan-invitations/token/tok-1/accept", () =>
    HttpResponse.json(acceptResponse),
  ),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

beforeEach(() => {
  invitation = PENDING
  acceptResponse = {
    invitationId: 9,
    subscriptionId: 55,
    subscriptionStatus: "PENDING_PAYMENT",
    checkoutUrl: "https://mp/checkout",
  }
})

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={client}>
      <InvitationResponseScreen token="tok-1" />
    </QueryClientProvider>,
  )
}

describe("InvitationResponseScreen", () => {
  it("does not announce a new student when the plan is still unpaid", async () => {
    renderScreen()

    fireEvent.click(await screen.findByRole("button", { name: /Aceptar plan/ }))

    expect(await screen.findByText("Has aceptado la propuesta")).toBeInTheDocument()
    expect(screen.queryByText(/Ya eres alumno/)).not.toBeInTheDocument()
  })

  it("sends the student to the checkout they still owe", async () => {
    renderScreen()

    fireEvent.click(await screen.findByRole("button", { name: /Aceptar plan/ }))

    const pay = await screen.findByRole("link", { name: /Pagar con Mercado Pago/ })
    expect(pay).toHaveAttribute("href", "https://mp/checkout")
  })

  it("says the trainer cannot charge yet when there is no checkout to send them to", async () => {
    // §5.6: a paid plan whose trainer never linked Mercado Pago. Nothing to pay,
    // so nothing that could make them a student.
    acceptResponse = { ...acceptResponse, checkoutUrl: null }
    renderScreen()

    fireEvent.click(await screen.findByRole("button", { name: /Aceptar plan/ }))

    expect(await screen.findByText(/todavía no puede recibir pagos/)).toBeInTheDocument()
    expect(screen.queryByText(/Ya eres alumno/)).not.toBeInTheDocument()
  })

  it("announces the new student only when the subscription came back active", async () => {
    // A free plan: nothing to charge, so acceptance really does enrol them.
    acceptResponse = { ...acceptResponse, subscriptionStatus: "ACTIVE", checkoutUrl: null }
    renderScreen()

    fireEvent.click(await screen.findByRole("button", { name: /Aceptar plan/ }))

    expect(await screen.findByText("¡Ya eres alumno de Alex Ruiz!")).toBeInTheDocument()
  })

  it("keeps the unpaid state on a reload, with the payment still reachable", async () => {
    // Returning from Mercado Pago, or just refreshing. The link stays alive
    // while the subscription is unpaid precisely so this lands somewhere true.
    invitation = {
      ...PENDING,
      status: "ACCEPTED",
      subscriptionId: 55,
      subscriptionStatus: "PENDING_PAYMENT",
      checkoutUrl: "https://mp/checkout",
      respondedAt: "2026-08-07T10:00:00Z",
    }
    renderScreen()

    expect(await screen.findByText("Has aceptado la propuesta")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Pagar con Mercado Pago/ })).toHaveAttribute(
      "href",
      "https://mp/checkout",
    )
  })

  it("reflects the paid subscription after the webhook has landed", async () => {
    invitation = {
      ...PENDING,
      status: "ACCEPTED",
      subscriptionId: 55,
      subscriptionStatus: "ACTIVE",
      checkoutUrl: null,
      respondedAt: "2026-08-07T10:00:00Z",
    }
    renderScreen()

    await waitFor(() =>
      expect(screen.getByText("¡Ya eres alumno de Alex Ruiz!")).toBeInTheDocument(),
    )
    expect(screen.queryByRole("link", { name: /Pagar con Mercado Pago/ })).not.toBeInTheDocument()
  })
})
