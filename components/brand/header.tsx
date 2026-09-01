"use client"

import { LogOut } from "lucide-react"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useLogout } from "@/features/auth/hooks/use-auth-actions"

const TITLES: Record<string, string> = {
  "/comercio": "Inicio",
  "/comercio/productos": "Productos",
  "/comercio/canjes": "Canjes",
  "/comercio/perfil": "Mi comercio",
}

function titleFor(pathname: string) {
  if (pathname.startsWith("/comercio/productos/")) return "Detalle del producto"
  return TITLES[pathname] ?? "Inicio"
}

/**
 * Merchant header.
 *
 * No notification bell: the merchant has no notification feed upstream yet. An
 * empty bell would promise something that never arrives.
 */
export function BrandHeader() {
  const pathname = usePathname()
  const logout = useLogout()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <h1 className="font-heading text-subtitle font-semibold tracking-tight uppercase">
        {titleFor(pathname)}
      </h1>

      <Button variant="ghost" size="sm" onClick={logout} className="md:hidden">
        <LogOut className="size-4" />
        Salir
      </Button>
    </header>
  )
}
