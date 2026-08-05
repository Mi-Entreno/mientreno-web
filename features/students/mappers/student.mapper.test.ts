import { describe, expect, it } from "vitest"

import type { SubscriptionPlanResponseDTO } from "@/features/subscription-plans/dto/subscription-plan.dto"
import type {
  SubscriptionDetailResponseDTO,
  SubscriptionResponseDTO,
  TrainerStudentIdentityDTO,
} from "../dto/student.dto"
import {
  joinStudentIdentities,
  toStudentSubscription,
  toSubscriptionDetail,
} from "./student.mapper"

const PLAN: SubscriptionPlanResponseDTO = {
  id: 3,
  name: "Plan Premium",
  description: "Todo incluido",
  price: 49.9,
  billingPeriod: "MONTHLY",
  maxStudents: 20,
  includesNutrition: true,
}

/** Exactly what the backend sends today: trainer fields, no student. */
const SUBSCRIPTION: SubscriptionResponseDTO = {
  id: 101,
  trainerId: 7,
  trainerName: "Alex Ruiz",
  trainerImageUrl: "http://localhost:8080/api/files/avatars/7/me.png",
  plan: PLAN,
  status: "ACTIVE",
  startedAt: "2026-01-15T10:00:00Z",
  expiresAt: "2026-02-15T10:00:00Z",
}

const IDENTITY: TrainerStudentIdentityDTO = {
  subscriptionId: 101,
  studentId: 42,
  studentFullName: "María López",
  studentImageUrl: "http://localhost:8080/api/files/avatars/42/photo.jpg",
}

describe("toStudentSubscription", () => {
  it("takes the student from the identity endpoint while the DTO lacks one", () => {
    const row = toStudentSubscription(SUBSCRIPTION, IDENTITY)

    expect(row.studentId).toBe(42)
    expect(row.studentName).toBe("María López")
    expect(row.studentAvatarUrl).toBe("/api/media/avatars/42/photo.jpg")
  })

  it("prefers dto.student once the backend ships it", () => {
    // The change request adds this field; when it lands the join becomes dead
    // weight and this branch takes over with no other code change.
    const row = toStudentSubscription(
      {
        ...SUBSCRIPTION,
        student: { id: 99, fullName: "Ana Gil", profileImageUrl: null },
      },
      IDENTITY,
    )

    expect(row.studentId).toBe(99)
    expect(row.studentName).toBe("Ana Gil")
  })

  it("never shows the trainer's name in place of the student's", () => {
    // The failure mode this whole mapper exists to prevent: the DTO's
    // `trainerName` is the signed-in trainer, repeated on every row.
    const row = toStudentSubscription(SUBSCRIPTION)

    expect(row.studentName).not.toBe("Alex Ruiz")
    expect(row.studentName).toBe("Alumno sin nombre")
    expect(row.studentId).toBeNull()
  })

  it("falls back when the name is blank", () => {
    const row = toStudentSubscription(SUBSCRIPTION, { ...IDENTITY, studentFullName: "   " })
    expect(row.studentName).toBe("Alumno sin nombre")
  })

  it("maps the plan and keeps the instants untouched", () => {
    const row = toStudentSubscription(SUBSCRIPTION, IDENTITY)

    expect(row.plan?.name).toBe("Plan Premium")
    expect(row.plan?.price).toBe(49.9)
    expect(row.startedAt).toBe("2026-01-15T10:00:00Z")
  })
})

describe("joinStudentIdentities", () => {
  it("matches rows by subscriptionId, not by position", () => {
    const subscriptions = [
      { ...SUBSCRIPTION, id: 101 },
      { ...SUBSCRIPTION, id: 202 },
    ]
    const identities = [
      { ...IDENTITY, subscriptionId: 202, studentId: 8, studentFullName: "Carlos Ruiz" },
      { ...IDENTITY, subscriptionId: 101, studentId: 42, studentFullName: "María López" },
    ]

    const rows = joinStudentIdentities(subscriptions, identities)

    expect(rows[0].studentName).toBe("María López")
    expect(rows[1].studentName).toBe("Carlos Ruiz")
  })

  it("still renders a subscription with no matching identity", () => {
    const rows = joinStudentIdentities([SUBSCRIPTION], [])

    expect(rows).toHaveLength(1)
    expect(rows[0].subscriptionId).toBe(101)
    expect(rows[0].studentName).toBe("Alumno sin nombre")
  })

  it("ignores identities with no matching subscription", () => {
    const rows = joinStudentIdentities([SUBSCRIPTION], [
      IDENTITY,
      { ...IDENTITY, subscriptionId: 999 },
    ])

    expect(rows).toHaveLength(1)
  })
})

describe("toSubscriptionDetail", () => {
  const DETAIL: SubscriptionDetailResponseDTO = {
    id: 101,
    status: "PAUSED",
    student: { id: 42, fullName: "María López", profileImageUrl: null },
    trainer: { id: 7, fullName: "Alex Ruiz", profileImageUrl: null },
    plan: PLAN,
    startedAt: "2026-01-15T10:00:00Z",
    expiresAt: "2026-02-15T10:00:00Z",
    cancelledAt: null,
    paymentProvider: "MERCADOPAGO",
    externalPaymentId: "mp-123",
  }

  it("reads the student the detail endpoint does provide", () => {
    const detail = toSubscriptionDetail(DETAIL)

    expect(detail.studentName).toBe("María López")
    expect(detail.status).toBe("PAUSED")
    expect(detail.paymentProvider).toBe("MERCADOPAGO")
  })
})
