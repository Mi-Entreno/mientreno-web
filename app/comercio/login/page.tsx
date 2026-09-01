import { Suspense } from "react"

import { AuthShellFallback } from "@/features/auth/components/auth-shell"
import { LoginForm } from "@/features/auth/components/login-form"
import { BRAND_AUDIENCE } from "@/features/auth/model/audience"

export default function BrandLoginPage() {
  return (
    // Reads `?from`, `?email`, `?error` and `?verified`.
    <Suspense fallback={<AuthShellFallback />}>
      <LoginForm audience={BRAND_AUDIENCE} />
    </Suspense>
  )
}
