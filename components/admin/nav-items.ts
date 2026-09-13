import { ShieldCheck, Store, Trophy } from "lucide-react"

import type { NavItem } from "@/components/dashboard/nav-items"

/**
 * Moderation navigation. Three entries, and no "Inicio".
 *
 * The queue *is* the home: an admin opens this zone to resolve what is waiting,
 * not to read a summary of it. A dashboard in front of three screens would be a
 * click between the person and their only job.
 */
export const adminNavItems: NavItem[] = [
  { label: "Revisión", href: "/admin", icon: ShieldCheck },
  // Cola aparte y no un filtro más de la primera: un producto y una recompensa se
  // revisan mirando cosas opuestas —un precio bajo de más vacía la economía, un
  // premio alto de más la infla— y mezclarlas invita a aprobar con el criterio
  // equivocado.
  { label: "Recompensas", href: "/admin/desafios", icon: Trophy },
  { label: "Comercios", href: "/admin/comercios", icon: Store },
]
