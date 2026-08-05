import "server-only"

import { cookies, headers } from "next/headers"

import {
  SESSION_COOKIE,
  decodeSession,
  encodeSession,
  hydrate,
  isHttpsRequest,
  sessionCookieOptions,
  type Session,
  type StoredSession,
} from "./session"

/**
 * Session reads and writes for route handlers and server components.
 *
 * Split from `server/session.ts` because `next/headers` is unavailable in the
 * Edge middleware runtime; `proxy.ts` uses the request-based reader over there.
 */

async function protocolIsHttps(): Promise<boolean> {
  const headerStore = await headers()
  return isHttpsRequest(headerStore.get("x-forwarded-proto"), "http")
}

export async function readSession(): Promise<Session | null> {
  const store = await cookies()
  return hydrate(decodeSession(store.get(SESSION_COOKIE)?.value))
}

/** The raw tokens, without requiring the access token to still be decodable. */
export async function readStoredSession(): Promise<StoredSession | null> {
  const store = await cookies()
  return decodeSession(store.get(SESSION_COOKIE)?.value)
}

export async function writeSession(session: StoredSession): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, encodeSession(session), sessionCookieOptions(await protocolIsHttps()))
}

export async function clearSession(): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, "", { ...sessionCookieOptions(await protocolIsHttps()), maxAge: 0 })
}
