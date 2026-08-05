/** Literal mirrors of `plan/dto` for nutrition. Do not edit without the Java. */

/** `TimeOfDay.java`. `@NotNull` on the request — a meal must declare one. */
export type TimeOfDay =
  | "BREAKFAST"
  | "MID_MORNING"
  | "LUNCH"
  | "SNACK"
  | "PRE_WORKOUT"
  | "POST_WORKOUT"
  | "DINNER"

/** `MealFoodResponse`. Note there is no food id — only a stored name. */
export interface MealFoodResponseDTO {
  id: number
  foodName: string
  quantity: number
  unit: string
}

/** `MealResponse`. Macros are per meal; the plan has no totals of its own. */
export interface MealResponseDTO {
  id: number
  order: number
  name: string
  timeOfDay: TimeOfDay
  calories: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  notes: string | null
  foods: MealFoodResponseDTO[]
}

export interface NutritionPlanResponseDTO {
  id: number
  version: number
  title: string
  notes: string | null
  current: boolean
  createdAt: string
  meals: MealResponseDTO[]
}

/**
 * `MealFoodRequest` — every field is required
 * (`@NotBlank foodName`, `@NotNull quantity`, `@NotBlank unit`).
 *
 * There is no `foodId`: the plan stores the name as text, so nothing links back
 * to `/api/foods`.
 */
export interface MealFoodRequestDTO {
  foodName: string
  quantity: number
  unit: string
}

/** `MealRequest` — `order`, `name` and `timeOfDay` are required; macros are not. */
export interface MealRequestDTO {
  order: number
  name: string
  timeOfDay: TimeOfDay
  calories: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  notes: string | null
  foods: MealFoodRequestDTO[]
}

export interface CreateNutritionPlanRequestDTO {
  subscriptionId: number
  title: string
  notes: string | null
  meals: MealRequestDTO[]
}

export interface UpdateNutritionPlanRequestDTO {
  title: string
  notes: string | null
  meals: MealRequestDTO[]
}

export interface TrainerStudentNutritionSummaryDTO {
  subscriptionId: number
  studentId: number
  studentFullName: string | null
  studentImageUrl: string | null
  currentPlan: NutritionPlanResponseDTO | null
}
