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
