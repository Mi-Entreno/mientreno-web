import { NextResponse } from "next/server"

import { TRAINER_ROLE } from "@/server/jwt"
import { ensureFreshSession } from "@/server/upstream"

/**
 * Current session state, derived from the JWT claims.
 *
 * The previous version hardcoded `role: "TRAINER"` and
 * `profileCompleted: true` whenever a cookie was present, so the answer was
 * fiction — onboarding could never trigger and role was never checked.
 *
 * Goes through `ensureFreshSession` so a page load with an expired access
 * token refreshes it rather than reporting the user as logged out.
 */
export async function GET() {
  const session = await ensureFreshSession()

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      email: null,
      firstName: null,
      isTrainer: false,
      profileCompleted: false,
    })
  }

  return NextResponse.json({
    authenticated: true,
    email: session.claims.email,
    firstName: session.claims.firstName,
    isTrainer: session.claims.authorities.includes(TRAINER_ROLE),
    profileCompleted: session.claims.profileCompleted,
  })
}
