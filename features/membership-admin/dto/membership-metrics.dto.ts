/** `MembershipMetricsResponseDTO` — `GET /api/admin/membership/metrics`. Gross amounts. */
export interface MembershipMetricsDTO {
  mrr: Record<string, number>
  arr: Record<string, number>
  /** Keyed "PROVIDER:CURRENCY". */
  mrrByProvider: Record<string, number>
  arpu: Record<string, number>
  /** Keyed "PLAN_CODE:STATUS". */
  liveByPlan: Record<string, number>
  payingByAudience: Record<string, number>
  /** 0..1, or null when the audience is empty. */
  conversion: Record<string, number | null>
  month: {
    newPaid: number
    trialsStarted: number
    paidChurn: number
    trialsLost: number
    churnRate: number | null
    renewals: number
    failedPayments: number
  }
  funnel30Days: {
    premiumPageUsers: number
    paywallUsers: number
    paywallHitUsers: number
    checkouts: number
    activations: number
    notes: string[]
  }
  generatedAt: string
}
