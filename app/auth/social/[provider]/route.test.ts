import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { makeToken } from "@/test/tokens"

const upstream = vi.hoisted(() => ({ postJson: vi.fn() }))
vi.mock("@/server/upstream", () => upstream)

const store = vi.hoisted(() => ({ writeSession: vi.fn(), clearSession: vi.fn() }))
vi.mock("@/server/session-store", () => store)

import { POST } from "./route"

const VALID_LEGAL = {
  termsAccepted: true,
  privacyAccepted: true,
  cookiesAcknowledged: true,
  documentsVersion: "2026-09-06",
  platform: "WEB",
  locale: "es-AR",
}

function request(provider: string, body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new NextRequest(`http://dashboard.test/auth/social/${provider}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    } as never),
    { params: Promise.resolve({ provider }) },
  )
}

function payload(overrides: Record<string, unknown> = {}) {
  return { idToken: "id-token", nonce: "raw-nonce", legal: VALID_LEGAL, ...overrides }
}

function authResponse(authorities: string) {
  return {
    ok: true,
    status: 200,
    data: {
      email: "ana@gmail.com",
      firstName: null,
      message: "Login exitoso",
      jwt: makeToken({ authorities, profileCompleted: false }),
      refreshToken: "refresh",
      accountVerified: true,
    },
  }
}

beforeEach(() => {
  upstream.postJson.mockReset()
  store.writeSession.mockReset()
  store.clearSession.mockReset()
  upstream.postJson.mockResolvedValue(authResponse("ROLE_TRAINER"))
})

describe("social sign-in", () => {
  it("always goes through the trainer door upstream", async () => {
    await request("google", payload())
    await request("apple", payload({ authorizationCode: "code" }))

    expect(upstream.postJson.mock.calls.map(([path]) => path)).toEqual([
      "/auth/trainer/google",
      "/auth/trainer/apple",
    ])
    expect(upstream.postJson.mock.calls[1][1]).toMatchObject({
      idToken: "id-token",
      nonce: "raw-nonce",
      authorizationCode: "code",
    })
  })

  it("opens a session and tells the form where to go", async () => {
    const response = await request("google", payload())

    expect(response.status).toBe(200)
    expect(store.writeSession).toHaveBeenCalledOnce()
    await expect(response.json()).resolves.toMatchObject({
      home: "/dashboard",
      profileCompleted: false,
    })
  })

  it("refuses a student-only account even if upstream issued a session", async () => {
    // The backend refuses it first; this is the second line.
    upstream.postJson.mockResolvedValue(authResponse("ROLE_STUDENT"))

    const response = await request("google", payload())

    expect(response.status).toBe(403)
    expect(store.writeSession).not.toHaveBeenCalled()
    expect(store.clearSession).toHaveBeenCalled()
  })

  it("passes the backend's 403 for a student through with its message", async () => {
    upstream.postJson.mockResolvedValue({
      ok: false,
      status: 403,
      data: { message: "Esta cuenta es de alumno. Usá la aplicación móvil para entrenar." },
    })

    const response = await request("apple", payload())

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({ message: /alumno/ })
    expect(store.writeSession).not.toHaveBeenCalled()
  })

  it("attaches the browser's address to the consent", async () => {
    await request("google", payload(), { "x-forwarded-for": "181.10.10.10", "user-agent": "UA" })

    expect(upstream.postJson.mock.calls[0][1].legal).toMatchObject({
      termsAccepted: true,
      clientIp: "181.10.10.10",
      userAgent: "UA",
    })
  })

  it("rejects a missing consent without calling upstream", async () => {
    const response = await request("google", payload({ legal: undefined }))

    expect(response.status).toBe(400)
    expect(upstream.postJson).not.toHaveBeenCalled()
  })

  it("rejects a missing id token without calling upstream", async () => {
    const response = await request("google", payload({ idToken: "" }))

    expect(response.status).toBe(400)
    expect(upstream.postJson).not.toHaveBeenCalled()
  })

  it("404s an unknown provider instead of building a path from it", async () => {
    const response = await request("..%2Fadmin", payload())

    expect(response.status).toBe(404)
    expect(upstream.postJson).not.toHaveBeenCalled()
  })
})
