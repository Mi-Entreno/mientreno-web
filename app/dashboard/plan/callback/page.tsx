import { PlanCallback } from "@/features/membership/components/plan-callback"

/** Mercado Pago's `back_url` for trainer memberships (`MEMBERSHIP_MP_TRAINER_BACK_URL`). */
export default function PlanCallbackPage() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <PlanCallback />
    </div>
  )
}
