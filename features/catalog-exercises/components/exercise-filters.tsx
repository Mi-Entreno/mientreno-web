"use client"

import { Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useCatalogFilters } from "../hooks/use-catalog-exercises"
import { hasActiveFilters, type CatalogSearchParams } from "../model/catalog-exercise.model"

interface ExerciseFiltersProps {
  value: CatalogSearchParams
  onChange: (params: CatalogSearchParams) => void
  disabled?: boolean
}

/**
 * Search box plus the two catalogue filters.
 *
 * The muscle-group and equipment values come straight from
 * `/api/catalog-exercises/filters` and are sent back untouched: the repository
 * query uses `ce.muscleGroup = :muscleGroup`, so anything typed by hand or
 * re-cased would silently match nothing. Hence chips rather than a text field.
 */
export function ExerciseFilters({ value, onChange, disabled }: ExerciseFiltersProps) {
  const { data: filters, isLoading } = useCatalogFilters()

  function toggle(key: "muscleGroup" | "equipment", option: string) {
    onChange({ ...value, [key]: value[key] === option ? null : option })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.search}
          disabled={disabled}
          placeholder="Buscar por nombre…"
          aria-label="Buscar ejercicio"
          className="pl-9"
          onChange={(event) => onChange({ ...value, search: event.target.value })}
        />
      </div>

      {!isLoading && filters && (
        <>
          <FilterRow
            label="Grupo muscular"
            options={filters.muscleGroups}
            selected={value.muscleGroup}
            disabled={disabled}
            onToggle={(option) => toggle("muscleGroup", option)}
          />
          <FilterRow
            label="Equipamiento"
            options={filters.equipment}
            selected={value.equipment}
            disabled={disabled}
            onToggle={(option) => toggle("equipment", option)}
          />
        </>
      )}

      {hasActiveFilters(value) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="self-start"
          onClick={() => onChange({ search: "", muscleGroup: null, equipment: null })}
        >
          <X className="size-4" />
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}

function FilterRow({
  label,
  options,
  selected,
  disabled,
  onToggle,
}: {
  label: string
  options: string[]
  selected: string | null
  disabled?: boolean
  onToggle: (option: string) => void
}) {
  if (options.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <ul className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected === option
          return (
            <li key={option}>
              <button
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => onToggle(option)}
                className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
              >
                <Badge
                  variant={active ? "default" : "secondary"}
                  className={cn("cursor-pointer", disabled && "cursor-not-allowed")}
                >
                  {option}
                </Badge>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
