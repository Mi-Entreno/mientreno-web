"use client"

import Link from "next/link"
import type { ReactNode } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { legalDocument } from "@/components/legal/documents"
import { FieldError } from "./auth-field"

const TERMS = legalDocument("terminos")
const PRIVACY = legalDocument("privacidad")
const COOKIES = legalDocument("cookies")

/**
 * Los tres enlaces abren en pestaña nueva y cortan la propagación del click.
 *
 * Lo primero porque leer un documento legal no puede costarle al usuario el
 * formulario a medio llenar; lo segundo porque el texto vive dentro del
 * `<label>` del checkbox y, sin `stopPropagation`, ir a los Términos también
 * marcaba —o desmarcaba— la casilla al volver.
 */
export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="font-semibold text-primary-text underline underline-offset-4 hover:text-foreground"
    >
      {children}
    </Link>
  )
}

interface LegalConsentFieldProps {
  id?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  error?: string
}

/**
 * La casilla de aceptación del registro, común a entrenadores y comercios.
 *
 * Las cookies se mencionan pero no se "aceptan": la única que instalamos es
 * `trainer_session`, estrictamente necesaria, y la propia política de cookies
 * explica por qué no pedimos consentimiento para ella. Prometer lo contrario
 * acá dejaría los dos textos contradiciéndose.
 */
export function LegalConsentField({
  id = "acceptedLegal",
  checked,
  onCheckedChange,
  disabled,
  error,
}: LegalConsentFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="flex items-start gap-2.5 text-body text-foreground-secondary">
        <Checkbox
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onCheckedChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5"
        />

        <span className="text-pretty">
          Acepto los <LegalLink href={TERMS.href}>{TERMS.title.toLowerCase()}</LegalLink> y la{" "}
          <LegalLink href={PRIVACY.href}>{PRIVACY.title.toLowerCase()}</LegalLink>, y leí la{" "}
          <LegalLink href={COOKIES.href}>{COOKIES.title.toLowerCase()}</LegalLink>.
        </span>
      </label>

      {error && <FieldError id={`${id}-error`} message={error} />}
    </div>
  )
}
