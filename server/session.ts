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

/** Refresh tokens live 30 days upstream (`RefreshTokenService.EXPIRY_DAYS`). */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

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
 * Cookie options that work both on a normal deployment and inside the
 * cross-origin preview iframe.
 *
 * In a cross-site iframe browsers only send `SameSite=None; Secure` cookies —
 * a `Lax` cookie is treated as third-party and dropped, so the route guard
 * would think the user is logged out. Over plain HTTP (local dev) `Secure`
 * cookies are rejected outright, so we fall back to `Lax` there.
 */
export function sessionCookieOptions(isHttps: boolean) {
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? ("none" as const) : ("lax" as const),
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
