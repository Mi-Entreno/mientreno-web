import type {
  EarnRuleDTO,
  EarnRuleType,
  EconomyConfigDTO,
  EconomyMetricsDTO,
  EconomyVersionDTO,
  WheelPrizeDTO,
} from "../dto/economy-admin.dto"

export type EconomyConfig = EconomyConfigDTO
export type EarnRule = EarnRuleDTO
export type WheelPrize = WheelPrizeDTO
export type EconomyMetrics = EconomyMetricsDTO
export type EconomyVersion = EconomyVersionDTO
export type { EarnRuleType }

export interface AdminWalletStudent {
  studentId: number
  email: string
  fullName: string
  balance: number
  lifetimeEarned: number
  lifetimeSpent: number
}

export interface LedgerEntry {
  id: number
  type: string
  reps: number
  balanceAfter: number
  reason: string | null
  createdAt: string
}

// ── Rule catalogue ─────────────────────────────────────────────────────────

interface ParamMeta {
  key: string
  label: string
  min: number
}

interface RuleTypeMeta {
  label: string
  /** When the backend evaluates it — the admin needs to know what triggers a payment. */
  trigger: string
  params: ParamMeta[]
  /** One-off rules never repeat within a month, so a monthly cap means nothing. */
  monthlyCap: boolean
}

/**
 * What each rule type means. Mirrors `EarnRuleType` in the backend; a type that
 * is missing here would still save fine, it would just render without help text.
 */
export const RULE_TYPES: Record<EarnRuleType, RuleTypeMeta> = {
  PER_WORKOUT: {
    label: "Por entrenamiento",
    trigger: "Cada entrenamiento válido (pasa el antifraude de series y minutos).",
    params: [],
    monthlyCap: true,
  },
  WEEKLY_WORKOUTS: {
    label: "Constancia semanal",
    trigger: "Una vez por semana, al llegar a N entrenamientos.",
    params: [{ key: "targetWorkouts", label: "Entrenamientos", min: 1 }],
    monthlyCap: true,
  },
  WEEKLY_VOLUME: {
    label: "Volumen semanal",
    trigger: "Una vez por semana, al acumular N kg levantados.",
    params: [{ key: "targetKg", label: "Kg en la semana", min: 1 }],
    monthlyCap: true,
  },
  MONTHLY_WORKOUTS: {
    label: "Desafío mensual",
    trigger: "Una vez por mes, al llegar a N entrenamientos.",
    params: [{ key: "targetWorkouts", label: "Entrenamientos", min: 1 }],
    monthlyCap: true,
  },
  STREAK_DAYS: {
    label: "Racha",
    trigger: "Al llegar a N días seguidos entrenando; vuelve a pagar sólo si la racha se corta y se rehace.",
    params: [{ key: "days", label: "Días seguidos", min: 2 }],
    monthlyCap: true,
  },
  NUTRITION_LOG: {
    label: "Registro de comida",
    trigger: "Una vez por día, al registrar una comida. No mira calorías ni macros.",
    params: [],
    monthlyCap: true,
  },
  PERSONAL_RECORD: {
    label: "Marca personal",
    trigger: "Una vez por entrenamiento, al superar el peso máximo de un ejercicio con historial.",
    params: [],
    monthlyCap: true,
  },
  CHECK_IN: {
    label: "Check-in diario",
    trigger: "Una vez por día, al abrir la app.",
    params: [],
    monthlyCap: true,
  },
  WELCOME_BONUS: {
    label: "Bienvenida",
    trigger: "Una sola vez, la primera vez que el alumno abre su billetera.",
    params: [],
    monthlyCap: false,
  },
}

export const RULE_TYPE_ORDER: EarnRuleType[] = [
  "PER_WORKOUT",
  "WEEKLY_WORKOUTS",
  "WEEKLY_VOLUME",
  "MONTHLY_WORKOUTS",
  "STREAK_DAYS",
  "NUTRITION_LOG",
  "PERSONAL_RECORD",
  "CHECK_IN",
  "WELCOME_BONUS",
]

/** "Registro de comida extra" → "registro-de-comida-extra". Ids cannot contain ":". */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** A fresh rule of a type, with an id that does not collide with the existing ones. */
export function newRule(type: EarnRuleType, existingIds: string[]): EarnRule {
  const meta = RULE_TYPES[type]
  const base = slugify(meta.label) || "regla"
  let id = base
  for (let n = 2; existingIds.includes(id); n++) id = `${base}-${n}`
  return {
    id,
    type,
    enabled: false,
    reps: 10,
    label: meta.label,
    params: meta.params.length ? Object.fromEntries(meta.params.map((p) => [p.key, Math.max(p.min, 1)])) : null,
    monthlyCapReps: null,
  }
}

