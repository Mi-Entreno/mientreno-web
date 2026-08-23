import { BottomNav } from "@/components/dashboard/bottom-nav"
import { DashboardHeader } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { readSession } from "@/server/session-store"

/**
 * Reads the trainer's first name off the session token, server-side.
 *
 * `JwtUtils.createToken` signs a `firstName` claim, so the name is already in
 * the cookie by the time this renders — no request needed. Handing it to the
 * shell means the first painted frame says "Alex" instead of the word
 * "Entrenador", which is what used to flash on every reload while
 * `GET /api/trainer/profile` was still in flight.
 *
 * It is a hint, not the source of truth: the client query still runs and
 * upgrades this to the full name. A token without the claim falls back to a
 * skeleton rather than to a placeholder word.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession()
  const initialName = session?.claims.firstName ?? null

  return (
    <div className="flex min-h-svh">
      <Sidebar initialName={initialName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader initialName={initialName} />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-8 lg:px-8">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
