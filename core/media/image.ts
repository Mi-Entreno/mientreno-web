/**
 * Client-side gate for a profile photo, mirroring the shape of
 * `features/exercises/model/exercise.model.ts` — the project's existing upload
 * validation — so both uploads reject a file the same way.
 *
 * Checked before the request leaves rather than letting the server answer: a
 * rejected transfer is wasted bandwidth, and the message the user gets here is
 * exact ("la imagen pesa 8,4 MB y el máximo son 5 MB") instead of a status code.
 */

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

/** Shown in the hint and fed to the file input's `accept`. */
export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const

/**
 * 5 MB.
 *
 * Generous for an avatar — a 12-megapixel phone photo lands around 4 MB — and
 * small enough that the upload finishes on a mobile connection.
 */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export type ImageRejection =
  | { reason: "empty" }
  | { reason: "type"; actual: string }
  | { reason: "size"; bytes: number }

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`
}

function hasAllowedExtension(name: string): boolean {
  const lower = name.toLowerCase()
  return IMAGE_EXTENSIONS.some((extension) => lower.endsWith(extension))
}

/**
 * Returns why the file is unacceptable, or `null` when it is fine.
 *
 * The MIME type is trusted when the browser provides one, and the extension is
 * the fallback: some systems hand over an empty `type` for a file dragged from
 * an unusual source, and rejecting a legitimate `.png` for that would be wrong.
 */
export function rejectImage(file: File): ImageRejection | null {
  if (file.size === 0) return { reason: "empty" }

  const declared = file.type.toLowerCase()
  const typeIsAllowed = declared
    ? (ALLOWED_IMAGE_TYPES as readonly string[]).includes(declared)
    : hasAllowedExtension(file.name)

  if (!typeIsAllowed) {
    return { reason: "type", actual: declared || file.name }
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { reason: "size", bytes: file.size }
  }

  return null
}

export function rejectionMessage(rejection: ImageRejection): string {
  switch (rejection.reason) {
    case "empty":
      return "Ese archivo está vacío. Probá con otra imagen."
    case "type":
      return `Ese formato no sirve (${rejection.actual}). Usá ${IMAGE_EXTENSIONS.join(", ")}.`
    case "size":
      return `La imagen pesa ${formatBytes(rejection.bytes)} y el máximo son ${formatBytes(MAX_IMAGE_BYTES)}.`
  }
}

/** What `POST /api/uploads/avatar` answers. `url` goes into the profile field. */
export interface AvatarUploadResult {
  url: string
}
