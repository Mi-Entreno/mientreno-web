/**
 * Date conversion for the backend's two `LocalDate` wire formats.
 *
 * The backend has no global Jackson date configuration, so the format is
 * decided per field by `@JsonFormat`. The result is asymmetric — the same
 * logical value is read in one format and written in another:
 *
 *   GET  /api/user-detail          birthDate  ->  ISO  `1990-04-23`
 *   PUT  /api/user-detail          birthDate  <-  `23-04-1990`   @JsonFormat
 *   POST /api/user-detail          birthDate  <-  `23-04-1990`   @JsonFormat
 *   POST /api/trainer/profile/complete  birthDate  <-  ISO  `1990-04-23`
 *   CertificationRequestDTO issuedAt/expiresAt   <-  ISO
 *
 * Sending ISO where `dd-MM-yyyy` is expected fails deserialisation with a 400.
 *
 * These are deliberately string transforms rather than `Date` round-trips:
 * `new Date("1990-04-23")` parses as UTC midnight and renders as the previous
 * day for anyone west of Greenwich, which silently corrupts birth dates.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const DMY_DATE = /^(\d{2})-(\d{2})-(\d{4})$/

/** `yyyy-MM-dd` — what `<input type="date">` and most GET responses use. */
export type IsoDate = string

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value)
}

/**
 * ISO -> `dd-MM-yyyy`, for the endpoints annotated with that pattern.
 * Returns null for empty or malformed input rather than sending garbage.
 */
export function isoToDmy(value: string | null | undefined): string | null {
  if (!value) return null

  const match = ISO_DATE.exec(value.trim())
  if (!match) return null

  const [, year, month, day] = match
  return `${day}-${month}-${year}`
}

/** `dd-MM-yyyy` -> ISO, for reading anything that comes back in that shape. */
export function dmyToIso(value: string | null | undefined): IsoDate | null {
  if (!value) return null

  const match = DMY_DATE.exec(value.trim())
  if (!match) return null

  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

/**
 * Normalises whatever a `LocalDate` field returns into ISO.
 * Accepts ISO, `dd-MM-yyyy`, and ISO date-times (`2026-07-25T10:00:00`).
 */
export function toIsoDate(value: string | null | undefined): IsoDate | null {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  if (ISO_DATE.test(trimmed)) return trimmed
  if (DMY_DATE.test(trimmed)) return dmyToIso(trimmed)

  // LocalDateTime fields (createdAt, updatedAt) — keep the date part.
  const datePart = trimmed.split("T")[0]
  return ISO_DATE.test(datePart) ? datePart : null
}

/** Human-readable Spanish date for display. Falls back to the raw value. */
export function formatDisplayDate(value: string | null | undefined): string {
  const iso = toIsoDate(value)
  if (!iso) return "—"

  const [year, month, day] = iso.split("-").map(Number)
  // Constructed as local time, so no timezone shift.
  return new Date(year, month - 1, day).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
