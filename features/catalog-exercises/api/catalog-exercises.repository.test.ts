import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import { catalogExercisesRepository } from "./catalog-exercises.repository"

/**
 * Exercises the whole client path — `apiFetch` -> BFF URL -> Spring page ->
 * `PageResponse`. This is the first paginated endpoint in the app, so the page
 * envelope is verified here rather than only in the mapper unit tests.
 */
let lastUrl: URL | null = null

const server = setupServer(
  http.get("*/api/backend/api/catalog-exercises", ({ request }) => {
    lastUrl = new URL(request.url)

    // Spring Boot 3.5 serialises PageImpl directly.
    return HttpResponse.json({
      content: [
        { id: 1, title: "Barbell Bench Press", muscleGroup: "Chest", equipment: "Barbell" },
        { id: 2, title: "Cable Fly", muscleGroup: "Chest", equipment: "Cable Machine" },
      ],
      number: 1,
      size: 24,
      totalElements: 50,
      totalPages: 3,
      first: false,
      last: false,
      numberOfElements: 2,
      empty: false,
    })
  }),

  http.get("*/api/backend/api/catalog-exercises/filters", () =>
    HttpResponse.json({
      muscleGroups: ["Chest", "Upper Back"],
      equipment: ["Barbell", "Cable Machine"],
    }),
  ),

  http.get("*/api/backend/api/catalog-exercises/:id", ({ params }) =>
    HttpResponse.json({
      id: Number(params.id),
      title: "Barbell Bench Press",
      instructions: "Lie on the bench.",
      muscleGroup: "Chest",
      secondaryMuscles: ["Triceps"],
      equipment: "Barbell",
    }),
  ),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  lastUrl = null
})
afterAll(() => server.close())

describe("catalogExercisesRepository.search", () => {
  it("flattens the Spring page into a PageResponse", async () => {
    const page = await catalogExercisesRepository.search(
      { search: "", muscleGroup: null, equipment: null },
      1,
    )

    expect(page.items).toHaveLength(2)
    expect(page.items[0].title).toBe("Barbell Bench Press")
    expect(page.page).toBe(1)
    expect(page.totalItems).toBe(50)
    expect(page.totalPages).toBe(3)
    expect(page.isLast).toBe(false)
  })

  it("omits blank filters rather than sending empty params", async () => {
    await catalogExercisesRepository.search(
      { search: "   ", muscleGroup: null, equipment: null },
      0,
    )

    expect(lastUrl?.searchParams.has("search")).toBe(false)
    expect(lastUrl?.searchParams.has("muscleGroup")).toBe(false)
    expect(lastUrl?.searchParams.has("equipment")).toBe(false)
    expect(lastUrl?.searchParams.get("page")).toBe("0")
    expect(lastUrl?.searchParams.get("size")).toBe("24")
  })

  it("sends filter values untouched, because the backend compares with =", async () => {
    await catalogExercisesRepository.search(
      { search: " press ", muscleGroup: "Upper Back", equipment: "Cable Machine" },
      0,
    )

    // Only the free-text search is trimmed; the enum-like filters are verbatim.
    expect(lastUrl?.searchParams.get("search")).toBe("press")
    expect(lastUrl?.searchParams.get("muscleGroup")).toBe("Upper Back")
    expect(lastUrl?.searchParams.get("equipment")).toBe("Cable Machine")
  })
})

describe("catalogExercisesRepository.getFilters", () => {
  it("returns the option lists", async () => {
    const filters = await catalogExercisesRepository.getFilters()

    expect(filters.muscleGroups).toEqual(["Chest", "Upper Back"])
    expect(filters.equipment).toEqual(["Barbell", "Cable Machine"])
  })
})

describe("catalogExercisesRepository.getById", () => {
  it("returns the detail shape", async () => {
    const detail = await catalogExercisesRepository.getById(12)

    expect(detail.id).toBe(12)
    expect(detail.secondaryMuscles).toEqual(["Triceps"])
    expect(detail.instructions).toBe("Lie on the bench.")
  })
})
