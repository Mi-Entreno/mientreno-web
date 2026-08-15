import type { MercadoPagoConnectionStatus } from "../dto/mercado-pago.dto"

export interface MercadoPagoConnection {
  status: MercadoPagoConnectionStatus
  accountId: string | null
  nickname: string | null
  email: string | null
  connectedAt: string | null
  expiresAt: string | null
  liveMode: boolean
  scopes: string[]
  applicationFeePercent: number | null
}

interface StatusDescriptor {
  label: string
  description: string
  tone: "success" | "warning" | "danger" | "neutral"
}

const STATUSES: Record<MercadoPagoConnectionStatus, StatusDescriptor> = {
  NOT_CONNECTED: {
    label: "Sin vincular",
    description:
      "Vincula tu cuenta de Mercado Pago para que tus alumnos puedan pagar sus suscripciones.",
    tone: "neutral",
  },
  CONNECTED: {
    label: "Vinculada",
    description: "Los cobros de tus planes se acreditan en esta cuenta.",
    tone: "success",
  },
  EXPIRED: {
    label: "Vinculación caducada",
    description:
      "El permiso ha caducado y no se pueden crear cobros nuevos. Vuelve a vincular la cuenta para reanudarlos.",
    tone: "warning",
  },
  REVOKED: {
    label: "Permiso revocado",
    description:
      "Has retirado el permiso desde Mercado Pago. Los cobros están detenidos hasta que vuelvas a vincularla.",
    tone: "danger",
  },
}

export function describeConnection(status: MercadoPagoConnectionStatus): StatusDescriptor {
  return (
    STATUSES[status] ?? {
      label: "Estado desconocido",
      description: "No hemos podido interpretar el estado de la vinculación.",
      tone: "neutral",
    }
  )
}

/**
 * Whether charges can actually be created right now.
 *
 * EXPIRED and REVOKED are *linked* accounts that cannot charge, which is
 * precisely the case a naive `connection !== null` check gets wrong — and the
 * one that silently strands a student in PENDING_PAYMENT.
 */
export function isOperational(connection: MercadoPagoConnection | null | undefined): boolean {
  return connection?.status === "CONNECTED"
}

/** Anything other than a first-time link is a *re*-link, and says so. */
export function needsReconnect(connection: MercadoPagoConnection | null | undefined): boolean {
  return connection?.status === "EXPIRED" || connection?.status === "REVOKED"
}

/**
 * Result of the OAuth round trip, read from the query string of the callback
 * route. `error` is what Mercado Pago sends when the trainer refuses.
 */
export interface OAuthCallbackParams {
  code: string | null
  state: string | null
  error: string | null
}

export function readCallbackParams(params: URLSearchParams): OAuthCallbackParams {
  return {
    code: params.get("code"),
    state: params.get("state"),
    // Mercado Pago uses `error`; some flows answer `error_description` too.
    error: params.get("error") ?? params.get("error_description"),
  }
}
