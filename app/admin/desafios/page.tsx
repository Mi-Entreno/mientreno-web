import type { Metadata } from "next"

import { ChallengeModerationQueue } from "@/features/admin/components/challenge-moderation-queue"

export const metadata: Metadata = { title: "Recompensas en revisión — Moderación" }

export default function AdminChallengesPage() {
  return <ChallengeModerationQueue />
}
