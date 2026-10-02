/**
 * Authenticated encryption for the session cookie (AES-256-GCM, Web Crypto).
 *
 * ## Why the cookie is encrypted
 *
 * The cookie used to be base64url JSON, which anyone holding it could read. The
 * access token inside carries the login email (`sub`) and first name, and the
 * cookie policy published at /documentos/cookies said it held neither. The
 * cookie is `httpOnly`, so page scripts never saw it, but a copied cookie, a
 * proxy log or a browser profile on disk still exposed them. Encrypting closes
 * that, and the published policy can now say exactly what the cookie holds.
 *
 * GCM also authenticates: a cookie edited or minted outside this server fails to
 * open and reads as "no session" rather than as a session that says something
 * else. The backend still verifies the JWT on every call; this only means the
 * BFF never acts on bytes it did not write.
 *
 * ## Format
 *
 *     v1.<base64url(iv ‖ ciphertext+tag)>
 *
 * The version prefix leaves room for key rotation. The cookie name goes in as
 * associated data, so the sealed value cannot be replayed under another cookie.
 * Cookies written before encryption have no prefix and open as `null`: their
 * owners sign in once more, which is the whole cost of the migration.
 *
 * Runs on Edge (`proxy.ts`) and Node alike: only `crypto.subtle`, no
 * `node:crypto`, no `server-only`, no `next/headers`.
 */

const VERSION_PREFIX = "v1."
const IV_BYTES = 12
const MIN_SECRET_LENGTH = 32
const ASSOCIATED_DATA = new TextEncoder().encode("trainer_session")

let cachedKey: { secret: string; key: Promise<CryptoKey> } | null = null

/**
 * Read lazily, like `serverEnv()`: a missing secret surfaces as a 500 naming the
 * fix on the first request that needs a session, not as a broken build.
 */
function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `Falta configuración: SESSION_SECRET (al menos ${MIN_SECRET_LENGTH} caracteres). ` +
        "Generá uno con `openssl rand -base64 32`, agregalo a .env y reiniciá el servidor.",
    )
  }
  return secret
}

/**
 * SHA-256 of the secret as the AES key. A KDF with a salt would add nothing:
 * the secret is required to be random and long, not a password.
 */
function sessionKey(): Promise<CryptoKey> {
  const secret = sessionSecret()
  if (cachedKey?.secret !== secret) {
    const key = crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(secret))
      .then((raw) => crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]))
    cachedKey = { secret, key }
  }
  return cachedKey.key
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
  const withPadding = padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "=")
  return Uint8Array.from(atob(withPadding), (char) => char.charCodeAt(0))
}

export async function seal(plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: ASSOCIATED_DATA },
    await sessionKey(),
    new TextEncoder().encode(plaintext),
  )
  const sealed = new Uint8Array(IV_BYTES + ciphertext.byteLength)
  sealed.set(iv, 0)
  sealed.set(new Uint8Array(ciphertext), IV_BYTES)
  return VERSION_PREFIX + toBase64Url(sealed)
}

/** The plaintext, or null for anything this server did not seal with the current key. */
export async function unseal(value: string): Promise<string | null> {
  if (!value.startsWith(VERSION_PREFIX)) return null

  // Resolved before the try: a missing secret is a configuration error to
  // surface, not a cookie to quietly treat as signed out.
  const key = await sessionKey()

  try {
    const sealed = fromBase64Url(value.slice(VERSION_PREFIX.length))
    if (sealed.length <= IV_BYTES) return null
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: sealed.slice(0, IV_BYTES), additionalData: ASSOCIATED_DATA },
      key,
      sealed.slice(IV_BYTES),
    )
    return new TextDecoder().decode(plaintext)
  } catch {
    return null
  }
}
