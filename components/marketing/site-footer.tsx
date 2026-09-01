import Image from "next/image"
import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-brand-navy px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <Image src="/logo-light.png" alt="Mi Entreno" width={410} height={241} className="h-10 w-auto" />

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-body" aria-label="Pie">
          <Link href="/login" className="text-white/70 transition-colors hover:text-white">
            Ingresar como entrenador
          </Link>
          <Link href="/comercio/login" className="text-white/70 transition-colors hover:text-white">
            Ingresar como comercio
          </Link>
        </nav>
      </div>

      <p className="mx-auto mt-8 max-w-5xl text-caption text-white/45">© 2026 JJTECH</p>
    </footer>
  )
}
