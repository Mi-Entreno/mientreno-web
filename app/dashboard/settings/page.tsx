import { DeleteAccountCard } from "@/features/account/components/delete-account-card"
import { PersonalDataForm } from "@/features/user/components/personal-data-form"
import { PreferencesCard } from "@/features/user/components/preferences-card"

/**
 * Account settings, as opposed to `/dashboard/profile`, which is the
 * public-facing professional profile. The split mirrors the backend's own:
 * `/api/user-detail` and `/api/users/preferences` describe the account,
 * `/api/trainer/profile` describes the trainer.
 */
export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-body text-muted-foreground">
        Gestiona tus datos personales, tus preferencias y tu cuenta.
      </p>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-subtitle font-semibold tracking-tight">
            Datos personales
          </h2>
          <p className="mt-1 text-body text-muted-foreground">
            Estos datos son privados y no aparecen en tu perfil público.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <PersonalDataForm />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-subtitle font-semibold tracking-tight">Preferencias</h2>
          <p className="mt-1 text-body text-muted-foreground">
            Cómo quieres usar la aplicación por defecto.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <PreferencesCard />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-subtitle font-semibold tracking-tight">Zona de peligro</h2>
        <DeleteAccountCard />
      </section>
    </div>
  )
}
