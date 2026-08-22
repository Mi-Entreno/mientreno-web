import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { notificationsRepository } from "../api/notifications.repository"
import type { AppNotification } from "../model/notification.model"
import { useNotifications } from "./use-notifications"

function notification(id: number): AppNotification {
  return {
    id,
    type: "NEW_STUDENT",
    title: `Notificación ${id}`,
    body: "",
    read: false,
    readAt: null,
    createdAt: "2026-08-22T10:00:00Z",
    metadata: {},
  }
}

function page(ids: number[], { number: pageNumber = 0, isLast = true } = {}) {
  return {
    items: ids.map(notification),
    page: pageNumber,
    size: 20,
    totalItems: 40,
    totalPages: 2,
    isFirst: pageNumber === 0,
    isLast,
    isEmpty: ids.length === 0,
  }
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useNotifications", () => {
  it("drops a notification that offset pagination served on two pages", async () => {
    // A row written between the two fetches shifts everything down, so id 3
    // comes back on page 0 and again at the head of page 1.
    vi.spyOn(notificationsRepository, "list").mockImplementation(async (pageParam: number) =>
      pageParam === 0
        ? page([5, 4, 3], { number: 0, isLast: false })
        : page([3, 2, 1], { number: 1, isLast: true }),
    )

    const { result } = renderHook(() => useNotifications(), { wrapper })

    await waitFor(() => expect(result.current.notifications).toHaveLength(3))
    await result.current.fetchNextPage()

    await waitFor(() => expect(result.current.notifications).toHaveLength(5))
    expect(result.current.notifications.map((item) => item.id)).toEqual([5, 4, 3, 2, 1])
  })

  it("keeps the newest-first order the API returns", async () => {
    vi.spyOn(notificationsRepository, "list").mockResolvedValue(page([9, 8, 7]))

    const { result } = renderHook(() => useNotifications(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.notifications.map((item) => item.id)).toEqual([9, 8, 7])
  })
})
