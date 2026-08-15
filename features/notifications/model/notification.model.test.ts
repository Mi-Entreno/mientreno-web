import { describe, expect, it } from "vitest"

import type { NotificationResponseDTO, NotificationType } from "../dto/notification.dto"
import { parseMetadata, toNotification } from "../mappers/notification.mapper"
import { badgeLabel, describeType, linkFor, relativeTime } from "./notification.model"

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

  it("parses metadata into the ids the UI links with", () => {
    const notification = toNotification({
      ...DTO,
      metadata: '{"invitationId":9,"subscriptionId":41}',
    })

    expect(notification.metadata).toEqual({ invitationId: 9, subscriptionId: 41 })
  })
})

describe("parseMetadata", () => {
  it("treats an absent column as no metadata", () => {
    // Every notification the backend emits today passes null here.
    expect(parseMetadata(null)).toEqual({})
    expect(parseMetadata("")).toEqual({})
  })

  it("survives a column that is not JSON", () => {
    // It is an unvalidated free-form String upstream; a throw here would take
    // down the whole list render.
    expect(parseMetadata("no soy json")).toEqual({})
    expect(parseMetadata("[1,2,3]")).toEqual({})
    expect(parseMetadata("null")).toEqual({})
  })

  it("ignores keys this build does not know", () => {
    expect(parseMetadata('{"invitationId":3,"somethingNew":"x"}')).toEqual({ invitationId: 3 })
  })

  it("rejects ids that would build a broken URL", () => {
    // A string, a zero and a float all produce a link that 404s, which is
    // worse than showing no link at all.
    expect(parseMetadata('{"subscriptionId":"41"}')).toEqual({})
    expect(parseMetadata('{"subscriptionId":0}')).toEqual({})
    expect(parseMetadata('{"subscriptionId":-1}')).toEqual({})
    expect(parseMetadata('{"subscriptionId":1.5}')).toEqual({})
  })
})

describe("linkFor", () => {
  function notification(
    type: NotificationType,
    metadata: Record<string, number> = {},
  ) {
    return toNotification({ ...DTO, type, metadata: JSON.stringify(metadata) })
  }

  it("sends an accepted invitation to the new student", () => {
    expect(linkFor(notification("PLAN_INVITATION_ACCEPTED", { subscriptionId: 41 }))).toBe(
      "/dashboard/students/41",
    )
  })

  it("falls back to the invitations list when there is no subscription yet", () => {
    expect(linkFor(notification("PLAN_INVITATION_ACCEPTED"))).toBe("/dashboard/invitations")
    expect(linkFor(notification("PLAN_INVITATION_REJECTED"))).toBe("/dashboard/invitations")
  })

  it("opens the right tab for a plan notification", () => {
    expect(linkFor(notification("PLAN_READY", { subscriptionId: 8 }))).toBe(
      "/dashboard/students/8?tab=training",
    )
    expect(linkFor(notification("NUTRITION_PLAN_READY", { subscriptionId: 8 }))).toBe(
      "/dashboard/students/8?tab=nutrition",
    )
  })

  it("has nowhere to go without an id", () => {
    // Today's backend sends no metadata at all, so this is the common path.
    expect(linkFor(notification("PLAN_READY"))).toBeNull()
    expect(linkFor(notification("PAYMENT_APPROVED"))).toBeNull()
  })

  it("returns null for a type this build has never seen", () => {
    expect(linkFor(notification("SOMETHING_NEW" as NotificationType))).toBeNull()
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
      "PLAN_INVITATION_RECEIVED",
      "PLAN_INVITATION_ACCEPTED",
      "PLAN_INVITATION_REJECTED",
      "PLAN_INVITATION_EXPIRED",
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
