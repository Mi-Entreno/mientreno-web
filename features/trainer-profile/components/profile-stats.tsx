"use client"

import { Star, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { TrainerProfile } from "../model/trainer-profile.model"

/**
 * Read-only figures the backend computes: rating, review count and active
 * students. None of them are editable, so they sit outside the form.
 */
export function ProfileStats({ profile }: { profile: TrainerProfile }) {
  const { average, total } = profile.rating

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Star className="size-4 text-muted-foreground" />
          <span className="text-body">
            {average === null ? (
              <span className="text-muted-foreground">Sin valoraciones</span>
            ) : (
              <>
                <span className="font-medium">{average.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {total} {total === 1 ? "reseña" : "reseñas"}
                </span>
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <span className="text-body">
            <span className="font-medium">{profile.activeStudents}</span>
            <span className="text-muted-foreground">
              {" "}
              {profile.activeStudents === 1 ? "alumno activo" : "alumnos activos"}
            </span>
          </span>
        </div>
      </div>

      {profile.specialtyNames.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {profile.specialtyNames.map((name) => (
            <li key={name}>
              <Badge variant="secondary">{name}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
