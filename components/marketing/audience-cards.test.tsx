import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AudienceCards } from "./audience-cards"

/**
 * `NEXT_PUBLIC_BRAND_SIGNUP_ENABLED=false` tiene que borrar el registro de
 * comercios de la portada sin llevarse el ingreso: los comercios que ya tienen
 * cuenta siguen entrando por su tarjeta.
 */
describe("las tarjetas de públicos", () => {
  afterEach(() => vi.unstubAllEnvs())

  function hrefs(container: HTMLElement) {
    return [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"))
  }

  it("ofrece el registro de comercios por defecto", () => {
    const { container } = render(<AudienceCards />)

    expect(hrefs(container)).toContain("/comercio/register")
  })

  it("lo oculta con el flag apagado, pero deja ingresar", () => {
    vi.stubEnv("NEXT_PUBLIC_BRAND_SIGNUP_ENABLED", "false")
    const { container } = render(<AudienceCards />)

    expect(hrefs(container)).not.toContain("/comercio/register")
    expect(hrefs(container)).toContain("/comercio/login")
    expect(hrefs(container)).toContain("/register")
    expect(screen.getAllByRole("link", { name: /registrate/i })).toHaveLength(1)
  })
})
