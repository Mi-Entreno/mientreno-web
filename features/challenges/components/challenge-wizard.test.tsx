import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { METRIC_OPTIONS } from "../model/challenge.model"
import { ChallengeWizard } from "./challenge-wizard"

/**
 * El paso "Desafío" del alta, y sobre todo su selector de métrica.
 *
 * El bug que estas pruebas fijan: los selectores se montaban con `<Select>` a
 * secas —que es el `Root` de Base UI, un proveedor de contexto— y sus
 * `<SelectItem>` como hijos directos, sin `SelectTrigger` ni `SelectContent`.
 * Sin popup que los portalice, las nueve opciones se pintaban en el flujo del
 * formulario, empujando cada fila de condición contra las etiquetas de arriba.
 * En pantalla parecía un problema de espaciado; era un componente a medio armar.
 *
 * Por eso la primera prueba cuenta cuántas opciones hay visibles con el popup
 * cerrado: cero. Es la única forma de que el error no vuelva disfrazado de
 * ajuste de CSS.
 */

function renderWizard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ChallengeWizard open onOpenChange={() => {}} />
    </QueryClientProvider>,
  )
}

describe("ChallengeWizard · condiciones", () => {
  it("el selector de métrica es un combobox, no una lista suelta en el formulario", () => {
    renderWizard()

    // La etiqueta de la métrica que trae el formulario vacío se ve una sola vez:
    // dentro del trigger. Si los items estuvieran en el flujo, aparecería dos.
    const label = METRIC_OPTIONS[0].label
    expect(screen.getAllByText(label)).toHaveLength(1)

    // Y ninguna de las otras ocho está en pantalla con el popup cerrado.
    for (const option of METRIC_OPTIONS.slice(1)) {
      expect(screen.queryByText(option.label)).not.toBeInTheDocument()
    }
  })

  it("abre el popup y ofrece las métricas", async () => {
    renderWizard()

    fireEvent.click(screen.getByRole("combobox", { name: "Qué medir" }))

    const listbox = await screen.findByRole("listbox")
    expect(within(listbox).getByText(METRIC_OPTIONS[1].label)).toBeInTheDocument()
  })

  it("no ofrece una familia que ya ocupa otra condición", async () => {
    renderWizard()

    // La segunda condición arranca en la primera familia libre, así que las
    // cuatro métricas de constancia —la familia de la primera fila— no tienen
    // que estar entre sus opciones: elegirlas sólo llevaría al error que el
    // esquema y el backend ya rechazan.
    fireEvent.click(screen.getByRole("button", { name: /agregar/i }))

    const triggers = screen.getAllByRole("combobox", { name: "Qué medir" })
    expect(triggers).toHaveLength(2)

    fireEvent.click(triggers[1])
    const listbox = await screen.findByRole("listbox")

    for (const option of METRIC_OPTIONS.filter((metric) => metric.family === "FREQUENCY")) {
      expect(within(listbox).queryByText(option.label)).not.toBeInTheDocument()
    }
    expect(within(listbox).getByText("Series realizadas")).toBeInTheDocument()
  })
})

describe("ChallengeWizard · costo en repes", () => {
  it("arranca en cero: un desafío es gratis mientras nadie diga lo contrario", () => {
    renderWizard()

    expect(screen.getByLabelText("Costo en repes")).toHaveValue(0)
  })

  /**
   * La regla que reemplazó al `.min(1)` de `requirements`. Sin condiciones y sin
   * costo, el premio se lo lleva el primero que toque el botón — y el mensaje
   * tiene que ofrecer las dos salidas, porque las dos son válidas.
   */
  it("sin condiciones y sin costo no deja avanzar", async () => {
    renderWizard()

    // El nombre se completa aunque el test no lo esté probando: los refines de
    // zod son una cadena sobre el objeto, así que si la validación base falla
    // —nombre vacío— ninguno llega a correr y el mensaje cruzado no aparece.
    fireEvent.change(screen.getByPlaceholderText("Constancia de acero"), {
      target: { value: "Café directo" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Quitar condición" }))
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }))

    expect(await screen.findByText(/ponele un costo en repes/i)).toBeInTheDocument()
  })

  it("sin condiciones pero con costo sí avanza: el alumno lo compra", async () => {
    renderWizard()

    fireEvent.change(screen.getByPlaceholderText("Constancia de acero"), {
      target: { value: "Café directo" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Quitar condición" }))
    fireEvent.change(screen.getByLabelText("Costo en repes"), { target: { value: "80" } })
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }))

    // El paso siguiente es el de la recompensa: si el refine hubiera bloqueado,
    // seguiríamos viendo el campo de costo.
    expect(await screen.findByText("Qué se lleva")).toBeInTheDocument()
    expect(screen.queryByLabelText("Costo en repes")).not.toBeInTheDocument()
  })

  it("se puede quitar la última condición", () => {
    renderWizard()

    // Antes el botón se deshabilitaba con una sola fila, porque cero condiciones
    // era imposible. Con precio dejó de serlo.
    expect(screen.getByRole("button", { name: "Quitar condición" })).toBeEnabled()
  })
})
