import type { Metadata } from "next"

import { AdminMetricsScreen } from "@/features/membership-admin/components/admin-metrics-screen"

export const metadata: Metadata = { title: "Métricas — Administración" }

export default function AdminMetricsPage() {
  return <AdminMetricsScreen />
}
