"use client"

import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatDate } from "@/lib/format"
import { useProgressEntry } from "../hooks/use-progress"
import { MEASURES, type ProgressEntry } from "../model/progress.model"

interface ProgressDetailSheetProps {
  entryId: number | null
  /** From the list, so the sheet paints before the refetch lands. */
  initial?: ProgressEntry
  onOpenChange: (open: boolean) => void
}

export function ProgressDetailSheet({ entryId, initial, onOpenChange }: ProgressDetailSheetProps) {
  const { data } = useProgressEntry(entryId, initial)

  return (
    <Sheet open={entryId !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{data ? formatDate(data.recordedAt) : "Registro"}</SheetTitle>
          <SheetDescription>Medidas registradas por el alumno.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2">
          {data && (
            <>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {MEASURES.map((measure) => {
                  const value = data[measure.key]
                  return (
                    <div key={measure.key} className="flex flex-col">
                      <dt className="text-caption text-muted-foreground">{measure.label}</dt>
                      <dd
                        className={
                          value === null ? "text-body text-muted-foreground" : "text-body font-medium"
                        }
                      >
                        {/* A gap is a gap: the student did not measure it. */}
                        {value === null ? "—" : `${value} ${measure.unit}`}
                      </dd>
                    </div>
                  )
                })}
              </dl>

              {data.notes && (
                <section className="flex flex-col gap-2">
                  <h3 className="font-medium">Notas del alumno</h3>
                  <p className="whitespace-pre-line text-body text-muted-foreground text-pretty">
                    {data.notes}
                  </p>
                </section>
              )}

              {data.photoUrl && (
                <section className="flex flex-col gap-2">
                  <h3 className="font-medium">Foto</h3>
                  {/* Served through the authenticated media proxy. */}
                  <Image
                    src={data.photoUrl}
                    alt={`Foto de progreso del ${formatDate(data.recordedAt)}`}
                    width={640}
                    height={640}
                    unoptimized
                    className="w-full rounded-xl border border-border object-cover"
                  />
                </section>
              )}

              <Badge variant="secondary" className="self-start">
                Registrado el {formatDate(data.createdAt)}
              </Badge>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
