import { TrainerPlansScreen } from "@/features/training-plans/components/trainer-plans-screen"

export default function TrainingPlansPage() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-body text-muted-foreground text-pretty">
        El plan de entrenamiento actual de cada alumno. Un plan siempre pertenece a una
        suscripción, así que se crea y edita desde la ficha del alumno.
      </p>
      <TrainerPlansScreen />
    </div>
  )
}
