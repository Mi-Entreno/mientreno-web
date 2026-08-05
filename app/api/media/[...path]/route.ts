import type { NextRequest } from "next/server"

import { proxyToUpstream } from "@/server/upstream"

/**
 * Authenticated media proxy for `/api/files/**`.
 *
 * With `storage.provider=local` — the backend default — uploaded avatars,
 * progress photos and exercise videos are served by `FileController`, which
 * sits behind `anyRequest().authenticated()`. A browser loading
 * `<img src="http://backend/api/files/...">` sends no `Authorization` header,
 * so every one of those requests 401s.
 *
 * Routing them through here attaches the session token server-side. Mappers
 * rewrite backend URLs to `/api/media/*` via `core/http/media.ts`, so
 * components stay unaware of any of this.
 *
 * Only GET and HEAD: this is a read path. `Range` requests are forwarded, which
 * is what lets exercise videos seek.
 */
async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params

  const response = await proxyToUpstream(req, `/api/files/${path.join("/")}`)

  // Stored files are content-addressed by the backend and never rewritten in
  // place, so they are safe to cache per-user for a while.
  if (response.ok && !response.headers.has("cache-control")) {
    response.headers.set("Cache-Control", "private, max-age=3600")
  }

  return response
}

export { handler as GET, handler as HEAD }
