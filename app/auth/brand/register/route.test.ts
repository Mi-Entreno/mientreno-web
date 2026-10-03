import { NextRequest } from "next/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"

describe("POST /auth/brand/register", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("answers 404 when merchant sign-up is switched off", async () => {
    vi.stubEnv("NEXT_PUBLIC_BRAND_SIGNUP_ENABLED", "false")

    const res = await POST(
      new NextRequest("http://localhost/auth/brand/register", {
        method: "POST",
        body: JSON.stringify({ email: "a@b.com", password: "secret123" }),
      }),
    )

    expect(res.status).toBe(404)
  })
})
