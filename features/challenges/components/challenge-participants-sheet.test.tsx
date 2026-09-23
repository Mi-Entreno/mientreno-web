import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import type { BrandChallenge } from "../model/challenge.model"
import { ChallengeParticipantsSheet } from "./challenge-participants-sheet"

/**
 * Quiénes están anotados en un desafío.
 *
 * Lo que fijan estas pruebas es el contrato de la ficha, no su markup: que no
 * pida nada mientras está cerrada —el panel lista desafíos, y pedir los
 * participantes de todos al pintar la lista sería una consulta por fila—, y que
 * los totales del encabezado salgan del desafío y no de las filas cargadas, que
 * son sólo la primera página.
 */

const challenge: BrandChallenge = {
  id: 7,
  name: "Constancia de acero",
  description: null,
  imageUrl: null,
  terms: null,
  status: "PUBLISHED",
  requirementMode: "ALL",
  requiredCount: null,
  startsAt: "2026-09-01T00:00:00Z",
  endsAt: "2026-09-30T23:59:59Z",
  reward: {
    name: "Café gratis",
    description: null,
    imageUrl: null,
    terms: null,
    expiresAt: "2026-10-30T23:59:59Z",
    stock: 20,
  },
  requirements: [],
  goalSignature: "ALL|WORKOUTS_COMPLETED:5",
  acceptedCount: 42,
  completedCount: 9,
  redeemedCount: 4,
  stockLeft: 0,
  repsCost: 0,
  editable: false,
}

function page(content: unknown[], { last = true } = {}) {
  return {
    content,
    number: 0,
    size: 20,
    totalElements: content.length,
    totalPages: last ? 1 : 2,
    first: true,
    last,
    numberOfElements: content.length,
    empty: content.length === 0,
  }
}

let requests = 0

const server = setupServer(
  http.get("*/api/backend/api/brand/challenges/7/participants", () => {
    requests += 1
    return HttpResponse.json(
      page([
        {
          id: 1,
          studentFirstName: "Ana",
          status: "REDEEMED",
          acceptedAt: "2026-09-02T10:00:00Z",
          completedAt: "2026-09-10T10:00:00Z",
          redeemedAt: "2026-09-11T10:00:00Z",
          deliveredAt: null,
          redemptionCode: "K7M2P4QX",
        },
        {
          id: 2,
          studentFirstName: null,
          status: "ACCEPTED",
          acceptedAt: "2026-09-03T10:00:00Z",
          completedAt: null,
          redeemedAt: null,
          deliveredAt: null,
          redemptionCode: null,
        },
      ]),
    )
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterEach(() => {
  server.resetHandlers()
  requests = 0
})
afterAll(() => server.close())

function renderSheet(open: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={client}>
      <ChallengeParticipantsSheet challenge={challenge} open={open} onOpenChange={() => {}} />
    </QueryClientProvider>,
  )
}

describe("ChallengeParticipantsSheet", () => {
  it("no pide los participantes hasta que se abre", async () => {
    renderSheet(false)

    // Nada que esperar: si la consulta saliera, saldría en el primer render.
    await waitFor(() => expect(requests).toBe(0))
  })

  it("lista a los alumnos con el estado en el que está cada uno", async () => {
    renderSheet(true)

    expect(await screen.findByText("Ana")).toBeInTheDocument()
    expect(screen.getByText("Para entregar")).toBeInTheDocument()
    expect(screen.getByText("En curso")).toBeInTheDocument()

    // El código sólo aparece mientras haya algo que entregar contra él.
    expect(screen.getByText("K7M2P4QX")).toBeInTheDocument()

    // Sin nombre no se inventa uno.
    expect(screen.getByText("Alumno sin nombre")).toBeInTheDocument()
  })

  it("muestra la última cosa que pasó, no la primera", async () => {
    renderSheet(true)

    expect(await screen.findByText(/canjeó el/i)).toBeInTheDocument()
    expect(screen.getByText(/aceptó el/i)).toBeInTheDocument()
  })

  it("los totales del encabezado salen del desafío, no de las filas cargadas", async () => {
    renderSheet(true)

    // Dos filas en pantalla, 42 aceptaron: contar lo cargado mentiría.
    expect(await screen.findByText("42")).toBeInTheDocument()
    expect(screen.getByText("9")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
  })
})
