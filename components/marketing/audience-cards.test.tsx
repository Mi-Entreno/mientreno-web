import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AudienceCards } from "./audience-cards"
import { SiteFooter } from "./site-footer"

/**
 * `NEXT_PUBLIC_BRAND_SIGNUP_ENABLED=false` tiene que borrar a los comercios de
 * la portada —tarjeta y enlace del pie— sin tocar a los entrenadores.
 * `/comercio/login` sigue existiendo; sólo deja de anunciarse.
 */
describe("los comercios en la portada", () => {
  afterEach(() => vi.unstubAllEnvs())

  function hrefs(container: HTMLElement) {
    return [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"))
  }

  it("muestran su tarjeta por defecto", () => {
    const { container } = render(<AudienceCards />)

    expect(hrefs(container)).toEqual(
      expect.arrayContaining(["/comercio/login", "/comercio/register"]),
    )
    expect(screen.getByRole("heading", { name: /desde dónde entrás/i })).toBeInTheDocument()
  })

  it("desaparecen de las tarjetas con el flag apagado", () => {
    vi.stubEnv("NEXT_PUBLIC_BRAND_SIGNUP_ENABLED", "false")
    const { container } = render(<AudienceCards />)

    expect(hrefs(container)).toEqual(["/login", "/register"])
    expect(screen.queryByText(/para comercios/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /desde dónde entrás/i })).not.toBeInTheDocument()
  })

  it("desaparecen del pie con el flag apagado", () => {
    expect(hrefs(render(<SiteFooter />).container)).toContain("/comercio/login")

    vi.stubEnv("NEXT_PUBLIC_BRAND_SIGNUP_ENABLED", "false")
    expect(hrefs(render(<SiteFooter />).container)).not.toContain("/comercio/login")
  })
})
