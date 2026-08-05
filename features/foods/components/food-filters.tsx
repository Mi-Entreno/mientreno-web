"use client"

import { Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FoodSearchParams } from "../model/food.model"

interface FoodFiltersProps {
  value: FoodSearchParams
  /** Harvested from the loaded results — see `collectCategories`. */
  categories: string[]
  onChange: (params: FoodSearchParams) => void
  disabled?: boolean
}

export function FoodFilters({ value, categories, onChange, disabled }: FoodFiltersProps) {
  const hasFilters = Boolean(value.search.trim() || value.category)

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.search}
          disabled={disabled}
          placeholder="Buscar por nombre o marca…"
          aria-label="Buscar alimento"
          className="pl-9"
          onChange={(event) => onChange({ ...value, search: event.target.value })}
        />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>Categoría</Label>
          <ul className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const active = value.category === category
              return (
                <li key={category}>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={active}
                    onClick={() =>
                      onChange({ ...value, category: active ? null : category })
                    }
                    className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
                  >
                    <Badge variant={active ? "default" : "secondary"} className="cursor-pointer">
                      {category}
                    </Badge>
                  </button>
                </li>
              )
            })}
          </ul>
          {/*
            The backend has no endpoint listing every category (foods have no
            equivalent of /api/catalog-exercises/filters), and it compares with
            `=`, so only values that appear in real results can be offered.
          */}
          <p className="text-caption text-muted-foreground text-pretty">
            Categorías encontradas en los resultados cargados. La API no expone el listado
            completo.
          </p>
        </div>
      )}

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="self-start"
          onClick={() => onChange({ search: "", category: null })}
        >
          <X className="size-4" />
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}
