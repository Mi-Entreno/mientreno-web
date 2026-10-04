import { BarChart3, CreditCard, Receipt, Store } from "lucide-react"

import type { NavItem } from "@/components/dashboard/nav-items"

/**
 * Navegación de administración. El padrón de comercios sigue siendo la home.
 *
 * Había tres: una cola de moderación de productos, el alta de desafíos de la
 * plataforma y el padrón de comercios. Las dos primeras desaparecieron con el
 * modelo nuevo — el desafío y su premio son del comercio, que los paga y los
 * entrega, así que no hay contenido de terceros que aprobar de a uno. Lo que la
 * plataforma sigue decidiendo es quién puede publicar.
 *
 * Planes y Membresías se sumaron con las membresías de la plataforma: precios y
 * límites se cambian desde acá, sin deploy, y quién paga qué se consulta acá.
 */
export const adminNavItems: NavItem[] = [
  { label: "Comercios", href: "/admin/comercios", icon: Store },
  { label: "Planes", href: "/admin/planes", icon: CreditCard },
  { label: "Membresías", href: "/admin/membresias", icon: Receipt },
  { label: "Métricas", href: "/admin/metricas", icon: BarChart3 },
]
