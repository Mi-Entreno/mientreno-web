# Plan de integración de endpoints — Trainer Dashboard

> Documento de diagnóstico y roadmap. **No se ha modificado código todavía.**
> Fecha: 2026-07-25 · Backend analizado: `../fitness-backend` (Spring Boot 3.5.7)

---

## 0. Correcciones de premisa (leer primero)

Antes del diagnóstico hay dos supuestos del enunciado que no se sostienen contra el código real. Los corrijo aquí porque cambian el plan entero.

### 0.1 Esto no es React Native / Expo

El directorio de trabajo es un **dashboard web Next.js 16 (App Router) + React 19**, no una app mobile.

| | |
|---|---|
| Framework | `next@16.2.6`, App Router, React 19 |
| Estado servidor | `@tanstack/react-query@5` |
| Formularios | `react-hook-form` + `zod@4` + `@hookform/resolvers` |
| UI | Tailwind v4 + shadcn sobre `@base-ui/react` |
| Middleware | `proxy.ts` (convención Next 16 — **verificado**, `PROXY_FILENAME = 'proxy'` en `next/dist/lib/constants.js`; no es un archivo mal nombrado) |
| Sin dependencias de | React Native, Expo, AsyncStorage, SecureStore, axios |

Sí existen dos proyectos Expo en el monorepo (`../fitness_app`, `../fitness_mobile`), pero son bases de código separadas. **Todo lo que sigue aplica a `trainer-dashboard` como app web.**

Esto tiene una consecuencia arquitectónica grande y positiva: en web con Next tenemos un **BFF (Backend-for-Frontend)** disponible en `app/api/*`. El JWT puede vivir en una cookie `httpOnly` y no tocar nunca el JS del cliente. En React Native no existe esa opción (habría que usar SecureStore + interceptor de Axios). El proyecto ya eligió el patrón BFF, y es la elección correcta — el problema es que la implementación está incompleta.

### 0.2 Endpoints del enunciado que no coinciden con el backend

No inventé contratos; los leí de los controllers. Estas discrepancias son reales:

| Enunciado dice | Backend real | Impacto |
|---|---|---|
| `GET/PUT /api/users/preferences` → "idioma y notificaciones" | `UserPreferencesRequestDTO(OnboardingMode onboardingMode)` — **solo** un enum de onboarding | La UI de preferencias planeada no tiene datos que mostrar |
| `GET /api/foods` → "nombre o marca" | `@RequestParam q, category, page, size` — no hay filtro `brand` | Ajustar filtros de UI |
| `POST /api/trainer/profile/complete` → "completa el perfil" | Devuelve **`AuthResponseDTO` con un JWT nuevo** | Hay que **reemplazar la cookie de sesión** tras completar el perfil, o el claim `profileCompleted` queda obsoleto |
| `GET /api/trainers/{trainerId}/reviews` etc. | Correcto, y es **público** (`permitAll`) | No requiere token |
| `GET /api/files/**` → "analizar antes de producción" | Requiere **autenticación** (`anyRequest().authenticated()`) | Ver §2 C4 — bloquea avatares y videos desde Fase 2, no Fase 11 |

Además, el enunciado ordena `/api/specialties` y los catálogos al final (Fases 7 y 10), pero **son dependencias duras de fases anteriores**. Detalle y reordenamiento justificado en §5.

---

## 0.3 Estado: FASE 0 COMPLETADA (2026-07-25)

`pnpm verify` (typecheck + lint + 59 tests) y `pnpm build` en verde, más 18/18 comprobaciones end-to-end contra un backend simulado con los contratos reales.

**Resuelto**

| Id | Problema | Solución |
|---|---|---|
| C1 | Login leía `token`/`role`/`profileCompleted`, inexistentes | Lee `jwt`/`refreshToken`; rol y perfil se derivan de los claims (`server/jwt.ts`) |
| C2 | Todo 204 se convertía en 500 | `new NextResponse(null, …)` para estados null-body (`server/upstream.ts`) |
| C3 | Refresh token descartado; sesión de 30 min | Sesión con ambos tokens + refresh proactivo con deduplicación |
| C4 | Multipart y binario corrompidos; avatares 401 | Passthrough por streams + `app/api/media/[...path]` + `core/http/media.ts` |
| A2 | Sin modelo de paginación | `PageResponse<T>` + `mapPage` (`core/http/pagination.ts`) |
| A4 | Modo mock con contratos inventados | `lib/mock-api.ts`, `lib/mock-data.ts` y 6 PNG eliminados |
| A5 | Las 2 formas de error del backend sin normalizar | `NormalizedError` + `ApiError` (`core/http/errors.ts`) |
| M1 | `/auth/session` mentía (valores fijos) | Deriva de los claims reales |
| M2 | Sin guard de rol | `proxy.ts` exige `ROLE_TRAINER` y perfil completo |
| M3 | URL del backend en el bundle cliente | `API_URL` server-only, validada con Zod |
| M4 | Claves de React Query sueltas | Fábrica tipada `qk` (`core/http/query-keys.ts`) |
| B1/B3 | `allIcon` muerto, `generator: v0.app` | Eliminados |

**Hallazgo nuevo durante la verificación e2e — rotación de refresh token**

Deduplicar solo el refresh *en vuelo* no bastaba. Una petición que arranca justo después de que el primer refresh resuelve todavía lleva la cookie vieja (el `Set-Cookie` aún no ha llegado al navegador) y redime un token que el backend ya quemó → 401 y sesión muerta. El test unitario no lo detectó porque todos sus llamantes entraban antes de que resolviera el fetch; el e2e con 8 peticiones en paralelo dio 3 refreshes en vez de 1.

Corregido con una caché de rotaciones recientes (30 s) en `server/upstream.ts`, con test de regresión para el caso secuencial.

**Decisiones tomadas**

- **Estructura sin `src/`**: `core/` y `server/` en la raíz, junto a `app/`, `components/` y `lib/`. Mover `app/` dentro de `src/` era churn sin beneficio; el plan de §3.2 se mantiene por lo demás.
- **Cookie sin cifrar**: guarda solo `{accessToken, refreshToken}`; todo lo demás (rol, userId, `profileCompleted`, expiración) se deriva decodificando el JWT. Evita duplicar claims que se desincronizan en cada refresh y elimina la necesidad de un secreto adicional. El JWT lo firma el backend, así que no se puede editar para que diga algo que el backend acepte.
- **Sin verificación de firma en el BFF**: requeriría la clave HMAC del backend. Los claims solo deciden routing de UI; el backend verifica en cada llamada.

**Consecuencia a tener en cuenta**

Al eliminar el modo demo, el dashboard **requiere backend levantado** (`API_URL`). Y como `lib/types.ts` sigue sin coincidir con los DTOs (C5, pendiente de Fases 2–3), las pantallas ya conectadas mostrarán huecos contra datos reales. Es el estado honesto: antes "funcionaba" solo porque los mocks devolvían las formas inventadas.

**Pendiente de Fase 1**: las 4 pantallas de auth (registro, OTP, recuperación en 2 pasos) y sus 7 endpoints. `login`, `logout` y `refresh` ya están operativos.

---

## 0.4 Estado: FASE 2 COMPLETADA (2026-07-25)

`pnpm verify` (typecheck + lint + **97 tests**) y `pnpm build` en verde, más 17/17 comprobaciones e2e de los flujos que tocan la sesión.

> Fase 1 **saltada por decisión del usuario**. No bloquea: login, logout y refresh ya funcionaban desde la Fase 0. Quedan pendientes las pantallas de registro, OTP y recuperación de contraseña.

**Los 11 endpoints de la fase, implementados**

`GET/PUT/POST /api/user-detail` · `GET/PUT /api/users/preferences` · `POST /api/trainer/profile/complete` · `GET/PUT /api/trainer/profile` · `GET /api/specialties` · `GET /api/specialties/search` · `DELETE /api/account`

**Estructura entregada**

```
core/format/date.ts              conversión ISO ↔ dd-MM-yyyy
features/specialties/            dto · model · mapper · repo · hooks · SpecialtyMultiSelect
features/user/                   dto · model · mapper · repo · hooks · PersonalDataForm · PreferencesCard
features/trainer-profile/        dto · model · mapper · repo · hooks · formulario · pantalla
features/account/                repo · hook · DeleteAccountCard
components/shared/               OptionGroup · ImageUrlField
app/auth/complete-profile/   ruta BFF que reemplaza el JWT (A3)
app/api/account/                 ruta BFF que derriba la sesión local
app/dashboard/settings/          pantalla nueva
```

**Hallazgos nuevos leyendo el backend**

| # | Hallazgo | Cómo se maneja |
|---|---|---|
| 1 | **Dos formatos de fecha para el mismo campo.** No hay configuración global de Jackson, así que `@JsonFormat` decide por campo: `GET /api/user-detail` devuelve `birthDate` en ISO, pero `PUT`/`POST /api/user-detail` lo exigen en `dd-MM-yyyy`, mientras `POST /trainer/profile/complete` lo quiere en ISO. Enviar el formato equivocado es un 400. | `core/format/date.ts`, con transformaciones de string (no `Date`, que desplazaría el día por zona horaria) |
| 2 | **Especialidades asimétricas.** La respuesta del perfil las lista como **nombres**; ambos endpoints de escritura toman **ids**. Resolver requiere el catálogo. | `resolveSpecialtyIds`, insensible a mayúsculas y tildes, descartando nombres que ya no existen |
| 3 | **No existe endpoint de subida de archivos.** El único `MultipartFile` en todo el backend es el de videos de ejercicios. `profileImageUrl` y `pathProfilePicture` son columnas `String`. | `ImageUrlField` acepta una URL con previsualización, y lo dice explícitamente. **Un uploader real necesita primero un endpoint genérico en el backend.** |
| 4 | **`/api/specialties` devuelve la entidad JPA**, no un DTO: expone `createdAt`, `updatedAt`, `deletedAt`. | El mapper los descarta |
| 5 | **Ida y vuelta de imágenes.** Si se lee la URL proxificada y se reescribe tal cual, se destruye la ruta original almacenada. | El modelo separa `avatarUrl` (mostrar) de `avatarPath` (escribir); hay test que lo fija |
| 6 | **`UserProfileUpdateRequestDTO` no tiene `email` ni `phone`.** | Se muestran como solo lectura, con la razón visible en la UI |
| 7 | **`POST /api/user-detail` exige 10 campos `@NotBlank`**, incluidos `city` y `bio`, que ni siquiera aparecen en el DTO de respuesta. | Implementado en el repositorio pero **sin pantalla**: `POST /complete` ya crea el user detail del entrenador y además devuelve el JWT nuevo. Duplicarlo sería un segundo camino más débil al mismo estado |
| 8 | **Preferencias confirmadas**: solo `onboardingMode` (`OWN_PLAN \| TRAINER_SEARCH`). No hay idioma ni notificaciones | La UI refleja exactamente eso |
| 9 | `gender` es un `String` sin restricción. La app Expo ya escribe `male \| female \| other \| prefer_not_say` | Se reutilizan esos valores para no divergir en la misma columna |

**A3 resuelto y verificado end-to-end.** `POST /api/trainer/profile/complete` devuelve un `AuthResponseDTO` con un JWT nuevo cuyo claim `profileCompleted` pasa a `true`. Va por una ruta BFF propia que reemplaza la cookie; por el proxy genérico ese token llegaría a JS del cliente y se perdería, dejando al entrenador atrapado en el onboarding. Verificado: la cookie antes dice `false`, después `true`, y el guard deja de redirigir.

**C5 parcialmente cerrado.** `TrainerProfile` y `Specialty` salen de `lib/types.ts` y pasan a sus features con DTO + mapper. Siguen pendientes de Fases 3–5: `StudentSubscription`, `TrainingPlan`, `NutritionPlan`, `PlanVersion`, `ProgressEntry`.

**Deuda conocida que se arrastra**

- `/dashboard/students`, `/dashboard/training-plans` y `/dashboard/nutrition-plans` siguen con tipos inventados o arrays hardcodeados. Fases 3–5.
- Sin subida de avatar hasta que exista endpoint (hallazgo 3).
- La reagrupación de navegación de §6.7 sigue pendiente: Ajustes vive en el menú del avatar, no en la navegación principal, para no pasar de 6 entradas.

---

## 0.5 Estado: FASE 1 COMPLETADA (2026-07-25)

`pnpm verify` (typecheck + lint + **117 tests**) y `pnpm build` en verde, más **24/24** comprobaciones e2e de los flujos de autenticación.

