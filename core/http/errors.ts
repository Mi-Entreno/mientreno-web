/**
 * Normalises the two error shapes the Spring Boot backend emits.
 *
 * `GlobalExceptionHandler` returns:
 *   - `record ErrorResponse(String message, int status, Instant timestamp)`
 *     for AppException / BadCredentials / IllegalArgument / IllegalState /
 *     HttpMessageNotReadable / generic 500.
 *   - a bare `Map<String, String>` of field -> message for
 *     `MethodArgumentNotValidException` (bean-validation 400s).
 *
 * The old client only read `data.message`, so a validation 400 surfaced as
 * "Request failed (400)" and the actual backend copy — which is good,
 * user-facing Spanish — was thrown away.
 */

export type NormalizedError =
  /** Bean-validation failure: field name -> message. Feed into react-hook-form. */
  | { kind: "validation"; status: 400; fields: Record<string, string> }
  /** Business rule rejection carrying a displayable message. */
  | { kind: "business"; status: number; message: string }
  /** Missing/expired credentials (401) or insufficient role (403). */
  | { kind: "auth"; status: 401 | 403; message: string }
  /** Rate limiting — login and password-reset are throttled upstream. */
  | { kind: "rate-limit"; status: 429; message: string }
  /** Request never reached the backend. */
  | { kind: "network"; message: string }
  | { kind: "unknown"; status: number; message: string }

export class ApiError extends Error {
  readonly normalized: NormalizedError

  constructor(normalized: NormalizedError) {
    super(messageOf(normalized))
    this.name = "ApiError"
    this.normalized = normalized
  }

  get status(): number | null {
    return "status" in this.normalized ? this.normalized.status : null
  }

  get kind(): NormalizedError["kind"] {
    return this.normalized.kind
  }

  /** True when retrying cannot help: the caller is not allowed, full stop. */
  get isAuthFailure(): boolean {
    return this.normalized.kind === "auth"
  }

  /** Field errors, or an empty object for non-validation failures. */
  get fieldErrors(): Record<string, string> {
    return this.normalized.kind === "validation" ? this.normalized.fields : {}
  }
}

/**
 * Wording of last resort, for a response whose body carried no message.
 *
 * These are already user-facing: `core/http/user-message.ts` overrides the
 * server-side ones anyway, but an `ApiError` can be read directly and must not
 * hand a technical string to whoever does.
 */
const FALLBACK: Record<number, string> = {
  400: "Revisá los datos e intentá nuevamente",
  401: "Tu sesión expiró",
  403: "No tenés permiso para hacer esto",
  404: "No encontramos lo que buscabas",
  409: "Esto ya no se puede hacer: algo cambió mientras tanto",
  429: "Probaste demasiadas veces. Esperá un momento e intentá de nuevo",
  500: "Estamos teniendo un pequeño inconveniente",
}

export function messageOf(error: NormalizedError): string {
  switch (error.kind) {
    case "validation": {
      const first = Object.values(error.fields)[0]
      return first ?? FALLBACK[400]
    }
    default:
      return error.message
  }
}

/**
 * A bean-validation body is a flat object of string values with no `message`
 * and no `status` key — that is what separates it from `ErrorResponse`.
 */
function isValidationBody(body: unknown): body is Record<string, string> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return false
  const record = body as Record<string, unknown>
  if ("message" in record || "status" in record) return false
  const entries = Object.entries(record)
  return entries.length > 0 && entries.every(([, value]) => typeof value === "string")
}

function isErrorResponseBody(body: unknown): body is { message?: unknown; status?: unknown } {
  return typeof body === "object" && body !== null && ("message" in body || "status" in body)
}

/**
 * Turns an HTTP status + parsed body into a `NormalizedError`.
 * `body` may be `undefined` when the response had no readable payload.
 */
export function normalizeError(status: number, body: unknown): NormalizedError {
  if (status === 400 && isValidationBody(body)) {
    return { kind: "validation", status: 400, fields: body }
  }

  const upstreamMessage =
    isErrorResponseBody(body) && typeof body.message === "string" && body.message.trim().length > 0
      ? body.message
      : null

  const message = upstreamMessage ?? FALLBACK[status] ?? "Algo salió mal. Por favor, intentá nuevamente"

  if (status === 401 || status === 403) {
    return { kind: "auth", status, message }
  }

  if (status === 429) {
    return { kind: "rate-limit", status: 429, message }
  }

  if (status >= 400) {
    return { kind: "business", status, message }
  }

  return { kind: "unknown", status, message }
}

export function networkError(cause?: unknown): NormalizedError {
  return {
    kind: "network",
    message:
      cause instanceof Error && cause.name === "AbortError"
        ? "La solicitud se canceló"
        : "No pudimos conectarnos. Revisá tu conexión e intentá de nuevo",
  }
}

/**
 * The longest non-JSON body still plausible as something to show a user.
 * Anything past this is a page, a stack trace or a dump — not a message.
 */
const MAX_PLAIN_TEXT_MESSAGE = 200

/**
 * Reads a response body as JSON, tolerating empty and non-JSON payloads.
 *
 * A non-JSON body is only trusted as a message when it is short and does not
 * look like markup. Not every error on the wire comes from the API: a 404 from
 * the Next router, a gateway timeout or a proxy error page all arrive as HTML,
 * and passing that straight through put a 10 KB document into a toast.
 */
export async function readErrorBody(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => "")
  if (!text) return undefined

  try {
    return JSON.parse(text)
  } catch {
    const trimmed = text.trim()

    if (trimmed.startsWith("<") || trimmed.length > MAX_PLAIN_TEXT_MESSAGE) {
      // Let `normalizeError` fall back to the status-based copy.
      return undefined
    }

    return { message: trimmed }
  }
}
