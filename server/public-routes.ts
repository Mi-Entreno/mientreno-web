/**
 * The allowlist behind `/api/public/*`.
 *
 * A `[...path]` catch-all that forwarded whatever it was handed would be an
 * open proxy into the backend *with our own network position*: every endpoint
 * the API leaves unauthenticated, plus anything reachable from inside the
 * deployment that is not reachable from the internet. So the rule here is that
 * a request must be **matched**, not merely **not rejected** — the default is
 * "no", and each addition is a deliberate line.
 *
 * Today the list exists for exactly one flow: a student opening the invitation
 * link from their notification. They have no session in this app (it is
 * trainer-only) and never will, so those three calls cannot go through
 * `/api/backend/*`, which answers 401 without one.
 *
 * Kept out of the route module so it can be tested directly — Next restricts
 * what a `route.ts` may export.
 */
export interface PublicRule {
  method: "GET" | "POST"
  pattern: RegExp
}

/**
 * Opaque, URL-safe and high-entropy: `BACKEND_REQUIREMENTS.md` §9.2 asks for at
 * least 128 bits, base64url-encoded. The length bounds here are a cheap first
 * filter, not the authorisation — the backend is what validates the token.
 */
const TOKEN = "[A-Za-z0-9_-]{16,128}"

export const PUBLIC_RULES: PublicRule[] = [
  { method: "GET", pattern: new RegExp(`^/api/plan-invitations/token/${TOKEN}$`) },
  { method: "POST", pattern: new RegExp(`^/api/plan-invitations/token/${TOKEN}/accept$`) },
  { method: "POST", pattern: new RegExp(`^/api/plan-invitations/token/${TOKEN}/reject$`) },
]

export function isPublicRoute(method: string, path: string): boolean {
  return PUBLIC_RULES.some((rule) => rule.method === method && rule.pattern.test(path))
}
