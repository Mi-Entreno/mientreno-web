import { Suspense } from "react"

import { LoginForm } from "@/features/auth/components/login-form"

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        {/* Reads `?from`, `?email`, `?error` and `?verified`. */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