// ── Wheel ──────────────────────────────────────────────────────────────────

export function activePrizes(prizes: WheelPrize[]): WheelPrize[] {
  return prizes.filter((p) => p.enabled)
}

/** Chance of each active prize, by id. Zero everywhere when no weight is set. */
export function prizeProbabilities(prizes: WheelPrize[]): Record<string, number> {
  const active = activePrizes(prizes)
  const total = active.reduce((sum, p) => sum + p.weight, 0)
  return Object.fromEntries(active.map((p) => [p.id, total > 0 ? p.weight / total : 0]))
}

/** Reps a spin pays on average — same formula as `Wheel.expectedRepsPerSpin` in the backend. */
export function expectedRepsPerSpin(prizes: WheelPrize[]): number {
  const active = activePrizes(prizes)
  const total = active.reduce((sum, p) => sum + p.weight, 0)
  if (total <= 0) return 0
  return active.reduce((sum, p) => sum + p.reps * p.weight, 0) / total
}

// ── Simulation ─────────────────────────────────────────────────────────────

export type ProfileId = "occasional" | "constant" | "active"

/**
 * The three profiles of the points model (V2), with the behaviour assumed for
 * each. These are planning assumptions, not measurements — the dashboard tab
 * shows the real distribution to recalibrate them.
 */
export interface Profile {
  id: ProfileId
  label: string
  /** "6 de cada 10", as the model states it. */
  share: string
  /** The monthly reps range the model aims at for this profile. */
  target: [number, number]
  workoutsPerMonth: number
  weeklyVolumeKg: number
  nutritionDays: number
  checkInDays: number
  personalRecords: number
}

export const PROFILES: Profile[] = [
  {
    id: "occasional", label: "Ocasional", share: "6 de cada 10", target: [100, 200],
    workoutsPerMonth: 6, weeklyVolumeKg: 3_000, nutritionDays: 5, checkInDays: 10, personalRecords: 1,
  },
  {
    id: "constant", label: "Constante", share: "2 de cada 10", target: [250, 400],
    workoutsPerMonth: 13, weeklyVolumeKg: 8_000, nutritionDays: 15, checkInDays: 20, personalRecords: 2,
  },
  {
    id: "active", label: "Muy activo", share: "2 de cada 10", target: [500, 700],
    workoutsPerMonth: 22, weeklyVolumeKg: 14_000, nutritionDays: 25, checkInDays: 28, personalRecords: 3,
  },
]

const WEEKS_PER_MONTH = 4

export interface SimulationLine {
  label: string
  reps: number
}

export interface ProfileSimulation {
  profile: Profile
  total: number
  lines: SimulationLine[]
  status: "below" | "within" | "above"
}

/** How many times a rule would pay a profile in a month, before caps. */
function occurrences(rule: EarnRule, profile: Profile): number {
  const workoutsPerWeek = profile.workoutsPerMonth / WEEKS_PER_MONTH
  const param = (key: string) => rule.params?.[key] ?? 0
  switch (rule.type) {
    case "PER_WORKOUT":
      return profile.workoutsPerMonth
    case "WEEKLY_WORKOUTS":
      return workoutsPerWeek >= param("targetWorkouts") ? WEEKS_PER_MONTH : 0
    case "WEEKLY_VOLUME":
      return profile.weeklyVolumeKg >= param("targetKg") ? WEEKS_PER_MONTH : 0
    case "MONTHLY_WORKOUTS":
      return profile.workoutsPerMonth >= param("targetWorkouts") ? 1 : 0
    case "STREAK_DAYS": {
      // A streak needs a training day every day; only someone who trains
      // `days` days in a row — i.e. at least that many per week — reaches it.
      const days = param("days")
      return days > 0 && workoutsPerWeek >= Math.min(days, 7) ? Math.floor(30 / days) : 0
    }
    case "NUTRITION_LOG":
      return profile.nutritionDays
    case "PERSONAL_RECORD":
      return profile.personalRecords
    case "CHECK_IN":
      return profile.checkInDays
    case "WELCOME_BONUS":
      return 0
  }
}

/** Spins a profile gets in a month with the current wheel rules. */
export function spinsPerMonth(wheel: EconomyConfig["wheel"], profile: Profile): number {
  let spins = wheel.monthlySpin ? 1 : 0
  if (wheel.spinEveryTrainingDays > 0) spins += Math.floor(profile.workoutsPerMonth / wheel.spinEveryTrainingDays)
  if (wheel.dailySpin) spins += profile.checkInDays
  return spins
}

