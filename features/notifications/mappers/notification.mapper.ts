import type { NotificationResponseDTO } from "../dto/notification.dto"
import type { AppNotification } from "../model/notification.model"

export function toNotification(dto: NotificationResponseDTO): AppNotification {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    body: dto.body ?? "",
    read: dto.read,
    readAt: dto.readAt,
    createdAt: dto.createdAt,
  }
  // `metadata` is deliberately dropped: it is always null upstream, so carrying
  // it would suggest a deep-link that cannot be built.
}
