"use client"

import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useEconomy } from "../hooks/use-economy-admin"
import {
  formatReps,
  newRule,
  RULE_TYPE_ORDER,
  RULE_TYPES,
  simulate,
  type EarnRule,
  type EarnRuleType,
  type EconomyConfig,
  type ProfileSimulation,
} from "../model/economy-admin.model"
import { WholeInput } from "./whole-input"

/**
 * Limits and earning rules, with the monthly simulation next to them so every
 * edit shows its effect on the three profiles of the points model.
 */
export function RulesEditor({ config, onChange }: { config: EconomyConfig; onChange: (next: EconomyConfig) => void }) {
  const savedIds = new Set(useEconomy().data?.earning.rules.map((rule) => rule.id) ?? [])

  const setRule = (index: number, patch: Partial<EarnRule>) =>
    onChange({
      ...config,
      earning: {
        ...config.earning,
        rules: config.earning.rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)),
      },
    })

  const removeRule = (index: number) =>
    onChange({ ...config, earning: { ...config.earning, rules: config.earning.rules.filter((_, i) => i !== index) } })

  const addRule = (type: EarnRuleType) =>
    onChange({
      ...config,
      earning: {
        ...config.earning,
        rules: [...config.earning.rules, newRule(type, config.earning.rules.map((rule) => rule.id))],
      },
    })

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-6">
        <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
          <Field
            id="max-per-month"
            label="Desbloqueos de desafíos por mes"
            hint="El modelo de puntos recomienda 1 al lanzar."
          >
            <WholeInput
              id="max-per-month"
              min={1}
              value={config.challenges.maxPerMonth}
              onValueChange={(value) => onChange({ ...config, challenges: { maxPerMonth: value ?? 0 } })}
            />
          </Field>
          <Field
            id="daily-cap"
            label="Tope diario de repes por alumno"
            hint="Red de seguridad sobre todas las reglas juntas (la bienvenida no cuenta)."
          >
            <WholeInput
              id="daily-cap"
              min={1}
              value={config.earning.dailyCapReps}
              onValueChange={(value) => onChange({ ...config, earning: { ...config.earning, dailyCapReps: value ?? 0 } })}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-heading text-subtitle font-semibold tracking-tight">Cómo se ganan repes</h2>
            <AddRule onAdd={addRule} />
          </div>
          <ul className="flex flex-col gap-3">
            {config.earning.rules.map((rule, index) => (
              <RuleCard
                key={`${rule.id}-${index}`}
                rule={rule}
                isNew={!savedIds.has(rule.id)}
                onChange={(patch) => setRule(index, patch)}
                onRemove={() => removeRule(index)}
              />
            ))}
          </ul>
        </section>

        <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
          <p className="text-body font-semibold sm:col-span-2">Perfiles del tablero</p>
          <Field id="occasional-max" label="Ocasional: hasta (repes/mes)">
            <WholeInput
              id="occasional-max"
              min={1}
              value={config.analytics?.occasionalMaxReps ?? 200}
              onValueChange={(value) =>
                onChange({
                  ...config,
                  analytics: { activeMinReps: config.analytics?.activeMinReps ?? 450, occasionalMaxReps: value ?? 0 },
                })
              }
            />
          </Field>
          <Field id="active-min" label="Muy activo: desde (repes/mes)">
            <WholeInput
              id="active-min"
              min={1}
              value={config.analytics?.activeMinReps ?? 450}
              onValueChange={(value) =>
                onChange({
                  ...config,
                  analytics: { occasionalMaxReps: config.analytics?.occasionalMaxReps ?? 200, activeMinReps: value ?? 0 },
                })
              }
            />
          </Field>
        </section>
      </div>

      <SimulationPanel config={config} />
    </div>
  )
}

