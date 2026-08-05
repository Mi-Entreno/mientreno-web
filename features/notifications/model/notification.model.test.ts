import { describe, expect, it } from "vitest"

import type { NotificationResponseDTO, NotificationType } from "../dto/notification.dto"
import { toNotification } from "../mappers/notification.mapper"
import { badgeLabel, describeType, relativeTime } from "./notification.model"

const DTO: NotificationResponseDTO = {
  id: 12,
  type: "NEW_STUDENT",
  title: "Nuevo alumno",
  body: 'María López se suscribió al plan "Plan Premium".',
  read: false,
  readAt: null,
  metadata: null,
  createdAt: "2026-07-27T09:00:00",
}

describe("toNotification", () => {
  it("maps the fields the UI renders", () => {
    const notification = toNotification(DTO)

    expect(notification.id).toBe(12)
    expect(notification.type).toBe("NEW_STUDENT")
    expect(notification.read).toBe(false)
  })

  it("turns a null body into an empty string", () => {
    expect(toNotification({ ...DTO, body: null }).body).toBe("")
  })

  it("does not carry metadata, which is always null upstream", () => {
    // Exposing it would suggest a deep-link the backend cannot support.
    expect("metadata" in toNotification(DTO)).toBe(false)
  })
})

describe("describeType", () => {
  it("labels every constant the enum declares", () => {
    const all: NotificationType[] = [
      "PLAN_READY",
      "PLAN_UPDATED",
      "NUTRITION_PLAN_READY",
      "PAYMENT_APPROVED",
      "PAYMENT_REJECTED",
      "SUBSCRIPTION_EXPIRING",
      "SUBSCRIPTION_EXPIRED",
      "NEW_STUDENT",
      "TRAINER_ANNOUNCEMENT",
    ]

    for (const type of all) {
      expect(describeType(type).label).not.toBe("Notificación")
    }
  })

  it("falls back for a type this build has never seen", () => {
    // The backend can add constants without the dashboard being redeployed;
    // an unknown type must not render blank.
    const descriptor = describeType("SOMETHING_NEW" as NotificationType)

    expect(descriptor.label).toBe("Notificación")
    expect(descriptor.tone).toBe("info")
  })

  it("gives a rejected payment a danger tone", () => {
    expect(describeType("PAYMENT_REJECTED").tone).toBe("danger")
    expect(describeType("NEW_STUDENT").tone).toBe("success")
  })
})

describe("relativeTime", () => {
  const now = Date.parse("2026-07-27T12:00:00Z")

  it("reads naturally at each scale", () => {
    expect(relativeTime("2026-07-27T11:59:30Z", now)).toBe("ahora mismo")
    expect(relativeTime("2026-07-27T11:30:00Z", now)).toBe("hace 30 min")
    expect(relativeTime("2026-07-27T09:00:00Z", now)).toBe("hace 3 h")
    expect(relativeTime("2026-07-25T12:00:00Z", now)).toBe("hace 2 días")
    expect(relativeTime("2026-07-13T12:00:00Z", now)).toBe("hace 2 semanas")
  })

  it("uses the singular where Spanish needs it", () => {
    expect(relativeTime("2026-07-26T12:00:00Z", now)).toBe("hace 1 día")
    expect(relativeTime("2026-07-20T12:00:00Z", now)).toBe("hace 1 semana")
  })

  it("returns empty for an unparseable date rather than NaN", () => {
    expect(relativeTime("no es una fecha", now)).toBe("")
  })
})

describe("badgeLabel", () => {
  it("caps at 99+ so the badge cannot stretch the header", () => {
    expect(badgeLabel(5)).toBe("5")
    expect(badgeLabel(99)).toBe("99")
    expect(badgeLabel(150)).toBe("99+")
  })

  it("is empty when there is nothing unread", () => {
    expect(badgeLabel(0)).toBe("")
  })
})
