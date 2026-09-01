"use client"

import { MapPin, Store } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusPill } from "@/features/brand/components/status-pill"

import { useAdminBrands, useSetBrandStatus } from "../hooks/use-admin"
import type { AdminBrand } from "../model/admin.model"

/** Comercios registrados, con la acción de suspender. */
export function BrandsList() {
  const query = useAdminBrands()
  const [suspending, setSuspending] = useState<AdminBrand | null>(null)
  const setStatus = useSetBrandStatus()

  if (query.isError) {
    return <ErrorState error={query.error} context="load" onRetry={() => query.refetch()} />
  }

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  if ((query.data?.items.length ?? 0) === 0) {
    return (
      <EmptyState
        icon={Store}
        title="Todavía no hay comercios"
        description="Cuando un comercio se registre y complete su perfil, va a aparecer acá."
      />
    )
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {query.data?.items.map((brand) => (
          <li
            key={brand.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4"
          >
            <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
              {brand.logoUrl ? (
                <Image
                  src={brand.logoUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="size-full object-cover"
                  unoptimized
                />
              ) : (
                <Store className="size-5 text-muted-foreground" />
              )}
            </span>

            <div className="min-w-40 flex-1">
              <p className="font-medium">{brand.displayName}</p>
              {brand.legalName && (
                <p className="text-caption text-muted-foreground">{brand.legalName}</p>
              )}
              {brand.pickupAddress && (
                <p className="mt-0.5 flex items-center gap-1.5 text-caption text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {brand.pickupAddress}
                </p>
              )}
            </div>

            <StatusPill tone={brand.status === "ACTIVE" ? "success" : "error"}>
              {brand.status === "ACTIVE" ? "Activo" : "Suspendido"}
            </StatusPill>

            {brand.status === "ACTIVE" ? (
              <Button
                variant="outline"
                size="sm"
                disabled={setStatus.isPending}
                onClick={() => setSuspending(brand)}
              >
                Suspender
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={setStatus.isPending}
                onClick={() => setStatus.mutate({ brandId: brand.id, status: "ACTIVE" })}
              >
                Reactivar
              </Button>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={suspending !== null} onOpenChange={(next) => !next && setSuspending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspender {suspending?.displayName}</DialogTitle>
            <DialogDescription>
              Todos sus productos desaparecen del catálogo y no va a poder cargar más ni entrar a su
              panel. <strong>Los canjes ya hechos siguen en pie</strong>: alguien pagó mancuernas por
              ellos y hay que entregarlos o cancelarlos con motivo.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuspending(null)} disabled={setStatus.isPending}>
              Volver
            </Button>
            <Button
              variant="destructive"
              disabled={setStatus.isPending}
              onClick={() => {
                if (!suspending) return
                setStatus
                  .mutateAsync({ brandId: suspending.id, status: "SUSPENDED" })
                  .then(() => setSuspending(null))
                  .catch(() => {
                    // El hook ya mostró el toast.
                  })
              }}
            >
              Suspender
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
