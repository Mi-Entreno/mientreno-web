"use client"

import { useState } from "react"

import { ErrorState } from "@/components/dashboard/error-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useEconomyHistory, useEconomyVersion, useRestoreEconomy } from "../hooks/use-economy-admin"
import { diffEconomy, type EconomyConfig, type EconomyVersion } from "../model/economy-admin.model"

/**
 * Every saved economy, newest first. Restoring never rewrites history: it saves
 * the old content as a new version, so "who changed what" stays answerable.
 */
export function EconomyHistory({ current, onRestored }: { current: EconomyConfig; onRestored: () => void }) {
  const history = useEconomyHistory()
  const [selected, setSelected] = useState<EconomyVersion | null>(null)

  if (history.isError) return <ErrorState error={history.error} onRetry={() => history.refetch()} />
  if (!history.data) return <Skeleton className="h-64 rounded-2xl" />

  return (
    <>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {history.data.map((version) => (
          <li key={version.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="text-body font-medium">
                Versión {version.versionNo}
                {version.active && (
                  <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-caption text-primary-text">vigente</span>
                )}
              </p>
              <p className="text-caption text-muted-foreground">
                {new Date(version.createdAt).toLocaleString("es-AR")} · {version.createdByEmail ?? "sistema"}
              </p>
              {version.note && <p className="text-body text-pretty">{version.note}</p>}
            </div>
            {!version.active && (
              <Button variant="outline" size="sm" onClick={() => setSelected(version)}>
                Ver y restaurar
              </Button>
            )}
          </li>
        ))}
      </ul>
      {selected && (
        <RestoreDialog
          version={selected}
          current={current}
          onClose={() => setSelected(null)}
          onRestored={() => {
            setSelected(null)
            onRestored()
          }}
        />
      )}
    </>
  )
}

function RestoreDialog({
  version,
  current,
  onClose,
  onRestored,
}: {
  version: EconomyVersion
  current: EconomyConfig
  onClose: () => void
  onRestored: () => void
}) {
  const config = useEconomyVersion(version.id)
  const restore = useRestoreEconomy()
  const changes = config.data ? diffEconomy(current, config.data) : []

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Restaurar la versión {version.versionNo}</DialogTitle>
          <DialogDescription>Esto cambia respecto de la economía vigente:</DialogDescription>
        </DialogHeader>
        {config.isError ? (
          <ErrorState error={config.error} inline />
        ) : !config.data ? (
          <Skeleton className="h-32" />
        ) : changes.length === 0 ? (
          <p className="text-body text-muted-foreground">Es igual a la vigente.</p>
        ) : (
          <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-xl border border-border p-3 text-body">
            {changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={restore.isPending}>
            Cancelar
          </Button>
          <Button
            disabled={restore.isPending || !config.data || changes.length === 0}
            onClick={() => restore.mutate(version.id, { onSuccess: onRestored })}
          >
            {restore.isPending ? "Restaurando…" : "Restaurar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
