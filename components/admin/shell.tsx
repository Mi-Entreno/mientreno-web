"use client"

import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { SidebarLink } from "@/components/dashboard/sidebar-link"
import { useLogout } from "@/features/auth/hooks/use-auth-actions"
import { cn } from "@/lib/utils"
import { adminNavItems } from "./nav-items"

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname.startsWith(href)
}

const TITLES: Record<string, string> = {
  "/admin": "Productos en revisión",
  "/admin/comercios": "Comercios",
}

/**
 * Moderation shell.
 *
 * Visually distinct from the other two on purpose — a darker header strip and
 * the shield mark — because acting here changes what other people see. Someone
 * who moderates *and* trains should never be unsure which panel they are in.
 *
 * The "volver al panel" link is not decoration: ROLE_ADMIN is granted on top of
 * an account, so most admins have somewhere else to be.
 */
export function AdminShell({ children, canReturnTo }: { children: React.ReactNode; canReturnTo: string | null }) {
  const pathname = usePathname()
  const logout = useLogout()

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-brand-navy md:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-6">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-brand-green">
            <ShieldCheck className="size-4.5" />
          </span>
          <div>
            <p className="font-heading text-body font-semibold text-white uppercase">Moderación</p>
            <p className="text-caption text-white/50">Mi Entreno</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 p-3" aria-label="Primary">
          {adminNavItems.map((item) => (
            <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t border-white/10 p-3">
          {canReturnTo && (
            <Link
              href={canReturnTo}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-body font-medium",
                "text-white/60 transition-colors hover:bg-white/10 hover:text-white",
              )}
            >
              <ArrowLeft className="size-5" />
              Volver a mi panel
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-body font-medium",
              "text-white/60 transition-colors hover:bg-destructive/20 hover:text-white",
            )}
          >
            <LogOut className="size-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <h1 className="font-heading text-subtitle font-semibold tracking-tight uppercase">
            {TITLES[pathname] ?? "Moderación"}
          </h1>

          {/* En móvil la barra lateral no está, así que la navegación vive acá. */}
          <nav className="flex items-center gap-1 md:hidden" aria-label="Primary">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-caption font-medium transition-colors",
                  isActive(pathname, item.href)
                    ? "bg-primary/10 text-primary-text"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
