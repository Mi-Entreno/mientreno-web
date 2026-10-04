import type {
  BillingPeriodDTO,
  CheckoutDTO,
  CurrentMembershipDTO,
  EntitlementsDTO,
  FeatureEntitlementDTO,
  MembershipPaymentDTO,
  MembershipPlanDTO,
  MembershipStatusDTO,
  MyMembershipDTO,
  PlanBenefitDTO,
  PlanPriceDTO,
} from "../dto/membership.dto"

/*
 * The DTOs already have the shape the UI wants, so the models are aliases.
 * They exist so components import from `model/` and never from `dto/`: the day
 * a field needs reshaping, the change lands in the mapper and nowhere else.
 */
export type MembershipStatus = MembershipStatusDTO
export type BillingPeriod = BillingPeriodDTO
export type FeatureEntitlement = FeatureEntitlementDTO
export type Entitlements = EntitlementsDTO
export type CurrentMembership = CurrentMembershipDTO
export type MyMembership = MyMembershipDTO
export type PlanPrice = PlanPriceDTO
export type PlanBenefit = PlanBenefitDTO
export type MembershipPlan = MembershipPlanDTO
export type Checkout = CheckoutDTO
export type MembershipPayment = MembershipPaymentDTO

/** Feature codes this panel reads. Mirror of `entitlement.Features` in the backend. */
export const FEATURES = {
  maxActiveStudents: "TRAINER_MAX_ACTIVE_STUDENTS",
  marketplaceFee: "TRAINER_MARKETPLACE_FEE_PERCENT",
  exerciseVideos: "TRAINER_EXERCISE_VIDEOS",
  planTemplates: "TRAINER_PLAN_TEMPLATES",
  adherenceDashboard: "TRAINER_ADHERENCE_DASHBOARD",
  premiumBadge: "PREMIUM_BADGE",
} as const

export const STATUS_LABELS: Record<MembershipStatus, string> = {
  PENDING: "Pago pendiente",
  TRIALING: "Prueba gratis",
  ACTIVE: "Activa",
  PAST_DUE: "Pago con problemas",
  CANCELLED: "Cancelada",
  EXPIRED: "Vencida",
}

export const PERIOD_LABELS: Record<BillingPeriod, string> = {
  MONTHLY: "Mensual",
  YEARLY: "Anual",
}

export function findFeature(entitlements: Entitlements | undefined, code: string): FeatureEntitlement | null {
  return entitlements?.features.find((feature) => feature.code === code) ?? null
}

export interface LimitUsage {
  used: number
  limit: number
  remaining: number
  /** 0..1, capped at 1 even when the trainer is over the limit (a downgrade keeps everyone). */
  ratio: number
  exhausted: boolean
  /** Worth a warning before the trainer hits the wall: 80 % or more. */
  nearLimit: boolean
}

/**
 * Usage against the plan limit, or null when there is nothing to meter: the
 * feature is unlimited, not a limit, or the backend did not report usage.
 */
export function limitUsage(feature: FeatureEntitlement | null): LimitUsage | null {
  if (!feature || feature.type !== "LIMIT" || feature.limit === null || feature.used === null) return null
  const { used, limit } = feature
  const ratio = limit === 0 ? 1 : Math.min(1, used / limit)
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    ratio,
    exhausted: used >= limit,
    nearLimit: ratio >= 0.8,
  }
}

/** "2 de 10 alumnos". */
export function describeUsage(usage: LimitUsage, unit: string | null): string {
  return `${usage.used} de ${usage.limit}${unit ? ` ${unit}` : ""}`
}

/** What a plan gives of a feature, as a short phrase for the comparison table. */
export function describeBenefit(benefit: Pick<PlanBenefit, "type" | "enabled" | "limit" | "unit">): string {
  if (!benefit.enabled) return "No incluido"
  switch (benefit.type) {
    case "BOOLEAN":
      return "Incluido"
    case "LIMIT":
      return benefit.limit === null ? "Ilimitado" : `Hasta ${benefit.limit}${benefit.unit ? ` ${benefit.unit}` : ""}`
    case "CONFIG":
      if (benefit.limit === null) return "Según configuración"
      return benefit.unit === "%" ? `${benefit.limit} %` : `${benefit.limit}${benefit.unit ? ` ${benefit.unit}` : ""}`
  }
}

