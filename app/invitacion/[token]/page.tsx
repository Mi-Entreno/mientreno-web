import type { Metadata } from "next"

import { InvitationResponseScreen } from "@/features/plan-invitations/components/invitation-response-screen"

export const metadata: Metadata = {
  title: "Invitación de tu entrenador — Mi Entreno",
  description: "Acepta o rechaza el plan que tu entrenador te ha propuesto.",
  // The link is a bearer credential; it must not end up in a search index.
  robots: { index: false, follow: false },
}

/**
 * Public landing for an invitation link.
 *
 * Outside `/dashboard`, so the route guard in `proxy.ts` never runs — a student
 * has no trainer session and must not be bounced to login. The token in the
 * path is what authorises the read and the answer.
 */
export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <main className="flex min-h-svh flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <InvitationResponseScreen token={token} />
      </div>
    </main>
  )
}
