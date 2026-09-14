import { LegalContact, LegalSection } from "@/components/legal/legal-prose";

/**
 * El cuerpo de la política de privacidad, sin encabezado ni chrome.
 */
export function PrivacyPolicy() {
  return (
    <>
      <LegalSection title="Quién es responsable de tus datos">
        <p>
          Mi Entreno es una plataforma que conecta a entrenadores con sus
          alumnos, permite gestionar entrenamientos y ofrece un sistema de
          recompensas por constancia.
        </p>

        <p>
          El responsable del tratamiento de los datos personales es{" "}
          <strong>[RAZÓN SOCIAL / NOMBRE DEL TITULAR]</strong>, CUIT{" "}
          <strong>[CUIT]</strong>, con domicilio en <strong>[DOMICILIO]</strong>
          , República Argentina.
        </p>

        <p>
          Si tenés alguna consulta sobre el tratamiento de tus datos personales,
          podés comunicarte con nosotros mediante los canales indicados al final
          de esta política.
        </p>
      </LegalSection>

      <LegalSection title="Qué datos recopilamos">
        <p>
          Dependiendo de cómo utilices Mi Entreno, podemos recopilar diferentes
          tipos de información.
        </p>

        <p>
          <strong>Datos de cuenta:</strong> nombre, apellido, correo
          electrónico, contraseña almacenada de forma segura y otra información
          necesaria para crear y administrar tu cuenta.
        </p>

        <p>
          <strong>Datos de perfil:</strong> fotografía de perfil, fecha de
          nacimiento, género y otra información que decidas incorporar a tu
          perfil.
        </p>

        <p>
          <strong>Datos de entrenamiento:</strong> rutinas, ejercicios, series,
          repeticiones, pesos, duración, entrenamientos realizados, progreso,
          objetivos y otra información relacionada con la actividad registrada
          en la plataforma.
        </p>

        <p>
          <strong>Datos de profesores:</strong> información profesional,
          especialidades, descripción, perfil y contenido relacionado con los
          servicios ofrecidos dentro de Mi Entreno.
        </p>

        <p>
          <strong>Datos de comercios:</strong> información comercial, productos,
          imágenes, descripciones, precios, stock y demás información necesaria
          para administrar sus desafíos y las recompensas que ofrecen.
        </p>

        <p>
          <strong>Datos de uso:</strong> información sobre las funcionalidades
          que utilizás, interacciones con la aplicación y determinadas acciones
          realizadas dentro de la plataforma.
        </p>

        <p>
          <strong>Datos técnicos:</strong> información relacionada con el
          dispositivo, sistema operativo, versión de la aplicación,
          identificadores técnicos, dirección IP y otros datos necesarios para
          mantener la seguridad y funcionamiento del servicio.
        </p>
      </LegalSection>

      <LegalSection title="Datos relacionados con salud y actividad física">
        <p>
          Algunas funcionalidades de Mi Entreno pueden permitir registrar
          información relacionada con actividad física, entrenamiento, lesiones,
          limitaciones u otros datos que el usuario o su entrenador decidan
          incorporar.
        </p>

        <p>
          Te recomendamos no introducir información médica que no sea necesaria
          para utilizar la plataforma.
        </p>

        <p>
          Cuando un entrenador tiene acceso a información de un alumno, dicho
          acceso se limita a la información disponible mediante las
          funcionalidades y permisos correspondientes a la relación entre ambos.
        </p>

        <p>
          Mi Entreno no utiliza esta información para realizar diagnósticos
          médicos ni pretende reemplazar la evaluación de profesionales de la
          salud.
        </p>
      </LegalSection>

      <LegalSection title="Para qué utilizamos tus datos">
        <p>
          Utilizamos los datos personales para operar, mantener y mejorar Mi
          Entreno.
        </p>

        <ul>
          <li>Crear y administrar tu cuenta.</li>

          <li>Permitir el acceso a las funcionalidades de la plataforma.</li>

          <li>
            Vincular alumnos con sus entrenadores y permitir la gestión de
            rutinas.
          </li>

          <li>Registrar y mostrar la actividad y progreso de entrenamiento.</li>

          <li>Calcular el progreso de los desafíos que el alumno acepta.</li>

          <li>Permitir el canje de las recompensas desbloqueadas.</li>

          <li>Procesar pagos y gestionar suscripciones cuando corresponda.</li>

          <li>
            Enviar códigos de verificación, notificaciones y comunicaciones
            necesarias para prestar el servicio.
          </li>

          <li>
            Detectar y prevenir fraude, abuso y actividades no autorizadas.
          </li>

          <li>Mantener la seguridad de las cuentas y de la infraestructura.</li>

          <li>
            Solucionar errores y mejorar el funcionamiento de la plataforma.
          </li>

          <li>
            Cumplir obligaciones legales y atender requerimientos de autoridades
            competentes.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Cómo utilizamos las fotos">
        <p>
          Si cargás una fotografía de perfil, esta puede almacenarse y mostrarse
          dentro de Mi Entreno como parte de tu perfil.
        </p>

        <p>
          La fotografía podrá ser visible para otros usuarios cuando resulte
          necesario para el funcionamiento de las funcionalidades de la
          plataforma, por ejemplo, para identificar un perfil dentro de una
          relación entre alumno y entrenador.
        </p>

        <p>
          No utilizaremos tu fotografía para campañas publicitarias externas sin
          contar con la autorización que corresponda.
        </p>
      </LegalSection>

      <LegalSection title="Con quién compartimos información">
        <p>No vendemos tus datos personales.</p>

        <p>
          Podemos compartir o permitir el acceso a determinados datos con
          proveedores que nos ayudan a prestar Mi Entreno.
        </p>

        <p>Estos proveedores pueden incluir servicios de:</p>

        <ul>
          <li>Procesamiento de pagos.</li>
          <li>Almacenamiento de información.</li>
          <li>Almacenamiento y gestión de imágenes.</li>
          <li>Envío de correos electrónicos.</li>
          <li>Autenticación y seguridad.</li>
          <li>Infraestructura y alojamiento.</li>
          <li>Notificaciones.</li>
          <li>Analítica y monitoreo técnico.</li>
        </ul>

        <p>
          Los proveedores reciben únicamente la información necesaria para
          prestar las funciones para las que fueron contratados.
        </p>
      </LegalSection>

      <LegalSection title="Mercado Pago">
        <p>
          Cuando realizás un pago mediante Mi Entreno, la operación puede ser
          procesada por Mercado Pago u otro proveedor de servicios de pago.
        </p>

        <p>
          Los datos financieros necesarios para procesar el pago pueden ser
          tratados directamente por el proveedor de pagos de acuerdo con sus
          propias políticas y condiciones.
        </p>

        <p>
          Mi Entreno no almacena los datos completos de tu tarjeta cuando el
          pago es procesado directamente por el proveedor correspondiente.
        </p>

        <p>
          Podemos recibir información relacionada con el estado de una
          operación, como pago aprobado, rechazado, pendiente, cancelado o
          reembolsado, para poder activar o gestionar el servicio
          correspondiente.
        </p>
      </LegalSection>

      <LegalSection title="Almacenamiento de imágenes">
        <p>
          Las fotografías y otras imágenes que cargues en Mi Entreno pueden ser
          almacenadas mediante proveedores tecnológicos especializados en
          almacenamiento y distribución de contenido.
        </p>

        <p>
          El uso de estos servicios tiene como finalidad permitir que las
          imágenes puedan almacenarse y mostrarse correctamente dentro de la
          plataforma.
        </p>
      </LegalSection>

      <LegalSection title="Correos electrónicos y comunicaciones">
        <p>
          Podemos utilizar proveedores externos para enviar correos electrónicos
          relacionados con tu cuenta.
        </p>

        <p>
          Estos mensajes pueden incluir códigos de verificación, recuperación de
          contraseña, confirmaciones, notificaciones de actividad, información
          relacionada con pagos y otras comunicaciones necesarias para utilizar
          el servicio.
        </p>

        <p>
          Las comunicaciones comerciales, cuando existan, estarán sujetas a las
          preferencias y opciones disponibles para el usuario y a la normativa
          aplicable.
        </p>
      </LegalSection>

      <LegalSection title="Información que compartís con tu entrenador">
        <p>
          Si utilizás Mi Entreno como alumno y estás vinculado con un
          entrenador, determinadas informaciones de tu perfil y actividad pueden
          estar disponibles para ese entrenador.
        </p>

        <p>
          Esto puede incluir, según las funcionalidades habilitadas, tus
          rutinas, entrenamientos realizados, progreso, objetivos y otra
          información necesaria para que el entrenador pueda prestar sus
          servicios.
        </p>

        <p>
          El acceso del entrenador está limitado a las funcionalidades y
          permisos establecidos por Mi Entreno y por la relación existente entre
          el alumno y el entrenador.
        </p>
      </LegalSection>

      <LegalSection title="Información de los comercios">
        <p>
          Los comercios adheridos pueden acceder a la información necesaria para
          gestionar los productos o beneficios que ofrecen dentro del programa
          de recompensas.
        </p>

        <p>
          Por ejemplo, cuando realizás un canje, podemos proporcionar al
          comercio la información necesaria para identificar la operación y
          gestionar la entrega del producto correspondiente.
        </p>

        <p>
          No compartiremos con un comercio información de entrenamiento que no
          sea necesaria para gestionar un canje.
        </p>
      </LegalSection>

      <LegalSection title="Desafíos y recompensas">
        <p>
          Mi Entreno registra las actividades de entrenamiento necesarias para
          calcular el progreso de los desafíos que cada alumno acepta, de acuerdo
          con las condiciones que cada desafío establece.
        </p>

        <p>
          También registramos qué desafíos aceptó cada usuario, cuándo los
          completó, las recompensas desbloqueadas y los canjes efectuados, junto
          con el historial necesario para administrar el programa.
        </p>

        <p>
          Esta información se utiliza para mantener el funcionamiento del
          sistema, prevenir abusos y resolver reclamos relacionados con
          recompensas.
        </p>
      </LegalSection>

      <LegalSection title="Seguridad de la información">
        <p>
          Implementamos medidas técnicas y organizativas razonables para
          proteger los datos personales frente a accesos no autorizados,
          pérdida, alteración o divulgación indebida.
        </p>

        <p>
          Las contraseñas no se almacenan en texto plano y se utilizan
          mecanismos de seguridad destinados a proteger las cuentas.
        </p>

        <p>
          Sin embargo, ningún sistema conectado a Internet puede garantizar una
          seguridad absoluta.
        </p>
      </LegalSection>

      <LegalSection title="Cuánto tiempo conservamos tus datos">
        <p>
          Conservamos los datos personales durante el tiempo necesario para
          prestar el servicio, mantener tu cuenta, cumplir las finalidades
          descriptas en esta política y cumplir obligaciones legales.
        </p>

        <p>
          Cuando solicites la eliminación de tu cuenta, eliminaremos o
          anonimizaremos la información que ya no necesitemos conservar, salvo
          cuando exista una obligación legal, contractual, de seguridad o de
          prevención de fraude que requiera conservar determinados datos durante
          un período adicional.
        </p>
      </LegalSection>

      <LegalSection title="Eliminación de tu cuenta">
        <p>
          Podés solicitar la eliminación de tu cuenta mediante los mecanismos
          disponibles en Mi Entreno.
        </p>

        <p>
          La eliminación de la cuenta puede implicar la eliminación de tu
          perfil, historial de entrenamientos, progreso, desafíos, recompensas y otros
          datos asociados a la cuenta, cuando legalmente corresponda.
        </p>

        <p>
          Algunos datos podrán conservarse durante el período necesario para
          cumplir obligaciones legales, resolver disputas, prevenir fraude o
          proteger nuestros derechos.
        </p>
      </LegalSection>

      <LegalSection title="Tus derechos">
        <p>
          De acuerdo con la legislación aplicable, podés ejercer los derechos
          que correspondan respecto de tus datos personales, incluyendo
          solicitar información sobre los datos tratados, acceder a ellos,
          solicitar su actualización o rectificación y, cuando corresponda,
          solicitar su eliminación.
        </p>

        <p>
          También podés consultar los mecanismos disponibles para gestionar tus
          preferencias de comunicaciones y determinados permisos desde Mi
          Entreno.
        </p>

        <p>
          Para ejercer tus derechos podés comunicarte con nosotros utilizando
          los datos de contacto indicados al final de esta política.
        </p>
      </LegalSection>

      <LegalSection title="Transferencias y proveedores internacionales">
        <p>
          Algunos de los proveedores tecnológicos utilizados por Mi Entreno
          pueden almacenar o procesar información en servidores ubicados fuera
          de la República Argentina.
        </p>

        <p>
          Cuando corresponda, adoptaremos las medidas necesarias para que el
          tratamiento de los datos se realice de acuerdo con la legislación
          aplicable y con las garantías correspondientes.
        </p>
      </LegalSection>

      <LegalSection title="Menores de edad">
        <p>
          Mi Entreno está destinado principalmente a personas mayores de edad.
        </p>

        <p>
          No buscamos recopilar deliberadamente datos personales de menores de
          edad sin la autorización correspondiente cuando esta sea legalmente
          necesaria.
        </p>

        <p>
          Si considerás que un menor proporcionó datos personales sin la
          autorización correspondiente, podés comunicarte con nosotros para que
          podamos analizar la situación y adoptar las medidas que correspondan.
        </p>
      </LegalSection>

      <LegalSection title="Cambios en esta política">
        <p>
          Podemos actualizar esta Política de Privacidad cuando sea necesario
          para reflejar cambios en Mi Entreno, nuevas funcionalidades,
          modificaciones legales, cambios en nuestros proveedores o mejoras en
          nuestras prácticas de privacidad.
        </p>

        <p>
          Cuando los cambios sean relevantes, procuraremos informarlos mediante
          los canales disponibles antes de que entren en vigencia, cuando
          corresponda.
        </p>

        <p>
          La fecha de última actualización aparecerá indicada en la parte
          superior de esta política.
        </p>
      </LegalSection>

      <LegalSection title="Contacto">
        <p>
          Si tenés preguntas sobre esta Política de Privacidad, querés ejercer
          tus derechos o necesitás información sobre el tratamiento de tus datos
          personales, podés comunicarte con nosotros mediante los siguientes
          datos:
        </p>

        <p>
          <strong>Responsable:</strong> [RAZÓN SOCIAL / NOMBRE DEL TITULAR]
          <br />
          <strong>CUIT:</strong> [CUIT]
          <br />
          <strong>Domicilio:</strong> [DOMICILIO]
          <br />
          <strong>Email:</strong> [EMAIL]
        </p>
      </LegalSection>

      <LegalContact />
    </>
  );
}
