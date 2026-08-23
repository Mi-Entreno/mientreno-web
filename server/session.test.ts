import { describe, expect, it } from "vitest"

import { makeToken } from "@/test/tokens"
import { decodeSession, encodeSession, hydrate, isHttpsRequest, sessionCookieOptions } from "./session"

describe("session encoding", () => {
  it("round-trips both tokens", () => {
    // The old cookie stored only the access token and threw the refresh token
    // away, capping every session at the backend's 30-minute token lifetime.
    const session = { accessToken: makeToken(), refreshToken: "opaque-refresh-token" }

    expect(decodeSession(encodeSession(session))).toEqual(session)
  })

  it("survives multi-byte content", () => {
    const session = { accessToken: makeToken({ firstName: "José" }), refreshToken: "ñ-token" }

    expect(decodeSession(encodeSession(session))).toEqual(session)
  })

  it("returns null for unreadable cookies", () => {
    expect(decodeSession(undefined)).toBeNull()
    expect(decodeSession("")).toBeNull()
    expect(decodeSession("not-base64url!!")).toBeNull()
    expect(decodeSession(btoa("{}"))).toBeNull()
  })

  it("tolerates a missing refresh token", () => {
    const raw = btoa(JSON.stringify({ a: makeToken() }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")

    expect(decodeSession(raw)?.refreshToken).toBe("")
  })
})

describe("hydrate", () => {
  it("attaches decoded claims", () => {
    const session = hydrate({ accessToken: makeToken({ userId: 9 }), refreshToken: "r" })

    expect(session?.claims.userId).toBe(9)
  })

  it("rejects a session whose access token cannot be read", () => {
    expect(hydrate({ accessToken: "garbage", refreshToken: "r" })).toBeNull()
    expect(hydrate(null)).toBeNull()
  })
})

describe("sessionCookieOptions", () => {
  it("uses SameSite=None only over HTTPS", () => {
    // Cross-site iframes drop Lax cookies; plain HTTP rejects Secure ones.
    expect(sessionCookieOptions(true)).toMatchObject({ secure: true, sameSite: "none" })
    expect(sessionCookieOptions(false)).toMatchObject({ secure: false, sameSite: "lax" })
  })

  it("is an idle window that outlives the access token but not the refresh one", () => {
    const maxAge = sessionCookieOptions(true).maxAge

    // Long enough that a 30-minute access token always has a refresh token
    // waiting for it, short enough that an abandoned browser stops being a
    // signed-in one well before the upstream refresh token expires.
    expect(maxAge).toBe(60 * 60 * 24 * 7)
    expect(maxAge).toBeGreaterThan(60 * 30)
    expect(maxAge).toBeLessThan(60 * 60 * 24 * 30)
  })
})

describe("isHttpsRequest", () => {
  it("prefers the forwarded proto header", () => {
    expect(isHttpsRequest("https", "http:")).toBe(true)
    expect(isHttpsRequest(null, "https:")).toBe(true)
    expect(isHttpsRequest(null, "http:")).toBe(false)
  })

  it("reads the first hop of a proxy chain", () => {
    expect(isHttpsRequest("https,http", "http:")).toBe(true)
  })
})
