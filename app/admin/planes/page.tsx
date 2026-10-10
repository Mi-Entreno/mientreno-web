import type { Metadata } from "next"

import { AdminPlansScreen } from "@/features/membership-admin/components/admin-plans-screen"

export const metadata: Metadata = { title: "Planes — Administración" }

export default function AdminPlansPage() {
  return <AdminPlansScreen />
}
