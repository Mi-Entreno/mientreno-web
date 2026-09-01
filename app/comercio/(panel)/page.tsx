import type { Metadata } from "next"

import { BrandOverview } from "@/features/brand/components/brand-overview"

export const metadata: Metadata = { title: "Inicio — Panel del comercio" }

export default function BrandHomePage() {
  return <BrandOverview />
}
