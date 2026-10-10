import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import { PremiumGate } from "./premium-gate"

function entitlements(enabled: boolean) {
  return {
    planCode: "TRAINER_FREE",
    planName: "Gratis",
    audience: "TRAINER",
    defaultPlan: true,
    membershipStatus: null,
    features: [
      {
        code: "TRAINER_PLAN_TEMPLATES",
        name: "Plantillas de planes",
        description: "Guardá planes como plantilla y reutilizalos con otros alumnos.",
        type: "BOOLEAN",
        unit: null,
        enabled,
        limit: null,
        used: null,
        upgradePlanCode: null,
      },
    ],
  }
}

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderGate() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={client}>
      <PremiumGate feature="TRAINER_PLAN_TEMPLATES">
        <p>Mis plantillas</p>
      </PremiumGate>
    </QueryClientProvider>,
  )
}

describe("PremiumGate", () => {
  it("shows the feature when the plan includes it", async () => {
    server.use(http.get("*/api/backend/api/entitlements/me", () => HttpResponse.json(entitlements(true))))
    renderGate()

    expect(await screen.findByText("Mis plantillas")).toBeInTheDocument()
  })

  it("explains the benefit instead of a bare lock when it does not", async () => {
    server.use(http.get("*/api/backend/api/entitlements/me", () => HttpResponse.json(entitlements(false))))
    renderGate()

    expect(await screen.findByText("Plantillas de planes es parte de Pro")).toBeInTheDocument()
    expect(screen.getByText("Guardá planes como plantilla y reutilizalos con otros alumnos.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Ver Pro" })).toHaveAttribute("href", "/dashboard/plan")
    expect(screen.queryByText("Mis plantillas")).not.toBeInTheDocument()
  })

  it("does not flash the paywall while it does not know yet, nor when the endpoint fails", async () => {
    server.use(http.get("*/api/backend/api/entitlements/me", () => HttpResponse.json({}, { status: 500 })))
    renderGate()

    expect(screen.getByText("Mis plantillas")).toBeInTheDocument()
    expect(await screen.findByText("Mis plantillas")).toBeInTheDocument()
    expect(screen.queryByText(/es parte de Pro/)).not.toBeInTheDocument()
  })
})
