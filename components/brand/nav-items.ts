import { Gift, LayoutDashboard, PackageCheck, Store } from "lucide-react"

import type { NavItem } from "@/components/dashboard/nav-items"

/**
 * Merchant navigation.
 *
 * Four entries and no "Ajustes": the merchant panel has one settings surface —
 * the profile — and burying it behind a second menu would be a level of
 * indirection over a single screen.
 *
 * There used to be a fifth, "Recompensas", for reward challenges. It went away
 * when challenges moved to the admin panel: a challenge **mints** reps, and who
 * mints them has to be whoever answers for the economy. What the merchant offers
 * — the rewards a student redeems, which **spend** reps — is the whole of its job
 * here, so it took over the name.
 *
 * "Canjes" earns a slot for the same reason "Invitaciones" does in the trainer
 * panel: it is a queue. Something is waiting to be handed over.
 */
export const brandNavItems: NavItem[] = [
  { label: "Inicio", href: "/comercio", icon: LayoutDashboard },
  { label: "Recompensas", href: "/comercio/recompensas", icon: Gift },
  { label: "Canjes", href: "/comercio/canjes", icon: PackageCheck },
  { label: "Mi comercio", href: "/comercio/perfil", icon: Store },
]
