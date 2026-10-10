import type { Metadata } from "next"

import { AdminMembershipsScreen } from "@/features/membership-admin/components/admin-memberships-screen"

export const metadata: Metadata = { title: "Membresías — Administración" }

export default function AdminMembershipsPage() {
  return <AdminMembershipsScreen />
}
