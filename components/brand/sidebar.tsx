"use client"

import { LogOut, Store } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { SidebarLink } from "@/components/dashboard/sidebar-link"
import { Skeleton } from "@/components/ui/skeleton"
import { useLogout } from "@/features/auth/hooks/use-auth-actions"
import { useBrandProfile } from "@/features/brand/hooks/use-brand"
import { cn } from "@/lib/utils"
import { brandNavItems } from "./nav-items"

function isActive(pathname: string, href: string) {
  if (href === "/comercio") return pathname === "/comercio"
  return pathname.startsWith(href)
}

/**
 * Merchant sidebar.
 *
 * Its own component rather than a mode of the trainer one: the shells share the
 * nav row (`SidebarLink`) and nothing else. The trainer's card carries an
 * avatar, a profile shortcut and a settings footer; this one carries a logo and
 * a sign-out. Folding both into one parameterised shell would have produced a
 * component with two personalities and no clear owner.
 */
export function BrandSidebar({ initialName }: { initialName?: string | null }) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar bg-linear-to-b from-sidebar-accent/70 via-sidebar to-sidebar md:flex">
      <BrandCard initialName={initialName} />

      <nav className="flex flex-1 flex-col gap-1.5 p-3" aria-label="Primary">
        <p className="px-3 pb-1 font-heading text-caption font-semibold tracking-[0.2em] text-sidebar-foreground/40 uppercase">
          Menú
        </p>
        {brandNavItems.map((item) => (
          <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>

      <SignOutFooter />
    </aside>
  )
}

/**
 * The merchant's own card.
 *
 * Same rule as the trainer's: while the profile loads this renders a skeleton
 * the size of the finished card rather than a placeholder word. Text that
 * changes under the reader looks like the app correcting a mistake.
 */
function BrandCard({ initialName }: { initialName?: string | null }) {
  const { data: profile, isLoading } = useBrandProfile()

  return (
    <Link
      href="/comercio/perfil"
      title="Editar mi comercio"
      className="group flex flex-col items-center gap-3 border-b border-sidebar-border px-6 pt-7 pb-6 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60 focus-visible:ring-inset"
    >
      {isLoading ? (
        <>
          <Skeleton className="size-20 rounded-2xl bg-sidebar-accent" />
          <Skeleton className="h-5 w-28 bg-sidebar-accent" />
        </>
      ) : (
        <>
          <span className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar-accent">
            {profile?.logoUrl ? (
              // Already routed through the authenticated media proxy by the mapper.
              <Image
                src={profile.logoUrl}
                alt=""
                width={80}
                height={80}
                className="size-full object-cover"
                unoptimized
              />
            ) : (
              <Store className="size-8 text-sidebar-foreground/50" />
            )}
          </span>

          <div className="text-center">
            <p className="font-heading text-body-lg font-semibold text-sidebar-foreground">
              {profile?.displayName ?? initialName ?? "Mi comercio"}
            </p>
            {profile?.status === "SUSPENDED" && (
              <p className="mt-0.5 text-caption text-error-text">Cuenta suspendida</p>
            )}
          </div>
        </>
      )}
    </Link>
  )
}

const FOOTER_ROW =
  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-body font-medium text-sidebar-foreground/60 outline-none transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-sidebar-ring/60 motion-reduce:transition-none"

function SignOutFooter() {
  const logout = useLogout()

  return (
    <div className="flex flex-col gap-1 border-t border-sidebar-border p-3">
      <button
        type="button"
        onClick={logout}
        className={cn(FOOTER_ROW, "hover:bg-destructive/15 hover:text-destructive")}
      >
        <LogOut className="size-5 transition-transform duration-300 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
        Cerrar sesión
      </button>
    </div>
  )
}
