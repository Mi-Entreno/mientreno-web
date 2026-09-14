import type { Metadata } from "next"

import { ChallengesOverview } from "@/features/challenges/components/challenges-overview"

export const metadata: Metadata = { title: "Inicio — Panel del comercio" }

export default function BrandHomePage() {
  return <ChallengesOverview />
}
