import { toMediaUrl } from "@/core/http/media"

import type { StudentSearchResultDTO } from "../dto/student-search.dto"
import type { StudentCandidate } from "../model/student-search.model"

const UNKNOWN_STUDENT = "Alumno sin nombre"

export function toStudentCandidate(dto: StudentSearchResultDTO): StudentCandidate {
  const name = dto.fullName?.trim()

  return {
    id: dto.id,
    fullName: name && name.length > 0 ? name : UNKNOWN_STUDENT,
    email: dto.email?.trim() || null,
    avatarUrl: toMediaUrl(dto.profileImageUrl),
    location: dto.location?.trim() || null,
    // Defaulting to `false`/`null` rather than trusting the field to be there:
    // an older backend that ships the search before the relationship flags
    // should degrade to "invitable", not to a screen of disabled rows.
    alreadyMyStudent: dto.alreadyMyStudent ?? false,
    pendingInvitationId: dto.pendingInvitationId ?? null,
  }
}
