"use client"

import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  expectedRepsPerSpin,
  formatDecimal,
  formatPercent,
  formatReps,
  PROFILES,
  prizeProbabilities,
  spinsPerMonth,
  type EconomyConfig,
  type WheelPrize,
} from "../model/economy-admin.model"
import { WholeInput } from "./whole-input"

/**
 * The wheel: when a spin is granted and what it can pay. Weights are relative,
 * so the probability and the average per spin are computed live — that average
 * is the number that matters for the budget, not the jackpot.
 */
export function WheelEditor({ config, onChange }: { config: EconomyConfig; onChange: (next: EconomyConfig) => void }) {
  const wheel = config.wheel
  const setWheel = (patch: Partial<EconomyConfig["wheel"]>) => onChange({ ...config, wheel: { ...wheel, ...patch } })
  const setPrize = (index: number, patch: Partial<WheelPrize>) =>
    setWheel({ prizes: wheel.prizes.map((prize, i) => (i === index ? { ...prize, ...patch } : prize)) })

  const probabilities = prizeProbabilities(wheel.prizes)
  const average = expectedRepsPerSpin(wheel.prizes)

  const addPrize = () => {
    const ids = wheel.prizes.map((p) => p.id)
    let id = "premio"
    for (let n = 2; ids.includes(id); n++) id = `premio-${n}`
    setWheel({ prizes: [...wheel.prizes, { id, label: "Nuevo premio", reps: 1, weight: 1, enabled: false }] })
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-3">
        <label className="flex items-start gap-3 text-body">
          <Switch checked={wheel.monthlySpin} onCheckedChange={(monthlySpin) => setWheel({ monthlySpin })} />
          <span>
            <span className="font-medium">Una por mes</span>
            <span className="block text-caption text-muted-foreground">Entrene o no.</span>
          </span>
        </label>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="spin-every">Una cada N días entrenados en el mes</Label>
          <WholeInput
            id="spin-every"
            min={0}
            value={wheel.spinEveryTrainingDays}
            onValueChange={(value) => setWheel({ spinEveryTrainingDays: value ?? 0 })}
          />
          <p className="text-caption text-muted-foreground">0 apaga esta forma.</p>
        </div>
        <label className="flex items-start gap-3 text-body">
          <Switch checked={wheel.dailySpin} onCheckedChange={(dailySpin) => setWheel({ dailySpin })} />
          <span>
            <span className="font-medium">Una por día</span>
            <span className="block text-caption text-muted-foreground">
              Como propone el modelo de puntos. Multiplica por ~30 lo que la ruleta emite: revisá la simulación.
            </span>
          </span>
        </label>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        <Stat label="Promedio por tirada" value={`${formatDecimal(average)} repes`} hint="El modelo apunta a 3–4" />
        {PROFILES.map((profile) => {
          const spins = spinsPerMonth(wheel, profile)
          return (
            <Stat
              key={profile.id}
              label={`${profile.label}: por mes`}
              value={`${formatReps(Math.round(spins * average))} repes`}
              hint={`${spins} ${spins === 1 ? "tirada" : "tiradas"}`}
            />
          )
        })}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-heading text-subtitle font-semibold tracking-tight">Premios</h2>
          <Button variant="outline" size="sm" onClick={addPrize}>
            <Plus />
            Agregar premio
          </Button>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-body">
            <thead className="text-left text-caption text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-2 font-medium">Activo</th>
                <th className="px-4 py-2 font-medium">Texto</th>
                <th className="px-4 py-2 font-medium">Repes</th>
                <th className="px-4 py-2 font-medium">Peso</th>
                <th className="px-4 py-2 font-medium">Probabilidad</th>
                <th className="px-4 py-2" aria-label="Acciones" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {wheel.prizes.map((prize, index) => {
                const probability = probabilities[prize.id] ?? 0
                return (
                  <tr key={`${prize.id}-${index}`} className={cn(!prize.enabled && "text-muted-foreground")}>
                    <td className="px-4 py-2">
                      <Switch
                        aria-label={`Activar ${prize.label}`}
                        checked={prize.enabled}
                        onCheckedChange={(enabled) => setPrize(index, { enabled })}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        aria-label="Texto del premio"
                        maxLength={100}
                        value={prize.label}
                        onChange={(event) => setPrize(index, { label: event.target.value })}
                      />
                      <p className="mt-0.5 text-caption text-muted-foreground">
                        id: <code>{prize.id}</code>
                      </p>
                    </td>
                    <td className="w-24 px-4 py-2">
                      <WholeInput
                        aria-label="Repes del premio"
                        min={0}
                        value={prize.reps}
                        onValueChange={(reps) => setPrize(index, { reps: reps ?? 0 })}
                      />
                    </td>
                    <td className="w-24 px-4 py-2">
                      <WholeInput
                        aria-label="Peso del premio"
                        min={0}
                        value={prize.weight}
                        onValueChange={(weight) => setPrize(index, { weight: weight ?? 0 })}
                      />
                    </td>
                    <td className="w-48 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-muted" aria-hidden>
                          <div className="h-2 rounded-full bg-viz-1" style={{ width: `${probability * 100}%` }} />
                        </div>
                        <span className="w-14 text-right tabular-nums">{formatPercent(probability)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Quitar ${prize.label}`}
                        onClick={() => setWheel({ prizes: wheel.prizes.filter((_, i) => i !== index) })}
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-caption text-muted-foreground">
          Quitar un premio no afecta las tiradas ya giradas: cada una guarda qué salió. Un premio de 0 repes es el
          &quot;esta vez no&quot;.
        </p>
      </section>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-subtitle font-semibold">{value}</p>
      {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
    </div>
  )
}
