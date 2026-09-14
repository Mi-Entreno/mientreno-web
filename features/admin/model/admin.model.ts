/**
 * El padrón de comercios, que es todo lo que queda de la zona de administración.
 *
 * Acá vivían el producto en revisión y el desafío de la plataforma, con su
 * checklist de moderación y el cálculo de cuántas repes ponía en circulación
 * cada aprobación. Nada de eso existe: el premio sale del stock del comercio, no
 * de una moneda que la plataforma acuñaba.
 */

export interface AdminBrand {
  id: number
  displayName: string
  legalName: string | null
  taxId: string | null
  logoUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  pickupAddress: string | null
  status: "ACTIVE" | "SUSPENDED"
  createdAt: string
}

/** ¿Puede publicar desafíos ahora mismo? */
export function canPublish(brand: AdminBrand): boolean {
  return brand.status === "ACTIVE"
}

/**
 * Sin dirección de retiro, un premio es algo que el alumno no sabe dónde buscar.
 *
 * El perfil la exige al completarse, así que esto marca comercios viejos o
 * incompletos antes de que publiquen.
 */
export function isMissingPickupAddress(brand: AdminBrand): boolean {
  return !brand.pickupAddress || brand.pickupAddress.trim() === ""
}
