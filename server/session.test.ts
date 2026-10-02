import { describe, expect, it } from "vitest"

import { makeToken } from "@/test/tokens"
import { decodeSession, encodeSession, hydrate, isHttpsRequest, sessionCookieOptions } from "./session"

describe("session encoding", () => {
  it("round-trips both tokens", async () => {
    // The old cookie stored only the access token and threw the refresh token
    // away, capping every session at the backend's 30-minute token lifetime.
    const session = { accessToken: makeToken(), refreshToken: "opaque-refresh-token" }

    expect(await decodeSession(await encodeSession(session))).toEqual(session)
  })

  it("survives multi-byte content", async () => {
    const session = { accessToken: makeToken({ firstName: "José" }), refreshToken: "ñ-token" }

    expect(await decodeSession(await encodeSession(session))).toEqual(session)
  })

  it("does not expose the email or the name to whoever holds the cookie", async () => {
    // The published cookie policy says the cookie is unreadable without the
    // server's key. Base64 would have let anyone read `sub` and `firstName`.
    const token = makeToken({ firstName: "Josefina" })
    const raw = await encodeSession({ accessToken: token, refreshToken: "r" })

    expect(raw.startsWith("v1.")).toBe(true)
    expect(raw).not.toContain(token.split(".")[1])
    const readable = atob(raw.slice(3).replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil((raw.length - 3) / 4) * 4, "="))
    expect(readable).not.toContain("Josefina")
  })

  it("seals the same session differently every time", async () => {
    const session = { accessToken: makeToken(), refreshToken: "r" }

    expect(await encodeSession(session)).not.toBe(await encodeSession(session))
  })

  it("returns null for unreadable, tampered or pre-encryption cookies", async () => {
    expect(await decodeSession(undefined)).toBeNull()
    expect(await decodeSession("")).toBeNull()
    expect(await decodeSession("v1.not-base64url!!")).toBeNull()

    const sealed = await encodeSession({ accessToken: makeToken(), refreshToken: "r" })
    const flipped = sealed.slice(0, -2) + (sealed.endsWith("AA") ? "BB" : "AA")
    expect(await decodeSession(flipped)).toBeNull()

    // What the cookie looked like before encryption: its owner signs in again.
    const legacy = btoa(JSON.stringify({ a: makeToken(), r: "r" })).replace(/=+$/, "")
    expect(await decodeSession(legacy)).toBeNull()
  })

  it("does not open a cookie sealed with another secret", async () => {
    const sealed = await encodeSession({ accessToken: makeToken(), refreshToken: "r" })
    const original = process.env.SESSION_SECRET
    process.env.SESSION_SECRET = "another-secret-that-is-also-32-chars-long"
    try {
      expect(await decodeSession(sealed)).toBeNull()
    } finally {
      process.env.SESSION_SECRET = original
    }
  })

  it("fails loudly, naming the fix, when the secret is missing", async () => {
    // A missing secret is a deployment to fix, not a user to sign out.
    const original = process.env.SESSION_SECRET
    delete process.env.SESSION_SECRET
    try {
      await expect(encodeSession({ accessToken: makeToken(), refreshToken: "r" })).rejects.toThrow(/SESSION_SECRET/)
    } finally {
      process.env.SESSION_SECRET = original
    }
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
  it("stays SameSite=Lax on both schemes, so the browser withholds it cross-site", () => {
    // Lax is the CSRF defence the browser applies on its own: it does not send
    // the cookie on a cross-site POST or form submit.
    //
    // This was `None` over HTTPS so the session would survive inside the v0
    // preview iframe, which drops Lax cookies as third-party. That preview is
    // gone, and `None` bought it by switching off CSRF protection for the
    // cookie that authenticates the whole panel.
    expect(sessionCookieOptions(true)).toMatchObject({ secure: true, sameSite: "lax" })
    expect(sessionCookieOptions(false)).toMatchObject({ secure: false, sameSite: "lax" })
  })

  it("keeps the cookie unreachable from page scripts", () => {
    expect(sessionCookieOptions(true).httpOnly).toBe(true)
    expect(sessionCookieOptions(false).httpOnly).toBe(true)
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
