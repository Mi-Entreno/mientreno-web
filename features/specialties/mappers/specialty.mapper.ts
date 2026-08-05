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

/**
 * The trainer profile response lists specialties as plain names
 * (`List<String>`), while the create/update requests take ids
 * (`List<Long> specialtyIds`). Resolving names back to ids needs the catalogue.
 *
 * Matching is case- and accent-insensitive because the two sides come from
 * different columns and nothing guarantees identical casing.
 */
export function resolveSpecialtyIds(names: string[], catalogue: Specialty[]): number[] {
  const byName = new Map(catalogue.map((item) => [normalise(item.name), item.id]))

  return names
    .map((name) => byName.get(normalise(name)))
    .filter((id): id is number => id !== undefined)
}

function normalise(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    // Combining diacritical marks, escaped rather than literal so the source
    // stays readable and copy-paste safe.
    .replace(/[\u0300-\u036f]/g, "")
}
