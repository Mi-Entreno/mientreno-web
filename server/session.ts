import type { NextRequest } from "next/server"

import { decodeAccessToken, type AccessTokenClaims } from "./jwt"

/**
 * Session cookie: encoding, options and request-side reads.
 *
 * Middleware-safe — this module must stay free of `next/headers`, which is not
 * available in the Edge middleware runtime. Route handlers use
 * `server/session-store.ts` for reads and writes.
 *
 * ## What the cookie holds
 *
 * Only the two tokens:
 *
 *     { a: <accessToken>, r: <refreshToken> }
 *
 * Everything else — role, userId, profileCompleted, expiry — is derived by
 * decoding the access token (`server/jwt.ts`). Copying those claims into the
 * cookie alongside the token would mean two sources of truth that drift apart
 * the moment a token is refreshed, and would need signing or encryption to be
 * trustworthy. Deriving them removes both problems: the JWT is issued and
 * signed by the backend, so it cannot be edited to say something the backend
 * will honour.
 *
 * The previous cookie stored the bare access token and discarded the refresh
 * token entirely, which capped every session at the backend's 30-minute token
 * lifetime.
 */

export const SESSION_COOKIE = "trainer_session"

/**
 * How long a session survives without being used.
 *
 * Deliberately shorter than the refresh token behind it, which lives 30 days
 * upstream (`RefreshTokenService.EXPIRY_DAYS`). Matching that number meant a
 * browser stayed signed in for a month, which is a long time for a panel that
 * holds other people's health data and a linked payment account.
 *
 * It is an **idle** window, not a hard cap. `ensureFreshSession` rewrites the
 * cookie every time it rotates the access token — which happens on the first
 * API call after the 30-minute token expires, so on any visit a day or more
 * apart. A trainer who opens the panel weekly is never signed out; one who
 * disappears for eight days signs in again.
 *
 * The upstream refresh token is not revoked when this lapses: nobody holds it
 * any more, and it expires on its own. Signing out explicitly *does* revoke it
 * (`app/auth/logout/route.ts`).
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export interface StoredSession {
  accessToken: string
  refreshToken: string
}

export interface Session extends StoredSession {
  claims: AccessTokenClaims
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
  const withPadding = padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "=")
  const binary = atob(withPadding)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeSession(session: StoredSession): string {
  return toBase64Url(JSON.stringify({ a: session.accessToken, r: session.refreshToken }))
}

export function decodeSession(raw: string | undefined | null): StoredSession | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(fromBase64Url(raw)) as { a?: unknown; r?: unknown }
    if (typeof parsed.a !== "string" || !parsed.a) return null

    return {
      accessToken: parsed.a,
      refreshToken: typeof parsed.r === "string" ? parsed.r : "",
    }
  } catch {
    return null
  }
}

/** Decodes a stored session and attaches its claims, or null if unreadable. */
export function hydrate(stored: StoredSession | null): Session | null {
  if (!stored) return null
  const claims = decodeAccessToken(stored.accessToken)
  if (!claims) return null
  return { ...stored, claims }
}

/**
 * Cookie options.
 *
 * `SameSite=Lax` is the CSRF defence the browser gives for free: it withholds
 * the cookie from cross-site POSTs, form submits included, without the app
 * having to do anything.
 *
 * This used to be `None` on HTTPS, so the session would survive inside the v0
 * cross-origin preview iframe — a `Lax` cookie is treated as third-party there
 * and dropped, and the route guard then reads the user as logged out. That
 * preview is no longer used, and `None` was an expensive way to keep it
 * working: it switched off the browser's CSRF protection for a cookie that
 * authenticates a BFF holding other people's health data and a linked payment
 * account.
 *
 * `server/same-origin.ts` checks the request origin as a second layer. Keep
 * both: this one stops the request from ever being sent, that one stops it from
 * being honoured if a browser somewhere disagrees about what `Lax` means.
 *
 * `Secure` still tracks the scheme — over plain HTTP (local dev) browsers
 * reject `Secure` cookies outright.
 */
export function sessionCookieOptions(isHttps: boolean) {
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  }
}

export function isHttpsRequest(protoHeader: string | null, fallbackProtocol: string): boolean {
  const proto = protoHeader ?? fallbackProtocol.replace(":", "")
  return proto.split(",")[0].trim() === "https"
}

/** Reads the session straight off a request — the only form middleware can use. */
export function readSessionFromRequest(request: NextRequest): Session | null {
  return hydrate(decodeSession(request.cookies.get(SESSION_COOKIE)?.value))
}
