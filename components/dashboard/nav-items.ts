import {
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Salad,
  Send,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

/**
 * Main navigation, kept short on purpose. "Mi perfil" is reached from the
 * sidebar's profile card, "Ajustes" from its footer, and "Cobros" from inside
 * Ajustes — plus a direct link from the screens where charging actually comes
 * up.
 *
 * "Invitaciones" earns a slot here because it is a queue: something is waiting
 * for an answer, and a trainer needs to see the pending ones without hunting
 * for them.
 */
export const navItems: NavItem[] = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { label: "Planes", href: "/dashboard/plans", icon: CreditCard },
  { label: "Mis alumnos", href: "/dashboard/students", icon: Users },
  { label: "Invitaciones", href: "/dashboard/invitations", icon: Send },
  { label: "Entrenamiento", href: "/dashboard/training-plans", icon: Dumbbell },
  { label: "Nutrición", href: "/dashboard/nutrition-plans", icon: Salad },
]

/**
 * A subset shown in the mobile bottom navigation.
 *
 * Deliberately still five: a sixth column drops each label to roughly 60 px on
 * a 360 px screen, and "Nutrición" already fills that. Invitations reach mobile
 * through the button on "Mis alumnos" instead.
 */
export const mobileNavItems: NavItem[] = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { label: "Alumnos", href: "/dashboard/students", icon: Users },
  { label: "Entreno", href: "/dashboard/training-plans", icon: Dumbbell },
  { label: "Nutrición", href: "/dashboard/nutrition-plans", icon: Salad },
  { label: "Planes", href: "/dashboard/plans", icon: CreditCard },
]
