import { describe, expect, it } from "vitest"

import { STUDENT_AUTHORITIES, makeToken } from "@/test/tokens"
import { decodeAccessToken, isExpired, isTrainer } from "./jwt"

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
