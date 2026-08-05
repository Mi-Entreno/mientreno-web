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

  trainers: {
    all: ["trainers"] as const,
    search: (params: Record<string, unknown>) => ["trainers", "search", params] as const,
    detail: (id: number) => ["trainers", "detail", id] as const,
    reviews: (id: number) => ["trainers", "reviews", id] as const,
    reviewDistribution: (id: number) => ["trainers", "reviews", id, "distribution"] as const,
  },
} as const
