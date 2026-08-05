import type { FoodResponseDTO } from "../dto/food.dto"
import type { Food } from "../model/food.model"

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function toFood(dto: FoodResponseDTO): Food {
  return {
    id: dto.id,
    name: dto.name,
    brand: blankToNull(dto.brand),
    category: blankToNull(dto.category),
    servingDescription: blankToNull(dto.servingDescription),
    macros: {
      calories: dto.caloriesPer100g,
      protein: dto.proteinPer100g,
      carbs: dto.carbsPer100g,
      fat: dto.fatPer100g,
      fiber: dto.fiberPer100g,
    },
  }
}

/**
 * Distinct categories present in a set of results, sorted.
 *
 * The backend exposes no equivalent of `/api/catalog-exercises/filters` for
 * foods, so there is no authoritative list of categories to offer. Harvesting
 * them from what has already loaded gives a way to narrow a result set without
 * inventing values that `f.category = :category` would never match.
 *
 * It is a refinement of what is on screen, not a catalogue-wide filter — the UI
 * says so.
 */
export function collectCategories(foods: Food[]): string[] {
  const categories = new Set<string>()
  for (const food of foods) {
    if (food.category) categories.add(food.category)
  }
  return [...categories].sort((a, b) => a.localeCompare(b, "es"))
}
