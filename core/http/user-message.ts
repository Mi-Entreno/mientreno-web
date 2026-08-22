import { ApiError, type NormalizedError } from "./errors"

/**
 * The single place that decides what a failure sounds like to a trainer.
 *
 * Before this module every screen invented its own wording, and a good third of
 * them simply forwarded `error.message` — which is whatever the Spring backend
 * happened to say. That leaked "Error interno del servidor", route names and
 * even references to an internal requirements document into the UI.
 *
 * The rule here is that the *kind* of failure decides, never the text. Some
 * backend messages are genuinely the best thing to show ("El email ya se
 * encuentra registrado", "Debés esperar 43 segundos"), and a text-matching
 * heuristic would eventually swallow one of them.
 */

/** Anything the app might fail at, phrased as the thing the user was doing. */
export type FailureContext =
  | "load"
  | "save"
  | "send"
  | "delete"
  | "upload"
  | "generic"

const GENERIC: Record<FailureContext, string> = {
  load: "No pudimos cargar esta información. Volvé a intentarlo.",
  save: "No pudimos guardar los cambios. Volvé a intentarlo.",
  send: "No pudimos enviarlo. Volvé a intentarlo.",
  delete: "No pudimos eliminarlo. Volvé a intentarlo.",
  upload: "No pudimos subir el archivo. Volvé a intentarlo.",
  generic: "Algo salió mal. Por favor, intentá nuevamente.",
}

/**
 * Anything at or above 500, plus a request that never arrived, is the same
 * story from the user's side: it is not their fault and retrying later may
 * work.
 */
const SERVER_TROUBLE = "Estamos teniendo un pequeño inconveniente. Intentá nuevamente en unos minutos."

/** A 404 on a collection endpoint means the feature is not deployed yet. */
const NOT_AVAILABLE_YET = "Esta sección todavía no está disponible."

const FORBIDDEN = "No tenés permiso para hacer esto."

/**
 * Guards against a "business" message that is really a technical one.
 *
 * `GlobalExceptionHandler` maps `IllegalArgumentException` and `IllegalState`
 * to the same `ErrorResponse` as a deliberate business rule, so a stack-ish
 * string can arrive with a 400 or 409. These checks catch the shapes that are
 * never user-facing copy; anything else is trusted, because the backend's
 * business messages are written in Spanish and aimed at the end user.
 */
const MAX_DISPLAYABLE_LENGTH = 160

function isDisplayable(message: string): boolean {
  const trimmed = message.trim()

  if (trimmed.length === 0 || trimmed.length > MAX_DISPLAYABLE_LENGTH) return false
  // Route names and internal document references.
  if (/\/(api|auth)\//.test(trimmed)) return false
  // Java class names, package paths and exception dumps.
  if (/\b(?:java|org|com)\.[a-z]/i.test(trimmed)) return false
  if (/Exception\b|\bat [A-Z][\w.]+\(/.test(trimmed)) return false
  // HTTP verbs typed out are a sign of a developer-facing string.
  if (/\b(GET|POST|PUT|PATCH|DELETE)\s+\//.test(trimmed)) return false

  return true
}

function fromNormalized(error: NormalizedError, context: FailureContext): string {
  switch (error.kind) {
    case "network":
      return SERVER_TROUBLE

    case "auth":
      // 401 never reaches a screen: `providers.tsx` clears the cache and
      // redirects. 403 is a live session without the right role or ownership.
      return error.status === 403 ? FORBIDDEN : SERVER_TROUBLE

    case "rate-limit":
      // The backend names the exact seconds remaining. Nothing we write beats that.
      return isDisplayable(error.message) ? error.message : GENERIC[context]

    case "validation": {
      const first = Object.values(error.fields)[0]
      return first && isDisplayable(first) ? first : GENERIC[context]
    }

    case "business":
      if (error.status >= 500) return SERVER_TROUBLE
      if (error.status === 404) return NOT_AVAILABLE_YET
      return isDisplayable(error.message) ? error.message : GENERIC[context]

    default:
      return error.status >= 500 ? SERVER_TROUBLE : GENERIC[context]
  }
}

/**
 * Turns anything thrown by the data layer into a sentence worth showing.
 *
 * `context` only decides the wording of the fallback, so a caller that has
 * nothing better to say still says something specific to what failed.
 */
export function userMessage(error: unknown, context: FailureContext = "generic"): string {
  return specificMessage(error) ?? GENERIC[context]
}

/**
 * The part of `userMessage` that has something real to say, or `null`.
 *
 * Lets a caller supply its own wording for the "nothing specific happened"
 * case — "No pudimos enviar la invitación" beats a generic sentence — without
 * having to re-derive when the generic case applies.
 */
export function specificMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null

  const message = fromNormalized(error.normalized, "generic")
  return message === GENERIC.generic ? null : message
}

/**
 * True when showing a "retry" affordance makes sense.
 *
 * A 403 or a validation failure will fail again in exactly the same way, and
 * offering a button that cannot work is worse than offering none.
 */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true

  switch (error.kind) {
    case "network":
      return true
    case "auth":
    case "validation":
      return false
    case "rate-limit":
      return false
    default:
      return error.status === null || error.status >= 500 || error.status === 408
  }
}

/** True when the failure means "the backend does not implement this yet". */
export function isMissingFeature(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}
