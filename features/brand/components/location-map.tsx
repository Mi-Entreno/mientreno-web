"use client"

import "leaflet/dist/leaflet.css"

import L from "leaflet"
import { useEffect } from "react"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"

import type { LatLng } from "../model/brand.model"

/**
 * The map itself, split out so the profile loads it with `next/dynamic` and
 * `ssr: false`: Leaflet touches `window` at import time and breaks the server
 * render otherwise.
 *
 * The pin is a `divIcon` and not Leaflet's default marker, whose PNGs are
 * resolved relative to the CSS and 404 under the Next bundler.
 */
const pin = L.divIcon({
  className: "",
  html: '<span style="display:block;width:22px;height:22px;border-radius:9999px;background:var(--primary);border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export default function LocationMap({
  value,
  onChange,
  disabled,
}: {
  value: LatLng
  onChange: (value: LatLng) => void
  disabled?: boolean
}) {
  return (
    <MapContainer
      center={[value.lat, value.lng]}
      zoom={17}
      scrollWheelZoom={false}
      className="h-64 w-full rounded-lg border border-border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter value={value} />
      <ClickToPlace onChange={onChange} disabled={disabled} />
      <Marker
        position={[value.lat, value.lng]}
        icon={pin}
        draggable={!disabled}
        eventHandlers={{
          dragend: (event) => {
            const { lat, lng } = (event.target as L.Marker).getLatLng()
            onChange({ lat, lng })
          },
        }}
      />
    </MapContainer>
  )
}

/** `center` is only read on mount; a new geocoding result has to move the view by hand. */
function Recenter({ value }: { value: LatLng }) {
  const map = useMap()
  useEffect(() => {
    map.panTo([value.lat, value.lng])
  }, [map, value.lat, value.lng])
  return null
}

function ClickToPlace({ onChange, disabled }: { onChange: (value: LatLng) => void; disabled?: boolean }) {
  useMapEvents({
    click: (event) => {
      if (!disabled) onChange({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })
  return null
}
