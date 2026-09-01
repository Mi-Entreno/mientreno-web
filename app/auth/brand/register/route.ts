import { type NextRequest, NextResponse } from "next/server"

import { postJson } from "@/server/upstream"

/**
 * Merchant registration.
 *
 * Mirrors `app/auth/trainer/register`. It stays a route of its own rather than
 * a parameter on that one because the upstream paths differ
 * (`/auth/brand/register` vs `/auth/trainer/register`) and folding them into a
 * single handler would mean deriving a backend path from a client-supplied
 * value — a small open door into whatever else lives under `/auth/`.
 *
 * The backend sends the verification code inside the registration call, so
 * `verificationCodeSent` mirrors whether registration itself succeeded.
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

  const registration = await postJson("/auth/brand/register", {
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
