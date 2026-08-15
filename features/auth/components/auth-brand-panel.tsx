import { CreditCard, Dumbbell, Salad, Users, type LucideIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * A 20×27 WebP of `public/auth-hero.webp`, inlined.
 *
 * The photo *is* the panel: without a placeholder the first paint is a flat
 * navy rectangle that then pops into a gym, which reads as a broken image on a
 * slow connection.
 */
const HERO_BLUR =
  "data:image/webp;base64,UklGRrYAAABXRUJQVlA4IKoAAADQBACdASoUABsAPu1qsFAppaUiqAqpMB2JYgCuHA93Tf10zdC6zjYl1ltRXNawAAD+0d0JPD8Si9GtAHllILUd8OYNQXbonnxIoBHHt8cBDDijHeCOvtILOh227e3jIMDYK7p4W1xeFsRF3KbOMUaZ0aFZVSiWJKYvr3ohbnA+ZLpfr/O1cTw5rQ3pKbJyn89KAcYU0Kb9J1n5oqmpZLrDk6MvDGhhYgwAAA=="

export interface AuthBrandCopy {
  /** Small pill next to the logo — says which side of the product you are on. */
  headline: ReactNode
  copy: string
  /** Desktop-only value props. Omitted on screens that sell nothing. */
  features?: { icon: LucideIcon; label: string }[]
  /** Fine print pinned to the bottom of the tall desktop panel. */
  note?: string
}

/** The default: someone signing in to, or signing up for, the trainer panel. */
export const TRAINER_BRAND: AuthBrandCopy = {
  headline: (
    <>
      Entrena. Controla.
      <br />
      <span className="text-brand-green">Crece.</span>
    </>
  ),
  copy: "Planifica entrenamientos y dietas, sigue el progreso de cada alumno y cobra tus suscripciones desde un único panel.",
  features: [
    { icon: Dumbbell, label: "Planes de entrenamiento a medida" },
    { icon: Salad, label: "Dietas y control de macros" },
    { icon: Users, label: "El progreso de cada alumno, al día" },
    { icon: CreditCard, label: "Cobros y suscripciones automáticos" },
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
 * matters more than the photograph, so the image gets just enough height to set
 * the tone and the form keeps the fold.
 */
export function AuthBrandPanel({ headline, copy, features, note }: AuthBrandCopy) {
  return (
    <section
      className={cn(
        // `isolate` keeps the -z-10 layers above the navy background of this
        // section but below its content, without touching the page stacking.
        // The bottom padding clears the sheet that rides over this edge below lg.
        "relative isolate flex min-h-[clamp(11rem,25svh,15rem)] flex-col justify-between overflow-hidden bg-brand-navy px-5 pt-7 pb-14",
        "sm:min-h-[clamp(15rem,32svh,20rem)] sm:px-8",
        "lg:min-h-svh lg:px-12 lg:py-14",
      )}
    >
      <Image
        src="/auth-hero.webp"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 55vw, 100vw"
        placeholder="blur"
        blurDataURL={HERO_BLUR}
        className="-z-10 object-cover object-[center_22%] lg:object-[center_38%]"
      />

      {/* Navy wash first, then a directional gradient: together they turn a
          grey-and-skin photograph into something that belongs to the palette
          instead of a picture parked behind a form. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-brand-navy/72" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-t from-brand-navy via-brand-navy/80 to-brand-navy/25 lg:bg-linear-to-br lg:from-brand-navy/95 lg:via-brand-navy/65 lg:to-brand-navy/35"
      />
      <div
        aria-hidden
        className="absolute -top-24 -left-32 -z-10 size-104 rounded-full bg-brand-green/25 blur-[130px]"
      />
      <div
        aria-hidden
        className="absolute -right-24 -bottom-32 -z-10 size-88 rounded-full bg-brand-blue/20 blur-[120px]"
      />
      {/* Below lg the form sheet slides over this edge; the fade stops the seam
          from reading as a hard cut. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-linear-to-t from-brand-navy to-transparent lg:hidden"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/login"
          aria-label="Mi Entreno"
          className="inline-flex rounded-md outline-none focus-visible:ring-3 focus-visible:ring-brand-green/60"
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
