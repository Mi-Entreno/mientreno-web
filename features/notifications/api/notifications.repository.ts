import { apiFetch } from "@/core/http/client"
import { mapPage, type PageResponse, type SpringPage } from "@/core/http/pagination"

import type { NotificationResponseDTO, UnreadCountResponseDTO } from "../dto/notification.dto"
import { toNotification } from "../mappers/notification.mapper"
import { NOTIFICATIONS_PAGE_SIZE, type AppNotification } from "../model/notification.model"

export const notificationsRepository = {
  /** `GET /api/notifications` — newest first, Spring `Pageable`. */
  async list(page: number, size: number = NOTIFICATIONS_PAGE_SIZE): Promise<PageResponse<AppNotification>> {
    const dto = await apiFetch<SpringPage<NotificationResponseDTO>>("/api/notifications", {
      query: { page, size },
    })
    return mapPage(dto, toNotification)
  },

  async unreadCount(): Promise<number> {
    const dto = await apiFetch<UnreadCountResponseDTO>("/api/notifications/unread-count")
    return dto.count
  },

  /**
   * `PATCH /{id}/read`. Answers the updated notification.
   *
   * The update is scoped by user id upstream, so someone else's notification
   * is a 404 rather than a 403 — from the caller's side it simply does not
   * exist.
   */
  async markAsRead(id: number): Promise<AppNotification> {
    return toNotification(
      await apiFetch<NotificationResponseDTO>(`/api/notifications/${id}/read`, {
        method: "PATCH",
      }),
    )
  },

  /** `PATCH /read-all` — 204. */
  async markAllAsRead(): Promise<void> {
    await apiFetch<void>("/api/notifications/read-all", { method: "PATCH" })
  },
}
