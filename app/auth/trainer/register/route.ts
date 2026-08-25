import { type NextRequest, NextResponse } from "next/server"

import { postJson } from "@/server/upstream"

/**
 * Trainer registration.
 *
 * This handler used to chain a `POST /auth/register/resend-otp` after the
 * registration call, because `UserDetailsServiceAuth.registerTrainer` saved the
 * user and returned without ever emailing a verification code — unlike
 * `registerStudent`, which sends one. Without the chained call a trainer could
 * never verify through the happy path.
 *
 * The backend now sends the code itself, so the workaround is gone. Keeping it
 * would be actively wrong today: the second send lands inside
 * `email-verification.resend-cooldown-seconds` and comes back 429, which is a
 * round trip spent to be told the thing already happened.
 *
 * `verificationCodeSent` stays in the response because the register form reads
 * it to decide whether to promise an email. It now mirrors whether registration
 * itself succeeded, which is the same thing: the backend sends the code inside
 * that call, and a failure to send fails the registration.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string; phone?: string }
    | null

  if (!body?.email || !body.password) {
    return NextResponse.json(
      { message: "El correo y la contraseña son obligatorios" },
      { status: 400 },
    )
  }

  const registration = await postJson("/auth/trainer/register", {
    email: body.email.trim(),
    password: body.password,
    // @Pattern tolerates null but not an empty string.
    phone: body.phone?.trim() || null,
  })

  if (!registration.ok) {
    return NextResponse.json(
      registration.data ?? { message: "No pudimos crear tu cuenta. Volvé a intentarlo." },
      { status: registration.status },
    )
  }

  return NextResponse.json({
    email: body.email.trim(),
    verificationCodeSent: true,
  })
}
