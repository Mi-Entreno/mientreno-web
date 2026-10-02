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

async function request(pathname: string, token?: string) {
  const headers = new Headers({
    // Same-site GET: keeps `isCrossSiteWrite` out of the way, which is a
    // separate concern with its own test file.
    "sec-fetch-site": "same-origin",
  })

  if (token) {
    const sealed = await encodeSession({ accessToken: token, refreshToken: "r" })
    headers.set("cookie", `${SESSION_COOKIE}=${sealed}`)
  }

  return new NextRequest(new URL(pathname, ORIGIN), { headers })
}

/** Redirect target, or null when the request was allowed through. */
async function destination(pathname: string, token?: string): Promise<string | null> {
  return (await hop(pathname, token)).to
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
async function hop(
  pathname: string,
  token?: string,
): Promise<{ to: string | null; clearedSession: boolean }> {
  const response = await proxy(await request(pathname, token))
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
  it("is shown to anyone without a session", async () => {
    expect(await destination("/")).toBeNull()
  })

  it("sends a signed-in trainer to their panel instead of the pitch", async () => {
    expect(await destination("/", trainerToken)).toBe("/dashboard")
  })

  it("sends a signed-in merchant to theirs", async () => {
    expect(await destination("/", brandToken)).toBe("/comercio")
  })

  it("still shows the landing to a student, who has no panel here", async () => {
    // Not a sign-out: they have a perfectly good session, just not for this
    // app. Bouncing them to /login would be a dead end with a cleared cookie.
    expect(await destination("/", studentToken)).toBeNull()
  })
})

describe("the trainer panel", () => {
  it("lets a trainer in", async () => {
    expect(await destination("/dashboard/students", trainerToken)).toBeNull()
  })

  it("redirects a merchant to their own panel rather than signing them out", async () => {
    // Someone in the wrong half of the product, not a broken session. Signing
    // them out would be punishing a typo.
    expect(await destination("/dashboard", brandToken)).toBe("/comercio")
  })

  it("signs out a student", async () => {
    expect(await destination("/dashboard", studentToken)).toBe("/login")
  })

  it("sends an anonymous visitor to login", async () => {
    expect(await destination("/dashboard")).toBe("/login")
  })

  it("routes an incomplete profile to the trainer onboarding", async () => {
    const token = makeToken({ profileCompleted: false })
    expect(await destination("/dashboard", token)).toBe("/dashboard/profile")
  })

  it("does not loop on the profile route itself", async () => {
    const token = makeToken({ profileCompleted: false })
    expect(await destination("/dashboard/profile", token)).toBeNull()
  })
})

describe("the merchant panel", () => {
  it("lets a merchant in", async () => {
    expect(await destination("/comercio/desafios", brandToken)).toBeNull()
  })

  it("redirects a trainer to their own panel", async () => {
    expect(await destination("/comercio", trainerToken)).toBe("/dashboard")
  })

  it("signs out a student", async () => {
    expect(await destination("/comercio", studentToken)).toBe("/login")
  })

  it("sends an anonymous visitor to login", async () => {
    expect(await destination("/comercio")).toBe("/login")
  })

  it("routes an incomplete profile to the merchant onboarding", async () => {
    const token = makeToken({ authorities: BRAND_AUTHORITIES, profileCompleted: false })
    expect(await destination("/comercio", token)).toBe("/comercio/perfil")
  })

  it("does not loop on the merchant profile route itself", async () => {
    const token = makeToken({ authorities: BRAND_AUTHORITIES, profileCompleted: false })
    expect(await destination("/comercio/perfil", token)).toBeNull()
  })

  it("leaves the merchant login reachable without a session", async () => {
    // The guard must not claim /comercio/login just because it starts with
    // /comercio: doing so would make signing in as a merchant impossible.
    expect(await destination("/comercio/login")).toBeNull()
    expect(await destination("/comercio/register")).toBeNull()
  })
})

describe("signed-out-only screens", () => {
  it("sends a signed-in trainer away from either login door", async () => {
    expect(await destination("/login", trainerToken)).toBe("/dashboard")
    expect(await destination("/comercio/login", trainerToken)).toBe("/dashboard")
  })

  it("sends a signed-in merchant away from either login door", async () => {
    // Either door accepts either role; the redirect is what sorts them out.
    expect(await destination("/login", brandToken)).toBe("/comercio")
    expect(await destination("/comercio/login", brandToken)).toBe("/comercio")
  })

  it("leaves them alone for a student, who has nowhere to be sent", async () => {
    expect(await destination("/login", studentToken)).toBeNull()
  })

  it("leaves them open with no session", async () => {
    expect(await destination("/login")).toBeNull()
    expect(await destination("/register")).toBeNull()
    expect(await destination("/forgot-password")).toBeNull()
  })
})

describe("the moderation zone", () => {
  it("lets an admin in", async () => {
    expect(await destination("/admin", trainerAdminToken)).toBeNull()
    expect(await destination("/admin/comercios", adminOnlyToken)).toBeNull()
  })

  it("does not redirect a trainer-admin away from it", async () => {
    // The panel blocks run first, but /admin belongs to neither of them, so a
    // trainer who also moderates has to be able to stay here.
    expect(await destination("/admin", trainerAdminToken)).toBeNull()
  })

  it("signs out a trainer without the role", async () => {
    expect(await destination("/admin", trainerToken)).toBe("/login")
  })

  it("signs out a merchant without the role", async () => {
    expect(await destination("/admin", brandToken)).toBe("/login")
  })

  it("sends an anonymous visitor to login", async () => {
    expect(await destination("/admin")).toBe("/login")
  })

  it("keeps a trainer-admin's home in the trainer panel", async () => {
    // They reach /admin by asking for it, not by signing in.
    expect(await destination("/", trainerAdminToken)).toBe("/dashboard")
    expect(await destination("/login", trainerAdminToken)).toBe("/dashboard")
  })

  it("makes an admin-only account land in moderation", async () => {
    expect(await destination("/", adminOnlyToken)).toBe("/admin")
  })

  it("keeps an admin-only account out of the two panels", async () => {
    // They have no profile there: every request would 403.
    expect(await destination("/dashboard", adminOnlyToken)).toBe("/login")
    expect(await destination("/comercio", adminOnlyToken)).toBe("/login")
  })
})

describe("no combination loops", () => {
  it("every role reaches a route it is allowed to stay on", async () => {
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
          const { to, clearedSession } = await hop(current, carried)
          if (to === null) break
          if (clearedSession) carried = undefined
          current = to
        }

        expect((await hop(current, carried)).to, `cadena que arranca en ${start}`).toBeNull()
      }
    }
  })
})
