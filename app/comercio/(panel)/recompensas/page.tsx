import type { Metadata } from "next"

import { BrandChallengesScreen } from "@/features/brand/components/brand-challenges-screen"

export const metadata: Metadata = { title: "Recompensas — Panel del comercio" }

export default function BrandChallengesPage() {
  return <BrandChallengesScreen />
}
