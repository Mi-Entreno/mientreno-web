import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import { directoryRepository } from "./directory.repository"

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
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  lastUrl = null
})
afterAll(() => server.close())

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
