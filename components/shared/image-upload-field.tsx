"use client"

import { ImageUp, Loader2, Trash2, UserRound } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toMediaUrl } from "@/core/http/media"
import { userMessage } from "@/core/http/user-message"
import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_EXTENSIONS,
  formatBytes,
  MAX_IMAGE_BYTES,
  rejectImage,
  rejectionMessage,
} from "@/core/media/image"
import { uploadAvatar } from "@/core/media/upload-avatar"
import { cn } from "@/lib/utils"

interface ImageUploadFieldProps {
  id: string
  label: string
  /** The raw backend value — never the proxied display URL. */
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  hint?: string
}

/**
 * Profile photo: pick a file, see it immediately, upload it.
 *
 * Replaces the URL box this project shipped with, which asked a trainer to host
 * their own photo somewhere and paste a link — something almost nobody can
 * actually do from a phone.
 *
 * Three details worth keeping:
 *
 *  - The preview is the local file (`createObjectURL`) while the upload is in
 *    flight, and the stored URL afterwards. The photo appears the instant it is
 *    chosen, so a slow upload never looks like nothing happened.
 *  - `capture="user"` makes a phone offer the front camera alongside the
 *    gallery. On a desktop the native dialog already reaches iCloud and Phone
 *    Link, so "from another device" needs no extra affordance.
 *  - Dropping a file works too, because dragging a photo onto a form is the
 *    obvious gesture on a laptop.
 */
export function ImageUploadField({
  id,
  label,
  value,
  onChange,
  disabled,
  hint,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [pending, setPending] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [failedToLoad, setFailedToLoad] = useState(false)
  const [dragging, setDragging] = useState(false)

  // An object URL is a document-lifetime handle; leaking one per pick would
  // pin every chosen file in memory for as long as the tab is open.
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  const stored = toMediaUrl(value)
  const preview = localPreview ?? (failedToLoad ? null : stored)

  async function handleFile(file: File | undefined) {
    if (!file || disabled) return

    const rejection = rejectImage(file)
    if (rejection) {
      setProblem(rejectionMessage(rejection))
      return
    }

    setProblem(null)
    setFailedToLoad(false)
    setProgress(0)
    setPending(true)

    const objectUrl = URL.createObjectURL(file)
    setLocalPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return objectUrl
    })

    try {
      const url = await uploadAvatar(file, setProgress)
      onChange(url)
    } catch (error) {
      setProblem(userMessage(error, "upload"))
      // Drop the optimistic preview: keeping it would show a photo that is not
      // saved anywhere and will vanish on the next load.
      setLocalPreview((current) => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
    } finally {
      setPending(false)
    }
  }

  function clear() {
    setLocalPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    setProblem(null)
    setFailedToLoad(false)
    onChange("")
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled && !pending) setDragging(true)
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
        <Avatar className="size-16 shrink-0">
          {preview ? (
            <AvatarImage src={preview} alt="" onError={() => setFailedToLoad(true)} />
          ) : null}
          <AvatarFallback>
            <UserRound className="size-6 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            // `accept` is a hint the OS may ignore; `rejectImage` is the real check.
            accept={[...ALLOWED_IMAGE_TYPES, ...IMAGE_EXTENSIONS].join(",")}
            capture="user"
            className="sr-only"
            disabled={disabled || pending}
            onChange={(event) => {
              handleFile(event.target.files?.[0])
              // Allows re-picking the same file after a rejection.
              event.target.value = ""
            }}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || pending}
              onClick={() => inputRef.current?.click()}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImageUp className="size-4" />
              )}
              {pending ? `Subiendo… ${progress}%` : value ? "Cambiar foto" : "Subir foto"}
            </Button>

            {value && !pending && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={clear}
                className="text-error-text focus-visible:text-error-text"
              >
                <Trash2 className="size-4" />
                Quitar
              </Button>
            )}
          </div>

          {pending && (
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso de la subida"
              className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
            >
              <div
                className="h-full bg-primary transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <p className="text-caption text-muted-foreground text-pretty">
            {hint ??
              `Arrastrá una imagen o elegila desde tu dispositivo. ${IMAGE_EXTENSIONS.join(", ")}, hasta ${formatBytes(MAX_IMAGE_BYTES)}.`}
          </p>
        </div>
      </div>

      {problem && (
        <p role="alert" className="text-body text-error-text text-pretty">
          {problem}
        </p>
      )}
    </div>
  )
}
