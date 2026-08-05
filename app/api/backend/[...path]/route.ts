import type { NextRequest } from "next/server"

import { proxyToUpstream } from "@/server/upstream"

/**
 * Authenticated passthrough to the Spring Boot API.
 *
 * The JWT lives in an httpOnly cookie and is attached here, server-side, so it
 * is never reachable from client JS. Token refresh happens inside
 * `proxyToUpstream`, so the backend's 30-minute access token no longer ends
 * the session.
 *
 * Requests and responses stream through verbatim: multipart uploads and binary
 * downloads stay intact, and 204s stay body-less.
 */
async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxyToUpstream(req, `/${path.join("/")}`)
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE }
