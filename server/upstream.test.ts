import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { makeToken } from "@/test/tokens"

const store = vi.hoisted(() => ({
  readStoredSession: vi.fn(),
  writeSession: vi.fn(),
  clearSession: vi.fn(),
}))

// Hoisted above this import by Vitest, so `upstream` binds to the mock.
vi.mock("./session-store", () => store)

import { ensureFreshSession, isNullBodyStatus, proxyToUpstream } from "./upstream"

const fetchMock = vi.fn()

function request(path: string, init?: RequestInit) {
  return new NextRequest(`http://dashboard.test${path}`, init as never)
}

beforeEach(() => {
  fetchMock.mockReset()
  store.readStoredSession.mockReset()
  store.writeSession.mockReset()
  store.clearSession.mockReset()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("null-body statuses", () => {
  it("documents the constructor failure the old proxy hit", () => {
    // The previous proxy did `new NextResponse(await upstream.text(), {status})`.
    // For a 204 that text is "" — still a body — and the Fetch spec forbids it.
    expect(() => new Response("", { status: 204 })).toThrow(TypeError)
    expect(() => new Response(null, { status: 204 })).not.toThrow()
  })

  it("covers every status the spec forbids a body on", () => {
    expect(isNullBodyStatus(204)).toBe(true)
    expect(isNullBodyStatus(205)).toBe(true)
    expect(isNullBodyStatus(304)).toBe(true)
    expect(isNullBodyStatus(200)).toBe(false)
    expect(isNullBodyStatus(409)).toBe(false)
  })
})

describe("proxyToUpstream", () => {
  beforeEach(() => {
    store.readStoredSession.mockResolvedValue({ accessToken: makeToken(), refreshToken: "r1" })
  })

  it("returns a body-less 204 instead of throwing", async () => {
    // PATCH /subscriptions/{id}/pause, every DELETE and
    // PATCH /notifications/read-all all answer 204. Each was a 500 before.
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    const response = await proxyToUpstream(
      request("/api/backend/api/subscriptions/5/pause", { method: "PATCH" }),
      "/api/subscriptions/5/pause",
    )

    expect(response.status).toBe(204)
    expect(response.body).toBeNull()
  })

  it("attaches the bearer token and forwards the query string", async () => {
    fetchMock.mockResolvedValue(new Response("[]", { status: 200 }))

    await proxyToUpstream(
      request("/api/backend/api/catalog-exercises?search=press&page=2"),
      "/api/catalog-exercises",
    )

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("http://backend.test/api/catalog-exercises?search=press&page=2")
    expect((init.headers as Headers).get("Authorization")).toMatch(/^Bearer /)
  })

  it("does not impose a JSON content-type on uploads", async () => {
    // POST /api/exercises/{id}/videos is multipart/form-data; the old proxy
    // hardcoded application/json and read the body as text, corrupting it.
    fetchMock.mockResolvedValue(new Response("{}", { status: 201 }))

    await proxyToUpstream(
      request("/api/backend/api/exercises/3/videos", {
        method: "POST",
        body: "binary-ish",
        headers: { "content-type": "multipart/form-data; boundary=abc123" },
      }),
      "/api/exercises/3/videos",
    )

    const init = fetchMock.mock.calls[0][1]
    expect((init.headers as Headers).get("content-type")).toBe(
      "multipart/form-data; boundary=abc123",
    )
    expect(init.duplex).toBe("half")
  })

  it("preserves binary content type and range headers", async () => {
    fetchMock.mockResolvedValue(
      new Response("fake-mp4", {
        status: 206,
        headers: {
          "content-type": "video/mp4",
          "content-range": "bytes 0-1023/4096",
          "accept-ranges": "bytes",
        },
      }),
    )

    const response = await proxyToUpstream(
      request("/api/media/videos/clip.mp4", { headers: { range: "bytes=0-1023" } }),
      "/api/files/videos/clip.mp4",
    )

    expect((fetchMock.mock.calls[0][1].headers as Headers).get("range")).toBe("bytes=0-1023")
    expect(response.headers.get("content-type")).toBe("video/mp4")
    expect(response.headers.get("content-range")).toBe("bytes 0-1023/4096")
  })

  it("answers 401 when there is no session", async () => {
    store.readStoredSession.mockResolvedValue(null)

    const response = await proxyToUpstream(request("/api/backend/api/trainer/profile"), "/api/trainer/profile")

    expect(response.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("answers 502 when the backend is unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"))

    const response = await proxyToUpstream(request("/api/backend/api/trainer/profile"), "/api/trainer/profile")

    expect(response.status).toBe(502)
  })
})

describe("ensureFreshSession", () => {
  it("uses a live token without contacting the backend", async () => {
    store.readStoredSession.mockResolvedValue({
      accessToken: makeToken({ expiresInSeconds: 1500 }),
      refreshToken: "r1",
    })

    const session = await ensureFreshSession()

    expect(session).not.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("refreshes an expired token and persists the rotated pair", async () => {
    store.readStoredSession.mockResolvedValue({
      accessToken: makeToken({ expiresInSeconds: -60 }),
      refreshToken: "old-refresh",
    })
    fetchMock.mockResolvedValue(
      Response.json({ jwt: makeToken({ expiresInSeconds: 1800 }), refreshToken: "new-refresh" }),
    )

    const session = await ensureFreshSession()

    expect(fetchMock.mock.calls[0][0]).toBe("http://backend.test/auth/refresh")
    // Rotation: the new refresh token must replace the redeemed one.
    expect(store.writeSession).toHaveBeenCalledWith(
      expect.objectContaining({ refreshToken: "new-refresh" }),
    )
    expect(session?.claims.email).toBe("trainer@example.com")
  })

  it("refreshes only once for concurrent callers", async () => {
    // RefreshTokenService.validateAndRotate burns the token it redeems, so a
    // second concurrent refresh with the same token would kill the session.
    // Dashboard pages fire several queries at once, so this is the normal case.
    store.readStoredSession.mockResolvedValue({
      accessToken: makeToken({ expiresInSeconds: -60 }),
      refreshToken: "shared-refresh",
    })

    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve(Response.json({ jwt: makeToken(), refreshToken: "rotated" })),
            20,
          ),
        ),
    )

    const sessions = await Promise.all(Array.from({ length: 6 }, () => ensureFreshSession()))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(sessions.every((session) => session !== null)).toBe(true)
  })

  it("does not redeem the same token twice for staggered requests", async () => {
    // Regression: deduplicating only the in-flight promise left a window open.
    // A request arriving just after the first refresh resolved still carried
    // the old cookie — the Set-Cookie had not reached the browser yet — and
    // redeemed a token the backend had already burned, killing the session.
    store.readStoredSession.mockResolvedValue({
      accessToken: makeToken({ expiresInSeconds: -60 }),
      refreshToken: "staggered-refresh",
    })
    fetchMock.mockResolvedValue(
      Response.json({ jwt: makeToken(), refreshToken: "rotated-once" }),
    )

    const first = await ensureFreshSession()
    // Sequential, not concurrent: the first call has fully settled by now.
    const second = await ensureFreshSession()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(first).not.toBeNull()
    expect(second).not.toBeNull()
  })

  it("clears the session when the refresh token is rejected", async () => {
    store.readStoredSession.mockResolvedValue({
      accessToken: makeToken({ expiresInSeconds: -60 }),
      refreshToken: "expired-refresh",
    })
    fetchMock.mockResolvedValue(
      Response.json({ message: "Refresh token expirado" }, { status: 401 }),
    )

    expect(await ensureFreshSession()).toBeNull()
    expect(store.clearSession).toHaveBeenCalled()
  })

  it("clears the session when there is no refresh token to redeem", async () => {
    store.readStoredSession.mockResolvedValue({
      accessToken: makeToken({ expiresInSeconds: -60 }),
      refreshToken: "",
    })

    expect(await ensureFreshSession()).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(store.clearSession).toHaveBeenCalled()
  })
})

describe("missing configuration", () => {
  // Regression: an absent `.env` used to surface as 502 "no se ha podido
  // conectar con el servidor", which points at a backend that is running fine.
  const originalUrl = process.env.API_URL

  afterEach(() => {
    process.env.API_URL = originalUrl
  })

  it("reports a config problem as 500 with the fix, not 502", async () => {
    delete process.env.API_URL
    // `serverEnv` caches on first success, so this only reproduces in a fresh
    // module graph.
    vi.resetModules()
    const { postJson } = await import("./upstream")

    const result = await postJson("/auth/login", { email: "a@b.com" })

    expect(result.status).toBe(500)
    expect((result.data as { message: string }).message).toContain("API_URL")
    expect((result.data as { message: string }).message).toContain(".env")
    // Never attempted, so it cannot be a connection failure.
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