Con esto los 9 endpoints de la fase quedan cubiertos: `login`, `refresh` y `logout` desde la Fase 0; `trainer/register`, `register/resend-otp`, `register/verify-otp` y los tres de `password-reset` ahora.

**Pantallas nuevas**

`/register` · `/verify-otp` · `/forgot-password` (3 pasos: solicitar → verificar → confirmar). `/login` se reescribe sobre el mismo marco y enlaza con las tres.

```
features/auth/
  dto/auth.dto.ts            contratos + constantes del backend (6 dígitos, 10 min, 60 s)
  model/password.ts          reglas de contraseña espejo del @Pattern de Java
  api/auth.repository.ts
  hooks/                     use-auth-actions · use-resend-cooldown
  components/                AuthShell · PasswordField · OtpInput · 4 formularios
app/auth/public/[action]/ passthrough con allowlist para los endpoints permitAll
app/auth/register/        registro + envío del primer OTP
```

### 🔴 Hallazgo importante: `registerTrainer` nunca envía el código de verificación

`UserDetailsServiceAuth.registerStudent` llama a `emailVerificationService.sendVerificationCode(newUser)` antes de responder (línea 109). **`registerTrainer` no lo hace** (líneas 132–144): guarda el usuario y devuelve `AuthResponseDTO.noToken(...)` sin más.

Consecuencia real: un entrenador se registra, queda con `accountVerified: false`, y **no le llega ningún correo**. Por el camino feliz la cuenta no se puede verificar nunca; la única fuente de un primer código es `POST /auth/register/resend-otp`.

**Mitigación**: `app/auth/register/route.ts` encadena esa llamada tras un registro correcto y devuelve `verificationCodeSent` para que la UI diga la verdad si falla. Verificado e2e: el backend recibe las dos llamadas.

**La corrección correcta es en el backend** — que `registerTrainer` envíe el código como hace `registerStudent`. Cuando se haga, hay que quitar el encadenado.

**Otros hallazgos**

| # | Hallazgo | Cómo se maneja |
|---|---|---|
| 1 | **El registro no devuelve tokens.** `AuthResponseDTO.noToken(...)`, mensaje "Por favor iniciá sesión" | No hay auto-login: registro → verificación → login |
| 2 | **El reset acepta contraseñas más débiles que el registro.** `ResetPasswordDTO.newPassword` solo lleva `@Size(min = 8)`; falta el `@Pattern` de mayúscula + dígito que sí exige el alta | El frontend aplica las reglas del registro a ambos. Permitir lo contrario dejaría degradar la propia cuenta por debajo de la política; parece un descuido, no una intención |
| 3 | **`PasswordResetRequestDTO.method`** está restringido al literal `"email"` (SMS fue retirado) | Se envía `"email"` explícito |
| 4 | **`requestPasswordReset` responde igual para emails desconocidos** — protección contra enumeración de cuentas | La UI dice "Si la cuenta existe, recibirás un código", nunca "te hemos enviado" |
| 5 | **`verifyResetCode` no consume el token** (`resetPassword` lo revalida) | Por eso el flujo puede ser de 3 pasos: se comprueba el código antes de pedir contraseña nueva |
| 6 | **Constantes del OTP**: 6 dígitos (`%06d`), caduca a los 10 min, cooldown de reenvío 60 s, 5 intentos | Espejadas en `auth.dto.ts` para que la UI se explique con datos reales |
| 7 | El 429 de reenvío nombra los segundos exactos que faltan | `startFromMessage` los lee, así el contador local no se desincroniza del servidor |
| 8 | `loginUser` **no bloquea** cuentas sin verificar: emite tokens igualmente | Login enruta a `/verify-otp`, y el guard **excluye** esa ruta de la redirección de "ya autenticado" — si no, la cuenta sería imposible de verificar |

**Nota de implementación**: el contador de reenvío se reescribió a base de *deadline* + intervalo en lugar de decrementar un contador con `setTimeout` encadenado. Los navegadores estrangulan los timers en pestañas de fondo, y un contador que decrementa por tick mostraría ~55 s restantes tras volver de otra pestaña. Hay test que lo fija.

**Seguridad de la ruta pública**: `app/auth/public/[action]` resuelve la ruta upstream contra una **allowlist fija**, nunca desde la URL, para que un cliente no pueda dirigir el handler a un endpoint arbitrario del backend. Verificado con una acción desconocida y con una ruta inyectada.

---

## 0.6 Estado: FASE 3 COMPLETADA (2026-07-25)

`pnpm verify` (typecheck + lint + **144 tests**) y `pnpm build` en verde, más **25/25** comprobaciones e2e.

Endpoints: `POST/PUT/DELETE /api/plans` · `GET /api/plans/my` · `GET /api/subscriptions/students` · `PATCH .../pause` · `.../resume` · `GET /api/subscriptions/{id}`.

**Cambios de UI**

- `/dashboard/plans` deja de ser un placeholder: CRUD completo de planes comerciales.
- `/dashboard/students` reescrita contra los contratos reales.
- **`/dashboard/students/[subscriptionId]` nueva.** Sustituye al drawer, que disparaba 6 consultas al abrirse, no era enlazable y no sobrevivía a un refresh. Pestañas Resumen / Entrenamiento / Nutrición / Progreso, con las tres últimas señalando su fase.

**C5 cerrado del todo.** `lib/hooks.ts` y `lib/types.ts` **eliminados**. Ya no queda ningún tipo inventado en el proyecto: las fases 4 y 5 construirán los suyos desde los DTO reales.

**Hallazgos nuevos** — los tres van a `docs/BACKEND_CHANGE_REQUEST.md` con parche concreto.

| # | Hallazgo | Estado |
|---|---|---|
| A1 | `SubscriptionResponseDTO` no lleva al alumno. El dato está cargado (`Subscription.getStudent().getUserDetail()`); el mapper no lo lee. `toDetailResponse`, cinco líneas más abajo, **sí** lo hace | Mitigado en frontend |
| **Nuevo** | **Pausar es irreversible desde la UI.** `getActiveByTrainer` filtra a `ACTIVE`, y no hay ningún endpoint que liste las pausadas de un entrenador → tras pausar, el `subscriptionId` es indescubrible y `PATCH /resume` queda inalcanzable | Mitigado en frontend |
| **Nuevo** | **`GET /api/plans/my` no dice qué planes están desactivados.** La entidad tiene `active`, `deactivatePlan` lo pone a false y `getMyPlans` no filtra — pero el DTO no expone el campo. Tras desactivar, la lista se ve idéntica | **Sin mitigación posible**: el dato no existe en la respuesta |
| **Nuevo** | Riesgo de N+1: `student`, `plan` y `trainer` son `LAZY`. En cuanto el mapper lea el alumno, pasa de 1 consulta a 1+3N | Incluida la consulta con `join fetch` en la propuesta |

También confirmados dos desajustes de enum: `BillingPeriod` es `YEARLY`, no `ANNUAL`; y `SubscriptionStatus` tiene **cinco** valores (faltaban `PENDING_PAYMENT` y `CANCELLED`).

**Mitigaciones, y cómo se borran**

1. **Identidad del alumno** — `students.repository.list()` cruza `/api/subscriptions/students` con `/api/training-plans/trainer/students` por `subscriptionId`. Funciona porque **ambos recorren la misma consulta** (`findByTrainerIdAndStatus(trainerId, ACTIVE)`), verificado en el código: no es N+1, son dos peticiones en paralelo. `toStudentSubscription` ya prefiere `dto.student` si existe, así que al desplegarse el cambio basta con borrar la segunda llamada.
2. **Pausadas invisibles** — `paused-store.ts` guarda los ids en `localStorage` y los recupera con el endpoint de detalle, que no filtra por estado. Se borra el archivo entero cuando el roster incluya `PAUSED`.

Ambas están aisladas en un único sitio y marcadas en el código con referencia al documento.

**Nota de implementación**: el store de pausadas se escribió como *external store* con `useSyncExternalStore` en vez de sembrar estado con `useEffect`. Leer `localStorage` en un efecto obliga a un `setState` en cada montaje — render en cascada y error de lint. De paso, la suscripción al evento `storage` mantiene coherentes dos pestañas abiertas.

---

## 0.7 Estado: FASE 4 COMPLETADA (2026-07-25)

`pnpm verify` (typecheck + lint + **156 tests**) y `pnpm build` en verde, más **20/20** comprobaciones e2e.

> Recordatorio de numeración: en este roadmap la fase 4 es el **catálogo de ejercicios**, adelantado desde la fase 7 del enunciado original porque el editor de planes lo necesita (§4, corrección 2). Los planes de entrenamiento son la fase 5.

**Endpoints**: `GET /api/catalog-exercises` (`search`, `muscleGroup`, `equipment`, `page`, `size`) · `/filters` · `/{id}`.

**Entregado**

```
features/catalog-exercises/   dto · model · mapper · repo · hooks · 5 componentes
core/hooks/use-debounced-value.ts
app/dashboard/exercises/      navegador del catálogo (pantalla nueva)
```

- **`ExercisePicker`** — el componente que consume la fase 5. Ofrece el catálogo como vía principal y el ejercicio libre como escape, no al revés: `CreateTrainingPlanRequestDTO.ExerciseRequest` documenta que enviar `catalogExerciseId` permite al backend vincular la ficha y heredar título, grupo muscular e instrucciones.
- **Primer consumidor real de `PageResponse<T>`** (construido en la fase 0), con `useInfiniteQuery`.
- Pantalla propia en `/dashboard/exercises`: un entrenador necesita consultar el catálogo sin abrir un plan.

**Semántica del backend que condiciona la UI**

| Detalle leído del código | Consecuencia |
|---|---|
| `ICatalogExerciseRepository.search` filtra con `ce.muscleGroup = :muscleGroup` y `ce.equipment = :equipment` — **igualdad exacta** | Los filtros son *chips* con los valores de `/filters`, no campos de texto. Un valor tecleado o con otra caja no coincidiría con nada. Verificado e2e: `muscleGroup=chest` devuelve 0 resultados |
| `search` se convierte en `%texto%` en minúsculas contra el título | Búsqueda parcial e insensible a mayúsculas, solo sobre el título |
| `Math.clamp(size, 1, 200)` y `Sort.by("title").ascending()` | Página de 24 y orden alfabético garantizado por el servidor |
| `instructions` es texto libre del importador, con saltos de línea | Se renderiza con `whitespace-pre-line`; verificado que el proxy conserva el `\n` escapado |
| `secondaryMuscles` puede traer duplicados y blancos | El mapper los limpia |

**Nota de tests**: la fase estrena **MSW**, instalado en la fase 0 y hasta ahora sin usar. El test del repositorio recorre la cadena completa — `apiFetch` → URL del BFF → página de Spring → `PageResponse` — y fija que los filtros vacíos se omiten de la query en vez de enviarse en blanco.

---

## 0.8 Estado: FASE 5 COMPLETADA (2026-07-25)

`pnpm verify` (typecheck + lint + **170 tests**) y `pnpm build` en verde, más **25/25** comprobaciones e2e.

Endpoints: `POST /api/training-plans` · `PUT /{planId}` · `DELETE /{planId}` · `GET /subscription/{id}/current` · `/history` · `GET /trainer/students`.

### 🔴 Hallazgo principal: la documentación describe el versionado al revés

Las anotaciones Swagger dicen que `POST` "crea el primer plan (versión 1)" y que `PUT` "crea una nueva versión del plan, mantiene historial". Leyendo `TrainingPlanService`, **es exactamente al contrario**:

| | Anotación | Código real |
|---|---|---|
| `POST` | "crea el primer plan (versión 1)" | Degrada la actual, inserta `version + 1`, **notifica al alumno**. Es *la* operación de versionado |
| `PUT` | "crea una nueva versión, mantiene historial" | Muta la fila existente. **No toca `version` ni `current`, no genera historial, no notifica** |

Si la UI hubiera seguido la documentación, publicar cambios con `PUT` habría dejado al alumno **sin notificación** y el historial congelado en la v1 mientras el contenido cambiaba por debajo.

Verificado e2e: tras un `PUT`, el id y la versión no cambian, el historial sigue teniendo una sola entrada y no se emite `PLAN_READY`. Tras un `POST`, aparece la v2 y la v1 deja de ser `current`.

Petición de cambio (solo documentación, el código está bien) en `docs/BACKEND_CHANGE_REQUEST.md`, petición 2.

**Consecuencia de diseño**: el editor tiene **dos acciones de guardado**, no una.

- **Publicar nueva versión** (`POST`) — crea vN+1 y avisa al alumno.
- **Guardar cambios en vN** (`PUT`) — corrige la versión abierta sin notificar.

