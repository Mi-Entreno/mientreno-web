import { ModerationQueue } from "@/features/admin/components/moderation-queue"

/**
 * La cola *es* la home de esta zona: un admin entra a resolver lo que está
 * esperando, no a leer un resumen de ello.
 */
export default function AdminPage() {
  return <ModerationQueue />
}
