import { redirect } from "next/navigation"

import { AudienceCards } from "@/components/marketing/audience-cards"
import { MarketingHero } from "@/components/marketing/hero"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { SiteFooter } from "@/components/marketing/site-footer"
import { homeFor } from "@/server/jwt"
import { readSession } from "@/server/session-store"

/**
 * La portada.
 *
 * Hasta acá este archivo era un `redirect("/dashboard")`, y como el guard rebota
 * `/dashboard` a `/login` sin sesión, lo primero que veía cualquiera era un
 * formulario de acceso de entrenador. Con dos públicos eso ya no alcanza: hay
 * que decir qué es el producto antes de pedirle a alguien que se registre.
 *
 * A quien ya tiene sesión se lo manda a su panel: el pitch es para quien todavía
 * no entró. El guard de `proxy.ts` hace lo mismo, y este chequeo lo duplica a
 * propósito — el proxy corre en el Edge y sólo lee la cookie, así que dejar el
 * redirect también acá cubre el caso de que la ruta se alcance sin pasar por él.
 */
export default async function Home() {
  const session = await readSession()
  const home = homeFor(session?.claims ?? null)
  if (home) redirect(home)

  return (
    <main>
      <MarketingHero />
      <AudienceCards />
      <HowItWorks />
      <SiteFooter />
    </main>
  )
}
