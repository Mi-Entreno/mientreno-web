"use client"

import { AlertTriangle, Gift, PackageCheck, PackageX } from "lucide-react"
import Link from "next/link"

import { ErrorState } from "@/components/dashboard/error-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useBrandProducts, useBrandRedemptions } from "../hooks/use-brand"
import { isLive } from "../model/brand.model"

/**
 * Merchant home.
 *
 * Answers the three questions a merchant opens the panel with: is anything
 * waiting for me, is anything stuck in review, and is anything out of stock.
 * Everything shown is actionable — a count that leads nowhere is decoration.
 */
export function BrandOverview() {
  const products = useBrandProducts()
  const pending = useBrandRedemptions("PENDING")

  if (products.isError) {
    return <ErrorState error={products.error} context="load" onRetry={() => products.refetch()} />
  }

  const items = products.data?.items ?? []
  const inReview = items.filter((p) => p.approvalStatus === "PENDING_APPROVAL").length
  const rejected = items.filter((p) => p.approvalStatus === "REJECTED").length
  const outOfStock = items.filter((p) => p.approvalStatus === "APPROVED" && p.stock <= 0).length
  const live = items.filter(isLive).length

  const loading = products.isLoading || pending.isLoading

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={PackageCheck}
          label="Canjes para preparar"
          value={pending.data?.totalItems ?? 0}
          href="/comercio/canjes"
          loading={loading}
          highlight
        />
        <StatCard
          icon={Gift}
          label="Productos publicados"
          value={live}
          href="/comercio/productos"
          loading={loading}
        />
        <StatCard
          icon={AlertTriangle}
          label="En revisión"
          value={inReview}
          href="/comercio/productos"
          loading={loading}
        />
        <StatCard
          icon={PackageX}
          label="Sin stock"
          value={outOfStock}
          href="/comercio/productos"
          loading={loading}
        />
      </div>

      {rejected > 0 && (
        <Card className="border-error/30 bg-error-surface/40">
          <CardHeader>
            <CardTitle className="text-body-lg">
              {rejected === 1
                ? "Tenés un producto rechazado"
                : `Tenés ${rejected} productos rechazados`}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
            <p className="text-body text-muted-foreground text-pretty">
              Cada uno tiene el motivo del rechazo. Corregilo y volvé a enviarlo a revisión.
            </p>
            <Link
              href="/comercio/productos?estado=REJECTED"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Ver cuáles
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-body-lg">Cómo funciona</CardTitle>
        </CardHeader>
        <CardContent className="text-body text-muted-foreground">
          <ol className="flex list-decimal flex-col gap-1.5 pl-4">
            <li>Cargás un producto con su foto, su costo en repes y su stock.</li>
            <li>Lo enviás a revisión. Cuando lo aprobamos, aparece en el catálogo de los alumnos.</li>
            <li>Un alumno lo canjea y el canje te llega acá. Lo marcás listo y después entregado.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  loading,
  highlight,
}: {
  icon: typeof Gift
  label: string
  value: number
  href: string
  loading: boolean
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/40",
        // The queue gets the accent: it is the only tile with work behind it.
        highlight && value > 0 && "border-primary/40 bg-primary/5",
      )}
    >
      <span className="flex items-center gap-2 text-body text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </span>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-12" />
      ) : (
        <p className="mt-2 font-heading text-display tabular-nums">{value}</p>
      )}
    </Link>
  )
}
