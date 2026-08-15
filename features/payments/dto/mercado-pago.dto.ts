/**
 * Contract for the trainer's Mercado Pago connection.
 *
 * **Not implemented upstream.** `SecurityConfig` already leaves
 * `/api/payments/webhook/**` public and `SubscriptionDetailResponseDTO` already
 * carries `paymentProvider` / `externalPaymentId`, so the backend anticipates a
 * provider — but there is no OAuth onboarding, no stored credentials and no
 * preapproval. All of it is specified in `BACKEND_REQUIREMENTS.md` §5.
 *
 * The model is Mercado Pago's *marketplace* flow: each trainer authorises our
 * application over OAuth, we store their access/refresh token, and charges are
 * created **on their behalf**, so the money lands in the trainer's account and
 * our commission is taken as `application_fee`. The alternative — every trainer
 * pasting their own credentials — would put raw secrets in our database and in
 * this form, and is not worth considering.
 */

/**
 * `MercadoPagoConnectionStatus`.
 *
 *   NOT_CONNECTED -> the trainer never authorised us
 *   CONNECTED     -> usable credentials
 *   EXPIRED       -> the refresh token no longer works; needs re-authorising
 *   REVOKED       -> the trainer removed our app from their Mercado Pago account
 */
export type MercadoPagoConnectionStatus = "NOT_CONNECTED" | "CONNECTED" | "EXPIRED" | "REVOKED"

/** `GET /api/payments/mercadopago/connection`. Never carries tokens. */
export interface MercadoPagoConnectionDTO {
  status: MercadoPagoConnectionStatus
  /** Mercado Pago's `user_id` for the trainer's account, as a string. */
  mercadoPagoUserId: string | null
  nickname: string | null
  /** Masked upstream; shown only so the trainer can tell which account it is. */
  email: string | null
  connectedAt: string | null
  /** When the stored access token expires. Refresh is the backend's problem. */
  expiresAt: string | null
  /** false while the trainer's account is still in Mercado Pago's sandbox. */
  liveMode: boolean
  scopes: string[]
  /** Percentage this platform keeps from each charge, e.g. `10` for 10 %. */
  applicationFeePercent: number | null
}

/**
 * `POST /api/payments/mercadopago/oauth/url`.
 *
 * The authorisation URL is built server-side because it carries the client id
 * and a signed `state`. Building it in the browser would mean shipping both.
 */
export interface MercadoPagoAuthorizationDTO {
  authorizationUrl: string
  /** Opaque, single-use, bound to this trainer's session. */
  state: string
}

/** `POST /api/payments/mercadopago/oauth/callback`. */
export interface MercadoPagoCallbackRequestDTO {
  code: string
  state: string
}
