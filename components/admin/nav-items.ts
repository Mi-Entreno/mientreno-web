import { ShieldCheck, Store } from "lucide-react"

import type { NavItem } from "@/components/dashboard/nav-items"

/**
 * Moderation navigation. Two entries, and no "Inicio".
 *
 * The queue *is* the home: an admin opens this zone to resolve what is waiting,
 * not to read a summary of it. A dashboard in front of two screens would be a
 * click between the person and their only job.
 */
export const adminNavItems: NavItem[] = [
  { label: "Revisión", href: "/admin", icon: ShieldCheck },
  { label: "Comercios", href: "/admin/comercios", icon: Store },
]
