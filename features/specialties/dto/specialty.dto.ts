/**
 * `GET /api/specialties` and `/api/specialties/search` return the JPA entity
 * `trainer/model/Specialty` directly, not a DTO — so the payload carries the
 * `BaseEntity` audit columns alongside the two fields that matter.
 *
 * Public endpoints (`permitAll`), no token required.
 */
export interface SpecialtyDTO {
  id: number
  name: string
  /** URL-safe form, e.g. "ganancia-de-masa-muscular". */
  slug: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}
