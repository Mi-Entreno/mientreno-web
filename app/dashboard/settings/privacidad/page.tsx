import { AlertTriangle } from "lucide-react"

import { SettingsPageShell } from "@/features/account/components/settings-page-shell"

export const metadata = { title: "Política de privacidad — Mi Entreno" }

/**
 * Placeholder with the structure a real policy needs, not a real policy.
 *
 * The banner is deliberately loud and part of the page rather than a code
 * comment: a draft privacy policy that looks finished is worse than no page at
 * all, and this one is reachable by any trainer from settings.
 */
export default function PrivacyPage() {
  return (
    <SettingsPageShell
      title="Política de privacidad"
      description="Qué datos recogemos, para qué los usamos y qué podés hacer con ellos."
    >
      <div className="flex items-start gap-3 rounded-xl border border-warning bg-warning-surface p-4 text-warning-text">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <div className="text-pretty">
          <p className="font-semibold">Borrador pendiente de revisión legal</p>
          <p className="mt-1 text-body">
            El texto de abajo es un esqueleto para que no falte la sección. No lo publiques sin que
            lo revise alguien con criterio legal.
          </p>
        </div>
      </div>

      <Article title="Qué datos guardamos">
        <p>
          Los que nos das al registrarte y al completar tu perfil: correo electrónico, teléfono,
          nombre y apellidos, fecha de nacimiento, país, foto de perfil y la información profesional
          que decidas publicar (presentación, tarifa, especialidades y certificaciones).
        </p>
        <p>
          También los datos que generás al usar la aplicación: tus planes de suscripción, las
          invitaciones que enviás y los planes de entrenamiento y nutrición que creás para tus
          alumnos.
        </p>
      </Article>

      <Article title="Para qué los usamos">
        <p>
          Para que puedas gestionar a tus alumnos, para mostrar tu perfil a quien busque entrenador
          y para procesar los cobros de tus suscripciones a través de Mercado Pago.
        </p>
      </Article>

      <Article title="Con quién los compartimos">
        <p>
          Con tus alumnos, en la parte de tu perfil que es pública. Con Mercado Pago, lo necesario
          para procesar un pago. Con nadie más.
        </p>
      </Article>

      <Article title="Cuánto tiempo los conservamos">
        <p>
          Mientras tengas la cuenta activa. Al eliminarla desde Ajustes se cierran todas tus
          sesiones y dejás de tener acceso a tus alumnos y planes.
        </p>
      </Article>

      <Article title="Tus derechos">
        <p>
          Podés acceder a tus datos, corregirlos desde tu perfil y eliminar tu cuenta cuando
          quieras. Para cualquier otra solicitud, escribinos.
        </p>
      </Article>
    </SettingsPageShell>
  )
}

function Article({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="flex flex-col gap-2">
      <h2 className="font-heading text-subtitle font-semibold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-2 text-body text-muted-foreground [&_p]:text-pretty">
        {children}
      </div>
    </article>
  )
}
