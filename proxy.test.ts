import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"

import proxy from "./proxy"
import { SESSION_COOKIE, encodeSession } from "@/server/session"
import {
  ADMIN_ONLY_AUTHORITIES,
  BRAND_AUTHORITIES,
  STUDENT_AUTHORITIES,
  TRAINER_ADMIN_AUTHORITIES,
  makeToken,
} from "@/test/tokens"

/**
 * Role routing.
 *
 * The bug this file exists to prevent is documented at the top of `proxy.ts`: a
 * guard that disagrees with itself about where a session belongs bounces the
 * user between two routes forever. With one audience that was one rule; with
 * two it is a matrix, and the interesting half is not "each role reaches its
 * own panel" but "each role in the *other* panel is redirected rather than
 * signed out".
 */

const ORIGIN = "https://panel.mientreno.test"

function request(pathname: string, token?: string) {
  const headers = new Headers({
    // Same-site GET: keeps `isCrossSiteWrite` out of the way, which is a
    // separate concern with its own test file.
    "sec-fetch-site": "same-origin",
  })

  if (token) {
    headers.set("cookie", `${SESSION_COOKIE}=${encodeSession({ accessToken: token, refreshToken: "r" })}`)
  }

  return new NextRequest(new URL(pathname, ORIGIN), { headers })
}

/** Redirect target, or null when the request was allowed through. */
function destination(pathname: string, token?: string): string | null {
  return hop(pathname, token).to
}

/**
 * One pass through the guard, as a browser would see it.
 *
 * `clearedSession` matters for the loop test: `signOut` drops the cookie in the
 * same response, so whatever the browser requests next arrives with no session.
 * A follow-the-redirects check that ignores that would report a loop where
 * there is none — a trainer asking for `/admin` is signed out to `/login`, and
 * only *with* the stale cookie would `/login` bounce them back.
 */
function hop(pathname: string, token?: string): { to: string | null; clearedSession: boolean } {
  const response = proxy(request(pathname, token))
  const location = response.headers.get("location")
  const cookie = response.cookies.get(SESSION_COOKIE)

  return {
    to: location ? new URL(location).pathname : null,
    clearedSession: cookie !== undefined && cookie.value === "",
  }
}

const trainerToken = makeToken()
const brandToken = makeToken({ authorities: BRAND_AUTHORITIES })
const studentToken = makeToken({ authorities: STUDENT_AUTHORITIES })
const trainerAdminToken = makeToken({ authorities: TRAINER_ADMIN_AUTHORITIES })
const adminOnlyToken = makeToken({ authorities: ADMIN_ONLY_AUTHORITIES })

describe("the landing", () => {
  it("is shown to anyone without a session", () => {
    expect(destination("/")).toBeNull()
  })

  it("sends a signed-in trainer to their panel instead of the pitch", () => {
    expect(destination("/", trainerToken)).toBe("/dashboard")
  })

  it("sends a signed-in merchant to theirs", () => {
    expect(destination("/", brandToken)).toBe("/comercio")
  })

  it("still shows the landing to a student, who has no panel here", () => {
    // Not a sign-out: they have a perfectly good session, just not for this
    // app. Bouncing them to /login would be a dead end with a cleared cookie.
    expect(destination("/", studentToken)).toBeNull()
  })
})

describe("the trainer panel", () => {
  it("lets a trainer in", () => {
    expect(destination("/dashboard/students", trainerToken)).toBeNull()
  })

  it("redirects a merchant to their own panel rather than signing them out", () => {
    // Someone in the wrong half of the product, not a broken session. Signing
    // them out would be punishing a typo.
    expect(destination("/dashboard", brandToken)).toBe("/comercio")
  })

  it("signs out a student", () => {
    expect(destination("/dashboard", studentToken)).toBe("/login")
  })

  it("sends an anonymous visitor to login", () => {
    expect(destination("/dashboard")).toBe("/login")
  })

  it("routes an incomplete profile to the trainer onboarding", () => {
    const token = makeToken({ profileCompleted: false })
    expect(destination("/dashboard", token)).toBe("/dashboard/profile")
  })

  it("does not loop on the profile route itself", () => {
    const token = makeToken({ profileCompleted: false })
    expect(destination("/dashboard/profile", token)).toBeNull()
  })
})

