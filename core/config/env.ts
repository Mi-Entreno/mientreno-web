import "server-only"

import { z } from "zod"

/**
 * Server-only environment.
 *
 * `API_URL` deliberately drops the `NEXT_PUBLIC_` prefix it used to carry: the
 * upstream URL is only ever read inside `app/api/**` and `server/**`, and the
 * public prefix was inlining the internal backend address into the client
 * bundle.
 *
 * No trailing `/api`: route paths already include it
 * (`/api/subscriptions/students`, ...). Auth routes sit at `/auth/*`.
 */
const schema = z.object({
  API_URL: z
    .string()
    .url("API_URL debe ser una URL absoluta, p.ej. http://localhost:8080")
    .transform((value) => value.replace(/\/+$/, "")),
})

let cached: z.infer<typeof schema> | null = null

/**
 * Validates on first use rather than at module load so that a missing variable
 * surfaces as a 500 on the request that needed it, with a readable message,
 * instead of breaking `next build` for unrelated pages.
 */
export function serverEnv() {
  if (cached) return cached

  const parsed = schema.safeParse({ API_URL: process.env.API_URL })

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ")

    // Names the fix, because the symptom (requests failing) looks identical to
    // a backend that is down. `.env.example` is a template — Next only reads
    // `.env` and `.env.local`.
    throw new Error(
      `Falta configuración: ${detail}. Copia .env.example a .env y reinicia el servidor.`,
    )
  }

  cached = parsed.data
  return cached
}
