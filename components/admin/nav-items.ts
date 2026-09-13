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
  // No es una segunda cola de revisión: es donde se **configuran** los desafíos. Son
  // la mitad de la economía que acuña repes, y la carga la plataforma justamente para
  // que no haya nada que revisarle a un tercero. La otra mitad —las recompensas que
  // publica cada comercio, que las gastan— es la que se revisa en "Revisión".
  { label: "Desafíos", href: "/admin/desafios", icon: Trophy },
  { label: "Comercios", href: "/admin/comercios", icon: Store },
]