function RuleCard({
  rule,
  isNew,
  onChange,
  onRemove,
}: {
  rule: EarnRule
  isNew: boolean
  onChange: (patch: Partial<EarnRule>) => void
  onRemove: () => void
}) {
  const meta = RULE_TYPES[rule.type]
  const prefix = `rule-${rule.id}`

  return (
    <li className={cn("flex flex-col gap-4 rounded-2xl border border-border bg-card p-5", !rule.enabled && "opacity-75")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading text-body-lg font-semibold">{meta?.label ?? rule.type}</p>
          <p className="text-caption text-muted-foreground">{meta?.trigger}</p>
          <p className="text-caption text-muted-foreground">
            id: <code>{rule.id}</code>
            {isNew && " · nueva"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-body">
            <Switch checked={rule.enabled} onCheckedChange={(enabled) => onChange({ enabled })} />
            {rule.enabled ? "Prendida" : "Apagada"}
          </label>
          {isNew && (
            <Button variant="ghost" size="icon-sm" aria-label={`Quitar ${rule.label}`} onClick={onRemove}>
              <Trash2 />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field id={`${prefix}-label`} label="Texto para el alumno" className="sm:col-span-2">
          <Input
            id={`${prefix}-label`}
            maxLength={120}
            value={rule.label}
            onChange={(event) => onChange({ label: event.target.value })}
          />
        </Field>
        <Field id={`${prefix}-reps`} label="Repes">
          <WholeInput id={`${prefix}-reps`} min={1} value={rule.reps} onValueChange={(reps) => onChange({ reps: reps ?? 0 })} />
        </Field>
        {meta?.monthlyCap !== false && (
          <Field id={`${prefix}-cap`} label="Tope mensual" hint="Vacío = sin tope">
            <WholeInput
              id={`${prefix}-cap`}
              allowEmpty
              min={rule.reps}
              placeholder="Sin tope"
              value={rule.monthlyCapReps}
              onValueChange={(monthlyCapReps) => onChange({ monthlyCapReps })}
            />
          </Field>
        )}
        {meta?.params.map((param) => (
          <Field key={param.key} id={`${prefix}-${param.key}`} label={param.label}>
            <WholeInput
              id={`${prefix}-${param.key}`}
              min={param.min}
              value={rule.params?.[param.key] ?? null}
              onValueChange={(value) => onChange({ params: { ...(rule.params ?? {}), [param.key]: value ?? 0 } })}
            />
          </Field>
        ))}
      </div>
    </li>
  )
}

function AddRule({ onAdd }: { onAdd: (type: EarnRuleType) => void }) {
  const [type, setType] = useState<EarnRuleType>("PER_WORKOUT")
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="new-rule-type" className="sr-only">
        Tipo de regla
      </label>
      <select
        id="new-rule-type"
        className="h-8 rounded-lg border border-border-dark bg-transparent px-2 text-body"
        value={type}
        onChange={(event) => setType(event.target.value as EarnRuleType)}
      >
        {RULE_TYPE_ORDER.map((value) => (
          <option key={value} value={value}>
            {RULE_TYPES[value].label}
          </option>
        ))}
      </select>
      <Button variant="outline" size="sm" onClick={() => onAdd(type)}>
        <Plus />
        Agregar regla
      </Button>
    </div>
  )
}

/**
 * Monthly reps per profile with the draft economy. A bar per profile on a
 * shared scale, with the model's target range shaded behind it; the number is
 * always printed, so nothing depends on reading the bar.
 */
function SimulationPanel({ config }: { config: EconomyConfig }) {
  const simulations = simulate(config)
  const scale = Math.max(800, ...simulations.map((s) => s.total), ...simulations.map((s) => s.profile.target[1]))

  return (
    <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-border bg-card p-5 xl:sticky xl:top-20">
      <div>
        <h2 className="font-heading text-subtitle font-semibold tracking-tight">Simulación mensual</h2>
        <p className="text-caption text-muted-foreground">
          Repes por mes según los perfiles del modelo de puntos. El rango sombreado es el objetivo de cada perfil.
        </p>
      </div>
      {simulations.map((simulation) => (
        <ProfileBar key={simulation.profile.id} simulation={simulation} scale={scale} />
      ))}
      <p className="text-caption text-muted-foreground">
        Supuestos: ocasional 6 entrenamientos/mes, constante 13, muy activo 22; comida, check-in y marcas en proporción.
        No incluye la bienvenida ni el tope diario.
      </p>
    </aside>
  )
}

const STATUS_TEXT: Record<ProfileSimulation["status"], string> = {
  below: "Por debajo del objetivo",
  within: "Dentro del objetivo",
  above: "Por encima del objetivo",
}

function ProfileBar({ simulation, scale }: { simulation: ProfileSimulation; scale: number }) {
  const { profile, total, status, lines } = simulation
  const [min, max] = profile.target
  const pct = (value: number) => `${Math.min(100, (value / scale) * 100)}%`

  return (
    <details className="group flex flex-col gap-1.5">
      <summary className="flex cursor-pointer list-none flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2 text-body">
          <span className="font-medium">
            {profile.label} <span className="text-caption text-muted-foreground">· {profile.share}</span>
          </span>
          <span className="font-heading font-semibold tabular-nums">{formatReps(total)}</span>
        </div>
        <div className="relative h-3 rounded-full bg-muted" aria-hidden>
          <div
            className="absolute inset-y-0 rounded-full bg-viz-1/15"
            style={{ left: pct(min), width: `calc(${pct(max)} - ${pct(min)})` }}
          />
          <div className="absolute inset-y-0.5 left-0 rounded-full bg-viz-1" style={{ width: pct(total) }} />
        </div>
        <p className={cn("text-caption", status === "within" ? "text-muted-foreground" : "text-warning-text")}>
          {STATUS_TEXT[status]} ({formatReps(min)}–{formatReps(max)})
        </p>
      </summary>
      <ul className="mt-1 flex flex-col gap-0.5 rounded-lg bg-muted/50 p-2 text-caption">
        {lines.map((line) => (
          <li key={line.label} className="flex justify-between gap-2">
            <span>{line.label}</span>
            <span className="tabular-nums">{formatReps(line.reps)}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

function Field({
  id,
  label,
  hint,
  className,
  children,
}: {
  id: string
  label: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
    </div>
  )
}
