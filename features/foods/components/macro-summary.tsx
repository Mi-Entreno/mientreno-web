import { cn } from "@/lib/utils"
import type { FoodMacros } from "../model/food.model"

const ROWS: { key: keyof FoodMacros; label: string; short: string; unit: string }[] = [
  { key: "calories", label: "Calorías", short: "kcal", unit: "kcal" },
  { key: "protein", label: "Proteína", short: "P", unit: "g" },
  { key: "carbs", label: "Carbohidratos", short: "C", unit: "g" },
  { key: "fat", label: "Grasas", short: "G", unit: "g" },
  { key: "fiber", label: "Fibra", short: "F", unit: "g" },
]

/**
 * Macro table. Every value is nullable — the importer leaves gaps — so a
 * missing macro renders as a dash rather than as zero, which would read as a
 * measured absence.
 */
export function MacroSummary({
  macros,
  caption,
  compact,
}: {
  macros: FoodMacros
  caption?: string
  compact?: boolean
}) {
  if (compact) {
    // "142 kcal · P 12g · C 3g · G 8g"
    const parts = ROWS.slice(0, 4)
      .filter((row) => macros[row.key] !== null)
      .map((row) =>
        row.key === "calories"
          ? `${macros[row.key]} kcal`
          : `${row.short} ${macros[row.key]}${row.unit}`,
      )

    if (parts.length === 0) {
      return <p className="text-body text-muted-foreground">Sin datos nutricionales</p>
    }

    return <p className="text-body text-muted-foreground">{parts.join(" · ")}</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {caption && <p className="text-caption text-muted-foreground">{caption}</p>}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {ROWS.map((row) => {
          const value = macros[row.key]
          return (
            <div key={row.key} className="flex flex-col">
              <dt className="text-caption text-muted-foreground">{row.label}</dt>
              <dd className={cn("text-body font-medium", value === null && "text-muted-foreground")}>
                {value === null ? "—" : `${value} ${row.unit}`}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