Esto corrige también §6.3 de este documento, que asumía la semántica documentada.

**Otras reglas del backend que condicionan la UI**

| Regla | Dónde | Efecto en la UI |
|---|---|---|
| `buildDays` ignora los ejercicios si `restDay` es `true` | `TrainingPlanService:325` | Al marcar descanso, el editor lo dice y el mapper no los envía |
| `resolveExerciseName` exige `name` **o** `catalogExerciseId`, y con solo el id copia el título del catálogo | `:377` | Validación cliente equivalente; el picker prioriza el catálogo |
| `WeightUnit.valueOf(...toUpperCase())` | `:322` | Selector cerrado a `KG`/`LB`/`BODYWEIGHT`; cualquier otra cosa sería un 400 |
| Un `catalogExerciseId` inexistente lanza 404 | `:365` | Los ids salen siempre del picker |
| `getCurrentBySubscription` lanza 404 si no hay plan | `:157` | El repositorio lo mapea a `null`: "sin plan" es un estado normal |
| `muscleGroup` y `equipment` se leen del catálogo vinculado | `toResponse` | Un ejercicio libre no los tiene — el editor lo marca con "Sin catálogo" |
| Los nombres se truncan a 150 caracteres | `truncateName` | — |

**Detalle de implementación**: `mediaUrl` se lee y se reenvía sin tocar en cada edición. Como `PUT` borra y reconstruye los días, no reenviarlo desvincularía el vídeo que la fase 8 asocie al ejercicio. Hay test que lo fija.

**Cambios de UI**

- `/dashboard/training-plans` deja de ser un grid con datos falsos y pasa a ser la **vista consolidada** (`GET /trainer/students`), separando "pendientes de asignar" de "con plan". El botón "Nuevo plan" anterior no podía funcionar: `subscriptionId` es `@NotNull`, un plan no existe sin alumno.
- La pestaña **Entrenamiento** del detalle del alumno ya es real: versión actual, historial navegable, editor y borrado por versión.
- `components/plans/training-plan-form-sheet.tsx` (612 líneas sin cablear) **eliminado**.

---

## 0.9 Estado: FASE 6 COMPLETADA (2026-07-25)

`pnpm verify` (typecheck + lint + **185 tests**) y `pnpm build` en verde, más **21/21** comprobaciones e2e.

Endpoints: `GET /api/foods` (`q`, `category`, paginado) · `GET /api/foods/{id}`.

**Entregado**

```
features/foods/          dto · model · mapper · repo · hooks · 5 componentes
app/dashboard/foods/     navegador del catálogo (pantalla nueva)
```

- **`FoodPicker`** — el componente que consume la fase 7.
- Pantalla propia, simétrica a la del catálogo de ejercicios.

**Hallazgos**

| # | Hallazgo | Cómo se maneja |
|---|---|---|
| 1 | **No existe endpoint de categorías.** `category` se compara con `=`, pero el catálogo de alimentos no tiene equivalente de `/api/catalog-exercises/filters`, así que el filtro carece de fuente de valores válidos | `collectCategories` las recopila de los resultados ya cargados. Filtra bien (vienen de datos reales) pero no es exhaustivo, y la UI lo dice. Petición 3 en `BACKEND_CHANGE_REQUEST.md` |
| 2 | `q` busca en **nombre Y marca** (`LOWER(f.name) LIKE :p OR LOWER(COALESCE(f.brand,'')) LIKE :p`) | Un solo campo de búsqueda cubre ambos; el placeholder lo indica. Verificado e2e: un término presente en el nombre de un alimento y en la marca de otro devuelve los dos |
| 3 | La paginación va por el `Pageable` de Spring (`@PageableDefault(size = 20, sort = "name")`), no por `@RequestParam` explícitos como en ejercicios | Mismos parámetros `page`/`size` en el cable; no se envía `sort` porque el orden por nombre ya es el default |
| 4 | **Los macros son nullables y están siempre por 100 g**, independientemente de lo que diga `servingDescription` | `null` se muestra como "—", nunca como 0: un 0 g de carbohidratos es una medición, un `null` es un hueco del importador. Hay test que lo fija |
| 5 | **Los planes de nutrición no enlazan con el catálogo.** `MealFoodRequest` es `(foodName, quantity, unit)` — no hay `foodId`, a diferencia de `catalogExerciseId` en los ejercicios | El picker solo aporta el **nombre** y los **macros calculados**; su valor para la fase 7 es rellenar `calories`/`proteinG`/`carbsG`/`fatG` de la comida en vez de que el entrenador los sume a mano |

**`scaleMacros`** escala los valores por 100 g a la cantidad indicada, pero **solo en gramos**: `servingDescription` es texto libre sin parsear, así que no hay factor para convertir "1 taza". Con otras unidades la UI lo dice y deja los macros a mano.

**Navegación reagrupada.** Con los dos catálogos, la barra lateral había llegado a 8 entradas. Aplicada la reagrupación pendiente de §6.7: "Mi perfil" sale del menú principal (sigue en el menú del avatar, junto a "Ajustes") y los catálogos pasan a una sección "Catálogos" separada. Quedan 5 entradas de trabajo + 2 de referencia.

---

## 0.10 Estado: FASE 7 COMPLETADA (2026-07-25)

`pnpm verify` (typecheck + lint + **200 tests**) y `pnpm build` en verde, más **24/24** comprobaciones e2e.

Endpoints: `POST /api/nutrition-plans` · `PUT /{planId}` · `DELETE /{planId}` · `GET /subscription/{id}/current` · `/history` · `GET /trainer/students`.

**Confirmado lo que quedó pendiente de la fase 5**: `NutritionPlanController` arrastra **las mismas anotaciones Swagger incorrectas**, y `NutritionPlanService` se comporta igual que el de entrenamiento — `POST` versiona, `PUT` edita en sitio. La petición 2 del change request cubre ahora ambos controladores.

**Diferencia real entre ambos servicios, no documentada**

`TrainingPlanService.create` envía `NotificationType.PLAN_READY` al alumno. `NutritionPlanService.create` **no envía nada** — el servicio ni siquiera tiene la dependencia inyectada. Publicar un plan nutricional es silencioso.

Verificado e2e. La UI lo refleja: el editor de entrenamiento dice "avisa al alumno", el de nutrición no lo promete, y el toast tampoco.

**Otras reglas del backend**

| Regla | Efecto en la UI |
|---|---|
| **El plan no tiene macros propios.** `NutritionPlanResponseDTO` no lleva calorías ni macros; solo `MealResponse` | `sumMealMacros` calcula el total diario sumando comidas, y avisa cuando alguna no aporta calorías para que el total no parezca definitivo |
| `MealRequest.name` es `@NotBlank` y `timeOfDay` `@NotNull` | Validación cliente equivalente; el selector está cerrado a los 7 valores del enum |
| `MealFoodRequest` exige los tres campos (`foodName`, `quantity`, `unit`) | Las filas sin nombre se descartan en el mapper: enviarlas haría fallar la validación del plan entero |
| **`includesNutrition` del plan comercial nunca se comprueba** al crear un plan nutricional | Es un aviso en la pestaña, no un bloqueo — el backend lo permite |

**El valor del catálogo de alimentos aquí**

Como `MealFoodRequest` no tiene `foodId`, elegir del catálogo solo aporta el nombre. Su utilidad real es el botón **"Calcular desde los alimentos"**: suma los macros escalados de los alimentos añadidos en la sesión y rellena `calories`/`proteinG`/`carbsG`/`fatG` de la comida.

La limitación es honesta y está dicha en la UI: como el backend no guarda macros por alimento, un plan recargado desde la API no tiene base para calcular hasta que se vuelvan a elegir los alimentos desde el catálogo.

**Cambios de UI**

- `/dashboard/nutrition-plans` pasa a ser la vista consolidada, como su gemela de entrenamiento.
- La pestaña **Nutrición** del detalle del alumno ya es real.
- `components/plans/nutrition-plan-form-sheet.tsx` (475 líneas sin cablear) **eliminado**. Con esto desaparece el directorio `components/plans/` entero.

---

## 0.11 Estado: FASE 8 COMPLETADA (2026-07-25)

`pnpm verify` (typecheck + lint + **217 tests**) y `pnpm build` en verde, más **18/18** comprobaciones e2e.

Endpoints: `GET /api/exercises/{id}` · `POST /{id}/videos` (multipart) · `DELETE /{id}/videos/{videoId}` · `GET /{id}/videos`.

### El arreglo C4 de la fase 0, validado con datos reales

Esta fase es el primer consumidor del passthrough multipart y binario construido en la fase 0. La verificación e2e sube **5 MB de bytes aleatorios** y compara checksums:

| Comprobación | Resultado |
|---|---|
| SHA-256 tras subir a través del proxy | **idéntico** al local |
| SHA-256 tras descargar por `/api/media` | **idéntico** al local |
| Tamaño en ambos sentidos | 5.242.880 bytes exactos |
| `Range: bytes=0-1023` | 206 + `Content-Range` + trozo idéntico al original |
| Boundary, nombre de archivo y `Content-Type` de la parte | conservados |

El proxy que había antes de la fase 0 (`await req.text()` + `Content-Type: application/json` forzado) habría corrompido las tres cosas.

**Hallazgos**

| # | Hallazgo | Cómo se maneja |
|---|---|---|
| 1 | **Un vídeo de más de 100 MB devuelve 500, no 413.** El límite lo impone `spring.servlet.multipart.max-file-size`; `MaxUploadSizeExceededException` solo llega al `@ExceptionHandler(Exception.class)` genérico | `rejectVideo` comprueba el tamaño antes de enviar, con mensaje exacto. Evita transferir 100 MB para nada. Petición 4 del change request |
| 2 | La validación es sobre `file.getContentType()`, es decir el MIME que pone el navegador — **no la extensión** | Se valida contra la misma lista de 5 tipos. El `accept` del input es una pista; `rejectVideo` es la comprobación real |
| 3 | **Subir un vídeo sobrescribe `exercise.mediaUrl`** con el nuevo | Confirma que preservar `mediaUrl` en el round-trip del editor (fase 5) era necesario: sin ello, editar el plan tras subir un vídeo lo desvincularía |
| 4 | **Borrar solo limpia `mediaUrl` si coincide** con el vídeo borrado | La UI marca cuál es "visible para el alumno" y el diálogo de confirmación dice qué pasará en cada caso. Verificado e2e en ambos sentidos |
| 5 | El listado viene `ORDER BY createdAt DESC` | El primero de la lista es el activo |

**Notas de implementación**

- La subida usa **`XMLHttpRequest`, no `fetch`**: fetch no reporta progreso de *subida*, y 100 MB sin feedback es indistinguible de un cuelgue.
- La gestión de vídeos cuelga de la **vista del plan, no del editor**: los ejercicios solo tienen `id` una vez guardado el plan, y las filas de un borrador no lo tienen.
- El `<video>` reproduce desde `/api/media/**`, que reenvía las peticiones `Range` — por eso el seek funciona.

---

## 0.12 Estado: FASE 9 COMPLETADA (2026-07-28)

`pnpm verify` (typecheck + lint + **242 tests**) y `pnpm build` en verde, más **13/13** comprobaciones e2e.

Endpoints: `GET /api/progress/subscription/{id}` · `GET /api/progress/{progressId}` · `GET /api/workout-sessions/{sessionId}`.

**La pestaña Progreso** del detalle del alumno ya es real: selector de medida, gráfico de evolución, resumen de variación y el historial completo en tabla. Con esto las cuatro pestañas del alumno están terminadas.

### 🔴 Hallazgo: el entrenador no puede descubrir ninguna sesión

`GET /api/workout-sessions/{sessionId}` **sí** permite al entrenador leer una sesión — `resolveProfileId` devuelve el trainer y `checkReadAccess` lo acepta. Pero:

- `GET /api/workout-sessions/my` es `@PreAuthorize("hasRole('STUDENT')")`.
- `IWorkoutSessionRepository` solo consulta por `studentId`.
- **No existe ningún listado para el entrenador.**

Mismo patrón que las suscripciones pausadas de la fase 3: el detalle funciona, pero nada expone los ids, así que el endpoint es inalcanzable en la práctica.

`features/workout-sessions/` queda **completo** (repositorio, hook, hoja con series agrupadas, volumen total y feedback) y se abre con `?session=<id>`, listo para el día que exista una fuente de ids. **No inventé un buscador por ID**: un entrenador nunca tendrá ese número a mano y sería atrezo. Petición 5 del change request.

