import { BrandsList } from "@/features/admin/components/brands-list"

/**
 * El padrón *es* la home de esta zona.
 *
 * Antes lo era la cola de moderación: los productos los cargaba un tercero y
 * alguien tenía que aprobarlos uno por uno. Con el desafío y su premio en manos
 * del comercio no hay nada que revisar de a uno, y lo que le queda a la
 * plataforma es decidir quién puede publicar.
 */
export default function AdminPage() {
  return <BrandsList />
}
