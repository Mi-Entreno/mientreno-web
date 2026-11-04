// @vitest-environment node
import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"
import { NextRequest } from "next/server"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

const upstream = vi.hoisted(() => ({ ensureFreshSession: vi.fn() }))
vi.mock("@/server/upstream", () => upstream)

import { POST } from "./route"

const UPLOAD_URL = "http://backend.test/api/users/me/profile-picture"
const STORED = "https://res.cloudinary.com/demo/profile-pictures/12/abc.jpg"

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

beforeEach(() => {
  upstream.ensureFreshSession.mockReset()
  upstream.ensureFreshSession.mockResolvedValue({ accessToken: "token" })
})

function request(file: File) {
  const form = new FormData()
  form.append("file", file)
  return new NextRequest("http://dashboard.test/api/uploads/avatar", {
    method: "POST",
    body: form,
  } as never)
}

const photo = (type = "image/jpeg", name = "me.jpg") => new File([new Uint8Array(64)], name, { type })

describe("avatar upload", () => {
  it("forwards to the profile-picture endpoint and returns the stored URL", async () => {
    let seen: { auth: string | null; type: string | undefined } | undefined
    server.use(
      http.post(UPLOAD_URL, async ({ request: upstreamRequest }) => {
        const part = (await upstreamRequest.formData()).get("file") as File
        seen = { auth: upstreamRequest.headers.get("authorization"), type: part?.type }
        return HttpResponse.json({ profileImageUrl: STORED })
      }),
    )

    const response = await POST(request(photo()))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ url: STORED })
    expect(seen).toEqual({ auth: "Bearer token", type: "image/jpeg" })
  })

  it("declares the type from the extension when the browser sent none", async () => {
    // The backend allowlists the part's Content-Type; an empty one is a 400.
    let type: string | undefined
    server.use(
      http.post(UPLOAD_URL, async ({ request: upstreamRequest }) => {
        type = ((await upstreamRequest.formData()).get("file") as File).type
        return HttpResponse.json({ profileImageUrl: STORED })
      }),
    )

    await POST(request(photo("", "me.png")))

    expect(type).toBe("image/png")
  })

  it("passes the backend's rejection through with its status", async () => {
    server.use(
      http.post(UPLOAD_URL, () =>
        HttpResponse.json({ message: "Formato de imagen no permitido" }, { status: 400 }),
      ),
    )

    const response = await POST(request(photo()))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: "Formato de imagen no permitido" })
  })

  it("rejects a non-image without calling upstream", async () => {
    const response = await POST(request(photo("application/pdf", "cv.pdf")))

    expect(response.status).toBe(415)
  })

  it("answers 401 when there is no session", async () => {
    upstream.ensureFreshSession.mockResolvedValue(null)

    const response = await POST(request(photo()))

    expect(response.status).toBe(401)
  })
})
