/**
 * Typed React Query key factory.
 *
 * Keys used to be bare strings scattered across `lib/hooks.ts`, which made
 * cascading invalidation guesswork. Here every key is derived from a namespace
 * prefix, so invalidating `qk.trainingPlans.all` reaches every plan query
 * (current, history and the consolidated view) without listing them.
 */
export const qk = {
  session: ["session"] as const,

  userDetail: ["user-detail"] as const,
  preferences: ["preferences"] as const,

  trainerProfile: ["trainer-profile"] as const,

  specialties: {
    all: ["specialties"] as const,
    search: (q: string) => ["specialties", "search", q] as const,
  },

  subscriptionPlans: {
    all: ["subscription-plans"] as const,
    mine: ["subscription-plans", "mine"] as const,
  },

  /**
   * Merchant panel. Invalidating `qk.brand.all` reaches the profile, the
   * products and the redemption inbox — which is what a status change needs,
   * since approving or delivering moves more than one list.
   */
  brand: {
    all: ["brand"] as const,
    profile: ["brand", "profile"] as const,
    products: (status?: string) => ["brand", "products", status ?? "all"] as const,
    product: (id: number) => ["brand", "products", "detail", id] as const,
    redemptions: (status?: string) => ["brand", "redemptions", status ?? "all"] as const,
  },

  students: {
    all: ["students"] as const,
    list: ["students", "list"] as const,
    detail: (subscriptionId: number) => ["students", "detail", subscriptionId] as const,
  },

  trainingPlans: {
    all: ["training-plans"] as const,
    consolidated: ["training-plans", "consolidated"] as const,
    current: (subscriptionId: number) => ["training-plans", "current", subscriptionId] as const,
    history: (subscriptionId: number) => ["training-plans", "history", subscriptionId] as const,
  },

  nutritionPlans: {
    all: ["nutrition-plans"] as const,
    consolidated: ["nutrition-plans", "consolidated"] as const,
    current: (subscriptionId: number) => ["nutrition-plans", "current", subscriptionId] as const,
    history: (subscriptionId: number) => ["nutrition-plans", "history", subscriptionId] as const,
  },

  exercises: {
    all: ["exercises"] as const,
    detail: (exerciseId: number) => ["exercises", "detail", exerciseId] as const,
    videos: (exerciseId: number) => ["exercises", "videos", exerciseId] as const,
  },

  catalogExercises: {
    all: ["catalog-exercises"] as const,
    filters: ["catalog-exercises", "filters"] as const,
    search: (params: Record<string, unknown>) => ["catalog-exercises", "search", params] as const,
    detail: (id: number) => ["catalog-exercises", "detail", id] as const,
  },

  foods: {
    all: ["foods"] as const,
    search: (params: Record<string, unknown>) => ["foods", "search", params] as const,
    detail: (id: number) => ["foods", "detail", id] as const,
  },

  progress: {
    all: ["progress"] as const,
    bySubscription: (subscriptionId: number) => ["progress", "subscription", subscriptionId] as const,
    detail: (progressId: number) => ["progress", "detail", progressId] as const,
  },

  workoutSessions: {
    all: ["workout-sessions"] as const,
    detail: (sessionId: number) => ["workout-sessions", "detail", sessionId] as const,
  },

  notifications: {
    all: ["notifications"] as const,
    list: ["notifications", "list"] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },

  /** Candidate students the trainer can invite — not the roster. */
  studentSearch: {
    all: ["student-search"] as const,
    query: (params: Record<string, unknown>) => ["student-search", "query", params] as const,
  },

  planInvitations: {
    all: ["plan-invitations"] as const,
    /** Sent by this trainer, optionally narrowed to one status. */
    sent: (status: string | null) => ["plan-invitations", "sent", status] as const,
    counts: ["plan-invitations", "counts"] as const,
    /** Public read by opaque token — the student's side of the link. */
    byToken: (token: string) => ["plan-invitations", "token", token] as const,
  },

  payments: {
    all: ["payments"] as const,
    mercadoPago: ["payments", "mercado-pago"] as const,
  },
} as const
