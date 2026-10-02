import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { LEGAL_DOCUMENTS, LEGAL_UPDATED_AT } from "@/components/legal/documents"

export const metadata = {
  title: "Documentos legales",
  description:
    "Política de privacidad, términos y condiciones y política de cookies de Mi Entreno.",
}

/**
 * El índice de la sección.
 *
 * Existe además de los tres enlaces sueltos del pie porque son dos usos
 * distintos: en el pie se entra a uno concreto, y acá se ve qué documentos hay
 * —que es lo que pide quien está evaluando el producto, no usándolo.
 */
export default function LegalIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <h1 className="font-heading text-headline font-semibold tracking-tight uppercase text-balance">
        Documentos
      </h1>
      <p className="mt-2.5 max-w-xl text-body-lg text-muted-foreground text-pretty">
        Las condiciones con las que funciona Mi Entreno, en un solo lugar y sin sesión de por
        medio.
      </p>

      <ul className="mt-9 grid gap-5 md:grid-cols-2">
        {LEGAL_DOCUMENTS.map(({ slug, href, icon: Icon, title, description }) => (
          <li key={slug}>
            <Link
              href={href}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:bg-muted/50"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary-text">
                <Icon className="size-5.5" />
              </span>

              <h2 className="mt-5 font-heading text-title font-semibold tracking-tight uppercase text-balance">
                {title}
              </h2>
              <p className="mt-2.5 flex-1 text-body text-muted-foreground text-pretty">
                {description}
              </p>

              <span className="mt-5 flex items-center gap-1.5 text-body font-medium text-primary-text">
                Leer
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-7 text-caption text-muted-foreground">
        Última actualización: {LEGAL_UPDATED_AT}.
      </p>
    </div>
  )
}
