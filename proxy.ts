import { type NextRequest, NextResponse } from "next/server"

import { homeFor, isAdmin, isBrand, isTrainer } from "@/server/jwt"
import { isCrossSiteWrite } from "@/server/same-origin"
import { SESSION_COOKIE, readSessionFromRequest } from "@/server/session"

/**
 * Route guard (Next 16 names this file `proxy.ts`, formerly `middleware.ts`).
 *
 * Runs on the Edge runtime, so it only reads the session — it never refreshes.
 * Refreshing needs a network round trip plus a cookie write, which would tax
 * every navigation; the API proxy and the auth routes handle that instead.
 *
 * That distinction is what fixes the redirect loop. The old guard checked only
 * that *some* cookie existed. Once the 30-minute access token expired, the
 * dashboard's API calls 401'd, the client redirected to `/login`, and the guard
 * bounced it straight back to `/dashboard` because the cookie was still there —
 * forever. Now an unreadable or role-less session counts as logged out, and a
 * merely-expired one is left for the refresh path to repair.
 */
const PROFILE_PATH = "/dashboard/profile"
const BRAND_HOME = "/comercio"
const BRAND_PROFILE_PATH = "/comercio/perfil"
const ADMIN_HOME = "/admin"

function redirect(req: NextRequest, pathname: string, params?: Record<string, string>) {
  const url = req.nextUrl.clone()
  url.pathname = pathname
  url.search = ""
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value)
  }
  return NextResponse.redirect(url)
}

/** Sends the user to login and drops the unusable cookie in the same response. */
function signOut(req: NextRequest, params?: Record<string, string>) {
  const response = redirect(req, "/login", params)
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 })
  return response
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // CSRF: a state-changing request from another site never gets to spend this
  // browser's session cookie. Checked here rather than in each route handler
  // because this is the one place every request passes through — a new handler
  // is covered the day it is written, without anyone remembering to add it.
  //
  // 403 with no detail on purpose: the caller is not a user to be helped.
  if (isCrossSiteWrite(req)) {
    return NextResponse.json({ message: "Origen no permitido" }, { status: 403 })
  }

  const session = readSessionFromRequest(req)
  const home = homeFor(session?.claims ?? null)

  // The landing is for people who have not signed in. Someone with a live
  // session goes to their own panel instead of re-reading the pitch.
  if (pathname === "/") {
    return session && home ? redirect(req, home) : NextResponse.next()
  }

  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return signOut(req, { from: pathname })
    }

    // A merchant here is not a broken session — it is someone in the wrong half
    // of the product. Sending them to their own panel is what they wanted;
    // signing them out would be punishing a typo.
    if (isBrand(session.claims)) {
      return redirect(req, BRAND_HOME)
    }

    // A student signing in here would otherwise reach the shell and watch every
    // request fail with 403.
    if (!isTrainer(session.claims)) {
      return signOut(req, { error: "role" })
    }

    // An expired access token is fine as long as a refresh token is there to
    // redeem it; without one the session is genuinely over.
    if (!session.refreshToken && session.claims.expiresAt <= Date.now()) {
      return signOut(req)
    }

    // Trainers who have not completed their professional profile cannot use
    // most of the API. The profile route itself is exempt, or this would loop.
    if (!session.claims.profileCompleted && !pathname.startsWith(PROFILE_PATH)) {
      return redirect(req, PROFILE_PATH, { complete: "1" })
    }

    return NextResponse.next()
  }

  // The merchant panel. Mirrors the block above rather than sharing it: the two
  // differ in their profile path and in which role is the intruder, and folding
  // that into one parameterised branch made the redirect rules harder to read
  // than the duplication they saved.
  //
  // `/comercio/login` and `/comercio/register` are excluded here and handled by
  // SIGNED_OUT_ONLY below — guarding them would make signing in impossible.
  if (pathname.startsWith(BRAND_HOME) && !SIGNED_OUT_ONLY.has(pathname)) {
    if (!session) {
      return signOut(req, { from: pathname })
    }

    if (isTrainer(session.claims)) {
      return redirect(req, "/dashboard")
    }

    if (!isBrand(session.claims)) {
      return signOut(req, { error: "role" })
    }

    if (!session.refreshToken && session.claims.expiresAt <= Date.now()) {
      return signOut(req)
    }

    if (!session.claims.profileCompleted && !pathname.startsWith(BRAND_PROFILE_PATH)) {
      return redirect(req, BRAND_PROFILE_PATH, { complete: "1" })
    }

    return NextResponse.next()
  }

  // Moderation. Guarded by role alone: there is no profile to complete, and no
  // "wrong half" redirect either — an account without ROLE_ADMIN has no home
  // here to be sent to, so it is signed out like any other intruder.
  //
  // Note this runs *after* the two panel blocks, so an admin who is also a
  // trainer reaches /dashboard normally and /admin only when they ask for it.
  if (pathname.startsWith(ADMIN_HOME)) {
    if (!session) {
      return signOut(req, { from: pathname })
    }

    if (!isAdmin(session.claims)) {
      return signOut(req, { error: "role" })
    }

    if (!session.refreshToken && session.claims.expiresAt <= Date.now()) {
      return signOut(req)
    }

    return NextResponse.next()
  }

  // Signed-in users have no business on these screens.
  //
  // `/verify-otp` is deliberately absent, though the reason has changed. The
  // backend used to issue tokens even when `accountVerified` was false, so an
  // unverified trainer arrived there holding a valid session and bouncing them
  // to the dashboard would have made the account impossible to verify. It now
  // withholds the tokens, so those users reach `/verify-otp` with no session at
  // all — and a guard entry would be pointless rather than harmful. Leaving the
  // route out keeps it reachable either way.
  if (SIGNED_OUT_ONLY.has(pathname) && session && home) {
    return redirect(req, home)
  }

  return NextResponse.next()
}

/**
 * Both audiences land on their own pair, but either door accepts either role:
 * the redirect above sends whoever signs in to the panel that is actually
 * theirs. The two pages differ in the pitch beside the form, not in what they
 * accept — bouncing a merchant who clicked the trainer link would be punishing
 * a guess about our own information architecture.
 */
const SIGNED_OUT_ONLY = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/comercio/login",
  "/comercio/register",
])

/**
 * `/api/:path*` and `/auth/:path*` are here for the CSRF check, not for the
 * session guard — those routes authenticate themselves and answer 401 on their
 * own. Without them in the matcher the middleware never runs on the very
 * requests that carry the cookie into a state change, which is the whole point
 * of `isCrossSiteWrite`.
 *
 * The guard below is keyed on `/dashboard` and the signed-out pages, so adding
 * these paths does not change routing for them.
 */
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/comercio/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/api/:path*",
    "/auth/:path*",
  ],
}
