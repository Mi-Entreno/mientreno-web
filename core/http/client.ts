"use client"

import { ApiError, networkError, normalizeError, readErrorBody } from "./errors"

/**
 * The single network entry point for client components.
 *
 * Everything goes through `/api/backend/*`, the BFF proxy, which attaches the
 * JWT from the httpOnly session cookie server-side. No token ever reaches
 * client JS.
 *
 * Unlike the previous implementation this does **not** redirect on 401. Burying
 * `window.location.href` in the transport layer made every caller unable to
 * handle auth failure differently, broke tests and raced with the router. Auth
 * failures now surface as a typed `ApiError` and are handled centrally in
 * `components/providers.tsx`.
 */

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  /** Serialised as JSON. Mutually exclusive with `formData`. */
  body?: unknown
  /** Sent as multipart/form-data — used by exercise video upload. */
  formData?: FormData
  query?: Record<string, string | number | boolean | null | undefined>
  signal?: AbortSignal
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = `/api/backend${path.startsWith("/") ? path : `/${path}`}`
  if (!query) return url

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") continue
    params.append(key, String(value))
  }

  const search = params.toString()
  return search ? `${url}?${search}` : url
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, formData, query, signal } = options

  const init: RequestInit = {
    method,
    credentials: "include",
    signal,
  }

  if (formData) {
    // Deliberately no Content-Type: the browser must set the multipart
    // boundary itself.
    init.body = formData
  } else if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" }
    init.body = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), init)
  } catch (cause) {
    throw new ApiError(networkError(cause))
  }

  if (!response.ok) {
    throw new ApiError(normalizeError(response.status, await readErrorBody(response)))
  }

  // 204 No Content is the documented success shape for pause, resume, every
  // DELETE, and PATCH /notifications/read-all.
  if (response.status === 204 || response.status === 205) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) return undefined as T

  try {
    return JSON.parse(text) as T
  } catch {
    throw new ApiError({
      kind: "unknown",
      status: response.status,
      message: "La respuesta del servidor no es válida",
    })
  }
}
