import type {
  CheckoutDTO,
  EntitlementsDTO,
  MembershipPaymentDTO,
  MembershipPlanDTO,
  MyMembershipDTO,
} from "../dto/membership.dto"
import type { Checkout, Entitlements, MembershipPayment, MembershipPlan, MyMembership } from "../model/membership.model"

/*
 * Identity today — see the note in `membership.model.ts`. Kept so that a
 * reshaped field changes here and not in every component. Nothing in these
 * DTOs carries a media URL, so there is no `toMediaUrl` to apply.
 */
export const toEntitlements = (dto: EntitlementsDTO): Entitlements => dto
export const toMyMembership = (dto: MyMembershipDTO): MyMembership => dto
export const toMembershipPlan = (dto: MembershipPlanDTO): MembershipPlan => dto
export const toCheckout = (dto: CheckoutDTO): Checkout => dto
export const toMembershipPayment = (dto: MembershipPaymentDTO): MembershipPayment => dto