**Decisiones sobre los datos**

| Regla | Efecto |
|---|---|
| Todas las medidas son nullable — el alumno anota lo que midió ese día | Las entradas sin esa medida se **omiten de la serie**, no se dibujan como 0. Un cero sería un acantilado que nunca ocurrió |
| El selector solo ofrece medidas que algún registro tiene | `availableMeasures`, en vez de siete pestañas de las que cinco están vacías |
| `totalVolume` necesita peso **y** repeticiones | Devuelve `null` si ninguna serie tiene ambos, en vez de un 0 engañoso |
| `trainingDay` de una sesión es nullable | Borrar una versión de plan elimina sus días, pero las sesiones sobreviven; el mapper lo contempla |

### Sobre el gráfico

Seguí el procedimiento de la guía de visualización, en orden:

1. **Forma**: tendencia temporal, **una sola serie** → línea, sin caja de leyenda (el encabezado ya dice qué se plotea).
2. **Color**: en lugar de importar una paleta ajena, usé el verde del propio sistema de diseño (`--primary-text`, `#0b7a5d`).
3. **Validado con el script**, no a ojo: pasa banda de luminosidad, suelo de croma y contraste ≥3:1 sobre la superficie de tarjeta.
4. **Marcas**: línea de 2px con extremos redondeados, marcador final de 9px con anillo de 2px del color de superficie, rejilla de 1px sólida y recesiva, **una sola etiqueta directa** (el punto final).
5. **Capa de hover**: retícula vertical que engancha al punto más cercano en X, más soporte de teclado con flechas.
6. **Accesibilidad**: la tabla de historial es la ruta accesible a todos los valores; el texto usa tokens de texto, nunca el color de la serie.

**Light-only a propósito**: la app declara `colorScheme: 'light'` y no tiene tokens oscuros, así que enviar pasos oscuros sería enviar algo que nunca se renderiza.

El paso 7 pide renderizar y mirar. Sin navegador headless disponible (Arc se cuelga en `--headless`), lo sustituí por **comprobaciones de geometría sobre el SVG que produce el componente real**: puntos dentro de la caja de trazado, la etiqueta final cabe en el `viewBox`, las etiquetas del eje caben en su margen, una sola etiqueta de valor, y los casos límite (un solo punto, serie plana). Cubre desbordes y colisiones; **no cubre el juicio estético**, que queda pendiente de una revisión visual.

---

## 0.13 Estado: FASE 10 COMPLETADA (2026-07-28)

`pnpm verify` (typecheck + lint + **258 tests**) y `pnpm build` en verde, más **19/19** comprobaciones e2e.

Endpoints: `GET /api/notifications` · `/unread-count` · `PATCH /{id}/read` · `PATCH /read-all`.

**Entregado**: campana en la cabecera con badge y panel lateral, y `/dashboard/notifications` con el historial paginado.

### Hallazgo: solo un tipo de notificación llega al entrenador

`NotificationType` declara nueve constantes; buscando todos los `notificationService.send(...)` del proyecto, solo se emiten cuatro — y de esas, **una sola va al entrenador**:

| Tipo | Destinatario |
|---|---|
| `NEW_STUDENT` | **entrenador** |
| `PLAN_READY`, `PAYMENT_APPROVED`, `PAYMENT_REJECTED` | alumno |
| `PLAN_UPDATED`, `NUTRITION_PLAN_READY`, `SUBSCRIPTION_EXPIRING`, `SUBSCRIPTION_EXPIRED`, `TRAINER_ANNOUNCEMENT` | **nadie: no tienen emisor** |

La funcionalidad está completa, pero hoy la bandeja del entrenador solo se llena cuando alguien se suscribe. Conviene saberlo antes de evaluar si "las notificaciones funcionan".

**Y refuerza el hallazgo de la fase 7**: señalé que `NutritionPlanService.create` no notifica y que no estaba claro si era intencionado. El enum **ya tiene `NUTRITION_PLAN_READY`**. Eso inclina la balanza hacia el olvido. Petición 6 del change request, con los emisores sugeridos por orden de valor.

**Decisiones**

| Decisión | Motivo |
|---|---|
| Se etiquetan **los nueve tipos**, no solo los cuatro emitidos, con fallback genérico para uno desconocido | El backend puede empezar a emitir sin redesplegar el panel, y un tipo nuevo nunca se renderiza en blanco. Verificado e2e con un tipo inventado |
| `metadata` **no se mapea al modelo** | Es un `String` libre y **todos los emisores pasan `null`**. Exponerlo sugeriría un enlace profundo que el backend no puede sostener |
| El contador se **sondea cada 60 s** (+ al recuperar el foco) | No hay websockets ni SSE: las notificaciones son filas que escriben otras peticiones |
| `markAsRead` es **optimista**; `markAllAsRead` no | Marcar una es un booleano que el usuario acaba de pulsar y el rollback es restaurar un snapshot. Esperar un round trip para atenuar una fila se lee como un clic roto |
| Lo no leído se señala con punto **y** fondo **y** la presencia del botón | Nunca solo color |

---

## 0.14 Estado: FASE 11 COMPLETADA — ROADMAP CERRADO (2026-07-28)

`pnpm verify` (typecheck + lint + **273 tests**) y `pnpm build` en verde, más **20/20** comprobaciones e2e.

Endpoints: `GET /api/trainers` · `/{id}` · `/{trainerId}/reviews` · `/{trainerId}/reviews/distribution`.

**Entregado**

- `/dashboard/profile/preview` — **la ficha del entrenador tal y como la ve un alumno**, con los mismos endpoints públicos que consume su aplicación. Es el valor real de esta fase: `TrainerDetailResponseDTO` incluye los planes comerciales, así que aquí se ve exactamente lo que un alumno decide comprar.
- `/dashboard/directory` — el listado con sus cinco filtros, útil como contexto competitivo (precios y posicionamiento de otros entrenadores).

**Hallazgos**

| # | Hallazgo | Cómo se maneja |
|---|---|---|
| 1 | **La distribución omite los tramos vacíos.** `ReviewService.getDistribution` recorre las filas de un `group by`, así que una puntuación que nadie ha dado sencillamente no aparece | `toRatingDistribution` rellena los cinco tramos. Sin eso, un entrenador con solo 5★ y 3★ vería un gráfico de dos barras que se lee como "faltan datos" en vez de como "cero" — un mensaje muy distinto sobre él |
| 2 | **Las reseñas vienen en orden ascendente.** `@PageableDefault(sort = "createdAt")` no declara dirección, y Spring asume `ASC`: la reseña más antigua encabezaría la lista | El repositorio envía `sort=createdAt,desc` explícitamente. Verificado e2e en ambos sentidos |
| 3 | `avgRating` es nullable y **no se convierte a 0** | "Sin valoraciones" y "valorado con un 0" son cosas distintas |
| 4 | `rating` es un `BigDecimal`, así que un 4,5 es posible | Las estrellas redondean para pintar, pero el número exacto se muestra al lado |

El gráfico de distribución sigue las mismas reglas que el de la fase 9: barras horizontales, una sola serie con el verde validado del sistema de diseño, sin leyenda, etiqueta directa con el recuento, y el hover aportando el **porcentaje** — el dato que las etiquetas no llevan — en vez de repetir lo ya visible.

---

# ✅ Roadmap completo — los 61 endpoints integrados

Comprobado programáticamente contra la lista original: **61 de 61** tienen implementación en el código.

| Fase | Contenido | Tests acumulados |
|---|---|---|
| 0 | Infraestructura: BFF, errores, paginación, proxy de medios | 59 |
| 1 | Auth y sesión (9 endpoints, 4 pantallas) | 117 |
| 2 | Usuario y perfil de entrenador (11) | 97 → |
| 3 | Planes comerciales y alumnos (8) | 144 |
| 4 | Catálogo de ejercicios (3) | 156 |
| 5 | Planes de entrenamiento (6) | 170 |
| 6 | Catálogo de alimentos (2) | 185 |
| 7 | Planes de nutrición (6) | 200 |
| 8 | Ejercicios y vídeos (4) | 217 |
| 9 | Progreso y sesiones (3) | 242 |
| 10 | Notificaciones (4) | 258 |
| 11 | Directorio público (4) | **273** |

**Deuda técnica del diagnóstico inicial, cerrada**: C1–C5, A1–A7 y M1–M7 están resueltos o mitigados con la mitigación aislada y documentada. `lib/hooks.ts`, `lib/types.ts`, la capa mock y los dos *form sheets* sin cablear (1.087 líneas) fueron eliminados.

**Lo que queda pendiente y depende del backend**: las seis peticiones de `docs/BACKEND_CHANGE_REQUEST.md`. Tres de ellas (A1, sesiones sin listar, planes sin `active`) limitan funcionalidad que ya está construida y esperando.

---

## 1. Diagnóstico de la arquitectura actual

### 1.1 Estructura

```
app/
  api/
    auth/{login,logout,session}/route.ts   ← BFF de sesión
    backend/[...path]/route.ts             ← proxy genérico al Spring Boot
  dashboard/
    layout.tsx, page.tsx
    {students,plans,profile,training-plans,nutrition-plans}/page.tsx
  login/page.tsx
components/
  auth/login-form.tsx
  dashboard/  (overview, students-list, student-drawer, header, sidebar, …)
  plans/      (training-plan-form-sheet, nutrition-plan-form-sheet)
  ui/         (21 primitivos shadcn)
lib/
  api.ts          ← cliente HTTP (fetch) + ApiError
  hooks.ts        ← 11 hooks de React Query, todos en un archivo
  types.ts        ← modelos de dominio
  mock-api.ts / mock-data.ts  ← modo demo
  auth-cookie.ts  ← opciones de cookie
  format.ts, utils.ts
proxy.ts          ← guard de rutas (middleware Next 16)
```

### 1.2 Cómo se consumen las APIs hoy

Cadena actual, de la pantalla al backend:

```
Componente → hook (lib/hooks.ts) → apiFetch (lib/api.ts)
   → fetch('/api/backend' + path)
   → app/api/backend/[...path]/route.ts  (adjunta Bearer desde cookie httpOnly)
   → Spring Boot
```

**Lo que está bien y hay que conservar:**

- El patrón BFF. El JWT nunca se expone a JS del cliente. Es más seguro que `localStorage` y es la razón principal para no refactorizar hacia un cliente HTTP directo.
- React Query ya configurado con `staleTime: 30s` y un `retry` que no reintenta 401/403. Buena base.
- El sistema de diseño: 21 primitivos shadcn consistentes, tokens semánticos (`--success-surface`, `--error-text`), tipografía escalada. **Reutilizable tal cual.**
- `proxy.ts` como guard de `/dashboard/*`. Correcto para Next 16.
- Estados de carga/vacío ya modelados (`EmptyState`, `Skeleton`, `ConfirmDialog`).

**Lo que no funciona:**

- No hay capa de mapeo DTO↔dominio. `lib/types.ts` describe formas que el backend nunca devuelve.
- No hay repositorios ni servicios. `lib/hooks.ts` mezcla, en un archivo, claves de cache + rutas HTTP + tipos + toasts.
- No hay refresh de token. No hay paginación. No hay normalización de errores.
- Sin tests, y sin test runner en `package.json`.

### 1.3 Grado de conexión real de cada pantalla

| Pantalla | Estado |
|---|---|
| `/login` | Conectada al BFF — **pero el contrato está roto** (§2 C1) |
| `/dashboard` (Overview) | Conectada vía hooks; tipos incorrectos |
| `/dashboard/students` | Conectada; **no puede mostrar nombres de alumno** (§2 A1) |
| `/dashboard/training-plans` | **Array hardcodeado** en el archivo (`const PLANS`) |
| `/dashboard/nutrition-plans` | **Array hardcodeado** |
| `/dashboard/plans` | Placeholder `EmptyState` |
| `/dashboard/profile` | Placeholder `EmptyState` |
| `training-plan-form-sheet.tsx` (612 líneas) | UI completa, **cero wiring de submit** |
| `nutrition-plan-form-sheet.tsx` (475 líneas) | UI completa, **cero wiring de submit** |

Es decir: de los 61 endpoints, hay **9 con alguna llamada real**, y de esos, **todos devuelven formas distintas a las que el frontend espera**.

---

## 2. Problemas encontrados

### 🔴 CRÍTICO

#### C1 — El login está roto contra el backend real

`app/auth/login/route.ts:38-45` lee `data.token`, `data.role`, `data.profileCompleted`.

El DTO real (`auth/dto/AuthResponseDTO.java`):

