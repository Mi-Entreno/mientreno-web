import type { Metadata } from "next"

import { ChallengesScreen } from "@/features/challenges/components/challenges-screen"

export const metadata: Metadata = { title: "Desafíos — Panel del comercio" }

export default function BrandChallengesPage() {
  return <ChallengesScreen />
}
