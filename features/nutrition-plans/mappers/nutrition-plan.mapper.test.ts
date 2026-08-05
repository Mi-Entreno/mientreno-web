import { describe, expect, it } from "vitest"

import type { NutritionPlanResponseDTO } from "../dto/nutrition-plan.dto"
import {
  emptyMealFood,
  nextKey,
  sumFoodMacros,
  sumMealMacros,
  type EditorNutritionPlan,
} from "../model/nutrition-plan.model"
import {
  toCreateNutritionRequest,
  toEditorNutritionPlan,
  toNutritionPlan,
  toNutritionPlanBody,
} from "./nutrition-plan.mapper"

const RESPONSE: NutritionPlanResponseDTO = {
  id: 9,
  version: 2,
  title: "Definición · 1900 kcal",
  notes: "Bebe 2 L al día.",
  current: true,
  createdAt: "2026-07-10T09:00:00",
  meals: [
    // Out of order on purpose.
    {
      id: 52,
      order: 2,
      name: "Comida",
      timeOfDay: "LUNCH",
      calories: 700,
      proteinG: 45,
      carbsG: 60,
      fatG: 20,
      notes: null,
      foods: [
        { id: 91, foodName: "Pechuga de pollo", quantity: 150, unit: "g" },
        { id: 92, foodName: "Arroz", quantity: 80, unit: "g" },
      ],
    },
    {
      id: 51,
      order: 1,
      name: "Desayuno",
      timeOfDay: "BREAKFAST",
      calories: 400,
      proteinG: 25,
      carbsG: 40,
      fatG: 12,
      notes: "Antes de entrenar",
      foods: [],
    },
  ],
}

describe("toNutritionPlan", () => {
  it("sorts meals by order", () => {
    const plan = toNutritionPlan(RESPONSE)
    expect(plan.meals.map((meal) => meal.order)).toEqual([1, 2])
  })

  it("keeps the foods a meal carries", () => {
    const plan = toNutritionPlan(RESPONSE)
    expect(plan.meals[1].foods.map((food) => food.foodName)).toEqual([
      "Pechuga de pollo",
      "Arroz",
    ])
  })

  it("normalises null notes to empty strings", () => {
    const plan = toNutritionPlan({ ...RESPONSE, notes: null })
    expect(plan.notes).toBe("")
    expect(plan.meals[1].notes).toBe("")
  })
})

describe("sumMealMacros", () => {
  it("computes the daily totals the API does not provide", () => {
    // NutritionPlanResponseDTO has no plan-level macros — only MealResponse
    // does — so any "daily calories" figure has to be summed here.
    const totals = sumMealMacros(toNutritionPlan(RESPONSE).meals)

    expect(totals.calories).toBe(1100)
    expect(totals.protein).toBe(70)
    expect(totals.complete).toBe(true)
  })

  it("flags an incomplete total when a meal has no calories", () => {
    const meals = toNutritionPlan(RESPONSE).meals.map((meal, index) =>
      index === 0 ? { ...meal, calories: null } : meal,
    )
    const totals = sumMealMacros(meals)

    expect(totals.calories).toBe(700)
    expect(totals.complete).toBe(false)
  })

  it("is not complete for an empty plan", () => {
    expect(sumMealMacros([]).complete).toBe(false)
  })
})

describe("sumFoodMacros", () => {
  it("returns null when no food carries macros", () => {
    // A plan loaded from the API has none: MealFoodResponse stores only name,
    // quantity and unit.
    const loaded = toEditorNutritionPlan(toNutritionPlan(RESPONSE))
    expect(sumFoodMacros(loaded.meals[1].foods)).toBeNull()
  })

  it("adds up the macros of foods picked from the catalogue", () => {
    const foods = [
      {
        ...emptyMealFood(),
        foodName: "Pollo",
        macros: { calories: 248, protein: 46.5, carbs: 0, fat: 5.4, fiber: null },
      },
      {
        ...emptyMealFood(),
        foodName: "Arroz",
        macros: { calories: 280, protein: 5.6, carbs: 62, fat: 0.8, fiber: 1 },
      },
    ]

    const total = sumFoodMacros(foods)

    expect(total?.calories).toBe(528)
    expect(total?.protein).toBe(52.1)
    expect(total?.carbs).toBe(62)
  })
})

describe("toNutritionPlanBody", () => {
  const plan: EditorNutritionPlan = {
    title: "  Definición  ",
    notes: "   ",
    meals: [
      {
        key: nextKey("meal"),
        name: " Desayuno ",
        timeOfDay: "BREAKFAST",
        calories: "400",
        proteinG: "25,5",
        carbsG: "",
        fatG: "",
        notes: "",
        foods: [
          { ...emptyMealFood(), foodName: "Avena", quantity: "60", unit: "g" },
          // Blank row left behind by the editor.
          { ...emptyMealFood(), foodName: "  ", quantity: "", unit: "g" },
        ],
      },
      {
        key: nextKey("meal"),
        name: "Comida",
        timeOfDay: "LUNCH",
        calories: "",
        proteinG: "",
        carbsG: "",
        fatG: "",
        notes: "Sin sal",
        foods: [],
      },
    ],
  }

  it("derives order from position", () => {
    expect(toNutritionPlanBody(plan).meals.map((meal) => meal.order)).toEqual([1, 2])
  })

  it("trims names and nulls blank notes", () => {
    const body = toNutritionPlanBody(plan)

    expect(body.title).toBe("Definición")
    expect(body.notes).toBeNull()
    expect(body.meals[0].name).toBe("Desayuno")
  })

  it("drops food rows with no name, which would fail @NotBlank", () => {
    // Sending them would make bean validation reject the whole plan.
    expect(toNutritionPlanBody(plan).meals[0].foods).toHaveLength(1)
  })

  it("accepts a comma decimal separator in macros", () => {
    expect(toNutritionPlanBody(plan).meals[0].proteinG).toBe(25.5)
  })

  it("nulls unset macros rather than sending zero", () => {
    const body = toNutritionPlanBody(plan)

    expect(body.meals[0].carbsG).toBeNull()
    expect(body.meals[1].calories).toBeNull()
  })

  it("keeps the timeOfDay each meal declares", () => {
    expect(toNutritionPlanBody(plan).meals.map((meal) => meal.timeOfDay)).toEqual([
      "BREAKFAST",
      "LUNCH",
    ])
  })
})

describe("toCreateNutritionRequest", () => {
  it("adds the subscriptionId POST requires", () => {
    const request = toCreateNutritionRequest(
      { title: "Plan", notes: "", meals: [] },
      42,
    )

    expect(request.subscriptionId).toBe(42)
  })
})
