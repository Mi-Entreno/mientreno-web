import { NextResponse } from "next/server"

import { clearSession } from "@/server/session-store"
import { authedJson } from "@/server/upstream"

/**
 * `DELETE /api/account`, wrapped so the local session is torn down too.
 *
 * The backend soft-deletes the user and revokes every refresh token, which
 * means the tokens in our cookie are dead the moment this returns. Going
 * through the generic proxy would leave that cookie in place, and the next
 * navigation would try to refresh with a revoked token before finally landing
 * on the login page.
 *
 * Answers 204, matching the backend.
 */
export async function DELETE() {
  const { ok, status, data } = await authedJson("/api/account", "DELETE")

  if (!ok) {
    return NextResponse.json(data ?? { message: "No se ha podido eliminar la cuenta" }, { status })
  }

  await clearSession()
  return new NextResponse(null, { status: 204 })
}
