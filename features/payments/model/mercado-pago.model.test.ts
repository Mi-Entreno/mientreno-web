import { describe, expect, it } from "vitest"

import type { MercadoPagoConnectionDTO } from "../dto/mercado-pago.dto"
import { toMercadoPagoConnection } from "../mappers/mercado-pago.mapper"
import {
  describeConnection,
  isOperational,
  needsReconnect,
  readCallbackParams,
} from "./mercado-pago.model"

const DTO: MercadoPagoConnectionDTO = {
  status: "CONNECTED",
  mercadoPagoUserId: "1234567890",
  nickname: "ALEXRUIZ",
  email: "a***@gmail.com",
  connectedAt: "2026-08-01T10:00:00Z",
  expiresAt: "2026-11-01T10:00:00Z",
  liveMode: true,
  scopes: ["read", "write", "offline_access"],
  applicationFeePercent: 10,
}

describe("toMercadoPagoConnection", () => {
  it("maps the fields the screen renders", () => {
    const connection = toMercadoPagoConnection(DTO)

    expect(connection.accountId).toBe("1234567890")
    expect(connection.nickname).toBe("ALEXRUIZ")
    expect(connection.applicationFeePercent).toBe(10)
  })

  it("assumes 'not connected' when the status is missing", () => {
    // Guessing the other way would render a screen that claims charges work.
    const connection = toMercadoPagoConnection({
      ...DTO,
      status: undefined as unknown as MercadoPagoConnectionDTO["status"],
    })

    expect(connection.status).toBe("NOT_CONNECTED")
    expect(isOperational(connection)).toBe(false)
  })

  it("assumes sandbox when `liveMode` is absent", () => {
    const connection = toMercadoPagoConnection({
      ...DTO,
      liveMode: undefined as unknown as boolean,
    })

    expect(connection.liveMode).toBe(false)
  })
})

describe("isOperational", () => {
  it("is true only for a live connection", () => {
    expect(isOperational(toMercadoPagoConnection(DTO))).toBe(true)
  })

  it("is false for a linked account that cannot charge", () => {
    // The case a `connection !== null` check gets wrong: linked, but dead.
    expect(isOperational(toMercadoPagoConnection({ ...DTO, status: "EXPIRED" }))).toBe(false)
    expect(isOperational(toMercadoPagoConnection({ ...DTO, status: "REVOKED" }))).toBe(false)
  })

  it("is false while the status is unknown", () => {
    expect(isOperational(null)).toBe(false)
    expect(isOperational(undefined)).toBe(false)
  })
})

describe("needsReconnect", () => {
  it("separates 'never linked' from 'linked and broken'", () => {
    expect(needsReconnect(toMercadoPagoConnection({ ...DTO, status: "NOT_CONNECTED" }))).toBe(false)
    expect(needsReconnect(toMercadoPagoConnection({ ...DTO, status: "EXPIRED" }))).toBe(true)
    expect(needsReconnect(toMercadoPagoConnection({ ...DTO, status: "REVOKED" }))).toBe(true)
  })
})

describe("describeConnection", () => {
  it("has copy for every status", () => {
    for (const status of ["NOT_CONNECTED", "CONNECTED", "EXPIRED", "REVOKED"] as const) {
      expect(describeConnection(status).description.length).toBeGreaterThan(0)
    }
  })
})

describe("readCallbackParams", () => {
  it("reads the success round trip", () => {
    const params = new URLSearchParams("code=TG-abc&state=xyz")

    expect(readCallbackParams(params)).toEqual({ code: "TG-abc", state: "xyz", error: null })
  })

  it("surfaces a refusal", () => {
    const params = new URLSearchParams("error=access_denied&state=xyz")

    expect(readCallbackParams(params).error).toBe("access_denied")
  })

  it("falls back to the description when only that is sent", () => {
    const params = new URLSearchParams("error_description=algo+ha+fallado")

    expect(readCallbackParams(params).error).toBe("algo ha fallado")
  })
})
