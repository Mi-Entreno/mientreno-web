import { Dumbbell, Gift, PackageCheck, Salad, Store, Users, type LucideIcon } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Audience {
  icon: LucideIcon
  eyebrow: string
  title: string
  copy: string
  points: { icon: LucideIcon; label: string }[]
  loginHref: string
  registerHref: string
}

/**
 * Los dos públicos del panel.
 *
 * <p>Se muestran a la par y con el mismo peso visual a propósito: no son un
 * camino principal y una excepción, son dos negocios distintos que entran por
 * la misma puerta.</p>
 */
const AUDIENCES: Audience[] = [
  {
    icon: Dumbbell,
    eyebrow: "Para entrenadores",
    title: "Gestioná tus alumnos",
    copy: "Armá planes de entrenamiento y nutrición, seguí el progreso de cada alumno y cobrá tus suscripciones desde un solo panel.",
    points: [
      { icon: Dumbbell, label: "Planes de entrenamiento a medida" },
      { icon: Salad, label: "Dietas y control de macros" },
      { icon: Users, label: "El progreso de cada alumno, al día" },
    ],
    loginHref: "/login",
    registerHref: "/register",
  },
  {
    icon: Store,
    eyebrow: "Para comercios y marcas",
    title: "Sumá tus productos",
    copy: "Cargá tus productos al catálogo de premios. Los alumnos los canjean con las mancuernas que ganaron entrenando, y vos llegás a gente que ya está en movimiento.",
    points: [
      { icon: Gift, label: "Tus productos en el catálogo de canjes" },
      { icon: PackageCheck, label: "Entregas y stock desde tu panel" },
      { icon: Users, label: "Una audiencia que ya entrena" },
    ],
    loginHref: "/comercio/login",
    registerHref: "/comercio/register",
  },
]

export function AudienceCards() {
  return (
    <section id="accesos" className="scroll-mt-8 px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading text-headline font-semibold tracking-tight uppercase text-balance">
          ¿Desde dónde entrás?
        </h2>
        <p className="mt-2.5 max-w-xl text-body-lg text-muted-foreground text-pretty">
          El panel es el mismo para los dos, pero cada uno tiene su propio espacio.
        </p>

        <div className="mt-9 grid gap-5 md:grid-cols-2">
          {AUDIENCES.map((audience) => (
            <AudienceCard key={audience.eyebrow} audience={audience} />
          ))}
        </div>

        <p className="mt-7 text-body text-muted-foreground text-pretty">
          ¿Sos alumno? Tu lugar es la app móvil: desde ahí entrenás, sumás mancuernas y canjeás
          tus premios.
        </p>
      </div>
    </section>
  )
}

function AudienceCard({ audience }: { audience: Audience }) {
  const Icon = audience.icon

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary-text">
        <Icon className="size-5.5" />
      </span>

      <p className="mt-5 font-mono text-caption tracking-widest text-muted-foreground uppercase">
        {audience.eyebrow}
      </p>
      <h3 className="mt-1 font-heading text-title font-semibold tracking-tight uppercase text-balance">
        {audience.title}
      </h3>
      <p className="mt-2.5 text-body text-muted-foreground text-pretty">{audience.copy}</p>

      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
        {audience.points.map(({ icon: PointIcon, label }) => (
          <li key={label} className="flex items-center gap-2.5 text-body">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-primary-text">
              <PointIcon className="size-3.5" />
            </span>
            {label}
          </li>
        ))}
      </ul>

      <div className="mt-7 flex flex-wrap gap-2.5">
        <Link href={audience.loginHref} className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>
          Ingresar
        </Link>
        <Link
          href={audience.registerHref}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4")}
        >
          Registrate
        </Link>
      </div>
    </article>
  )
}
