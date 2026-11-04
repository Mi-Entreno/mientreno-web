import { type NextRequest, NextResponse } from "next/server"

import { rejectImage, rejectionMessage } from "@/core/media/image"
import { serverEnv } from "@/core/config/env"
import { ensureFreshSession } from "@/server/upstream"

/**
 * Profile photo upload.
 *
 * Forwards to `POST /api/users/me/profile-picture` (`ProfilePictureController`),
 * which stores the file, writes it to `UserDetail` **and** to the denormalized
 * `Trainer.profileImageUrl`, deletes the previous file and answers
 * `ProfilePictureResponseDTO { profileImageUrl }`. So the photo is saved the
 * moment the upload succeeds; the URL handed back to the form only keeps the
 * later profile `PUT` from overwriting it with the old value.
 *
 * This used to target `POST /api/files`, the generic endpoint proposed in
 * `docs/BACKEND_CHANGE_REQUEST.md` (petición 7). The backend shipped a
 * profile-specific one instead and `/api/files` only serves GET, so every
 * upload came back 405/404 and the UI said "todavía no está disponible".
 *
 * Kept as a handler rather than `apiFetch` to the proxy so the app talks to one
 * stable endpoint of ours: moving to a different store later is a change in
 * this file, not in every form. `UPSTREAM_UPLOAD_PATH` is the whole seam.
 */
const UPSTREAM_UPLOAD_PATH = "/api/users/me/profile-picture"

export async function POST(req: NextRequest) {
  const session = await ensureFreshSession()
  if (!session) {
    return NextResponse.json({ message: "Tu sesión expiró" }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ message: "No pudimos leer el archivo." }, { status: 400 })
  }

  const part = form.get("file")
  if (!(part instanceof File)) {
    return NextResponse.json({ message: "No pudimos leer el archivo." }, { status: 400 })
  }

  const file = withDeclaredType(part)

  // The browser checked this too, but a handler must never trust its client:
  // this is the boundary where the bytes stop being the user's problem.
  const rejection = rejectImage(file)
  if (rejection) {
    return NextResponse.json(
      { message: rejectionMessage(rejection) },
      { status: rejection.reason === "size" ? 413 : 415 },
    )
  }

  let url: string
  try {
    url = `${serverEnv().API_URL}${UPSTREAM_UPLOAD_PATH}`
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Configuración de entorno inválida" },
      { status: 500 },
    )
  }

  const body = new FormData()
  // Matches `@RequestParam("file") MultipartFile`.
  body.append("file", file, file.name)

  let upstream: Response
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body,
      cache: "no-store",
    })
  } catch {
    return NextResponse.json(
      { message: "Estamos teniendo un pequeño inconveniente. Intentá nuevamente en unos minutos." },
      { status: 502 },
    )
  }

  // 404 and 405 mean the endpoint is not deployed yet — a different problem
  // from a rejected file, and the one the UI explains rather than retries.
  if (upstream.status === 404 || upstream.status === 405) {
    return NextResponse.json(
      { message: "La subida de fotos todavía no está disponible.", unavailable: true },
      { status: 501 },
    )
  }

  const text = await upstream.text().catch(() => "")
  let payload: unknown
  try {
    payload = text ? JSON.parse(text) : undefined
  } catch {
    payload = undefined
  }

  if (!upstream.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? String((payload as { message: unknown }).message)
        : "No pudimos subir la imagen. Volvé a intentarlo."
    return NextResponse.json({ message }, { status: upstream.status })
  }

  const stored = readStoredUrl(payload)
  if (!stored) {
    return NextResponse.json(
      { message: "No pudimos subir la imagen. Volvé a intentarlo." },
      { status: 502 },
    )
  }

  return NextResponse.json({ url: stored })
}

/** `ProfilePictureResponseDTO.profileImageUrl`. */
function readStoredUrl(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null
  const value = (payload as Record<string, unknown>).profileImageUrl
  return typeof value === "string" && value.trim() ? value.trim() : null
}

const TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
}

/**
 * A file the browser could not type (`rejectImage` accepts those by extension)
 * arrives here as `application/octet-stream`. Without this, our own check
 * answers 415 and, past it, the backend's Content-Type allowlist answers 400.
 */
function withDeclaredType(file: File): File {
  if (file.type && file.type !== "application/octet-stream") return file
  const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
  const type = TYPE_BY_EXTENSION[extension]
  return type ? new File([file], file.name, { type }) : file
}

export const maxDuration = 30
