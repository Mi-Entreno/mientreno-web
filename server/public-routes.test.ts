import { describe, expect, it } from "vitest"

import { isPublicRoute } from "./public-routes"

const TOKEN = "0123456789abcdefghij"

describe("isPublicRoute", () => {
  it("allows the three calls the invitation link makes", () => {
    expect(isPublicRoute("GET", `/api/plan-invitations/token/${TOKEN}`)).toBe(true)
    expect(isPublicRoute("POST", `/api/plan-invitations/token/${TOKEN}/accept`)).toBe(true)
    expect(isPublicRoute("POST", `/api/plan-invitations/token/${TOKEN}/reject`)).toBe(true)
  })

  it("refuses everything else in the API", () => {
    // The whole point: this must not become an unauthenticated way in.
    expect(isPublicRoute("GET", "/api/subscriptions/students")).toBe(false)
    expect(isPublicRoute("GET", "/api/user-detail")).toBe(false)
    expect(isPublicRoute("DELETE", "/api/account")).toBe(false)
    expect(isPublicRoute("GET", "/actuator/health")).toBe(false)
  })

  it("refuses the right path with the wrong method", () => {
    expect(isPublicRoute("DELETE", `/api/plan-invitations/token/${TOKEN}`)).toBe(false)
    expect(isPublicRoute("POST", `/api/plan-invitations/token/${TOKEN}`)).toBe(false)
    expect(isPublicRoute("GET", `/api/plan-invitations/token/${TOKEN}/accept`)).toBe(false)
  })

  it("anchors the pattern at both ends", () => {
    // A prefix check would let both of these through.
    expect(isPublicRoute("GET", `/api/plan-invitations/token/${TOKEN}/../../account`)).toBe(false)
    expect(isPublicRoute("GET", `/evil/api/plan-invitations/token/${TOKEN}`)).toBe(false)
    expect(isPublicRoute("GET", `/api/plan-invitations/token/${TOKEN}/extra`)).toBe(false)
  })

  it("rejects a token that is not plausibly one", () => {
    expect(isPublicRoute("GET", "/api/plan-invitations/token/short")).toBe(false)
    expect(isPublicRoute("GET", "/api/plan-invitations/token/")).toBe(false)
    expect(isPublicRoute("GET", `/api/plan-invitations/token/${"a".repeat(200)}`)).toBe(false)
  })

  it("does not let the trainer's own invitation endpoints through", () => {
    // These carry a session and must stay on the authenticated proxy.
    expect(isPublicRoute("GET", "/api/plan-invitations/sent")).toBe(false)
    expect(isPublicRoute("POST", "/api/plan-invitations")).toBe(false)
  })
})
