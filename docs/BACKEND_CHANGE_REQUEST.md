# Peticiones de cambio al backend

## Índice

1. [`GET /api/subscriptions/students`](#petición-1--getapisubscriptionsstudents) — 4 problemas (fase 3)
2. [Anotaciones Swagger de `/api/training-plans`](#petición-2--anotaciones-swagger-de-apitraining-plans) — documentación incorrecta (fase 5)
3. [Falta `GET /api/foods/categories`](#petición-3--falta-getapifoodscategories) — filtro sin fuente de valores (fase 6)
4. [Un vídeo demasiado grande devuelve 500](#petición-4--un-vídeo-demasiado-grande-devuelve-500) (fase 8)
5. [El entrenador no puede listar las sesiones de sus alumnos](#petición-5--el-entrenador-no-puede-listar-las-sesiones-de-sus-alumnos) (fase 9)
6. [Cinco tipos de notificación no se emiten nunca](#petición-6--cinco-tipos-de-notificación-no-se-emiten-nunca) (fase 10)
7. [No hay dónde subir una foto de perfil](#petición-7--no-hay-dónde-subir-una-foto-de-perfil) (segunda ronda de pruebas)

---

# Petición 7 — No hay dónde subir una foto de perfil

El backend almacena y **sirve** archivos: `LocalFileStorageService` los guarda y
`FileController` los expone en `/api/files/**`. Pero el único punto de **entrada**
multipart de toda la API es:

```java
POST /api/exercises/{id}/videos    // @RequestParam("file") MultipartFile
```

que está atado a un ejercicio y no sirve para un avatar.

Mientras tanto, los dos campos que guardan la foto de una persona son columnas
`String` sueltas:

| Entidad | Campo | Endpoint que lo escribe |
|---|---|---|
| `UserDetail` | `pathProfilePicture` | `PUT /api/user-detail` |
| `Trainer` | `profileImageUrl` | `PUT /api/trainer/profile` |

Es decir: la API acepta *la URL de una foto*, pero no acepta *la foto*. La única
forma de rellenar esos campos era que el entrenador alojara la imagen por su
cuenta y pegara el enlace — algo que prácticamente nadie puede hacer desde el
móvil, que es desde donde se registran.

## Cambio propuesto

Un endpoint genérico de subida, copiando el patrón del de vídeos:

```java
@Operation(summary = "Sube un archivo",
           description = "Almacena el archivo y devuelve la URL con la que servirlo.")
@PostMapping(value = "/api/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public FileUploadResponseDTO upload(@RequestParam("file") MultipartFile file) {
    return new FileUploadResponseDTO(storageService.store(file));
}
```

Con validación de tipo y tamaño en el servicio, como `validateVideoFile`, y
devolviendo la misma forma de URL que ya produce `LocalFileStorageService`
(`${baseUrl}/api/files/${key}`), que el frontend ya sabe enrutar.

Un `POST /api/user-detail/photo` específico también valdría; genérico es más
útil, porque las certificaciones (`certificateUrl`) tienen exactamente el mismo
problema.

## Qué hace el frontend mientras tanto

`components/shared/image-upload-field.tsx` es un selector de archivo completo:
arrastrar y soltar, cámara en el móvil (`capture="user"`), vista previa local
inmediata, validación de tipo y tamaño antes de enviar
(`core/media/image.ts`, con tests) y barra de progreso por XHR.

Sube contra `POST /api/uploads/avatar`, una route handler nuestra que valida de
nuevo del lado del servidor y reenvía el multipart al endpoint de arriba. **Todo
el acoplamiento con el backend está en una constante**, `UPSTREAM_UPLOAD_PATH`,
así que el día que exista el endpoint no hay nada que cambiar salvo confirmar la
ruta.

Si el backend responde 404 o 405, la route handler devuelve un 501 y la interfaz
dice "La subida de fotos todavía no está disponible" — sin nombrar la ruta ni
inventar que ha funcionado.

---

# Petición 6 — Cinco tipos de notificación no se emiten nunca

`NotificationType` declara nueve constantes. Buscando todas las llamadas a `notificationService.send(...)` en el proyecto, solo se producen cuatro:

| Tipo | Emisor | Destinatario |
|---|---|---|
| `PLAN_READY` | `TrainingPlanService.create` | alumno |
| `PAYMENT_APPROVED` | `PaymentService` | alumno |
| `PAYMENT_REJECTED` | `PaymentService` (×2) | alumno |
| `NEW_STUDENT` | `SubscriptionService.subscribe` | **entrenador** |
| `PLAN_UPDATED` | — | — |
| `NUTRITION_PLAN_READY` | — | — |
| `SUBSCRIPTION_EXPIRING` | — | — |
| `SUBSCRIPTION_EXPIRED` | — | — |
| `TRAINER_ANNOUNCEMENT` | — | — |

Dos consecuencias:

**1. El panel del entrenador recibe un único tipo de notificación.** Todo lo demás va al alumno, así que la bandeja del entrenador solo se llena cuando alguien se suscribe. La funcionalidad está bien construida, pero hoy tiene un solo emisor.

**2. `NUTRITION_PLAN_READY` refuerza la petición 2.** En la fase 7 señalé que `NutritionPlanService.create` no notifica, a diferencia de su gemelo de entrenamiento, y que no quedaba claro si era intencionado. El enum **ya tiene una constante para ese aviso**. Eso inclina la balanza: parece un olvido, no una decisión.

## Cambios sugeridos, por orden de valor

1. **`NUTRITION_PLAN_READY`** en `NutritionPlanService.create`, copiando el patrón de `TrainingPlanService.create`. Cierra la asimetría de la petición 2.
2. **`SUBSCRIPTION_EXPIRING` / `SUBSCRIPTION_EXPIRED`** desde el job que expira suscripciones — útiles para **ambas** partes, y para el entrenador es justo el aviso que le permite retener a un alumno antes de perderlo.
3. **`PLAN_UPDATED`** al editar una versión en sitio (`PUT`), si se quiere que el alumno se entere de una corrección.
4. `TRAINER_ANNOUNCEMENT` requiere una función que hoy no existe (mensajes del entrenador a sus alumnos); es un producto nuevo, no una línea que falte.

Alternativamente, si algún tipo se descarta, retirarlo del enum: una constante sin emisor invita a construir UI para algo que nunca llega.

## Qué hace el frontend mientras tanto

`features/notifications/model/notification.model.ts` etiqueta **los nueve tipos** y cae a una etiqueta genérica para cualquiera que no conozca. El backend puede empezar a emitir los que faltan sin necesidad de desplegar el panel, y un tipo nuevo nunca se renderiza en blanco. Verificado e2e con un tipo inventado.

---

# Petición 5 — El entrenador no puede listar las sesiones de sus alumnos

`GET /api/workout-sessions/{sessionId}` es accesible para el entrenador: el controlador resuelve el perfil con `resolveProfileId` (que devuelve el trainer si existe) y `checkReadAccess` acepta tanto al alumno como al entrenador del plan.

**Pero no hay ninguna forma de descubrir el `sessionId`.**

| Endpoint | Quién |
|---|---|
| `GET /api/workout-sessions/my` | `@PreAuthorize("hasRole('STUDENT')")` — solo el alumno |
| `GET /api/workout-sessions/{sessionId}` | alumno **o** entrenador |
| *listado para el entrenador* | **no existe** |

`IWorkoutSessionRepository` solo tiene:

```java
List<WorkoutSession> findByStudentIdOrderByStartedAtDesc(Long studentId);
List<WorkoutSession> findByStudentIdAndStatusOrderByStartedAtDesc(Long studentId, WorkoutStatus status);
```

Ninguna consulta por entrenador ni por suscripción.

Es el mismo patrón que el problema 2 de la petición 1: el endpoint de detalle existe y funciona, pero nada expone los ids, así que en la práctica es inalcanzable desde el panel. El endpoint `GET /api/workout-sessions/{sessionId}` está hoy implementado y sin uso real.

## Cambio propuesto

Reutilizando la consulta que ya existe:

```java
// IWorkoutSessionRepository — la primera ya sirve, solo hace falta exponerla

// WorkoutSessionController
@Operation(summary = "Sesiones de un alumno",
           description = "TRAINER. Sesiones del alumno de la suscripción indicada, "
                       + "de más reciente a más antigua.")
@GetMapping("/subscription/{subscriptionId}")
@PreAuthorize("hasRole('TRAINER')")
public List<WorkoutSessionSummaryDTO> getBySubscription(
        @PathVariable Long subscriptionId,
        @AuthenticationPrincipal JwtAuthenticatedUser currentUser) {
    return workoutSessionService.getBySubscription(subscriptionId, resolveTrainerId(currentUser));
}
```

El servicio resolvería la suscripción, comprobaría que el entrenador es su dueño y llamaría a `findByStudentIdOrderByStartedAtDesc(subscription.getStudent().getId())`. `WorkoutSessionSummaryDTO` ya existe y trae `setCount` y `hasFeedback`, justo lo que necesita un listado.

Encaja con el resto de la API, que ya usa `/subscription/{id}` para el progreso y para los planes.

## Qué hace el frontend mientras tanto

`features/workout-sessions/` está **completo** — repositorio, hook y la hoja de detalle con series, volumen total y feedback. Se abre con `?session=<id>` en la ficha del alumno, así que funcionará el día que exista una fuente de ids (este listado, o una notificación que lo incluya).

No he inventado una UI de búsqueda por ID: un entrenador nunca va a tener ese número a mano, y un campo así sería atrezo.

---

# Petición 4 — Un vídeo demasiado grande devuelve 500

`POST /api/exercises/{id}/videos` acepta hasta 100 MB:

```properties
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=105MB
```

Al superarlo, Spring lanza `MaxUploadSizeExceededException` **antes** de que el controlador se ejecute. `GlobalExceptionHandler` no la contempla, así que la recoge el fallback:

```java
@ExceptionHandler(Exception.class)
public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)...
}
```

El cliente recibe un **500 "Error interno del servidor"** después de haber transferido más de 100 MB. No puede distinguir "el archivo es demasiado grande" de "el servidor se ha caído", ni decírselo al usuario.

`validateVideoFile` tampoco comprueba el tamaño: delega por completo en el límite de Spring.

## Cambio propuesto

```java
@ExceptionHandler(MaxUploadSizeExceededException.class)
public ResponseEntity<ErrorResponse> handleUploadTooLarge(MaxUploadSizeExceededException ex) {
    log.warn("Subida rechazada por tamaño: {}", ex.getMessage());
    return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
            .body(new ErrorResponse("El archivo supera el máximo de 100 MB",
                    HttpStatus.PAYLOAD_TOO_LARGE.value(), Instant.now()));
}
```

413 con un mensaje concreto, en lugar de 500 con uno genérico.

## Qué hace el frontend mientras tanto

`features/exercises/model/exercise.model.ts` → `rejectVideo` comprueba tamaño y tipo MIME **antes** de enviar. Evita la transferencia inútil y da un mensaje exacto ("El vídeo pesa 150.0 MB y el máximo son 100 MB").

Es una mejora de UX que haría igualmente, pero hoy también es la única forma de que el usuario sepa qué ha pasado. Si alguien sube desde otro cliente, seguirá viendo el 500.

---

# Petición 3 — Falta `GET /api/foods/categories`

`GET /api/foods` acepta un filtro `category` que se compara por **igualdad exacta**:

```java
// IFoodRepository.search
AND (:category IS NULL OR f.category = :category)
```

Pero **no existe ningún endpoint que devuelva las categorías disponibles**. El catálogo de ejercicios sí lo tiene:

| | Ejercicios | Alimentos |
|---|---|---|
| Búsqueda paginada | `GET /api/catalog-exercises` | `GET /api/foods` |
| Filtro por igualdad exacta | `muscleGroup`, `equipment` | `category` |
| **Endpoint de valores** | `GET /api/catalog-exercises/filters` | **no existe** |

Sin ese listado el filtro es prácticamente inutilizable: un valor tecleado a mano no coincidirá salvo por casualidad exacta, incluida la caja y los acentos.

## Cambio propuesto

Replicar lo que ya hace `ICatalogExerciseRepository`:

```java
// IFoodRepository
@Query("SELECT DISTINCT f.category FROM Food f WHERE f.category IS NOT NULL ORDER BY f.category")
List<String> findDistinctCategories();
```

```java
// FoodController
@Operation(summary = "Categorías disponibles",
           description = "Valores distintos de categoría presentes en el catálogo, "
                       + "para poblar el filtro del frontend.")
@GetMapping("/categories")
public List<String> getCategories() {
    return foodService.getCategories();
}
```

Opcionalmente un `FoodFilterOptionsDTO` por simetría con `CatalogFilterOptionsDTO`, aunque con un solo campo una lista basta.

## Qué hace el frontend mientras tanto

`features/foods/mappers/food.mapper.ts` → `collectCategories` recopila las categorías **de los resultados ya cargados** y las ofrece como chips. Filtra correctamente (los valores vienen de datos reales, así que coinciden), pero no es exhaustivo: solo aparecen las categorías vistas hasta ese momento. La UI lo dice explícitamente bajo el filtro.

Al desplegarse el endpoint, se sustituye `collectCategories` por un `useQuery` con `staleTime: Infinity`, igual que `useCatalogFilters`.

---

# Petición 2 — Anotaciones Swagger de `/api/training-plans` y `/api/nutrition-plans`

> Solo documentación: **el comportamiento del código es correcto y no hay que
> tocarlo.** Lo que está mal son las descripciones de OpenAPI, y describen justo
> lo contrario de lo que ocurre.
>
> **Afecta a los dos controladores.** `NutritionPlanController` arrastra las
> mismas descripciones ("Crea el primer plan nutricional (versión 1)" y "Crea una
> nueva versión del plan nutricional, mantiene historial") y
> `NutritionPlanService` se comporta exactamente igual que el de entrenamiento.
> Los ejemplos siguientes usan entrenamiento; el cambio es idéntico en nutrición.

## Lo que dicen las anotaciones

```java
// TrainingPlanController.java:40
@Operation(summary = "Crear plan de entrenamiento",
           description = "TRAINER. Crea el primer plan (versión 1) para una suscripción.")
@PostMapping

// TrainingPlanController.java:59
@Operation(summary = "Actualizar plan de entrenamiento",
           description = "TRAINER. Crea una nueva versión del plan, mantiene historial.")
@PutMapping("/{planId}")
```

## Lo que hace el código

**`create` (POST)** — `TrainingPlanService.java:49`

```java
trainingPlanRepository.findBySubscriptionIdAndCurrentTrue(req.subscriptionId())
        .ifPresent(old -> { old.setCurrent(false); ... });      // degrada la actual

int nextVersion = trainingPlanRepository
        .findBySubscriptionIdOrderByVersionDesc(req.subscriptionId())
        .stream().findFirst().map(p -> p.getVersion() + 1).orElse(1);   // v = max + 1
...
notificationService.send(studentUserId, NotificationType.PLAN_READY, ...);
```

Es **la operación de versionado**, no "el primer plan": crea la v1 si no hay ninguna y la vN+1 si ya existen. Además notifica al alumno.

**`update` (PUT)** — `TrainingPlanService.java:100`

```java
plan.setTitle(req.title());
plan.setNotes(req.notes());
plan.getDays().clear();
trainingPlanRepository.saveAndFlush(plan);
plan.getDays().addAll(buildDays(req.days(), plan));
trainingPlanRepository.save(plan);
```

Muta la fila existente. **No toca `version` ni `current`, no inserta nada, no genera historial y no notifica.** Es una edición en sitio.

## Por qué importa

Un cliente que siga la documentación usaría `PUT` para publicar cambios al alumno. El resultado sería: el alumno nunca recibe la notificación `PLAN_READY`, y el historial de versiones se queda congelado en la v1 mientras el contenido cambia por debajo — perdiendo justamente lo que el versionado existe para conservar.

## Cambio propuesto

```java
@Operation(summary = "Publicar nueva versión del plan",
           description = "TRAINER. Degrada la versión actual, inserta version + 1 "
                       + "y notifica al alumno. Si no había plan, crea la v1.")
@PostMapping

@Operation(summary = "Editar una versión del plan",
           description = "TRAINER. Reescribe la versión indicada en el sitio: "
                       + "sustituye título, notas y días. No crea versión nueva "
                       + "ni notifica al alumno.")
@PutMapping("/{planId}")
```

Aplicar el mismo texto a `NutritionPlanController`, cambiando "plan" por "plan nutricional".

## Diferencia real entre ambos servicios, no documentada

`TrainingPlanService.create` notifica al alumno:

```java
notificationService.send(studentUserId, NotificationType.PLAN_READY,
        "Plan listo", "Tu entrenador publicó el plan \"" + req.title() + "\".", null);
```

`NutritionPlanService.create` **no envía nada** — el servicio no tiene ni siquiera la dependencia. Publicar un plan nutricional es silencioso para el alumno.

Puede ser intencionado, pero no está escrito en ningún sitio y es asimétrico. Si debiera notificar, es una línea; si no, conviene decirlo en la descripción del endpoint para que los clientes no prometan un aviso que no llega. El frontend, por ahora, no lo promete.

## Nota menor

Tras borrar versiones, los números se reutilizan: `nextVersion` es `max(version) + 1` sobre las que quedan, así que si se elimina la v3 el siguiente `POST` vuelve a crear una v3. No rompe nada, pero un historial puede contener dos v3 en momentos distintos si alguien exporta datos.

---

# Petición 1 — `GET /api/subscriptions/students`

> Un solo método del backend, `SubscriptionService.getActiveByTrainer`, tiene dos
> defectos que bloquean la pantalla principal del panel del entrenador.
> Ambos se arreglan juntos, en el mismo sitio, con unas 20 líneas.
>
> Archivos: `subscription/services/SubscriptionService.java`,
> `subscription/dto/response/SubscriptionResponseDTO.java`,
> `subscription/repository/ISubscriptionRepository.java`

---

## Problema 1 (A1) — La lista de alumnos no incluye a los alumnos

`GET /api/subscriptions/students` devuelve `List<SubscriptionResponseDTO>`:

```java
public record SubscriptionResponseDTO(Long id, Long trainerId, String trainerName,
                                      String trainerImageUrl, SubscriptionPlanResponseDTO plan,
                                      SubscriptionStatus status, Instant startedAt, Instant expiresAt)
```

Está modelado desde la perspectiva del **alumno** — te dice quién es tu *entrenador*. Usado por un entrenador para listar *sus alumnos* devuelve N veces sus propios datos y **cero información de los alumnos**: no hay nombre, ni id de alumno, ni foto.

El dato ya está cargado en el mismo objeto: `Subscription.getStudent().getUserDetail()`. El mapper simplemente no lo lee.

```java
// SubscriptionService.java:430 — actual
private SubscriptionResponseDTO toSubscriptionResponse(Subscription s) {
    return new SubscriptionResponseDTO(s.getId(), s.getTrainer().getId(), s.getTrainer().getFullName(),
            s.getTrainer().getProfileImageUrl(), toPlanResponse(s.getPlan()), s.getStatus(),
            s.getStartedAt(), s.getExpiresAt());
}
```

`toDetailResponse` (línea 404), a cinco líneas de distancia, **sí** lo hace. Solo hay que aplicar el mismo patrón.

---

## Problema 2 — Al pausar una suscripción, el alumno desaparece y no se puede reanudar

```java
// SubscriptionService.java:330
public List<SubscriptionResponseDTO> getActiveByTrainer(Long trainerId) {
    return subscriptionRepository.findByTrainerIdAndStatus(trainerId, SubscriptionStatus.ACTIVE)
            .stream().map(this::toSubscriptionResponse).toList();
}
```

Filtra por `ACTIVE` únicamente. Secuencia completa:

1. El entrenador pausa a un alumno → `PATCH /subscriptions/{id}/pause` → estado `PAUSED`.
2. La lista deja de devolverlo. **No hay ningún endpoint que liste las suscripciones pausadas de un entrenador.**
3. `PATCH /subscriptions/{id}/resume` existe, pero el entrenador ya no tiene forma de descubrir el `subscriptionId`.

Es decir: **pausar es una operación de un solo sentido desde la UI.** El endpoint `resume` es inalcanzable en la práctica.

`GET /api/subscriptions/{id}` sí funciona con suscripciones pausadas (no filtra por estado), así que el dato es accesible — pero solo si ya conoces el id.

El repositorio ya tiene `findByTrainerId(trainerId)` sin filtro (línea 22) y no lo usa ningún controlador.

---

## Problema 3 — N+1 al serializar

`Subscription.student`, `.plan` y `.trainer` son `@ManyToOne(fetch = LAZY)`, y `Student.userDetail` también. Recorrer la lista dispara una consulta por suscripción y por relación. Hoy no se nota porque el mapper no toca `student`; en cuanto lea `getStudent().getUserDetail()` (Problema 1), pasa de 1 consulta a 1 + 3N.

`TrainingPlanService.getStudentPlans` (línea 183) ya tiene exactamente este problema.

---

## Problema 4 — `GET /api/plans/my` no dice qué planes están desactivados

`SubscriptionPlan` tiene el campo (`subscription/model/SubscriptionPlan.java:45`):

```java
@Column(nullable = false)
private boolean active = true;
```

`deactivatePlan` lo pone a `false` (línea 90) y `getMyPlans` usa `findByTrainerId` **sin filtrar** (línea 99), así que los planes desactivados siguen apareciendo. Pero `SubscriptionPlanResponseDTO` **no expone `active`**.

Resultado: tras desactivar un plan, la lista se ve exactamente igual. El entrenador no tiene forma de saber cuáles siguen aceptando altas, y puede pulsar "desactivar" sobre un plan ya desactivado indefinidamente.

**Cambio**: añadir el campo al DTO y rellenarlo en `toPlanResponse`.

```java
public record SubscriptionPlanResponseDTO(Long id, String name, String description, BigDecimal price,
                                          BillingPeriod billingPeriod, Integer maxStudents,
                                          boolean includesNutrition,
                                          boolean active) {}
```

También es aditivo. Alternativamente, `DELETE` podría responder con el plan actualizado en vez de 204, pero exponer el campo es más útil para la lista.

---

## Cambio propuesto

### 1. `SubscriptionResponseDTO` — añadir el alumno (aditivo, retrocompatible)

```java
public record SubscriptionResponseDTO(Long id, Long trainerId, String trainerName, String trainerImageUrl,
                                      SubscriptionPlanResponseDTO plan, SubscriptionStatus status,
                                      Instant startedAt, Instant expiresAt,
                                      StudentSummary student) {

    public record StudentSummary(Long id, String fullName, String profileImageUrl) {}
}
```

Es un campo nuevo: los clientes existentes (app del alumno) lo ignoran. Para los endpoints de alumno viene relleno con sus propios datos, lo cual es redundante pero inofensivo.

> Alternativa si se prefiere separación estricta: un `TrainerStudentResponseDTO` propio para
> `/api/subscriptions/students`. Más limpio conceptualmente, más código, y obliga a tocar el
> controlador. La versión aditiva resuelve el problema con menos superficie.

### 2. `SubscriptionService.toSubscriptionResponse` — rellenarlo

```java
private SubscriptionResponseDTO toSubscriptionResponse(Subscription s) {
    var ud = s.getStudent().getUserDetail();

    return new SubscriptionResponseDTO(s.getId(), s.getTrainer().getId(), s.getTrainer().getFullName(),
            s.getTrainer().getProfileImageUrl(), toPlanResponse(s.getPlan()), s.getStatus(),
            s.getStartedAt(), s.getExpiresAt(),
            new SubscriptionResponseDTO.StudentSummary(
                    s.getStudent().getId(),
                    ud != null ? ud.getFirstName() + " " + ud.getLastName() : null,
                    ud != null ? ud.getPathProfilePicture() : null));
}
```

Idéntico al patrón que ya usa `toDetailResponse`.

### 3. `getActiveByTrainer` — incluir también las pausadas

```java
@Override
@Transactional(readOnly = true)
public List<SubscriptionResponseDTO> getActiveByTrainer(Long trainerId) {
    // ACTIVE y PAUSED: una suscripción pausada sigue siendo un alumno del
    // entrenador y tiene que poder reanudarse. CANCELLED y EXPIRED son
    // terminales y quedan fuera; PENDING_PAYMENT aún no es un alumno.
    var states = List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED);

    return subscriptionRepository.findByTrainerIdAndStatusInWithStudent(trainerId, states)
            .stream().map(this::toSubscriptionResponse).toList();
}
```

El `status` ya viaja en el DTO, así que el frontend puede separar activas de pausadas sin más cambios de contrato.

### 4. `ISubscriptionRepository` — evitar el N+1

```java
@Query("""
       select distinct s from Subscription s
         join fetch s.student st
         left join fetch st.userDetail
         join fetch s.plan
         join fetch s.trainer
        where s.trainer.id = :trainerId
          and s.status in :states
       """)
List<Subscription> findByTrainerIdAndStatusInWithStudent(@Param("trainerId") Long trainerId,
                                                         @Param("states") List<SubscriptionStatus> states);
```

`left join` en `userDetail` porque `toDetailResponse` ya contempla que sea null.

Conviene aplicar la misma consulta en `TrainingPlanService.getStudentPlans` y
`NutritionPlanService.getStudentPlans`, que recorren la misma lista.

---

## Qué desbloquea

| Ahora | Después |
|---|---|
| La lista de alumnos no puede mostrar nombres ni fotos | Se renderiza con una sola llamada |
| El frontend cruza dos endpoints para reconstruir la identidad | Se borra ese cruce (ver más abajo) |
| Pausar oculta al alumno para siempre | Pausar y reanudar son reversibles |
| 1 + 3N consultas al añadir el alumno | 1 consulta |

## Qué hace el frontend mientras tanto

`features/students/api/students.repository.ts` cruza dos endpoints por `subscriptionId`:

- `GET /api/subscriptions/students` → estado, plan, fechas
- `GET /api/training-plans/trainer/students` → `studentFullName`, `studentImageUrl`

Funciona porque **ambos recorren exactamente la misma consulta**
(`findByTrainerIdAndStatus(trainerId, ACTIVE)`), así que devuelven el mismo conjunto de
suscripciones. No es N+1: son dos peticiones en paralelo.

Está aislado en un único método documentado. Cuando este cambio esté desplegado, se borra
la segunda llamada y el `join`, y el repositorio pasa a leer `dto.student` directamente.

Para el Problema 2 el frontend guarda los ids pausados en `localStorage` y los recupera con
`GET /api/subscriptions/{id}` para que el entrenador pueda reanudarlos. Es un parche; se
borra con el mismo cambio.
