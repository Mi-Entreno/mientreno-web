import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import { notificationsRepository } from "./notifications.repository"

let lastUrl: URL | null = null
let lastMethod: string | null = null

const server = setupServer(
  http.get("*/api/backend/api/notifications/unread-count", () =>
    HttpResponse.json({ count: 7 }),
  ),

  http.get("*/api/backend/api/notifications", ({ request }) => {
    lastUrl = new URL(request.url)

    return HttpResponse.json({
      content: [
        {
          id: 12,
          type: "NEW_STUDENT",
          title: "Nuevo alumno",
          body: "María López se suscribió.",
          read: false,
          readAt: null,
          metadata: null,
          createdAt: "2026-07-27T09:00:00",
        },
      ],
      number: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      numberOfElements: 1,
      empty: false,
    })
  }),

  http.patch("*/api/backend/api/notifications/read-all", ({ request }) => {
    lastMethod = request.method
    // 204 — a body here would throw in the proxy before the phase 0 fix.
    return new HttpResponse(null, { status: 204 })
  }),

  http.patch("*/api/backend/api/notifications/:id/read", ({ params }) =>
    HttpResponse.json({
      id: Number(params.id),
      type: "NEW_STUDENT",
      title: "Nuevo alumno",
      body: "María López se suscribió.",
      read: true,
      readAt: "2026-07-27T10:00:00Z",
      metadata: null,
      createdAt: "2026-07-27T09:00:00",
    }),
  ),
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  lastUrl = null
  lastMethod = null
})
afterAll(() => server.close())

describe("notificationsRepository", () => {
  it("unwraps the unread count", async () => {
    expect(await notificationsRepository.unreadCount()).toBe(7)
  })

  it("maps the Spring page into models", async () => {
    const page = await notificationsRepository.list(0)

    expect(page.items).toHaveLength(1)
    expect(page.items[0].title).toBe("Nuevo alumno")
    expect(page.isLast).toBe(true)
  })

  it("sends page and size", async () => {
    await notificationsRepository.list(2)

    expect(lastUrl?.searchParams.get("page")).toBe("2")
    expect(lastUrl?.searchParams.get("size")).toBe("20")
  })

  it("returns the updated notification when marking one read", async () => {
    const updated = await notificationsRepository.markAsRead(12)

    expect(updated.read).toBe(true)
    expect(updated.readAt).not.toBeNull()
  })

  it("handles the 204 from read-all without a body", async () => {
    await expect(notificationsRepository.markAllAsRead()).resolves.toBeUndefined()
    expect(lastMethod).toBe("PATCH")
  })
})
