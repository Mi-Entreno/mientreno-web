import {
  CreditCard,
  Dumbbell,
  Gift,
  PackageCheck,
  Salad,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

import { BrandBackdrop } from "@/components/shared/brand-backdrop"
import { cn } from "@/lib/utils"

export interface AuthBrandCopy {
  /** Small pill next to the logo — says which side of the product you are on. */
  headline: ReactNode
  copy: string
  /** Desktop-only value props. Omitted on screens that sell nothing. */
  features?: { icon: LucideIcon; label: string }[]
  /** Fine print pinned to the bottom of the tall desktop panel. */
  note?: string
}

/**
 * La puerta sin etiqueta: pantallas que no le pertenecen a ningún público.
 *
 * `/login`, la recuperación de contraseña y la verificación por código las usan
 * los dos por igual. Mostrarles ahí el pitch de entrenador le dice a un comercio
 * que se equivocó de puerta justo cuando no se equivocó: el login es el mismo
 * `POST /auth/login` para ambos y el destino sale del JWT, no de la página.
 *
 * El titular es el mismo de la portada a propósito — quien llega desde ahí
 * reconoce el producto en lugar de leer un segundo eslogan distinto.
 */
export const NEUTRAL_BRAND: AuthBrandCopy = {
  headline: (
    <>
      Entrená. Controlá.
      <br />
      <span className="text-brand-green">Crecé.</span>
    </>
  ),
  copy: "Mi Entreno conecta a los alumnos con su entrenador y premia la constancia: los comercios proponen desafíos con recompensa, y lo que el alumno entrena lo acerca a un premio real.",
  features: [
    { icon: Dumbbell, label: "Planes de entrenamiento y nutrición" },
    { icon: Users, label: "El progreso de cada alumno, al día" },
    { icon: Gift, label: "Desafíos con premio, puestos por comercios" },
    { icon: Store, label: "Comercios que ponen los premios" },
  ],
  note: "© 2026 JJTECH",
}

/** Un entrenador que entra a su panel, o que está creándose la cuenta. */
export const TRAINER_BRAND: AuthBrandCopy = {
  headline: (
    <>
      Entrená. Controlá.
      <br />
      <span className="text-brand-green">Crecé.</span>
    </>
  ),
  copy: "Planificá entrenamientos y dietas, seguí el progreso de cada alumno y cobrá tus suscripciones desde un único panel.",
  features: [
    { icon: Dumbbell, label: "Planes de entrenamiento a medida" },
    { icon: Salad, label: "Dietas y control de macros" },
    { icon: Users, label: "El progreso de cada alumno, al día" },
    { icon: CreditCard, label: "Cobros y suscripciones automáticos" },
  ],
  note: "© 2026 JJTECH",
}

/** El otro público: un comercio que propone desafíos y pone el premio. */
export const MERCHANT_BRAND: AuthBrandCopy = {
  headline: (
    <>
      Tus productos,
      <br />
      <span className="text-brand-green">su motivación.</span>
    </>
  ),
  copy: "Proponé un desafío con su premio. Los alumnos lo aceptan, entrenan para cumplirlo y pasan por tu local a retirarlo.",
  features: [
    { icon: Store, label: "Cargá tus productos y su stock" },
    { icon: Gift, label: "El premio lo ponés vos, y se retira en tu local" },
    { icon: PackageCheck, label: "Gestioná las entregas desde tu panel" },
    { icon: Users, label: "Llegá a una audiencia que ya entrena" },
  ],
  note: "© 2026 JJTECH",
}

/**
 * The three slanted bars from the logo, reused as the accent mark.
 *
 * Borrowed rather than invented: it is already the one non-typographic shape in
 * the brand, so repeating it is what ties the decoration to the identity.
 */
export function SpeedBars({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("flex items-center gap-0.75", className)}>
      <span className="h-full w-0.75 -skew-x-12 rounded-[1px] bg-brand-green" />
      <span className="h-full w-0.75 -skew-x-12 rounded-[1px] bg-brand-green/70" />
      <span className="h-full w-0.75 -skew-x-12 rounded-[1px] bg-brand-green/40" />
    </span>
  )
}

/**
 * The branded half of every unauthenticated screen.
 *
 * Full-height column next to the form from `lg` up; a compact band above it
 * below that. The band stays short on purpose — on a phone the submit button
 * matters more than the branding, so the backdrop gets just enough height to
 * set the tone and the form keeps the fold.
 */
export function AuthBrandPanel({ headline, copy, features, note }: AuthBrandCopy) {
  return (
    <section
      className={cn(
        // `isolate` keeps the backdrop's -z-10 layer above the navy background
        // of this section but below its content, without touching the page
        // stacking. The bottom padding clears the sheet that rides over this
        // edge below lg.
        "relative isolate flex min-h-[clamp(11rem,25svh,15rem)] flex-col justify-between overflow-hidden bg-brand-navy px-5 pt-7 pb-14",
        "sm:min-h-[clamp(15rem,32svh,20rem)] sm:px-8",
        "lg:min-h-svh lg:px-12 lg:py-14",
      )}
    >
      <BrandBackdrop />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          aria-label="Mi Entreno"
          className="inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Image
            src="/logo-light.png"
            alt="Mi Entreno"
            width={410}
            height={241}
            priority
            // `--spacing-auth-logo` (80px) is the shared kit's auth logo size.
            className="h-12 w-auto sm:h-14 lg:h-auth-logo"
          />
        </Link>
      </div>

      <div className="hidden max-w-md sm:block">
        <h2 className="font-heading text-headline leading-[1.05] font-semibold tracking-tight text-white uppercase text-balance lg:text-[2.75rem]">
          {headline}
        </h2>
        <p className="mt-3 max-w-sm text-body text-white/70 text-pretty lg:text-body-lg">{copy}</p>

        {features && features.length > 0 && (
          <ul className="mt-8 hidden flex-col gap-3 lg:flex">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-body-lg text-white/85">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-brand-green backdrop-blur-sm">
                  <Icon className="size-4.5" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {note && <p className="hidden text-caption text-white/50 lg:block">{note}</p>}
    </section>
  )
}
