import type { SpecialtyDTO } from "../dto/specialty.dto"
import type { Specialty } from "../model/specialty.model"

/** Drops the audit columns the entity leaks. */
export function toSpecialty(dto: SpecialtyDTO): Specialty {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
  }
}

export function toSpecialties(dtos: SpecialtyDTO[]): Specialty[] {
  return dtos.map(toSpecialty)
}
