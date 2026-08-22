"use client"

import { Check, Loader2, Search, UserRoundSearch } from "lucide-react"

import { ErrorState } from "@/components/dashboard/error-state"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useStudentSearch } from "../hooks/use-student-search"
import {
  MIN_SEARCH_LENGTH,
  blockedReason,
  type StudentCandidate,
} from "../model/student-search.model"

interface StudentSearchPanelProps {
  /** Controlled so the parent can keep the term while moving between steps. */
  term: string
  onTermChange: (term: string) => void
  /** Already-debounced term; the parent owns the delay. */
  debouncedTerm: string
  selectedId: number | null
  onSelect: (candidate: StudentCandidate) => void
}

/**
 * Search box plus results, shared by the invitation wizard and anywhere else a
 * student has to be picked.
 *
 * Rows the trainer cannot invite are rendered disabled *with the reason* rather
 * than filtered out: "she is not in the list" is indistinguishable from "she is
 * not registered", and the trainer would keep searching for someone who is
 * already their student.
 */
export function StudentSearchPanel({
  term,
  onTermChange,
  debouncedTerm,
  selectedId,
  onSelect,
}: StudentSearchPanelProps) {
  const search = useStudentSearch(debouncedTerm)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="student-search">Buscar alumno</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="student-search"
            type="search"
            value={term}
            autoComplete="off"
            placeholder="Nombre o correo del alumno"
            className="pl-9"
            onChange={(event) => onTermChange(event.target.value)}
          />
        </div>
        <p className="text-caption text-muted-foreground">
          Se buscan alumnos registrados en Mi Entreno. Escribe al menos{" "}
          {MIN_SEARCH_LENGTH} caracteres.
        </p>
      </div>

      {search.isIdle && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <UserRoundSearch className="size-6 text-muted-foreground" />
          <p className="text-body text-muted-foreground text-pretty">
            Busca por nombre o correo para empezar.
          </p>
        </div>
      )}

      {search.isLoading && (
        <ul className="flex flex-col gap-2">
          {[0, 1, 2].map((key) => (
            <li key={key}>
              <Skeleton className="h-16 w-full rounded-xl" />
            </li>
          ))}
        </ul>
      )}

      {search.isError && <SearchError error={search.error} />}

      {!search.isIdle && !search.isLoading && !search.isError && search.candidates.length === 0 && (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-body text-muted-foreground text-pretty">
            Ningún alumno coincide con “{debouncedTerm}”. Comprueba el correo con el que se
            registró.
          </p>
        </div>
      )}

      {search.candidates.length > 0 && (
        <>
          <ul className="flex flex-col gap-2" role="listbox" aria-label="Resultados de la búsqueda">
            {search.candidates.map((candidate) => (
              <CandidateRow
                key={candidate.id}
                candidate={candidate}
                selected={candidate.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </ul>

          {search.hasNextPage && (
            <Button
              type="button"
              variant="outline"
              className="self-center"
              disabled={search.isFetchingNextPage}
              onClick={() => search.fetchNextPage()}
            >
              {search.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
              {search.isFetchingNextPage ? "Cargando…" : "Cargar más"}
            </Button>
          )}
        </>
      )}
    </div>
  )
}

/**
 * A 404 here is not "no results" — it is the endpoint itself missing, which is
 * the state this feature ships in until the backend adds it. `userMessage`
 * turns that into "todavía no está disponible" rather than "no encontramos
 * nada", which would read as a search that works and found no one.
 */
function SearchError({ error }: { error: unknown }) {
  return <ErrorState error={error} context="load" inline />
}

function CandidateRow({
  candidate,
  selected,
  onSelect,
}: {
  candidate: StudentCandidate
  selected: boolean
  onSelect: (candidate: StudentCandidate) => void
}) {
  const blocked = blockedReason(candidate)

  return (
    // `presentation` because a listbox's options must be its own children in the
    // accessibility tree; the `li` is only here for the visual list.
    <li role="presentation">
      <button
        type="button"
        role="option"
        aria-selected={selected}
        disabled={blocked !== null}
        onClick={() => onSelect(candidate)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
          "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          selected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-input",
          blocked !== null && "cursor-not-allowed opacity-60 hover:border-border",
        )}
      >
        <UserAvatar name={candidate.fullName} src={candidate.avatarUrl} className="size-10" />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{candidate.fullName}</p>
          <p className="truncate text-body text-muted-foreground">
            {candidate.email ?? "Sin correo"}
            {candidate.location && ` · ${candidate.location}`}
          </p>
        </div>

        {blocked !== null && (
          <Badge variant="secondary" className="shrink-0">
            {blocked}
          </Badge>
        )}

        {selected && blocked === null && (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-4" />
          </span>
        )}
      </button>
    </li>
  )
}
