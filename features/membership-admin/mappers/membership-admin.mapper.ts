import type { AdminMembershipDTO } from "../dto/membership-admin.dto"
import type { AdminMembership } from "../model/membership-admin.model"

/** Identity today; see the note in `features/membership/model`. */
export const toAdminMembership = (dto: AdminMembershipDTO): AdminMembership => dto
