"use client"

import { ArrowRight, Mail, Phone } from "lucide-react"
import Link from "next/link"

import { ErrorState } from "@/components/dashboard/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserProfile } from "@/features/user/hooks/use-user"

/**
 * Read-only view of the account, with one way out to where it is edited.
 *
 * Settings used to carry a full copy of the personal-data form, so the same
 * fields were editable in two screens. What is left here is the part that
 * genuinely belongs to "account" and cannot be changed anyway:
 * `UserProfileUpdateRequestDTO` has no email or phone field.
 */
export function AccountCard() {
  const { data, isLoading, isError, error, refetch } = useUserProfile()

  if (isLoading) return <Skeleton className="h-32 w-full rounded-xl" />
  if (isError || !data) return <ErrorState error={error} onRetry={() => refetch()} inline />

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Row icon={Mail} label="Correo electrónico" value={data.email} />
        <Row icon={Phone} label="Teléfono" value={data.phone || "Sin teléfono"} />
      </dl>

      <p className="text-caption text-muted-foreground text-pretty">
        El correo y el teléfono no se pueden cambiar desde la aplicación. Escribinos si necesitás
        actualizarlos.
      </p>

      <Link
        href="/dashboard/profile"
        className="flex w-fit items-center gap-1.5 text-body font-medium text-primary-text underline-offset-4 hover:underline"
      >
        Editar mi perfil
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-caption text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 truncate text-body font-medium">{value}</dd>
      </div>
    </div>
  )
}
