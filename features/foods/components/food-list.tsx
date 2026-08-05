"use client"

import { Apple, Loader2, Plus, SearchX } from "lucide-react"

import { EmptyState } from "@/components/dashboard/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Food } from "../model/food.model"
import { MacroSummary } from "./macro-summary"

interface FoodListProps {
  foods: Food[]
  totalItems: number
  isLoading: boolean
  isError: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
  onSelect: (food: Food) => void
  actionLabel?: string
  actionIcon?: "view" | "add"
}

export function FoodList({
  foods,
  totalItems,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onSelect,
  actionLabel = "Ver detalle",
  actionIcon = "view",
}: FoodListProps) {
  if (isLoading) {
    return (
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <li key={index}>
            <Skeleton className="h-28 w-full rounded-xl" />
          </li>
        ))}
      </ul>
    )
  }

  if (isError) {
    return <p className="text-body text-error-text">No se ha podido cargar el catálogo.</p>
  }

  if (foods.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Ningún alimento coincide"
        description="Prueba con otro nombre o marca."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-muted-foreground">
        {totalItems} {totalItems === 1 ? "alimento" : "alimentos"}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {foods.map((food) => (
          <li
            key={food.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <Apple className="size-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-balance">{food.name}</h3>
                {food.brand && (
                  <p className="truncate text-caption text-muted-foreground">{food.brand}</p>
                )}
              </div>
            </div>

            {/* Values are per 100 g regardless of `servingDescription`. */}
            <MacroSummary macros={food.macros} compact />

            {food.category && (
              <Badge variant="secondary" className="self-start">
                {food.category}
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              className="mt-auto self-start"
              onClick={() => onSelect(food)}
            >
              {actionIcon === "add" && <Plus className="size-4" />}
              {actionLabel}
            </Button>
          </li>
        ))}
      </ul>

      {hasNextPage && (
        <Button
          variant="outline"
          className="self-center"
          disabled={isFetchingNextPage}
          onClick={onLoadMore}
        >
          {isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
          {isFetchingNextPage ? "Cargando…" : "Cargar más"}
        </Button>
      )}
    </div>
  )
}
