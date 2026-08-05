"use client"

import { cn } from "@/lib/utils"

export interface Option<T extends string> {
  value: T
  label: string
  description?: string
}

interface OptionGroupProps<T extends string> {
  options: readonly Option<T>[]
  /**
   * Plain `string` rather than `T`: the backing columns are unconstrained
   * strings, so a stored value may not be one of the offered options. Such a
   * value simply renders as no selection instead of failing to type-check.
   */
  value: string | null
  onChange: (value: T) => void
  disabled?: boolean
  name: string
  /** Accessible name for the group. */
  label: string
}

/**
 * Segmented single-choice control for small enum fields.
 *
 * Built on native radio inputs rather than the Select primitive: with four or
 * fewer options every choice stays visible, keyboard and screen-reader
 * behaviour comes for free, and there is no popover to manage inside a form.
 */
export function OptionGroup<T extends string>({
  options,
  value,
  onChange,
  disabled,
  name,
  label,
}: OptionGroupProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const checked = value === option.value
        const id = `${name}-${option.value}`

        return (
          <label
            key={option.value}
            htmlFor={id}
            className={cn(
              "flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2 text-body transition-colors",
              "focus-within:ring-3 focus-within:ring-ring/50",
              checked
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-transparent text-muted-foreground hover:border-input",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              id={id}
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="font-medium">{option.label}</span>
            {option.description && (
              <span className="text-caption text-muted-foreground">{option.description}</span>
            )}
          </label>
        )
      })}
    </div>
  )
}

/**
 * `gender` is an unconstrained String column upstream. These values match what
 * the Expo client already writes, so both apps stay consistent.
 */
export const GENDER_OPTIONS = [
  { value: "male", label: "Hombre" },
  { value: "female", label: "Mujer" },
  { value: "other", label: "Otro" },
  { value: "prefer_not_say", label: "Prefiero no decirlo" },
] as const

export type GenderValue = (typeof GENDER_OPTIONS)[number]["value"]
