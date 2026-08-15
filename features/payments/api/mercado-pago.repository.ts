import { apiFetch } from "@/core/http/client"

import type {
  MercadoPagoAuthorizationDTO,
  MercadoPagoCallbackRequestDTO,
  MercadoPagoConnectionDTO,
} from "../dto/mercado-pago.dto"
import { toMercadoPagoConnection } from "../mappers/mercado-pago.mapper"
import type { MercadoPagoConnection } from "../model/mercado-pago.model"

const BASE = "/api/payments/mercadopago"

export const mercadoPagoRepository = {
  /** `GET /connection` — the trainer's own status. Never returns tokens. */
  async getConnection(): Promise<MercadoPagoConnection> {
    return toMercadoPagoConnection(await apiFetch<MercadoPagoConnectionDTO>(`${BASE}/connection`))
  },

  /**
   * `POST /oauth/url` — asks the backend for the URL to send the trainer to.
   *
   * POST rather than GET because it has a side effect: the backend mints and
   * stores a single-use `state` bound to this trainer, which is what makes the
   * callback verifiable (CSRF on the OAuth leg is otherwise wide open).
   */
  async getAuthorizationUrl(redirectPath: string): Promise<MercadoPagoAuthorizationDTO> {
    return apiFetch<MercadoPagoAuthorizationDTO>(`${BASE}/oauth/url`, {
      method: "POST",
      body: { redirectPath },
    })
  },

  /**
   * `POST /oauth/callback` — exchanges the authorisation code for tokens.
   *
   * The exchange happens server-side: it needs the client secret, which must
   * never reach the browser.
   */
  async completeAuthorization(input: MercadoPagoCallbackRequestDTO): Promise<MercadoPagoConnection> {
    return toMercadoPagoConnection(
      await apiFetch<MercadoPagoConnectionDTO>(`${BASE}/oauth/callback`, {
        method: "POST",
        body: input,
      }),
    )
  },

  /** `DELETE /connection` — 204. Existing subscriptions keep their history. */
  async disconnect(): Promise<void> {
    await apiFetch<void>(`${BASE}/connection`, { method: "DELETE" })
  },
}
