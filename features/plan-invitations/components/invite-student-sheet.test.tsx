import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { InviteStudentSheet } from "./invite-student-sheet"

/**
 * The wizard end to end: search a student, pick a plan, send.
 *
 * Driven through the real hooks and MSW rather than mocks, because the parts
 * worth protecting are the wiring — that a selection advances the step, and
 * that what finally reaches the network is the pair of ids the trainer chose.
 */

let lastBody: unknown = null

const server = setupServer(
  http.get("*/api/backend/api/users/students/search", () =>
    HttpResponse.json({
      content: [
        {
          id: 42,
          fullName: "María López",
          email: "m***@gmail.com",
          profileImageUrl: null,
          location: "Rosario",
          alreadyMyStudent: false,
          pendingInvitationId: null,
        },
        {
          id: 43,
          fullName: "Marío Gómez",
          email: null,
          profileImageUrl: null,
          location: null,
          alreadyMyStudent: true,
          pendingInvitationId: null,
        },
      ],
      number: 0,
      size: 20,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
      numberOfElements: 2,
      empty: false,
    }),
  ),

  http.get("*/api/backend/api/plans/my", () =>
    HttpResponse.json([
      {
        id: 3,
        name: "Plan Premium",
        description: "Seguimiento semanal",
        price: 25000,
        billingPeriod: "MONTHLY",
        maxStudents: null,
        includesNutrition: true,
      },
    ]),
  ),

  http.get("*/api/backend/api/payments/mercadopago/connection", () =>
    HttpResponse.json({
      status: "CONNECTED",
      mercadoPagoUserId: "1",
      nickname: "ALEXRUIZ",
      email: null,
      connectedAt: null,
      expiresAt: null,
      liveMode: true,
      scopes: [],
      applicationFeePercent: 10,
    }),
  ),

  http.post("*/api/backend/api/plan-invitations", async ({ request }) => {
    lastBody = await request.json()

    return HttpResponse.json(
      {
        id: 9,
        status: "PENDING",
        message: "Nos vemos el lunes",
        rejectionReason: null,
        student: { id: 42, fullName: "María López", email: null, profileImageUrl: null },
        trainer: { id: 7, fullName: "Alex Ruiz", profileImageUrl: null },
        plan: {
          id: 3,
          name: "Plan Premium",
          description: null,
          price: 25000,
          billingPeriod: "MONTHLY",
          maxStudents: null,
          includesNutrition: true,
        },
        createdAt: "2026-08-07T09:00:00Z",
        expiresAt: "2026-08-14T09:00:00Z",
        respondedAt: null,
        subscriptionId: null,
      },
      { status: 201 },
    )
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  lastBody = null
})
afterAll(() => server.close())

const onOpenChange = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

function renderSheet() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={client}>
      <InviteStudentSheet open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  )
}

function search(term: string) {
  fireEvent.change(screen.getByLabelText("Buscar alumno"), { target: { value: term } })
}

describe("InviteStudentSheet", () => {
  it("walks student -> plan -> send and posts the chosen ids", async () => {
    renderSheet()

    search("mar")

    // The search is debounced by 300 ms, so the results are awaited.
    fireEvent.click(await screen.findByRole("option", { name: /María López/ }))

    fireEvent.click(await screen.findByRole("option", { name: /Plan Premium/ }))

    fireEvent.change(await screen.findByLabelText(/Mensaje para el alumno/), {
      target: { value: "Nos vemos el lunes" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Enviar invitación/ }))

    await waitFor(() => {
      expect(lastBody).toEqual({ studentId: 42, planId: 3, message: "Nos vemos el lunes" })
    })

    // A sent invitation closes the wizard.
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("does not offer a student who is already ours", async () => {
    renderSheet()

    search("mar")

    const blocked = await screen.findByRole("option", { name: /Marío Gómez/ })

    // Disabled *and* labelled: a filtered-out row is indistinguishable from
    // "not registered", and the trainer would keep searching.
    expect(blocked).toBeDisabled()
    expect(blocked).toHaveTextContent("Ya es alumno tuyo")
  })

  it("cannot advance past the first step without a student", () => {
    renderSheet()

    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled()
  })

  it("does not search a one-character term", async () => {
    renderSheet()

    search("m")

    // Listing every student on the platform is a privacy boundary, not just a
    // performance one — the hint stays put instead.
    await waitFor(() =>
      expect(screen.getByText(/Busca por nombre o correo para empezar/)).toBeInTheDocument(),
    )
    expect(screen.queryByRole("option")).toBeNull()
  })
})
