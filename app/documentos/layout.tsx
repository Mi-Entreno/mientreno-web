import { PublicHeader } from "@/components/marketing/public-header"
import { SiteFooter } from "@/components/marketing/site-footer"

/**
 * La sección de documentos legales es pública a propósito.
 *
 * No aparece en el matcher de `proxy.ts`, así que el guard no la toca: hay que
 * poder leer los términos *antes* de crear la cuenta, y una tienda de
 * aplicaciones o un revisor legal tiene que poder abrir la URL sin sesión.
 *
 * El pie es el mismo de la portada, que es desde donde se entra: quien terminó
 * de leer un documento vuelve a tener a mano los dos accesos y los otros dos
 * documentos.
 */
export const metadata = {
  title: { default: "Documentos", template: "%s — Mi Entreno" },
}

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader link={{ href: "/documentos", label: "Documentos" }} />

      <main className="flex-1">{children}</main>

      <SiteFooter />
    </div>
  )
}
