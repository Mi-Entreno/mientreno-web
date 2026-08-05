"use client"

import { Check, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { PASSWORD_RULES } from "../model/password"

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  error?: string
  disabled?: boolean
  autoComplete?: string
  /** Shows the live rule checklist. Off for "confirm" and sign-in fields. */
  showRules?: boolean
  onChange: (value: string) => void
}

/**
 * Password input with a visibility toggle and, optionally, the live checklist
 * of the backend's rules.
 *
 * Showing the rules as they are met matters here because the upstream message
 * ("El password debe contener al menos una mayúscula y un número") only arrives
 * after a failed round trip.
 */
export function PasswordField({
  id,
  label,
  value,
  error,
  disabled,
  autoComplete = "new-password",
  showRules,
  onChange,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className="pr-10"
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {error && <p className="text-body text-error-text">{error}</p>}

      {showRules && (
        <ul className="mt-1 flex flex-col gap-1">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(value)
            return (
              <li
                key={rule.id}
                className={cn(
                  "flex items-center gap-2 text-caption transition-colors",
                  met ? "text-primary-text" : "text-muted-foreground",
                )}
              >
                <Check className={cn("size-3.5 shrink-0", !met && "opacity-30")} />
                {rule.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
