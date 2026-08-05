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

/**
 * True when the token is expired, or close enough that it would likely expire
 * mid-flight. The backend issues 30-minute tokens
 * (`JwtUtils.createToken`: `System.currentTimeMillis() + 1800000`).
 */
export function isExpired(claims: AccessTokenClaims | null, skewMs = 60_000): boolean {
  if (!claims) return true
  return claims.expiresAt - skewMs <= Date.now()
}
