export interface FoodMacros {
  /** All per 100 g, and all optional — the importer leaves gaps. */
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  fiber: number | null
}

export interface Food {
  id: number
  name: string
  brand: string | null
  category: string | null
  servingDescription: string | null
  macros: FoodMacros
}

export interface FoodSearchParams {
  search: string
  category: string | null
}

export const FOODS_PAGE_SIZE = 24

export const EMPTY_FOOD_SEARCH: FoodSearchParams = { search: "", category: null }

/** Label combining name and brand, which is how people recognise a product. */
export function foodLabel(food: Food): string {
  return food.brand ? `${food.name} · ${food.brand}` : food.name
}

export function hasMacros(macros: FoodMacros): boolean {
  return (
    macros.calories !== null ||
    macros.protein !== null ||
    macros.carbs !== null ||
    macros.fat !== null
  )
}

/**
 * Scales the per-100 g macros to a quantity in grams.
 *
 * Only grams can be scaled: the stored values are per 100 g and
 * `servingDescription` is unparsed free text, so there is no factor to convert
 * "1 taza" into grams. Phase 7 uses this to pre-fill a meal's totals, and must
 * fall back to manual entry for any other unit.
 */
export function scaleMacros(macros: FoodMacros, grams: number): FoodMacros {
  const factor = grams / 100

  const scale = (value: number | null) =>
    value === null ? null : Math.round(value * factor * 10) / 10

  return {
    calories: scale(macros.calories),
    protein: scale(macros.protein),
    carbs: scale(macros.carbs),
    fat: scale(macros.fat),
    fiber: scale(macros.fiber),
  }
}
