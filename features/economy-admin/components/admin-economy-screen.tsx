"use client"

import { BarChart3, Dices, History, ListChecks, Wallet } from "lucide-react"
import { useState } from "react"

import { ErrorState } from "@/components/dashboard/error-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEconomy } from "../hooks/use-economy-admin"
import { diffEconomy, validateEconomy, type EconomyConfig } from "../model/economy-admin.model"
import { EconomyDashboard } from "./economy-dashboard"
import { EconomyHistory } from "./economy-history"
import { RulesEditor } from "./rules-editor"
import { SaveEconomyDialog } from "./save-economy-dialog"
import { WalletsPanel } from "./wallets-panel"
import { WheelEditor } from "./wheel-editor"

/**
 * The reps economy, end to end: what earns reps and how much, the wheel, how
 * it is actually going, every past version, and per-student corrections.
 *
 * Rules and wheel share one draft and one save: they are balanced together (a
 * richer wheel is a reason to lower another rule), so saving them separately
 * would create in-between versions nobody meant.
 */
export function AdminEconomyScreen() {
  const economy = useEconomy()
  const [draft, setDraft] = useState<EconomyConfig | null>(null)
  const [confirming, setConfirming] = useState(false)

  if (economy.isError) return <ErrorState error={economy.error} onRetry={() => economy.refetch()} />
  if (!economy.data) return <Skeleton className="h-96 rounded-2xl" />

  const saved = economy.data
  const current = draft ?? saved
  const dirty = draft !== null && diffEconomy(saved, draft).length > 0
  const errors = draft ? validateEconomy(draft) : []
  const update = (next: EconomyConfig) => setDraft(next)

  return (
    <div className="flex flex-col gap-6 pb-24">
      <p className="max-w-prose text-body text-muted-foreground text-pretty">
        Cuántas repes da cada actividad, sus topes y la ruleta. Los cambios rigen al guardar, quedan en el historial con
        tu nombre y se pueden deshacer restaurando una versión anterior.
      </p>

      <Tabs defaultValue="reglas" className="gap-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="reglas">
            <ListChecks className="size-4" />
            Reglas
          </TabsTrigger>
          <TabsTrigger value="ruleta">
            <Dices className="size-4" />
            Ruleta
          </TabsTrigger>
          <TabsTrigger value="tablero">
            <BarChart3 className="size-4" />
            Tablero
          </TabsTrigger>
          <TabsTrigger value="historial">
            <History className="size-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="billeteras">
            <Wallet className="size-4" />
            Billeteras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reglas">
          <RulesEditor config={current} onChange={update} />
        </TabsContent>
        <TabsContent value="ruleta">
          <WheelEditor config={current} onChange={update} />
        </TabsContent>
        <TabsContent value="tablero">
          <EconomyDashboard config={saved} />
        </TabsContent>
        <TabsContent value="historial">
          <EconomyHistory current={saved} onRestored={() => setDraft(null)} />
        </TabsContent>
        <TabsContent value="billeteras">
          <WalletsPanel />
        </TabsContent>
      </Tabs>

      {dirty && (
        <div
          role="region"
          aria-label="Cambios sin guardar"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 backdrop-blur md:left-60"
        >
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 text-body">
              {errors.length > 0 ? (
                <ul className="text-error-text">
                  {errors.slice(0, 3).map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                  {errors.length > 3 && <li>y {errors.length - 3} más…</li>}
                </ul>
              ) : (
                <p>Tenés cambios sin guardar.</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDraft(null)}>
                Descartar
              </Button>
              <Button disabled={errors.length > 0} onClick={() => setConfirming(true)}>
                Revisar y guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirming && draft && (
        <SaveEconomyDialog
          saved={saved}
          draft={draft}
          onClose={() => setConfirming(false)}
          onSaved={() => {
            setConfirming(false)
            setDraft(null)
          }}
        />
      )}
    </div>
  )
}
