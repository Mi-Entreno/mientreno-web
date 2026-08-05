/**
 * Rewrites backend file URLs so the browser can actually load them.
 *
 * With `storage.provider=local` (the backend default) `LocalFileStorageService`
 * stores absolute URLs of the form `${baseUrl}/api/files/${key}`, and
 * `/api/files/**` sits behind `anyRequest().authenticated()`. A plain
 * `<img src>` or `<video src>` never sends an `Authorization` header, so every
 * avatar, progress photo and exercise video would 401.
 *
 * `/api/media/[...path]` is our authenticated streaming proxy. Mappers run
 * every URL-bearing field through `toMediaUrl` so no component has to know any
 * of this.
 *
 * With `storage.provider=s3` the backend returns CDN URLs that are already
 * public; those are passed through untouched.
 */

const LOCAL_FILES_SEGMENT = "/api/files/"

export function toMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null

  const trimmed = url.trim()
  if (!trimmed) return null

  // Already relative to our own origin.
  if (trimmed.startsWith("/api/media/")) return trimmed

  const index = trimmed.indexOf(LOCAL_FILES_SEGMENT)
  if (index === -1) {
    // Not a locally-stored file: an S3/CDN URL, a data URI or an external
    // avatar. Leave it alone.
    return trimmed
  }

  const key = trimmed.slice(index + LOCAL_FILES_SEGMENT.length)
  if (!key) return null

  return `/api/media/${key}`
}

/** `toMediaUrl` with a placeholder fallback, for `<img src>` and `<Avatar>`. */
export function toMediaUrlOr(url: string | null | undefined, fallback: string): string {
  return toMediaUrl(url) ?? fallback
}
