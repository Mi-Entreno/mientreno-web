"use client"

import { useState } from "react"

import { ErrorState } from "@/components/dashboard/error-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebouncedValue } from "@/core/hooks/use-debounced-value"
import { cn } from "@/lib/utils"
import { useAdjustWallet, useWalletHistory, useWalletSearch } from "../hooks/use-economy-admin"
import {
  formatReps,
  LEDGER_TYPE_LABELS,
  parseWhole,
  type AdminWalletStudent,
} from "../model/economy-admin.model"

/**
 * Per-student balances and corrections. An adjustment is one more ledger entry
 * (MANUAL_ADJUSTMENT) with the admin as author — never an edit — and the reason
 * is what the student reads in their history.
 */
export function WalletsPanel() {
  const [search, setSearch] = useState("")
  const debounced = useDebouncedValue(search, 300)
  const students = useWalletSearch(debounced.trim())
  const [selected, setSelected] = useState<AdminWalletStudent | null>(null)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section className="flex flex-col gap-3">
        <Label htmlFor="wallet-search">Buscar alumno</Label>
        <Input
          id="wallet-search"
          type="search"
          placeholder="Email o nombre"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {students.isError ? (
          <ErrorState error={students.error} onRetry={() => students.refetch()} inline />
        ) : !students.data ? (
          <Skeleton className="h-48" />
        ) : students.data.length === 0 ? (
          <p className="text-body text-muted-foreground">Ningún alumno coincide.</p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {students.data.map((student) => (
              <li key={student.studentId}>
                <button
                  type="button"
                  onClick={() => setSelected(student)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-body hover:bg-muted",
                    selected?.studentId === student.studentId && "bg-muted",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{student.fullName}</span>
                    <span className="block truncate text-caption text-muted-foreground">{student.email}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">{formatReps(student.balance)} repes</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected ? (
        <StudentWallet key={selected.studentId} student={selected} />
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-6 text-body text-muted-foreground">
          Elegí un alumno para ver su historial o corregir su saldo.
        </p>
      )}
    </div>
  )
}

function StudentWallet({ student }: { student: AdminWalletStudent }) {
  const [page, setPage] = useState(0)
  const history = useWalletHistory(student.studentId, page)
  const adjust = useAdjustWallet()
  const [delta, setDelta] = useState("")
  const [reason, setReason] = useState("")

  const parsed = parseWhole(delta)
  const valid = parsed.ok && parsed.value !== 0 && reason.trim().length > 0

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!valid || !parsed.ok || parsed.value === null) return
    adjust.mutate(
      { studentId: student.studentId, delta: parsed.value, reason: reason.trim() },
      { onSuccess: () => { setDelta(""); setReason("") } },
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-subtitle font-semibold tracking-tight">{student.fullName}</h2>
        <p className="text-caption text-muted-foreground">
          Saldo {formatReps(student.balance)} · ganó {formatReps(student.lifetimeEarned)} · gastó{" "}
          {formatReps(student.lifetimeSpent)}
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="adjust-delta">Repes</Label>
          <Input
            id="adjust-delta"
            inputMode="numeric"
            placeholder="+50 / -30"
            value={delta}
            aria-invalid={delta !== "" && !parsed.ok ? true : undefined}
            onChange={(event) => setDelta(event.target.value.replace(/^\+/, ""))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="adjust-reason">Motivo (lo ve el alumno)</Label>
          <Input
            id="adjust-reason"
            maxLength={190}
            placeholder="Compensación por un entrenamiento que no se registró"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={!valid || adjust.isPending}>
          {adjust.isPending ? "Aplicando…" : "Aplicar ajuste"}
        </Button>
      </form>

      {history.isError ? (
        <ErrorState error={history.error} onRetry={() => history.refetch()} inline />
      ) : !history.data ? (
        <Skeleton className="h-48" />
      ) : history.data.isEmpty ? (
        <p className="text-body text-muted-foreground">Sin movimientos todavía.</p>
      ) : (
        <>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {history.data.items.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-body">
                <span className="min-w-0">
                  <span className="block truncate">{entry.reason ?? LEDGER_TYPE_LABELS[entry.type] ?? entry.type}</span>
                  <span className="block text-caption text-muted-foreground">
                    {LEDGER_TYPE_LABELS[entry.type] ?? entry.type} · {new Date(entry.createdAt).toLocaleString("es-AR")}
                  </span>
                </span>
                <span className="shrink-0 text-right tabular-nums">
                  <span className={cn("block font-medium", entry.reps < 0 && "text-error-text")}>
                    {entry.reps > 0 ? "+" : ""}
                    {formatReps(entry.reps)}
                  </span>
                  <span className="block text-caption text-muted-foreground">saldo {formatReps(entry.balanceAfter)}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between">
            <Button variant="outline" size="sm" disabled={history.data.isFirst} onClick={() => setPage((p) => p - 1)}>
              Más nuevos
            </Button>
            <Button variant="outline" size="sm" disabled={history.data.isLast} onClick={() => setPage((p) => p + 1)}>
              Más viejos
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
