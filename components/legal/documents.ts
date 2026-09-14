import { Cookie, FileText, ShieldCheck, type LucideIcon } from "lucide-react"

/**
 * El índice de los documentos legales.
 *
 * Vive en un solo lugar porque las mismas tres entradas se listan en tres
 * sitios distintos —la sección `/documentos`, el pie de la portada y el nav
 * lateral de cada documento— y tenerlas repetidas garantizaba que tarde o
 * temprano una quedara con el título viejo o apuntando a una ruta muerta.
 *
 * El texto de cada documento no está acá sino en su propio componente
 * (`privacy-policy.tsx`, `terms-of-service.tsx`, `cookie-policy.tsx`): esto es
 * la tabla de contenidos, no el contenido.
 */
export interface LegalDocument {
  slug: string
  href: string
  icon: LucideIcon
  /** Título completo, el que encabeza la página y el `<title>`. */
  title: string
  /** Etiqueta corta para el pie y la navegación entre documentos. */
  shortTitle: string
  /** Una línea que dice de qué trata, para la tarjeta del índice. */
  description: string
}

/**
 * La fecha que se muestra al pie de cada documento.
 *
 * Es una sola para los tres a propósito: se escribieron juntos y se van a
 * revisar juntos. Cuando alguno cambie por separado, esto pasa a ser un campo
 * de `LegalDocument`.
 */
export const LEGAL_UPDATED_AT = "6 de septiembre de 2026"

/**
 * La misma fecha en ISO, que es la forma que viaja al backend.
 *
 * El registro manda esta versión dentro del bloque `legal` y el backend la
 * guarda tal cual en cada asiento de consentimiento: lo que hay que poder
 * probar es qué texto tuvo delante la persona, no cuál creía el servidor que
 * estaba publicado. Tiene que coincidir con `legal.documents.version` del
 * backend — si no, el alta funciona igual pero queda un WARN diciendo que el
 * cliente mostró otra cosa.
 *
 * Al editar cualquiera de los tres documentos hay que mover las dos: la de
 * arriba es la que lee el usuario, ésta es la que queda en la auditoría.
 */
export const LEGAL_DOCUMENTS_VERSION = "2026-09-06"

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "privacidad",
    href: "/documentos/privacidad",
    icon: ShieldCheck,
    title: "Política de privacidad",
    shortTitle: "Privacidad",
    description:
      "Qué datos recogemos, para qué los usamos, con quién los compartimos y qué podés hacer con ellos.",
  },
  {
    slug: "terminos",
    href: "/documentos/terminos",
    icon: FileText,
    title: "Términos y condiciones",
    shortTitle: "Términos y condiciones",
    description:
      "Las reglas de uso de Mi Entreno: qué ofrecemos, qué esperamos de vos y cómo funcionan las cuentas, los cobros y los desafíos con recompensa.",
  },
  {
    slug: "cookies",
    href: "/documentos/cookies",
    icon: Cookie,
    title: "Política de cookies",
    shortTitle: "Cookies",
    description:
      "Qué guardamos en tu navegador, por qué hace falta para mantener la sesión y qué pasa si lo bloqueás.",
  },
]

export function legalDocument(slug: string): LegalDocument {
  const found = LEGAL_DOCUMENTS.find((document) => document.slug === slug)
  if (!found) throw new Error(`Documento legal desconocido: ${slug}`)
  return found
}
