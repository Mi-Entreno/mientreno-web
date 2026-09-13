import type { Metadata } from "next"

import { AdminChallengesScreen } from "@/features/admin/components/challenges-screen"

export const metadata: Metadata = { title: "Desafíos — Administración" }

export default function AdminChallengesPage() {
  return <AdminChallengesScreen />
}
