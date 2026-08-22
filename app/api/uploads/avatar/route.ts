import { type NextRequest, NextResponse } from "next/server"

import { rejectImage, rejectionMessage } from "@/core/media/image"
import { serverEnv } from "@/core/config/env"
import { ensureFreshSession } from "@/server/upstream"

/**
 * Profile photo upload.
 *
 * ## Why this is a handler and not `apiFetch` straight to the proxy
 *
 * The upload target is the one thing about this feature that is not settled.
 * `LocalFileStorageService` already stores files and serves them from
 * `/api/files/**`, but the only multipart *ingest* the backend exposes today is
 * `POST /api/exercises/{id}/videos`, which is scoped to an exercise and cannot
 * take an avatar. `profileImageUrl` and `pathProfilePicture` are plain String
 * columns, so whatever stores the bytes only has to hand back a URL.
 *
 * Keeping that decision behind this route means the app talks to one stable
 * endpoint of ours, and moving to a different store later is a change in this
 * file rather than in every form. `UPSTREAM_UPLOAD_PATH` is the whole seam.
 *
 * Requested upstream in `docs/BACKEND_CHANGE_REQUEST.md`, petición 7.
 */
const UPSTREAM_UPLOAD_PATH = "/api/files"

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

  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "No pudimos leer el archivo." }, { status: 400 })
  }

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
  // Matches `@RequestParam("file") MultipartFile`, the shape the video endpoint
  // already uses.
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

/**
 * Reads the stored location out of whatever the upload answered.
 *
 * The response shape is not pinned down yet, so the three plausible spellings
 * are all accepted rather than betting on one: `ExerciseVideoResponseDTO` calls
 * it `url`, and a generic file endpoint might just as well answer `fileUrl` or
 * a bare string.
 */
function readStoredUrl(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) return payload.trim()
  if (typeof payload !== "object" || payload === null) return null

  const record = payload as Record<string, unknown>
  for (const key of ["url", "fileUrl", "path", "location"]) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }

  return null
}

export const maxDuration = 30
