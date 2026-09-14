import { LayoutDashboard, PackageCheck, Store, Target } from "lucide-react"

import type { NavItem } from "@/components/dashboard/nav-items"

/**
 * Navegación del comercio.
 *
 * Cuatro entradas y ningún "Ajustes": el panel tiene una sola superficie de
 * configuración —el perfil— y esconderla detrás de un segundo menú sería un
 * nivel de indirección sobre una única pantalla.
 *
 * "Desafíos" reemplaza a la vieja "Recompensas". No es un cambio de nombre: la
 * recompensa dejó de ser un ítem de catálogo con precio y pasó a ser lo que un
 * desafío entrega, así que la pantalla donde se la carga es la del desafío.
 *
 * "Canjes" se gana un lugar por el mismo motivo que "Invitaciones" en el panel
 * del entrenador: es una cola. Hay algo esperando a ser entregado.
 */
export const brandNavItems: NavItem[] = [
  { label: "Inicio", href: "/comercio", icon: LayoutDashboard },
  { label: "Desafíos", href: "/comercio/desafios", icon: Target },
  { label: "Canjes", href: "/comercio/canjes", icon: PackageCheck },
  { label: "Mi comercio", href: "/comercio/perfil", icon: Store },
]
