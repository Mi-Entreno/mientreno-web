"use client"

import { Loader2, PackageCheck, Search } from "lucide-react"
import { useState } from "react"

import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

import { useRedemptions, useValidateRedemption } from "../hooks/use-challenges"
import { RedemptionRow } from "./redemption-row"

const FILTERS: { label: string; value: "PENDING" | "DELIVERED" | "ALL" }[] = [
  { label: "Para entregar", value: "PENDING" },
  { label: "Entregados", value: "DELIVERED" },
  { label: "Todos", value: "ALL" },
]

/**
 * El mostrador.
 *
 * Arranca en "para entregar" porque es una cola de trabajo: lo primero que el
 * comercio necesita ver es lo que tiene pendiente. Arriba está el buscador por
 * código, que es lo que realmente pasa —el alumno llega, muestra el código, y
 * hay que resolverlo sin scrollear una lista—.
 */
export function RedemptionsScreen() {
  const [filter, setFilter] = useState<"PENDING" | "DELIVERED" | "ALL">("PENDING")
  const query = useRedemptions(filter)
  const redemptions = query.data?.items ?? []

  return (
    <div className="flex flex-col gap-5">
      <CodeLookup />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {query.isError ? (
        <ErrorState error={query.error} context="load" onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : redemptions.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title={filter === "PENDING" ? "No tenés canjes para entregar" : "Todavía no hay canjes"}
          description="Cuando un alumno complete uno de tus desafíos y canjee su recompensa, va a aparecer acá con el código que tiene que mostrar."
        />
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Canjes">
          {redemptions.map((redemption) => (
            <RedemptionRow key={redemption.id} redemption={redemption} />
          ))}
        </ul>
      )}
    </div>
  )
}

/** Lo que pasa de verdad en el local: el alumno muestra un código. */
function CodeLookup() {
  const [code, setCode] = useState("")
  const validate = useValidateRedemption()

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault()
          if (code.trim()) validate.mutate(code.trim())
        }}
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="code">Código del alumno</Label>
          <Input
            id="code"
            placeholder="K7M2P4QX"
            autoCapitalize="characters"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
          />
        </div>
        <Button type="submit" disabled={validate.isPending || !code.trim()}>
          {validate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Buscar
        </Button>
      </form>

      {validate.data && (
        <div className="mt-3 border-t border-border pt-3">
          <RedemptionRow redemption={validate.data} bare />
        </div>
      )}
    </section>
  )
}
