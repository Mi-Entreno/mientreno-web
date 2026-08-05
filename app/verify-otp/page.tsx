import { Suspense } from "react"

import { VerifyOtpForm } from "@/features/auth/components/verify-otp-form"

export default function VerifyOtpPage() {
  return (
    <main className="flex min-h-svh flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        {/* The form prefills from `?email=`, so it needs a Suspense boundary. */}
        <Suspense fallback={null}>
          <VerifyOtpForm />
        </Suspense>
      </div>
    </main>
  )
}
