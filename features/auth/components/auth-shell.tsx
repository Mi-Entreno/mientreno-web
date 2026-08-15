import type { ReactNode } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { AuthBrandPanel, SpeedBars, TRAINER_BRAND, type AuthBrandCopy } from "./auth-brand-panel"

interface AuthShellProps {
  /** Omit on screens that own their heading, such as the invitation landing. */
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  /** Defaults to the trainer pitch; override for a different audience. */
  brand?: AuthBrandCopy
}

/**
 * Shared frame for every unauthenticated screen, so login, register, OTP and
 * password recovery read as one flow rather than four separate pages.
 *
 * Two columns from `lg` up — photograph and pitch on one side, form on the
 * other — collapsing to a photo band above a sheet below that. The form column
 * carries its own light surface rather than a card floating on the page: on a
 * wide screen a boxed form leaves a ring of empty white around it, which is the
 * exact impression this layout exists to avoid.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
  brand = TRAINER_BRAND,
}: AuthShellProps) {
  return (
    <main className="relative flex min-h-svh flex-col bg-brand-navy lg:grid lg:grid-cols-[1.05fr_1fr] xl:grid-cols-[1.15fr_1fr]">
      <AuthBrandPanel {...brand} />

      <AuthContentColumn>
        {title && (
          <header>
            <SpeedBars className="mb-4 h-4" />
            <h1 className="text-headline font-semibold tracking-tight text-balance uppercase lg:text-display">
              {title}
            </h1>
            {description && (
              <p className="mt-2.5 text-body-lg text-muted-foreground text-pretty">{description}</p>
            )}
          </header>
        )}

        {children}

        {footer && (
          <div className="mt-7 border-t border-border pt-5 text-center text-body text-muted-foreground text-pretty">
            {footer}
          </div>
        )}
      </AuthContentColumn>
    </main>
  )
}

/**
 * The light half: a tinted surface with soft brand glows rather than flat
 * white, plus the sheet treatment that lets it ride over the photo on small
 * screens.
 */
function AuthContentColumn({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "relative z-10 -mt-7 flex flex-1 flex-col rounded-t-2xl bg-background",
        "shadow-[0_-20px_44px_-16px_rgba(8,19,36,0.5)]",
        "lg:mt-0 lg:rounded-none lg:shadow-none",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-2xl lg:rounded-none"
      >
        <div className="absolute -top-28 -right-24 size-80 rounded-full bg-brand-green/18 blur-[100px]" />
        <div className="absolute -bottom-16 -left-28 size-72 rounded-full bg-brand-blue/12 blur-[100px]" />
      </div>

      <div className="relative flex flex-1 flex-col justify-center px-5 pt-8 pb-8 sm:px-8 lg:px-12 lg:py-14">
        <div className="mx-auto w-full max-w-app">{children}</div>
      </div>

      <p className="relative px-5 pb-6 text-center text-caption text-muted-foreground sm:px-8">
        Mi Entreno
      </p>
    </div>
  )
}

/**
 * Suspense fallback for the screens that read the query string.
 *
 * Rendering the frame with a stand-in form keeps the layout from appearing in
 * two steps — the alternative is a bare navy panel while the client component
 * boots.
 */
export function AuthShellFallback() {
  return (
    <AuthShell>
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="mt-3 h-5 w-full" />
      <div className="mt-8 flex flex-col gap-5">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </AuthShell>
  )
}
