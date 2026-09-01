import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { SpeedBars } from "@/features/auth/components/auth-brand-panel"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Un WebP de 20×27 de `public/auth-hero.webp`, inline.
 *
 * Mismo recurso y mismo placeholder que el panel de las pantallas de acceso:
 * sin él, el primer pintado es un rectángulo navy que después salta a un
 * gimnasio, que en una conexión lenta se lee como una imagen rota.
 */
const HERO_BLUR =
  "data:image/webp;base64,UklGRrYAAABXRUJQVlA4IKoAAADQBACdASoUABsAPu1qsFAppaUiqAqpMB2JYgCuHA93Tf10zdC6zjYl1ltRXNawAAD+0d0JPD8Si9GtAHllILUd8OYNQXbonnxIoBHHt8cBDDijHeCOvtILOh227e3jIMDYK7p4W1xeFsRF3KbOMUaZ0aFZVSiWJKYvr3ohbnA+ZLpfr/O1cTw5rQ3pKbJyn89KAcYU0Kb9J1n5oqmpZLrDk6MvDGhhYgwAAA=="

/**
 * La portada.
 *
 * <p>Deliberadamente sin datos: ni contadores de entrenadores ni catálogo. Un
 * número leído de la base en la ruta más visitada del sitio es una consulta sin
 * caché en el peor lugar posible, y un contador que dice "12 entrenadores" hace
 * más daño que no decir nada.</p>
 */
export function MarketingHero() {
  return (
    <section className="relative isolate flex min-h-[88svh] flex-col overflow-hidden bg-brand-navy px-5 py-8 sm:px-8 lg:px-12 lg:py-14">
      <Image
        src="/auth-hero.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        blurDataURL={HERO_BLUR}
        className="-z-10 object-cover object-[center_32%]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-brand-navy/78" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-t from-brand-navy via-brand-navy/85 to-brand-navy/35 lg:bg-linear-to-br lg:from-brand-navy/95 lg:via-brand-navy/70 lg:to-brand-navy/40"
      />
      <div
        aria-hidden
        className="absolute -top-24 -left-32 -z-10 size-104 rounded-full bg-brand-green/25 blur-[130px]"
      />
      <div
        aria-hidden
        className="absolute -right-24 -bottom-32 -z-10 size-88 rounded-full bg-brand-blue/20 blur-[120px]"
      />

      <header className="flex flex-wrap items-center justify-between gap-4">
        <Image
          src="/logo-light.png"
          alt="Mi Entreno"
          width={410}
          height={241}
          priority
          className="h-12 w-auto sm:h-14"
        />

        {/* Link con las clases del botón y no un Button envolviendo un Link: el
            Button del kit es un base-ui ButtonPrimitive y no expone `asChild`,
            así que anidarlos produciría un <button> con un <a> adentro. */}
        <nav className="flex items-center gap-2" aria-label="Acceso">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-white hover:bg-white/10 hover:text-white",
            )}
          >
            Ingresar
          </Link>
          <Link href="/register" className={buttonVariants({ size: "sm" })}>
            Crear cuenta
          </Link>
        </nav>
      </header>

      <div className="flex flex-1 flex-col justify-center py-14 lg:py-20">
        <SpeedBars className="mb-5 h-5" />
        <h1 className="max-w-3xl font-heading text-display leading-[1.02] font-semibold tracking-tight text-white uppercase text-balance lg:text-[4rem]">
          Entrená. Controlá. <span className="text-brand-green">Crecé.</span>
        </h1>
        <p className="mt-5 max-w-xl text-body-lg text-white/75 text-pretty">
          Mi Entreno conecta a los alumnos con su entrenador y premia la constancia: cada
          entrenamiento suma puntos que se convierten en mancuernas, y las mancuernas se
          canjean por productos reales.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          {/* h-11 sobre el size `lg` (h-9): en el panel esos 36 px conviven con
              controles densos, pero acá es el CTA principal y en un teléfono
              queda por debajo del área táctil recomendada. */}
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}
          >
            Empezar ahora
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="#accesos"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 border-white/25 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white",
            )}
          >
            Ver las dos formas de entrar
          </Link>
        </div>
      </div>
    </section>
  )
}
