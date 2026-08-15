import Image from "next/image"
import Link from "next/link"

/**
 * Shared frame for every unauthenticated screen, so login, register, OTP and
 * password recovery read as one flow rather than four separate pages.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="w-full max-w-app">
      <Link href="/login" className="mb-8 flex items-center gap-4">
        <Image
          src="/logo.png"
          alt="Mi Entreno"
          width={410}
          height={241}
          priority
          className="h-16 w-auto"
        />
        <span className="border-l border-border pl-4 text-body text-muted-foreground">
          Espacio del entrenador
        </span>
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h1 className="text-title font-semibold tracking-tight text-balance">{title}</h1>
        {description && <p className="mt-2 text-body text-muted-foreground text-pretty">{description}</p>}
        {children}
      </div>

      {footer && <div className="mt-6 text-center text-body text-muted-foreground">{footer}</div>}
    </div>
  )
}
