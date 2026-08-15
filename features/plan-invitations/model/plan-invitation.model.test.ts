import { describe, expect, it } from "vitest"

import type { InvitationStatus } from "../dto/plan-invitation.dto"
import {
  canCancel,
  canResend,
  daysUntilExpiry,
  describeStatus,
  INVITATION_FILTERS,
  isAwaitingPayment,
  isEnrolled,
} from "./plan-invitation.model"

describe("describeStatus", () => {
  it("labels every state the enum declares", () => {
    const all: InvitationStatus[] = ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "EXPIRED"]

    for (const status of all) {
      expect(describeStatus(status).label).not.toBe(status)
    }
  })

  it("falls back to the raw value for a state this build has never seen", () => {
    // The backend can add a state without the dashboard being redeployed; a
    // blank badge would be worse than an untranslated one.
    expect(describeStatus("SOMETHING_NEW" as InvitationStatus).label).toBe("SOMETHING_NEW")
  })

  it("gives a rejection a danger tone and an acceptance a success one", () => {
    expect(describeStatus("REJECTED").tone).toBe("danger")
    expect(describeStatus("ACCEPTED").tone).toBe("success")
    expect(describeStatus("PENDING").tone).toBe("warning")
  })
})

describe("canCancel / canResend", () => {
  it("only lets a live invitation be withdrawn", () => {
    expect(canCancel("PENDING")).toBe(true)
    expect(canCancel("ACCEPTED")).toBe(false)
    expect(canCancel("REJECTED")).toBe(false)
    expect(canCancel("EXPIRED")).toBe(false)
  })

  it("offers a resend only for invitations that died without an answer", () => {
    // A rejection *is* an answer — re-offering on a click would be nagging.
    expect(canResend("EXPIRED")).toBe(true)
    expect(canResend("CANCELLED")).toBe(true)
    expect(canResend("REJECTED")).toBe(false)
    expect(canResend("PENDING")).toBe(false)
    expect(canResend("ACCEPTED")).toBe(false)
  })
})

describe("daysUntilExpiry", () => {
  const now = Date.parse("2026-08-07T12:00:00Z")

  it("rounds up, so hours left never read as expired", () => {
    expect(daysUntilExpiry({ status: "PENDING", expiresAt: "2026-08-07T16:00:00Z" }, now)).toBe(1)
    expect(daysUntilExpiry({ status: "PENDING", expiresAt: "2026-08-11T12:00:00Z" }, now)).toBe(4)
  })

  it("clamps a passed deadline to zero instead of going negative", () => {
    expect(daysUntilExpiry({ status: "PENDING", expiresAt: "2026-08-01T12:00:00Z" }, now)).toBe(0)
  })

  it("is silent for anything that is not awaiting an answer", () => {
    expect(daysUntilExpiry({ status: "ACCEPTED", expiresAt: "2026-08-11T12:00:00Z" }, now)).toBeNull()
    expect(daysUntilExpiry({ status: "PENDING", expiresAt: null }, now)).toBeNull()
    expect(daysUntilExpiry({ status: "PENDING", expiresAt: "no es una fecha" }, now)).toBeNull()
  })
})

describe("isEnrolled / isAwaitingPayment", () => {
  // The rule the whole feature turns on: accepting a proposal is not becoming a
  // student. Only a subscription the backend has activated — which it only does
  // from an approved payment — counts.
  it("does not treat a fresh acceptance as a student", () => {
    const accepted = { status: "ACCEPTED" as const, subscriptionStatus: "PENDING_PAYMENT" as const }

    expect(isEnrolled(accepted)).toBe(false)
    expect(isAwaitingPayment(accepted)).toBe(true)
  })

  it("treats a paid subscription as a student", () => {
    expect(isEnrolled({ status: "ACCEPTED", subscriptionStatus: "ACTIVE" })).toBe(true)
    // Paused means they paid and the trainer paused them afterwards.
    expect(isEnrolled({ status: "ACCEPTED", subscriptionStatus: "PAUSED" })).toBe(true)
  })

  it("does not treat a cancelled or expired subscription as a student", () => {
    expect(isEnrolled({ status: "ACCEPTED", subscriptionStatus: "CANCELLED" })).toBe(false)
    expect(isEnrolled({ status: "ACCEPTED", subscriptionStatus: "EXPIRED" })).toBe(false)
  })

  it("assumes not enrolled when the backend says nothing", () => {
    // An older backend, or a state this build has not seen. Guessing the other
    // way would offer a student page for someone who never paid.
    expect(isEnrolled({ status: "ACCEPTED", subscriptionStatus: null })).toBe(false)
  })

  it("is false for anything that was never accepted", () => {
    expect(isEnrolled({ status: "PENDING", subscriptionStatus: null })).toBe(false)
    expect(isEnrolled({ status: "REJECTED", subscriptionStatus: null })).toBe(false)
    expect(isAwaitingPayment({ status: "PENDING", subscriptionStatus: "PENDING_PAYMENT" })).toBe(
      false,
    )
  })
})

describe("INVITATION_FILTERS", () => {
  it("leads with the tab that needs attention and ends with 'all'", () => {
    expect(INVITATION_FILTERS[0].value).toBe("PENDING")
    expect(INVITATION_FILTERS.at(-1)?.value).toBeNull()
  })
})
