import type { Metadata } from "next"

import { AdminShell } from "@/components/admin/shell"
import { isBrand, isTrainer } from "@/server/jwt"
import { readSession } from "@/server/session-store"

export const metadata: Metadata = {
  title: "Mi Entreno — Moderación",
}

/**
 * Moderation zone.
 *
 * Its own layout and its own visual identity: what happens here changes what
 * other people see, and someone who both trains and moderates should never
 * wonder which panel they are looking at.
 *
 * The "volver a mi panel" target is resolved here rather than in the shell
 * because it needs the session, and the shell is a client component.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession()
  const claims = session?.claims ?? null

  // Where this admin came from. Null for an account whose only role is ADMIN —
  // there is nowhere else for them to go, so the link is not rendered.
  const canReturnTo = isTrainer(claims) ? "/dashboard" : isBrand(claims) ? "/comercio" : null

  return <AdminShell canReturnTo={canReturnTo}>{children}</AdminShell>
}