describe("the merchant panel", () => {
  it("lets a merchant in", () => {
    expect(destination("/comercio/productos", brandToken)).toBeNull()
  })

  it("redirects a trainer to their own panel", () => {
    expect(destination("/comercio", trainerToken)).toBe("/dashboard")
  })

  it("signs out a student", () => {
    expect(destination("/comercio", studentToken)).toBe("/login")
  })

  it("sends an anonymous visitor to login", () => {
    expect(destination("/comercio")).toBe("/login")
  })

  it("routes an incomplete profile to the merchant onboarding", () => {
    const token = makeToken({ authorities: BRAND_AUTHORITIES, profileCompleted: false })
    expect(destination("/comercio", token)).toBe("/comercio/perfil")
  })

  it("does not loop on the merchant profile route itself", () => {
    const token = makeToken({ authorities: BRAND_AUTHORITIES, profileCompleted: false })
    expect(destination("/comercio/perfil", token)).toBeNull()
  })

  it("leaves the merchant login reachable without a session", () => {
    // The guard must not claim /comercio/login just because it starts with
    // /comercio: doing so would make signing in as a merchant impossible.
    expect(destination("/comercio/login")).toBeNull()
    expect(destination("/comercio/register")).toBeNull()
  })
})

describe("signed-out-only screens", () => {
  it("sends a signed-in trainer away from either login door", () => {
    expect(destination("/login", trainerToken)).toBe("/dashboard")
    expect(destination("/comercio/login", trainerToken)).toBe("/dashboard")
  })

  it("sends a signed-in merchant away from either login door", () => {
    // Either door accepts either role; the redirect is what sorts them out.
    expect(destination("/login", brandToken)).toBe("/comercio")
    expect(destination("/comercio/login", brandToken)).toBe("/comercio")
  })

  it("leaves them alone for a student, who has nowhere to be sent", () => {
    expect(destination("/login", studentToken)).toBeNull()
  })

  it("leaves them open with no session", () => {
    expect(destination("/login")).toBeNull()
    expect(destination("/register")).toBeNull()
    expect(destination("/forgot-password")).toBeNull()
  })
})

describe("the moderation zone", () => {
  it("lets an admin in", () => {
    expect(destination("/admin", trainerAdminToken)).toBeNull()
    expect(destination("/admin/comercios", adminOnlyToken)).toBeNull()
  })

  it("does not redirect a trainer-admin away from it", () => {
    // The panel blocks run first, but /admin belongs to neither of them, so a
    // trainer who also moderates has to be able to stay here.
    expect(destination("/admin", trainerAdminToken)).toBeNull()
  })

  it("signs out a trainer without the role", () => {
    expect(destination("/admin", trainerToken)).toBe("/login")
  })

  it("signs out a merchant without the role", () => {
    expect(destination("/admin", brandToken)).toBe("/login")
  })

  it("sends an anonymous visitor to login", () => {
    expect(destination("/admin")).toBe("/login")
  })

  it("keeps a trainer-admin's home in the trainer panel", () => {
    // They reach /admin by asking for it, not by signing in.
    expect(destination("/", trainerAdminToken)).toBe("/dashboard")
    expect(destination("/login", trainerAdminToken)).toBe("/dashboard")
  })

  it("makes an admin-only account land in moderation", () => {
    expect(destination("/", adminOnlyToken)).toBe("/admin")
  })

  it("keeps an admin-only account out of the two panels", () => {
    // They have no profile there: every request would 403.
    expect(destination("/dashboard", adminOnlyToken)).toBe("/login")
    expect(destination("/comercio", adminOnlyToken)).toBe("/login")
  })
})

describe("no combination loops", () => {
  it("every role reaches a route it is allowed to stay on", () => {
    // The property that matters: following the redirects has to terminate. If
    // any pair bounced forever the panel would be unusable, which is exactly
    // the failure the comment at the top of proxy.ts describes.
    //
    // The chain is walked the way a browser walks it — losing the cookie when
    // the guard clears it — and capped at three hops, which is more than any
    // legitimate path needs.
    const starts = ["/", "/dashboard", "/comercio", "/admin", "/login", "/comercio/login"]

    for (const token of [trainerToken, brandToken, studentToken, trainerAdminToken, adminOnlyToken]) {
      for (const start of starts) {
        let current = start
        let carried: string | undefined = token

        for (let step = 0; step < 3; step++) {
          const { to, clearedSession } = hop(current, carried)
          if (to === null) break
          if (clearedSession) carried = undefined
          current = to
        }

        expect(hop(current, carried).to, `cadena que arranca en ${start}`).toBeNull()
      }
    }
  })
})
