import type { Metadata } from "next"

import { BrandProductsScreen } from "@/features/brand/components/brand-products-screen"

export const metadata: Metadata = { title: "Recompensas — Panel del comercio" }

export default function BrandRewardsPage() {
  return <BrandProductsScreen />
}
