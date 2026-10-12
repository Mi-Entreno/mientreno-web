"use client"

import { useState } from "react"

import { Input } from "@/components/ui/input"
import { parseWhole } from "../model/economy-admin.model"

interface WholeInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value: number | null
  onValueChange: (value: number | null) => void
  /** Empty means null ("sin tope"). Without it, an empty field is just invalid. */
  allowEmpty?: boolean
  min?: number
}

/**
 * A whole-number field that keeps what the admin is typing.
 *
 * Bound straight to a number, clearing the field to type "15" would snap it to
 * 0 on the first keystroke. The text lives here and only a valid number reaches
 * the draft; an invalid one marks the field and leaves the draft as it was.
 */
export function WholeInput({ value, onValueChange, allowEmpty = false, min, ...props }: WholeInputProps) {
  const [text, setText] = useState(value === null ? "" : String(value))
  const [seen, setSeen] = useState(value)

  // An outside change (discard, restore) has to show up in the field. Adjusted
  // while rendering, not in an effect, so the field never paints the stale text.
  if (value !== seen) {
    setSeen(value)
    const typed = parseWhole(text, allowEmpty)
    if (!typed.ok || typed.value !== value) setText(value === null ? "" : String(value))
  }

  const parsed = parseWhole(text, allowEmpty)
  const invalid = !parsed.ok || (min !== undefined && parsed.value !== null && parsed.value < min)

  return (
    <Input
      inputMode="numeric"
      {...props}
      value={text}
      aria-invalid={invalid || undefined}
      onChange={(event) => {
        setText(event.target.value)
        const next = parseWhole(event.target.value, allowEmpty)
        if (next.ok) onValueChange(next.value)
      }}
    />
  )
}
