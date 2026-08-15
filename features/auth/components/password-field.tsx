"use client"

import { Check, Eye, EyeOff, Lock } from "lucide-react"
import { useState, type ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { PASSWORD_RULES } from "../model/password"
import { AUTH_CONTROL, AuthFieldFrame } from "./auth-field"

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  error?: string
  disabled?: boolean
  autoComplete?: string
  /** Shows the live rule checklist. Off for "confirm" and sign-in fields. */
  showRules?: boolean
  /** Opposite the label — where the "forgot password" link lives. */
  action?: ReactNode
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
  action,
  onChange,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <AuthFieldFrame
      id={id}
      label={label}
      error={error}
      action={action}
      footer={showRules && <PasswordRules value={value} />}
    >
      <div className="relative">
        <Lock
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/field:text-primary-text"
        />

        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder="••••••••"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(AUTH_CONTROL, "pr-11 pl-10 tracking-[0.12em]")}
          onChange={(event) => onChange(event.target.value)}
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

    </AuthFieldFrame>
  )
}

/** The backend's policy as pills that fill in while the user types. */
function PasswordRules({ value }: { value: string }) {
  return (
    <ul className="mt-0.5 flex flex-wrap gap-1.5">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value)
        return (
          <li
            key={rule.id}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption transition-colors",
              met
                ? "border-primary/40 bg-success-surface font-medium text-primary-text"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {met ? (
              <Check className="size-3 shrink-0" />
            ) : (
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-foreground-disabled" />
            )}
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}
