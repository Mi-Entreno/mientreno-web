import { AlertTriangle } from "lucide-react"

import { LEGAL_UPDATED_AT, SUPPORT_EMAIL } from "@/components/legal/documents"

/**
 * Los ladrillos con los que está escrito cada documento legal.
 *
 * Están acá y no dentro de cada página porque los tres documentos se leen uno
 * detrás del otro: si el aviso de borrador o el espaciado entre secciones se
 * escribiera por separado en cada uno, la sección terminaría pareciendo tres
 * documentos de tres productos distintos.
 */
export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="flex flex-col gap-2">
      <h2 className="font-heading text-subtitle font-semibold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-2 text-body text-muted-foreground [&_p]:text-pretty [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-4 [&_li]:list-disc [&_li]:text-pretty">
        {children}
      </div>
    </article>
  )
}

/**
 * El aviso de que esto es un esqueleto y no un documento revisado.
 *
 * Es parte de la página y no un comentario en el código, y es deliberadamente
 * ruidoso: un documento legal en borrador que *parece* terminado es peor que no
 * tener la página, y estas tres son públicas — las alcanza cualquiera desde el
 * pie de la portada, sin sesión.
 *
 * Cuando el texto pase por revisión legal, se borra este componente y sus tres
 * usos; no hace falta tocar nada más.
 */
export function LegalDraftNotice() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning bg-warning-surface p-4 text-warning-text">
      <AlertTriangle className="mt-0.5 size-5 shrink-0" />
      <div className="text-pretty">
        <p className="font-semibold">Borrador pendiente de revisión legal</p>
        <p className="mt-1 text-body">
          El texto de abajo es un esqueleto para que no falte la sección. No lo publiques como
          definitivo sin que lo revise alguien con criterio legal.
        </p>
      </div>
    </div>
  )
}

/** La fecha de última revisión, al pie de cada documento. */
export function LegalUpdatedAt() {
  return (
    <p className="border-t border-border pt-5 text-caption text-muted-foreground">
      Última actualización: {LEGAL_UPDATED_AT}. Si cambiamos algo importante, te avisamos por correo
      antes de que empiece a regir.
    </p>
  )
}

/** Cómo contactarnos, idéntico en los tres documentos. */
export function LegalContact() {
  return (
    <LegalSection title="Cómo contactarnos">
      <p>
        Por cualquier duda sobre este documento, escribinos a{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-medium text-foreground underline underline-offset-4"
        >
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </LegalSection>
  )
}
