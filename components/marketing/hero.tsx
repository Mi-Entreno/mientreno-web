import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { SpeedBars } from "@/features/auth/components/auth-brand-panel"
import { BrandBackdrop } from "@/components/shared/brand-backdrop"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
      <BrandBackdrop />

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
          {/* A la sección de públicos y no derecho a `/register`: el registro es
              lo único que sí depende de quién sos —`/auth/trainer/register` y
              `/auth/brand/register` crean cuentas con roles distintos— y este
              botón mandaba a un comercio a registrarse como entrenador sin que
              se enterara. "Ingresar" no necesita el desvío: el login es el mismo
              para los dos y el destino sale del JWT. */}
          <Link href="#accesos" className={buttonVariants({ size: "sm" })}>
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
          Mi Entreno conecta a los alumnos con su entrenador y premia la constancia: los
          comercios proponen desafíos con recompensa, y lo que entrenás te acerca a un premio
          real.
        </p>

        {/* Los dos CTA son el par que la portada tiene que ofrecer: crear cuenta,
            que pasa por elegir público, e ingresar, que no. El secundario era un
            "Ver las dos formas de entrar" que iba a la misma ancla que el
            primario — dos botones para el mismo destino, y ninguno para quien ya
            tiene cuenta. */}
        <div className="mt-9 flex flex-wrap items-center gap-3">
          {/* h-11 sobre el size `lg` (h-9): en el panel esos 36 px conviven con
              controles densos, pero acá es el CTA principal y en un teléfono
              queda por debajo del área táctil recomendada. */}
          <Link href="#accesos" className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}>
            Empezar ahora
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 border-white/25 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white",
            )}
          >
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </section>
  )
}
