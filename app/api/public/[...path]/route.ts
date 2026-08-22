import { type NextRequest, NextResponse } from "next/server"

import { serverEnv } from "@/core/config/env"
import { isPublicRoute } from "@/server/public-routes"

/**
 * Unauthenticated passthrough for the handful of `permitAll` API endpoints a
 * signed-out visitor legitimately needs — today, only the invitation link a
 * student opens from their notification.
 *
 * Deliberately *not* `proxyToUpstream`: that one demands a session and attaches
 * a token. The allowlist that decides what may pass lives in
 * `server/public-routes.ts`, next to the reasoning and its tests.
 */
async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  const upstreamPath = `/${path.join("/")}`

  if (!isPublicRoute(req.method, upstreamPath)) {
    return NextResponse.json({ message: "Recurso no disponible" }, { status: 404 })
  }

  let url: string
  try {
    const { API_URL } = serverEnv()
    url = `${API_URL}${upstreamPath}`
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Configuración de entorno inválida",
        status: 500,
      },
      { status: 500 },
    )
  }

  // The query string is dropped rather than forwarded: none of the allowed
  // endpoints take parameters, and passing one through would widen the surface
  // for free.
  let upstream: Response
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: req.method === "POST" ? await req.text() : undefined,
      cache: "no-store",
      redirect: "manual",
    })
  } catch {
    return NextResponse.json(
      { message: "Estamos teniendo un pequeño inconveniente. Intentá nuevamente en unos minutos.", status: 502 },
      { status: 502 },
    )
  }

  if (upstream.status === 204 || upstream.status === 205) {
    return new NextResponse(null, { status: upstream.status })
  }

  const body = await upstream.text()
  return new NextResponse(body || null, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  })
}

export { handler as GET, handler as POST }
