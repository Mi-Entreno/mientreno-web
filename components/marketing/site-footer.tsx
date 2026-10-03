import Image from "next/image"
import Link from "next/link"

import { LEGAL_DOCUMENTS } from "@/components/legal/documents"
import { isBrandSignupEnabled } from "@/core/config/features"

/**
 * El pie del sitio público.
 *
 * Los tres documentos legales se listan sueltos y no detrás del enlace a
 * `/documentos`: quien busca la política de cookies en un pie no quiere un
 * índice intermedio, y una tienda de aplicaciones o un revisor pide la URL
 * directa de cada documento, no la de la sección. El índice queda igual, como
 * encabezado de la columna, para quien quiera verlos todos.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-brand-navy px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-9 sm:flex-row sm:justify-between sm:gap-12">
        <Image
          src="/logo-light.png"
          alt="Mi Entreno"
          width={410}
          height={241}
          className="h-10 w-auto"
        />

        <div className="flex flex-col gap-8 sm:flex-row sm:gap-16">
          <nav className="flex flex-col gap-2.5" aria-label="Acceso">
            <p className="font-mono text-caption tracking-widest text-white/45 uppercase">
              Acceso
            </p>
            <FooterLink href="/login">Ingresar como entrenador</FooterLink>
            {/* Mismo criterio que la tarjeta de comercios en la portada. */}
            {isBrandSignupEnabled() && (
              <FooterLink href="/comercio/login">Ingresar como comercio</FooterLink>
            )}
          </nav>

          <nav className="flex flex-col gap-2.5" aria-label="Documentos">
            <Link
              href="/documentos"
              className="font-mono text-caption tracking-widest text-white/45 uppercase transition-colors hover:text-white/70"
            >
              Documentos
            </Link>
            {LEGAL_DOCUMENTS.map(({ slug, href, title }) => (
              <FooterLink key={slug} href={href}>
                {title}
              </FooterLink>
            ))}
          </nav>
        </div>
      </div>

      <p className="mx-auto mt-9 max-w-5xl text-caption text-white/45">© 2026 JJTECH</p>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-body text-white/70 transition-colors hover:text-white">
      {children}
    </Link>
  )
}