```java
public record AuthResponseDTO(String email, String firstName, String message,
                              String jwt, String refreshToken, boolean accountVerified)
```

No existe `token`, no existe `role`, no existe `profileCompleted`. Resultado: `res.cookies.set(COOKIE_NAME, undefined)` → la cookie queda inutilizable y **ningún login real puede funcionar**. Hoy no se nota porque `.env.example` deja el proyecto en modo mock.

`role` y `profileCompleted` sí existen, pero como **claims del JWT** (`shared/utils/JwtUtils.java:44-46`): `authorities`, `userId`, `profileCompleted`, `firstName`. Hay que decodificar el JWT en el BFF para obtenerlos.

#### C2 — El proxy devuelve 500 en toda respuesta 204

`app/api/backend/[...path]/route.ts:38-43`:

```ts
const text = await upstream.text()          // "" cuando el upstream es 204
return new NextResponse(text, { status: upstream.status })
```

Verificado en el runtime de este proyecto:

```
new Response('', {status:204})  → TypeError: Response constructor: Invalid response status code 204
new Response(null, {status:204}) → OK
```

El spec prohíbe cuerpo (incluso `""`) en estados null-body (204/205/304). Endpoints afectados — **todos devuelven 500 hoy**:

`PATCH /api/subscriptions/{id}/pause` · `/resume` · `DELETE /api/plans/{planId}` · `DELETE /api/training-plans/{planId}` · `DELETE /api/nutrition-plans/{planId}` · `DELETE /api/exercises/{id}/videos/{videoId}` · `PATCH /api/notifications/read-all` · `DELETE /api/account` · `POST /auth/register/resend-otp`

Es decir: **casi toda escritura destructiva de las Fases 3–9.**

#### C3 — El refresh token se descarta; la sesión real dura 30 minutos

- `JwtUtils.java:47` → access token expira a los **1.800.000 ms = 30 min**.
- `RefreshTokenService.java:25` → `EXPIRY_DAYS = 30L`.
- `app/auth/login/route.ts` **nunca lee `data.refreshToken`**. Se pierde.
- La cookie se emite con `maxAge = 7 días`.

Consecuencia: a los 30 minutos el JWT caduca, la cookie sigue viva 7 días, cada request devuelve 401 y `apiFetch` hace `window.location.href = "/login"`. El usuario es expulsado a mitad de trabajo — y como `proxy.ts` solo comprueba *presencia* de cookie, lo rebota de vuelta a `/dashboard`, que vuelve a dar 401. **Bucle de redirección.**

Con `POST /auth/refresh` implementado, la sesión podría durar 30 días sin re-login.

#### C4 — El proxy no soporta multipart ni binario

`route.ts:30-36` fuerza `Content-Type: application/json` y hace `await req.text()`.

- `POST /api/exercises/{id}/videos` es `MULTIPART_FORM_DATA_VALUE` con `@RequestParam("file") MultipartFile` (hasta 100 MB). **Imposible de atravesar** con el proxy actual.
- `GET /api/files/**` devuelve `ResponseEntity<Resource>` binario. `await upstream.text()` lo corrompe y se re-etiqueta como JSON.

**Y este segundo punto llega antes de lo previsto:** con `storage.provider=local` (default, `application.properties:77`), las URLs de `profileImageUrl`, `photoUrl`, `mediaUrl` y videos apuntan a `/api/files/**`, que **requiere autenticación**. Un `<img src="...">` del navegador no envía el header `Authorization`, así que **todos los avatares e imágenes fallarán con 401** — desde la Fase 2, no la 11.

#### C5 — Todo `lib/types.ts` es ficción

Ningún tipo del frontend coincide con su DTO. Muestra representativa:

**TrainerProfile**

| Frontend (`lib/types.ts`) | Backend (`TrainerProfileResponseDTO`) |
|---|---|
| `trainerProfileId` | `id` |
| `bio` | `description` |
| `hourlyRate` | `basePrice` |
| `yearsOfExperience` | `experienceYears` |
| `profilePictureUrl` | `profileImageUrl` |
| `rating` / `reviewCount` | `avgRating` / `totalReviews` |
| `specialties: Specialty[]` | `specialties: List<String>` |
| `certifications: string[]` | `certifications: List<CertificationDTO>` |
| — | `currentStudents` (no mapeado) |

Efecto visible hoy: `components/dashboard/header.tsx:57` lee `profile?.profilePictureUrl` → siempre `undefined` → el avatar nunca carga.

**TrainingPlan**

| Frontend | Backend (`TrainingPlanResponseDTO`) |
|---|---|
| `name`, `description` | `title`, `notes` |
| `lastUpdated` | `createdAt` |
| `trainingDays[].dayName` | `days[].dayNumber` + `label` + `restDay` |
| `exercises[].description` | no existe |
| — | `order`, `weightValue`, `weightUnit`, `durationSeconds`, `catalogExerciseId`, `muscleGroup`, `equipment` |
| `subscriptionId` en la respuesta | **no viene** en la respuesta |

**NutritionPlan** — el frontend pone `dailyCalories/proteinGrams/carbsGrams/fatGrams` a nivel de plan; el backend solo los expone **por comida** (`MealResponse.calories`, `proteinG`, …). Los totales del plan **hay que calcularlos en el cliente**.

**PlanVersion** — el frontend espera un DTO ligero `{id, version, name, lastUpdated, isCurrent}`; `GET .../history` devuelve `List<TrainingPlanResponseDTO>` **completo**, con todos los días y ejercicios de cada versión.

**ProgressEntry** — frontend `{date, weight, bodyFatPercentage, notes}`; real `{id, subscriptionId, weightKg, bodyFatPct, chestCm, waistCm, hipsCm, armsCm, thighsCm, photoUrl, notes, recordedAt, createdAt}`.

---

### 🟠 ALTO

#### A1 — `GET /api/subscriptions/students` no devuelve identidad del alumno

Es el endpoint que alimenta la pantalla principal del producto. Devuelve `List<SubscriptionResponseDTO>`:

```java
public record SubscriptionResponseDTO(Long id, Long trainerId, String trainerName,
                                      String trainerImageUrl, SubscriptionPlanResponseDTO plan,
                                      SubscriptionStatus status, Instant startedAt, Instant expiresAt)
```

Está modelado desde la perspectiva del **alumno** (te dice quién es tu *entrenador*). Usado por un entrenador para listar *sus alumnos*, devuelve N veces sus propios datos y **cero información de los alumnos**.

`SubscriptionDetailResponseDTO` sí trae `StudentSummary(id, fullName, profileImageUrl)`, pero solo en el detalle uno-a-uno.

**No hay workaround limpio en frontend.** Las opciones son:
1. **(Recomendada)** Pedir al backend un `TrainerStudentResponseDTO` con `StudentSummary` embebido en `/api/subscriptions/students`.
2. Interino: hacer N+1 llamadas a `/api/subscriptions/{id}` — inaceptable en producción, tolerable como puente en Fase 3.
3. Interino alternativo: derivar la lista de `GET /api/training-plans/trainer/students`, que **sí** trae `studentFullName` y `studentImageUrl`. Pero solo incluye alumnos **con plan asignado**, así que los alumnos nuevos desaparecen de la lista.

Es la principal petición de cambio al backend que sale de este análisis.

#### A2 — Cinco endpoints paginados, cero soporte de paginación

`GET /api/trainers`, `/api/notifications`, `/api/catalog-exercises`, `/api/foods`, `/api/trainers/{id}/reviews` devuelven `Page<T>` de Spring. El frontend no tiene tipo `PageResponse<T>`, ni hook de scroll infinito, ni controles de página.

Además, Spring Boot 3.5 serializa `PageImpl` directamente (no hay `spring.data.web.pageable.serialization-mode` configurado), lo que emite un warning de inestabilidad de contrato. **Encapsular la forma de página en un mapper del frontend** para que un cambio en el backend toque un solo archivo.

#### A3 — Completar el perfil emite un JWT nuevo que nadie guarda

`POST /api/trainer/profile/complete` devuelve `AuthResponseDTO` — tokens nuevos, porque el claim `profileCompleted` pasa a `true`. Si el frontend ignora la respuesta, la sesión conserva el JWT viejo con `profileCompleted=false` y el usuario queda atrapado en el onboarding. Este endpoint **debe** pasar por el BFF para reemplazar la cookie.

#### A4 — La capa mock congela los contratos equivocados

`lib/mock-api.ts` + `lib/mock-data.ts` (242 líneas) devuelven las formas inventadas de `lib/types.ts`. Mientras exista, el modo demo "funciona" y esconde que el modo real no. Todo desarrollo contra mocks produce código que se rompe contra el backend.

#### A5 — Sin normalización de errores; el backend tiene dos formas distintas

`GlobalExceptionHandler.java` devuelve:
- `record ErrorResponse(String message, int status, Instant timestamp)` para la mayoría, y
- `Map<String, String>` (campo → mensaje) para `MethodArgumentNotValidException` (400 de validación).

`lib/api.ts` solo intenta `data.message`. Con un 400 de validación de Zod/Bean Validation, `message` es `undefined` y el usuario ve `"Request failed (400)"` en vez de "El password debe contener al menos una mayúscula y un número". Los mapeos de estado también están dispersos: 401 y 403 se tratan dentro de `apiFetch`, 409 (conflictos de negocio: "ya tiene suscripción activa", "plan lleno") no se trata en absoluto.

#### A6 — 1.087 líneas de formularios sin conectar

`training-plan-form-sheet.tsx` (612) y `nutrition-plan-form-sheet.tsx` (475) son UI completa sin `onSubmit`, sin mutación, sin validación contra el DTO real. Hay que auditar si su modelo de datos interno encaja con `CreateTrainingPlanRequestDTO` (que exige `order` por ejercicio, `dayNumber`, `restDay`, y `catalogExerciseId` opcional) antes de decidir entre conectar o reescribir.

#### A7 — La Fase 1 tiene 9 endpoints y 1 pantalla

Existe `/login`. **No existe** registro, verificación OTP, reenvío de OTP, ni el flujo de 3 pasos de recuperación de contraseña. Son 4 pantallas nuevas mínimo.

---

### 🟡 MEDIO

- **M1** — `app/auth/session/route.ts` **hardcodea** `role: "TRAINER"` y `profileCompleted: true` sin mirar el JWT. La sesión miente.
- **M2** — **No hay guard de rol.** `proxy.ts` solo comprueba que exista cookie. Un usuario con rol `STUDENT` puede loguearse en el dashboard de entrenador; verá 403 en cada llamada pero entrará. El claim `authorities` está disponible en el JWT.
- **M3** — `NEXT_PUBLIC_API_URL` se usa **solo en el servidor** (`app/api/**`), pero el prefijo `NEXT_PUBLIC_` lo inyecta en el bundle del cliente, exponiendo la URL interna del backend. Debe ser `API_URL`. (`USE_MOCK` en `lib/api.ts` sí necesita una variable pública — separar ambas.)
- **M4** — Sin fábrica de query keys. Las claves son strings sueltos (`["students"]`, `["subscription", id]`); invalidar en cascada es frágil y no hay tipado.
- **M5** — Sin Error Boundaries ni `loading.tsx` de App Router. Cada componente maneja `isLoading` a mano.
- **M6** — Todo `lib/hooks.ts` en un archivo; crecerá a ~60 hooks. Hay que cortarlo por feature antes de la Fase 3.
- **M7** — Sin `.env.local` versionado ni validación de entorno al arrancar. Un typo en `API_URL` degrada silenciosamente a modo mock.

### 🟢 BAJO

- **B1** — `export const allIcon = ClipboardList` en `nav-items.ts:34` — sin uso.
- **B2** — `next-themes` instalado, `colorScheme: 'light'` fijo en `layout.tsx`. Dependencia muerta o feature a medio hacer.
- **B3** — `generator: 'v0.app'` en metadata.
- **B4** — Sin validación de respuestas en runtime. Con `zod` ya en el proyecto, validar los DTOs de entrada en el borde detectaría cambios de contrato del backend en desarrollo en vez de en producción.

---

## 3. Arquitectura objetivo

### 3.1 Principio rector

Clean Architecture completa (entities / use cases / interface adapters / frameworks) es **sobre-ingeniería para este proyecto**. No hay lógica de negocio en el cliente: el dominio vive en el Spring Boot. Lo que sí necesitamos son **dos** de sus propiedades:

1. **Frontera anticorrupción** — las formas del backend no se filtran a los componentes. Un rename de `basePrice` toca un mapper, no 14 archivos.
2. **Inversión de dependencia en el borde de red** — los hooks dependen de una interfaz de repositorio, no de `fetch`, para poder testear sin servidor.

