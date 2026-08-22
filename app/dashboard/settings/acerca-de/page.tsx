import { SettingsPageShell } from "@/features/account/components/settings-page-shell"

export const metadata = { title: "Acerca de Mi Entreno" }

export default function AboutPage() {
  return (
    <SettingsPageShell
      title="Acerca de Mi Entreno"
      description="El panel desde el que gestionás tus alumnos, tus planes y tus cobros."
    >
      <dl className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
        <Field label="Versión" value="MVP" />
        <Field label="Soporte" value="soporte@mientreno.app" />
      </dl>

      <p className="text-body text-muted-foreground text-pretty">
        Tus alumnos usan la aplicación móvil de Mi Entreno para ver los planes que publicás, seguir
        sus entrenamientos y registrar su progreso. Lo que hagas acá aparece allí.
      </p>
    </SettingsPageShell>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-body font-medium">{value}</dd>
    </div>
  )
}
