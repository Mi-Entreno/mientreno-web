"use client"

import { Loader2, Search, X } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSpecialties } from "../hooks/use-specialties"

interface SpecialtyMultiSelectProps {
  value: number[]
  onChange: (ids: number[]) => void
  disabled?: boolean
  /** Backend caps nothing, but a huge list makes the public profile useless. */
  max?: number
}

/**
 * Picks the `specialtyIds` that `POST /complete` and `PUT /api/trainer/profile`
 * both require.
 *
 * Filters the cached catalogue locally instead of calling
 * `/api/specialties/search` on every keystroke: the list is small, static
 * reference data already in memory, so a network round trip per character
 * would be slower and noisier for no benefit. The search endpoint stays
 * available for callers that do not hold the full list.
 */
export function SpecialtyMultiSelect({
  value,
  onChange,
  disabled,
  max = 8,
}: SpecialtyMultiSelectProps) {
  const { data: specialties, isLoading, isError } = useSpecialties()
  const [query, setQuery] = useState("")

  const selected = useMemo(
    () => (specialties ?? []).filter((item) => value.includes(item.id)),
    [specialties, value],
  )

  const available = useMemo(() => {
    if (!specialties) return []
    const needle = query.trim().toLowerCase()

    return specialties
      .filter((item) => !value.includes(item.id))
      .filter((item) => (needle ? item.name.toLowerCase().includes(needle) : true))
      .slice(0, 24)
  }, [specialties, value, query])

  const atLimit = value.length >= max

  function toggle(id: number) {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id))
    } else if (!atLimit) {
      onChange([...value, id])
    }
  }

  if (isError) {
    return (
      <p className="text-body text-error-text">
        No se ha podido cargar el catálogo de especialidades.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <li key={item.id}>
              <Badge variant="secondary" className="gap-1.5 py-1 pl-3 pr-1.5">
                {item.name}
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  disabled={disabled}
                  aria-label={`Quitar ${item.name}`}
                  className="rounded-full p-0.5 transition-colors hover:bg-background/60 disabled:opacity-50"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar especialidad…"
          disabled={disabled || isLoading}
          className="pl-9"
          aria-label="Buscar especialidad"
        />
      </div>

      {isLoading ? (
        <p className="flex items-center gap-2 text-body text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando especialidades…
        </p>
      ) : (
        <>
          {atLimit && (
            <p className="text-caption text-muted-foreground">
              Has alcanzado el máximo de {max} especialidades.
            </p>
          )}

          {available.length === 0 ? (
            <p className="text-body text-muted-foreground">
              {query ? "Ninguna especialidad coincide con la búsqueda." : "No hay más especialidades."}
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {available.map((item) => (
                <li key={item.id}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || atLimit}
                    onClick={() => toggle(item.id)}
                  >
                    {item.name}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
