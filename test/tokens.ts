/**
 * Builds access tokens shaped like the ones `JwtUtils.createToken` signs.
 *
 * The signature is filler: nothing in the dashboard verifies it (see
 * `server/jwt.ts` for why), so tests only need the payload to be realistic.
 */
export interface TokenClaims {
  sub?: string
  authorities?: string
  userId?: number
  profileCompleted?: boolean
  firstName?: string
  /** Seconds from now until expiry. Negative for an already-dead token. */
  expiresInSeconds?: number
}

function base64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export function makeToken(claims: TokenClaims = {}): string {
  const {
    sub = "trainer@example.com",
    // Backend joins roles *and* permissions into one comma-separated string.
    authorities = "ROLE_TRAINER,READ,WRITE",
    userId = 42,
    profileCompleted = true,
    firstName = "Alex",
    expiresInSeconds = 1800,
  } = claims

  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const payload = base64Url(
    JSON.stringify({
      sub,
      authorities,
      userId,
      profileCompleted,
      firstName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    }),
  )

  return `${header}.${payload}.signature-not-verified`
}

export const STUDENT_AUTHORITIES = "ROLE_STUDENT,READ"
export const BRAND_AUTHORITIES = "ROLE_BRAND,READ,WRITE"
/** ADMIN is granted on top of an account, so the realistic token carries both. */
export const TRAINER_ADMIN_AUTHORITIES = "ROLE_TRAINER,ROLE_ADMIN,READ,WRITE"
export const ADMIN_ONLY_AUTHORITIES = "ROLE_ADMIN,READ,WRITE"
