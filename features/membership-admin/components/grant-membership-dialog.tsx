"use client"

import { Gift } from "lucide-react"
import { useState } from "react"

import { OptionGroup } from "@/components/shared/option-group"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAdminMembershipPlans, useGrantMembership } from "../hooks/use-membership-admin"
import { grantEndsAt } from "../model/membership-admin.model"

const DURATIONS = [
  { value: "30", label: "30 días" },
  { value: "90", label: "3 meses" },
  { value: "365", label: "1 año" },
] as const

/**
 * Give someone a paid plan without charging: testers before launch, support
 * cases, press. The backend refuses it if the plan is for another audience or
 * the account already has a plan in progress, and says so.
 */
export function GrantMembershipDialog() {
  const plans = useAdminMembershipPlans()
  const grant = useGrantMembership()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [planCode, setPlanCode] = useState<string | null>(null)
  const [days, setDays] = useState<(typeof DURATIONS)[number]["value"]>("30")
  const [reason, setReason] = useState("")

  const paidPlans = (plans.data ?? []).filter((plan) => !plan.defaultPlan)
  const valid = email.trim().includes("@") && planCode !== null && reason.trim().length > 0

  const close = () => {
    setOpen(false)
    setEmail("")
    setReason("")
  }

  return (
    <>
      <Button variant="outline" size="sm" className="w-fit" onClick={() => setOpen(true)}>
        <Gift className="size-4" />
        Otorgar cortesía
      </Button>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Otorgar un plan de cortesía</DialogTitle>
            <DialogDescription>Sin cobro y con fecha de fin. Al vencer, la cuenta vuelve al gratuito.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grant-email">Email de la cuenta</Label>
            <Input id="grant-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <OptionGroup
            name="grant-plan"
            label="Plan"
            options={paidPlans.map((plan) => ({ value: plan.code, label: plan.name, description: plan.code }))}
            value={planCode}
            onChange={setPlanCode}
          />
          <OptionGroup name="grant-duration" label="Duración" options={DURATIONS} value={days} onChange={setDays} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grant-reason">Motivo</Label>
            <Input
              id="grant-reason"
              maxLength={200}
              placeholder="Tester de lanzamiento"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={!valid || grant.isPending}
              onClick={() =>
                planCode &&
                grant.mutate(
                  { email: email.trim(), planCode, endsAt: grantEndsAt(Number(days)), reason: reason.trim() },
                  { onSuccess: close },
                )
              }
            >
              Otorgar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
