import type { FoodMacros } from "@/features/foods/model/food.model"

import type { TimeOfDay } from "../dto/nutrition-plan.dto"

export interface MealFood {
  id: number
  foodName: string
  quantity: number
  unit: string
}

export interface Meal {
  id: number
  order: number
  name: string
  timeOfDay: TimeOfDay
  calories: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  notes: string
  foods: MealFood[]
}

export interface NutritionPlan {
  id: number
  version: number
  title: string
  notes: string
  current: boolean
  createdAt: string
  meals: Meal[]
}

export interface StudentNutritionSummary {
  subscriptionId: number
  studentId: number
  studentName: string
  studentAvatarUrl: string | null
  currentPlan: NutritionPlan | null
}

// ── Editor state ─────────────────────────────────────────────────────────────

export interface EditorMealFood {
  key: string
  foodName: string
  /** String so an empty input stays empty rather than becoming 0. */
  quantity: string
  unit: string
  /**
   * Macros scaled at pick time, kept only in the editor.
   *
   * The backend stores nothing but name, quantity and unit for a meal food, so
   * this is lost on reload — which is why the auto-calculation is an explicit
   * action rather than a live binding.
   */
  macros: FoodMacros | null
}

export interface EditorMeal {
  key: string
  name: string
  timeOfDay: TimeOfDay
  calories: string
  proteinG: string
  carbsG: string
  fatG: string
  notes: string
  foods: EditorMealFood[]
}

export interface EditorNutritionPlan {
  title: string
  notes: string
  meals: EditorMeal[]
}

export const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: "BREAKFAST", label: "Desayuno" },
  { value: "MID_MORNING", label: "Media mañana" },
  { value: "LUNCH", label: "Comida" },
  { value: "SNACK", label: "Merienda" },
  { value: "PRE_WORKOUT", label: "Pre-entreno" },
  { value: "POST_WORKOUT", label: "Post-entreno" },
  { value: "DINNER", label: "Cena" },
]

export function timeOfDayLabel(value: TimeOfDay): string {
  return TIME_OF_DAY_OPTIONS.find((option) => option.value === value)?.label ?? value
}

let keySeed = 0
export function nextKey(prefix: string): string {
  keySeed += 1
  return `${prefix}-${keySeed}`
}

export function emptyMealFood(): EditorMealFood {
  return { key: nextKey("food"), foodName: "", quantity: "", unit: "g", macros: null }
}

export function emptyMeal(index: number): EditorMeal {
  const option = TIME_OF_DAY_OPTIONS[Math.min(index, TIME_OF_DAY_OPTIONS.length - 1)]

  return {
    key: nextKey("meal"),
    name: option.label,
    timeOfDay: option.value,
    calories: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
    notes: "",
    foods: [],
  }
}

export function emptyNutritionPlan(): EditorNutritionPlan {
  return { title: "", notes: "", meals: [emptyMeal(0)] }
}

export interface PlanTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  /** False when at least one meal has no macros, so the total understates. */
  complete: boolean
}

/**
 * Daily totals, summed from the meals.
 *
 * The API has no plan-level macros — `NutritionPlanResponseDTO` carries none,
 * only `MealResponse` does — so any "daily calories" figure has to be computed
 * here. `complete` reports whether every meal contributed, since a partially
 * filled plan would otherwise show a total that looks authoritative.
 */
export function sumMealMacros(
  meals: { calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null }[],
): PlanTotals {
  let complete = meals.length > 0

  const totals = meals.reduce(
    (acc, meal) => {
      if (meal.calories === null) complete = false
      return {
        calories: acc.calories + (meal.calories ?? 0),
        protein: acc.protein + (meal.proteinG ?? 0),
        carbs: acc.carbs + (meal.carbsG ?? 0),
        fat: acc.fat + (meal.fatG ?? 0),
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  const round = (value: number) => Math.round(value * 10) / 10

  return {
    calories: round(totals.calories),
    protein: round(totals.protein),
    carbs: round(totals.carbs),
    fat: round(totals.fat),
    complete,
  }
}

/** Sums the macros of the foods picked from the catalogue in this session. */
export function sumFoodMacros(foods: EditorMealFood[]): FoodMacros | null {
  const withMacros = foods.filter((food) => food.macros !== null)
  if (withMacros.length === 0) return null

  const add = (key: keyof FoodMacros) =>
    Math.round(
      withMacros.reduce((total, food) => total + (food.macros?.[key] ?? 0), 0) * 10,
    ) / 10

  return {
    calories: add("calories"),
    protein: add("protein"),
    carbs: add("carbs"),
    fat: add("fat"),
    fiber: add("fiber"),
  }
}

export type { TimeOfDay }
