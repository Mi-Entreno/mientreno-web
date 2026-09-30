"use client"

import { Loader2, MapPin } from "lucide-react"
import dynamic from "next/dynamic"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { brandRepository } from "../api/brand.repository"
import type { LatLng } from "../model/brand.model"

const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
})

/**
 * Where exactly the student picks up the reward.
 *
 * The address alone is not enough for "Más cercanos" in the student app, and
 * geocoding it silently would store whatever the geocoder guessed — a wrong
 * corner is worse than no pin, because the app would send people there. So the
 * brand geocodes on demand and confirms by looking at the map, dragging the pin
 * or clicking where it really is.
 *
 * `stale` means the address changed after the pin was placed: the pin is kept
 * on screen but not sent, and the backend clears the stored one.
 */
export function LocationField({
  address,
  value,
  stale,
  disabled,
  onChange,
}: {
  address: string
  value: LatLng | null
  stale: boolean
  disabled?: boolean
  onChange: (value: LatLng | null) => void
}) {
  const [searching, setSearching] = useState(false)
  const [label, setLabel] = useState<string | null>(null)

  async function locate() {
    if (address.trim().length < 4) {
      toast.error("Escribí primero la dirección de retiro.")
      return
    }
    setSearching(true)
    try {
      const result = await brandRepository.geocode(address)
      if (!result) {
        toast.error("No encontramos esa dirección. Revisala o ubicá el punto a mano en el mapa.")
        return
      }
      setLabel(result.label)
      onChange({ lat: result.lat, lng: result.lng })
    } catch {
      toast.error("No pudimos buscar la dirección. Intentá nuevamente en unos minutos.")
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" disabled={disabled || searching} onClick={locate}>
          {searching ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
          {value ? "Volver a ubicar" : "Ubicar en el mapa"}
        </Button>
        <p className="text-caption text-muted-foreground text-pretty">
          {status(value, stale)}
        </p>
      </div>

      {value && (
        <>
          <LocationMap value={value} onChange={onChange} disabled={disabled} />
          <p className="text-caption text-muted-foreground text-pretty">
            {label ? `Encontramos: ${label}. ` : ""}
            Si el punto no está justo en tu local, arrastralo o tocá el lugar correcto.
          </p>
        </>
      )}
    </div>
  )
}

function status(value: LatLng | null, stale: boolean): string {
  if (!value) return "Sin ubicar: tu local no aparece en “Más cercanos” de la app."
  if (stale) return "Cambiaste la dirección: volvé a ubicarla para que el punto coincida."
  return "Así aparece tu local en “Más cercanos” de la app."
}
