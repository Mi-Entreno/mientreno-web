import { Suspense } from "react"

import { AuthShellFallback } from "@/features/auth/components/auth-shell"
import { LoginForm } from "@/features/auth/components/login-form"

export default function BrandLoginPage() {
  return (
    // Reads `?from`, `?email`, `?error` and `?verified`.
    //
    // La audiencia viaja como id y no como el objeto de copy: éste es un server
    // component y `AudienceCopy` lleva íconos de Lucide, que son funciones. Un
    // objeto así no cruza el límite servidor/cliente y rompe el build.
    <Suspense fallback={<AuthShellFallback />}>
      <LoginForm audience="brand" />
    </Suspense>
  )
}
