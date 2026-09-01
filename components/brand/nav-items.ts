import { Gift, LayoutDashboard, PackageCheck, Store } from "lucide-react"

import type { NavItem } from "@/components/dashboard/nav-items"

/**
 * Merchant navigation.
 *
 * Four entries and no "Ajustes": the merchant panel has one settings surface —
 * the profile — and burying it behind a second menu would be a level of
 * indirection over a single screen.
 *
 * "Canjes" earns a slot for the same reason "Invitaciones" does in the trainer
 * panel: it is a queue. Something is waiting to be handed over.
 */
export const brandNavItems: NavItem[] = [
  { label: "Inicio", href: "/comercio", icon: LayoutDashboard },
  { label: "Productos", href: "/comercio/productos", icon: Gift },
  { label: "Canjes", href: "/comercio/canjes", icon: PackageCheck },
  { label: "Mi comercio", href: "/comercio/perfil", icon: Store },
]
