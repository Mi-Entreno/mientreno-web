import "server-only"

import { NextResponse, type NextRequest } from "next/server"

import { serverEnv } from "@/core/config/env"
import { isExpired } from "./jwt"
import { hydrate, type Session, type StoredSession } from "./session"
import { clearSession, readStoredSession, writeSession } from "./session-store"

/**
 * The only place that talks to the Spring Boot backend.
 *
 * Responsibilities:
 *  - attach the access token, refreshing it first when it is about to expire
 *  - stream requests and responses through untouched, so multipart uploads and
 *    binary downloads work
 *  - never construct a response with a body on a null-body status
 */

/** Mirror of `auth/dto/AuthResponseDTO.java`. */
export interface AuthResponseDTO {
  email: string
  firstName: string | null
  message: string
  jwt: string
  refreshToken: string
  accountVerified: boolean
}

export function upstreamUrl(path: string, search = ""): string {
  const { API_URL } = serverEnv()
  const normalised = path.startsWith("/") ? path : `/${path}`
  return `${API_URL}${normalised}${search}`
}

/**
 * Resolves the upstream URL, separating a configuration problem from a network
 * one.
 *
 * `serverEnv()` throws when `API_URL` is missing or malformed. Letting that land
 * in the same `catch` as `fetch` reported it as "no se ha podido conectar con el
 * servidor" — which sends you looking at a backend that is running perfectly
 * while the real problem is an absent `.env`. They are different failures and
 * deserve different messages.
 */
function resolveUrl(path: string, search = ""): { url: string } | { configError: string } {
  try {
    return { url: upstreamUrl(path, search) }
  } catch (error) {
    return {
      configError:
        error instanceof Error ? error.message : "Configuración de entorno inválida",
    }
  }
}

/**
 * Statuses the Fetch spec forbids from carrying a body. Building
 * `new Response("", { status: 204 })` throws `TypeError: Response constructor:
 * Invalid response status code 204` — an empty string is still a body. The old
 * proxy did exactly that, turning every 204 from the backend into a 500:
 * pause, resume, every DELETE, and PATCH /notifications/read-all.
 */
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304])

export function isNullBodyStatus(status: number): boolean {
  return NULL_BODY_STATUSES.has(status)
}

/** Client -> backend. Hop-by-hop and auth headers are set by us, not forwarded. */
const FORWARDED_REQUEST_HEADERS = [
  "content-type",
  "accept",
  "accept-language",
  "range",
  "if-none-match",
  "if-modified-since",
]

/** Backend -> client. Includes range headers so video seeking works. */
const FORWARDED_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "content-disposition",
  "content-range",
  "accept-ranges",
  "cache-control",
  "etag",
  "last-modified",
  "vary",
]

// ── Token refresh ────────────────────────────────────────────────────────────

/**
 * In-flight refreshes, keyed by the refresh token being redeemed.
 *
 * `RefreshTokenService.validateAndRotate` *rotates*: redeeming a token
 * invalidates it and issues a new one. Two concurrent refreshes with the same
 * token therefore destroy the session — the second call presents a token the
 * backend has already burned. Dashboard pages fire several queries at once, so
 * this is the common case, not an edge case.
 */
const inFlightRefreshes = new Map<string, Promise<StoredSession | null>>()

/**
 * Results of refreshes that have already completed, keyed by the token they
 * consumed.
 *
 * Deduplicating only the in-flight promise is not enough. Requests do not
 * arrive in one batch: a call that starts just after the first refresh resolves
 * still carries the old token, because the `Set-Cookie` from that refresh has
 * not reached the browser yet. Without this cache it would redeem the same
 * token a second time — and the backend has already burned it, so the answer is
 * 401 and the session dies.
 *
 * Holding the rotated pair briefly lets those stragglers pick up the new tokens
 * instead of re-redeeming the old one.
 */
const ROTATION_GRACE_MS = 30_000
const recentRotations = new Map<string, { session: StoredSession; at: number }>()

function rememberRotation(consumedToken: string, session: StoredSession): void {
  const now = Date.now()
  for (const [token, entry] of recentRotations) {
    if (now - entry.at > ROTATION_GRACE_MS) recentRotations.delete(token)
  }
  recentRotations.set(consumedToken, { session, at: now })
}

function recallRotation(consumedToken: string): StoredSession | null {
  const entry = recentRotations.get(consumedToken)
  if (!entry) return null

  if (Date.now() - entry.at > ROTATION_GRACE_MS) {
    recentRotations.delete(consumedToken)
    return null
  }

  return entry.session
}

async function requestRefresh(refreshToken: string): Promise<StoredSession | null> {
  let response: Response
  try {
    response = await fetch(upstreamUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    })
  } catch {
    return null
  }

  if (!response.ok) return null

  const data = (await response.json().catch(() => null)) as AuthResponseDTO | null
  if (!data?.jwt) return null

  return {
    accessToken: data.jwt,
    // The backend rotates, so a new refresh token comes back. Fall back to the
    // old one only if the response somehow omits it.
    refreshToken: data.refreshToken || refreshToken,
  }
}

