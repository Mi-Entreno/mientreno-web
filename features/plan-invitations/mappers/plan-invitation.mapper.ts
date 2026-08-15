import { toMediaUrl } from "@/core/http/media"
import { toSubscriptionPlan } from "@/features/subscription-plans/mappers/subscription-plan.mapper"

import type {
  AcceptInvitationResponseDTO,
  CreatePlanInvitationRequestDTO,
  InvitationPartyDTO,
  InvitationStudentDTO,
  PlanInvitationResponseDTO,
} from "../dto/plan-invitation.dto"
import type {
  AcceptedInvitation,
  InvitationFormValues,
  InvitationParty,
  PlanInvitation,
} from "../model/plan-invitation.model"

const UNKNOWN_STUDENT = "Alumno sin nombre"
const UNKNOWN_TRAINER = "Entrenador"

/**
 * Tolerates a missing party rather than throwing mid-list: a row with an
 * unnamed trainer still renders, and the id falls back to 0 — never used to
 * build a link.
 */
function toParty(
  dto: InvitationPartyDTO | null | undefined,
  fallbackName: string,
): InvitationParty {
  const name = dto?.fullName?.trim()

  return {
    id: dto?.id ?? 0,
    name: name && name.length > 0 ? name : fallbackName,
    avatarUrl: toMediaUrl(dto?.profileImageUrl),
  }
}

export function toPlanInvitation(dto: PlanInvitationResponseDTO): PlanInvitation {
  const student = dto.student as InvitationStudentDTO

  return {
    id: dto.id,
    status: dto.status,
    message: dto.message?.trim() ?? "",
    rejectionReason: dto.rejectionReason?.trim() || null,
    student: {
      ...toParty(student, UNKNOWN_STUDENT),
      email: student?.email?.trim() || null,
    },
    trainer: toParty(dto.trainer, UNKNOWN_TRAINER),
    plan: toSubscriptionPlan(dto.plan),
    createdAt: dto.createdAt,
    expiresAt: dto.expiresAt ?? null,
    respondedAt: dto.respondedAt ?? null,
    subscriptionId: dto.subscriptionId ?? null,
    subscriptionStatus: dto.subscriptionStatus ?? null,
    checkoutUrl: dto.checkoutUrl ?? null,
  }
}

export function toAcceptedInvitation(dto: AcceptInvitationResponseDTO): AcceptedInvitation {
  return {
    invitationId: dto.invitationId,
    subscriptionId: dto.subscriptionId,
    subscriptionStatus: dto.subscriptionStatus,
    checkoutUrl: dto.checkoutUrl ?? null,
  }
}

/**
 * The form guards both ids before this runs, so the non-null assertions in the
 * caller are not repeated here — an invitation without a student or a plan is
 * not a request worth building.
 */
export function toCreateInvitationRequest(
  values: InvitationFormValues & { studentId: number; planId: number },
): CreatePlanInvitationRequestDTO {
  return {
    studentId: values.studentId,
    planId: values.planId,
    message: values.message.trim() || null,
  }
}