Todo lo demás (use cases, entities, DI containers) se añade **solo donde haya orquestación real**. Hay exactamente tres casos en este proyecto, listados en §3.4.

### 3.2 Estructura propuesta

```
src/
  core/
    http/
      client.ts            # apiFetch tipado, único punto de red del cliente
      errors.ts            # ApiError + normalización de las 2 formas del backend
      pagination.ts        # PageResponse<T> + mapper de Page<T> de Spring
      query-keys.ts        # fábrica de claves tipada
    config/env.ts          # validación de entorno con zod

  server/                  # solo servidor — nunca importado por el cliente
    session.ts             # leer/escribir/rotar la cookie de sesión
    jwt.ts                 # decodificar claims (authorities, userId, profileCompleted)
    upstream.ts            # fetch al Spring Boot: JSON, multipart y binario

  features/
    auth/
      api/auth.repository.ts
      model/session.model.ts
      hooks/{use-login,use-register,use-otp,use-password-reset}.ts
      components/…
    trainer-profile/
      api/trainer-profile.repository.ts
      dto/trainer-profile.dto.ts      # espejo exacto del DTO backend
      model/trainer-profile.model.ts  # forma de dominio del frontend
      mappers/trainer-profile.mapper.ts
      hooks/…
      components/…
    subscriptions/  students/  training-plans/  nutrition-plans/
    catalog-exercises/  foods/  progress/  notifications/  …

  shared/
    ui/                    # los 21 primitivos shadcn actuales, sin cambios
    components/            # EmptyState, StatCard, StatusBadge, ConfirmDialog…
```

`app/` queda como capa de routing fina: `page.tsx` compone features, no contiene lógica.

### 3.3 El flujo DTO → Modelo

Regla no negociable, y la que resuelve el problema C5 de raíz:

```
Backend JSON  →  DTO (espejo literal del record Java)
                   ↓  mapper (única capa que conoce ambas formas)
                 Model (camelCase idiomático del frontend, fechas como Date, dinero como number)
                   ↓
                 Hook (React Query) → Componente
```

Ejemplo concreto:

```ts
// features/trainer-profile/dto/trainer-profile.dto.ts
// Espejo literal de TrainerProfileResponseDTO.java — NO tocar sin mirar el Java
export interface TrainerProfileDTO {
  id: number
  fullName: string
  profileImageUrl: string | null
  description: string | null
  basePrice: number | null          // BigDecimal → number (Jackson serializa numérico)
  experienceYears: number | null
  location: string | null
  avgRating: number | null
  totalReviews: number | null
  currentStudents: number | null
  specialties: string[]
  certifications: CertificationDTO[]
}

// features/trainer-profile/model/trainer-profile.model.ts
export interface TrainerProfile {
  id: number
  fullName: string
  avatarUrl: string | null          // ya resuelto a través del proxy de archivos
  bio: string
  basePrice: number
  experienceYears: number
  location: string
  rating: { average: number; total: number }
  activeStudents: number
  specialties: string[]
  certifications: Certification[]
}
```

El mapper aplica además el **fix de C4**: reescribe cualquier URL de `/api/files/**` a `/api/media/**` (nuestra ruta proxy), de modo que ningún componente tenga que saber que las imágenes requieren autenticación.

### 3.4 Dónde sí hacen falta use cases

Solo tres flujos tienen orquestación multi-paso que no pertenece ni al repositorio ni al componente:

1. **`completeTrainerProfile`** — POST → recibir `AuthResponseDTO` → reemplazar cookie de sesión → invalidar cache de sesión → navegar. (Resuelve A3.)
2. **`refreshSession`** — detectar 401 → llamar `/auth/refresh` con deduplicación (una sola llamada aunque fallen 6 requests a la vez) → reintentar los pendientes → si el refresh falla, cerrar sesión limpiamente. (Resuelve C3.)
3. **`saveTrainingPlanVersion`** — decidir POST (primera versión) vs PUT (versión nueva) según exista plan actual, normalizar el árbol días/ejercicios a `CreateTrainingPlanRequestDTO`, invalidar current + history + la vista consolidada.

El resto son CRUD de un paso: repositorio + hook, sin capa intermedia. Añadir use cases ahí sería ceremonia sin valor.

---

## 4. Mapa de dependencias entre endpoints

El orden propuesto en el enunciado es **casi correcto**, con tres inversiones reales de dependencia. Grafo verificado contra el código:

```
                         ┌─────────────────────────────┐
                         │  AUTH  (/auth/**, público)  │
                         │  login · register · otp     │
                         │  password-reset · refresh   │
                         └──────────────┬──────────────┘
                                        │ emite JWT (claims: authorities,
                                        │ userId, profileCompleted)
                         ┌──────────────▼──────────────┐
                         │  USER  (/api/user-detail)   │
                         │  preferences                │
                         └──────────────┬──────────────┘
        ┌───────────────────────────────┤
        │ specialtyIds                  │
┌───────▼────────┐            ┌─────────▼─────────────┐
│ /api/specialties│──────────►│  TRAINER PROFILE      │
│  (PÚBLICO)     │  requerido │  complete · get · put │
└────────────────┘  por       └─────────┬─────────────┘
                    complete/update     │ trainerId
                                        │
                         ┌──────────────▼──────────────┐
                         │  PLANES COMERCIALES         │
                         │  /api/plans                 │
                         └──────────────┬──────────────┘
                                        │ el alumno se suscribe a un plan
                         ┌──────────────▼──────────────┐
                         │  SUBSCRIPTIONS ★            │
                         │  students · pause · resume  │
                         │  {subscriptionId}           │
                         └──────┬───────────────┬──────┘
                                │ subscriptionId│
                ┌───────────────▼──┐         ┌──▼────────────────┐
                │ TRAINING PLANS   │         │ NUTRITION PLANS   │
                └───────┬──────────┘         └──────┬────────────┘
                        │ exerciseId                │ nombres de alimento
                ┌───────▼──────────┐         ┌──────▼────────────┐
                │ EXERCISES+VIDEOS │         │  /api/foods       │
                └──────────────────┘         └───────────────────┘
                        ▲                            ▲
                        │ catalogExerciseId          │
                ┌───────┴──────────┐                 │
                │/api/catalog-exer.│  ◄── ambos catálogos son requisito
                └──────────────────┘      del EDITOR, no posteriores a él

  SUBSCRIPTIONS ★ ──► PROGRESS (/api/progress/subscription/{id})
                 ──► WORKOUT SESSIONS (/api/workout-sessions/{id})

  INDEPENDIENTES (solo requieren un JWT válido):
    NOTIFICATIONS · DELETE /api/account · /api/files/**
  PÚBLICOS (sin token):
    /api/trainers/** · /api/specialties/**
```

### Las tres correcciones al orden del enunciado

**1. `/api/specialties` debe subir de la Fase 10 a la Fase 2.**
`CompleteTrainerProfileRequestDTO` y `UpdateTrainerProfileRequestDTO` reciben `List<Long> specialtyIds`. Sin el catálogo de especialidades no se puede construir el selector, y por tanto **no se puede completar un perfil**. Es una dependencia dura, no un adorno. Además es `permitAll`, así que integrarlo cuesta muy poco.

**2. Los catálogos (Fase 7) deben preceder a los editores (Fases 4 y 5).**
`CreateTrainingPlanRequestDTO.ExerciseRequest` acepta `catalogExerciseId`, y el comentario del propio DTO dice: *"name y catalogExerciseId: al menos uno es obligatorio... el backend vincula el ejercicio del catálogo"*. Construir el editor de entrenamiento sin el buscador de catálogo obliga a entrada de texto libre y a **reescribir el editor** cuando llegue la Fase 7. Lo mismo con `/api/foods` y el editor de nutrición.

**3. `/api/files/**` debe bajar de la Fase 11 a la Fase 0.**
Ver C4: con `storage.provider=local`, avatares e imágenes requieren autenticación. Sin la ruta proxy de medios, **todo avatar del dashboard falla desde la Fase 2**. Es infraestructura, no una feature final.

Cambios menores: `DELETE /api/account` (Fase 10) es un endpoint trivial que pertenece a la pantalla de ajustes de la Fase 2. Y notificaciones (Fase 9) no depende de nada — puede adelantarse si se quiere valor visible antes.

---

## 5. Roadmap

| Fase | Módulo | Endpoints | Depende de | UI | Compl. | Prio |
|---|---|---|---|---|---|---|
| **0** | Infraestructura | — (+ `/api/files/**` proxy) | — | ninguna | Alta | 🔴 P0 |
| **1** | Auth y sesión | 9 `/auth/**` | F0 | 5 pantallas nuevas | Alta | 🔴 P0 |
| **2** | Usuario + Perfil Trainer | 8 + `/api/specialties`×2 + `DELETE /api/account` | F1 | 2 nuevas, 1 reescrita | Media | 🔴 P0 |
| **3** | Planes comerciales + Alumnos | 4 plans + 4 subscriptions | F2 | 1 nueva, 2 reescritas | Media | 🟠 P1 |
| **4** | Catálogo de ejercicios | 3 `/api/catalog-exercises` | F0 | 1 componente selector | Baja | 🟠 P1 |
| **5** | Planes de entrenamiento | 6 `/api/training-plans` | F3, F4 | editor reescrito | **Muy alta** | 🟠 P1 |
| **6** | Catálogo de alimentos | 2 `/api/foods` | F0 | 1 componente selector | Baja | 🟡 P2 |
| **7** | Planes de nutrición | 6 `/api/nutrition-plans` | F3, F6 | editor reescrito | Alta | 🟡 P2 |
| **8** | Ejercicios y videos | 4 `/api/exercises/**` | F5 | uploader + galería | Alta | 🟡 P2 |
| **9** | Progreso y sesiones | 3 | F3 | 2 vistas nuevas | Media | 🟡 P2 |
| **10** | Notificaciones | 4 | F1 | campana + panel | Media | 🟢 P3 |
| **11** | Directorio público | 6 (`/api/trainers`, reviews, distribution) | F0 | vista previa pública | Baja | 🟢 P3 |

Diferencias con el enunciado: catálogos adelantados (F4, F6) delante de sus editores; especialidades y borrado de cuenta absorbidos en F2; archivos absorbidos en F0; directorio público al final por ser el de menor valor para el entrenador.

---

### Detalle por fase

#### FASE 0 — Infraestructura (sin UI nueva)

**Objetivo:** dejar el borde de red correcto antes de conectar nada. Todo lo demás se apoya aquí.

| | |
|---|---|
| **Endpoints** | Ninguno de negocio. Habilita `/api/files/**`. |
| **Entregables** | `core/http/{client,errors,pagination,query-keys}.ts`; `core/config/env.ts`; `server/{session,jwt,upstream}.ts`; ruta `app/api/media/[...path]/route.ts` (streaming binario autenticado) |
| **Arreglos** | **C2** (204 → `new NextResponse(null, {status})`), **C4** (multipart passthrough + streaming binario), **A2** (`PageResponse<T>`), **A5** (normalización de las 2 formas de error), **M3** (`API_URL` server-only) |
| **Estado** | Fábrica de query keys tipada; defaults de React Query revisados |
| **Tests** | Vitest + MSW instalados; tests de `errors.ts`, `pagination.ts` y del handler 204 |
| **Riesgos** | Bajo. Nada visible cambia; si algo se rompe se nota de inmediato. |
| **Criterio de salida** | `tsc --noEmit` y `eslint` limpios; un 204 atraviesa el proxy sin 500; un binario se descarga íntegro |

#### FASE 1 — Auth y sesión

**Objetivo:** una sesión que dure de verdad y cubra el ciclo de vida completo de la cuenta.

