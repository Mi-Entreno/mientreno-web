export interface StudentCandidate {
  id: number
  fullName: string
  email: string | null
  /** Display URL through the media proxy. */
  avatarUrl: string | null
  location: string | null
  alreadyMyStudent: boolean
  pendingInvitationId: number | null
}

/** `@PageableDefault(size = 20)`; a picker list does not need more per page. */
export const STUDENT_SEARCH_PAGE_SIZE = 20

/**
 * Below this the query is not worth sending.
 *
 * A one-character search matches most of the table, so the trainer would scroll
 * a list that tells them nothing while the backend pays for it.
 */
export const MIN_SEARCH_LENGTH = 2

export type CandidateState = "invitable" | "already-student" | "invitation-pending"

export function candidateState(candidate: StudentCandidate): CandidateState {
  if (candidate.alreadyMyStudent) return "already-student"
  if (candidate.pendingInvitationId !== null) return "invitation-pending"
  return "invitable"
}

const STATE_REASONS: Record<CandidateState, string | null> = {
  invitable: null,
  "already-student": "Ya es alumno tuyo",
  "invitation-pending": "Ya tiene una invitación pendiente",
}

/** Why a row is not selectable, or null when it is. */
export function blockedReason(candidate: StudentCandidate): string | null {
  return STATE_REASONS[candidateState(candidate)]
}
