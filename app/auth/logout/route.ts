import { NextResponse } from "next/server"

import { clearSession, readStoredSession } from "@/server/session-store"
import { postJson } from "@/server/upstream"

/**
 * Ends the session and revokes the refresh token upstream.
 *
 * The previous implementation only dropped the cookie, leaving the refresh
 * token valid for its full 30 days — logging out did not actually end the
 * session, it just made this browser forget it.
 *
 * `POST /auth/logout` is idempotent upstream, so a missing or already-revoked
 * token is not an error worth surfacing: the local session is cleared either
 * way.
 */
export async function POST() {
  const stored = await readStoredSession()

  if (stored?.refreshToken) {
    await postJson("/auth/logout", { refreshToken: stored.refreshToken })
  }

  await clearSession()
  return NextResponse.json({ success: true })
}
