import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import { ChallengesOverview } from "./challenges-overview"

/**
 * La home del comercio.
 *
 * Era cuatro números y una ayuda: todo lo que decía era correcto y nada se podía
 * hacer desde ahí. Lo que fijan estas pruebas es lo contrario — que el trabajo
 * pendiente se vea y se pueda resolver en la propia pantalla, y que la ayuda
 * ocupe lugar sólo mientras no haya datos reales que contar.
 */

function page(content: unknown[]) {
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

const reward = {
  name: "Café gratis",
  description: null,
  imageUrl: null,
  terms: null,
  expiresAt: "2099-10-30T23:59:59Z",
  stock: 20,
}

function challenge(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Constancia de acero",
    description: null,
    imageUrl: null,
    terms: null,
    status: "PUBLISHED",
    requirementMode: "ALL",
    requiredCount: null,
    startsAt: "2020-09-01T00:00:00Z",
    endsAt: "2099-09-30T23:59:59Z",
    publishedAt: "2020-09-01T00:00:00Z",
    reward,
    requirements: [
      {
        id: 1,
        metric: "WORKOUTS_COMPLETED",
        label: "Entrenamientos completados",
        unit: "entrenamientos",
        metricFamily: "FREQUENCY",
        targetValue: 5,
        goalKey: "WORKOUTS_COMPLETED:5",
        sortOrder: 0,
      },
    ],
    goalSignature: "ALL|WORKOUTS_COMPLETED:5",
    acceptedCount: 3,
    completedCount: 1,
    redeemedCount: 0,
    stockLeft: 17,
    editable: false,
    ...overrides,
  }
}

const redemption = {
  id: 55,
  challengeId: 1,
  name: "Constancia de acero",
  status: "REDEEMED",
  acceptedAt: "2026-09-02T10:00:00Z",
  completedAt: "2026-09-10T10:00:00Z",
  redeemedAt: "2026-09-11T10:00:00Z",
  deliveredAt: null,
  redemptionCode: "K7M2P4QX",
  brandName: "Café del centro",
  reward,
}

const profile = {
  id: 1,
  displayName: "Café del centro",
  legalName: null,
  taxId: null,
  logoUrl: null,
  description: null,
  contactEmail: null,
  contactPhone: null,
  pickupAddress: "Av. Siempre Viva 742",
  pickupNotes: null,
  instagram: null,
  websiteUrl: null,
  status: "ACTIVE",
}

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function givenBackend({
  challenges,
  redemptions,
}: {
  challenges: unknown[]
  redemptions: unknown[]
}) {
  server.use(
    http.get("*/api/backend/api/brand/challenges", () => HttpResponse.json(page(challenges))),
    http.get("*/api/backend/api/brand/challenges/redemptions", () =>
      HttpResponse.json(page(redemptions)),
    ),
    http.get("*/api/backend/api/brands/me", () => HttpResponse.json(profile)),
  )
}

function renderOverview() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={client}>
      <ChallengesOverview />
    </QueryClientProvider>,
  )
}

describe("ChallengesOverview", () => {
  it("deja entregar un canje sin salir de la home", async () => {
    givenBackend({ challenges: [challenge()], redemptions: [redemption] })
    renderOverview()

    expect(await screen.findByText("K7M2P4QX")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /entregar/i })).toBeInTheDocument()
  })

  it("lista los desafíos frenados con el motivo, no sólo el estado", async () => {
    givenBackend({
      challenges: [challenge({ id: 2, name: "Sin publicar", status: "DRAFT" })],
      redemptions: [],
    })
    renderOverview()

    expect(await screen.findByText(/sin publicar: los alumnos/i)).toBeInTheDocument()
  })

  it("abre los alumnos anotados desde cada desafío", async () => {
    givenBackend({ challenges: [challenge()], redemptions: [] })
    renderOverview()

    expect(await screen.findAllByRole("button", { name: /ver alumnos/i })).not.toHaveLength(0)
  })

  it("explica cómo funciona sólo mientras no hay desafíos", async () => {
    givenBackend({ challenges: [], redemptions: [] })
    const { unmount } = renderOverview()

    expect(await screen.findByText(/cómo funciona/i)).toBeInTheDocument()
    unmount()

    givenBackend({ challenges: [challenge()], redemptions: [] })
    renderOverview()

    await screen.findByText("Constancia de acero")
    await waitFor(() => expect(screen.queryByText(/cómo funciona/i)).not.toBeInTheDocument())
  })
})
