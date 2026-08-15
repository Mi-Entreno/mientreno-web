"use client"

import { Plus, X } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSpecialties } from "../hooks/use-specialties"
import { MAX_SPECIALTY_LENGTH, addSpecialty, isDuplicateSpecialty } from "../model/specialty.model"

interface SpecialtyTagsInputProps {
  value: string[]
  onChange: (specialties: string[]) => void
  disabled?: boolean
  /** Mirrors `SpecialtyResolver.MAX_PER_TRAINER`; more than this says nothing. */
  max?: number
}

/**
 * Free-text specialties.
 *
 * A trainer types whatever describes what they do and presses Enter. The
 * catalogue is still here, but demoted to what it always should have been:
 * suggestions. It is *not* a constraint, because the previous version made it
 * one — a trainer whose speciality was not one of the seeded rows simply could
 * not say so, and there was no "other" escape hatch.
 *
 * The backend resolves each name to an existing row by slug or creates it
 * (`SpecialtyResolver`), so typing "CrossFit" when someone else already typed
 * "crossfit" joins them rather than forking the vocabulary. That means this
 * component only has to prevent *local* duplicates, and can do it with the same
 * loose comparison the server uses.
 */
export function SpecialtyTagsInput({
  value,
  onChange,
  disabled,
  max = 12,
}: SpecialtyTagsInputProps) {
  // Suggestions only. A failure here is not worth showing: the field still
  // works, it just stops offering shortcuts.
  const { data: catalogue } = useSpecialties()
  const [draft, setDraft] = useState("")

  const atLimit = value.length >= max

  const suggestions = useMemo(() => {
    const needle = draft.trim().toLowerCase()

    return (catalogue ?? [])
      .map((item) => item.name)
      .filter((name) => !isDuplicateSpecialty(value, name))
      .filter((name) => (needle ? name.toLowerCase().includes(needle) : true))
      .slice(0, 8)
  }, [catalogue, value, draft])

  function add(name: string) {
    const next = addSpecialty(value, name, max)
    if (next !== value) onChange(next)
    setDraft("")
  }

  function remove(name: string) {
    onChange(value.filter((item) => item !== name))
  }

  const trimmedDraft = draft.trim()
  const canAddDraft = trimmedDraft.length > 0 && !atLimit && !isDuplicateSpecialty(value, draft)

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((name) => (
            <li key={name}>
              <Badge variant="secondary" className="gap-1.5 py-1 pl-3 pr-1.5">
                {name}
                <button
                  type="button"
                  onClick={() => remove(name)}
                  disabled={disabled}
                  aria-label={`Quitar ${name}`}
                  className="rounded-full p-0.5 transition-colors hover:bg-background/60 disabled:opacity-50"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          value={draft}
          disabled={disabled || atLimit}
          maxLength={MAX_SPECIALTY_LENGTH}
          placeholder={atLimit ? "Has alcanzado el máximo" : "Escribe una especialidad y pulsa Intro"}
          aria-label="Añadir especialidad"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter adds without submitting the profile form around it, and a
            // comma lets someone paste "Running, CrossFit" naturally.
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault()
              if (canAddDraft) add(draft)
              return
            }
            // Backspace on an empty box removes the last chip — the gesture
            // every tag input has, and the only one that needs no mouse.
            if (event.key === "Backspace" && draft.length === 0 && value.length > 0) {
              remove(value[value.length - 1])
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !canAddDraft}
          onClick={() => add(draft)}
        >
          <Plus className="size-4" />
          Añadir
        </Button>
      </div>

      {atLimit ? (
        <p className="text-caption text-muted-foreground">
          Has alcanzado el máximo de {max} especialidades.
        </p>
      ) : (
        suggestions.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-caption text-muted-foreground">
              Sugerencias — también puedes escribir la tuya:
            </p>
            <ul className="flex flex-wrap gap-2">
              {suggestions.map((name) => (
                <li key={name}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => add(name)}
                  >
                    {name}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  )
}