export function priceFor(plan: MembershipPlan, period: BillingPeriod): PlanPrice | null {
  return plan.prices.find((price) => price.active && price.billingPeriod === period) ?? null
}

/**
 * How much cheaper the yearly price is than twelve monthly ones, as a whole
 * percentage. Null when either price is missing or the yearly one is not cheaper.
 */
export function yearlySavingsPercent(plan: MembershipPlan): number | null {
  const monthly = priceFor(plan, "MONTHLY")
  const yearly = priceFor(plan, "YEARLY")
  if (!monthly || !yearly || monthly.amount <= 0) return null
  const savings = Math.round((1 - yearly.amount / (monthly.amount * 12)) * 100)
  return savings > 0 ? savings : null
}

/** Paid plans, cheapest tier first; the free plan is what they are compared against. */
export function paidPlans(plans: MembershipPlan[]): MembershipPlan[] {
  return plans.filter((plan) => !plan.defaultPlan).sort((a, b) => a.tierRank - b.tierRank)
}

/**
 * Bought in the mobile app: Apple and Google do not let a server cancel or
 * resume it, so this panel explains where to do it instead of offering it.
 */
export function isStoreManaged(membership: CurrentMembership | null): boolean {
  return membership?.provider === "REVENUECAT"
}

export function canCancel(membership: CurrentMembership | null): boolean {
  if (!membership || membership.cancelAtPeriodEnd || isStoreManaged(membership)) return false
  return membership.status === "ACTIVE" || membership.status === "TRIALING"
    || membership.status === "PAST_DUE" || membership.status === "PENDING"
}

export function canResume(membership: CurrentMembership | null, now: Date = new Date()): boolean {
  if (!membership?.cancelAtPeriodEnd || isStoreManaged(membership)) return false
  return membership.accessUntil !== null && new Date(membership.accessUntil).getTime() > now.getTime()
}

/** The one sentence under the plan name: what happens next with this membership. */
export function describeMembership(membership: CurrentMembership): string {
  const date = (iso: string | null) => (iso ? formatDay(iso) : "")
  switch (membership.status) {
    case "PENDING":
      return "Todavía no completaste el pago."
    case "TRIALING":
      return membership.cancelAtPeriodEnd
        ? `Tu prueba termina el ${date(membership.accessUntil)} y no se va a cobrar.`
        : `Tu prueba gratis termina el ${date(membership.trialEndsAt)}. Ese día se cobra el primer período.`
    case "ACTIVE":
      if (membership.cancelAtPeriodEnd) return `Diste de baja tu plan. Seguís teniendo los beneficios hasta el ${date(membership.accessUntil)}.`
      if (membership.provider === "MANUAL") return `Plan otorgado por Mi Entreno hasta el ${date(membership.currentPeriodEnd)}.`
      if (membership.provider === "REVENUECAT") return `Se renueva el ${date(membership.renewsAt ?? membership.currentPeriodEnd)} desde la tienda de tu teléfono, donde también podés darlo de baja.`
      return `Se renueva el ${date(membership.renewsAt)}.`
    case "PAST_DUE":
      return `No pudimos cobrar la renovación. Conservás los beneficios hasta el ${date(membership.graceUntil)} mientras reintentamos.`
    case "CANCELLED":
    case "EXPIRED":
      return "Tu plan terminó."
  }
}

/** Mercado Pago's back_url carries no reliable status: the membership itself is the truth. */
export function isSettled(me: MyMembership | undefined): boolean {
  const status = me?.membership?.status
  return status === "ACTIVE" || status === "TRIALING"
}

function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" }).format(new Date(iso))
}