/**
 * Reps each profile would earn in a month with this economy, rule by rule,
 * with monthly caps applied. The welcome bonus is left out (it is one-off) and
 * so is the daily cap, which only bites on unusual days.
 */
export function simulate(config: EconomyConfig): ProfileSimulation[] {
  return PROFILES.map((profile) => {
    const lines: SimulationLine[] = []
    for (const rule of config.earning.rules) {
      if (!rule.enabled) continue
      let reps = rule.reps * occurrences(rule, profile)
      if (rule.monthlyCapReps !== null && rule.monthlyCapReps !== undefined) reps = Math.min(reps, rule.monthlyCapReps)
      if (reps > 0) lines.push({ label: rule.label, reps })
    }
    const wheelReps = Math.round(spinsPerMonth(config.wheel, profile) * expectedRepsPerSpin(config.wheel.prizes))
    if (wheelReps > 0) lines.push({ label: "Ruleta (promedio)", reps: wheelReps })

    const total = lines.reduce((sum, line) => sum + line.reps, 0)
    const [min, max] = profile.target
    return { profile, total, lines, status: total < min ? "below" : total > max ? "above" : "within" }
  })
}

/** Months a profile needs to afford something that costs `cost` reps. */
export function monthsToAfford(cost: number, monthlyReps: number): number | null {
  if (monthlyReps <= 0) return null
  return Math.ceil((cost / monthlyReps) * 10) / 10
}

// ── Validation ─────────────────────────────────────────────────────────────

/**
 * Same rules as `EconomyConfigLoader.validate` in the backend, so the save
 * button can say what is wrong before the round trip. The backend stays the
 * authority: anything that slips through here comes back as a 400.
 */
export function validateEconomy(config: EconomyConfig): string[] {
  const errors: string[] = []
  if (config.challenges.maxPerMonth < 1) errors.push("Los desbloqueos por mes tienen que ser al menos 1.")
  if (config.earning.dailyCapReps < 1) errors.push("El tope diario tiene que ser al menos 1.")

  const ids = new Set<string>()
  for (const rule of config.earning.rules) {
    const name = rule.label || rule.id
    if (!rule.id.trim()) errors.push("Hay una regla sin id.")
    if (rule.id.includes(":")) errors.push(`El id de "${name}" no puede tener ":".`)
    if (ids.has(rule.id)) errors.push(`Dos reglas con el id "${rule.id}".`)
    ids.add(rule.id)
    if (!Number.isInteger(rule.reps) || rule.reps < 1) errors.push(`"${name}" tiene que pagar al menos 1 repe.`)
    if (!rule.label.trim()) errors.push(`La regla "${rule.id}" necesita un texto para el alumno.`)
    if (rule.monthlyCapReps !== null && rule.monthlyCapReps < rule.reps) {
      errors.push(`El tope mensual de "${name}" es menor a lo que paga una vez: no pagaría nunca.`)
    }
    for (const param of RULE_TYPES[rule.type]?.params ?? []) {
      if ((rule.params?.[param.key] ?? 0) < param.min) {
        errors.push(`"${name}": ${param.label.toLowerCase()} tiene que ser al menos ${param.min}.`)
      }
    }
  }

  const prizeIds = new Set<string>()
  for (const prize of config.wheel.prizes) {
    if (!prize.id.trim()) errors.push("Hay un premio de la ruleta sin id.")
    if (prizeIds.has(prize.id)) errors.push(`Dos premios con el id "${prize.id}".`)
    prizeIds.add(prize.id)
    if (!prize.label.trim()) errors.push(`El premio "${prize.id}" necesita un texto.`)
    if (prize.reps < 0) errors.push(`El premio "${prize.label}" no puede dar repes negativas.`)
    if (prize.weight < 0) errors.push(`El premio "${prize.label}" no puede tener peso negativo.`)
  }
  if (config.wheel.spinEveryTrainingDays < 0) errors.push("Los días por tirada no pueden ser negativos.")
  const wheelOn = config.wheel.monthlySpin || config.wheel.dailySpin || config.wheel.spinEveryTrainingDays > 0
  const totalWeight = activePrizes(config.wheel.prizes).reduce((sum, p) => sum + p.weight, 0)
  if (wheelOn && totalWeight <= 0) errors.push("La ruleta está prendida pero ningún premio activo tiene peso.")

  if (config.analytics && config.analytics.activeMinReps <= config.analytics.occasionalMaxReps) {
    errors.push("El umbral de \"muy activo\" tiene que ser mayor que el de \"ocasional\".")
  }
  return errors
}

