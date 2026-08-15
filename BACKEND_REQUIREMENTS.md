# Requerimientos de backend

Qué necesita el backend para soportar tres funcionalidades nuevas del panel del entrenador:

1. **Invitaciones a planes** — el entrenador busca un alumno y le ofrece uno de sus planes.
2. **Notificaciones** de ese flujo, reutilizando el sistema que ya existe.
3. **Mercado Pago** como proveedor de pagos, con onboarding OAuth por entrenador.

El frontend **ya está implementado contra estos contratos**. Cada endpoint que falta se
degrada hoy en un mensaje explícito en pantalla que cita su sección de este documento, no en
un error genérico. En cuanto el backend responda, las pantallas funcionan sin tocar el
frontend.

> Documentos hermanos: [`docs/BACKEND_CHANGE_REQUEST.md`](docs/BACKEND_CHANGE_REQUEST.md)
> (peticiones sobre endpoints que ya existen) y
> [`docs/FRONTEND_INTEGRATION_PLAN.md`](docs/FRONTEND_INTEGRATION_PLAN.md) (contratos
> verificados del backend actual).

---

## Índice

1. [Resumen de endpoints](#1--resumen-de-endpoints)
2. [Moneda](#2--moneda)
3. [Invitaciones a planes](#3--invitaciones-a-planes)
4. [Notificaciones](#4--notificaciones)
5. [Mercado Pago](#5--mercado-pago)
6. [Webhooks](#6--webhooks)
7. [Estados de pago y de suscripción](#7--estados-de-pago-y-de-suscripción)
8. [Validaciones](#8--validaciones)
9. [Seguridad](#9--seguridad)
10. [Configuración y orden de entrega](#10--configuración-y-orden-de-entrega)
11. [Especialidades de texto libre](#11--especialidades-de-texto-libre)

---

## 1 · Resumen de endpoints

| # | Método | Ruta | Rol | Respuesta | §
|---|---|---|---|---|---|
| 1 | `GET` | `/api/users/students/search?q&page&size` | TRAINER | `Page<StudentSearchResultDTO>` | [3.1](#31--búsqueda-de-alumnos) |
| 2 | `POST` | `/api/plan-invitations` | TRAINER | `PlanInvitationResponseDTO` · 201 | [3.3](#33--endpoints-del-entrenador) |
| 3 | `GET` | `/api/plan-invitations/sent?status&page&size` | TRAINER | `Page<PlanInvitationResponseDTO>` | [3.3](#33--endpoints-del-entrenador) |
| 4 | `GET` | `/api/plan-invitations/sent/counts` | TRAINER | `InvitationCountsDTO` | [3.3](#33--endpoints-del-entrenador) |
| 5 | `DELETE` | `/api/plan-invitations/{id}` | TRAINER | 204 | [3.3](#33--endpoints-del-entrenador) |
| 6 | `POST` | `/api/plan-invitations/{id}/resend` | TRAINER | `PlanInvitationResponseDTO` | [3.3](#33--endpoints-del-entrenador) |
| 7 | `GET` | `/api/plan-invitations/received?status&page&size` | STUDENT | `Page<PlanInvitationResponseDTO>` | [3.4](#34--endpoints-del-alumno-app-móvil) |
| 8 | `POST` | `/api/plan-invitations/{id}/accept` | STUDENT | `AcceptInvitationResponseDTO` | [3.4](#34--endpoints-del-alumno-app-móvil) |
| 9 | `POST` | `/api/plan-invitations/{id}/reject` | STUDENT | 204 | [3.4](#34--endpoints-del-alumno-app-móvil) |
| 10 | `GET` | `/api/plan-invitations/token/{token}` | **permitAll** | `PlanInvitationResponseDTO` | [3.5](#35--endpoints-por-token-enlace-del-email) |
| 11 | `POST` | `/api/plan-invitations/token/{token}/accept` | **permitAll** | `AcceptInvitationResponseDTO` | [3.5](#35--endpoints-por-token-enlace-del-email) |
| 12 | `POST` | `/api/plan-invitations/token/{token}/reject` | **permitAll** | 204 | [3.5](#35--endpoints-por-token-enlace-del-email) |
| 13 | `GET` | `/api/payments/mercadopago/connection` | TRAINER | `MercadoPagoConnectionDTO` | [5.2](#52--endpoints-de-vinculación) |
| 14 | `POST` | `/api/payments/mercadopago/oauth/url` | TRAINER | `MercadoPagoAuthorizationDTO` | [5.2](#52--endpoints-de-vinculación) |
| 15 | `POST` | `/api/payments/mercadopago/oauth/callback` | TRAINER | `MercadoPagoConnectionDTO` | [5.2](#52--endpoints-de-vinculación) |
| 16 | `DELETE` | `/api/payments/mercadopago/connection` | TRAINER | 204 | [5.2](#52--endpoints-de-vinculación) |
| 17 | `POST` | `/api/payments/mercadopago/webhook` | **permitAll** | 200 | [6](#6--webhooks) |
| 18 | `GET` | `/api/subscriptions/{id}/payments` | TRAINER · STUDENT | `PaymentResponseDTO[]` | [7.3](#73--historial-de-pagos) |

Todo lo que responde `Page<T>` usa el `Pageable` de Spring que el proyecto ya emplea en
`/api/notifications` y `/api/catalog-exercises`; el frontend lo consume con
`core/http/pagination.ts` y no necesita ningún cambio de serialización.

---

## 2 · Moneda

La aplicación pasa de euros a **pesos argentinos**. El cambio es de presentación y ya está
hecho en el frontend (`lib/format.ts` → `Intl.NumberFormat("es-AR", { currency: "ARS",
currencyDisplay: "narrowSymbol" })`, que rinde `$ 25.000`).

Del backend hace falta confirmar dos cosas:

1. **`price` y `basePrice` son `BigDecimal` sin moneda asociada.** Hoy el importe es un número
   desnudo y el significado lo pone el cliente. Con un solo mercado eso funciona; conviene
   dejarlo escrito en la documentación de la API para que nadie asuma euros.
2. **Escala decimal.** En pesos los importes habituales son enteros de cuatro o cinco cifras.
   Si la columna es `DECIMAL(10,2)` no hay problema; si en algún punto se redondea a dos
   decimales por asumir céntimos, revisarlo.

**Opcional pero recomendable:** añadir `currency: "ARS"` a `SubscriptionPlanResponseDTO` y a
los DTOs de pago. Mercado Pago exige el campo `currency_id` al crear cualquier cobro
([§5.4](#54--crear-el-cobro)), así que el dato va a existir de todas formas en la capa de
pagos; exponerlo evita que el día que haya un segundo mercado el importe se muestre mal en
tres clientes a la vez.

---

## 3 · Invitaciones a planes

### 3.0 · Por qué hace falta

Hoy una suscripción **solo puede nacer del alumno**: `SubscriptionService.subscribe` la crea a
partir de una acción suya en el directorio. Un entrenador que cierra el trato en el gimnasio,
por WhatsApp o en una clase de prueba no tiene forma de entregarle el plan — solo puede
pedirle que lo busque y lo encuentre por su cuenta.

La invitación invierte esa dirección sin duplicar el modelo: **no crea una suscripción**, crea
una propuesta. La suscripción sigue naciendo de un acto del alumno; lo único que cambia es
quién la inicia.

### 3.1 · Búsqueda de alumnos

`GET /api/users/students/search?q={texto}&page=0&size=20` · **TRAINER**

Nada en la API actual permite a un entrenador ver a un usuario con el que no tiene ya una
suscripción: `/api/subscriptions/students` es su lista de alumnos y `/api/trainers` busca en
la dirección contraria.

**Request**

| Parámetro | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `q` | `String` | sí | Mínimo 2 caracteres. Coincidencia parcial e insensible a mayúsculas y acentos sobre nombre, apellido y email. |
| `page`, `size` | `int` | no | `@PageableDefault(size = 20)`. |

**Response** — `Page<StudentSearchResultDTO>`

```java
public record StudentSearchResultDTO(
        Long id,
        String fullName,
        String email,              // enmascarado: m***@gmail.com
        String profileImageUrl,
        String location,
        boolean alreadyMyStudent,  // suscripción ACTIVE o PAUSED con ESTE entrenador
        Long pendingInvitationId   // invitación PENDING de ESTE entrenador, o null
) {}
```

Los dos últimos campos son la razón de que esto no sea una búsqueda genérica de usuarios. Sin
ellos el selector ofrecería alumnos que ya son suyos o que ya tienen una invitación abierta, y
el único aviso llegaría como un 409 después de que el entrenador hubiera completado todo el
asistente. El frontend los usa para deshabilitar la fila **con el motivo escrito**
(`features/student-search/model/student-search.model.ts`).

**Reglas**

- Solo usuarios con rol `STUDENT`. Un entrenador no debe poder enumerar a otros entrenadores
  por aquí.
- Solo cuentas verificadas (`accountVerified = true`): invitar a quien no puede iniciar sesión
  produce una invitación muerta.
- Nunca devolver el email completo — ver [§9.3](#93--privacidad-de-los-datos-del-alumno).
- Con `q` de menos de 2 caracteres: `400` con mensaje, o `Page` vacía. El frontend ni siquiera
  dispara la petición, pero el límite debe existir también en el servidor.
- Rate limit recomendado: 30 búsquedas por minuto y entrenador.

### 3.2 · Entidad `PlanInvitation`

```java
@Entity
@Table(name = "plan_invitations",
       uniqueConstraints = @UniqueConstraint(
           name = "uk_invitation_open",
           columnNames = {"trainer_id", "student_id", "status"}))  // ver nota
public class PlanInvitation {
    @Id @GeneratedValue
    private Long id;

    @ManyToOne(optional = false) private Trainer trainer;
    @ManyToOne(optional = false) private User student;      // rol STUDENT
    @ManyToOne(optional = false) private SubscriptionPlan plan;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private InvitationStatus status = InvitationStatus.PENDING;

    @Column(length = 500)  private String message;          // nota del entrenador
    @Column(length = 300)  private String rejectionReason;  // motivo del alumno

    @Column(nullable = false, unique = true, length = 64)
    private String token;                                    // opaco, ver §9.2

    /** Se crea al aceptar. Null en cualquier otro estado. */
    @OneToOne private Subscription subscription;

    private Instant createdAt;
    private Instant expiresAt;    // createdAt + 7 días por defecto
    private Instant respondedAt;
}
```

**Relaciones**

```
Trainer 1 ──── N PlanInvitation N ──── 1 User(STUDENT)
                      │
                      │ N ──── 1 SubscriptionPlan
                      │
                      └ 0..1 ──── 1 Subscription   (solo si ACCEPTED)
```

**Nota sobre la unicidad.** El constraint de arriba es orientativo: lo que hay que garantizar
es **una sola invitación `PENDING` por (trainer, student)**, no una por estado. En PostgreSQL
la forma limpia es un índice parcial:

```sql
CREATE UNIQUE INDEX uk_invitation_pending
    ON plan_invitations (trainer_id, student_id)
    WHERE status = 'PENDING';
```

Sin él, dos clics rápidos en «Enviar invitación» crean dos propuestas y el alumno recibe dos
notificaciones idénticas.

**Índices adicionales**: `(trainer_id, status, created_at DESC)` para el listado del
entrenador, `(student_id, status)` para el del alumno, y `(status, expires_at)` para el job de
caducidad.

#### `InvitationStatus`

| Estado | Significado | Transiciona a |
|---|---|---|
| `PENDING` | Enviada, sin respuesta | `ACCEPTED`, `REJECTED`, `CANCELLED`, `EXPIRED` |
| `ACCEPTED` | El alumno aceptó; existe `subscription` | — (terminal) |
| `REJECTED` | El alumno rechazó, con `rejectionReason` opcional | — (terminal) |
| `CANCELLED` | El entrenador la retiró antes de la respuesta | — (terminal) |
| `EXPIRED` | Pasó `expiresAt` sin respuesta | — (terminal) |

**`PENDING` es el único estado vivo.** Cualquier transición desde un estado terminal es `409`,
no un `200` silencioso: el frontend distingue «ya no se puede» de «ha funcionado» y lo muestra
distinto.

#### Máquina de estados

```
                        ┌──────────── accept ──────────► ACCEPTED ──► crea Subscription
                        │                                             (PENDING_PAYMENT | ACTIVE)
   POST /plan-invitations
        │               ├──────────── reject ──────────► REJECTED
        ▼               │
     PENDING ───────────┤
        │               ├──── DELETE (entrenador) ─────► CANCELLED
        │               │
        └───────────────┴──── job: now > expiresAt ────► EXPIRED
```

### 3.3 · Endpoints del entrenador

#### `POST /api/plan-invitations` · 201

```json
{ "studentId": 42, "planId": 3, "message": "Te dejo el plan del que hablamos." }
```

| Campo | Validación |
|---|---|
| `studentId` | `@NotNull`. Debe existir y tener rol `STUDENT`. |
| `planId` | `@NotNull`. Debe pertenecer al entrenador autenticado y estar **activo**. |
| `message` | `@Size(max = 500)`. Opcional; `null` si viene vacío. |

**Errores**

| Código | Cuándo | Mensaje sugerido |
|---|---|---|
| `400` | Validación de campos | mapa `campo -> mensaje` (el frontend ya lo pinta por campo) |
| `403` | El plan no es del entrenador | «Ese plan no te pertenece» |
| `404` | Alumno o plan inexistente | «No hemos encontrado a ese alumno» |
| `409` | Ya hay una invitación `PENDING` entre ambos | «Ya tienes una invitación pendiente con este alumno» |
| `409` | Ya es alumno suyo (`ACTIVE`/`PAUSED`) | «Este alumno ya está suscrito a uno de tus planes» |
| `409` | El plan alcanzó `maxStudents` | «Este plan no tiene plazas libres» |

Este último merece una decisión explícita: **¿la plaza se reserva al invitar o al aceptar?**
Recomendación: comprobar al invitar *y* al aceptar, y reservar solo al aceptar. Reservar antes
convierte cada invitación no contestada en una plaza congelada durante siete días.

**Efectos**: crea la fila `PENDING`, genera `token`, fija `expiresAt = now + 7d`, envía
`PLAN_INVITATION_RECEIVED` al alumno ([§4](#4--notificaciones)).

#### `GET /api/plan-invitations/sent?status=PENDING&page=0&size=20`

`status` es **opcional**; ausente significa «todas» (la pestaña «Todas» del panel no envía el
parámetro). Orden: `createdAt DESC` — con dirección explícita, como recuerda la petición 2 de
`BACKEND_CHANGE_REQUEST.md`.

#### `GET /api/plan-invitations/sent/counts`

```json
{ "pending": 3, "accepted": 12, "rejected": 1 }
```

Alimenta los contadores de las pestañas. Es una decoración: si falla, el panel sigue
funcionando sin números (`useInvitationCounts` no reintenta ni avisa).

#### `DELETE /api/plan-invitations/{id}` · 204

Retira una invitación `PENDING` (`CANCELLED`). Cualquier otro estado: `409`. El token deja de
resolver inmediatamente.

#### `POST /api/plan-invitations/{id}/resend`

Solo desde `EXPIRED` o `CANCELLED`. **Genera un token nuevo** (el anterior debe morir) y un
`expiresAt` nuevo, vuelve a `PENDING` y reenvía la notificación. Desde `REJECTED` responde
`409`: un rechazo es una respuesta, y reenviarlo con un clic es acoso.

Rate limit recomendado: 3 reenvíos por invitación y día.

#### `PlanInvitationResponseDTO`

```java
public record PlanInvitationResponseDTO(
        Long id,
        InvitationStatus status,
        String message,
        String rejectionReason,
        StudentSummary student,          // id, fullName, email (enmascarado), profileImageUrl
        PartySummary trainer,            // id, fullName, profileImageUrl
        SubscriptionPlanResponseDTO plan,
        Instant createdAt,
        Instant expiresAt,
        Instant respondedAt,
        Long subscriptionId,             // solo si ACCEPTED
        SubscriptionStatus subscriptionStatus,  // estado real de esa suscripción
        String checkoutUrl               // sólo en el flujo por token, y sólo si PENDING_PAYMENT
) {}
```

**`status` y `subscriptionStatus` responden preguntas distintas.** `ACCEPTED` significa que el
alumno dijo que sí; `subscriptionStatus == ACTIVE` significa que *es* alumno. Entre las dos está
`PENDING_PAYMENT`, que es donde vive una propuesta aceptada y sin pagar. Sin este campo, quien
consuma el DTO sólo puede adivinar, y lo que adivina es «aceptada = alumno»: el panel ofrecía
«Ver alumno» y la página pública decía «¡Ya eres alumno!» antes de cobrar nada.

**`checkoutUrl` no viaja nunca al entrenador.** Es el link de pago del alumno; sólo lo rellena
`GET /api/plan-invitations/token/{token}`.

**`plan` es una copia, no una referencia.** Si el entrenador sube el precio del plan mientras
hay invitaciones abiertas, las ya enviadas deben seguir mostrando el importe que el alumno vio
al recibirlas. Guardar `price` y `billingPeriod` en la propia fila de la invitación —o
versionar el plan— evita una discusión desagradable con un alumno que aceptó otra cosa.

**`token` no aparece nunca en este DTO.** Es una credencial; sale del backend solo dentro del
enlace de la notificación o el email.

### 3.4 · Endpoints del alumno (app móvil)

Estos tres son los que consume `fitness_mobile`, con sesión de alumno.

#### `GET /api/plan-invitations/received?status=PENDING&page&size`

La bandeja de invitaciones pendientes del alumno.

#### `POST /api/plan-invitations/{id}/accept`

```java
public record AcceptInvitationResponseDTO(
        Long invitationId,
        Long subscriptionId,
        SubscriptionStatus subscriptionStatus,   // PENDING_PAYMENT o ACTIVE
        String checkoutUrl                       // init_point de Mercado Pago, o null
) {}
```

**Efectos, en una transacción:**

1. Invitación → `ACCEPTED`, `respondedAt = now`.
2. Crea la `Subscription` **por la misma vía que `SubscriptionService.subscribe`**, para que no
   existan dos formas de dar de alta a un alumno que puedan divergir.
3. Si `plan.price > 0` → la suscripción nace `PENDING_PAYMENT` y se crea la preferencia de
   cobro ([§5.4](#54--crear-el-cobro)); `checkoutUrl` es su `init_point`.
   Si `plan.price == 0` → nace `ACTIVE` y `checkoutUrl` es `null`.
4. Notifica al entrenador con `PLAN_INVITATION_ACCEPTED`. **Su `metadata` lleva
   `subscriptionId` sólo si la suscripción quedó `ACTIVE`**: ese id es con el que el panel
   construye el enlace a la ficha del alumno, así que mandarlo antes de cobrar es exactamente
   la forma de que «aceptada» acabe pareciendo «alumno» al otro lado. Sin id, el panel enlaza a
   la lista de invitaciones, que es donde de verdad está el caso.
5. `NEW_STUDENT` **solo cuando la suscripción queda `ACTIVE`**. Enviar las dos a la vez para
   una suscripción sin pagar le dice al entrenador que tiene un alumno que todavía no tiene.
6. **El token sobrevive a la aceptación mientras quede pago pendiente.** Quemarlo ahí dejaba al
   alumno sin ninguna vuelta al checkout: recargar la página, volver de Mercado Pago o cerrar
   el navegador a mitad daban «esta invitación ya no existe». Reaceptar sigue siendo imposible
   —`accept` exige `PENDING`—, así que el token vivo no abre nada nuevo. Se quema al pagar no
   hacer falta (plan gratuito), al rechazar y al cancelar.
7. **Reutiliza una suscripción `PENDING_PAYMENT` abierta** con ese mismo entrenador en lugar de
   crear otra, igual que hace `SubscriptionService.subscribe`. Si no, cada intento abandonado
   deja una fila que ocupa plaza en `maxStudents` y parte el historial de pagos en dos.

Errores: `409` si no está `PENDING` («Esta invitación ya no está disponible»), `409` si el plan
se quedó sin plazas, `403` si la invitación no es suya.

#### `POST /api/plan-invitations/{id}/reject` · 204

```json
{ "reason": "Prefiero esperar al mes que viene" }
```

`reason` es opcional, `@Size(max = 300)`. Efectos: → `REJECTED`, `respondedAt = now`,
`PLAN_INVITATION_REJECTED` al entrenador.

### 3.5 · Endpoints por token (enlace del email)

`permitAll`, en `SecurityConfig` junto a `/api/payments/webhook/**`.

| Método | Ruta | Respuesta |
|---|---|---|
| `GET` | `/api/plan-invitations/token/{token}` | `PlanInvitationResponseDTO` |
| `POST` | `/api/plan-invitations/token/{token}/accept` | `AcceptInvitationResponseDTO` |
| `POST` | `/api/plan-invitations/token/{token}/reject` | 204 |

Mismos efectos que sus equivalentes autenticados; el token identifica al alumno en lugar del
JWT.

**Por qué existen.** El panel del entrenador es una aplicación *trainer-only*: `proxy.ts`
rechaza a los alumnos y `app/auth/login/route.ts` les responde 403 explícitamente. Un alumno
que abre el enlace desde su notificación no tiene —ni tendrá— sesión aquí. La página pública
`/invitacion/[token]` es su único camino desde la web, y el enlace es también lo que hace
accionable un email o un push.

El frontend los alcanza por `/api/public/*`, un proxy **con lista blanca explícita**
(`server/public-routes.ts`, con tests): solo esas tres rutas y solo con esos métodos.

**El camino autenticado ([§3.4](#34--endpoints-del-alumno-app-móvil)) es el principal.** El
token es el respaldo para email y deep-link, y sus condiciones de seguridad están en
[§9.2](#92--el-token-de-invitación).

---

## 4 · Notificaciones

### 4.1 · Tipos nuevos

Añadir a `NotificationType`:

| Constante | Destinatario | Emisor | Cuerpo sugerido |
|---|---|---|---|
| `PLAN_INVITATION_RECEIVED` | alumno | `PlanInvitationService.create` | «{Entrenador} te propone el plan {Plan} por {precio}/mes» |
| `PLAN_INVITATION_ACCEPTED` | **entrenador** | `.accept` | «{Alumno} ha aceptado el plan {Plan}» |
| `PLAN_INVITATION_REJECTED` | **entrenador** | `.reject` | «{Alumno} ha rechazado el plan {Plan}» |
| `PLAN_INVITATION_EXPIRED` | **entrenador** | job de caducidad | «La invitación a {Alumno} ha caducado sin respuesta» |

Tres de las cuatro van **al entrenador**, lo que responde directamente a la petición 6 de
`BACKEND_CHANGE_REQUEST.md`: hoy su bandeja solo se llena con `NEW_STUDENT`.

El frontend ya etiqueta los cuatro tipos con su tono
(`features/notifications/model/notification.model.ts`) y sigue cayendo a una etiqueta genérica
para cualquier constante que no conozca, así que se pueden emitir por fases.

### 4.2 · `metadata`, por fin con contenido

`NotificationResponseDTO.metadata` es una `String` libre que **hoy es `null` en todas las
llamadas**. Por eso ninguna notificación es pulsable: no hay ningún id con el que construir un
enlace.

Petición: rellenarla con un objeto JSON plano.

| Tipo | `metadata` |
|---|---|
| `PLAN_INVITATION_RECEIVED` | `{"invitationId":9,"planId":3}` |
| `PLAN_INVITATION_ACCEPTED` | `{"invitationId":9,"subscriptionId":55,"studentId":42}` |
| `PLAN_INVITATION_REJECTED` | `{"invitationId":9,"studentId":42}` |
| `PLAN_INVITATION_EXPIRED` | `{"invitationId":9,"studentId":42}` |
| `PAYMENT_APPROVED` / `PAYMENT_REJECTED` | `{"subscriptionId":55}` |
| `PLAN_READY` / `PLAN_UPDATED` | `{"subscriptionId":55}` |
| `NEW_STUDENT` | `{"subscriptionId":55,"studentId":42}` |

El parser del frontend (`parseMetadata`) es deliberadamente tolerante y está cubierto por
tests: `null`, texto que no es JSON, un array, o una clave desconocida acaban todos en «sin
enlace», nunca en una excepción dentro del render de la lista. Solo se aceptan enteros
positivos, porque un `0` o un `"55"` construirían una URL que da 404.

Eso significa que **se puede empezar por los tipos y añadir `metadata` después**, sin romper
nada por el camino.

### 4.3 · Canales

El sistema actual escribe filas en `notifications` y el cliente consulta
`GET /api/notifications/unread-count` cada 60 segundos, porque no hay websocket ni SSE. Para
este flujo eso basta en el panel, pero **no** para el alumno: una invitación que tarda un
minuto en aparecer, o que solo aparece si abre la app, es una invitación que se pierde.

Recomendación por orden de valor:

1. **Push** (Expo / FCM) para `PLAN_INVITATION_RECEIVED`. Es el único tipo con urgencia real.
2. **Email** con el enlace `https://{APP_URL}/invitacion/{token}` como respaldo, para el alumno
   que tiene la app desinstalada o silenciada.
3. Los tres tipos del entrenador pueden vivir perfectamente con el polling que ya existe.

---

## 5 · Mercado Pago

### 5.1 · Modelo: marketplace, no credenciales pegadas

Cada entrenador cobra en **su propia** cuenta. Las dos formas de conseguirlo:

| | OAuth (marketplace) | El entrenador pega su Access Token |
|---|---|---|
| Credenciales en nuestra BD | token delegado, revocable | **secreto permanente del entrenador** |
| Si nos comprometen | se revoca desde Mercado Pago | acceso total a su cuenta |
| Comisión de la plataforma | `application_fee`, nativo | hay que facturar aparte |
| Fricción para el entrenador | un botón | copiar y pegar de un panel que no conoce |

**Recomendación: OAuth.** Es lo que el frontend implementa
(`features/payments/components/mercado-pago-screen.tsx`) y lo único que no nos deja guardando
secretos ajenos.

Registro necesario en el panel de Mercado Pago: una aplicación con `client_id` y
`client_secret`, y la `redirect_uri` apuntando a
`https://{APP_URL}/dashboard/payments/callback`.

### 5.2 · Endpoints de vinculación

#### `GET /api/payments/mercadopago/connection`

```java
public record MercadoPagoConnectionDTO(
        MercadoPagoConnectionStatus status,   // NOT_CONNECTED | CONNECTED | EXPIRED | REVOKED
        String mercadoPagoUserId,
        String nickname,
        String email,                          // enmascarado
        Instant connectedAt,
        Instant expiresAt,                     // caducidad del access token
        boolean liveMode,                      // false = sandbox
        List<String> scopes,
        BigDecimal applicationFeePercent
) {}
```

**No devuelve tokens jamás.** Ni el access, ni el refresh, ni truncados.

Un entrenador sin vincular responde `200` con `status: NOT_CONNECTED`, no `404`: «no vinculado»
es un estado válido, no la ausencia del recurso.

`EXPIRED` y `REVOKED` son el matiz que importa: son cuentas **vinculadas que no pueden cobrar**.
El frontend los distingue (`isOperational`) porque son justo el caso que deja a un alumno
atrapado en `PENDING_PAYMENT` sin que nadie se entere.

#### `POST /api/payments/mercadopago/oauth/url`

```json
// request
{ "redirectPath": "/dashboard/payments/callback" }
// response
{ "authorizationUrl": "https://auth.mercadopago.com.ar/authorization?client_id=…&state=…",
  "state": "9f2c…" }
```

`POST` y no `GET` porque **tiene efecto**: acuña y guarda un `state` de un solo uso ligado al
entrenador. Sin eso, la vuelta del OAuth no es verificable y el CSRF de esa pata queda abierto.

`state`: aleatorio ≥128 bits, guardado con el `trainerId` y una caducidad de 10 minutos.
`redirectPath` debe validarse contra una lista blanca — un `redirect_uri` que acepte cualquier
cosa es un redirector abierto.

#### `POST /api/payments/mercadopago/oauth/callback`

```json
{ "code": "TG-abc123…", "state": "9f2c…" }
```

1. Valida `state`: existe, no caducado, **no usado**, y pertenece al entrenador autenticado.
   Consúmelo.
2. `POST https://api.mercadopago.com/oauth/token` con `client_secret` (server-side; el secreto
   no puede pasar por el navegador).
3. Guarda `access_token`, `refresh_token`, `user_id`, `expires_in`, `live_mode`, `scopes`
   **cifrados en reposo** ([§9.4](#94--credenciales-de-mercado-pago)).
4. Responde el `MercadoPagoConnectionDTO` ya actualizado.

Errores: `400 invalid_grant` si el código ya se usó (el frontend evita el doble envío con un
ref, pero el servidor no debe confiar en eso), `409` si esa cuenta de Mercado Pago ya está
vinculada a otro entrenador.

#### `DELETE /api/payments/mercadopago/connection` · 204

Revoca contra Mercado Pago y borra las credenciales. **Las suscripciones existentes conservan
su historial**; lo que se detiene es la creación de cobros nuevos y las renovaciones. Merece
advertirlo en la respuesta o en la documentación, porque es una acción con consecuencias
diferidas.

### 5.3 · Entidad

```java
@Entity
@Table(name = "trainer_payment_accounts")
public class TrainerPaymentAccount {
    @Id @GeneratedValue private Long id;

    @OneToOne(optional = false) private Trainer trainer;   // 1:1

    @Enumerated(EnumType.STRING) private PaymentProvider provider;  // MERCADO_PAGO
    @Enumerated(EnumType.STRING) private MercadoPagoConnectionStatus status;

    private String externalUserId;      // user_id de Mercado Pago, único
    private String nickname;
    private String email;

    @Convert(converter = EncryptedStringConverter.class)
    private String accessToken;
    @Convert(converter = EncryptedStringConverter.class)
    private String refreshToken;

    private Instant tokenExpiresAt;
    private boolean liveMode;
    private String scopes;
    private Instant connectedAt;
    private Instant revokedAt;
}
```

`PaymentProvider` como enum desde el principio: `Subscription` ya tiene una columna
`paymentProvider`, y dejarlo abierto cuesta poco hoy y mucho el día que entre un segundo
proveedor.

**Refresco del token.** El access token de Mercado Pago dura 180 días; el refresh permite
rotarlo. Hace falta un job que renueve los que caducan en menos de 15 días y marque `EXPIRED`
los que fallen — con su notificación al entrenador, porque una cuenta caducada en silencio es
un cobro que no ocurre y nadie ve.

### 5.4 · Crear el cobro

Al aceptar una invitación de un plan de pago
([§3.4](#34--endpoints-del-alumno-app-móvil)):

- **Cobro único** (`BillingPeriod` puntual) → `POST /checkout/preferences` con
  `marketplace_fee`. `checkoutUrl` = `init_point`.
- **Suscripción recurrente** (lo natural para `MONTHLY`/`QUARTERLY`/`YEARLY`) →
  `POST /preapproval`, con `auto_recurring.frequency` derivado del `billingPeriod` y
  `currency_id: "ARS"`. `checkoutUrl` = `init_point`.

En ambos casos:

| Campo | Valor |
|---|---|
| `external_reference` | `subscriptionId` — es lo que permite reconciliar el webhook |
| `notification_url` | `https://{API_URL}/api/payments/mercadopago/webhook` |
| `back_urls` | vuelta a la app móvil (deep link) o a `/invitacion/{token}` |
| `payer.email` | email real del alumno |
| Credenciales | las **del entrenador**, no las de la plataforma |

**`external_reference` es obligatorio.** Sin él, un webhook es un pago sin destino conocido y la
reconciliación se convierte en adivinanza.

### 5.5 · Entidad `Payment`

```java
@Entity
public class Payment {
    @Id @GeneratedValue private Long id;

    @ManyToOne(optional = false) private Subscription subscription;

    @Enumerated(EnumType.STRING) private PaymentProvider provider;
    @Column(unique = true) private String externalPaymentId;   // id de Mercado Pago
    private String preferenceId;

    @Enumerated(EnumType.STRING) private PaymentStatus status;
    private String statusDetail;        // cbd_rejected_other_reason, etc.

    private BigDecimal amount;
    private String currency;            // "ARS"
    private BigDecimal applicationFee;
    private String paymentMethod;       // visa, account_money…

    private Instant createdAt;
    private Instant approvedAt;
    private Instant updatedAt;
    @Lob private String rawPayload;     // último webhook, para auditar
}
```

`externalPaymentId` **único**: es lo que hace idempotente el webhook
([§6](#6--webhooks)).

### 5.6 · El caso que hay que prevenir

**Un plan de pago cuyo entrenador no tiene Mercado Pago vinculado.** El alumno acepta, la
suscripción nace `PENDING_PAYMENT`, y no hay nada que pagar: queda atrapado sin que nadie se
entere.

El frontend avisa por dos sitios —banner en «Planes» y aviso en el paso final del asistente—,
pero **son avisos, no una garantía**. El backend debería cerrarlo:

1. `POST /api/plan-invitations` responde `409` si `plan.price > 0` y el entrenador no tiene una
   cuenta `CONNECTED`. Mensaje: «Vincula tu cuenta de Mercado Pago para poder ofrecer planes de
   pago».
2. Si la vinculación se rompe *después* de enviar la invitación, `accept` responde `409` con un
   mensaje dirigido al alumno, y la invitación **sigue `PENDING`** — no se consume por un
   problema que no es suyo.

---

## 6 · Webhooks

`POST /api/payments/mercadopago/webhook` · **permitAll** (ya contemplado en `SecurityConfig`)

```json
{ "id": 12345, "live_mode": true, "type": "payment",
  "action": "payment.updated", "data": { "id": "1234567890" } }
```

**Reglas, todas obligatorias:**

1. **Verificar la firma.** Mercado Pago envía `x-signature` y `x-request-id`; hay que validar el
   HMAC-SHA256 con la clave secreta del webhook. Sin esto, el endpoint es una forma pública de
   activar suscripciones sin pagar.
2. **Responder `200` rápido.** Encolar el procesamiento; Mercado Pago reintenta ante timeout y
   duplica el trabajo.
3. **Idempotencia.** El mismo `data.id` llega varias veces. La unicidad de
   `Payment.externalPaymentId` más un `INSERT … ON CONFLICT DO UPDATE` resuelve la fila, pero
   **no** las notificaciones: hay que avisar por *transición* de estado, comparando el estado
   guardado con el que devuelve MP. Un estado que no cambió no es una novedad. Sin esto, cada
   reintento de un pago rechazado le manda al alumno otro «pago rechazado».
4. **No confiar en el cuerpo.** El webhook es un aviso, no un dato: hay que consultar
   `GET /v1/payments/{id}` con las credenciales del entrenador y usar *esa* respuesta.
5. **Orden no garantizado.** Puede llegar `approved` después de `pending`. Guardar la marca de
   tiempo del proveedor y descartar actualizaciones más antiguas que la ya aplicada.
6. **Registrar siempre**, incluso lo que se descarta. Un pago que no cuadra se investiga con el
   log, no con la memoria.

**Efectos por estado:**

| Estado del pago | Suscripción | Notificación |
|---|---|---|
| `approved` | `PENDING_PAYMENT` → `ACTIVE`, fija `startedAt` y `expiresAt` | `PAYMENT_APPROVED` al alumno · `NEW_STUDENT` al entrenador |
| `rejected` | sigue `PENDING_PAYMENT` | `PAYMENT_REJECTED` al alumno, **con el motivo legible** |
| `pending` / `in_process` | sin cambios | ninguna (aún no hay nada que contar) |
| `refunded` / `charged_back` | → `CANCELLED` | avisar a ambas partes |
| `cancelled` | sigue `PENDING_PAYMENT` | ninguna |

**Esta tabla es la definición de «ser alumno».** `approved` es la única fila que activa una
suscripción, y activarla es lo único que emite `NEW_STUDENT`. Todo pasa por
`SubscriptionService.activate`, que sólo actúa desde `PENDING_PAYMENT`: ese guard es a la vez la
regla de negocio y la idempotencia de la notificación. Aceptar una invitación no llega nunca a
esta tabla.

Para el preapproval hay además eventos de la suscripción: `authorized` (activa),
`paused`, `cancelled`. Deben mapearse al `SubscriptionStatus` que ya existe, sin inventar
estados nuevos.

**Pagos rechazados.** `status_detail` trae el motivo (`cc_rejected_insufficient_amount`,
`cc_rejected_bad_filled_security_code`…). Traducirlo a algo accionable — «Fondos
insuficientes», «Revisa el código de seguridad» — cambia por completo la probabilidad de que el
alumno lo reintente. El frontend muestra `message` tal cual llega.

---

## 7 · Estados de pago y de suscripción

### 7.1 · `PaymentStatus`

Espejo de Mercado Pago, sin reinterpretar: `PENDING`, `IN_PROCESS`, `APPROVED`, `AUTHORIZED`,
`REJECTED`, `CANCELLED`, `REFUNDED`, `CHARGED_BACK`.

### 7.2 · `SubscriptionStatus`

**No hacen falta estados nuevos.** Los cinco que existen cubren el flujo:

```
invitación aceptada
        │
        ├─ plan gratuito ──────────────► ACTIVE
        │
        └─ plan de pago ──► PENDING_PAYMENT ──webhook approved──► ACTIVE
                                    │                               │
                                    │                          pause│resume
                                    │                               ▼
                                    │                            PAUSED
                                    │
                            sin pagar en 48 h ──────────────────► CANCELLED
                                                    vence ──────► EXPIRED
```

Conviene un job que cancele las `PENDING_PAYMENT` que llevan más de 48 horas sin pagar: si no,
ocupan plaza en `maxStudents` indefinidamente.

### 7.3 · Historial de pagos

`GET /api/subscriptions/{id}/payments` — el entrenador o el alumno de esa suscripción.

```java
public record PaymentResponseDTO(
        Long id, PaymentStatus status, String statusDetail,
        BigDecimal amount, String currency, String paymentMethod,
        Instant createdAt, Instant approvedAt) {}
```

No está consumido todavía por el panel; queda especificado porque es la respuesta natural a
«¿por qué esta suscripción sigue en pago pendiente?».

---

## 8 · Validaciones

### Invitaciones

- `studentId`, `planId`: `@NotNull`; existencia comprobada.
- El plan pertenece al entrenador autenticado — **en el servidor**, nunca por el id que llega.
- El alumno tiene rol `STUDENT` y cuenta verificada.
- Una sola invitación `PENDING` por (trainer, student) — con índice parcial, no solo con un
  `if` ([§3.2](#32--entidad-planinvitation)).
- No invitar a quien ya es alumno con suscripción `ACTIVE`/`PAUSED`.
- `message` ≤ 500, `rejectionReason` ≤ 300. Ambos escapados al renderizarlos en email.
- Transiciones solo desde `PENDING`; el resto, `409`.
- `expiresAt` comprobado en cada respuesta, no solo por el job — el job corre cada hora y el
  enlace se puede abrir en el minuto intermedio.

### Búsqueda

- `q` ≥ 2 caracteres, ≤ 100.
- `size` ≤ 50, para que nadie pagine la tabla entera.
- Rate limit por entrenador.

### Mercado Pago

- `state` de un solo uso, ≤ 10 minutos, ligado al entrenador.
- `redirectPath` contra lista blanca.
- Una cuenta de Mercado Pago no puede estar vinculada a dos entrenadores (`409`).
- Al crear un cobro: verificar que el token del entrenador sigue vivo; si no, refrescar antes,
  y si el refresco falla, `EXPIRED` + notificación en lugar de un 500.

---

## 9 · Seguridad

### 9.1 · Autorización

Toda comprobación de propiedad sale del **JWT**, no del cuerpo de la petición:

| Recurso | Regla |
|---|---|
| `POST /plan-invitations` | `plan.trainer.id == jwt.trainerId` |
| `GET /sent`, `DELETE`, `resend` | `invitation.trainer.id == jwt.trainerId` |
| `GET /received`, `accept`, `reject` | `invitation.student.id == jwt.userId` |
| `/payments/mercadopago/**` | siempre la cuenta del entrenador autenticado |

Recurso ajeno → **`404`, no `403`**, como ya hace `NotificationService`: un `403` confirma que
el id existe.

### 9.2 · El token de invitación

Es una credencial portadora. Condiciones **no negociables**:

| | |
|---|---|
| Entropía | ≥128 bits de un CSPRNG (`SecureRandom`), base64url |
| Almacenamiento | hash (SHA-256) en la BD, como una contraseña |
| Vida | 7 días, y muere en cuanto se responde |
| Reutilización | uno solo; `resend` genera otro y **invalida el anterior** |
| Alcance | una única invitación; nunca sesión, nunca otro recurso |
| Difusión | solo al email/push del alumno registrado; **no** aparece en ningún DTO |
| Rate limit | 10 intentos por IP y hora sobre `/token/**`, contra el barrido |
| Indexación | la página responde `noindex, nofollow` (ya implementado) |

**Riesgo asumido, escrito para que sea una decisión y no un descuido:** quien tenga el enlace
puede aceptar o rechazar en nombre del alumno. Está acotado porque el destinatario ya está
fijado por el entrenador —el token no se puede redirigir a otra cuenta— y porque aceptar no
concede nada más que una suscripción `PENDING_PAYMENT` a nombre de ese alumno. Aun así, **la
vía autenticada de [§3.4](#34--endpoints-del-alumno-app-móvil) debe ser la principal**; si más
adelante se prefiere endurecerlo, la forma natural es que `/token/{token}` devuelva solo la
vista previa y exija login para responder.

### 9.3 · Privacidad de los datos del alumno

`GET /api/users/students/search` deja a un entrenador consultar usuarios que **no son suyos**.
Es el endpoint más delicado de todo el documento.

- **Email siempre enmascarado** (`m***@gmail.com`). Sirve para distinguir a dos María López,
  que es para lo que está; no para construir una lista de correos.
- Nunca teléfono, fecha de nacimiento, dirección ni ningún dato de progreso.
- Solo cuentas `STUDENT` verificadas.
- Rate limit y **log de auditoría**: quién buscó qué y cuándo. Un entrenador barriendo la base
  de usuarios debe ser detectable.
- Considerar un ajuste de privacidad del alumno («permitir que los entrenadores me
  encuentren», por defecto activo). Es lo que convierte esto de una decisión nuestra en una
  decisión suya.

### 9.4 · Credenciales de Mercado Pago

- `access_token` y `refresh_token` **cifrados en reposo** (AES-GCM con clave del KMS/vault, no
  una constante en `application.properties`).
- Nunca en logs, nunca en una respuesta, ni siquiera truncados.
- `client_secret` solo en el servidor.
- Firma del webhook verificada siempre ([§6](#6--webhooks)).
- Rotación de tokens registrada.
- Toda llamada a Mercado Pago con timeout y reintento acotado: su caída no puede convertirse en
  la nuestra.

### 9.5 · Idempotencia

| Operación | Clave |
|---|---|
| Crear invitación | índice parcial sobre `PENDING` |
| Aceptar / rechazar | transición solo desde `PENDING`, con bloqueo optimista |
| Webhook | `Payment.externalPaymentId` único |
| Callback OAuth | `state` de un solo uso |

---

## 10 · Configuración y orden de entrega

### Variables nuevas

```properties
# Mercado Pago
mercadopago.client-id=${MP_CLIENT_ID}
mercadopago.client-secret=${MP_CLIENT_SECRET}
mercadopago.redirect-uri=${APP_URL}/dashboard/payments/callback
mercadopago.webhook-secret=${MP_WEBHOOK_SECRET}
mercadopago.application-fee-percent=10

# Invitaciones
invitations.expiry-days=7
invitations.base-url=${APP_URL}/invitacion

# Cifrado de credenciales
payments.encryption-key=${PAYMENTS_ENCRYPTION_KEY}
```

`APP_URL` es la URL pública de este panel; hoy no existe como variable en el backend y el
enlace de la invitación la necesita.

### CORS

`/api/plan-invitations/token/**` se llama desde el servidor de Next (no desde el navegador del
alumno), así que no requiere CORS. Si en algún momento se llamara directo desde el navegador,
habría que añadir el origen del panel a la lista actual.

### Orden sugerido

| Fase | Contenido | Desbloquea |
|---|---|---|
| **1** | `GET /api/users/students/search` | El primer paso del asistente |
| **2** | Entidad `PlanInvitation` + endpoints del entrenador ([§3.3](#33--endpoints-del-entrenador)) | Enviar y hacer seguimiento — **el panel queda funcional de punta a punta** |
| **3** | Tipos de notificación ([§4.1](#41--tipos-nuevos)) | Que el alumno se entere |
| **4** | Endpoints del alumno ([§3.4](#34--endpoints-del-alumno-app-móvil)) y por token ([§3.5](#35--endpoints-por-token-enlace-del-email)) | Aceptar y rechazar |
| **5** | OAuth de Mercado Pago ([§5.2](#52--endpoints-de-vinculación)) | La pantalla de cobros |
| **6** | Cobros + webhook ([§5.4](#54--crear-el-cobro), [§6](#6--webhooks)) | Que el dinero llegue |
| **7** | `metadata` en notificaciones ([§4.2](#42--metadata-por-fin-con-contenido)) | Notificaciones pulsables |

Las fases 1–2 ya dejan el panel utilizable con planes gratuitos. La 7 es puro pulido: el
frontend ya la tolera cuando no está.

### Qué hace el frontend mientras tanto

Cada pantalla detecta el `404` de su propio endpoint y lo dice con nombre y sección de este
documento, en vez de «no se ha encontrado el recurso»:

| Pantalla | Endpoint que espera |
|---|---|
| `/dashboard/invitations` | `GET /api/plan-invitations/sent` |
| Asistente de invitación, paso 1 | `GET /api/users/students/search` |
| `/dashboard/payments` | `GET /api/payments/mercadopago/connection` |

Los avisos de Mercado Pago en «Planes» y en el asistente permanecen ocultos mientras el estado
no se conozca, para no alarmar por un endpoint que todavía no existe.

---

## 11 · Especialidades de texto libre

El campo «Especialidades» del alta de entrenador era un selector sobre la tabla `specialties`,
sembrada con cinco filas. Un entrenador cuya especialidad no fuese una de ellas no tenía forma
de decirlo: ni «otra», ni texto libre, ni nada. El catálogo pasa a ser **sugerencia**, no
restricción.

### Contrato

`CompleteTrainerProfileRequestDTO` y `UpdateTrainerProfileRequestDTO` aceptan un campo nuevo:

```java
List<String> specialties      // texto libre, tal cual lo escribió el entrenador
List<Long>   specialtyIds     // se mantiene: catálogo cerrado, compatibilidad
```

**`specialties` manda cuando viene.** Es lo que el entrenador escribió en *este* envío,
mientras que un id sólo puede referirse a algo que ya existía — justo la restricción que se
quita. `specialtyIds` sigue funcionando para clientes que no se hayan actualizado; hoy sólo lo
usaría `fitness_mobile`, que en realidad nunca escribe especialidades.

La respuesta (`TrainerProfileResponseDTO.specialties`) no cambia: siempre fueron nombres. Con
esto lectura y escritura hablan por fin el mismo idioma, y desaparece la resolución
nombre → id que el panel tenía que hacer contra el catálogo (y que hacía desaparecer del
formulario cualquier especialidad que el catálogo no tuviese).

### Resolución

`SpecialtyResolver` resuelve cada nombre contra `specialties.slug` y crea la fila si no existe:

| Escribe | `slug` | Resultado |
|---|---|---|
| `CrossFit` | `crossfit` | crea o reutiliza |
| `  crossfit ` | `crossfit` | **la misma fila** |
| `Preparación Física` | `preparacion-fisica` | crea o reutiliza |

El slug —sin tildes, minúsculas, todo lo que no sea letra o dígito a guión— es lo que impide
que «libre» degenere en un vocabulario con quince variantes de lo mismo, y mantiene utilizable
el filtro por especialidad del directorio, que compara por igualdad exacta.

Se guarda **el texto tal cual lo escribió el entrenador** (recortado y con los espacios
internos colapsados). Corregirlo o traducirlo sería inventar.

Límites: `name` y `slug` son `VARCHAR(100)`, y un perfil admite hasta 12 especialidades — más
que eso no describe a nadie. Una colisión de `slug` entre dos entrenadores guardando a la vez
se resuelve releyendo la fila que ganó, no fallando.

### Qué hace el frontend

`SpecialtyTagsInput` sustituye al antiguo selector: se escribe y se pulsa Intro (o coma), y el
catálogo aparece debajo como sugerencias pulsables. Repite la regla del slug en local
(`specialtyKey`) para no aceptar una etiqueta que el servidor fundiría con otra — el chip
desaparecería en la siguiente carga sin explicación.
