import {
  Activity,
  Banknote,
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
 * sidebar's profile card and "Ajustes" from its footer.
 *
 * "Invitaciones" earns a slot here because it is a queue: something is waiting
 * for an answer, and a trainer needs to see the pending ones without hunting
 * for them.
 *
 * "Cobros" earns one for the same reason. It used to live only inside Ajustes,
 * but bank transfers made it a queue too: a proof a student uploaded waits
 * there for the trainer to approve it, and the student's plan does not start
 * until they do. Buried two clicks deep, trainers never found it.
 *
 * "Adherencia" (Pro) earns one for the same reason: it is the list of students
 * who need a message this week. Without Pro the page explains the benefit.
 */
export const navItems: NavItem[] = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { label: "Planes", href: "/dashboard/plans", icon: CreditCard },
  { label: "Mis alumnos", href: "/dashboard/students", icon: Users },
  { label: "Adherencia", href: "/dashboard/adherence", icon: Activity },
  { label: "Invitaciones", href: "/dashboard/invitations", icon: Send },
  { label: "Cobros", href: "/dashboard/payments", icon: Banknote },
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