| | |
|---|---|
| **Endpoints** | `POST /auth/login` · `/auth/trainer/register` · `/auth/register/resend-otp` · `/auth/register/verify-otp` · `/auth/password-reset/{request,verify,confirm}` · `/auth/refresh` · `/auth/logout` |
| **Pantallas nuevas** | `/register`, `/verify-otp`, `/forgot-password`, `/reset-password` (verify + confirm en un flujo de 2 pasos) |
| **Pantallas afectadas** | `/login` (corregir contrato), `header.tsx` (logout debe revocar el refresh token) |
| **Repositorio** | `auth.repository.ts` — 9 métodos |
| **Use case** | `refreshSession` con deduplicación de peticiones concurrentes |
| **DTOs** | `AuthResponseDTO`, `AuthLoginRequestDTO`, `AuthRegisterRequestDTO` (password: **min 8, ≥1 mayúscula, ≥1 dígito** — replicar el regex `^(?=.*[A-Z])(?=.*\d).+$` en el schema Zod), `VerifyOtpRequestDTO`, `ResetPasswordDTO`, `RefreshTokenRequestDTO` |
| **Estado** | Cookie de sesión ampliada: `{ accessToken, refreshToken, expiresAt }`, cifrada, `httpOnly` |
| **Arreglos** | **C1**, **C3**, **M1**, **M2** (guard de rol: comprobar que `authorities` contiene `ROLE_TRAINER` en `proxy.ts`) |
| **Tests** | Repositorio contra MSW; rotación de token; caso "6 requests en paralelo con token caducado → 1 solo refresh" |
| **Riesgos** | **Los más altos del proyecto.** Un fallo aquí bloquea todo. El bucle de redirección de C3 debe verificarse a mano tras 30 min reales de sesión. |
| **Criterio de salida** | Login real contra Spring Boot; sesión sobrevive a la expiración de 30 min sin re-login; logout revoca; un STUDENT no entra al dashboard |

#### FASE 2 — Usuario y perfil de entrenador

| | |
|---|---|
| **Endpoints** | `GET/PUT/POST /api/user-detail` · `GET/PUT /api/users/preferences` · `POST /api/trainer/profile/complete` · `GET/PUT /api/trainer/profile` · `GET /api/specialties` · `/api/specialties/search` · `DELETE /api/account` |
| **Pantallas** | `/dashboard/profile` **reescrita** (hoy es placeholder); `/dashboard/settings` nueva (preferencias + borrar cuenta); `/onboarding` nueva (completar perfil, obligatoria si `profileCompleted=false`) |
| **Componentes** | `SpecialtyMultiSelect` (con `/api/specialties/search`), `CertificationListEditor`, `AvatarUploader` |
| **Use case** | `completeTrainerProfile` — resuelve **A3** (reemplazo de cookie) |
| **Mappers** | `trainer-profile.mapper.ts` — resuelve **C5** para este módulo; reescribe URLs de archivos a `/api/media/**` |
| **Nota** | Preferencias solo tiene `onboardingMode`. La UI debe reflejar eso, no idioma/notificaciones (§0.2). |
| **Riesgos** | Medio. `POST /complete` es **irrepetible** (409 si ya está completo) — la UI debe ramificar entre complete y update. |

#### FASE 3 — Planes comerciales y alumnos

| | |
|---|---|
| **Endpoints** | `POST/PUT/DELETE /api/plans`, `GET /api/plans/my` · `GET /api/subscriptions/students` · `PATCH .../pause` · `.../resume` · `GET /api/subscriptions/{id}` |
| **Pantallas** | `/dashboard/plans` **reescrita** (hoy placeholder); `/dashboard/students` reconectada; `student-drawer` → ruta propia (ver §6) |
| **Bloqueante** | **A1** — sin cambio en el backend, la lista de alumnos no puede mostrar nombres. Decidir entre pedir el cambio (recomendado) o el puente N+1. |
| **Riesgos** | Alto, por A1. Escalar la petición al backend al inicio de la fase, no al final. |

#### FASE 4 — Catálogo de ejercicios *(adelantada)*

`GET /api/catalog-exercises` (`search`, `muscleGroup`, `equipment`, `page`, `size`) · `/filters` · `/{id}`.
Entrega el componente `ExercisePicker` que consume la Fase 5. Complejidad baja, valor de desbloqueo alto. Primer consumidor real de `PageResponse<T>`.

#### FASE 5 — Planes de entrenamiento

La fase más compleja del proyecto. Estructura anidada de 3 niveles (plan → días → ejercicios), versionado con historial, y un editor de 612 líneas que hay que auditar contra `CreateTrainingPlanRequestDTO` antes de decidir conectar vs reescribir.

Semántica a respetar: `POST` crea la **primera** versión; `PUT /{planId}` crea una **versión nueva** conservando historial; `DELETE /{planId}` elimina una versión y **promueve la anterior**. La UI debe comunicar esto — "Guardar" no es *update*, es *nueva versión*.

#### FASE 6 — Catálogo de alimentos
`GET /api/foods` (`q`, `category`, paginado) · `/{id}`. Entrega `FoodPicker` para la Fase 7. Mismo patrón que la Fase 4.

#### FASE 7 — Planes de nutrición
Igual que la Fase 5, un nivel menos de anidamiento (plan → comidas → alimentos). Los macros del plan **se calculan en el cliente** sumando las comidas (§2 C5). `TimeOfDay` es un enum del backend — extraerlo, no hardcodearlo.

#### FASE 8 — Ejercicios y videos
Primera subida multipart. Depende del passthrough construido en la Fase 0. Validar cliente-side: mp4/mov/avi/webm/mpeg, 100 MB. Necesita progreso de subida (`XMLHttpRequest` o streams — `fetch` no reporta progreso de subida).

#### FASE 9 — Progreso y sesiones
Solo lectura, bajo riesgo. `ProgressResponseDTO` trae 7 medidas corporales + `photoUrl` (vía proxy de medios). Buena candidata para gráficos de evolución.

#### FASE 10 — Notificaciones
Paginado + contador de no leídas + marcar leída/todas. Sin websockets en el backend → polling de `unread-count` (60 s) con actualización optimista al marcar.

#### FASE 11 — Directorio público
Endpoints `permitAll`. Valor para el entrenador: previsualizar su ficha pública tal como la ven los alumnos. Prioridad más baja.

---

## 6. Cambios de UI necesarios

### 6.1 Detalle del alumno: de drawer a ruta

**Problema.** `student-drawer.tsx` (317 líneas) dispara **6 queries en paralelo** al abrirse (`useSubscription`, `useCurrentTrainingPlan`, `useTrainingHistory`, `useCurrentNutritionPlan`, `useNutritionHistory`, `useProgress`). No es enlazable, no sobrevive a un refresh, y las Fases 8–9 añadirán sesiones, videos y progreso detallado. Un drawer no escala a eso.

**Solución.** `/dashboard/students/[subscriptionId]` con pestañas: Resumen · Entrenamiento · Nutrición · Progreso · Sesiones. Cada pestaña carga bajo demanda (6 queries paralelas → 1–2). El drawer se conserva como *preview* rápido con solo el resumen.

**Flujo.** Lista → clic en fila → ruta de detalle → pestaña → editor de plan (sheet en desktop, pantalla completa en móvil).
**Reutilizables:** `StatusBadge`, `ConfirmDialog`, `EmptyState`, `StatCard`, `Tabs`, `Avatar`.

### 6.2 Planes de entrenamiento/nutrición: reorientar por alumno

**Problema.** `/dashboard/training-plans` es hoy un grid de tarjetas con un array hardcodeado. Pero un plan de entrenamiento **no existe sin una suscripción** (`CreateTrainingPlanRequestDTO.subscriptionId` es `@NotNull`). El botón "Nuevo plan" no puede funcionar: no hay alumno al que asignarlo.

**Solución.** Reconvertir la vista en la **vista consolidada** que el backend ya ofrece: `GET /api/training-plans/trainer/students` devuelve `TrainerStudentPlanSummaryDTO(subscriptionId, studentId, studentFullName, studentImageUrl, currentPlan)` — exactamente una fila por alumno con su plan actual. Alumnos con `currentPlan == null` son la lista de "pendientes de asignar", que es la acción más útil del entrenador.

**Flujo.** Vista consolidada → clic en alumno → editor con `subscriptionId` ya resuelto.
Bonus: esta vista **sí** trae nombre e imagen del alumno, y sirve de mitigación parcial de A1.

### 6.3 Editor de planes: versionado explícito

**Problema.** Los sheets actuales tratan la edición como update in-place. El backend crea una **versión nueva** en cada PUT. El entrenador no tiene forma de saberlo ni de ver el historial.

**Solución.** Cabecera con selector de versión (`v3 · actual`), badge de solo-lectura al ver versiones antiguas, botón explícito "Guardar como nueva versión", y acceso al historial desde el propio editor.

### 6.4 Selector de ejercicios del catálogo

**Problema.** El editor actual pide nombres de ejercicio en texto libre; el backend prefiere `catalogExerciseId` para vincular grupo muscular, equipamiento e instrucciones.

**Solución.** `ExercisePicker`: buscador con filtros de grupo muscular/equipamiento (de `/filters`), paginado, con opción "ejercicio personalizado" como escape. Componente reutilizable; `FoodPicker` es su gemelo para nutrición.

### 6.5 Pantallas de autenticación

Registro, OTP (input de 6 dígitos con auto-avance y reenvío con cooldown), y recuperación en 2 pasos. Nada de esto existe. El feedback de validación debe mostrar los mensajes reales del backend (mayúscula + dígito), no genéricos.

### 6.6 Campana de notificaciones

Añadir a `header.tsx`: icono con badge de `unread-count`, panel desplegable con las últimas, enlace a `/dashboard/notifications` con paginación.

### 6.7 Navegación

`nav-items.ts` tiene 6 entradas y la barra móvil 5 — ya está en el límite. Con ajustes, notificaciones y progreso, hay que reagrupar: mover Perfil/Ajustes al menú del avatar (donde ya está "Perfil"), y dejar la navegación principal en Inicio · Alumnos · Entrenamiento · Nutrición · Planes.

---

## 7. Estrategia de estado y cache

**React Query es el estado del servidor. No añadir Redux/Zustand.** El único estado global real es la sesión, y vive en una cookie `httpOnly` leída por el servidor.

**Fábrica de claves tipada** (resuelve M4):

```ts
export const qk = {
  session: ['session'] as const,
  trainerProfile: ['trainer-profile'] as const,
  students: { all: ['students'] as const,
              detail: (id: number) => ['students', id] as const },
  trainingPlans: {
    consolidated: ['training-plans', 'consolidated'] as const,
    current: (subId: number) => ['training-plans', 'current', subId] as const,
    history: (subId: number) => ['training-plans', 'history', subId] as const,
  },
  // …
} as const
```

Invalidar `['training-plans']` alcanza a todos sus descendientes.

**`staleTime` por naturaleza del dato:**

| Dato | staleTime | Razón |
|---|---|---|
| Catálogos (ejercicios, alimentos, especialidades) | `Infinity` / 24 h | Inmutables en la práctica |
| Perfil del entrenador, preferencias | 5 min | Cambia solo por acción propia |
| Lista de alumnos, suscripciones | 30 s | Puede cambiar desde fuera |
| Planes actuales / historial | 60 s | Cambia solo por acción propia |
| Contador de no leídas | 60 s + polling | Cambia desde fuera |

**Mutaciones.** Actualización optimista solo donde el rollback es trivial y el feedback debe ser inmediato: pause/resume de suscripción, marcar notificación leída. En los editores de plan (árboles anidados, versionado) usar invalidación tras confirmación — un rollback optimista ahí es más riesgo que beneficio.

**Prefetch.** En la lista de alumnos, `prefetchQuery` del detalle al hover. Barato y notable.

**Paginación.** `useInfiniteQuery` para catálogos y notificaciones (scroll infinito); paginación clásica para el directorio de entrenadores.

---

## 8. Estrategia de autenticación

### 8.1 Modelo de sesión

Mantener el BFF y ampliar la cookie a una sesión completa:

```ts
// cookie 'trainer_session', httpOnly, Secure, SameSite, cifrada
interface Session {
  accessToken: string      // JWT, 30 min
  refreshToken: string     // opaco, 30 días
  expiresAt: number        // epoch ms, calculado desde el claim exp
  userId: number
  authorities: string[]    // del claim 'authorities'
  profileCompleted: boolean
  firstName: string | null
}
```

Los tres últimos campos se derivan **decodificando el JWT en el servidor** (`server/jwt.ts`), que es donde el backend realmente los publica. Esto reemplaza los valores hardcodeados de `app/auth/session/route.ts` (M1).

> Nota: decodificar ≠ verificar. El BFF solo lee claims para tomar decisiones de UI; la autoridad sigue siendo el Spring Boot, que verifica la firma en cada request. No hace falta compartir la clave privada con el frontend.

### 8.2 Refresh (resuelve C3)

Dentro de `server/upstream.ts`, antes de cada llamada:

```
¿expiresAt - now < 60s?
  ├─ sí → POST /auth/refresh con refreshToken
  │        ├─ 200 → reescribir cookie con los tokens rotados, continuar
  │        └─ 401 → limpiar cookie, responder 401 al cliente
  └─ no → continuar con el accessToken actual
```

