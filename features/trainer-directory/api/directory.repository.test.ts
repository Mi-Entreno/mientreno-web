import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import { directoryRepository } from "./directory.repository"
import { EMPTY_DIRECTORY_FILTERS } from "../model/directory.model"

let lastUrl: URL | null = null

function springPage<T>(content: T[]) {
  return {
    content,
    number: 0,
    size: 12,
    totalElements: content.length,
    totalPages: 1,
    first: true,
    last: true,
    numberOfElements: content.length,
    empty: content.length === 0,
  }
}

const server = setupServer(
  http.get("*/api/backend/api/trainers/:id/reviews", ({ request }) => {
    lastUrl = new URL(request.url)
    return HttpResponse.json(
      springPage([
        {
          id: 1,
          studentId: 42,
          studentName: "María López",
          studentImageUrl: null,
          rating: 5,
          comment: "Muy buen seguimiento",
          createdAt: "2026-07-20T10:00:00",
        },
      ]),
    )
  }),

  http.get("*/api/backend/api/trainers", ({ request }) => {
    lastUrl = new URL(request.url)
    return HttpResponse.json(
      springPage([
        {
          id: 7,
          fullName: "Alex Ruiz",
          profileImageUrl: null,
          description: null,
          basePrice: 45,
          experienceYears: 8,
          location: "Madrid",
          avgRating: 4.6,
          totalReviews: 23,
          currentStudents: 6,
          specialties: ["Fuerza"],
        },
      ]),
    )
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  lastUrl = null
})
afterAll(() => server.close())

describe("directoryRepository.list", () => {
  it("maps the page into models", async () => {
    const page = await directoryRepository.list(EMPTY_DIRECTORY_FILTERS, 0)

    expect(page.items[0].fullName).toBe("Alex Ruiz")
    expect(page.items[0].totalReviews).toBe(23)
  })

  it("omits every unset filter", async () => {
    await directoryRepository.list(EMPTY_DIRECTORY_FILTERS, 0)

    for (const key of ["search", "location", "specialty", "minRating", "maxPrice"]) {
      expect(lastUrl?.searchParams.has(key)).toBe(false)
    }
  })

  it("sends the filters it does have, price parsed as a number", async () => {
    await directoryRepository.list(
      {
        search: "  alex ",
        location: " Madrid ",
        specialty: "Fuerza",
        minRating: 4.5,
        maxPrice: "59,90",
      },
      0,
    )

    expect(lastUrl?.searchParams.get("search")).toBe("alex")
    expect(lastUrl?.searchParams.get("location")).toBe("Madrid")
    expect(lastUrl?.searchParams.get("specialty")).toBe("Fuerza")
    expect(lastUrl?.searchParams.get("minRating")).toBe("4.5")
    expect(lastUrl?.searchParams.get("maxPrice")).toBe("59.9")
  })
})

describe("directoryRepository.listReviews", () => {
  it("asks for newest first", async () => {
    // `@PageableDefault(sort = "createdAt")` has no direction, so Spring
    // defaults to ascending and the oldest review would lead the list.
    await directoryRepository.listReviews(7, 0)

    expect(lastUrl?.searchParams.get("sort")).toBe("createdAt,desc")
  })

  it("maps the reviews", async () => {
    const page = await directoryRepository.listReviews(7, 0)

    expect(page.items[0].studentName).toBe("María López")
    expect(page.items[0].rating).toBe(5)
  })
})
