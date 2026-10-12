import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import type { EconomyConfig } from "../model/economy-admin.model"
import { AdminEconomyScreen } from "./admin-economy-screen"

/**
 * The economy editor's contract: nothing is sent until the admin confirms, the
 * confirmation reads back what changes, and what reaches the backend is the
 * whole config with the edit applied — the backend validates it strictly, so a
 * partial body would be a 400.
 */

const seed: EconomyConfig = {"version": 1, "challenges": {"maxPerMonth": 1}, "earning": {"dailyCapReps": 60, "rules": [{"id": "entrenamiento", "type": "PER_WORKOUT", "enabled": true, "reps": 10, "monthlyCapReps": 160, "label": "Por entrenar", "params": null}, {"id": "constancia-semanal", "type": "WEEKLY_WORKOUTS", "enabled": true, "reps": 20, "monthlyCapReps": 80, "label": "3 entrenamientos en la semana", "params": {"targetWorkouts": 3}}, {"id": "volumen-semanal", "type": "WEEKLY_VOLUME", "enabled": true, "reps": 20, "monthlyCapReps": 80, "label": "10.000 kg en la semana", "params": {"targetKg": 10000}}, {"id": "constancia-mensual", "type": "MONTHLY_WORKOUTS", "enabled": true, "reps": 75, "monthlyCapReps": 75, "label": "12 entrenamientos en el mes", "params": {"targetWorkouts": 12}}, {"id": "registro-comida", "type": "NUTRITION_LOG", "enabled": true, "reps": 2, "monthlyCapReps": 40, "label": "Registraste tu comida", "params": null}, {"id": "marca-personal", "type": "PERSONAL_RECORD", "enabled": true, "reps": 15, "monthlyCapReps": 30, "label": "Nueva marca personal", "params": null}, {"id": "check-in", "type": "CHECK_IN", "enabled": true, "reps": 2, "monthlyCapReps": 20, "label": "Check-in del día", "params": null}, {"id": "racha-7", "type": "STREAK_DAYS", "enabled": false, "reps": 40, "label": "7 días seguidos entrenando", "params": {"days": 7}, "monthlyCapReps": null}, {"id": "bienvenida", "type": "WELCOME_BONUS", "enabled": true, "reps": 50, "label": "Bienvenida", "params": null, "monthlyCapReps": null}]}, "wheel": {"monthlySpin": true, "spinEveryTrainingDays": 10, "dailySpin": false, "prizes": [{"id": "p0", "label": "Esta vez no", "reps": 0, "weight": 30, "enabled": true}, {"id": "p2", "label": "2 repes", "reps": 2, "weight": 35, "enabled": true}, {"id": "p5", "label": "5 repes", "reps": 5, "weight": 20, "enabled": true}, {"id": "p10", "label": "10 repes", "reps": 10, "weight": 10, "enabled": true}, {"id": "p20", "label": "20 repes", "reps": 20, "weight": 5, "enabled": true}]}, "analytics": {"occasionalMaxReps": 200, "activeMinReps": 450}}

let saved: { config: EconomyConfig; note?: string } | null = null

const server = setupServer(
  http.get("*/api/backend/api/admin/economy", () => HttpResponse.json(seed)),
  http.put("*/api/backend/api/admin/economy", async ({ request }) => {
    saved = (await request.json()) as { config: EconomyConfig; note?: string }
    return HttpResponse.json(saved.config)
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterEach(() => {
  server.resetHandlers()
  saved = null
})
afterAll(() => server.close())

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AdminEconomyScreen />
    </QueryClientProvider>,
  )
}

describe("AdminEconomyScreen", () => {
  it("shows the rules and the monthly simulation", async () => {
    renderScreen()
    expect(await screen.findByDisplayValue("Por entrenar")).toBeInTheDocument()
    expect(screen.getByText("Simulación mensual")).toBeInTheDocument()
    expect(screen.queryByText("Tenés cambios sin guardar.")).not.toBeInTheDocument()
  })

  it("saves the whole config with the edit after confirming the diff", async () => {
    renderScreen()
    const reps = await screen.findByLabelText("Repes", { selector: "#rule-entrenamiento-reps" })
    fireEvent.change(reps, { target: { value: "12" } })

    expect(await screen.findByText("Tenés cambios sin guardar.")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Revisar y guardar" }))

    expect(await screen.findByText("Por entrenar · repes: 10 → 12")).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Motivo (queda en el historial)"), { target: { value: "Prueba" } })
    fireEvent.click(screen.getByRole("button", { name: "Guardar y aplicar" }))

    await waitFor(() => expect(saved).not.toBeNull())
    expect(saved!.note).toBe("Prueba")
    expect(saved!.config.earning.rules.find((r) => r.id === "entrenamiento")!.reps).toBe(12)
    expect(saved!.config.earning.rules).toHaveLength(seed.earning.rules.length)
    expect(saved!.config.wheel).toEqual(seed.wheel)
  })

  it("blocks saving an invalid economy and says why", async () => {
    renderScreen()
    const cap = await screen.findByLabelText("Tope mensual", { selector: "#rule-entrenamiento-cap" })
    fireEvent.change(cap, { target: { value: "5" } })

    expect(await screen.findByText(/tope mensual de "Por entrenar" es menor/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Revisar y guardar" })).toBeDisabled()
  })
})
