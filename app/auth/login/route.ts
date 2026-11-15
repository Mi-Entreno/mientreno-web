import { type NextRequest, NextResponse } from "next/server"

import { respondWithSession } from "@/server/sign-in"
import { postJson, type AuthResponseDTO } from "@/server/upstream"

/**
 * Exchanges credentials for a session cookie.
 *
 * The previous implementation read `data.token`, `data.role` and
 * `data.profileCompleted`. None of those exist: `AuthResponseDTO` is
 * `{email, firstName, message, jwt, refreshToken, accountVerified}`, and role
 * and profile state live in the JWT claims. The cookie was therefore being set
 * to `undefined` and no real login could ever succeed.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null

  const email = body?.email?.trim()
  const password = body?.password

  if (!email || !password) {
    return NextResponse.json(
      { message: "El correo y la contraseña son obligatorios" },
      { status: 400 },
    )
  }

  const { ok, status, data } = await postJson("/auth/login", { email, password })

  if (!ok) {
    const message =
      (data as { message?: string } | undefined)?.message ?? "Credenciales inválidas"
    return NextResponse.json({ message }, { status })
  }

  return respondWithSession(data as AuthResponseDTO)
}
