import { type NextRequest, NextResponse } from "next/server"

import { isBrandSignupEnabled } from "@/core/config/features"
import { readClientOrigin } from "@/server/client-origin"
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
  // Hiding the links is not enough: this handler is reachable with a bare
  // fetch. 404 matches what the page answers with the flag off.
  if (!isBrandSignupEnabled()) {
    return NextResponse.json({ message: "No encontrado" }, { status: 404 })
  }

  const body = (await req.json().catch(() => null)) as
    | {
        email?: string
        password?: string
        phone?: string
        legal?: Record<string, unknown>
      }
    | null

  if (!body?.email || !body.password) {
    return NextResponse.json(
      { message: "El correo y la contraseña son obligatorios" },
      { status: 400 },
    )
  }

  /*
   * Re-check the consent here and not only in the form's zod schema.
   *
   * This handler is reachable with a bare fetch, and the upstream property
   * `legal.consent.enforce` starts off so the already-published mobile builds
   * can keep registering — meaning a request with no `legal` block would
   * currently create a web account with no audit row at all. Checking here
   * closes that for the panel without waiting on the mobile rollout.
   */
  if (!body.legal?.termsAccepted || !body.legal?.privacyAccepted || !body.legal?.cookiesAcknowledged) {
    return NextResponse.json(
      { message: "Tenés que aceptar los términos y condiciones para crear la cuenta" },
      { status: 400 },
    )
  }

  const registration = await postJson("/auth/brand/register", {
    email: body.email.trim(),
    password: body.password,
    // @Pattern tolerates null but not an empty string.
    phone: body.phone?.trim() || null,
    // The browser's own address and user agent, which only this hop can see.
    legal: { ...body.legal, ...readClientOrigin(req) },
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
