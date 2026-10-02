import { LegalContact, LegalSection } from "@/components/legal/legal-prose";

/**
 * El cuerpo de la política de cookies, sin encabezado ni chrome.
 *
 * El inventario de abajo refleja las cookies actualmente utilizadas por el panel.
 * Si en el futuro se incorpora una nueva cookie —por ejemplo, analítica,
 * publicidad o un servicio de terceros— deberá incorporarse también a esta política.
 *
 * Lo que se dice del contenido de `trainer_session` depende de que esté cifrada
 * (`server/session-crypto.ts`). Antes decía que no contenía el email ni el
 * nombre mientras los llevaba legibles en base64 dentro del access token.
 */
export function CookiePolicy() {
  return (
    <>
      <LegalSection title="Qué es una cookie">
        <p>
          Una cookie es un pequeño archivo que un sitio web guarda en tu
          navegador y que puede volver a utilizar en visitas posteriores. Sirve,
          entre otras cosas, para mantener una sesión iniciada y permitir que
          determinadas funcionalidades del sitio funcionen correctamente.
        </p>
      </LegalSection>

      <LegalSection title="Qué cookies usamos">
        <p>
          Actualmente utilizamos una única cookie propia y estrictamente
          necesaria para que el panel web de Mi Entreno funcione correctamente:
        </p>

        <dl className="mt-1 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-foreground sm:p-5">
          <div>
            <dt className="font-mono text-caption tracking-wide">
              trainer_session
            </dt>

            <dd className="mt-1 text-body text-muted-foreground text-pretty">
              Mantiene tu sesión iniciada. Contiene tus credenciales de sesión,
              que incluyen tu identificador de usuario, tu email de acceso, tu
              nombre de pila y tu rol, y está cifrada: sólo nuestros servidores
              pueden leerla, y si alguien la modifica deja de servir.{" "}
              <span className="font-medium text-foreground">HttpOnly</span>, por
              lo que los scripts que se ejecutan en la página no pueden acceder
              directamente a su contenido. También utiliza{" "}
              <span className="font-medium text-foreground">SameSite=Lax</span>,
              una configuración destinada a reducir determinados riesgos
              asociados al envío de cookies desde otros sitios. Tiene una
              duración de hasta 7 días sin actividad y puede renovarse mientras
              continúes utilizando el panel.
            </dd>
          </div>
        </dl>
      </LegalSection>

      <LegalSection title="Qué no usamos">
        <p>
          Actualmente no utilizamos cookies destinadas a publicidad, seguimiento
          entre sitios o redes sociales en el panel.
        </p>

        <p>
          Tampoco utilizamos cookies de terceros en el panel para crear perfiles
          publicitarios.
        </p>

        <p>
          Medimos las visitas al panel con Vercel Web Analytics, que trabaja de
          forma agregada y no guarda cookies en tu navegador.
        </p>
      </LegalSection>

      <LegalSection title="Por qué no te pedimos consentimiento">
        <p>
          La cookie <span className="font-mono">trainer_session</span> es
          estrictamente necesaria para prestar el servicio que solicitaste al
          iniciar sesión y para mantener tu sesión activa en el panel.
        </p>

        <p>
          Por este motivo, no solicitamos un consentimiento previo específico
          para esta cookie.
        </p>

        <p>
          Si en el futuro incorporamos cookies analíticas, publicitarias o de
          otra categoría que requieran consentimiento, actualizaremos esta
          política y utilizaremos el mecanismo correspondiente para que puedas
          aceptarlas o rechazarlas antes de su instalación, cuando así lo exija
          la normativa aplicable.
        </p>
      </LegalSection>

      <LegalSection title="Cómo bloquearlas o borrarlas">
        <p>
          Todos los navegadores permiten consultar, eliminar y bloquear cookies
          desde sus preferencias de privacidad.
        </p>

        <p>
          Tené en cuenta que si bloqueás o eliminás la cookie{" "}
          <span className="font-mono">trainer_session</span>, no vas a poder
          mantener tu sesión iniciada y el panel puede solicitarte que vuelvas a
          iniciar sesión.
        </p>

        <p>
          Cerrar sesión desde el menú de tu cuenta elimina la cookie de sesión y
          revoca la sesión correspondiente en nuestros servidores. Es la forma
          recomendada de salir de Mi Entreno cuando utilizás una computadora
          compartida.
        </p>
      </LegalSection>

      <LegalSection title="Cambios en esta política">
        <p>
          Podemos actualizar esta Política de Cookies cuando incorporemos nuevas
          funcionalidades, tecnologías o servicios que modifiquen el uso de
          cookies o tecnologías similares.
        </p>

        <p>
          Si incorporamos nuevas categorías de cookies que requieran
          consentimiento, actualizaremos esta política y, cuando corresponda,
          solicitaremos tu consentimiento antes de utilizarlas.
        </p>
      </LegalSection>

      <LegalContact />
    </>
  );
}
