import { type NextRequest, NextResponse } from "next/server"

import { postJson } from "@/server/upstream"

/**
 * Trainer registration, plus the OTP send the backend forgets to do.
 *
 * ## The gap this works around
 *
 * `UserDetailsServiceAuth.registerStudent` calls
 * `emailVerificationService.sendVerificationCode(newUser)` before returning.
 * `registerTrainer` does not — it saves the user and returns
 * `AuthResponseDTO.noToken(...)` with nothing else.
 *
 * So a trainer registers, lands with `accountVerified: false`, and **no code is
 * ever emailed**. Left alone, the account can never be verified through the
 * happy path; the only source of a first code is
 * `POST /auth/register/resend-otp`.
 *
 * Chaining that call here keeps the workaround in one place and costs the
 * client a single round trip. A failure to send is reported rather than thrown:
 * the account genuinely was created, and the verification screen offers a
 * resend button anyway.
 *
 * The chain is safe once the backend is fixed: the resend cooldown rejects the
 * second send, so nobody gets two emails. See `codeAlreadySent` below.
 *
 * **The proper fix is upstream** — `registerTrainer` should send the code the
 * way `registerStudent` does. Remove this chaining once it does.
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

  const otp = await postJson("/auth/register/resend-otp", { email: body.email.trim() })

  return NextResponse.json({
    email: body.email.trim(),
    /** False only when no code exists to verify with; the UI offers a retry. */
    verificationCodeSent: otp.ok || codeAlreadySent(otp.status),
  })
}

/**
 * A 429 here means a code went out moments ago, not that sending failed.
 *
 * `EmailVerificationService.sendVerificationCode` refuses a resend inside
 * `email-verification.resend-cooldown-seconds`. So the day the backend starts
 * sending the code from `registerTrainer` — the proper fix this handler works
 * around — the chained call above will be rejected by that cooldown, which is
 * exactly what stops the trainer from receiving two emails.
 *
 * Reading that rejection as a failure was wrong twice over: it warned "no
 * hemos podido enviar el código" to someone who had just received one, and it
 * pushed them toward the resend button, which is the one action guaranteed to
 * fail for the next minute.
 */
function codeAlreadySent(status: number): boolean {
  return status === 429
}
