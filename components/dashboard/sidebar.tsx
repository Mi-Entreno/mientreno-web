"use client"

import { LogOut, Pencil, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useLogout } from "@/features/auth/hooks/use-auth-actions"
import { useTrainerProfile } from "@/features/trainer-profile/hooks/use-trainer-profile"
import { cn } from "@/lib/utils"
import { navItems, type NavItem } from "./nav-items"

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname.startsWith(href)
}

export function Sidebar({ initialName }: { initialName?: string | null }) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar bg-linear-to-b from-sidebar-accent/70 via-sidebar to-sidebar md:flex">
      <SidebarProfile initialName={initialName} />

      <nav className="flex flex-1 flex-col gap-1.5 p-3" aria-label="Primary">
        <p className="px-3 pb-1 font-heading text-caption font-semibold tracking-[0.2em] text-sidebar-foreground/40 uppercase">
          Menú
        </p>
        {navItems.map((item) => (
          <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>

      <SidebarFooter />
    </aside>
  )
}

/**
 * The trainer's own card: photo, name, and a shortcut into the profile form.
 *
 * ## Nothing intermediate is ever painted
 *
 * Two earlier versions of this both showed the wrong thing first and corrected
 * themselves a moment later: the word "Entrenador" swapping to a real name, and
 * then the token's `firstName` swapping to the full name. Text changing under
 * the reader is worse than text arriving late — the second version read like
 * the app fixing a mistake.
 *
 * So while the profile is loading this renders a skeleton of the exact size the
 * card will be, and the name appears once, already correct.
 *
 * `initialName` — the `firstName` claim from the session cookie — is a
 * *fallback*, not a placeholder: it is used only after loading finishes without
 * a profile, which is the trainer who has not completed onboarding yet. Even
 * there it beats the hardcoded word, because it is their actual name.
 */
function SidebarProfile({ initialName }: { initialName?: string | null }) {
  const { data: profile, isLoading } = useTrainerProfile()

  return (
    <Link
      href="/dashboard/profile"
      title="Editar perfil"
      className="group flex flex-col items-center gap-3 border-b border-sidebar-border px-6 pt-7 pb-6 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60 focus-visible:ring-inset"
    >
      {isLoading ? (
        <>
          <Skeleton className="size-20 rounded-full bg-sidebar-accent" />
          <Skeleton className="h-5 w-28 bg-sidebar-accent" />
        </>
      ) : (
        <>
          {/* `avatarUrl` is already routed through the authenticated media
              proxy by the mapper, so locally-stored files load. */}
          <UserAvatar
            name={profile?.fullName ?? initialName}
            src={profile?.avatarUrl}
            className="size-20 ring-2 ring-primary/50 ring-offset-4 ring-offset-sidebar transition-all duration-300 ease-out group-hover:scale-105 group-hover:ring-primary motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            fallbackClassName="bg-sidebar-accent font-heading text-title font-semibold text-primary"
          />

          <div className="flex w-full items-center justify-center gap-1.5">
            <p className="truncate font-heading text-subtitle font-semibold tracking-tight text-sidebar-foreground">
              {profile?.fullName ?? initialName ?? "Entrenador"}
            </p>
            <Pencil className="size-3.5 shrink-0 text-sidebar-foreground/40 transition-colors duration-300 group-hover:text-primary motion-reduce:transition-none" />
          </div>
        </>
      )}
    </Link>
  )
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl py-2.5 pr-3 pl-6 text-body font-medium",
        "transition-all duration-300 ease-out motion-reduce:transition-none",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/60 hover:translate-x-0.5 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground motion-reduce:hover:translate-x-0",
      )}
    >
      {active && <DumbbellIndicator />}
      <Icon
        className={cn(
          "size-5 transition-transform duration-300 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
          active && "text-primary",
        )}
      />
      {item.label}
    </Link>
  )
}

/**
 * Active-item marker: a dumbbell stood on its end against the left edge of the
 * row, instead of the usual pill. It only renders inside the active link, so
 * navigating unmounts it from the old row and replays the enter animation on
 * the new one.
 */
function DumbbellIndicator() {
  return (
    <svg
      viewBox="0 0 14 44"
      aria-hidden
      className="absolute top-1/2 left-1.5 h-7 w-2.5 -translate-y-1/2 fill-primary drop-shadow-[0_0_5px_var(--primary)] duration-500 ease-out animate-in fade-in zoom-in-50 slide-in-from-left-2 motion-reduce:animate-none"
    >
      {/* Outer plate, inner plate, handle, and the same pair mirrored. */}
      <rect x="0" y="4" width="14" height="6" rx="3" />
      <rect x="2.5" y="10" width="9" height="4" rx="2" />
      <rect x="5" y="14" width="4" height="16" rx="2" />
      <rect x="2.5" y="30" width="9" height="4" rx="2" />
      <rect x="0" y="34" width="14" height="6" rx="3" />
    </svg>
  )
}

/** Shared shape between the footer's link and its button. */
const FOOTER_ROW =
  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-body font-medium text-sidebar-foreground/60 outline-none transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-sidebar-ring/60 motion-reduce:transition-none"

/**
 * Account actions, kept out of the main nav (see `nav-items`). "Ajustes" lives
 * here because the sidebar's profile card already covers "Mi perfil".
 *
 * "Cobros" used to sit here too, and then also appeared as a card inside
 * Ajustes — the same destination reachable twice from the same corner of the
 * screen. It now lives in Ajustes only. The screens that actually need it (the
 * plans banner, the invite wizard) still deep-link straight to it, which is
 * where a trainer is when the question "¿cómo cobro?" comes up.
 */
function SidebarFooter() {
  const logout = useLogout()

  return (
    <div className="flex flex-col gap-1 border-t border-sidebar-border p-3">
      <Link
        href="/dashboard/settings"
        className={cn(FOOTER_ROW, "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground")}
      >
        <Settings className="size-5 transition-transform duration-300 ease-out group-hover:rotate-45 motion-reduce:transition-none motion-reduce:group-hover:rotate-0" />
        Ajustes
      </Link>

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
