import { describe, expect, it } from "vitest"

import {
  canPublishChallenges,
  INSTAGRAM_HANDLE,
  normalizeInstagram,
  normalizeWebsite,
  profileBlockedReason,
  WEBSITE_URL,
  type BrandProfile,
} from "./brand.model"

function profile(overrides: Partial<BrandProfile> = {}): BrandProfile {
  return {
    id: 1,
    displayName: "Café Central",
    legalName: null,
    taxId: null,
    logoUrl: null,
    description: null,
    contactEmail: null,
    contactPhone: null,
    pickupAddress: "Av. Siempreviva 742",
    pickupNotes: null,
    instagram: null,
    websiteUrl: null,
    status: "ACTIVE",
    ...overrides,
  }
}

describe("canPublishChallenges", () => {
  it("activo y con dirección de retiro puede publicar", () => {
    expect(canPublishChallenges(profile())).toBe(true)
  })

  it("sin dirección de retiro no: el premio quedaría sin dónde buscarse", () => {
    expect(canPublishChallenges(profile({ pickupAddress: "  " }))).toBe(false)
    expect(profileBlockedReason(profile({ pickupAddress: null }))).toContain("dirección de retiro")
  })

  it("suspendido no, aunque tenga todo cargado", () => {
    expect(canPublishChallenges(profile({ status: "SUSPENDED" }))).toBe(false)
    expect(profileBlockedReason(profile({ status: "SUSPENDED" }))).toContain("suspendido")
  })
})

describe("normalizeInstagram", () => {
  it("acepta cualquiera de las formas en que se copia un perfil", () => {
    for (const input of [
      "micomercio",
      "@micomercio",
      "@@micomercio",
      "  micomercio  ",
      "instagram.com/micomercio",
      "www.instagram.com/micomercio/",
      "https://www.instagram.com/micomercio/?hl=es",
      "HTTPS://Instagram.com/micomercio#footer",
    ]) {
      expect(normalizeInstagram(input)).toBe("micomercio")
    }
  })

  it("lo que devuelve pasa el CHECK del backend", () => {
    expect(INSTAGRAM_HANDLE.test(normalizeInstagram("https://instagram.com/mi.comercio_ok/"))).toBe(true)
  })

  it("vacío es vacío, no 'https://instagram.com/'", () => {
    expect(normalizeInstagram("   ")).toBe("")
  })
})

describe("normalizeWebsite", () => {
  it("le pone el esquema al que no lo trae: sin él el enlace es relativo", () => {
    expect(normalizeWebsite("micomercio.com")).toBe("https://micomercio.com")
    expect(normalizeWebsite("  micomercio.com/tienda ")).toBe("https://micomercio.com/tienda")
  })

  it("respeta el que ya viene con esquema", () => {
    expect(normalizeWebsite("http://micomercio.com")).toBe("http://micomercio.com")
    expect(normalizeWebsite("https://micomercio.com")).toBe("https://micomercio.com")
  })

  it("vacío es vacío", () => {
    expect(normalizeWebsite("  ")).toBe("")
  })

  it("un nombre sin punto no es un sitio", () => {
    expect(WEBSITE_URL.test(normalizeWebsite("micomercio"))).toBe(false)
    expect(WEBSITE_URL.test(normalizeWebsite("micomercio.com.ar"))).toBe(true)
  })
})
