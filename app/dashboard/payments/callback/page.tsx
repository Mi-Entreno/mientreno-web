import { Suspense } from "react"

import { MercadoPagoCallback } from "@/features/payments/components/mercado-pago-callback"

export default function MercadoPagoCallbackPage() {
  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Reads `?code`, `?state` and `?error` from Mercado Pago. */}
      <Suspense fallback={null}>
        <MercadoPagoCallback />
      </Suspense>
    </div>
  )
}
