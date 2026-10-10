"use client"

import { CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { BarsLoader } from "@/components/ui/bars-loader"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMyMembership } from "../hooks/use-membership"
import { isSettled } from "../model/membership.model"

/** How long to wait for the webhook before saying "it is taking a while". */
const PATIENCE_MS = 30_000

/**
 * Where Mercado Pago drops the trainer after paying.
 *
 * The query string Mercado Pago appends is not trusted for anything: anyone can
 * type `?status=authorized`. What activates the membership is the webhook, read
 * from Mercado Pago's API by the backend. This page just polls the membership
 * until it sees it active, and says so honestly when it takes longer.
 */
export function PlanCallback() {
  const me = useMyMembership({ pollUntilSettled: true })
  const [waitedTooLong, setWaitedTooLong] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setWaitedTooLong(true), PATIENCE_MS)
    return () => clearTimeout(timer)
  }, [])

  if (isSettled(me.data)) {
    return (
      <State icon={<CheckCircle2 className="size-6 text-success-text" />} title={`¡Ya sos ${me.data?.membership?.planName}!`}>
        {me.data?.membership?.status === "TRIALING"
          ? "Empezó tu prueba gratis. Tus beneficios ya están activos."
          : "Tu pago se acreditó y tus beneficios ya están activos."}
      </State>
    )
  }

  if (waitedTooLong) {
    return (
      <State icon={<Clock className="size-6 text-warning-text" />} title="Estamos esperando la confirmación">
        Mercado Pago todavía no nos avisó del pago. Suele tardar unos minutos: tus beneficios se activan solos
        apenas llegue, no hace falta que vuelvas a pagar.
      </State>
    )
  }

  return (
    <State icon={<BarsLoader />} title="Confirmando tu pago…">
      Esto tarda unos segundos. No hace falta que hagas nada.
    </State>
  )
}

function State({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
      {icon}
      <div>
        <h2 className="font-heading text-subtitle font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-body text-muted-foreground text-pretty">{children}</p>
      </div>
      <Link href="/dashboard/plan" className={cn(buttonVariants({ variant: "outline" }))}>
        Ver mi plan
      </Link>
    </div>
  )
}
