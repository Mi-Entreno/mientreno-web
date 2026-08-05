"use client"

import { Loader2, Upload } from "lucide-react"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUploadExerciseVideo } from "../hooks/use-exercises"
import {
  ALLOWED_VIDEO_TYPES,
  VIDEO_EXTENSIONS,
  rejectVideo,
  rejectionMessage,
} from "../model/exercise.model"

/**
 * Picks a video and uploads it with a progress bar.
 *
 * Files are checked before sending: an oversized one would otherwise transfer
 * up to 100 MB and come back as an opaque 500, since Spring's
 * `MaxUploadSizeExceededException` only reaches the generic `Exception` handler.
 */
export function VideoUploader({ exerciseId }: { exerciseId: number }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rejection, setRejection] = useState<string | null>(null)
  const upload = useUploadExerciseVideo(exerciseId)

  function handleFile(file: File | undefined) {
    if (!file) return

    const problem = rejectVideo(file)
    if (problem) {
      setRejection(rejectionMessage(problem))
      return
    }

    setRejection(null)
    upload.mutate(file)
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        // `accept` is a hint the OS may ignore; `rejectVideo` is the real check.
        accept={[...ALLOWED_VIDEO_TYPES, ...VIDEO_EXTENSIONS].join(",")}
        className="sr-only"
        onChange={(event) => {
          handleFile(event.target.files?.[0])
          // Allow re-picking the same file after a rejection.
          event.target.value = ""
        }}
      />

      <Button
        type="button"
        variant="outline"
        disabled={upload.isPending}
        className="self-start"
        onClick={() => inputRef.current?.click()}
      >
        {upload.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        {upload.isPending ? `Subiendo… ${upload.progress}%` : "Subir vídeo"}
      </Button>

      {upload.isPending && (
        <div
          role="progressbar"
          aria-valuenow={upload.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso de subida"
          className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
        >
          <div
            className={cn("h-full bg-primary transition-[width] duration-200")}
            style={{ width: `${upload.progress}%` }}
          />
        </div>
      )}

      {rejection && <p className="text-body text-error-text">{rejection}</p>}

      <p className="text-caption text-muted-foreground text-pretty">
        Formatos admitidos: {VIDEO_EXTENSIONS.join(", ")}. Máximo 100 MB. El último vídeo subido
        pasa a ser el que ve el alumno en el ejercicio.
      </p>
    </div>
  )
}
