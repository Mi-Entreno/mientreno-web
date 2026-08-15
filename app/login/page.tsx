import { Suspense } from "react"

import { AuthShellFallback } from "@/features/auth/components/auth-shell"
import { LoginForm } from "@/features/auth/components/login-form"

export default function LoginPage() {
  return (
    // Reads `?from`, `?email`, `?error` and `?verified`.
    <Suspense fallback={<AuthShellFallback />}>
      <LoginForm />
    </Suspense>
  )
}
