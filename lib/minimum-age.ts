/**
 * Minimum age to use Mi Entreno: 18.
 *
 * The privacy policy declares it and the backend enforces it (`MinimumAge` in
 * fitness-backend, which answers 400 otherwise). Checking it here only moves the
 * message next to the field instead of after a round trip; the rule is still
 * the server's.
 */
export const MIN_AGE = 18

/**
 * Error for an ISO `YYYY-MM-DD` birth date, or null when it is fine.
 * `required` covers profile completion, where the backend demands the date.
 */
export function birthDateError(
  iso: string | null | undefined,
  { required, today = new Date() }: { required: boolean; today?: Date },
): string | null {
  const value = iso?.trim()
  if (!value) return required ? "La fecha de nacimiento es obligatoria" : null

  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return "Ingresá una fecha válida"

  // Compared as calendar dates, not instants: `new Date("1990-05-12")` is UTC
  // midnight, which in Argentina is still the 11th.
  const todayKey = today.getFullYear() * 10_000 + (today.getMonth() + 1) * 100 + today.getDate()
  const birthKey = year * 10_000 + month * 100 + day
  if (birthKey > todayKey) return "La fecha de nacimiento no puede ser futura"

  const adultKey = (year + MIN_AGE) * 10_000 + month * 100 + day
  if (adultKey > todayKey) return `Tenés que ser mayor de ${MIN_AGE} años para usar Mi Entreno`
  return null
}
