import type { Metadata } from "next"

import { BrandBottomNav } from "@/components/brand/bottom-nav"
import { BrandHeader } from "@/components/brand/header"
import { BrandSidebar } from "@/components/brand/sidebar"
import { readSession } from "@/server/session-store"

export const metadata: Metadata = {
  title: "Mi Entreno — Panel del comercio",
}

/**
 * Merchant shell.
 *
 * `firstName` off the session token is a hint for the sidebar card while the
 * profile query is in flight — same trick the trainer shell uses, and for the
 * same reason: the first painted frame should not say a placeholder word that
 * then swaps to a real name.
 */
export default async function BrandLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession()
  const initialName = session?.claims.firstName ?? null

  return (
    <div className="flex min-h-svh">
      <BrandSidebar initialName={initialName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <BrandHeader />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-8 lg:px-8">{children}</main>
      </div>
      <BrandBottomNav />
    </div>
  )
}
