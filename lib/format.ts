import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

export function formatDate(value?: string): string {
  if (!value) return "—"
  try {
    return format(parseISO(value), "d MMM yyyy", { locale: es })
  } catch {
    return value
  }
}

/** Avatar fallback: the first two initials of a full name. */
export function initialsOf(fullName?: string | null): string {
  const initials = (fullName ?? "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")

  return initials.toUpperCase() || "T"
}

/**
 * Prices are in Argentine pesos.
 *
 * `currencyDisplay: "narrowSymbol"` is explicit rather than implied: the
 * default for ARS outside `es-AR` is `"ARS 25.000"`, and the product only wants
 * the `$`. Pinning the locale to `es-AR` also fixes the separators — `25.000`,
 * not `25,000` — regardless of the browser's own locale.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(value)
}

/** For input labels and prefixes, where `formatCurrency` has no amount to format. */
export const CURRENCY_SYMBOL = "$"
