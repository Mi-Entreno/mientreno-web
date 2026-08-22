import { ArrowLeft } from "lucide-react"
import Link from "next/link"

/** Shared chrome for the read-only pages hanging off settings. */
export function SettingsPageShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex max-w-prose flex-col gap-6">
      <Link
        href="/dashboard/settings"
        className="flex w-fit items-center gap-1.5 text-body text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a ajustes
      </Link>

      <div>
        <h1 className="font-heading text-title font-semibold tracking-tight text-balance">
          {title}
        </h1>
        <p className="mt-1 text-body text-muted-foreground text-pretty">{description}</p>
      </div>

      {children}
    </div>
  )
}
