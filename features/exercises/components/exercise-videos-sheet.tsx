"use client"

import { Film, Loader2, Trash2 } from "lucide-react"
import { useState } from "react"

import { ErrorState } from "@/components/dashboard/error-state"
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatDate } from "@/lib/format"
import {
  useDeleteExerciseVideo,
  useExerciseDetail,
  useExerciseVideos,
} from "../hooks/use-exercises"
import { formatBytes, type ExerciseVideo } from "../model/exercise.model"
import { VideoUploader } from "./video-uploader"

interface ExerciseVideosSheetProps {
  exerciseId: number | null
  onOpenChange: (open: boolean) => void
}

/**
 * Exercise detail and its videos.
 *
 * Only reachable from a **saved** plan: exercises get their ids from the API,
 * and a draft in the editor has none yet.
 */
export function ExerciseVideosSheet({ exerciseId, onOpenChange }: ExerciseVideosSheetProps) {
  const detail = useExerciseDetail(exerciseId)
  const videos = useExerciseVideos(exerciseId)
  const remove = useDeleteExerciseVideo(exerciseId ?? 0)
  const [pendingDelete, setPendingDelete] = useState<ExerciseVideo | null>(null)

  const list = videos.data ?? []
  // Upload sets `exercise.mediaUrl` to the newest video, and the list comes
  // back newest-first.
  const activeVideoId = list.length > 0 ? list[0].id : null

  return (
    <Sheet open={exerciseId !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{detail.data?.name ?? "Ejercicio"}</SheetTitle>
          <SheetDescription>
            {detail.data
              ? `${detail.data.dayLabel || `Día ${detail.data.dayNumber}`} · ${detail.data.planTitle}`
              : "Vídeos de demostración."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2">
          {detail.isLoading && (
            <p className="flex items-center gap-2 text-body text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando ejercicio…
            </p>
          )}

          {detail.isError && (
            <ErrorState error={detail.error} onRetry={() => detail.refetch()} inline />
          )}

          {detail.data && (
            <>
              <div className="flex flex-wrap gap-2">
                {detail.data.muscleGroup && (
                  <Badge variant="secondary">{detail.data.muscleGroup}</Badge>
                )}
                {detail.data.equipment && (
                  <Badge variant="outline">{detail.data.equipment}</Badge>
                )}
                {detail.data.secondaryMuscles.map((muscle) => (
                  <Badge key={muscle} variant="secondary">
                    {muscle}
                  </Badge>
                ))}
              </div>

              {detail.data.instructions && (
                <section className="flex flex-col gap-2">
                  <h3 className="font-medium">Instrucciones del catálogo</h3>
                  <p className="whitespace-pre-line text-body text-muted-foreground text-pretty">
                    {detail.data.instructions}
                  </p>
                </section>
              )}

              {detail.data.trainerNotes && (
                <section className="flex flex-col gap-2">
                  <h3 className="font-medium">Tus notas</h3>
                  <p className="whitespace-pre-line text-body text-muted-foreground text-pretty">
                    {detail.data.trainerNotes}
                  </p>
                </section>
              )}

              <Separator />

              <section className="flex flex-col gap-4">
                <h3 className="flex items-center gap-2 font-medium">
                  <Film className="size-4" />
                  Vídeos
                </h3>

                {exerciseId !== null && <VideoUploader exerciseId={exerciseId} />}

                {videos.isLoading ? (
                  <p className="text-body text-muted-foreground">Cargando vídeos…</p>
                ) : list.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-4 text-body text-muted-foreground">
                    Este ejercicio aún no tiene vídeos.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {list.map((video) => (
                      <li
                        key={video.id}
                        className="flex flex-col gap-3 rounded-xl border border-border p-3"
                      >
                        {video.url && (
                          // Streamed through the authenticated media proxy,
                          // which forwards Range requests so seeking works.
                          <video
                            src={video.url}
                            controls
                            preload="metadata"
                            className="w-full rounded-lg bg-secondary"
                          />
                        )}

                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-body font-medium">{video.fileName}</p>
                            <p className="text-caption text-muted-foreground">
                              {formatBytes(video.sizeBytes)} · {formatDate(video.createdAt)}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {video.id === activeVideoId && (
                              <Badge variant="secondary">Visible para el alumno</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Eliminar ${video.fileName}`}
                              className="text-error-text focus-visible:text-error-text"
                              onClick={() => setPendingDelete(video)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>

        <ConfirmDialog
          open={pendingDelete !== null}
          onOpenChange={(open) => !open && setPendingDelete(null)}
          title="¿Eliminar este vídeo?"
          description={
            pendingDelete?.id === activeVideoId
              ? "Es el vídeo que ve el alumno en este ejercicio. Al eliminarlo, el ejercicio se queda sin vídeo asociado."
              : "Se eliminará del historial del ejercicio. El vídeo visible para el alumno no cambia."
          }
          confirmLabel="Eliminar"
          destructive
          loading={remove.isPending}
          onConfirm={() => {
            if (!pendingDelete) return
            remove.mutate(pendingDelete.id, { onSettled: () => setPendingDelete(null) })
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
