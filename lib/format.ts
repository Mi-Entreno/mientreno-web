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

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)
}
