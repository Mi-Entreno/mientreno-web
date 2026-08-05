"use client"

import { ImageOff } from "lucide-react"
import { useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toMediaUrl } from "@/core/http/media"

interface ImageUrlFieldProps {
  id: string
  label: string
  /** The raw backend value — never the proxied display URL. */
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  hint?: string
}

/**
 * Image field that takes a URL.
 *
 * Not an uploader, deliberately: the backend exposes exactly one multipart
 * endpoint — `POST /api/exercises/{id}/videos` — and nothing for avatars or
 * documents. `profileImageUrl` and `pathProfilePicture` are plain String
 * columns, so a URL is the only thing that can be stored today. Adding a real
 * uploader needs a generic upload endpoint upstream first.
 *
 * The preview runs the value through the media proxy, so a path already stored
 * by `LocalFileStorageService` renders correctly even though `/api/files/**`
 * requires a bearer token.
 */
export function ImageUrlField({
  id,
  label,
  value,
  onChange,
  disabled,
  hint,
}: ImageUrlFieldProps) {
  const [failed, setFailed] = useState(false)
  const preview = toMediaUrl(value)

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="flex items-center gap-4">
        <Avatar className="size-14 shrink-0">
          {preview && !failed ? (
            <AvatarImage src={preview} alt="" onError={() => setFailed(true)} />
          ) : null}
          <AvatarFallback>
            <ImageOff className="size-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        <Input
          id={id}
          type="url"
          value={value}
          disabled={disabled}
          placeholder="https://…"
          onChange={(event) => {
            setFailed(false)
            onChange(event.target.value)
          }}
        />
      </div>

      <p className="text-caption text-muted-foreground">
        {hint ?? "Pega la URL de tu imagen. La subida de archivos aún no está disponible en la API."}
      </p>
    </div>
  )
}
