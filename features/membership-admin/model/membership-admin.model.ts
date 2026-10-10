import type { MembershipPlan, MembershipStatus, PlanBenefit } from "@/features/membership/model/membership.model"
import type { AdminMembershipDTO } from "../dto/membership-admin.dto"

export type AdminMembership = AdminMembershipDTO
export type { MembershipPlan, MembershipStatus, PlanBenefit }

export const AUDIENCE_LABELS: Record<MembershipPlan["audience"], string> = {
  STUDENT: "Alumnos",
  TRAINER: "Entrenadores",
  BRAND: "Comercios",
}

/** Plans grouped by audience, in the order the admin reads them: students, trainers, merchants. */
export function groupByAudience(plans: MembershipPlan[]): { audience: MembershipPlan["audience"]; plans: MembershipPlan[] }[] {
  const order: MembershipPlan["audience"][] = ["STUDENT", "TRAINER", "BRAND"]
  return order
    .map((audience) => ({
      audience,
      plans: plans.filter((plan) => plan.audience === audience).sort((a, b) => a.tierRank - b.tierRank),
    }))
    .filter((group) => group.plans.length > 0)
}

/**
 * Parses the limit field of the benefit editor. Empty means unlimited (null);
 * anything that is not a whole number ≥ 0 is rejected rather than guessed.
 */
export function parseLimit(raw: string): { ok: true; value: number | null } | { ok: false } {
  const trimmed = raw.trim()
  if (trimmed === "") return { ok: true, value: null }
  if (!/^\d+$/.test(trimmed)) return { ok: false }
  return { ok: true, value: Number(trimmed) }
}

/** Publishing needs a price; the backend refuses otherwise, and the switch says why up front. */
export function canPublish(plan: MembershipPlan): boolean {
  return plan.defaultPlan || plan.prices.some((price) => price.active)
}

/** End of a courtesy plan `days` from now, as the ISO instant the backend expects. */
export function grantEndsAt(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() + days * 86_400_000).toISOString()
}

/** "45,3 %", or "—" when there is nothing to divide by. */
export function percent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return `${(value * 100).toFixed(1).replace(".", ",")} %`
}

/** Split a "A:B" metrics key for display. */
export function splitKey(key: string): [string, string] {
  const [a, b = ""] = key.split(":")
  return [a, b]
}

/** Only Mercado Pago memberships have something remote to compare against. */
export function canReconcile(membership: AdminMembership): boolean {
  return membership.provider === "MERCADO_PAGO" && membership.externalId !== null
}
