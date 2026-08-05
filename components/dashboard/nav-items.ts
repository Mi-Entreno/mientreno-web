import {
  Apple,
  Compass,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Library,
  Salad,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

/**
 * Main navigation, grouped so the two catalogues do not read as more plan
 * sections. "Mi perfil" and "Ajustes" live in the avatar menu instead — with
 * both catalogues added, a flat list had grown to eight entries (§6.7 of the
 * integration plan).
 */
export const navItems: NavItem[] = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { label: "Planes", href: "/dashboard/plans", icon: CreditCard },
  { label: "Mis alumnos", href: "/dashboard/students", icon: Users },
  { label: "Entrenamiento", href: "/dashboard/training-plans", icon: Dumbbell },
  { label: "Nutrición", href: "/dashboard/nutrition-plans", icon: Salad },
]

/** Reference data, visually separated from the working sections. */
export const catalogNavItems: NavItem[] = [
  { label: "Ejercicios", href: "/dashboard/exercises", icon: Library },
  { label: "Alimentos", href: "/dashboard/foods", icon: Apple },
  { label: "Directorio", href: "/dashboard/directory", icon: Compass },
]

// A subset shown in the mobile bottom navigation.
export const mobileNavItems: NavItem[] = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { label: "Alumnos", href: "/dashboard/students", icon: Users },
  { label: "Entreno", href: "/dashboard/training-plans", icon: Dumbbell },
  { label: "Nutrición", href: "/dashboard/nutrition-plans", icon: Salad },
  { label: "Planes", href: "/dashboard/plans", icon: CreditCard },
]
