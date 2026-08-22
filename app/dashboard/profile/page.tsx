import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { TrainerProfileScreen } from "@/features/trainer-profile/components/trainer-profile-screen"

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-body text-muted-foreground">
        Tus datos personales y tu perfil profesional. Todo lo que ven tus alumnos se edita aquí.
      </p>
      {/* The screen reads `?complete=1`, so it needs a Suspense boundary. */}
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <TrainerProfileScreen />
      </Suspense>
    </div>
  )
}
