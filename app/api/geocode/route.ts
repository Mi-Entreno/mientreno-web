import { NextResponse, type NextRequest } from "next/server"

import { isBrand } from "@/server/jwt"
import { readSession } from "@/server/session-store"

/**
 * `GET /api/geocode?q=<dirección>` — address to coordinates for the brand
 * profile's map.
 *
 * Server-side so the browser never talks to the geocoder directly and the
 * provider can be swapped (Google Places, Mapbox) without touching the screen.
 *
 * Nominatim's usage policy allows this shape and not autocomplete: one search
 * per explicit click, an identifying User-Agent, and at most one request per
 * second. The button in the profile only fires on click, so we stay inside it.
 *
 * Brand-only: without the session check this is an open proxy to a third party
 * running under our User-Agent.
 *
 * Answers `{ lat, lng, label }`, or 404 when nothing matched — which the
 * screen treats as "place it by hand", not as an error.
 */
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
const USER_AGENT = "MiEntreno-Panel/1.0 (panel de comercios)"

interface NominatimHit {
  lat: string
  lon: string
  display_name: string
}

export async function GET(request: NextRequest) {
  const session = await readSession()
  if (!session || !isBrand(session.claims)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? ""
  if (q.length < 4 || q.length > 250) {
    return NextResponse.json({ message: "Escribí la dirección completa" }, { status: 400 })
  }

  const url = new URL(NOMINATIM_URL)
  url.searchParams.set("q", q)
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("limit", "1")
  url.searchParams.set("countrycodes", "ar")
  url.searchParams.set("accept-language", "es")

  let hits: NominatimHit[]
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    })
    if (!response.ok) {
      return NextResponse.json({ message: "No pudimos buscar la dirección" }, { status: 502 })
    }
    hits = (await response.json()) as NominatimHit[]
  } catch {
    return NextResponse.json({ message: "No pudimos buscar la dirección" }, { status: 502 })
  }

  const hit = hits[0]
  if (!hit) return NextResponse.json({ message: "No encontramos esa dirección" }, { status: 404 })

  return NextResponse.json({ lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name })
}
