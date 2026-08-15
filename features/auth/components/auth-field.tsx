import { AlertCircle, type LucideIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * Every control on the auth screens shares this height and surface.
 *
 * Taller than the 32 px the kit uses inside the dashboard: these forms are the
 * whole page rather than one row of a dense table, and a 44 px target is what
 * keeps them comfortable on a phone. Exported so the password and code inputs
 * cannot drift away from the plain ones.
 */
export const AUTH_CONTROL =
  "h-11 rounded-lg border-input bg-card text-body-lg shadow-[0_1px_2px_rgba(8,19,36,0.04)] placeholder:text-foreground-disabled"

/** Label styling, shared with the fields that build their own control. */
const AUTH_LABEL = "text-caption font-semibold tracking-wide text-foreground-secondary uppercase"

export function FieldError({ id, message }: { id?: string; message: string }) {
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-caption font-medium text-error-text">
      <AlertCircle className="mt-px size-3.5 shrink-0" />
      {message}
    </p>
  )
}

interface AuthFieldFrameProps {
  id: string
  label: string
  error?: string
  hint?: string
  /** Sits opposite the label — the "forgot password" link, a counter, a badge. */
  action?: ReactNode
  /** Rendered under the message, so an error stays next to the control. */
  footer?: ReactNode
  children: ReactNode
}

/**
 * Label row, control slot and message, for fields that render their own input
 * (password, verification code). `AuthField` is the plain-input shortcut.
 */
export function AuthFieldFrame({
  id,
  label,
  error,
  hint,
  action,
  footer,
  children,
}: AuthFieldFrameProps) {
  return (
    <div className="group/field flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className={AUTH_LABEL}>
          {label}
        </Label>
        {action}
      </div>

      {children}

      {error ? (
        <FieldError id={`${id}-error`} message={error} />
      ) : hint ? (
        <p id={`${id}-hint`} className="text-caption text-muted-foreground text-pretty">
          {hint}
        </p>
      ) : null}

      {footer}
    </div>
  )
}

interface AuthFieldProps extends Omit<ComponentProps<"input">, "id"> {
  id: string
  label: string
  /** Leading glyph. Also the field's quickest visual identifier when scanning. */
  icon?: LucideIcon
  error?: string
  hint?: string
  action?: ReactNode
  /** Rendered against the trailing edge, inside the control. */
  trailing?: ReactNode
}

/**
 * Labelled text input for the auth screens: icon, focus treatment and error
 * wiring in one place, so four forms stop repeating the same six lines.
 */
export function AuthField({
  id,
  label,
  icon: Icon,
  error,
  hint,
  action,
  trailing,
  className,
  ...props
}: AuthFieldProps) {
  return (
    <AuthFieldFrame id={id} label={label} error={error} hint={hint} action={action}>
      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/field:text-primary-text"
          />
        )}

        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(AUTH_CONTROL, Icon && "pl-10", trailing && "pr-11", className)}
          {...props}
        />

        {trailing}
      </div>
    </AuthFieldFrame>
  )
}
