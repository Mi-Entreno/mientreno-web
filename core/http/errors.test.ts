import { describe, expect, it } from "vitest"

import { ApiError, normalizeError, readErrorBody } from "./errors"

/**
 * Fixtures copied from the two shapes `GlobalExceptionHandler` actually emits.
 */
describe("normalizeError", () => {
  it("reads a bean-validation body as field errors", () => {
    // MethodArgumentNotValidException -> Map<String, String>
    const body = {
      password: "El password debe contener al menos una mayúscula y un número",
      email: "Debe ingresar un email valido",
    }

    const result = normalizeError(400, body)

    expect(result).toEqual({ kind: "validation", status: 400, fields: body })
  })

  it("keeps the backend copy instead of a generic message", () => {
    // The old client only read `data.message`, so validation 400s surfaced as
    // "Request failed (400)" and this text was discarded.
    const error = new ApiError(
      normalizeError(400, { password: "El password debe tener al menos 8 caracteres" }),
    )

    expect(error.message).toBe("El password debe tener al menos 8 caracteres")
    expect(error.fieldErrors.password).toBe("El password debe tener al menos 8 caracteres")
  })

  it("reads an ErrorResponse body as a business failure", () => {
    const body = { message: "La suscripción no está activa", status: 409, timestamp: "2026-07-25T10:00:00Z" }

    expect(normalizeError(409, body)).toEqual({
      kind: "business",
      status: 409,
      message: "La suscripción no está activa",
    })
  })

  it("does not mistake an ErrorResponse for field errors", () => {
    // Both are objects of strings; `message`/`status` is what separates them.
    const result = normalizeError(400, { message: "JSON mal formado", status: 400 })

    expect(result.kind).toBe("business")
  })

  it("classifies 401 and 403 as auth failures", () => {
    expect(normalizeError(401, { message: "Credenciales inválidas" })).toMatchObject({
      kind: "auth",
      status: 401,
    })
    expect(normalizeError(403, undefined)).toMatchObject({ kind: "auth", status: 403 })
  })

  it("classifies 429 separately so the UI can show a cooldown", () => {
    expect(normalizeError(429, undefined).kind).toBe("rate-limit")
  })

  it("falls back to Spanish copy when the body carries no message", () => {
    expect(normalizeError(404, undefined)).toMatchObject({
      kind: "business",
      message: "No encontramos lo que buscabas",
    })
  })

  it("ignores a blank upstream message", () => {
    expect(normalizeError(500, { message: "   " })).toMatchObject({
      message: "Estamos teniendo un pequeño inconveniente",
    })
  })
})

describe("readErrorBody", () => {
  it("parses a JSON error body", async () => {
    const body = await readErrorBody(
      new Response(JSON.stringify({ message: "Credenciales inválidas" }), { status: 401 }),
    )

    expect(body).toEqual({ message: "Credenciales inválidas" })
  })

  it("keeps a short plain-text body as the message", async () => {
    expect(await readErrorBody(new Response("Gateway timeout", { status: 504 }))).toEqual({
      message: "Gateway timeout",
    })
  })

  it("discards an HTML body instead of showing it to the user", async () => {
    // A 404 from the Next router, a proxy error page or a gateway notice all
    // arrive as HTML. Passing one through put a 10 KB document into a toast.
    const html = `<!DOCTYPE html><html><body>${"x".repeat(500)}</body></html>`

    expect(await readErrorBody(new Response(html, { status: 404 }))).toBeUndefined()
  })

  it("discards a long plain-text body, such as a stack trace", async () => {
    expect(await readErrorBody(new Response("y".repeat(400), { status: 500 }))).toBeUndefined()
  })

  it("falls back to status copy once the body is discarded", async () => {
    const body = await readErrorBody(new Response("<html>404</html>", { status: 404 }))

    expect(new ApiError(normalizeError(404, body)).message).toBe(
      "No encontramos lo que buscabas",
    )
  })

  it("returns undefined for an empty body", async () => {
    expect(await readErrorBody(new Response("", { status: 500 }))).toBeUndefined()
  })
})

describe("ApiError", () => {
  it("exposes status and auth-failure flags", () => {
    const authError = new ApiError(normalizeError(403, undefined))
    expect(authError.status).toBe(403)
    expect(authError.isAuthFailure).toBe(true)

    const businessError = new ApiError(normalizeError(409, { message: "Conflicto" }))
    expect(businessError.isAuthFailure).toBe(false)
    expect(businessError.fieldErrors).toEqual({})
  })

  it("reports no status for a network failure", () => {
    const error = new ApiError({ kind: "network", message: "sin conexión" })
    expect(error.status).toBeNull()
  })
})
