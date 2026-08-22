import { describe, expect, it } from "vitest"

import { ApiError } from "./errors"
import { isMissingFeature, isRetryable, userMessage } from "./user-message"

const SERVER_TROUBLE = "Estamos teniendo un pequeño inconveniente. Intentá nuevamente en unos minutos."

describe("userMessage", () => {
  it("keeps a business message that is real user-facing copy", () => {
    const error = new ApiError({
      kind: "business",
      status: 400,
      message: "El email ya se encuentra registrado",
    })

    expect(userMessage(error, "save")).toBe("El email ya se encuentra registrado")
  })

  it("keeps the rate-limit message, which names the exact wait", () => {
    const error = new ApiError({
      kind: "rate-limit",
      status: 429,
      message: "Debés esperar 43 segundos antes de pedir otro código",
    })

    expect(userMessage(error)).toContain("43 segundos")
  })

  it("replaces the backend's 500 copy", () => {
    const error = new ApiError({
      kind: "business",
      status: 500,
      message: "Error interno del servidor",
    })

    expect(userMessage(error, "load")).toBe(SERVER_TROUBLE)
  })

  it("replaces a network failure", () => {
    const error = new ApiError({ kind: "network", message: "No se ha podido conectar" })

    expect(userMessage(error, "load")).toBe(SERVER_TROUBLE)
  })

  it("says a 404 feature is not available yet, without naming the route", () => {
    const error = new ApiError({
      kind: "business",
      status: 404,
      message: "No se ha encontrado el recurso",
    })

    const message = userMessage(error, "load")
    expect(message).toBe("Esta sección todavía no está disponible.")
    expect(message).not.toContain("/api")
  })

  it("explains a 403 rather than blaming the server", () => {
    const error = new ApiError({ kind: "auth", status: 403, message: "Forbidden" })

    expect(userMessage(error)).toBe("No tenés permiso para hacer esto.")
  })

  it("surfaces the first field error of a validation failure", () => {
    const error = new ApiError({
      kind: "validation",
      status: 400,
      fields: { email: "El correo no es válido" },
    })

    expect(userMessage(error, "save")).toBe("El correo no es válido")
  })

  it("falls back per context for a non-ApiError", () => {
    expect(userMessage(new Error("boom"), "load")).toBe(
      "No pudimos cargar esta información. Volvé a intentarlo.",
    )
    expect(userMessage(new Error("boom"), "upload")).toBe(
      "No pudimos subir el archivo. Volvé a intentarlo.",
    )
    expect(userMessage(undefined)).toBe("Algo salió mal. Por favor, intentá nuevamente.")
  })

  describe("rejects technical strings that arrive as business errors", () => {
    const cases: [string, string][] = [
      ["a route name", "No existe GET /api/plan-invitations/sent"],
      ["a document reference", "Ver /api/docs para el contrato"],
      ["a Java exception", "java.lang.IllegalStateException: no session"],
      ["a stack trace", "NullPointerException at com.mientreno.Service(Service.java:42)"],
      ["a dump", "x".repeat(400)],
      ["an empty message", "   "],
    ]

    it.each(cases)("%s", (_label, message) => {
      const error = new ApiError({ kind: "business", status: 409, message })

      expect(userMessage(error, "save")).toBe("No pudimos guardar los cambios. Volvé a intentarlo.")
    })
  })
})

describe("isRetryable", () => {
  it("is true for network and 5xx", () => {
    expect(isRetryable(new ApiError({ kind: "network", message: "x" }))).toBe(true)
    expect(isRetryable(new ApiError({ kind: "business", status: 503, message: "x" }))).toBe(true)
  })

  it("is false when retrying cannot change the outcome", () => {
    expect(isRetryable(new ApiError({ kind: "auth", status: 403, message: "x" }))).toBe(false)
    expect(isRetryable(new ApiError({ kind: "validation", status: 400, fields: {} }))).toBe(false)
    expect(isRetryable(new ApiError({ kind: "rate-limit", status: 429, message: "x" }))).toBe(false)
    expect(isRetryable(new ApiError({ kind: "business", status: 404, message: "x" }))).toBe(false)
  })
})

describe("isMissingFeature", () => {
  it("only matches a 404", () => {
    expect(isMissingFeature(new ApiError({ kind: "business", status: 404, message: "x" }))).toBe(true)
    expect(isMissingFeature(new ApiError({ kind: "business", status: 500, message: "x" }))).toBe(false)
    expect(isMissingFeature(new Error("x"))).toBe(false)
  })
})
