"use client"

import { AlertTriangle, ArrowLeft, Check, Loader2, Send } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useDebouncedValue } from "@/core/hooks/use-debounced-value"
import { useMercadoPagoConnection } from "@/features/payments/hooks/use-mercado-pago"
import { isOperational } from "@/features/payments/model/mercado-pago.model"
import { StudentSearchPanel } from "@/features/student-search/components/student-search-panel"
import type { StudentCandidate } from "@/features/student-search/model/student-search.model"
import { billingSuffix, type SubscriptionPlan } from "@/features/subscription-plans/model/subscription-plan.model"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useSendInvitation } from "../hooks/use-plan-invitations"
import { MAX_MESSAGE_LENGTH } from "../model/plan-invitation.model"
import { PlanPicker } from "./plan-picker"

interface InviteStudentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-selects the plan when the wizard is opened from a plan card. */
  initialPlan?: SubscriptionPlan | null
}

export function InviteStudentSheet({ open, onOpenChange, initialPlan }: InviteStudentSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        {/* Keyed so reopening never resumes a half-finished invitation. */}
        {open && (
          <InviteWizard
            key={initialPlan?.id ?? "blank"}
            initialPlan={initialPlan ?? null}
            onDone={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

type Step = "student" | "plan" | "review"

const STEPS: { id: Step; label: string }[] = [
  { id: "student", label: "Alumno" },
  { id: "plan", label: "Plan" },
  { id: "review", label: "Enviar" },
]

/**
 * Three steps, in the order the trainer thinks in: who, what, and the note that
 * goes with it.
 *
 * The plan is chosen *after* the student, not before, because a trainer with
 * several plans usually picks the one that fits the person in front of them.
 * When the wizard is opened from a plan card that decision is already made, so
 * it starts on step one with the plan filled in.
 */
function InviteWizard({
  initialPlan,
  onDone,
}: {
  initialPlan: SubscriptionPlan | null
  onDone: () => void
}) {
  const [step, setStep] = useState<Step>("student")
  const [term, setTerm] = useState("")
  const debouncedTerm = useDebouncedValue(term, 300)

  const [student, setStudent] = useState<StudentCandidate | null>(null)
  const [plan, setPlan] = useState<SubscriptionPlan | null>(initialPlan)
  const [message, setMessage] = useState("")

  const send = useSendInvitation()

  function goNext() {
    if (step === "student") setStep("plan")
    else if (step === "plan") setStep("review")
  }

  function goBack() {
    if (step === "review") setStep("plan")
    else if (step === "plan") setStep("student")
  }

  const canContinue =
    (step === "student" && student !== null) ||
    (step === "plan" && plan !== null) ||
    step === "review"

  function handleSend() {
    if (!student || !plan) return

    send.mutate(
      { studentId: student.id, planId: plan.id, message },
      { onSuccess: onDone },
    )
  }

  return (
    <div className="flex h-full flex-col">
      <SheetHeader>
        <SheetTitle>Enviar un plan a un alumno</SheetTitle>
        <SheetDescription>
          El alumno recibirá una notificación y podrá aceptar o rechazar la propuesta.
        </SheetDescription>
      </SheetHeader>

      <Stepper current={step} />

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2">
        {step === "student" && (
          <StudentSearchPanel
            term={term}
            onTermChange={setTerm}
            debouncedTerm={debouncedTerm}
            selectedId={student?.id ?? null}
            onSelect={(candidate) => {
              setStudent(candidate)
              setStep("plan")
            }}
          />
        )}

        {step === "plan" && (
          <div className="flex flex-col gap-4">
            {student && <SelectedStudent student={student} onChange={() => setStep("student")} />}
            <PlanPicker
              selectedId={plan?.id ?? null}
              onSelect={(picked) => {
                setPlan(picked)
                setStep("review")
              }}
            />
          </div>
        )}

        {step === "review" && student && plan && (
          <ReviewStep
            student={student}
            plan={plan}
            message={message}
            disabled={send.isPending}
            onMessageChange={setMessage}
            onEditStudent={() => setStep("student")}
            onEditPlan={() => setStep("plan")}
          />
        )}
      </div>

      <SheetFooter>
        {step === "student" ? (
          <Button type="button" variant="outline" onClick={onDone} disabled={send.isPending}>
            Cancelar
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={goBack} disabled={send.isPending}>
            <ArrowLeft className="size-4" />
            Atrás
          </Button>
        )}

        {step === "review" ? (
          <Button type="button" onClick={handleSend} disabled={send.isPending}>
            {send.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Enviar invitación
          </Button>
        ) : (
          <Button type="button" onClick={goNext} disabled={!canContinue}>
            Continuar
          </Button>
        )}
      </SheetFooter>
    </div>
  )
}

function Stepper({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((step) => step.id === current)

  return (
    <ol className="flex items-center gap-2 px-4 pb-2" aria-label="Progreso">
      {STEPS.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex

        return (
          <li key={step.id} className="flex flex-1 items-center gap-2">
            <span
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-semibold",
                done && "bg-success text-success-foreground",
                active && "bg-primary text-primary-foreground",
                !done && !active && "bg-secondary text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span
              className={cn(
                "text-caption font-medium",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        )
      })}
    </ol>
  )
}

function SelectedStudent({
  student,
  onChange,
}: {
  student: StudentCandidate
  onChange: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
      <UserAvatar name={student.fullName} src={student.avatarUrl} className="size-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{student.fullName}</p>
        <p className="truncate text-caption text-muted-foreground">
          {student.email ?? "Sin correo"}
        </p>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onChange}>
        Cambiar
      </Button>
    </div>
  )
}

function ReviewStep({
  student,
  plan,
  message,
  disabled,
  onMessageChange,
  onEditStudent,
  onEditPlan,
}: {
  student: StudentCandidate
  plan: SubscriptionPlan
  message: string
  disabled: boolean
  onMessageChange: (value: string) => void
  onEditStudent: () => void
  onEditPlan: () => void
}) {
  const connection = useMercadoPagoConnection()

  // A paid plan the trainer cannot charge for is worth saying *before* the
  // invitation goes out: the student would accept and then find no way to pay.
  const needsPayments = plan.price > 0
  const paymentsReady = isOperational(connection.data)
  const warnAboutPayments = needsPayments && connection.isSuccess && !paymentsReady

  return (
    <div className="flex flex-col gap-5">
      <SelectedStudent student={student} onChange={onEditStudent} />

      <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{plan.name}</p>
          <p className="text-caption text-muted-foreground">
            {formatCurrency(plan.price)}
            {billingSuffix(plan.billingPeriod)}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onEditPlan}>
          Cambiar
        </Button>
      </div>

      {warnAboutPayments && (
        <p className="flex items-start gap-2 rounded-lg border border-warning bg-warning-surface p-3 text-body text-warning-text">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span className="text-pretty">
            Aún no has vinculado tu cuenta de Mercado Pago, así que el alumno no podrá pagar este
            plan al aceptarlo.{" "}
            <Link href="/dashboard/payments" className="font-medium underline underline-offset-4">
              Vincular ahora
            </Link>
          </span>
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="invitation-message">Mensaje para el alumno (opcional)</Label>
        <Textarea
          id="invitation-message"
          rows={4}
          value={message}
          disabled={disabled}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Hola, te dejo el plan del que hablamos. Cualquier duda, escríbeme."
          onChange={(event) => onMessageChange(event.target.value)}
        />
        <p className="text-caption text-muted-foreground">
          {message.length}/{MAX_MESSAGE_LENGTH}
        </p>
      </div>
    </div>
  )
}
