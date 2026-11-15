import { notFound } from "next/navigation"
import { Suspense } from "react"

import { isBrandSignupEnabled } from "@/core/config/features"
import { AuthShellFallback } from "@/features/auth/components/auth-shell"
import { RegisterForm } from "@/features/auth/components/register-form"

export default function BrandRegisterPage() {
  // 404 y no un cartel de "registro cerrado": con el flag apagado la función
  // no tiene que existir, ni siquiera para quien llegue por un enlace viejo.
  if (!isBrandSignupEnabled()) notFound()

  // Id y no el objeto de copy: ver el comentario de la página de login.
  // Suspense: `RegisterForm` reads search params through `useFinishSignIn`.
  return (
    <Suspense fallback={<AuthShellFallback />}>
      <RegisterForm audience="brand" />
    </Suspense>
  )
}
