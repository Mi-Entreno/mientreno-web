import { notFound } from "next/navigation"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { StudentDetailScreen } from "@/features/students/components/student-detail-screen"

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ subscriptionId: string }>
}) {
  const { subscriptionId } = await params
  const id = Number(subscriptionId)

  if (!Number.isInteger(id) || id <= 0) notFound()

  return (
    // The screen reads `?tab=`, so it needs a Suspense boundary.
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <StudentDetailScreen subscriptionId={id} />
    </Suspense>
  )
}
