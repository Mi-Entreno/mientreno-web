"use client"

import { User } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { initialsOf } from "@/lib/format"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  /** Full name, used for the initials. Blank or missing falls back to an icon. */
  name: string | null | undefined
  /**
   * Display URL, already routed through the media proxy by the mapper. Null
   * when the backend has no photo for this person — which is the common case.
   */
  src: string | null | undefined
  size?: "default" | "sm" | "lg"
  className?: string
  /** For the few places that restyle the initials (the sidebar's large one). */
  fallbackClassName?: string
}

/**
 * A person's avatar: their photo when the backend has one, their initials when
 * it does not.
 *
 * ## Why this exists
 *
 * Every call site used to write the same four lines by hand, and all of them
 * carried the same bug:
 *
 * ```tsx
 * <AvatarImage src={person.avatarUrl ?? "/placeholder.svg"} alt="" />
 * <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
 * ```
 *
 * `AvatarFallback` only renders while the image is *not* `loaded`. Pointing
 * `src` at a real file that exists means it always loads, so **the initials
 * never appeared** — a missing photo showed the generic grey placeholder, and
 * the fallback only ever fired for a URL that was present but broken. Exactly
 * backwards from what it was written to do.
 *
 * The fix is to not give the image a src at all when there is no photo: with no
 * `AvatarImage` mounted the loading status stays `idle`, and the fallback
 * renders. It also saves a pointless request per avatar.
 *
 * ## No name either
 *
 * Renders a person icon rather than a letter. The two hand-rolled `initialsOf`
 * helpers disagreed about what to invent for an unnamed person — `"T"` for
 * trainer in `lib/format`, `"A"` for alumno in the roster — and both were
 * guesses shown as if they were data. An icon says "we don't know" without
 * pretending.
 */
export function UserAvatar({
  name,
  src,
  size = "default",
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const trimmed = name?.trim()
  const hasName = Boolean(trimmed)

  return (
    <Avatar size={size} className={cn("shrink-0", className)}>
      {/*
        Rendered only when there is something to show. `alt` is empty because
        every call site puts the person's name in adjacent text; announcing it
        twice is noise for a screen reader.
      */}
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback className={fallbackClassName}>
        {hasName ? (
          initialsOf(trimmed)
        ) : (
          <User className="size-1/2" aria-label="Sin foto de perfil" />
        )}
      </AvatarFallback>
    </Avatar>
  )
}
