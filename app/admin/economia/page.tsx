import type { Metadata } from "next"

import { AdminEconomyScreen } from "@/features/economy-admin/components/admin-economy-screen"

export const metadata: Metadata = { title: "Economía — Administración" }

export default function AdminEconomyPage() {
  return <AdminEconomyScreen />
}
