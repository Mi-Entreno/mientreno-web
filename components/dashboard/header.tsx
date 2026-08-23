"use client"

import { LogOut, Settings, User } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLogout } from "@/features/auth/hooks/use-auth-actions"
import { NotificationBell } from "@/features/notifications/components/notification-bell"
import { useTrainerProfile } from "@/features/trainer-profile/hooks/use-trainer-profile"

const TITLES: Record<string, string> = {
  "/dashboard": "Inicio",
  "/dashboard/profile": "Mi perfil",
  "/dashboard/settings": "Ajustes",
  "/dashboard/settings/privacidad": "Privacidad",
  "/dashboard/settings/acerca-de": "Acerca de",
  "/dashboard/notifications": "Notificaciones",
  "/dashboard/plans": "Planes de suscripción",
  "/dashboard/students": "Mis alumnos",
  "/dashboard/invitations": "Invitaciones",
  "/dashboard/payments": "Cobros",
  "/dashboard/payments/callback": "Cobros",
  "/dashboard/training-plans": "Planes de entrenamiento",
  "/dashboard/nutrition-plans": "Planes de nutrición",
}

function titleFor(pathname: string) {
  if (pathname.startsWith("/dashboard/students/")) return "Detalle del alumno"
  return TITLES[pathname] ?? "Inicio"
}

export function DashboardHeader({ initialName }: { initialName?: string | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const title = titleFor(pathname)
  const { data: profile, isLoading } = useTrainerProfile()
  const logout = useLogout()

  // `initialName` (the token's `firstName` claim) is a fallback for the trainer
  // who has no profile yet, never a placeholder shown while loading — see the
  // note on `SidebarProfile`.
  const name = profile?.fullName ?? initialName ?? "Entrenador"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <h1 className="text-subtitle font-semibold tracking-tight sm:text-title">{title}</h1>

      <div className="flex items-center gap-1">
        <NotificationBell />

        {/* Mobile only: below `md` there is no sidebar, so this stays the one
            way into the profile, settings and logout. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="flex items-center gap-2 px-2 md:hidden" />}
          >
            {/* `avatarUrl` is already routed through the authenticated media
                proxy by the mapper, so locally-stored files load. */}
            {isLoading ? (
              <>
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="hidden h-4 w-24 sm:inline-block" />
              </>
            ) : (
              <>
                <UserAvatar name={name} src={profile?.avatarUrl} className="size-8" />
                <span className="hidden text-body font-medium sm:inline">{name}</span>
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              <User className="size-4" />
              Perfil
            </DropdownMenuItem>
            {/* Invitations are reached from "Mis alumnos" and cobros from
                Ajustes, so neither is repeated here. */}
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <Settings className="size-4" />
              Ajustes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="text-error-text focus:text-error-text">
              <LogOut className="size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
