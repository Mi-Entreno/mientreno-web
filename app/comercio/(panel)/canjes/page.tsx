import type { Metadata } from "next"

import { RedemptionsScreen } from "@/features/challenges/components/redemptions-screen"

export const metadata: Metadata = { title: "Canjes — Panel del comercio" }

export default function BrandRedemptionsPage() {
  return <RedemptionsScreen />
}
