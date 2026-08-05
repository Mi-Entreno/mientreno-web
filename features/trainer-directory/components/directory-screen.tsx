"use client"

import { Loader2, MapPin, Search, Star, Users, X } from "lucide-react"
import { useState } from "react"

import { EmptyState } from "@/components/dashboard/empty-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebouncedValue } from "@/core/hooks/use-debounced-value"
import { formatCurrency } from "@/lib/format"
import { useSpecialties } from "@/features/specialties/hooks/use-specialties"
import { useDirectory } from "../hooks/use-directory"
import {
  EMPTY_DIRECTORY_FILTERS,
  hasDirectoryFilters,
  type DirectoryFilters,
  type DirectoryTrainer,
} from "../model/directory.model"

const RATINGS = [4, 4.5]

/**
 * The public directory, from the trainer's side.
 *
 * Useful as competitive context — what others in the same city charge, how they
 * describe themselves — which is the only reason a trainer would open a listing
 * built for students.
 */
export function DirectoryScreen() {
  const [filters, setFilters] = useState<DirectoryFilters>(EMPTY_DIRECTORY_FILTERS)
  const { data: specialties } = useSpecialties()

  const debouncedSearch = useDebouncedValue(filters.search, 300)
  const debouncedLocation = useDebouncedValue(filters.location, 300)
  const debouncedPrice = useDebouncedValue(filters.maxPrice, 400)

  const directory = useDirectory({
    ...filters,
    search: debouncedSearch,
    location: debouncedLocation,
    maxPrice: debouncedPrice,
  })

  return (
    <div className="flex flex-col gap-6">
      <p className="text-body text-muted-foreground text-pretty">
        El directorio tal y como lo ven los alumnos. Te sirve para comparar precios y posicionamiento
        con otros entrenadores.
      </p>

      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              placeholder="Buscar por nombre…"
              aria-label="Buscar entrenador"
              className="pl-9"
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            />
          </div>

          <Input
            value={filters.location}
            placeholder="Ubicación"
            aria-label="Ubicación"
            onChange={(event) => setFilters({ ...filters, location: event.target.value })}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="max-price">Precio máximo (€)</Label>
            <Input
              id="max-price"
              inputMode="decimal"
              value={filters.maxPrice}
              placeholder="Sin límite"
              onChange={(event) => setFilters({ ...filters, maxPrice: event.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Valoración mínima</Label>
            <ul className="flex flex-wrap gap-2">
              {RATINGS.map((rating) => {
                const active = filters.minRating === rating
                return (
                  <li key={rating}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setFilters({ ...filters, minRating: active ? null : rating })
                      }
                      className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <Badge variant={active ? "default" : "secondary"} className="cursor-pointer gap-1">
                        <Star className="size-3" />
                        {rating}+
                      </Badge>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {specialties && specialties.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>Especialidad</Label>
            <ul className="flex flex-wrap gap-2">
              {specialties.map((specialty) => {
                const active = filters.specialty === specialty.name
                return (
                  <li key={specialty.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setFilters({ ...filters, specialty: active ? null : specialty.name })
                      }
                      className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <Badge variant={active ? "default" : "secondary"} className="cursor-pointer">
                        {specialty.name}
                      </Badge>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {hasDirectoryFilters(filters) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => setFilters(EMPTY_DIRECTORY_FILTERS)}
          >
            <X className="size-4" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {directory.isLoading && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <li key={key}>
              <Skeleton className="h-44 w-full rounded-xl" />
            </li>
          ))}
        </ul>
      )}

      {directory.isError && (
        <p className="text-body text-error-text">No se ha podido cargar el directorio.</p>
      )}

      {!directory.isLoading && directory.trainers.length === 0 && (
        <EmptyState
          icon={Users}
          title="Ningún entrenador coincide"
          description="Prueba con otros filtros o amplía el rango de precio."
        />
      )}

      {directory.trainers.length > 0 && (
        <>
          <p className="text-body text-muted-foreground">
            {directory.totalItems}{" "}
            {directory.totalItems === 1 ? "entrenador" : "entrenadores"}
          </p>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {directory.trainers.map((trainer) => (
              <TrainerCard key={trainer.id} trainer={trainer} />
            ))}
          </ul>

          {directory.hasNextPage && (
            <Button
              variant="outline"
              className="self-center"
              disabled={directory.isFetchingNextPage}
              onClick={() => directory.fetchNextPage()}
            >
              {directory.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
              {directory.isFetchingNextPage ? "Cargando…" : "Cargar más"}
            </Button>
          )}
        </>
      )}
    </div>
  )
}

function TrainerCard({ trainer }: { trainer: DirectoryTrainer }) {
  const initials =
    trainer.fullName
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "T"

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Avatar className="size-11 shrink-0">
          <AvatarImage src={trainer.avatarUrl ?? "/placeholder.svg"} alt="" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <p className="truncate font-medium">{trainer.fullName}</p>
          <p className="flex items-center gap-1 text-caption text-muted-foreground">
            <Star className="size-3" />
            {trainer.avgRating === null
              ? "Sin valoraciones"
              : `${trainer.avgRating.toFixed(1)} · ${trainer.totalReviews}`}
          </p>
        </div>
      </div>

      {trainer.bio && (
        <p className="line-clamp-2 text-body text-muted-foreground text-pretty">{trainer.bio}</p>
      )}

      <ul className="flex flex-wrap gap-1.5">
        {trainer.specialties.slice(0, 3).map((specialty) => (
          <li key={specialty}>
            <Badge variant="secondary">{specialty}</Badge>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-body">
        {trainer.location ? (
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-3.5" />
            {trainer.location}
          </span>
        ) : (
          <span />
        )}
        <span className="font-medium">
          {trainer.basePrice === null ? "—" : formatCurrency(trainer.basePrice)}
        </span>
      </div>
    </li>
  )
}
