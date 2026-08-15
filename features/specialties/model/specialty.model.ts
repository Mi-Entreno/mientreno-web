export interface Specialty {
  id: number
  name: string
  slug: string
}

/** `specialties.name` is VARCHAR(100) upstream. */
export const MAX_SPECIALTY_LENGTH = 100

/** Mirrors `SpecialtyResolver.MAX_PER_TRAINER`. */
export const MAX_SPECIALTIES_PER_TRAINER = 12

/**
 * The comparison the backend uses to decide two specialties are the same one.
 *
 * `SpecialtyResolver.slugify` strips accents, lowercases and collapses
 * everything that is not a letter or a digit, so "Preparación Física" and
 * "preparacion-fisica" resolve to a single row. Repeating the rule here is
 * deliberate: the form must not let a trainer add what the server would then
 * silently merge, because the chip they typed would vanish on the next load
 * with no explanation.
 */
export function specialtyKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    // Combining diacritical marks, escaped rather than literal so the source
    // stays readable and copy-paste safe.
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function isDuplicateSpecialty(existing: string[], candidate: string): boolean {
  const key = specialtyKey(candidate)
  return key.length > 0 && existing.some((item) => specialtyKey(item) === key)
}

/**
 * Adds a typed specialty, or returns the list untouched when there is nothing
 * to add — blank, a duplicate, or the cap already reached.
 *
 * Returning the same reference on a no-op lets the caller skip a state update
 * (and the re-render) without comparing arrays.
 */
export function addSpecialty(
  existing: string[],
  candidate: string,
  max: number = MAX_SPECIALTIES_PER_TRAINER,
): string[] {
  // Collapse internal whitespace the same way the server does, so "Cross  Fit"
  // is stored and displayed as the trainer meant it.
  const name = candidate.trim().replace(/\s+/g, " ").slice(0, MAX_SPECIALTY_LENGTH)

  if (!name) return existing
  if (existing.length >= max) return existing
  if (isDuplicateSpecialty(existing, name)) return existing

  return [...existing, name]
}

/**
 * Cleans a list coming from anywhere — a loaded profile, a paste, an older
 * build — into what the form and the request can both hold.
 */
export function normaliseSpecialties(
  names: readonly (string | null | undefined)[],
  max: number = MAX_SPECIALTIES_PER_TRAINER,
): string[] {
  return names.reduce<string[]>((acc, name) => addSpecialty(acc, name ?? "", max), [])
}
