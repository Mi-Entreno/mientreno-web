"use client"

import { ApiError, networkError, normalizeError } from "@/core/http/errors"
import type { AvatarUploadResult } from "./image"

/**
 * Uploads a profile photo, reporting progress.
 *
 * `XMLHttpRequest` rather than `fetch`, for the same reason
 * `exercises.repository.ts` does it: fetch cannot report *upload* progress, and
 * a transfer with no feedback is indistinguishable from a hang on a phone.
 *
 * Errors come back as `ApiError`, so the caller reports them through
 * `core/http/user-message.ts` like every other failure in the app.
 */
export function uploadAvatar(
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = new FormData()
    body.append("file", file)

    const request = new XMLHttpRequest()
    request.open("POST", "/api/uploads/avatar")
    request.withCredentials = true

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100))
      }
    })

    request.addEventListener("load", () => {
      let parsed: unknown
      try {
        parsed = request.responseText ? JSON.parse(request.responseText) : undefined
      } catch {
        parsed = undefined
      }

      if (request.status >= 200 && request.status < 300) {
        const url = (parsed as AvatarUploadResult | undefined)?.url
        if (typeof url === "string" && url) {
          resolve(url)
          return
        }
        reject(new ApiError({ kind: "unknown", status: request.status, message: "Respuesta vacía" }))
        return
      }

      reject(new ApiError(normalizeError(request.status, parsed)))
    })

    request.addEventListener("error", () => reject(new ApiError(networkError())))
    request.addEventListener("abort", () =>
      reject(new ApiError({ kind: "network", message: "La subida se canceló" })),
    )

    signal?.addEventListener("abort", () => request.abort(), { once: true })

    request.send(body)
  })
}
