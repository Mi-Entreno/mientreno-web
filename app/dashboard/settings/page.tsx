import { FileText, Info } from "lucide-react"
import Link from "next/link"

import { DeleteAccountCard } from "@/features/account/components/delete-account-card"
import { AccountCard } from "@/features/account/components/account-card"
import { BillingCard } from "@/features/payments/components/billing-card"
import { PreferencesCard } from "@/features/user/components/preferences-card"

/**
 * Configuration and shortcuts — not a second place to edit a profile.
 *
 * This page used to carry a full copy of the personal-data form, so a trainer
 * could change their name, birth date and photo here *and* on
 * `/dashboard/profile`, with a separate photo field in each. Editing now lives
 * entirely on the profile; what stays here is the account, how the app behaves,
 * how money arrives, the legal pages, and the way out.
 */
export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-body text-muted-foreground">
        Tu cuenta, tus preferencias, tus cobros y la información legal.
      </p>

      <Section
        title="Cuenta"
        description="Los datos con los que entrás a la aplicación."
      >
        <AccountCard />
      </Section>

      <Section title="Preferencias" description="Cómo querés usar la aplicación por defecto.">
        <div className="rounded-2xl border border-border bg-card p-6">
          <PreferencesCard />
        </div>
      </Section>

      <Section title="Cobros" description="Cómo recibís el dinero de tus suscripciones.">
        <BillingCard />
      </Section>

      <Section title="Información" description="Sobre la aplicación y cómo tratamos tus datos.">
        <ul className="flex flex-col gap-2">
          <li>
            <SettingsLink
              href="/dashboard/settings/privacidad"
              icon={FileText}
              label="Política de privacidad"
              detail="Qué datos guardamos y para qué"
            />
          </li>
          <li>
            <SettingsLink
              href="/dashboard/settings/acerca-de"
              icon={Info}
              label="Acerca de Mi Entreno"
              detail="Versión, soporte y contacto"
            />
          </li>
        </ul>
      </Section>

      <Section title="Zona de peligro">
        <DeleteAccountCard />
      </Section>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-subtitle font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-body text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function SettingsLink({
  href,
  icon: Icon,
  label,
  detail,
}: {
  href: string
  icon: typeof Info
  label: string
  detail: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-input focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <Icon className="size-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{label}</p>
        <p className="truncate text-body text-muted-foreground">{detail}</p>
      </div>
    </Link>
  )
}
