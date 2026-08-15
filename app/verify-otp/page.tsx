import { Suspense } from "react"

import { AuthShellFallback } from "@/features/auth/components/auth-shell"
import { VerifyOtpForm } from "@/features/auth/components/verify-otp-form"

export default function VerifyOtpPage() {
  return (
    // The form prefills from `?email=`, so it needs a Suspense boundary.
    <Suspense fallback={<AuthShellFallback />}>
      <VerifyOtpForm />
    </Suspense>
  )
}
