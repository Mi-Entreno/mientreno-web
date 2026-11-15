import "server-only"

import { NextResponse } from "next/server"

import { decodeAccessToken, homeFor } from "@/server/jwt"
import { clearSession, writeSession } from "@/server/session-store"
import type { AuthResponseDTO } from "@/server/upstream"

/** What the browser gets back from any sign-in — never the tokens. */
export interface SignInResult {
  email: string
  firstName: string | null
  profileCompleted: boolean
  accountVerified: boolean
  home?: string
}

export const STUDENT_ACCOUNT_MESSAGE =
  "Esta cuenta es de alumno. Usá la aplicación móvil para entrenar."

/**
 * Turns a successful upstream `AuthResponseDTO` into a session cookie.
 *
 * Shared by the password login and the Google/Apple one, which answer the same
 * DTO. It used to live inline in `app/auth/login/route.ts`; a second copy for
 * social sign-in would have been one more place to forget the student check.
 */
export async function respondWithSession(auth: AuthResponseDTO): Promise<NextResponse> {
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
  //
  // Social sign-in never lands here: those accounts are verified by the
  // provider's `email_verified`.
  if (!auth.accountVerified) {
    await clearSession()
    return NextResponse.json({
      email: auth.email,
      firstName: auth.firstName,
      profileCompleted: false,
      accountVerified: false,
    } satisfies SignInResult)
  }

  const claims = decodeAccessToken(auth.jwt)

  if (!claims) {
    return NextResponse.json(
      { message: "Estamos teniendo un pequeño inconveniente. Intentá nuevamente en unos minutos." },
      { status: 502 },
    )
  }

  // This panel serves trainers and merchants. `homeFor` is the single place
  // that maps a role to a destination — the guard and the landing consult the
  // same function, so there is no way for two of them to disagree about where
  // a session belongs and bounce it back and forth.
  //
  // A null home means the account is a student's: their place is the mobile
  // app, and letting them in would only get every request 403'd. For social
  // sign-in the backend already refuses a student at `/auth/trainer/{provider}`
  // (before linking the identity); this is the second line, not the first.
  const home = homeFor(claims)

  if (!home) {
    await clearSession()
    return NextResponse.json({ message: STUDENT_ACCOUNT_MESSAGE }, { status: 403 })
  }

  await writeSession({ accessToken: auth.jwt, refreshToken: auth.refreshToken })

  // `home` travels in the response so the form does not have to re-derive the
  // role it cannot see — the claims never reach the browser.
  return NextResponse.json({
    email: claims.email,
    firstName: claims.firstName,
    profileCompleted: claims.profileCompleted,
    accountVerified: auth.accountVerified,
    home,
  } satisfies SignInResult)
}
