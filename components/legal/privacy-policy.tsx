import Link from "next/link"

import { SUPPORT_EMAIL } from "@/components/legal/documents"
import { LegalContact, LegalSection } from "@/components/legal/legal-prose"

/**
 * El cuerpo de la política de privacidad, sin encabezado ni chrome.
 *
 * Describe lo que el código hace hoy, no lo que debería hacer. Cada afirmación
 * técnica está atada a algo concreto, y si eso cambia, este texto cambia con
 * ello:
 *
 * - Google: sólo `sub`, `email` y `email_verified` (fitness-backend,
 *   `AbstractIdTokenVerifier`); el nombre y la foto del token no se leen.
 * - Salud: lesiones y antecedentes médicos se borraron en la V69; las alergias
 *   requieren consentimiento (`students.health_data_consent_at`).
 * - Eliminación: soft-delete inmediato y purga a los 30 días
 *   (`AccountPurgeJob`, `account.purge.grace-days`).
 * - Cookie: cifrada (`server/session-crypto.ts`); medición con Vercel Web
 *   Analytics, sin cookies.
 * - Proveedores: Railway (EE. UU.), Vercel, Cloudflare (DNS y proxy),
 *   Cloudinary, Resend, Expo, Mercado Pago, Nominatim (OpenStreetMap).
 *
 * Los corchetes son datos del responsable que todavía no existen. El aviso de
 * borrador de `LegalDocumentPage` se va recién cuando estén completos y el
 * texto pase por revisión legal.
 */
