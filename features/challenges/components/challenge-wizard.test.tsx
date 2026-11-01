import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"

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

describe("ChallengeWizard · foto del premio", () => {
  const server = setupServer()
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" })
    // jsdom no implementa object URLs.
    URL.createObjectURL = vi.fn(() => "blob:premio")
    URL.revokeObjectURL = vi.fn()
  })
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  const saved = {
    id: 42,
    name: "Café directo",
    description: null,
    imageUrl: null,
    terms: null,
    status: "DRAFT",
    requirementMode: "ALL",
    requiredCount: null,
    startsAt: "2099-01-01T00:00:00Z",
    endsAt: "2099-01-31T23:59:59Z",
    publishedAt: null,
    reward: {
      name: "Café gratis",
      description: null,
      imageUrl: null,
      terms: null,
      expiresAt: "2099-03-01T23:59:59Z",
      stock: 20,
    },
    requirements: [],
    goalSignature: "",
    acceptedCount: 0,
    completedCount: 0,
    redeemedCount: 0,
    stockLeft: 20,
    repsCost: 0,
    editable: true,
  }

  /**
   * El endpoint de la foto necesita el id, y en un alta el id recién existe
   * después del POST. Lo que se fija es el orden: primero el desafío, después
   * la foto contra el id que devolvió.
   */
  it("en un alta, sube la foto después de crear el desafío y contra su id", async () => {
    const calls: string[] = []
    server.use(
      http.post("*/api/backend/api/brand/challenges", () => {
        calls.push("create")
        return HttpResponse.json(saved)
      }),
      // El cuerpo no se inspecciona: el `FormData` de jsdom no se serializa como
      // multipart, así que MSW no lo puede leer. Que llegue al id correcto y
      // después del alta es lo que importa acá.
      http.post("*/api/backend/api/brand/challenges/42/reward-image", () => {
        calls.push("reward-image")
        return HttpResponse.json(saved)
      }),
    )
    const onOpenChange = vi.fn()
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <ChallengeWizard open onOpenChange={onOpenChange} />
      </QueryClientProvider>,
    )

    fireEvent.change(screen.getByPlaceholderText("Constancia de acero"), { target: { value: "Café directo" } })
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }))

    fireEvent.change(await screen.findByPlaceholderText("20% OFF en toda la tienda"), {
      target: { value: "Café gratis" },
    })
    const file = new File(["png"], "cafe.png", { type: "image/png" })
    fireEvent.change(screen.getByLabelText("Foto del premio"), { target: { files: [file] } })
    expect(await screen.findByText("Se sube cuando guardes el desafío.")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }))
    fireEvent.click(await screen.findByRole("button", { name: "Crear borrador" }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(calls).toEqual(["create", "reward-image"])
  })

  it("rechaza un archivo que no es imagen sin subir nada", async () => {
    renderWizard()

    fireEvent.change(screen.getByPlaceholderText("Constancia de acero"), { target: { value: "Café directo" } })
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }))

    const file = new File(["%PDF"], "menu.pdf", { type: "application/pdf" })
    fireEvent.change(await screen.findByLabelText("Foto del premio"), { target: { files: [file] } })

    expect(await screen.findByRole("alert")).toHaveTextContent(/ese formato no sirve/i)
  })
})
