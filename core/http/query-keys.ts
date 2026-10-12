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
   * Merchant panel: identity only.
   *
   * The catalogue of products moved out entirely — a reward now lives inside the
   * challenge that grants it, under `qk.challenges`.
   */
  brand: {
    all: ["brand"] as const,
    profile: ["brand", "profile"] as const,
  },

  /**
   * Zona de administración.
   *
   * Namespace propio y no un rincón de `brand`: lo lee otra persona en otra
   * pantalla. Quedó reducido al padrón de comercios — los desafíos volvieron al
   * comercio, que ahora pone el premio, y la cola de moderación desapareció con
   * el catálogo de productos.
   */
  admin: {
    all: ["admin"] as const,
    brands: ["admin", "brands"] as const,
    membershipPlans: ["admin", "membership-plans"] as const,
    memberships: (status: string | null, page: number) =>
      ["admin", "memberships", status ?? "all", page] as const,
    membership: (id: number) => ["admin", "membership", id] as const,
    membershipMetrics: ["admin", "membership-metrics"] as const,
    /** The reps economy: the live config, its versions and its dashboard. */
    economy: ["admin", "economy"] as const,
    economyHistory: ["admin", "economy", "history"] as const,
    economyVersion: (id: number) => ["admin", "economy", "version", id] as const,
    economyMetrics: (months: number) => ["admin", "economy", "metrics", months] as const,
    wallets: (search: string) => ["admin", "wallets", search] as const,
    walletHistory: (studentId: number, page: number) => ["admin", "wallet-history", studentId, page] as const,
  },

  /**
   * The trainer's plan with the platform (Pro), not the plans they sell to
   * students — those are `subscriptionPlans`. One namespace for the membership
   * and what it unlocks, because they change together: a checkout, a cancel or
   * a renewal invalidates `qk.membership.all` and every gate re-reads.
   */
  /** The trainer's saved plans (Pro). Separate from `trainingPlans`, which are per subscription. */
  planTemplates: {
    all: ["plan-templates"] as const,
    list: ["plan-templates", "list"] as const,
  },

  /** Adherence dashboard (Pro): who trains and who is falling off. */
  adherence: ["adherence"] as const,

  membership: {
    all: ["membership"] as const,
    me: ["membership", "me"] as const,
    plans: ["membership", "plans"] as const,
    payments: ["membership", "payments"] as const,
    entitlements: ["membership", "entitlements"] as const,
  },

  /**
   * Desafíos del comercio. Namespace propio y no parte de `brand` porque un
   * desafío arrastra sus participantes y sus canjes: invalidar `qk.challenges.all`
   * después de publicar o entregar alcanza a las tres listas, y no tiene por qué
   * refrescar el perfil del comercio.
   */
  challenges: {
    all: ["challenges"] as const,
    list: (status?: string) => ["challenges", "list", status ?? "all"] as const,
    detail: (id: number) => ["challenges", "detail", id] as const,
    participants: (id: number) => ["challenges", "detail", id, "participants"] as const,
    redemptions: ["challenges", "redemptions"] as const,
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

  /**
   * Both ways of charging live under one prefix on purpose: approving a bank
   * transfer and a Mercado Pago webhook land in the same list, so
   * `invalidateQueries({ queryKey: qk.payments.all })` has to reach both.
   */
  payments: {
    all: ["payments"] as const,
    mercadoPago: ["payments", "mercado-pago"] as const,
    list: (filters: Record<string, unknown>) => ["payments", "list", filters] as const,
    pendingReview: ["payments", "pending-review"] as const,
    bankInfo: ["payments", "bank-info"] as const,
  },

  /**
   * Legal consents. Invalidated after accepting so the gate lets the user
   * through without a reload.
   */
  legal: {
    all: ["legal"] as const,
    myConsents: ["legal", "consents", "me"] as const,
  },
} as const
