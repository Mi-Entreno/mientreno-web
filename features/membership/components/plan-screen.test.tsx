import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import { PlanScreen } from "./plan-screen"

const price = (id: number, billingPeriod: "MONTHLY" | "YEARLY", amount: number) => ({
  id, billingPeriod, amount, currency: "ARS", trialDays: 14, label: null, active: true,
  validFrom: "2026-10-01T00:00:00Z", validTo: null,
})

const PLANS = [
  {
    id: 1, code: "TRAINER_FREE", name: "Gratis", description: null, audience: "TRAINER", tierRank: 0,
    defaultPlan: true, highlightLabel: null, current: true, active: true, visible: true, prices: [],
    benefits: [{ featureCode: "TRAINER_MARKETPLACE_FEE_PERCENT", name: "Comisión por cobro", description: null,
      type: "CONFIG", unit: "%", enabled: true, limit: 10, fromPlan: false }],
  },
  {
    id: 2, code: "TRAINER_PRO", name: "Pro", description: "Más alumnos, menos comisión.", audience: "TRAINER",
    tierRank: 10, defaultPlan: false, highlightLabel: "Recomendado", current: false, active: true, visible: true,
    prices: [price(10, "MONTHLY", 14999), price(11, "YEARLY", 149990)],
    benefits: [{ featureCode: "TRAINER_MARKETPLACE_FEE_PERCENT", name: "Comisión por cobro", description: null,
      type: "CONFIG", unit: "%", enabled: true, limit: 5, fromPlan: true }],
  },
]

const ACTIVE_PRO: { [key: string]: unknown; membership: Record<string, unknown> } = {
  effectivePlanCode: "TRAINER_PRO", effectivePlanName: "Pro", trialEligible: false, billingEnabled: true,
  membership: {
    id: 9, planCode: "TRAINER_PRO", planName: "Pro", status: "ACTIVE", billingPeriod: "MONTHLY", amount: 14999,
    currency: "ARS", provider: "MERCADO_PAGO", currentPeriodEnd: "2099-11-03T12:00:00Z", trialEndsAt: null,
    graceUntil: null, cancelAtPeriodEnd: false, accessUntil: "2099-11-03T12:00:00Z",
    renewsAt: "2099-11-03T12:00:00Z", checkoutUrl: null,
  },
}

let cancelCalls = 0

const server = setupServer(
  http.get("*/api/backend/api/membership/plans", () => HttpResponse.json(PLANS)),
  http.get("*/api/backend/api/membership/me/payments", () => HttpResponse.json([])),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  cancelCalls = 0
})
afterAll(() => server.close())

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={client}>
      <PlanScreen />
    </QueryClientProvider>,
  )
}

describe("PlanScreen", () => {
  it("shows the plans with what each one gives, and offers the trial to a free trainer", async () => {
    server.use(
      http.get("*/api/backend/api/membership/me", () =>
        HttpResponse.json({ effectivePlanCode: "TRAINER_FREE", effectivePlanName: "Gratis", membership: null,
          trialEligible: true, billingEnabled: true }),
      ),
    )
    renderScreen()

    expect(await screen.findByRole("heading", { name: "Pro" })).toBeInTheDocument()
    expect(screen.getByText("— 10 %")).toBeInTheDocument()
    expect(screen.getByText("— 5 %")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Probar 14 días gratis" })).toBeEnabled()
  })

  it("shows the plans but not a working pay button while billing is off", async () => {
    server.use(
      http.get("*/api/backend/api/membership/me", () =>
        HttpResponse.json({ effectivePlanCode: "TRAINER_FREE", effectivePlanName: "Gratis", membership: null,
          trialEligible: true, billingEnabled: false }),
      ),
    )
    renderScreen()

    expect(await screen.findByRole("button", { name: "Probar 14 días gratis" })).toBeDisabled()
    expect(screen.getByText("Muy pronto vas a poder suscribirte desde acá.")).toBeInTheDocument()
  })

  it("cancels with one confirmation, as easily as subscribing", async () => {
    // Stateful like the backend: after the cancel, /me reports it.
    let current = ACTIVE_PRO
    server.use(
      http.get("*/api/backend/api/membership/me", () => HttpResponse.json(current)),
      http.post("*/api/backend/api/membership/me/cancel", () => {
        cancelCalls++
        current = { ...ACTIVE_PRO, membership: { ...ACTIVE_PRO.membership, cancelAtPeriodEnd: true, renewsAt: null } }
        return HttpResponse.json(current)
      }),
    )
    renderScreen()

    fireEvent.click(await screen.findByRole("button", { name: "Dar de baja" }))
    const confirm = await screen.findAllByRole("button", { name: "Dar de baja" })
    fireEvent.click(confirm[confirm.length - 1])

    await waitFor(() => expect(cancelCalls).toBe(1))
    expect(await screen.findByRole("button", { name: "Reactivar la renovación" })).toBeInTheDocument()
  })
})
