import { describe, expect, it } from "vitest"

import {
  ADMIN_ONLY_AUTHORITIES,
  BRAND_AUTHORITIES,
  STUDENT_AUTHORITIES,
  TRAINER_ADMIN_AUTHORITIES,
  makeToken,
} from "@/test/tokens"
import { decodeAccessToken, homeFor, isAdmin, isBrand, isExpired, isTrainer } from "./jwt"

describe("decodeAccessToken", () => {
  it("reads the claims the backend signs", () => {
    const claims = decodeAccessToken(
      makeToken({ sub: "alex@gym.com", userId: 7, firstName: "Alex", profileCompleted: false }),
    )

    expect(claims).toMatchObject({
      email: "alex@gym.com",
      userId: 7,
      firstName: "Alex",
      profileCompleted: false,
    })
  })

  it("splits the comma-joined authorities claim into a list", () => {
    // JwtUtils joins roles and permissions with `,` into one string.
    const claims = decodeAccessToken(makeToken({ authorities: "ROLE_TRAINER,READ,WRITE" }))

    expect(claims?.authorities).toEqual(["ROLE_TRAINER", "READ", "WRITE"])
  })

  it("converts exp from seconds to milliseconds", () => {
    const claims = decodeAccessToken(makeToken({ expiresInSeconds: 1800 }))

    // Backend tokens live 30 minutes (1_800_000 ms).
    const remaining = (claims?.expiresAt ?? 0) - Date.now()
    expect(remaining).toBeGreaterThan(1_700_000)
    expect(remaining).toBeLessThanOrEqual(1_800_000)
  })

  it("decodes multi-byte characters in claims", () => {
    const claims = decodeAccessToken(makeToken({ firstName: "Begoña" }))
    expect(claims?.firstName).toBe("Begoña")
  })

  it("returns null for anything unreadable", () => {
    expect(decodeAccessToken(null)).toBeNull()
    expect(decodeAccessToken("")).toBeNull()
    expect(decodeAccessToken("not-a-jwt")).toBeNull()
    expect(decodeAccessToken("a.b.c")).toBeNull()
  })

  it("returns null when exp is absent", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url")
    const payload = Buffer.from(JSON.stringify({ sub: "x" })).toString("base64url")

    expect(decodeAccessToken(`${header}.${payload}.sig`)).toBeNull()
  })
})

describe("isTrainer", () => {
  it("accepts a trainer and rejects a student", () => {
    expect(isTrainer(decodeAccessToken(makeToken()))).toBe(true)
    expect(isTrainer(decodeAccessToken(makeToken({ authorities: STUDENT_AUTHORITIES })))).toBe(false)
    expect(isTrainer(null)).toBe(false)
  })

  it("does not match ROLE_TRAINER as a substring of another authority", () => {
    const claims = decodeAccessToken(makeToken({ authorities: "ROLE_TRAINER_ASSISTANT" }))
    expect(isTrainer(claims)).toBe(false)
  })
})

describe("isExpired", () => {
  it("treats a live token as valid", () => {
    expect(isExpired(decodeAccessToken(makeToken({ expiresInSeconds: 1800 })))).toBe(false)
  })

  it("treats an elapsed token as expired", () => {
    expect(isExpired(decodeAccessToken(makeToken({ expiresInSeconds: -10 })))).toBe(true)
  })

  it("treats a token expiring within the skew window as expired", () => {
    // Refresh proactively so a request is never spent discovering the token died.
    expect(isExpired(decodeAccessToken(makeToken({ expiresInSeconds: 30 })))).toBe(true)
  })

  it("treats a missing token as expired", () => {
    expect(isExpired(null)).toBe(true)
  })
})

describe("isBrand", () => {
  it("recognises a merchant and rejects the other roles", () => {
    expect(isBrand(decodeAccessToken(makeToken({ authorities: BRAND_AUTHORITIES })))).toBe(true)
    expect(isBrand(decodeAccessToken(makeToken()))).toBe(false)
    expect(isBrand(decodeAccessToken(makeToken({ authorities: STUDENT_AUTHORITIES })))).toBe(false)
  })
})

describe("homeFor", () => {
  it("sends a trainer to the trainer panel", () => {
    expect(homeFor(decodeAccessToken(makeToken()))).toBe("/dashboard")
  })

  it("sends a merchant to the merchant panel", () => {
    expect(homeFor(decodeAccessToken(makeToken({ authorities: BRAND_AUTHORITIES })))).toBe(
      "/comercio",
    )
  })

  it("gives a student no home at all", () => {
    // Null and not a path: their place is the mobile app, and handing them any
    // route here sends them somewhere whose guard bounces them straight back —
    // which is a redirect loop, not an error message.
    expect(homeFor(decodeAccessToken(makeToken({ authorities: STUDENT_AUTHORITIES })))).toBeNull()
  })

  it("gives an unreadable session no home", () => {
    expect(homeFor(null)).toBeNull()
    expect(homeFor(decodeAccessToken("not-a-jwt"))).toBeNull()
  })

  it("prefers the trainer panel when a token somehow carries both roles", () => {
    // Not a state the backend produces — a user is one profile or the other —
    // but the function has to be total, and silently returning null for it
    // would sign out someone who is legitimately a trainer.
    const both = decodeAccessToken(makeToken({ authorities: "ROLE_TRAINER,ROLE_BRAND" }))
    expect(homeFor(both)).toBe("/dashboard")
  })

  it("keeps a trainer who also moderates in the trainer panel", () => {
    // ROLE_ADMIN is granted on top of an existing account, so this is the
    // common shape. Sending them to /admin on every sign-in would put a
    // secondary duty in front of their actual job.
    const trainerAdmin = decodeAccessToken(makeToken({ authorities: TRAINER_ADMIN_AUTHORITIES }))
    expect(homeFor(trainerAdmin)).toBe("/dashboard")
  })

  it("sends an admin-only account to the moderation zone", () => {
    // No other panel to live in, so this one is home.
    const adminOnly = decodeAccessToken(makeToken({ authorities: ADMIN_ONLY_AUTHORITIES }))
    expect(homeFor(adminOnly)).toBe("/admin")
  })
})

describe("isAdmin", () => {
  it("recognises the granted role alongside a profile role", () => {
    expect(isAdmin(decodeAccessToken(makeToken({ authorities: TRAINER_ADMIN_AUTHORITIES })))).toBe(true)
    expect(isAdmin(decodeAccessToken(makeToken({ authorities: ADMIN_ONLY_AUTHORITIES })))).toBe(true)
  })

  it("is false for everyone else", () => {
    expect(isAdmin(decodeAccessToken(makeToken()))).toBe(false)
    expect(isAdmin(decodeAccessToken(makeToken({ authorities: BRAND_AUTHORITIES })))).toBe(false)
    expect(isAdmin(decodeAccessToken(makeToken({ authorities: STUDENT_AUTHORITIES })))).toBe(false)
  })
})
