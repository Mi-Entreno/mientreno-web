/**
 * DTOs of the economy admin endpoints (`/api/admin/economy*`, `/api/admin/wallets*`).
 * They mirror `EconomyConfig` and friends in the backend one to one: the config
 * is sent back exactly as received, and the backend validates it with a strict
 * mapper — an unknown field is a 400, not a silently ignored typo.
 */

export type EarnRuleType =
  | "PER_WORKOUT"
  | "WEEKLY_VOLUME"
  | "WEEKLY_WORKOUTS"
  | "MONTHLY_WORKOUTS"
  | "STREAK_DAYS"
  | "WELCOME_BONUS"
  | "NUTRITION_LOG"
  | "PERSONAL_RECORD"
  | "CHECK_IN"

export interface EarnRuleDTO {
  id: string
  type: EarnRuleType
  enabled: boolean
  reps: number
  label: string
  params: Record<string, number> | null
  /** Null = no cap of its own (the daily cap still applies). */
  monthlyCapReps: number | null
}

export interface WheelPrizeDTO {
  id: string
  label: string
  reps: number
  /** Relative weight; they do not need to add up to 100. */
  weight: number
  enabled: boolean
}

export interface EconomyConfigDTO {
  version: number
  challenges: { maxPerMonth: number }
  earning: { dailyCapReps: number; rules: EarnRuleDTO[] }
  wheel: { monthlySpin: boolean; spinEveryTrainingDays: number; prizes: WheelPrizeDTO[]; dailySpin: boolean }
  analytics: { occasionalMaxReps: number; activeMinReps: number } | null
}

export interface SaveEconomyRequestDTO {
  config: EconomyConfigDTO
  note?: string
}

export interface EconomyVersionDTO {
  id: number
  versionNo: number
  active: boolean
  createdAt: string
  note: string | null
  createdByEmail: string | null
}

export interface EconomyMonthStatsDTO {
  month: string
  earned: number
  spent: number
  refunded: number
  earnedByType: Record<string, number>
  unlocks: number
  earners: number
  medianEarned: number
  p90Earned: number
  occasional: number
  constant: number
  active: number
}

export interface EconomyMetricsDTO {
  versionNo: number
  totals: { wallets: number; outstandingBalance: number; lifetimeEarned: number; lifetimeSpent: number }
  months: EconomyMonthStatsDTO[]
  creditsThisMonth: { source: string; label: string; reps: number }[]
  reachability: { minChallengeCost: number | null; walletsAtOrAboveMin: number }
  profileThresholds: { occasionalMaxReps: number; activeMinReps: number }
  generatedAt: string
}

export interface AdminWalletStudentDTO {
  studentId: number
  email: string
  firstName: string | null
  lastName: string | null
  balance: number
  lifetimeEarned: number
  lifetimeSpent: number
}

export interface WalletDTO {
  balance: number
  lifetimeEarned: number
  lifetimeSpent: number
}

export interface LedgerEntryDTO {
  id: number
  type: string
  /** Signed: positive credits, negative spends. */
  reps: number
  balanceAfter: number
  reason: string | null
  createdAt: string
}

export interface WalletAdjustmentRequestDTO {
  delta: number
  reason: string
}
