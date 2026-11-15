import { Suspense } from "react"

import { AuthShellFallback } from "@/features/auth/components/auth-shell"
import { RegisterForm } from "@/features/auth/components/register-form"

export default function RegisterPage() {
  return (
    // Reads `?from` (through `useFinishSignIn`, for Google / Apple sign-in).
    <Suspense fallback={<AuthShellFallback />}>
      <RegisterForm />
    </Suspense>
  )
}
