import { describe, expect, it } from "vitest"

import { isCrossSiteWrite } from "./same-origin"

/**
 * The check guards a cookie-authenticated BFF, so the cases that matter are the
 * ones a browser actually produces — not hand-built edge cases.
 */

type RequestLike = Parameters<typeof isCrossSiteWrite>[0]

function request(
  method: string,
  headers: Record<string, string> = {},
): RequestLike {
  const lower = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]))
  return {
    method,
    headers: { get: (name: string) => lower.get(name.toLowerCase()) ?? null },
  } as RequestLike
}

const PANEL = "panel.mientreno.app"

describe("isCrossSiteWrite", () => {
  it("lets safe methods through regardless of origin", () => {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      expect(
        isCrossSiteWrite(
          request(method, { "sec-fetch-site": "cross-site", origin: "https://evil.example" }),
        ),
      ).toBe(false)
    }
  })

  it("blocks the multipart avatar upload from another site", () => {
    // The concrete hole this was written for: multipart is a "simple" request,
    // so no CORS preflight stands in the way and the browser attaches the
    // session cookie.
    expect(
      isCrossSiteWrite(
        request("POST", {
          "sec-fetch-site": "cross-site",
          origin: "https://evil.example",
          host: PANEL,
          "content-type": "multipart/form-data; boundary=x",
        }),
      ),
    ).toBe(true)
  })

  it("blocks a cross-site form submit that sends no Origin match", () => {
    expect(
      isCrossSiteWrite(request("POST", { origin: "https://evil.example", host: PANEL })),
    ).toBe(true)
  })

  it("allows the panel's own writes", () => {
    expect(
      isCrossSiteWrite(
        request("POST", { "sec-fetch-site": "same-origin", origin: `https://${PANEL}`, host: PANEL }),
      ),
    ).toBe(false)
  })

  it("allows a direct navigation, which reports sec-fetch-site: none", () => {
    expect(isCrossSiteWrite(request("POST", { "sec-fetch-site": "none", host: PANEL }))).toBe(false)
  })

  it("treats a sibling subdomain as cross-site", () => {
    // `same-site` covers other subdomains of the registrable domain. The panel
    // is the only thing that should be writing to the panel.
    expect(
      isCrossSiteWrite(
        request("POST", {
          "sec-fetch-site": "same-site",
          origin: "https://otro.mientreno.app",
          host: PANEL,
        }),
      ),
    ).toBe(true)
  })

  it("allows a non-browser client, which sends neither header", () => {
    // curl, a health check, the mobile app. They carry no cookie to abuse, and
    // the attack this blocks needs a browser.
    expect(isCrossSiteWrite(request("POST", { host: PANEL }))).toBe(false)
  })

  it("compares Origin against Host, not against the proxy's own view of the URL", () => {
    expect(
      isCrossSiteWrite(request("DELETE", { origin: `https://${PANEL}`, host: PANEL })),
    ).toBe(false)
  })

  it("rejects a malformed Origin", () => {
    expect(isCrossSiteWrite(request("POST", { origin: "not a url", host: PANEL }))).toBe(true)
  })

  it("rejects when Host is missing and an Origin claims something", () => {
    expect(isCrossSiteWrite(request("POST", { origin: "https://evil.example" }))).toBe(true)
  })

  it("covers every state-changing method", () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(
        isCrossSiteWrite(request(method, { "sec-fetch-site": "cross-site", host: PANEL })),
      ).toBe(true)
    }
  })
})
