/**
 * Literal mirror of `nutrition/dto/response/FoodResponseDTO`.
 *
 * Every macro is a nullable `BigDecimal` and expressed **per 100 g**, whatever
 * `servingDescription` happens to say.
 */
export interface FoodResponseDTO {
  id: number
  name: string
  brand: string | null
  category: string | null
  /** Free text from the importer, e.g. "1 cup (240 ml)". Not machine-readable. */
  servingDescription: string | null
  caloriesPer100g: number | null
  proteinPer100g: number | null
  carbsPer100g: number | null
  fatPer100g: number | null
  fiberPer100g: number | null
}

/**
 * Query params for `GET /api/foods`.
 *
 *  - `q`: partial and case-insensitive, matched against **name OR brand**
 *    (`LOWER(f.name) LIKE :p OR LOWER(COALESCE(f.brand,'')) LIKE :p`).
 *  - `category`: **exact equality** (`f.category = :category`).
 *  - Paging is resolved by Spring's `Pageable`
 *    (`@PageableDefault(size = 20, sort = "name")`), so the params are the
 *    conventional `page` / `size`, already sorted by name.
 */
export interface FoodSearchQuery {
  q?: string
  category?: string
  page: number
  size: number
}
