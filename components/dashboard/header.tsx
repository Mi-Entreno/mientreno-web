"use client"

import { LogOut, Settings, User } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/features/notifications/components/notification-bell"
import { useTrainerProfile } from "@/features/trainer-profile/hooks/use-trainer-profile"

const TITLES: Record<string, string> = {
  "/dashboard": "Inicio",
  "/dashboard/profile": "Mi perfil",
  "/dashboard/settings": "Ajustes",
  "/dashboard/notifications": "Notificaciones",
  "/dashboard/profile/preview": "Vista pública",
  "/dashboard/directory": "Directorio",
  "/dashboard/plans": "Planes de suscripción",
  "/dashboard/students": "Mis alumnos",
  "/dashboard/training-plans": "Planes de entrenamiento",
  "/dashboard/nutrition-plans": "Planes de nutrición",
  "/dashboard/exercises": "Catálogo de ejercicios",
  "/dashboard/foods": "Catálogo de alimentos",
}

function titleFor(pathname: string) {
  if (pathname.startsWith("/dashboard/students/")) return "Detalle del alumno"
  return TITLES[pathname] ?? "Inicio"
}

export function DashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const title = titleFor(pathname)
  const { data: profile } = useTrainerProfile()

  async function logout() {
    await fetch("/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const initials = profile?.fullName
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
    : "T"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <h1 className="text-subtitle font-semibold tracking-tight sm:text-title">{title}</h1>

      <div className="flex items-center gap-1">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="flex items-center gap-2 px-2" />}
          >
            <Avatar className="size-8">
              {/* `avatarUrl` is already routed through the authenticated media
                  proxy by the mapper, so locally-stored files load. */}
              <AvatarImage src={profile?.avatarUrl ?? "/placeholder.svg"} alt="" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-body font-medium sm:inline">
              {profile?.fullName ?? "Entrenador"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              <User className="size-4" />
              Perfil
            </DropdownMenuItem>
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
