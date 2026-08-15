import { describe, expect, it } from "vitest"

import { formatCurrency, initialsOf } from "./format"

/**
 * Currency moved from euros to Argentine pesos. The assertions below are about
 * the two things a locale change can silently break: the symbol and the
 * separators.
 *
 * ` ` (non-breaking space) is what `Intl` puts between `$` and the amount
 * under `es-AR`; matching on a plain space would fail for the wrong reason.
 */
describe("formatCurrency", () => {
  it("uses the peso sign, never the ARS code", () => {
    const formatted = formatCurrency(25_000)

    expect(formatted).toContain("$")
    expect(formatted).not.toContain("ARS")
    expect(formatted).not.toContain("€")
  })

  it("groups thousands the Argentine way", () => {
    expect(formatCurrency(25_000).replace(/ /g, " ")).toBe("$ 25.000")
    expect(formatCurrency(1_250_000).replace(/ /g, " ")).toBe("$ 1.250.000")
  })

  it("rounds to whole pesos", () => {
    expect(formatCurrency(1234.5).replace(/ /g, " ")).toBe("$ 1.235")
  })

  it("handles zero without falling back to a blank", () => {
    expect(formatCurrency(0)).toContain("0")
  })
})

describe("initialsOf", () => {
  it("takes the first two initials", () => {
    expect(initialsOf("María López García")).toBe("ML")
  })

  it("falls back for an absent name", () => {
    expect(initialsOf(null)).toBe("T")
  })
})