Refresh **proactivo** (por `expiresAt`) en vez de reactivo (por 401) porque evita el reintento y es más simple de razonar. Conservar además el camino reactivo como red de seguridad si el backend invalida un token antes de tiempo.

**Deduplicación:** el backend **rota** el refresh token (`validateAndRotate`), así que dos refresh concurrentes invalidan la sesión. Serializar por sesión con un mapa de promesas en curso. Es el punto más delicado de toda la Fase 1 y necesita test explícito.

### 8.3 Guards

- **`proxy.ts`** — sin cookie → `/login`. Con cookie pero sin `ROLE_TRAINER` en `authorities` → `/login?error=role` (resuelve M2). Con `profileCompleted=false` → `/onboarding`.
- **Cliente** — `apiFetch` recibe 401 solo cuando el refresh ya falló; entonces sí, limpiar cache de React Query y redirigir. Con C3 arreglado, esto deja de ser el camino habitual.

### 8.4 Cookies

`lib/auth-cookie.ts` está bien razonado (el fallback `SameSite=None; Secure` en HTTPS vs `Lax` en HTTP local es correcto para iframes de preview). Añadir cifrado del contenido, ya que ahora la cookie llevará el refresh token.

---

## 9. Estrategia de manejo de errores

### 9.1 Normalizar las dos formas del backend (resuelve A5)

```ts
type NormalizedError =
  | { kind: 'validation'; fields: Record<string, string> }   // Map<String,String> del handler
  | { kind: 'business';   status: number; message: string }  // ErrorResponse
  | { kind: 'auth';       status: 401 | 403 }
  | { kind: 'network' }
  | { kind: 'unknown';    status: number }
```

El discriminante: un 400 cuyo cuerpo **no** tiene `message` ni `status` es un mapa de validación; si los tiene, es `ErrorResponse`.

### 9.2 Mapeo de estados

| Código | Origen backend | Tratamiento |
|---|---|---|
| 400 (validación) | `MethodArgumentNotValidException` | Volcar `fields` en los errores de `react-hook-form` |
| 400 (negocio) | `IllegalArgumentException` | Toast con el `message` del backend |
| 401 | `BadCredentialsException` / JWT | Refresh; si falla, cerrar sesión |
| 403 | `@PreAuthorize` | Pantalla "sin permiso" — no reintentar |
| 404 | `AppException.notFound` | Estado vacío contextual, no toast |
| **409** | `IllegalStateException` | **Conflicto de negocio** — "perfil ya completado", "suscripción no activa", "plan lleno". Requiere mensaje específico por contexto, no genérico. Hoy no se trata en absoluto. |
| 429 | Rate limit (login, password-reset) | Mostrar cooldown en la UI |
| 500 | `handleGeneral` | Toast genérico + Error Boundary |

### 9.3 Dónde se muestra qué

- **Errores de campo** → inline, en el formulario.
- **Errores de acción** (mutaciones) → toast (`sonner`, ya instalado).
- **Errores de carga** (queries) → estado de error en el bloque, con reintento. No toast: es ruido en un fallo de red.
- **Errores de render** → Error Boundary por segmento de ruta (`error.tsx` de App Router).

Los mensajes del backend están en español y son de calidad de producto ("El password debe contener al menos una mayúscula y un número"). **Mostrarlos**, no sustituirlos por genéricos.

---

## 10. Estrategia de testing

No hay tests ni runner. Propuesta pragmática, en orden de valor:

**Herramientas:** Vitest + Testing Library + **MSW** (indispensable: permite testear contra las formas *reales* del backend).

**Prioridad 1 — Mappers (mayor valor por línea).** Son funciones puras y son la defensa contra C5. Un test por mapper con un fixture JSON **copiado de una respuesta real del backend**, no escrito a mano. Si el backend cambia, el test falla antes que la UI.

**Prioridad 2 — Sesión y refresh.** Rotación de token, refresh concurrente deduplicado, fallo de refresh → logout limpio, guard de rol. Es donde un bug tiene peor coste.

**Prioridad 3 — Repositorios contra MSW.** Verifican método, ruta, query params y parseo. Rápidos.

**Prioridad 4 — Componentes críticos.** Editores de plan (árbol anidado → DTO correcto), formularios de auth (reglas de validación).

**No perseguir cobertura en:** primitivos de `components/ui/` (upstream de shadcn), páginas que solo componen.

**Fixtures de contrato.** Guardar respuestas reales en `src/test/fixtures/<feature>.json` y usarlas tanto en tests de mapper como en handlers de MSW. Una única fuente de verdad sobre lo que el backend devuelve — que es exactamente lo que hoy falta.

**CI.** `pnpm typecheck && pnpm lint && pnpm test` como criterio de salida de cada fase.

---

## 11. Primera fase recomendada

### Empezar por la FASE 0, y dentro de ella por los tres bugs críticos

La razón es de dependencia, no de preferencia: **cualquier código escrito antes de arreglar C2 y C4 habrá que reescribirlo.** Conectar la Fase 3 hoy significa escribir mutaciones de pause/resume que devuelven 500, descubrirlo, y volver.

Orden concreto:

**1. `core/http/errors.ts` + `pagination.ts`** — normalización de las dos formas de error y `PageResponse<T>`. Puro, testeable, sin dependencias.

**2. Reescribir `app/api/backend/[...path]/route.ts`** — arregla C2 y C4 de una vez:
- `new NextResponse(null, { status })` para 204/205/304
- passthrough de `Content-Type` y del body como stream (multipart y binario)
- propagar los headers relevantes del upstream

**3. Nueva ruta `app/api/media/[...path]/route.ts`** — proxy autenticado de streaming para `/api/files/**`, con caché. Desbloquea avatares e imágenes en todas las fases posteriores.

**4. `server/{jwt,session,upstream}.ts`** — decodificación de claims y sesión ampliada. Prepara la Fase 1 y elimina los valores hardcodeados de M1.

**5. Vitest + MSW + los primeros fixtures** — para que la Fase 1 pueda escribirse con tests desde el inicio.

**Criterio de salida de la Fase 0:** `tsc --noEmit` y `eslint` limpios (hoy `tsc` pasa — mantener esa línea base), un 204 atraviesa el proxy sin error, un binario se descarga íntegro, y los tests corren en CI.

### Inmediatamente después: FASE 1

Con C1 y C3 arreglados. Sin esto no hay sesión real y **el resto del roadmap no es demostrable contra el backend**.

### Dos decisiones a tomar antes de escribir código

**1. A1 — `/api/subscriptions/students` sin identidad del alumno.** Es la única cuestión que requiere cambio en el backend, y bloquea la Fase 3. Conviene abrirla ahora para que llegue resuelta. Mi recomendación: pedir `TrainerStudentResponseDTO` con `StudentSummary` embebido, en vez de construir el puente N+1.

**2. A4 — el modo mock.** Recomiendo **eliminar `lib/mock-api.ts` y `lib/mock-data.ts`** en la Fase 0 y sustituir el modo demo por handlers de MSW alimentados con los fixtures de contrato reales. Mismo beneficio (app explorable sin backend), sin el coste de mantener un segundo conjunto de contratos inventados que hoy oculta que la integración real no funciona.

---

## Anexo — Contratos verificados

Leídos directamente de `../fitness-backend/src/main/java`. Los DTOs de request de las Fases 8–11 no se han transcrito en detalle; se documentarán al abordar cada fase.

| Endpoint | Request | Response |
|---|---|---|
| `POST /auth/login` | `{email, password}` | `{email, firstName, message, jwt, refreshToken, accountVerified}` |
| `POST /auth/trainer/register` | `{email, password, phone?}` — pwd: min 8, ≥1 mayús., ≥1 dígito | `AuthResponseDTO` |
| `POST /auth/register/verify-otp` | `{email, code}` | `{message}` |
| `POST /auth/register/resend-otp` | `{email}` | **204** |
| `POST /auth/password-reset/request` | `{email}` | `{message}` |
| `POST /auth/password-reset/verify` | `{email, code}` | `{message}` |
| `POST /auth/password-reset/confirm` | `{email, code, newPassword}` | `{message}` |
| `POST /auth/refresh` | `{refreshToken}` | `AuthResponseDTO` (tokens rotados) |
| `POST /auth/logout` | `{refreshToken}` (opcional) | `{message}` |
| `GET /api/user-detail` | — | `{userId, email, phone, firstName, lastName, birthDate, gender, pathProfilePicture, country}` |
| `GET/PUT /api/users/preferences` | `{onboardingMode}` | `{onboardingMode}` |
| `POST /api/trainer/profile/complete` | `{firstName, lastName, birthDate?, gender?, country?, description?, basePrice?, experienceYears?, location?, profileImageUrl?, specialtyIds[], certifications[]}` | **`AuthResponseDTO`** (JWT nuevo) · 201 |
| `GET /api/trainer/profile` | — | `{id, fullName, profileImageUrl, description, basePrice, experienceYears, location, avgRating, totalReviews, currentStudents, specialties[], certifications[]}` |
| `PUT /api/trainer/profile` | `{description?, basePrice?, experienceYears?, location?, profileImageUrl?, specialtyIds[], certifications[]}` | `TrainerProfileResponseDTO` |
| `POST /api/plans` | `{name, description?, price, billingPeriod, maxStudents?, includesNutrition}` | `SubscriptionPlanResponseDTO` · 201 |
| `DELETE /api/plans/{id}` | — | **204** |
| `GET /api/subscriptions/students` | — | `SubscriptionResponseDTO[]` ⚠️ **sin datos del alumno (A1)** |
| `PATCH /api/subscriptions/{id}/pause`·`/resume` | — | **204** (409 si el estado no lo permite) |
| `GET /api/subscriptions/{id}` | — | `{id, status, student{id,fullName,profileImageUrl}, trainer{…}, plan{…}, startedAt, expiresAt, cancelledAt, paymentProvider, externalPaymentId}` |
| `POST /api/training-plans` | `{subscriptionId, title, notes?, days[{dayNumber, label?, restDay, exercises[{order, name?, catalogExerciseId?, sets?, reps?, weightValue?, weightUnit?, restSeconds?, durationSeconds?, mediaUrl?, trainerNotes?}]}]}` | `TrainingPlanResponseDTO` |
| `PUT /api/training-plans/{id}` | `{title, notes?, days[…]}` | `TrainingPlanResponseDTO` (versión nueva) |
| `GET /api/training-plans/subscription/{id}/history` | — | `TrainingPlanResponseDTO[]` (**completo**, no resumen) |
| `GET /api/training-plans/trainer/students` | — | `{subscriptionId, studentId, studentFullName, studentImageUrl, currentPlan}[]` |
| `POST /api/nutrition-plans` | `{subscriptionId, title, notes?, meals[{order, name, timeOfDay, calories?, proteinG?, carbsG?, fatG?, notes?, foods[{foodName, quantity, unit}]}]}` | `NutritionPlanResponseDTO` |
| `POST /api/exercises/{id}/videos` | **multipart/form-data**, campo `file` | `{id, exerciseId, originalFileName, contentType, fileSizeBytes, url, uploadedByTrainerId, createdAt}` |
| `GET /api/catalog-exercises` | `?search&muscleGroup&equipment&page=0&size=20` | `Page<CatalogExerciseSummaryDTO>` |
| `GET /api/foods` | `?q&category&page&size` | `Page<FoodResponseDTO>` |
| `GET /api/progress/subscription/{id}` | — | `{id, subscriptionId, weightKg, bodyFatPct, chestCm, waistCm, hipsCm, armsCm, thighsCm, photoUrl, notes, recordedAt, createdAt}[]` |
| `GET /api/notifications` | `?page&size` | `Page<NotificationResponseDTO>` |
| `PATCH /api/notifications/read-all` | — | **204** |
| `DELETE /api/account` | — | **204** |
| `GET /api/trainers` | `?location&specialty&search&minRating&maxPrice&page&size` | `Page<TrainerSummaryResponseDTO>` · **público** |
| `GET /api/specialties` · `/search?q=` | — | `Specialty[]` · **público** |

**Configuración relevante del backend:** access token 30 min · refresh token 30 días (rotado en cada uso) · CORS por defecto `http://localhost:3000,http://localhost:8081,exp://localhost:8081` · `storage.provider=local` por defecto · público: `/auth/**`, `/api/trainers/**`, `/api/specialties/**`, `/api/payments/webhook/**`, swagger · **todo lo demás autenticado, incluido `/api/files/**`**.

**Swagger disponible** en `/swagger-ui.html` y `/v3/api-docs` — recomendable generar tipos desde el OpenAPI para los DTOs de las fases posteriores, en vez de transcribirlos a mano.
