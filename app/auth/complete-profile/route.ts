import { type NextRequest, NextResponse } from "next/server"

import { decodeAccessToken } from "@/server/jwt"
import { writeSession } from "@/server/session-store"
import { authedJson, type AuthResponseDTO } from "@/server/upstream"

/**
 * `POST /api/trainer/profile/complete`, wrapped so the new session lands.
 *
 * This endpoint is the one place where a *business* call changes the session:
 * it answers with an `AuthResponseDTO` containing a freshly signed JWT, because
 * the `profileCompleted` claim has flipped to true.
 *
 * Sent through the generic proxy the new token would be handed to client JS and
 * dropped, leaving the cookie holding a token that still claims
 * `profileCompleted: false`. The route guard would then bounce the trainer back
 * into onboarding on every navigation — a loop they could not escape.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body) {
    return NextResponse.json({ message: "Solicitud inválida" }, { status: 400 })
  }

  const { ok, status, data } = await authedJson("/api/trainer/profile/complete", "POST", body)

  if (!ok) {
    // Pass the backend's own body through: bean-validation 400s are a
    // field -> message map the form needs intact, and 409 means the profile
    // was already completed.
    return NextResponse.json(data ?? { message: "No se ha podido completar el perfil" }, { status })
  }

  const auth = data as AuthResponseDTO
  const claims = decodeAccessToken(auth?.jwt)

  if (!claims) {
    return NextResponse.json(
      { message: "El servidor ha devuelto una sesión inesperada" },
      { status: 502 },
    )
  }

  await writeSession({ accessToken: auth.jwt, refreshToken: auth.refreshToken })

  return NextResponse.json({
    profileCompleted: claims.profileCompleted,
    firstName: claims.firstName,
  })
}
