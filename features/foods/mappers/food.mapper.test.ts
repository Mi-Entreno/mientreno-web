import { describe, expect, it } from "vitest"

import type { FoodResponseDTO } from "../dto/food.dto"
import { scaleMacros, type Food } from "../model/food.model"
import { collectCategories, toFood } from "./food.mapper"

const DTO: FoodResponseDTO = {
  id: 7,
  name: "Pechuga de pollo",
  brand: "Hacendado",
  category: "Carnes",
  servingDescription: "1 filete (120 g)",
  caloriesPer100g: 165,
  proteinPer100g: 31,
  carbsPer100g: 0,
  fatPer100g: 3.6,
  fiberPer100g: null,
}

describe("toFood", () => {
  it("groups the per-100g values into macros", () => {
    const food = toFood(DTO)

    expect(food.macros).toEqual({
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: null,
    })
  })

  it("keeps a zero macro distinct from a missing one", () => {
    // 0 g of carbs is a measurement; null is "the importer had no value".
    const food = toFood(DTO)

    expect(food.macros.carbs).toBe(0)
    expect(food.macros.fiber).toBeNull()
  })

  it("collapses blank strings to null", () => {
    const food = toFood({ ...DTO, brand: "   ", category: null, servingDescription: "" })

    expect(food.brand).toBeNull()
    expect(food.category).toBeNull()
    expect(food.servingDescription).toBeNull()
  })
})

describe("collectCategories", () => {
  // There is no /api/foods/categories endpoint, so the filter values can only
  // come from results already loaded.
  const foods: Food[] = [
    toFood(DTO),
    toFood({ ...DTO, id: 8, category: "Lácteos" }),
    toFood({ ...DTO, id: 9, category: "Carnes" }),
    toFood({ ...DTO, id: 10, category: null }),
  ]

  it("returns distinct categories, sorted", () => {
    expect(collectCategories(foods)).toEqual(["Carnes", "Lácteos"])
  })

  it("ignores foods with no category", () => {
    expect(collectCategories([toFood({ ...DTO, category: null })])).toEqual([])
  })
})

describe("scaleMacros", () => {
  it("scales from the stored per-100g basis", () => {
    const scaled = scaleMacros(toFood(DTO).macros, 150)

    expect(scaled.calories).toBe(247.5)
    expect(scaled.protein).toBe(46.5)
  })

  it("keeps missing macros missing rather than turning them into zero", () => {
    expect(scaleMacros(toFood(DTO).macros, 150).fiber).toBeNull()
  })

  it("handles a quantity below 100 g", () => {
    expect(scaleMacros(toFood(DTO).macros, 50).calories).toBe(82.5)
  })

  it("rounds to one decimal", () => {
    // 3.6 * 0.37 = 1.332
    expect(scaleMacros(toFood(DTO).macros, 37).fat).toBe(1.3)
  })

  it("returns zeroes for a zero quantity", () => {
    expect(scaleMacros(toFood(DTO).macros, 0).calories).toBe(0)
  })
})
