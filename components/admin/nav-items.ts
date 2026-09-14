import { Store } from "lucide-react"

import type { NavItem } from "@/components/dashboard/nav-items"

/**
 * Navegación de administración. Una sola entrada, y el padrón es la home.
 *
 * Había tres: una cola de moderación de productos, el alta de desafíos de la
 * plataforma y el padrón de comercios. Las dos primeras desaparecieron con el
 * modelo nuevo — el desafío y su premio son del comercio, que los paga y los
 * entrega, así que no hay contenido de terceros que aprobar de a uno. Lo que la
 * plataforma sigue decidiendo es quién puede publicar.
 */
export const adminNavItems: NavItem[] = [
  { label: "Comercios", href: "/admin/comercios", icon: Store },
]
