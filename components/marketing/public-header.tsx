import Image from "next/image"
import Link from "next/link"

/**
 * The header of the public pages that live outside the landing (documents,
 * support): logo back to `/` and one link to the section the page belongs to.
 */
export function PublicHeader({ link }: { link: { href: string; label: string } }) {
  return (
    <header className="border-b border-border bg-brand-navy px-5 py-4 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <Link href="/" aria-label="Ir a la portada de Mi Entreno">
          <Image
            src="/logo-light.png"
            alt="Mi Entreno"
            width={410}
            height={241}
            className="h-9 w-auto"
          />
        </Link>
        <Link
          href={link.href}
          className="text-body text-white/70 transition-colors hover:text-white"
        >
          {link.label}
        </Link>
      </div>
    </header>
  )
}