export function PrivacyPolicy() {
  return (
    <>
      <LegalSection title="Quién es responsable de tus datos">
        <p>
          Mi Entreno conecta a alumnos con entrenadores, permite gestionar planes de entrenamiento y
          nutrición, registrar entrenamientos y progreso, y participar en desafíos que ofrecen
          comercios adheridos a cambio de recompensas. Esta política se aplica a la aplicación móvil,
          a este panel web y a los servicios asociados.
        </p>
        <p>
          El responsable del tratamiento de tus datos personales es{" "}
          <strong>[RAZÓN SOCIAL / NOMBRE DEL RESPONSABLE]</strong>, CUIT <strong>[CUIT]</strong>,
          con domicilio en <strong>[DOMICILIO LEGAL]</strong>, República Argentina. Es quien decide
          para qué y cómo se tratan tus datos y quien responde por ese tratamiento.
        </p>
      </LegalSection>

      <LegalSection title="Cómo entendemos la privacidad">
        <ul>
          <li>Tratamos datos sólo con un fundamento válido y te contamos qué hacemos con ellos.</li>
          <li>Usamos cada dato para lo que te informamos, no para otra cosa.</li>
          <li>Pedimos lo necesario para cada función, no más.</li>
          <li>Procuramos que los datos sean exactos y te damos herramientas para corregirlos.</li>
          <li>Pedimos tu consentimiento de forma separada cuando la ley lo exige.</li>
          <li>Protegemos los datos y limitamos quién puede acceder a ellos.</li>
          <li>No los guardamos más tiempo del necesario.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Qué datos tratamos">
        <p>
          <strong>Al crear tu cuenta:</strong> email, contraseña (guardada con un algoritmo de hash
          irreversible, nunca en texto plano), nombre y apellido, teléfono, fecha de nacimiento,
          género, país y, si querés, una foto de perfil. El email, el nombre y la fecha de nacimiento
          son obligatorios; sin la fecha no podemos verificar la edad mínima.
        </p>
        <p>
          <strong>Si sos entrenador:</strong> tu descripción profesional, especialidades, años de
          experiencia, ubicación, precios, planes y certificaciones. Si cobrás por transferencia, el
          titular, banco, CBU, alias y CUIT de tu cuenta. Si vinculás Mercado Pago, el identificador,
          el apodo y el email de esa cuenta y las credenciales que Mercado Pago nos entrega, que
          guardamos cifradas.
        </p>
        <p>
          <strong>Si sos comercio:</strong> nombre comercial, razón social, CUIT, logo, rubro, datos
          de contacto, redes, dirección del punto de retiro con sus coordenadas, y los desafíos y
          recompensas que publicás.
        </p>
        <p>
          <strong>Si sos alumno:</strong> altura, peso, porcentaje de grasa corporal, objetivos,
          experiencia, nivel de actividad y tipo de entrenamiento. Opcionalmente, tus alergias
          alimentarias (ver &quot;Datos de salud&quot;).
        </p>
        <p>
          <strong>Mientras usás Mi Entreno:</strong> planes asignados, sesiones de entrenamiento
          (ejercicios, series, repeticiones, peso, duración, dificultad, notas, fecha y hora),
          valoraciones de cada sesión, videos de ejecución que subas, tu progreso (peso, medidas y
          fotos), tu registro de comidas, tus horarios de entrenamiento, los mensajes que intercambiás
          con tu entrenador, las reseñas que publiques, y tu actividad en desafíos, repes y canjes.
        </p>
        <p>
          <strong>Datos técnicos:</strong> cuando aceptás un documento legal guardamos qué versión
          aceptaste, la fecha, tu dirección IP, tu navegador o dispositivo, la plataforma, la versión
          de la app y el idioma, para poder demostrarlo. También guardamos identificadores de sesión,
          una descripción básica del dispositivo con el que iniciaste sesión, el identificador para
          enviarte notificaciones, tu zona horaria y registros técnicos del servidor.
        </p>
        <p>
          <strong>Ubicación:</strong> la app sólo la pide si elegís ordenar los desafíos por
          &quot;Más cercanos&quot;. La redondea a unos 100 metros antes de enviarla, la usamos para
          ordenar los comercios por distancia y no la guardamos. Podés negar el permiso y usar todo lo
          demás.
        </p>
      </LegalSection>

      <LegalSection title="Inicio de sesión con Google y Apple">
        <p>
          En la app móvil podés ingresar con tu cuenta de Google. Mi Entreno sólo pide a Google los
          permisos básicos de identificación (<span className="font-mono">openid</span>,{" "}
          <span className="font-mono">email</span> y <span className="font-mono">profile</span>). De
          lo que Google envía, usamos y guardamos únicamente el identificador de tu cuenta de Google y
          tu email, y comprobamos que Google haya verificado ese email. Aunque el permiso{" "}
          <span className="font-mono">profile</span> incluye tu nombre y tu foto, no los leemos ni los
          guardamos: el nombre y la foto de tu perfil son los que cargás vos.
        </p>
        <p>
          No accedemos a Gmail, Drive, Calendar, Contactos, Fotos ni a ningún otro servicio de Google,
          ni pedimos acceso sin conexión a tu cuenta. Usamos esos datos sólo para crear tu cuenta,
          iniciar sesión y evitar cuentas duplicadas; después de ingresar, Mi Entreno usa su propia
          sesión y no vuelve a consultar a Google.
        </p>
        <p>
          Los datos de Google se guardan en nuestra base de datos y no se venden, no se usan para
          publicidad, no se usan para entrenar modelos de inteligencia artificial y no se comparten
          con terceros para fines propios de ellos. Los procesan, por nuestra cuenta, los proveedores
          de infraestructura que se listan más abajo. El uso que hacemos de la información recibida de
          las APIs de Google se ajusta a la{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Google API Services User Data Policy
          </a>
          , incluidos sus requisitos de uso limitado.
        </p>
        <p>
          Podés desvincular Google o Apple desde Privacidad y seguridad → Métodos de acceso en la app,
          sin borrar tu cuenta, siempre que te quede otra forma de entrar (por ejemplo, una
          contraseña, que podés crear con &quot;Olvidé mi contraseña&quot;). También podés quitar el
          acceso desde tu cuenta de Google, en Seguridad → Conexiones con apps y servicios de
          terceros. Al eliminar tu cuenta se borra el vínculo.
        </p>
        <p>
          En iPhone también podés ingresar con Apple. Recibimos el identificador de tu cuenta de Apple
          y, si elegís compartirlo, tu email o el email de reenvío de Apple. Los usamos con los mismos
          fines y límites.
        </p>
      </LegalSection>

      <LegalSection title="Para qué usamos tus datos">
        <p>
          Algunos tratamientos necesitan tu consentimiento; otros son necesarios para prestarte el
          servicio que pediste, y ese es su fundamento. No usamos el consentimiento como respuesta para
          todo.
        </p>
        <ul>
          <li>Crear y administrar tu cuenta, autenticarte y recuperar el acceso.</li>
          <li>Que tu entrenador arme y ajuste tus planes, y que vos registres y veas tu progreso.</li>
          <li>La relación con tu entrenador: suscripciones, invitaciones, mensajes y reseñas.</li>
          <li>Calcular el avance en desafíos, acreditar repes y gestionar canjes.</li>
          <li>Procesar pagos y cumplir obligaciones fiscales y contables.</li>
          <li>Enviarte códigos, avisos de la cuenta y, si los tenés activados, recordatorios.</li>
          <li>Mantener la seguridad, prevenir abusos y resolver errores.</li>
          <li>Responder tus consultas y tus solicitudes sobre tus datos.</li>
        </ul>
        <p>No usamos tus datos para publicidad, no los vendemos y no armamos perfiles para terceros.</p>
      </LegalSection>

      <LegalSection title="Datos de salud">
        <p>
          La ley argentina considera sensibles, entre otros, los datos referidos a la salud. Nadie
          puede ser obligado a darlos y requieren una protección reforzada.
        </p>
        <ul>
          <li>
            <strong>Alergias:</strong> darlas es opcional. Sólo las guardamos, y tu entrenador sólo
            las ve para armar tu plan de alimentación, si marcás una casilla de consentimiento
            separada. Podés retirarlo cuando quieras desde Privacidad y seguridad → Tus alergias, y en
            ese caso las borramos.
          </li>
          <li>
            <strong>Peso, medidas, fotos de progreso y fatiga:</strong> según el contexto pueden
            revelar información sobre tu salud, así que las tratamos con el mismo cuidado: las ven vos,
            tu entrenador y, sólo cuando hace falta por soporte o seguridad, personal autorizado de Mi
            Entreno.
          </li>
          <li>
            No pedimos lesiones, antecedentes médicos ni diagnósticos. No usamos reconocimiento facial
            ni datos biométricos: las fotos y videos se guardan como imágenes.
          </li>
        </ul>
        <p>
          Mi Entreno no es un servicio médico, no diagnostica ni reemplaza la consulta con un
          profesional de la salud.
        </p>
      </LegalSection>

      <LegalSection title="Qué ven los demás usuarios">
        <p>
          <strong>Tu entrenador</strong> ve tu nombre y foto, los planes que te asignó, tus sesiones y
          sus valoraciones, los videos que le envíes, tu progreso, tu registro de comidas, las
          alergias que hayas compartido y los mensajes que intercambien. Cuando la suscripción termina,
          conserva acceso al historial de esa suscripción y ya no puede enviarte mensajes.
        </p>
        <p>
          <strong>Como alumno</strong> ves el perfil público del entrenador y, si le pagás por
          transferencia, los datos bancarios que cargó para cobrar.
        </p>
        <p>
          <strong>Los comercios</strong> no ven tu historial de entrenamiento: ven tu nombre de pila,
          el estado de tu participación en sus desafíos y el código de canje cuando lo presentás.
        </p>
      </LegalSection>

      <LegalSection title="Desafíos y procesamiento automático">
        <p>
          A partir de tus sesiones calculamos automáticamente series, repeticiones, volumen y
          duración para medir tu avance en los desafíos. Para evitar trampas, el sistema no cuenta las
          sesiones que no llegan a un mínimo o que tienen valores atípicos frente a tu historial; esas
          sesiones siguen en tu historial. Si creés que una se descartó por error, escribinos y la
          revisa una persona.
        </p>
        <p>
          También estimamos en qué horario solés entrenar para enviarte recordatorios en el momento
          justo. Podés cargar tus horarios a mano o desactivar los avisos. No usamos inteligencia
          artificial para generar rutinas ni para tomar decisiones sobre vos.
        </p>
      </LegalSection>

      <LegalSection title="Pagos">
        <p>
          Las suscripciones se pagan con Mercado Pago o por transferencia directa al entrenador. Los
          datos de tu tarjeta o cuenta los ingresás en Mercado Pago, que los trata como responsable
          independiente según sus propias políticas: Mi Entreno no recibe el número completo de tu
          tarjeta ni su código de seguridad. Sí guardamos el identificador de la operación, su estado,
          el monto, el medio de pago y la respuesta técnica de Mercado Pago sobre la operación.
        </p>
        <p>
          Si pagás por transferencia, el comprobante que subís lo ven tu entrenador y Mi Entreno para
          validar el pago, y puede incluir tus datos bancarios.
        </p>
      </LegalSection>

      <LegalSection title="Con quién compartimos datos">
        <p>
          No vendemos datos personales. Algunos proveedores procesan datos por nuestra cuenta, sólo
          para prestarnos un servicio y sin poder usarlos para fines propios:
        </p>
        <ul>
          <li>Railway: aloja el servidor y la base de datos, en Estados Unidos.</li>
          <li>Vercel: aloja este panel web y mide visitas de forma agregada.</li>
          <li>Cloudflare: resuelve el dominio y actúa como intermediario del tráfico, por lo que ve direcciones IP.</li>
          <li>Cloudinary: guarda y sirve fotos, videos, certificados y comprobantes.</li>
          <li>Resend: envía los emails de la cuenta (códigos, recuperación de contraseña, avisos).</li>
          <li>Expo, y a través de él Apple y Google: entregan las notificaciones push.</li>
        </ul>
        <p>Otros reciben datos y los tratan bajo su propia responsabilidad:</p>
        <ul>
          <li>Google y Apple, cuando ingresás con sus cuentas.</li>
          <li>Mercado Pago, cuando pagás o cuando un entrenador vincula su cuenta.</li>
          <li>
            OpenStreetMap (Nominatim), que recibe la dirección que un comercio escribe para ubicar su
            punto de retiro en el mapa.
          </li>
        </ul>
        <p>
          También podemos revelar datos cuando lo exija una ley o una autoridad competente, o para
          defender derechos en un reclamo.
        </p>
      </LegalSection>

      <LegalSection title="Transferencias internacionales">
        <p>
          Varios de estos proveedores guardan o procesan datos fuera de Argentina, en particular en
          Estados Unidos. La ley argentina restringe la transferencia de datos a países sin un nivel
          de protección adecuado, salvo que existan garantías suficientes, como cláusulas
          contractuales conforme a los modelos aprobados por la autoridad de control, o tu
          consentimiento expreso. [MECANISMO DE TRANSFERENCIA POR PROVEEDOR]
        </p>
      </LegalSection>

      <LegalSection title="Comunicaciones">
        <p>
          Te enviamos los mensajes necesarios para el servicio: códigos de verificación, recuperación
          de contraseña, avisos de seguridad y avisos sobre pagos, suscripciones e invitaciones.
        </p>
        <p>
          Las notificaciones push (recordatorios, novedades de tu entrenador, avances de desafíos y
          recompensas) se pueden apagar desde la app. Los avisos de desafíos nuevos de comercios
          tienen su propio interruptor, así que podés dejar de recibirlos sin perder los
          recordatorios. Hoy no enviamos comunicaciones comerciales por email.
        </p>
      </LegalSection>

      <LegalSection title="Seguridad">
        <p>
          Usamos conexiones cifradas, guardamos contraseñas y códigos con hash irreversible, ciframos
          las credenciales de pago de terceros y la cookie de sesión, cerramos las sesiones al cambiar
          la contraseña o eliminar la cuenta, limitamos los intentos de inicio de sesión y restringimos
          el acceso de cada usuario a lo que su rol permite. Ningún sistema conectado a Internet es
          completamente seguro: si ocurre un incidente que afecte tus datos, te lo vamos a informar.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Este panel usa una sola cookie propia, estrictamente necesaria para mantener tu sesión, y
          mide visitas sin cookies. Los detalles están en la{" "}
          <Link href="/documentos/cookies" className="font-medium text-foreground underline underline-offset-4">
            política de cookies
          </Link>
          . La app móvil no usa cookies: guarda tu sesión en el almacenamiento seguro del teléfono.
        </p>
      </LegalSection>

      <LegalSection title="Cuánto tiempo guardamos tus datos">
        <ul>
          <li>Mientras tu cuenta esté activa, conservamos tus datos.</li>
          <li>
            Si eliminás tu cuenta, se desactiva al instante y a los 30 días borramos o anonimizamos tus
            datos personales.
          </li>
          <li>
            Conservamos, sin tu nombre ni tu contacto, los pagos y comprobantes por el plazo que fijan
            las normas fiscales, los movimientos de repes y canjes, y el registro de tu aceptación de
            los documentos legales.
          </li>
          <li>
            Los datos borrados pueden seguir en copias de seguridad hasta que se reemplacen; no se usan
            salvo para recuperar el servicio ante una falla.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Eliminar tu cuenta">
        <p>
          Podés eliminarla desde la app, en Privacidad y seguridad → Eliminar cuenta, o pedirlo sin la
          app como se explica en{" "}
          <Link href="/documentos/eliminar-cuenta" className="font-medium text-foreground underline underline-offset-4">
            Eliminar tu cuenta
          </Link>
          . A los 30 días borramos tu perfil, tus datos físicos y alergias, tu progreso, fotos y
          videos, tu registro de comidas, tus mensajes, tus reseñas, tus notificaciones y el vínculo
          con Google o Apple. Si sos entrenador, eliminar tu cuenta no borra las cuentas de tus alumnos.
        </p>
      </LegalSection>

      <LegalSection title="Tus derechos">
        <p>
          Tenés derecho a saber si tratamos datos tuyos, a acceder a ellos, a rectificarlos y
          actualizarlos, a pedir que los suprimamos cuando corresponda y a retirar tu consentimiento.
          El acceso es gratuito si lo pedís con intervalos de al menos seis meses, salvo que acredites
          un interés legítimo para hacerlo antes.
        </p>
        <p>
          Para ejercerlos escribinos a{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-foreground underline underline-offset-4">
            {SUPPORT_EMAIL}
          </a>{" "}
          desde el email de tu cuenta. La ley fija que respondamos un pedido de acceso dentro de los
          10 días corridos, y uno de rectificación, actualización o supresión dentro de los 5 días
          hábiles.
        </p>
        <p>
          Si no respondemos en esos plazos o la respuesta no te satisface, podés reclamar ante la
          Agencia de Acceso a la Información Pública (AAIP), autoridad de control de la Ley 25.326, o
          iniciar la acción de hábeas data.
        </p>
      </LegalSection>

      <LegalSection title="Menores de edad">
        <p>
          Mi Entreno es para personas de 18 años o más, y verificamos la edad con la fecha de
          nacimiento. Si nos enteramos de que un menor nos dio datos, suspendemos la cuenta y la
          eliminamos.
        </p>
      </LegalSection>

      <LegalSection title="Datos de otras personas">
        <p>
          No cargues datos de otras personas sin estar autorizado, por ejemplo fotos o videos donde
          aparezcan terceros. Si sos entrenador, usá los datos de tus alumnos sólo para prestarles tu
          servicio dentro de Mi Entreno. Procurá que tus datos sean verdaderos y estén actualizados;
          podés corregirlos desde tu perfil.
        </p>
      </LegalSection>

      <LegalSection title="Cambios en esta política">
        <p>
          Podemos actualizarla cuando cambien las funciones de Mi Entreno, nuestros proveedores o la
          normativa. Si el cambio es relevante, como una nueva finalidad o un nuevo tipo de dato, te
          avisamos antes de que rija y, cuando la ley lo requiera, volvemos a pedir tu consentimiento.
        </p>
      </LegalSection>

      <LegalContact />
    </>
  )
}