// ── Diff ───────────────────────────────────────────────────────────────────

/** What changed between two economies, in sentences — the confirmation step reads it out. */
export function diffEconomy(before: EconomyConfig, after: EconomyConfig): string[] {
  const changes: string[] = []
  const num = (label: string, a: number | null | undefined, b: number | null | undefined) => {
    if (a !== b) changes.push(`${label}: ${a ?? "sin tope"} → ${b ?? "sin tope"}`)
  }

  num("Desbloqueos por mes", before.challenges.maxPerMonth, after.challenges.maxPerMonth)
  num("Tope diario", before.earning.dailyCapReps, after.earning.dailyCapReps)

  const beforeRules = new Map(before.earning.rules.map((r) => [r.id, r]))
  const afterIds = new Set(after.earning.rules.map((r) => r.id))
  for (const rule of after.earning.rules) {
    const old = beforeRules.get(rule.id)
    if (!old) {
      changes.push(`Regla nueva: ${rule.label} (${rule.reps} repes${rule.enabled ? "" : ", apagada"})`)
      continue
    }
    if (old.enabled !== rule.enabled) changes.push(`${rule.label}: ${rule.enabled ? "prendida" : "apagada"}`)
    num(`${rule.label} · repes`, old.reps, rule.reps)
    num(`${rule.label} · tope mensual`, old.monthlyCapReps, rule.monthlyCapReps)
    if (old.label !== rule.label) changes.push(`Texto: "${old.label}" → "${rule.label}"`)
    for (const [key, value] of Object.entries(rule.params ?? {})) {
      num(`${rule.label} · ${key}`, old.params?.[key], value)
    }
  }
  for (const rule of before.earning.rules) {
    if (!afterIds.has(rule.id)) changes.push(`Regla quitada: ${rule.label}`)
  }

  const w0 = before.wheel
  const w1 = after.wheel
  if (w0.monthlySpin !== w1.monthlySpin) changes.push(`Tirada mensual: ${w1.monthlySpin ? "prendida" : "apagada"}`)
  if (w0.dailySpin !== w1.dailySpin) changes.push(`Tirada diaria: ${w1.dailySpin ? "prendida" : "apagada"}`)
  num("Días entrenados por tirada", w0.spinEveryTrainingDays, w1.spinEveryTrainingDays)
  const ev0 = expectedRepsPerSpin(w0.prizes)
  const ev1 = expectedRepsPerSpin(w1.prizes)
  if (JSON.stringify(w0.prizes) !== JSON.stringify(w1.prizes)) {
    changes.push(`Premios de la ruleta: promedio por tirada ${formatDecimal(ev0)} → ${formatDecimal(ev1)} repes`)
  }

  num("Umbral ocasional", before.analytics?.occasionalMaxReps, after.analytics?.occasionalMaxReps)
  num("Umbral muy activo", before.analytics?.activeMinReps, after.analytics?.activeMinReps)
  return changes
}

// ── Formatting ─────────────────────────────────────────────────────────────

export function formatDecimal(value: number): string {
  return value.toLocaleString("es-AR", { maximumFractionDigits: 1 })
}

export function formatReps(value: number): string {
  return value.toLocaleString("es-AR")
}

export function formatPercent(value: number): string {
  return `${(value * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })} %`
}

/** "2026-09" → "sep 2026". */
export function formatMonth(month: string): string {
  const [year, m] = month.split("-").map(Number)
  if (!year || !m) return month
  return new Date(year, m - 1, 1).toLocaleDateString("es-AR", { month: "short", year: "numeric" })
}

export const LEDGER_TYPE_LABELS: Record<string, string> = {
  WORKOUT_EARN: "Entrenamiento",
  RULE_EARN: "Regla",
  WELCOME_BONUS: "Bienvenida",
  WHEEL_PRIZE: "Ruleta",
  CHALLENGE_UNLOCK: "Desbloqueo",
  CHALLENGE_REFUND: "Reintegro",
  MANUAL_ADJUSTMENT: "Ajuste manual",
}

/** Parses a whole number field; empty is null when `allowEmpty`, otherwise invalid. */
export function parseWhole(raw: string, allowEmpty = false): { ok: true; value: number | null } | { ok: false } {
  const trimmed = raw.trim()
  if (trimmed === "") return allowEmpty ? { ok: true, value: null } : { ok: false }
  if (!/^-?\d+$/.test(trimmed)) return { ok: false }
  return { ok: true, value: Number(trimmed) }
}
