"use client"

import { Banknote, CreditCard } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MercadoPagoScreen } from "@/features/payments/components/mercado-pago-screen"

import { usePendingReviewCount } from "../hooks/use-bank-transfers"
import { BankTransfersScreen } from "./bank-transfers-screen"

/**
 * "Cobros" now holds two ways of getting paid, so the route splits in two tabs
 * rather than growing a third screen: both answer the same question — how does
 * money reach me — and a trainer comparing them should not have to navigate.
 *
 * Transfers come first and open by default because they are the only half that
 * can be waiting on the trainer. Mercado Pago runs itself once it is linked;
 * `MercadoPagoScreen` is mounted unchanged.
 */
export function PaymentsTabs() {
  const pending = usePendingReviewCount()
  const pendingCount = pending.data ?? 0

  return (
    <Tabs defaultValue="transferencias" className="gap-6">
      <TabsList>
        <TabsTrigger value="transferencias">
          <Banknote className="size-4" />
          Transferencias
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-warning-surface px-1.5 text-caption font-semibold text-warning-text">
              {pendingCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="mercado-pago">
          <CreditCard className="size-4" />
          Mercado Pago
        </TabsTrigger>
      </TabsList>

      <TabsContent value="transferencias">
        <BankTransfersScreen />
      </TabsContent>

      <TabsContent value="mercado-pago">
        <MercadoPagoScreen />
      </TabsContent>
    </Tabs>
  )
}
