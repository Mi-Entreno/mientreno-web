import type { MercadoPagoConnectionDTO } from "../dto/mercado-pago.dto"
import type { MercadoPagoConnection } from "../model/mercado-pago.model"

export function toMercadoPagoConnection(dto: MercadoPagoConnectionDTO): MercadoPagoConnection {
  return {
    // A missing status is treated as "not connected" rather than defaulting to
    // something usable: the failure mode of guessing wrong here is a screen
    // that claims charges work when they do not.
    status: dto.status ?? "NOT_CONNECTED",
    accountId: dto.mercadoPagoUserId ?? null,
    nickname: dto.nickname?.trim() || null,
    email: dto.email?.trim() || null,
    connectedAt: dto.connectedAt ?? null,
    expiresAt: dto.expiresAt ?? null,
    liveMode: dto.liveMode ?? false,
    scopes: dto.scopes ?? [],
    applicationFeePercent: dto.applicationFeePercent ?? null,
  }
}
