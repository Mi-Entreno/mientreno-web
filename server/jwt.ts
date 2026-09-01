/**
 * Reads the claims the backend puts in the access token.
 *
 * `JwtUtils.createToken` signs: `sub` (email), `authorities` (comma-joined
 * roles *and* permissions), `userId`, `profileCompleted`, optional `firstName`,
 * plus standard `exp` / `iat` / `jti`. The login response DTO carries none of
 * these at the top level, which is why the previous login route read
 * `data.role` and `data.profileCompleted` and always got `undefined`.
 *
 * This decodes without verifying the signature, on purpose:
 *
 *  - Verification needs `security.jwt.private.key`, the backend's HMAC secret.
 *    Copying it into the dashboard widens the blast radius of a frontend
 *    compromise for no real gain.
 *  - The backend verifies the signature on every single call. It remains the
 *    only authority on what a token may do.
 *  - We use these claims exclusively for UI routing — which nav to render,
 *    whether to bounce to onboarding. A tampered token buys nothing: every
 *    subsequent API call fails at the backend.
 *
 * Edge-runtime safe (used from `proxy.ts`): no Node built-ins.
 */

export interface AccessTokenClaims {
  email: string
  userId: number | null
  authorities: string[]
  profileCompleted: boolean
  firstName: string | null
  /** Expiry in epoch milliseconds. */
  expiresAt: number
}

export const TRAINER_ROLE = "ROLE_TRAINER"
export const BRAND_ROLE = "ROLE_BRAND"
export const ADMIN_ROLE = "ROLE_ADMIN"

function decodeBase64Url(segment: string): string {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/")
  const withPadding = padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "=")

  const binary = atob(withPadding)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Returns null for anything that is not a readable JWT. */
export function decodeAccessToken(token: string | undefined | null): AccessTokenClaims | null {
  if (!token) return null

  const segments = token.split(".")
  if (segments.length !== 3) return null

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(decodeBase64Url(segments[1])) as Record<string, unknown>
  } catch {
    return null
  }

  const exp = typeof payload.exp === "number" ? payload.exp : null
  if (exp === null) return null

  // `authorities` is a single comma-joined string, not an array.
  const rawAuthorities = typeof payload.authorities === "string" ? payload.authorities : ""
  const authorities = rawAuthorities
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  return {
    email: typeof payload.sub === "string" ? payload.sub : "",
    userId: typeof payload.userId === "number" ? payload.userId : null,
    authorities,
    profileCompleted: payload.profileCompleted === true,
    firstName: typeof payload.firstName === "string" ? payload.firstName : null,
    expiresAt: exp * 1000,
  }
}

export function hasRole(claims: AccessTokenClaims | null, role: string): boolean {
  return claims?.authorities.includes(role) ?? false
}

export function isTrainer(claims: AccessTokenClaims | null): boolean {
  return hasRole(claims, TRAINER_ROLE)
}

export function isBrand(claims: AccessTokenClaims | null): boolean {
  return hasRole(claims, BRAND_ROLE)
}

/**
 * Moderation and merchant administration.
 *
 * Unlike the other two, this is a *granted* role rather than a profile: the
 * account is promoted with a SQL insert (see the backend README), so an admin is
 * usually also a trainer. That is why `homeFor` does not treat it as a home of
 * its own unless there is nothing else — `/admin` is a place they go, not the
 * place they live.
 */
export function isAdmin(claims: AccessTokenClaims | null): boolean {
  return hasRole(claims, ADMIN_ROLE)
}

/**
 * Where this session belongs, or null when it belongs nowhere here.
 *
 * One function answers it and everything else consults it — the guard, the
 * login route, the landing. Two places disagreeing about "which panel is
 * yours" is how redirect loops are born, and this app has already paid for one
 * (see the note in `proxy.ts`).
 *
 * A student gets `null` rather than a route: their place is the mobile app, and
 * handing them any path here would send them somewhere whose own guard bounces
 * them straight back.
 */
export function homeFor(claims: AccessTokenClaims | null): string | null {
  if (isTrainer(claims)) return "/dashboard"
  if (isBrand(claims)) return "/comercio"
  // Last, not first: ROLE_ADMIN is granted on top of an existing account, so a
  // trainer who also moderates still lands in the panel they actually work in.
  // Only an account whose *sole* role is ADMIN calls /admin home.
  if (isAdmin(claims)) return "/admin"
  return null
}

/**
 * True when the token is expired, or close enough that it would likely expire
 * mid-flight. The backend issues 30-minute tokens
 * (`JwtUtils.createToken`: `System.currentTimeMillis() + 1800000`).
 */
export function isExpired(claims: AccessTokenClaims | null, skewMs = 60_000): boolean {
  if (!claims) return true
  return claims.expiresAt - skewMs <= Date.now()
}
