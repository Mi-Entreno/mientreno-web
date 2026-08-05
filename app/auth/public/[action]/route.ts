import { type NextRequest, NextResponse } from "next/server"

import { postJson } from "@/server/upstream"

/**
 * Passthrough for the unauthenticated `/auth/**` endpoints.
 *
 * These cannot use `/api/backend/*`: that proxy demands a session and answers
 * 401 without one, which is precisely the state a user registering or
 * recovering a password is in.
 *
 * The upstream path comes from a fixed allowlist rather than the URL, so a
 * client can never steer this handler at an arbitrary backend route.
 */
const ROUTES: Record<string, string> = {
  register: "/auth/trainer/register",
  "resend-otp": "/auth/register/resend-otp",
  "verify-otp": "/auth/register/verify-otp",
  "password-reset-request": "/auth/password-reset/request",
  "password-reset-verify": "/auth/password-reset/verify",
  "password-reset-confirm": "/auth/password-reset/confirm",
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params
  const upstreamPath = ROUTES[action]

  if (!upstreamPath) {
    return NextResponse.json({ message: "Acción no soportada" }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ message: "Solicitud inválida" }, { status: 400 })
  }

  const { ok, status, data } = await postJson(upstreamPath, body)

  if (!ok) {
    // Forward the backend body untouched: bean-validation 400s are a
    // field -> message map, and 409/429 carry copy worth showing verbatim
    // ("Debés esperar N segundos antes de solicitar un nuevo código").
    return NextResponse.json(data ?? { message: "La solicitud ha fallado" }, { status })
  }

  // `resend-otp` answers 204 — a body here would throw.
  if (data === undefined) {
    return new NextResponse(null, { status: 204 })
  }

  return NextResponse.json(data, { status })
}
