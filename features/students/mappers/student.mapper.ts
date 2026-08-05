import { toMediaUrl } from "@/core/http/media"
import { toSubscriptionPlan } from "@/features/subscription-plans/mappers/subscription-plan.mapper"

import type {
  SubscriptionDetailResponseDTO,
  SubscriptionResponseDTO,
  TrainerStudentIdentityDTO,
} from "../dto/student.dto"
import type { StudentSubscription, SubscriptionDetail } from "../model/student.model"

const UNKNOWN_STUDENT = "Alumno sin nombre"

function displayName(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : UNKNOWN_STUDENT
}

/**
 * Maps a subscription row, taking the student identity from wherever it is
 * available.
 *
 * `SubscriptionResponseDTO` does not carry the student today (see
 * `docs/BACKEND_CHANGE_REQUEST.md`), so `identity` is supplied by the caller
 * from `GET /api/training-plans/trainer/students`. Once the backend ships the
 * `student` field, `dto.student` wins and the second argument can go away.
 */
export function toStudentSubscription(
  dto: SubscriptionResponseDTO,
  identity?: TrainerStudentIdentityDTO,
): StudentSubscription {
  // Prefer the DTO's own field: it is the shape we want to end up with.
  const student = dto.student
    ? { id: dto.student.id, name: dto.student.fullName, image: dto.student.profileImageUrl }
    : identity
      ? { id: identity.studentId, name: identity.studentFullName, image: identity.studentImageUrl }
      : { id: null, name: null, image: null }

  return {
    subscriptionId: dto.id,
    studentId: student.id,
    studentName: displayName(student.name),
    studentAvatarUrl: toMediaUrl(student.image),
    plan: dto.plan ? toSubscriptionPlan(dto.plan) : null,
    status: dto.status,
    startedAt: dto.startedAt,
    expiresAt: dto.expiresAt,
  }
}

/** `GET /api/subscriptions/{id}` — this endpoint always carries the student. */
export function toSubscriptionDetail(dto: SubscriptionDetailResponseDTO): SubscriptionDetail {
  return {
    subscriptionId: dto.id,
    studentId: dto.student?.id ?? null,
    studentName: displayName(dto.student?.fullName),
    studentAvatarUrl: toMediaUrl(dto.student?.profileImageUrl),
    plan: dto.plan ? toSubscriptionPlan(dto.plan) : null,
    status: dto.status,
    startedAt: dto.startedAt,
    expiresAt: dto.expiresAt,
    cancelledAt: dto.cancelledAt,
    paymentProvider: dto.paymentProvider,
    externalPaymentId: dto.externalPaymentId,
  }
}

/**
 * Joins the two lists by `subscriptionId`.
 *
 * Safe because both endpoints iterate the very same query
 * (`findByTrainerIdAndStatus(trainerId, ACTIVE)`), so they describe the same
 * set of subscriptions. A row missing from the identity list still renders,
 * just without a name.
 */
export function joinStudentIdentities(
  subscriptions: SubscriptionResponseDTO[],
  identities: TrainerStudentIdentityDTO[],
): StudentSubscription[] {
  const byId = new Map(identities.map((item) => [item.subscriptionId, item]))
  return subscriptions.map((dto) => toStudentSubscription(dto, byId.get(dto.id)))
}
