import type { Metadata } from "next"

import { BrandsList } from "@/features/admin/components/brands-list"

export const metadata: Metadata = { title: "Comercios — Moderación" }

export default function AdminBrandsPage() {
  return <BrandsList />
}
