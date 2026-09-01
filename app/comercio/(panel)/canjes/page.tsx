import type { Metadata } from "next"

import { BrandRedemptionsScreen } from "@/features/brand/components/brand-redemptions-screen"

export const metadata: Metadata = { title: "Canjes — Panel del comercio" }

export default function BrandRedemptionsPage() {
  return <BrandRedemptionsScreen />
}
