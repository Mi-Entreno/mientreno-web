import { Eye } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { TrainerProfileScreen } from "@/features/trainer-profile/components/trainer-profile-screen"

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body text-muted-foreground">
          Consulta y edita tu perfil público de entrenador, especialidades y certificaciones.
        </p>
        <Link
          href="/dashboard/profile/preview"
          className="flex w-fit shrink-0 items-center gap-1.5 text-body font-medium underline underline-offset-4"
        >
          <Eye className="size-4" />
          Ver como alumno
        </Link>
      </div>
      {/* The screen reads `?complete=1`, so it needs a Suspense boundary. */}
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <TrainerProfileScreen />
      </Suspense>
    </div>
  )
}
