"use client"

import { Award, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { emptyCertification, type Certification } from "../model/trainer-profile.model"

interface CertificationListEditorProps {
  value: Certification[]
  onChange: (certifications: Certification[]) => void
  disabled?: boolean
}

/**
 * Edits the `certifications` array both write endpoints accept.
 *
 * Only `name` is `@NotBlank` upstream; everything else is optional, so blank
 * rows are dropped by the mapper rather than blocked here. Dates are bound to
 * native date inputs, which speak the ISO format `CertificationRequestDTO`
 * expects — no conversion needed for this record, unlike `/api/user-detail`.
 */
export function CertificationListEditor({
  value,
  onChange,
  disabled,
}: CertificationListEditorProps) {
  function update(index: number, patch: Partial<Certification>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-4">
      {value.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <Award className="size-4" />
          </div>
          <p className="text-body text-muted-foreground">
            Aún no has añadido certificaciones. Aparecerán en tu perfil público.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {value.map((certification, index) => (
            <li
              key={certification.id ?? `new-${index}`}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-body font-medium">Certificación {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => remove(index)}
                  className="text-error-text focus-visible:text-error-text"
                >
                  <Trash2 className="size-4" />
                  Quitar
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor={`cert-name-${index}`}>
                    Nombre <span className="text-error-text">*</span>
                  </Label>
                  <Input
                    id={`cert-name-${index}`}
                    value={certification.name}
                    disabled={disabled}
                    placeholder="Entrenador Personal Nivel 3"
                    onChange={(event) => update(index, { name: event.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor={`cert-issuer-${index}`}>Entidad emisora</Label>
                  <Input
                    id={`cert-issuer-${index}`}
                    value={certification.issuedBy}
                    disabled={disabled}
                    placeholder="NSCA"
                    onChange={(event) => update(index, { issuedBy: event.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor={`cert-url-${index}`}>Enlace al certificado</Label>
                  <Input
                    id={`cert-url-${index}`}
                    type="url"
                    value={certification.certificateUrl ?? ""}
                    disabled={disabled}
                    placeholder="https://…"
                    onChange={(event) =>
                      update(index, { certificateUrl: event.target.value || null })
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor={`cert-issued-${index}`}>Fecha de emisión</Label>
                  <Input
                    id={`cert-issued-${index}`}
                    type="date"
                    value={certification.issuedAt ?? ""}
                    disabled={disabled}
                    onChange={(event) => update(index, { issuedAt: event.target.value || null })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor={`cert-expires-${index}`}>Fecha de caducidad</Label>
                  <Input
                    id={`cert-expires-${index}`}
                    type="date"
                    value={certification.expiresAt ?? ""}
                    disabled={disabled}
                    onChange={(event) => update(index, { expiresAt: event.target.value || null })}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => onChange([...value, emptyCertification()])}
        className="self-start"
      >
        <Plus className="size-4" />
        Añadir certificación
      </Button>
    </div>
  )
}
