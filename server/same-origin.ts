import type { NextRequest } from "next/server"

/**
 * Cross-site request rejection for the cookie-authenticated API routes.
 *
 * ## Why this exists
 *
 * The session cookie is `httpOnly`, which keeps the JWT out of reach of page
 * scripts — the right call. But it moves the threat model: an API authenticated
 * by a header is immune to CSRF, and one authenticated by a cookie is not. The
 * browser attaches `trainer_session` to any request it makes to this origin,
 * including ones a third-party page triggered, and `proxyToUpstream` then adds
 * the `Authorization` header and forwards it upstream.
 *
 * The CORS preflight covers most of that surface by accident: `PATCH`, `DELETE`
 * and `POST` with `application/json` are all preflighted, and Next answers with
 * no CORS headers, so the browser blocks them. What it does not cover are
 * "simple" requests — an HTML form submit, or a `fetch` with
 * `multipart/form-data`, `text/plain` or `application/x-www-form-urlencoded`.
 * `POST /api/uploads/avatar` takes multipart, so that hole was real.
 *
 * Relying on the preflight is relying on a side effect of a mechanism designed
 * for something else. This checks the thing we actually care about.
 *
 * ## How it decides
 *
 * `Sec-Fetch-Site` is the primary signal: the browser sets it, a page cannot
 * forge it, and it says directly what we want to know. Every browser that
 * matters has sent it for years.
 *
 * `Origin` is the fallback for anything that does not. Note that browsers send
 * `Origin` on cross-site GETs but often omit it on same-origin ones, which is
 * why an absent `Origin` counts as same-site here — a non-browser client
 * (curl, the mobile app, a health check) sends neither header, and those carry
 * no cookies to abuse in the first place. The attack this blocks requires a
 * browser, and a browser always identifies itself through one header or the
 * other.
 */

/** Requests that cannot change state need no protection. */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

export function isCrossSiteWrite(request: NextRequest): boolean {
  if (SAFE_METHODS.has(request.method)) return false

  // Set by the browser, unforgeable from a page. `same-origin` and `none`
  // (a direct navigation, e.g. the user typing the URL) are ours; `cross-site`
  // and `same-site` (a different subdomain) are not.
  const fetchSite = request.headers.get("sec-fetch-site")
  if (fetchSite) {
    return fetchSite !== "same-origin" && fetchSite !== "none"
  }

  const origin = request.headers.get("origin")
  if (!origin) return false

  // `request.nextUrl.origin` reflects the proxy's view, which behind a
  // deployment platform can be the internal address rather than the public one.
  // The Host header is what the browser actually addressed, and it is what the
  // Origin has to agree with.
  const host = request.headers.get("host")
  if (!host) return true

  try {
    return new URL(origin).host !== host
  } catch {
    // A malformed Origin is not something a browser produces.
    return true
  }
}
