import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import { foodsRepository } from "./foods.repository"

let lastUrl: URL | null = null

const server = setupServer(
  http.get("*/api/backend/api/foods", ({ request }) => {
    lastUrl = new URL(request.url)

    return HttpResponse.json({
      content: [
        {
          id: 7,
          name: "Pechuga de pollo",
          brand: "Hacendado",
          category: "Carnes",
          servingDescription: "1 filete (120 g)",
          caloriesPer100g: 165,
          proteinPer100g: 31,
          carbsPer100g: 0,
          fatPer100g: 3.6,
          fiberPer100g: null,
        },
      ],
      number: 0,
      size: 24,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      numberOfElements: 1,
      empty: false,
    })
  }),

  http.get("*/api/backend/api/foods/:id", ({ params }) =>
    HttpResponse.json({
      id: Number(params.id),
      name: "Pechuga de pollo",
      brand: null,
      category: "Carnes",
      servingDescription: null,
      caloriesPer100g: 165,
      proteinPer100g: 31,
      carbsPer100g: 0,
      fatPer100g: 3.6,
      fiberPer100g: null,
    }),
  ),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  lastUrl = null
})
afterAll(() => server.close())

describe("foodsRepository.search", () => {
  it("maps the Spring page into a PageResponse of models", async () => {
    const page = await foodsRepository.search({ search: "", category: null }, 0)

    expect(page.items).toHaveLength(1)
    expect(page.items[0].macros.calories).toBe(165)
    expect(page.isLast).toBe(true)
  })

  it("omits blank filters", async () => {
    await foodsRepository.search({ search: "   ", category: null }, 0)

    expect(lastUrl?.searchParams.has("q")).toBe(false)
    expect(lastUrl?.searchParams.has("category")).toBe(false)
  })

  it("sends q trimmed and category verbatim", async () => {
    // `q` is a LIKE against name and brand; `category` is compared with `=`,
    // so re-casing it would stop matching.
    await foodsRepository.search({ search: "  pollo ", category: "Carnes" }, 1)

    expect(lastUrl?.searchParams.get("q")).toBe("pollo")
    expect(lastUrl?.searchParams.get("category")).toBe("Carnes")
    expect(lastUrl?.searchParams.get("page")).toBe("1")
    expect(lastUrl?.searchParams.get("size")).toBe("24")
  })

  it("does not send sort, since the backend already defaults to name", async () => {
    await foodsRepository.search({ search: "", category: null }, 0)

    expect(lastUrl?.searchParams.has("sort")).toBe(false)
  })
})

describe("foodsRepository.getById", () => {
  it("returns the mapped model", async () => {
    const food = await foodsRepository.getById(7)

    expect(food.id).toBe(7)
    expect(food.brand).toBeNull()
    expect(food.macros.protein).toBe(31)
  })
})
