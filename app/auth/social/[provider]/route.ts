import { type NextRequest, NextResponse } from "next/server"

import { readClientOrigin } from "@/server/client-origin"
import { respondWithSession } from "@/server/sign-in"
import { postJson, type AuthResponseDTO } from "@/server/upstream"

/**
 * "Continuar con Google / Apple" — exchanges a provider id token for a session.
 *
 * The browser gets the id token from the provider's own JS SDK; the backend
 * verifies it (signature, `aud`, `exp`, nonce) at `POST /auth/trainer/{provider}`
 * and answers the same `AuthResponseDTO` as `/auth/login`, so the rest is
 * `respondWithSession`. Always the **trainer** door: it is the role a brand-new
 * account gets, and the backend refuses a student-only account there with a 403
 * before it links the identity. Merchants with an existing account still get
 * in (`homeFor` sends them to `/comercio`); a new merchant cannot sign up this
 * way, which is fine while brand signup is password-only.
 *
 * The provider is a closed set of two literals, never interpolated from the
 * request into the upstream path as-is.
 */
const UPSTREAM: Record<string, string> = {
  google: "/auth/trainer/google",
  apple: "/auth/trainer/apple",
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params
  const path = UPSTREAM[provider]
  if (!path) {
    return NextResponse.json({ message: "Proveedor no soportado" }, { status: 404 })
  }

  const body = (await req.json().catch(() => null)) as
    | {
        idToken?: string
        nonce?: string
        authorizationCode?: string
        legal?: Record<string, unknown>
      }
    | null

  if (!body?.idToken) {
    return NextResponse.json({ message: "Falta el token del proveedor" }, { status: 400 })
  }

  /*
   * `legal` only matters if this sign-in creates the account, and the backend
   * ignores it otherwise. Required anyway — we cannot know upfront whether the
   * account exists, and same reasoning as `app/auth/trainer/register`: upstream
   * enforcement is still off for the mobile rollout, so without this check a
   * bare fetch would create a web account with no consent row.
   */
  if (!body.legal?.termsAccepted || !body.legal?.privacyAccepted || !body.legal?.cookiesAcknowledged) {
    return NextResponse.json(
      { message: "Tenés que aceptar los términos y condiciones para continuar" },
      { status: 400 },
    )
  }

  const { ok, status, data } = await postJson(path, {
    idToken: body.idToken,
    nonce: body.nonce || null,
    authorizationCode: body.authorizationCode || null,
    legal: { ...body.legal, ...readClientOrigin(req) },
  })

  if (!ok) {
    const message =
      (data as { message?: string } | undefined)?.message ??
      "No pudimos iniciar sesión. Intentá de nuevo."
    return NextResponse.json({ message }, { status })
  }

  return respondWithSession(data as AuthResponseDTO)
}
