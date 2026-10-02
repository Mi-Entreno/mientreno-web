import { SUPPORT_EMAIL } from "@/components/legal/documents"
import { LegalContact, LegalSection } from "@/components/legal/legal-prose"

/**
 * Cómo pedir la eliminación de la cuenta, con o sin la app.
 *
 * Existe porque Google Play exige una URL pública, a la que se llegue sin
 * instalar la app, para pedir la eliminación. Los plazos y lo que se conserva
 * son los de `AccountPurgeJob` en fitness-backend (30 días,
 * `account.purge.grace-days`): si cambian allá, cambian acá y en la política de
 * privacidad.
 */
export function AccountDeletion() {
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Eliminar mi cuenta de Mi Entreno")}`

  return (
    <>
      <LegalSection title="Desde la app">
        <p>
          Entrá a Perfil → Privacidad y seguridad → Eliminar cuenta, escribí ELIMINAR para confirmar y
          tocá &quot;Eliminar mi cuenta para siempre&quot;. Se cierran todas tus sesiones en el momento.
        </p>
      </LegalSection>

      <LegalSection title="Sin la app">
        <p>
          Escribinos a{" "}
          <a href={mailto} className="font-medium text-foreground underline underline-offset-4">
            {SUPPORT_EMAIL}
          </a>{" "}
          desde el email con el que te registraste, con el asunto &quot;Eliminar mi cuenta&quot;. Si
          escribís desde otra dirección, te vamos a pedir que confirmes que la cuenta es tuya antes de
          borrarla.
        </p>
      </LegalSection>

      <LegalSection title="Qué pasa después">
        <ul>
          <li>Tu cuenta se desactiva al instante: nadie puede entrar ni verla.</li>
          <li>
            A los 30 días borramos tu perfil, tus datos físicos y alergias, tu progreso, tus fotos y
            videos, tu registro de comidas, tus mensajes, tus reseñas, tus notificaciones y el vínculo
            con Google o Apple.
          </li>
          <li>
            Conservamos, sin tu nombre ni tu contacto, los pagos y comprobantes por el plazo que exigen
            las normas fiscales, los movimientos de repes y los canjes en comercios, y el registro de
            tu aceptación de los documentos legales.
          </li>
          <li>
            Los datos borrados pueden seguir en copias de seguridad hasta que se reemplacen, y no se
            usan salvo para recuperar el servicio ante una falla.
          </li>
          <li>Pasados los 30 días, la cuenta no se puede recuperar.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Si sos entrenador o comercio">
        <p>
          Eliminar tu cuenta no borra las cuentas de tus alumnos ni lo que ellos registraron. Si sos
          comercio, borramos tus datos de contacto; el nombre del local queda asociado a los canjes
          que ya se hicieron.
        </p>
      </LegalSection>

      <LegalContact />
    </>
  )
}
