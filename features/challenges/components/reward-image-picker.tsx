"use client"

import { Gift, ImagePlus, X } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_EXTENSIONS,
  MAX_IMAGE_BYTES,
  formatBytes,
  rejectImage,
  rejectionMessage,
} from "@/core/media/image"
import { cn } from "@/lib/utils"

export interface PickedImage {
  file: File
  /** `blob:` URL owned by whoever holds the state; it revokes it on replace and unmount. */
  preview: string
}

interface RewardImagePickerProps {
  /** What is already stored, already through `toMediaUrl`. */
  storedUrl: string | null
  picked: PickedImage | null
  onPick: (file: File | null) => void
  disabled?: boolean
}

/**
 * La foto del premio: es lo primero que ve el alumno en el catálogo.
 *
 * No sube nada al elegir, a diferencia de `ImageUploadField`: el endpoint
 * (`POST /api/brand/challenges/{id}/reward-image`) necesita el id del desafío,
 * y en un alta todavía no existe. El asistente guarda el archivo y lo sube
 * después de crear o guardar.
 *
 * "Quitar" sólo descarta lo elegido y no borra la ya guardada: el backend no
 * tiene cómo borrarla, y ofrecerlo sería prometer algo que no pasa.
 */
export function RewardImagePicker({ storedUrl, picked, onPick, disabled }: RewardImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [storedFailed, setStoredFailed] = useState(false)

  const preview = picked?.preview ?? (storedFailed ? null : storedUrl)

  function handleFile(file: File | undefined) {
    if (!file || disabled) return
    const rejection = rejectImage(file)
    if (rejection) {
      setProblem(rejectionMessage(rejection))
      return
    }
    setProblem(null)
    onPick(file)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="rewardImage">Foto del premio</Label>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          handleFile(event.dataTransfer.files?.[0])
        }}
        className={cn(
          "flex flex-wrap items-center gap-4 rounded-xl border border-dashed p-4 transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
          {preview ? (
            <Image
              src={preview}
              alt="Vista previa de la foto del premio"
              width={80}
              height={80}
              className="size-full object-cover"
              unoptimized
              onError={() => {
                if (!picked) setStoredFailed(true)
              }}
            />
          ) : (
            <Gift className="size-7 text-muted-foreground" />
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            id="rewardImage"
            type="file"
            // `accept` es una sugerencia que el sistema puede ignorar; `rejectImage` es el control real.
            accept={[...ALLOWED_IMAGE_TYPES, ...IMAGE_EXTENSIONS].join(",")}
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              handleFile(event.target.files?.[0])
              // Permite volver a elegir el mismo archivo después de un rechazo.
              event.target.value = ""
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              {preview ? "Cambiar foto" : "Subir foto"}
            </Button>
            {picked && (
              <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onPick(null)}>
                <X className="size-4" />
                Descartar
              </Button>
            )}
          </div>
          <p className="text-caption text-muted-foreground text-pretty">
            {picked
              ? "Se sube cuando guardes el desafío."
              : `La app la recorta según la pantalla: dejá el producto en el centro. ${IMAGE_EXTENSIONS.join(", ")}, hasta ${formatBytes(MAX_IMAGE_BYTES)}.`}
          </p>
        </div>
      </div>

      {problem && (
        <p role="alert" className="text-caption text-error-text text-pretty">
          {problem}
        </p>
      )}
    </div>
  )
}
