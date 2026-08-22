"use client"

import { ArrowRight, Wallet } from "lucide-react"
import Link from "next/link"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useMercadoPagoConnection } from "../hooks/use-mercado-pago"
import { describeConnection, isOperational } from "../model/mercado-pago.model"

/**
 * Billing status at a glance, from settings.
 *
 * Linking Mercado Pago was reachable only from the sidebar footer, which is the
 * last place a trainer looks for "cómo cobro". A failure stays quiet here: the
 * payments screen reports its own problems, and a broken status endpoint must
 * not make settings look broken.
 */
export function BillingCard() {
  const connection = useMercadoPagoConnection()

  const descriptor = connection.data ? describeConnection(connection.data.status) : null
  const operational = connection.data ? isOperational(connection.data) : false

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            operational ? "bg-success-surface text-success-text" : "bg-secondary text-muted-foreground",
          )}
        >
          <Wallet className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-medium">Mercado Pago</p>
          {connection.isLoading ? (
            <Skeleton className="mt-1 h-4 w-40" />
          ) : (
            <p className="mt-0.5 text-body text-muted-foreground text-pretty">
              {descriptor
                ? operational
                  ? "Tu cuenta está lista para cobrar suscripciones."
                  : descriptor.label
                : "Vinculá tu cuenta para poder cobrar tus planes."}
            </p>
          )}
        </div>
      </div>

      <Link
        href="/dashboard/payments"
        className="flex w-fit items-center gap-1.5 text-body font-medium text-primary-text underline-offset-4 hover:underline"
      >
        {operational ? "Ver mis cobros" : "Configurar cobros"}
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}
