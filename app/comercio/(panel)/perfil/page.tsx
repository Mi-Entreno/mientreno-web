import type { Metadata } from "next"
import { Suspense } from "react"

import { BrandProfileScreen } from "@/features/brand/components/brand-profile-screen"

export const metadata: Metadata = { title: "Mi comercio — Panel del comercio" }

export default function BrandProfilePage() {
  // Reads `?complete=1`, which the guard sets when the profile is missing.
  return (
    <Suspense>
      <BrandProfileScreen />
    </Suspense>
  )
}