function refreshOnce(refreshToken: string): Promise<StoredSession | null> {
  // Already redeemed moments ago by a sibling request.
  const rotated = recallRotation(refreshToken)
  if (rotated) return Promise.resolve(rotated)

  const existing = inFlightRefreshes.get(refreshToken)
  if (existing) return existing

  const pending = requestRefresh(refreshToken)
    .then((session) => {
      if (session) rememberRotation(refreshToken, session)
      return session
    })
    .finally(() => {
      inFlightRefreshes.delete(refreshToken)
    })

  inFlightRefreshes.set(refreshToken, pending)
  return pending
}

/**
 * Returns a session whose access token is good for at least another minute,
 * refreshing and re-persisting the cookie when it is not.
 *
 * Refresh is proactive (driven by the `exp` claim) rather than reactive
 * (driven by a 401) so a request is never spent discovering that the token
 * died. Access tokens last 30 minutes upstream; refresh tokens last 30 days.
 */
export async function ensureFreshSession(): Promise<Session | null> {
  const stored = await readStoredSession()
  if (!stored) return null

  const current = hydrate(stored)
  if (current && !isExpired(current.claims)) return current

  if (!stored.refreshToken) {
    await clearSession()
    return null
  }

  const rotated = await refreshOnce(stored.refreshToken)
  if (!rotated) {
    await clearSession()
    return null
  }

  await writeSession(rotated)
  return hydrate(rotated)
}

// ── Request forwarding ───────────────────────────────────────────────────────

function buildUpstreamHeaders(request: NextRequest, accessToken: string): Headers {
  const headers = new Headers()

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }

  headers.set("Authorization", `Bearer ${accessToken}`)
  return headers
}

function buildClientHeaders(upstream: Response): Headers {
  const headers = new Headers()

  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name)
    if (value) headers.set(name, value)
  }

  return headers
}

/**
 * Streams a client request to the backend and the backend's response back.
 *
 * Nothing is buffered and no `Content-Type` is imposed, which is what makes
 * `POST /api/exercises/{id}/videos` (multipart, up to 100 MB) and
 * `GET /api/files/**` (binary) work. The previous proxy read
 * `await req.text()` and hardcoded `application/json`, which corrupted both.
 */
export async function proxyToUpstream(
  request: NextRequest,
  upstreamPath: string,
): Promise<NextResponse> {
  const resolved = resolveUrl(upstreamPath, request.nextUrl.search)
  if ("configError" in resolved) {
    return NextResponse.json(
      { message: resolved.configError, status: 500 },
      { status: 500 },
    )
  }

  const session = await ensureFreshSession()

  if (!session) {
    return NextResponse.json(
      { message: "Tu sesión ha expirado", status: 401 },
      { status: 401 },
    )
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD"

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers: buildUpstreamHeaders(request, session.accessToken),
    cache: "no-store",
    redirect: "manual",
  }

  if (hasBody && request.body) {
    init.body = request.body
    // Required by undici whenever the body is a stream.
    init.duplex = "half"
  }

  let upstream: Response
  try {
    upstream = await fetch(resolved.url, init)
  } catch {
    return NextResponse.json(
      { message: "No se ha podido conectar con el servidor", status: 502 },
      { status: 502 },
    )
  }

  if (isNullBodyStatus(upstream.status)) {
    return new NextResponse(null, {
      status: upstream.status,
      headers: buildClientHeaders(upstream),
    })
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: buildClientHeaders(upstream),
  })
}

// ── Direct calls (auth routes) ───────────────────────────────────────────────

export interface UpstreamResult {
  ok: boolean
  status: number
  data: unknown
}

async function readResult(response: Response): Promise<UpstreamResult> {
  const text = await response.text().catch(() => "")
  let data: unknown

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  return { ok: response.ok, status: response.status, data }
}

const UNREACHABLE: UpstreamResult = {
  ok: false,
  status: 502,
  data: { message: "No se ha podido conectar con el servidor" },
}

/** 500, not 502: nothing was attempted, and the fix is local. */
function misconfigured(message: string): UpstreamResult {
  return { ok: false, status: 500, data: { message } }
}

/**
 * Unauthenticated JSON call to the backend, for the `/auth/**` endpoints —
 * which are `permitAll` upstream and must not carry a session.
 */
export async function postJson(path: string, body: unknown): Promise<UpstreamResult> {
  const resolved = resolveUrl(path)
  if ("configError" in resolved) return misconfigured(resolved.configError)

  try {
    const response = await fetch(resolved.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    })
    return await readResult(response)
  } catch {
    return UNREACHABLE
  }
}

/**
 * Authenticated JSON call made from a route handler rather than proxied.
 *
 * Used by the few endpoints whose *response* changes the session, so the
 * handler needs to inspect it before answering the client — completing the
 * trainer profile (which returns a fresh JWT) and deleting the account (which
 * revokes every refresh token upstream). Everything else should go through
 * `proxyToUpstream`.
 */
export async function authedJson(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<UpstreamResult> {
  const resolved = resolveUrl(path)
  if ("configError" in resolved) return misconfigured(resolved.configError)

  const session = await ensureFreshSession()

  if (!session) {
    return { ok: false, status: 401, data: { message: "Tu sesión ha expirado" } }
  }

  try {
    const response = await fetch(resolved.url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    })
    return await readResult(response)
  } catch {
    return UNREACHABLE
  }
}
