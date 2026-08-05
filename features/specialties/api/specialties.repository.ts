import { apiFetch } from "@/core/http/client"

import type { SpecialtyDTO } from "../dto/specialty.dto"
import { toSpecialties } from "../mappers/specialty.mapper"
import type { Specialty } from "../model/specialty.model"

/**
 * Specialty catalogue. Both endpoints are `permitAll` upstream, but they still
 * go through the BFF proxy so there is one network path to reason about.
 */
export const specialtiesRepository = {
  async list(): Promise<Specialty[]> {
    return toSpecialties(await apiFetch<SpecialtyDTO[]>("/api/specialties"))
  },

  async search(query: string): Promise<Specialty[]> {
    // `q` is @RequestParam without a default: omitting it is a 400.
    return toSpecialties(
      await apiFetch<SpecialtyDTO[]>("/api/specialties/search", { query: { q: query } }),
    )
  },
}
