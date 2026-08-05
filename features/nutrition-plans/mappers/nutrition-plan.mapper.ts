import { toMediaUrl } from "@/core/http/media"

import type {
  MealFoodRequestDTO,
  MealRequestDTO,
  MealResponseDTO,
  NutritionPlanResponseDTO,
  TrainerStudentNutritionSummaryDTO,
  UpdateNutritionPlanRequestDTO,
} from "../dto/nutrition-plan.dto"
import {
  emptyMeal,
  nextKey,
  type EditorMeal,
  type EditorMealFood,
  type EditorNutritionPlan,
  type Meal,
  type NutritionPlan,
  type StudentNutritionSummary,
} from "../model/nutrition-plan.model"

// ── Response -> model ────────────────────────────────────────────────────────

export function toMeal(dto: MealResponseDTO): Meal {
  return {
    id: dto.id,
    order: dto.order,
    name: dto.name,
    timeOfDay: dto.timeOfDay,
    calories: dto.calories,
    proteinG: dto.proteinG,
    carbsG: dto.carbsG,
    fatG: dto.fatG,
    notes: dto.notes ?? "",
    foods: (dto.foods ?? []).map((food) => ({
      id: food.id,
      foodName: food.foodName,
      quantity: food.quantity,
      unit: food.unit,
    })),
  }
}

export function toNutritionPlan(dto: NutritionPlanResponseDTO): NutritionPlan {
  return {
    id: dto.id,
    version: dto.version,
    title: dto.title,
    notes: dto.notes ?? "",
    current: dto.current,
    createdAt: dto.createdAt,
    meals: [...(dto.meals ?? [])].sort((a, b) => a.order - b.order).map(toMeal),
  }
}

export function toStudentNutritionSummary(
  dto: TrainerStudentNutritionSummaryDTO,
): StudentNutritionSummary {
  const name = dto.studentFullName?.trim()

  return {
    subscriptionId: dto.subscriptionId,
    studentId: dto.studentId,
    studentName: name && name.length > 0 ? name : "Alumno sin nombre",
    studentAvatarUrl: toMediaUrl(dto.studentImageUrl),
    currentPlan: dto.currentPlan ? toNutritionPlan(dto.currentPlan) : null,
  }
}

// ── Model -> editor ──────────────────────────────────────────────────────────

function toEditorMealFood(food: Meal["foods"][number]): EditorMealFood {
  return {
    key: nextKey("food"),
    foodName: food.foodName,
    quantity: String(food.quantity),
    unit: food.unit,
    // The API stores no macros per food, so a loaded plan cannot offer
    // auto-calculation until foods are re-picked from the catalogue.
    macros: null,
  }
}

function toEditorMeal(meal: Meal): EditorMeal {
  return {
    key: nextKey("meal"),
    name: meal.name,
    timeOfDay: meal.timeOfDay,
    calories: meal.calories === null ? "" : String(meal.calories),
    proteinG: meal.proteinG === null ? "" : String(meal.proteinG),
    carbsG: meal.carbsG === null ? "" : String(meal.carbsG),
    fatG: meal.fatG === null ? "" : String(meal.fatG),
    notes: meal.notes,
    foods: meal.foods.map(toEditorMealFood),
  }
}

export function toEditorNutritionPlan(plan: NutritionPlan): EditorNutritionPlan {
  return {
    title: plan.title,
    notes: plan.notes,
    meals: plan.meals.length > 0 ? plan.meals.map(toEditorMeal) : [emptyMeal(0)],
  }
}

// ── Editor -> request ────────────────────────────────────────────────────────

function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = Number(trimmed.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function toMealFoodRequest(food: EditorMealFood): MealFoodRequestDTO {
  return {
    foodName: food.foodName.trim(),
    // `quantity` is @NotNull upstream, so a blank input cannot be sent as null.
    quantity: toNumberOrNull(food.quantity) ?? 0,
    unit: food.unit.trim() || "g",
  }
}

function toMealRequest(meal: EditorMeal, index: number): MealRequestDTO {
  return {
    order: index + 1,
    name: meal.name.trim(),
    timeOfDay: meal.timeOfDay,
    calories: toNumberOrNull(meal.calories),
    proteinG: toNumberOrNull(meal.proteinG),
    carbsG: toNumberOrNull(meal.carbsG),
    fatG: toNumberOrNull(meal.fatG),
    notes: emptyToNull(meal.notes),
    // `foodName`, `quantity` and `unit` are all required, so a row missing a
    // name would fail validation for the whole plan. Dropping it is kinder
    // than rejecting everything the trainer wrote.
    foods: meal.foods
      .filter((food) => food.foodName.trim().length > 0)
      .map(toMealFoodRequest),
  }
}

export function toNutritionPlanBody(plan: EditorNutritionPlan): UpdateNutritionPlanRequestDTO {
  return {
    title: plan.title.trim(),
    notes: emptyToNull(plan.notes),
    meals: plan.meals.map(toMealRequest),
  }
}

export function toCreateNutritionRequest(plan: EditorNutritionPlan, subscriptionId: number) {
  return { subscriptionId, ...toNutritionPlanBody(plan) }
}
