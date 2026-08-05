"use client"

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react"

import { cn } from "@/lib/utils"
import { OTP_LENGTH } from "../dto/auth.dto"

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  /** Fired when the last digit lands, so the form can submit itself. */
  onComplete?: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  autoFocus?: boolean
}

/**
 * Six separate digit boxes for the verification code.
 *
 * `EmailVerificationService.generateRandomCode` formats `%06d`, so the code is
 * always six digits — never letters, never a different length.
 *
 * Handles the three things people actually do with these: type straight
 * through, paste the whole code from the email, and backspace to correct.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  autoFocus,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  const digits = value.padEnd(OTP_LENGTH, " ").slice(0, OTP_LENGTH).split("")

  function commit(next: string) {
    const cleaned = next.replace(/\D/g, "").slice(0, OTP_LENGTH)
    onChange(cleaned)
    if (cleaned.length === OTP_LENGTH) onComplete?.(cleaned)
    return cleaned
  }

  function handleDigit(index: number, raw: string) {
    // Typing over a filled box, or a browser autofilling the whole code.
    const typed = raw.replace(/\D/g, "")
    if (!typed) return

    if (typed.length > 1) {
      const cleaned = commit(typed)
      refs.current[Math.min(cleaned.length, OTP_LENGTH - 1)]?.focus()
      return
    }

    const chars = value.padEnd(OTP_LENGTH, " ").split("")
    chars[index] = typed
    const cleaned = commit(chars.join("").replace(/ /g, ""))

    if (index < OTP_LENGTH - 1) refs.current[index + 1]?.focus()
    else if (cleaned.length === OTP_LENGTH) refs.current[index]?.blur()
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault()
      const chars = value.split("")

      if (chars[index]) {
        chars.splice(index, 1)
        onChange(chars.join(""))
      } else if (index > 0) {
        chars.splice(index - 1, 1)
        onChange(chars.join(""))
        refs.current[index - 1]?.focus()
      }
      return
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault()
      refs.current[index - 1]?.focus()
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault()
      refs.current[index + 1]?.focus()
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const cleaned = commit(event.clipboardData.getData("text"))
    refs.current[Math.min(cleaned.length, OTP_LENGTH - 1)]?.focus()
  }

  return (
    <div className="flex gap-2" role="group" aria-label="Código de verificación">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={OTP_LENGTH}
          value={digit.trim()}
          disabled={disabled}
          aria-label={`Dígito ${index + 1}`}
          onChange={(event) => handleDigit(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          className={cn(
            "h-14 w-full min-w-0 rounded-lg border bg-transparent text-center font-mono text-subtitle transition-colors",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid ? "border-destructive" : "border-input",
          )}
        />
      ))}
    </div>
  )
}
