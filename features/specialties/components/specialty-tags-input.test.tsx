import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { SpecialtyTagsInput } from "./specialty-tags-input"

/**
 * The field used to be a picker over a fixed catalogue, so a trainer whose
 * speciality was not one of the seeded rows had no way to say so. What these
 * tests protect is that the catalogue is now only a suggestion — anything
 * typed is accepted — while the list still refuses what the backend would
 * silently merge into one row.
 */

const server = setupServer(
  http.get("*/api/backend/api/specialties", () =>
    HttpResponse.json([
      { id: 1, name: "Fuerza e Hipertrofia", slug: "fuerza-e-hipertrofia" },
      { id: 2, name: "CrossFit", slug: "crossfit" },
    ]),
  ),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderInput(value: string[] = []) {
  const onChange = vi.fn()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={client}>
      <SpecialtyTagsInput value={value} onChange={onChange} />
    </QueryClientProvider>,
  )

  return { onChange, field: screen.getByLabelText("Añadir especialidad") }
}

function type(field: HTMLElement, text: string) {
  fireEvent.change(field, { target: { value: text } })
}

describe("SpecialtyTagsInput", () => {
  it("accepts a specialty that exists in no list", () => {
    const { onChange, field } = renderInput()

    type(field, "Rehabilitación deportiva")
    fireEvent.keyDown(field, { key: "Enter" })

    expect(onChange).toHaveBeenCalledWith(["Rehabilitación deportiva"])
  })

  it("keeps adding on top of what is already there", () => {
    const { onChange, field } = renderInput(["Musculación"])

    type(field, "Running")
    fireEvent.keyDown(field, { key: "Enter" })

    expect(onChange).toHaveBeenCalledWith(["Musculación", "Running"])
  })

  it("adds on a comma, so a pasted list can be split as you go", () => {
    const { onChange, field } = renderInput()

    type(field, "Preparación física")
    fireEvent.keyDown(field, { key: "," })

    expect(onChange).toHaveBeenCalledWith(["Preparación física"])
  })

  it("refuses one the backend would merge into an existing row", () => {
    const { onChange, field } = renderInput(["CrossFit"])

    type(field, "  crossfit ")
    fireEvent.keyDown(field, { key: "Enter" })

    expect(onChange).not.toHaveBeenCalled()
  })

  it("refuses a blank", () => {
    const { onChange, field } = renderInput()

    type(field, "   ")
    fireEvent.keyDown(field, { key: "Enter" })

    expect(onChange).not.toHaveBeenCalled()
  })

  it("removes a chip", () => {
    const { onChange } = renderInput(["Musculación", "Running"])

    fireEvent.click(screen.getByLabelText("Quitar Musculación"))

    expect(onChange).toHaveBeenCalledWith(["Running"])
  })

  it("stops accepting once the cap is reached", () => {
    const onChange = vi.fn()
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const full = ["a", "b", "c"]

    render(
      <QueryClientProvider client={client}>
        <SpecialtyTagsInput value={full} onChange={onChange} max={3} />
      </QueryClientProvider>,
    )

    expect(screen.getByLabelText("Añadir especialidad")).toBeDisabled()
    expect(screen.getByText("Has alcanzado el máximo de 3 especialidades.")).toBeInTheDocument()
  })

  it("offers the catalogue as suggestions without requiring them", async () => {
    const { onChange } = renderInput()

    const suggestion = await screen.findByRole("button", { name: "CrossFit" })
    fireEvent.click(suggestion)

    expect(onChange).toHaveBeenCalledWith(["CrossFit"])
  })
})
