import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { AUDIENCES, BRAND_AUDIENCE, TRAINER_AUDIENCE } from "./audience"

describe("AUDIENCES", () => {
  it("resolves both ids", () => {
    expect(AUDIENCES.trainer).toBe(TRAINER_AUDIENCE)
    expect(AUDIENCES.brand).toBe(BRAND_AUDIENCE)
  })

  it("points each audience at its own endpoints and paths", () => {
    // Cruzarlos registraría un comercio como entrenador, que es un bug que sólo
    // se ve en producción y con una cuenta ya creada.
    expect(TRAINER_AUDIENCE.registerEndpoint).toBe("/auth/trainer/register")
    expect(BRAND_AUDIENCE.registerEndpoint).toBe("/auth/brand/register")
    expect(TRAINER_AUDIENCE.homePrefix).toBe("/dashboard")
    expect(BRAND_AUDIENCE.homePrefix).toBe("/comercio")
  })

  it("keeps every profile path inside its own home", () => {
    // Si no, el guard manda al onboarding de un panel al que la sesión no
    // pertenece y rebota para siempre.
    for (const audience of Object.values(AUDIENCES)) {
      expect(audience.profilePath.startsWith(audience.homePrefix)).toBe(true)
    }
  })
})

/**
 * Las páginas que renderizan los formularios de acceso son server components, y
 * `AudienceCopy` lleva íconos de Lucide, que son funciones. Pasar el objeto como
 * prop rompe el build con "Functions cannot be passed directly to Client
 * Components" — y lo rompe recién en `next build`, no en typecheck ni en los
 * tests, que es exactamente cómo se escapó a producción una vez.
 *
 * Esto lo convierte en algo que falla en la suite rápida: se lee el archivo y se
 * verifica que la prop siga siendo el id.
 */
describe("el límite servidor/cliente de las páginas de acceso", () => {
  const PAGES = [
    "app/login/page.tsx",
    "app/register/page.tsx",
    "app/comercio/login/page.tsx",
    "app/comercio/register/page.tsx",
  ]

  it.each(PAGES)("%s pasa la audiencia como id, no como objeto", (page) => {
    const source = readFileSync(page, "utf8")

    // Un `audience={ALGO}` en llaves es una referencia a un valor de módulo: el
    // objeto de copy con sus íconos. La forma segura es el literal `audience="…"`.
    expect(source).not.toMatch(/audience=\{/)
  })

  it.each(PAGES)("%s no importa el objeto de copy", (page) => {
    const source = readFileSync(page, "utf8")

    expect(source).not.toMatch(/\b(TRAINER_AUDIENCE|BRAND_AUDIENCE|AUDIENCES)\b/)
  })
})
