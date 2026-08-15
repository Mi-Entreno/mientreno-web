/**
 * Contract for the student lookup a trainer uses before inviting someone.
 *
 * **This endpoint does not exist upstream yet.** It is specified in
 * `BACKEND_REQUIREMENTS.md` §3.1. Nothing in the current API lets a trainer see
 * a user they are not already subscribed to: `/api/subscriptions/students` is
 * the roster, and `/api/trainers` searches the other direction. The shapes below
 * are the request we are making, written as types so the screens are built
 * against the contract rather than a guess.
 */

/**
 * `GET /api/users/students/search`.
 *
 * The two relationship flags are the reason this is not a generic user search.
 * Without them the picker would happily offer a student who is already ours, or
 * one who has an invitation open, and the only feedback would be a 409 after
 * the trainer has finished the whole wizard.
 */
export interface StudentSearchResultDTO {
  id: number
  fullName: string | null
  /**
   * Partially masked upstream (`m***@gmail.com`) — see the privacy note in
   * `BACKEND_REQUIREMENTS.md` §9.3. It exists to disambiguate two students with
   * the same name, not to hand out address books.
   */
  email: string | null
  profileImageUrl: string | null
  location: string | null
  /** An ACTIVE or PAUSED subscription with *this* trainer already exists. */
  alreadyMyStudent: boolean
  /** Id of a PENDING invitation this trainer already sent, or null. */
  pendingInvitationId: number | null
}
