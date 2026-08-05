import { type NextRequest, NextResponse } from "next/server"

import { isTrainer } from "@/server/jwt"
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
  const session = readSessionFromRequest(req)

  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return signOut(req, { from: pathname })
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

  // Signed-in trainers have no business on these screens.
  //
  // `/verify-otp` is deliberately absent: `loginUser` issues tokens even when
  // `accountVerified` is false, so an unverified trainer holds a valid session
  // and is sent straight there from login. Bouncing them to the dashboard would
  // make the account impossible to verify. Verification status is not a JWT
  // claim, so the guard cannot distinguish those users anyway.
  if (SIGNED_OUT_ONLY.has(pathname) && session && isTrainer(session.claims)) {
    return redirect(req, "/dashboard")
  }

  return NextResponse.next()
}

const SIGNED_OUT_ONLY = new Set(["/login", "/register", "/forgot-password"])

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/forgot-password"],
}
