import { TriangleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { hasAllergies, type StudentAllergies as Allergies } from "../model/student.model"

/**
 * The allergies a student chose to share with their trainer.
 *
 * Renders nothing when there are none to show, and says nothing about why: an
 * empty value means the student did not share any, not that they have none, so
 * "Sin alergias" would be a claim the panel cannot make. The backend sends them
 * only with explicit consent (V69), for nutrition planning — which is why this
 * sits on the student header and on the nutrition list.
 */
export function StudentAllergies({ allergies, compact = false }: { allergies: Allergies; compact?: boolean }) {
  if (!hasAllergies(allergies)) return null

  if (compact) {
    const summary = [...allergies.list, allergies.other].filter(Boolean).join(", ")
    return (
      <p className="flex items-center gap-1.5 truncate text-body text-error-text">
        <TriangleAlert className="size-3.5 shrink-0" />
        <span className="truncate">Alergias: {summary}</span>
      </p>
    )
  }

  return (
    <section
      aria-label="Alergias del alumno"
      className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
    >
      <h3 className="flex items-center gap-2 font-medium">
        <TriangleAlert className="size-4 text-error-text" />
        Alergias e intolerancias
      </h3>
      {allergies.list.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {allergies.list.map((item) => (
            <li key={item}>
              <Badge variant="destructive">{item}</Badge>
            </li>
          ))}
        </ul>
      )}
      {allergies.other && <p className="text-body text-muted-foreground">{allergies.other}</p>}
      <p className="text-caption text-muted-foreground">
        El alumno las compartió para que armes su plan de alimentación. Puede retirarlas cuando quiera.
      </p>
    </section>
  )
}
