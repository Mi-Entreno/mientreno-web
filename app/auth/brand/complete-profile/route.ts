import { type NextRequest, NextResponse } from "next/server"

import { decodeAccessToken } from "@/server/jwt"
import { writeSession } from "@/server/session-store"
import { authedJson, type AuthResponseDTO } from "@/server/upstream"

/**
 * `POST /api/brands/complete-profile`, wrapped so the new session lands.
 *
 * Same reason as `app/auth/complete-profile` for trainers: the endpoint answers
 * with a freshly signed JWT because `profileCompleted` flipped to true. Sent
 * through the generic proxy that token would be handed to client JS and
 * dropped, leaving the cookie claiming `profileCompleted: false` — and the
 * guard bouncing the merchant back into onboarding on every navigation.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body) {
    return NextResponse.json({ message: "Solicitud inválida" }, { status: 400 })
  }

  const { ok, status, data } = await authedJson("/api/brands/complete-profile", "POST", body)

  if (!ok) {
    // The backend's body passes through untouched: bean-validation 400s are a
    // field -> message map the form needs intact, and 409 means the account
    // already has a profile.
    return NextResponse.json(data ?? { message: "No pudimos guardar tu comercio" }, { status })
  }

  const auth = data as AuthResponseDTO
  const claims = decodeAccessToken(auth?.jwt)

  if (!claims) {
    return NextResponse.json(
      { message: "Estamos teniendo un pequeño inconveniente. Intentá nuevamente en unos minutos." },
      { status: 502 },
    )
  }

  await writeSession({ accessToken: auth.jwt, refreshToken: auth.refreshToken })

  return NextResponse.json({
    email: claims.email,
    firstName: claims.firstName,
    profileCompleted: claims.profileCompleted,
  })
}
