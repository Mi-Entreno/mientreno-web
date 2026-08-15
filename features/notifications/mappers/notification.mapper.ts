import type { NotificationResponseDTO } from "../dto/notification.dto"
import type { AppNotification, NotificationMetadata } from "../model/notification.model"

/** Keys we know how to act on; anything else in the payload is ignored. */
const KNOWN_KEYS = ["invitationId", "subscriptionId", "studentId", "planId"] as const

/**
 * Parses the free-form `metadata` column into the ids the UI can link with.
 *
 * Everything about this is defensive, because the column is a plain `String`
 * with no schema and no validation upstream: it is null for every notification
 * the backend emits today, it may hold something that is not JSON, and a future
 * payload may carry keys this build has never heard of. All three cases have to
 * end up as "no deep link", never as a thrown error inside a list render.
 *
 * Only integral, positive numbers are kept — an id of `0`, `-1` or `"7"` would
 * build a URL that 404s, which is worse than no link at all.
 */
export function parseMetadata(raw: string | null | undefined): NotificationMetadata {
  if (!raw) return {}

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {}
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {}

  const source = parsed as Record<string, unknown>
  const metadata: NotificationMetadata = {}

  for (const key of KNOWN_KEYS) {
    const value = source[key]
    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      metadata[key] = value
    }
  }

  return metadata
}

export function toNotification(dto: NotificationResponseDTO): AppNotification {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    body: dto.body ?? "",
    read: dto.read,
    readAt: dto.readAt,
    createdAt: dto.createdAt,
    metadata: parseMetadata(dto.metadata),
  }
}
