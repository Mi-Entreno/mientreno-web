import { type NextRequest, NextResponse } from "next/server"

import { decodeAccessToken, isTrainer } from "@/server/jwt"
import { clearSession, writeSession } from "@/server/session-store"
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

  const auth = data as AuthResponseDTO

  // Verification is checked before the token is decoded, because an unverified
  // account no longer comes with one.
  //
  // The backend used to issue a working JWT regardless of `accountVerified` and
  // leave it to each client to decline it — which meant the token was real and
  // anyone bypassing the UI had a usable session. It now withholds `jwt` and
  // `refreshToken` for unverified accounts and still answers 200, so the shape
  // both clients already branch on is unchanged.
  //
  // Decoding first would turn that null token into `!claims` and report a 502
  // "inconveniente", hiding a perfectly ordinary state behind a server error
  // and stranding the user with no way to reach the OTP screen.
  if (!auth.accountVerified) {
    await clearSession()
    return NextResponse.json({
      email: auth.email,
      firstName: auth.firstName,
      profileCompleted: false,
      accountVerified: false,
    })
  }

  const claims = decodeAccessToken(auth.jwt)

  if (!claims) {
    return NextResponse.json(
      { message: "Estamos teniendo un pequeño inconveniente. Intentá nuevamente en unos minutos." },
      { status: 502 },
    )
  }

  // This dashboard is trainer-only. Without this check a STUDENT could sign in
  // and reach the shell, with every subsequent API call failing with 403.
  if (!isTrainer(claims)) {
    await clearSession()
    return NextResponse.json(
      { message: "Esta cuenta no es de entrenador. Usa la aplicación para alumnos." },
      { status: 403 },
    )
  }

  await writeSession({ accessToken: auth.jwt, refreshToken: auth.refreshToken })

  // Tokens stay server-side; the client only gets what it needs to route.
  return NextResponse.json({
    email: claims.email,
    firstName: claims.firstName,
    profileCompleted: claims.profileCompleted,
    accountVerified: auth.accountVerified,
  })
}
