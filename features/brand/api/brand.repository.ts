import { apiFetch } from "@/core/http/client"

import type { BrandProfileDTO, CompleteBrandProfileInput } from "../dto/brand.dto"
import { toBrandProfile } from "../mappers/brand.mapper"
import type { BrandProfile, LatLng } from "../model/brand.model"

export interface GeocodeResult extends LatLng {
  /** Cómo entendió la dirección el geocodificador, para que el comercio lo confirme. */
  label: string
}

/**
 * La identidad del comercio, y nada más.
 *
 * El catálogo de productos y la bandeja de canjes se fueron a
 * `features/challenges`: una recompensa ahora vive dentro del desafío que la
 * entrega. Lo que queda acá es quién es el comercio y dónde se retira.
 *
 * Ningún método recibe `brandId`: el backend lo resuelve del JWT en cada
 * llamada. Mandarlo sería una afirmación sobre la identidad que el cliente no
 * está en posición de hacer.
 */
export const brandRepository = {
  // ── Profile ─────────────────────────────────────────────────────────────

  async profile(): Promise<BrandProfile> {
    return toBrandProfile(await apiFetch<BrandProfileDTO>("/api/brands/me"))
  },

  async updateProfile(input: Omit<CompleteBrandProfileInput, "firstName" | "lastName">): Promise<BrandProfile> {
    return toBrandProfile(
      await apiFetch<BrandProfileDTO>("/api/brands/me", { method: "PUT", body: input }),
    )
  },

  /**
   * Dirección → coordenadas, vía `app/api/geocode`.
   *
   * No pasa por `apiFetch` porque no le pega al backend. Devuelve null cuando no
   * encuentra la dirección: no es un error, es "ubicalo a mano en el mapa".
   */
  async geocode(address: string): Promise<GeocodeResult | null> {
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`)
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`geocode ${response.status}`)
    return (await response.json()) as GeocodeResult
  },

  async uploadLogo(file: File): Promise<BrandProfile> {
    const formData = new FormData()
    formData.append("file", file)
    return toBrandProfile(
      await apiFetch<BrandProfileDTO>("/api/brands/me/logo", { method: "POST", formData }),
    )
  },
}
